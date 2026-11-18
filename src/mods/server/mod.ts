import { Packed } from "@/libs/packed/mod.ts";
import { RpcPaymentError } from "@/mods/errors/mod.ts";
import { Readable, Writable } from "@hazae41/binary";
import { RpcErr, RpcError, RpcInvalidParamsError, RpcMethodNotFoundError, RpcOk, RpcRequest, RpcRequestInit, RpcResponse, type RpcResponseInit } from "@hazae41/jsonrpc";
import { Mutex } from "@hazae41/mutex";
import { connect } from '@tursodatabase/database';
import { existsSync, mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export async function serve(storage: string) {
  mkdirSync(dirname(storage), { recursive: true })

  const database = await connect(join(storage, "database.db"))

  await database.exec(`CREATE TABLE IF NOT EXISTS events (
    nonce INTEGER PRIMARY KEY AUTOINCREMENT,

    moment INTEGER NOT NULL,

    module TEXT NOT NULL,
    
    key BLOB NOT NULL,

    value BLOB NOT NULL
  );`)

  await database.exec(`CREATE TABLE IF NOT EXISTS moments (
    nonce INTEGER PRIMARY KEY AUTOINCREMENT,
    
    epoch INTEGER NOT NULL,

    module TEXT NOT NULL,

    method TEXT NOT NULL,
    
    params BLOB NOT NULL
  );`)

  await database.close()

  mkdirSync(join(storage, "scripts"), { recursive: true })

  const url = new URL(import.meta.resolve("../worker/bin.ts"))

  url.searchParams.set("storage", storage)

  const worker = new Mutex(new Worker(url, { type: "module" }))

  const efforts = new Set<string>()

  const route = async (request: RpcRequestInit) => {
    using stack = new DisposableStack()

    if (request.method === "bob_create") {
      const [codeAsHex, saltAsHex, effortAsHex] = request.params as [string, string, string]

      if (typeof codeAsHex !== "string")
        throw new RpcInvalidParamsError()

      const codeAsRaw = Uint8Array.fromHex(codeAsHex)

      if (typeof saltAsHex !== "string")
        throw new RpcInvalidParamsError()

      const saltAsRaw = Uint8Array.fromHex(saltAsHex)

      if (typeof effortAsHex !== "string")
        throw new RpcInvalidParamsError()
      if (effortAsHex.length !== 64)
        throw new RpcInvalidParamsError()
      if (efforts.has(effortAsHex))
        throw new RpcInvalidParamsError()

      efforts.add(effortAsHex)

      const effortAsRaw = Uint8Array.fromHex(effortAsHex)

      const sparksAsBigInt = (2n ** 256n) / BigInt("0x" + new Uint8Array(await crypto.subtle.digest("SHA-256", effortAsRaw)).toHex())

      if (sparksAsBigInt < (codeAsRaw.length + saltAsRaw.length))
        throw new RpcPaymentError()

      const saltAsValue = Readable.readFromBytes(Packed, saltAsRaw)

      const packAsRaw = Writable.writeToBytes(new Packed([codeAsRaw, saltAsValue]))

      const digestOfCodeAsRaw = new Uint8Array(await crypto.subtle.digest("SHA-256", codeAsRaw))
      const digestOfPackAsRaw = new Uint8Array(await crypto.subtle.digest("SHA-256", packAsRaw))

      const digestOfCodeAsHex = digestOfCodeAsRaw.toHex()
      const digestOfPackAsHex = digestOfPackAsRaw.toHex()

      if (!existsSync(join(storage, "scripts", `${digestOfCodeAsHex}.wasm`)))
        writeFileSync(join(storage, "scripts", `${digestOfCodeAsHex}.wasm`), codeAsRaw)

      if (!existsSync(join(storage, "scripts", `${digestOfPackAsHex}.wasm`)))
        symlinkSync(`./${digestOfCodeAsHex}.wasm`, join(storage, "scripts", `${digestOfPackAsHex}.wasm`))

      return digestOfPackAsHex
    }

    if (request.method === "bob_execute") {
      using stack = new DisposableStack()

      const [module, method, paramsAsHex, effortAsHex] = request.params as [string, string, string, string]

      if (typeof module !== "string")
        throw new RpcInvalidParamsError()
      if (typeof method !== "string")
        throw new RpcInvalidParamsError()

      if (typeof paramsAsHex !== "string")
        throw new RpcInvalidParamsError()

      const paramsAsRaw = Uint8Array.fromHex(paramsAsHex)

      if (typeof effortAsHex !== "string")
        throw new RpcInvalidParamsError()
      if (effortAsHex.length !== 64)
        throw new RpcInvalidParamsError()
      if (efforts.has(effortAsHex))
        throw new RpcInvalidParamsError()

      efforts.add(effortAsHex)

      const effortAsRaw = Uint8Array.fromHex(effortAsHex)

      const sparksAsBigInt = (2n ** 256n) / BigInt("0x" + new Uint8Array(await crypto.subtle.digest("SHA-256", effortAsRaw)).toHex())

      const future = Promise.withResolvers<Uint8Array<ArrayBuffer>>()

      const aborter = new AbortController()
      stack.defer(() => aborter.abort())

      stack.use(await worker.lockOrWait())

      worker.get().addEventListener("message", (event: MessageEvent<RpcResponseInit<Uint8Array<ArrayBuffer>>>) => {
        RpcResponse.from(event.data).inspectSync(future.resolve).inspectErrSync(console.log).inspectErrSync(future.reject)
      }, { signal: aborter.signal })

      worker.get().addEventListener("error", (event: ErrorEvent) => {
        future.reject(event.error)
      }, { signal: aborter.signal })

      worker.get().addEventListener("messageerror", (event: MessageEvent) => {
        future.reject(event.data)
      }, { signal: aborter.signal })

      AbortSignal.timeout(1000).addEventListener("abort", (reason) => {
        future.reject(reason)
      }, { signal: aborter.signal })

      worker.get().postMessage(new RpcRequest(null, "execute", [module, method, paramsAsRaw, sparksAsBigInt]))

      const resultAsRaw = await future.promise
      const resultAsHex = resultAsRaw.toHex()

      return resultAsHex
    }

    if (request.method === "bob_simulate") {
      const [module, method, paramsAsHex, effortAsHex] = request.params as [string, string, string, string]

      if (typeof module !== "string")
        throw new RpcInvalidParamsError()
      if (typeof method !== "string")
        throw new RpcInvalidParamsError()

      if (typeof paramsAsHex !== "string")
        throw new RpcInvalidParamsError()

      const paramsAsRaw = Uint8Array.fromHex(paramsAsHex)

      if (typeof effortAsHex !== "string")
        throw new RpcInvalidParamsError()
      if (effortAsHex.length !== 64)
        throw new RpcInvalidParamsError()
      if (efforts.has(effortAsHex))
        throw new RpcInvalidParamsError()

      efforts.add(effortAsHex)

      const effortAsRaw = Uint8Array.fromHex(effortAsHex)

      const sparksAsBigInt = (2n ** 256n) / BigInt("0x" + new Uint8Array(await crypto.subtle.digest("SHA-256", effortAsRaw)).toHex())

      const future = Promise.withResolvers<Uint8Array<ArrayBuffer>>()

      const aborter = new AbortController()
      stack.defer(() => aborter.abort())

      stack.use(await worker.lockOrWait())

      worker.get().addEventListener("message", (event: MessageEvent<RpcResponseInit<Uint8Array<ArrayBuffer>>>) => {
        RpcResponse.from(event.data).inspectSync(future.resolve).inspectErrSync(future.reject)
      }, { signal: aborter.signal })

      worker.get().addEventListener("error", (event: ErrorEvent) => {
        future.reject(event.error)
      }, { signal: aborter.signal })

      worker.get().addEventListener("messageerror", (event: MessageEvent) => {
        future.reject(event.data)
      }, { signal: aborter.signal })

      AbortSignal.timeout(1000).addEventListener("abort", (reason) => {
        future.reject(reason)
      }, { signal: aborter.signal })

      worker.get().postMessage(new RpcRequest(null, "simulate", [module, method, paramsAsRaw, sparksAsBigInt]))

      const resultAsRaw = await future.promise
      const resultAsHex = resultAsRaw.toHex()

      return resultAsHex
    }

    throw new RpcMethodNotFoundError()
  }

  return async (request: RpcRequestInit) => {
    try {
      return new RpcOk(request.id, await route(request))
    } catch (cause: unknown) {
      return new RpcErr(request.id, RpcError.rewrap(cause))
    }
  }
}