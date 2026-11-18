// deno-lint-ignore-file no-unused-vars require-await no-cond-assign

import { Packed } from "@/libs/packed/mod.ts";
import { RpcPaymentError } from "@/mods/errors/mod.ts";
import { Readable, Writable } from "@hazae41/binary";
import { RpcErr, RpcError, RpcInternalError, RpcInvalidParamsError, RpcInvalidRequestError, RpcMethodNotFoundError, RpcOk, RpcParseError, RpcRequest, RpcResponse, type RpcResponseInit } from "@hazae41/jsonrpc";
import { Mutex } from "@hazae41/mutex";
import { connect } from '@tursodatabase/database';
import { existsSync, mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export async function serve(storage: string): Promise<{ onHttpRequest(request: Request): Promise<Response>, onWebSocketRequest(request: Request, socket: WebSocket): Promise<void> }> {
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

  const setOfEffortsAsHex = new Set<string>()

  const url = new URL(import.meta.resolve("../worker/bin.ts"))

  url.searchParams.set("storage", storage)

  const worker = new Mutex(new Worker(url, { name: storage, type: "module" }))

  const create = async (codeAsBytes: Uint8Array<ArrayBuffer>, saltAsBytes: Uint8Array<ArrayBuffer>, effortAsBytes: Uint8Array<ArrayBuffer>) => {
    const sparksAsBigInt = (2n ** 256n) / BigInt("0x" + new Uint8Array(await crypto.subtle.digest("SHA-256", effortAsBytes)).toHex())

    if (sparksAsBigInt < (codeAsBytes.length + saltAsBytes.length))
      throw new RpcPaymentError()

    const saltAsValue = Readable.readFromBytes(Packed, saltAsBytes)

    const packAsBytes = Writable.writeToBytes(new Packed([codeAsBytes, saltAsValue]))

    const digestOfCodeAsBytes = new Uint8Array(await crypto.subtle.digest("SHA-256", codeAsBytes))
    const digestOfPackAsBytes = new Uint8Array(await crypto.subtle.digest("SHA-256", packAsBytes))

    const digestOfCodeAsHex = digestOfCodeAsBytes.toHex()
    const digestOfPackAsHex = digestOfPackAsBytes.toHex()

    if (!existsSync(join(storage, "scripts", `${digestOfCodeAsHex}.wasm`)))
      writeFileSync(join(storage, "scripts", `${digestOfCodeAsHex}.wasm`), codeAsBytes)

    if (!existsSync(join(storage, "scripts", `${digestOfPackAsHex}.wasm`)))
      symlinkSync(`./${digestOfCodeAsHex}.wasm`, join(storage, "scripts", `${digestOfPackAsHex}.wasm`))

    return digestOfPackAsHex
  }

  const execute = async (module: string, method: string, params: Uint8Array<ArrayBuffer>, effortAsBytes: Uint8Array<ArrayBuffer>) => {
    using stack = new DisposableStack()

    const effortAsHex = effortAsBytes.toHex()

    if (effortAsHex.length !== 64)
      throw new RpcInvalidParamsError()
    if (setOfEffortsAsHex.has(effortAsHex))
      throw new RpcInvalidParamsError()

    setOfEffortsAsHex.add(effortAsHex)

    const sparksAsBigInt = (2n ** 256n) / BigInt("0x" + new Uint8Array(await crypto.subtle.digest("SHA-256", effortAsBytes)).toHex())

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

    worker.get().postMessage(new RpcRequest(null, "execute", [module, method, params, sparksAsBigInt]))

    return await future.promise
  }

  const simulate = async (module: string, method: string, params: Uint8Array<ArrayBuffer>, effortAsBytes: Uint8Array<ArrayBuffer>) => {
    using stack = new DisposableStack()

    const effortAsHex = effortAsBytes.toHex()

    if (effortAsHex.length !== 64)
      throw new RpcInvalidParamsError()
    if (setOfEffortsAsHex.has(effortAsHex))
      throw new RpcInvalidParamsError()

    setOfEffortsAsHex.add(effortAsHex)

    const sparksAsBigInt = (2n ** 256n) / BigInt("0x" + new Uint8Array(await crypto.subtle.digest("SHA-256", effortAsBytes)).toHex())

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

    worker.get().postMessage(new RpcRequest(null, "simulate", [module, method, params, sparksAsBigInt]))

    return await future.promise
  }

  const onHttpRequest = async (request: Request) => {
    try {
      let match: URLPatternResult | null

      if (match = new URLPattern("/api/create", request.url).exec(request.url)) {
        if (request.method === "POST") {
          const form = await request.formData()

          const codeAsEntry = form.get("code")

          if (codeAsEntry == null)
            throw new RpcInvalidParamsError()
          if (typeof codeAsEntry === "string")
            throw new RpcInvalidParamsError()

          const codeAsBytes = await codeAsEntry.bytes()

          const saltAsEntry = form.get("salt")

          if (saltAsEntry == null)
            throw new RpcInvalidParamsError()
          if (typeof saltAsEntry === "string")
            throw new RpcInvalidParamsError()

          const saltAsBytes = await saltAsEntry.bytes()

          const effortAsEntry = form.get("effort")

          if (effortAsEntry == null)
            throw new RpcInvalidParamsError()
          if (typeof effortAsEntry === "string")
            throw new RpcInvalidParamsError()

          const effortAsBytes = await effortAsEntry.bytes()

          if (effortAsBytes.length !== 32)
            throw new RpcInvalidParamsError()

          const effortAsHex = effortAsBytes.toHex()

          if (setOfEffortsAsHex.has(effortAsHex))
            throw new RpcInvalidParamsError()

          setOfEffortsAsHex.add(effortAsHex)

          return Response.json(await create(codeAsBytes, saltAsBytes, effortAsBytes))
        }

        return Response.json(null, { status: 405, headers: { "Allow": "POST" } })
      }

      if (match = new URLPattern("/api/execute", request.url).exec(request.url)) {
        if (request.method === "POST") {
          const form = await request.formData()

          const moduleAsEntry = form.get("module")

          if (moduleAsEntry == null)
            throw new RpcInvalidParamsError()
          if (typeof moduleAsEntry !== "string")
            throw new RpcInvalidParamsError()

          const methodAsEntry = form.get("method")

          if (methodAsEntry == null)
            throw new RpcInvalidParamsError()
          if (typeof methodAsEntry !== "string")
            throw new RpcInvalidParamsError()

          const paramsAsEntry = form.get("params")

          if (paramsAsEntry == null)
            throw new RpcInvalidParamsError()
          if (typeof paramsAsEntry === "string")
            throw new RpcInvalidParamsError()

          const paramsAsBytes = await paramsAsEntry.bytes()

          const effortAsEntry = form.get("effort")

          if (effortAsEntry == null)
            throw new RpcInvalidParamsError()
          if (typeof effortAsEntry === "string")
            throw new RpcInvalidParamsError()

          const effortAsBytes = await effortAsEntry.bytes()

          if (effortAsBytes.length !== 32)
            throw new RpcInvalidParamsError()

          const effortAsHex = effortAsBytes.toHex()

          if (setOfEffortsAsHex.has(effortAsHex))
            throw new RpcInvalidParamsError()

          setOfEffortsAsHex.add(effortAsHex)

          return new Response(await execute(moduleAsEntry, methodAsEntry, paramsAsBytes, effortAsBytes))
        }

        return Response.json(null, { status: 405, headers: { "Allow": "POST" } })
      }

      if (match = new URLPattern("/api/simulate", request.url).exec(request.url)) {
        if (request.method === "POST") {
          const form = await request.formData()

          const moduleAsEntry = form.get("module")

          if (moduleAsEntry == null)
            throw new RpcInvalidParamsError()
          if (typeof moduleAsEntry !== "string")
            throw new RpcInvalidParamsError()

          const methodAsEntry = form.get("method")

          if (methodAsEntry == null)
            throw new RpcInvalidParamsError()
          if (typeof methodAsEntry !== "string")
            throw new RpcInvalidParamsError()

          const paramsAsEntry = form.get("params")

          if (paramsAsEntry == null)
            throw new RpcInvalidParamsError()
          if (typeof paramsAsEntry === "string")
            throw new RpcInvalidParamsError()

          const paramsAsBytes = await paramsAsEntry.bytes()

          const effortAsEntry = form.get("effort")

          if (effortAsEntry == null)
            throw new RpcInvalidParamsError()
          if (typeof effortAsEntry === "string")
            throw new RpcInvalidParamsError()

          const effortAsBytes = await effortAsEntry.bytes()

          if (effortAsBytes.length !== 32)
            throw new RpcInvalidParamsError()

          const effortAsHex = effortAsBytes.toHex()

          if (setOfEffortsAsHex.has(effortAsHex))
            throw new RpcInvalidParamsError()

          setOfEffortsAsHex.add(effortAsHex)

          return new Response(await simulate(moduleAsEntry, methodAsEntry, paramsAsBytes, effortAsBytes))
        }

        return Response.json(null, { status: 405, headers: { "Allow": "POST" } })
      }

      return Response.json(null, { status: 404 })
    } catch (error: unknown) {
      console.error(error)

      if (error instanceof Error === false)
        return new Response(null, { status: 500 })

      if (error instanceof RpcError === false)
        return new Response(error.message, { status: 500 })

      if (error.code === RpcParseError.code)
        return new Response(error.message, { status: 400 })
      if (error.code === RpcInvalidRequestError.code)
        return new Response(error.message, { status: 400 })
      if (error.code === RpcMethodNotFoundError.code)
        return new Response(error.message, { status: 404 })
      if (error.code === RpcInvalidParamsError.code)
        return new Response(error.message, { status: 400 })
      if (error.code === RpcInternalError.code)
        return new Response(error.message, { status: 500 })
      if (error.code === RpcPaymentError.code)
        return new Response(error.message, { status: 402 })

      return new Response(error.message, { status: 500 })
    }
  }

  const onWebSocketRequest = async (request: Request, socket: WebSocket) => {
    const route = async (request: RpcRequest) => {
      const { method, params } = request

      if (method === "create") {
        const [codeAsHex, saltAsHex, effortAsHex] = params as [string, string, string]

        if (typeof codeAsHex !== "string")
          throw new RpcInvalidParamsError()

        const codeAsBytes = Uint8Array.fromHex(codeAsHex)

        if (typeof saltAsHex !== "string")
          throw new RpcInvalidParamsError()

        const saltAsBytes = Uint8Array.fromHex(saltAsHex)

        if (typeof effortAsHex !== "string")
          throw new RpcInvalidParamsError()
        if (effortAsHex.length !== 64)
          throw new RpcInvalidParamsError()
        if (setOfEffortsAsHex.has(effortAsHex))
          throw new RpcInvalidParamsError()

        setOfEffortsAsHex.add(effortAsHex)

        const effortAsBytes = Uint8Array.fromHex(effortAsHex)

        return await create(codeAsBytes, saltAsBytes, effortAsBytes)
      }

      if (method === "execute") {
        const [module, method, paramsAsHex, effortAsHex] = params as [string, string, string, string]

        if (typeof module !== "string")
          throw new RpcInvalidParamsError()
        if (typeof method !== "string")
          throw new RpcInvalidParamsError()

        if (typeof paramsAsHex !== "string")
          throw new RpcInvalidParamsError()

        const paramsAsBytes = Uint8Array.fromHex(paramsAsHex)

        if (typeof effortAsHex !== "string")
          throw new RpcInvalidParamsError()
        if (effortAsHex.length !== 64)
          throw new RpcInvalidParamsError()
        if (setOfEffortsAsHex.has(effortAsHex))
          throw new RpcInvalidParamsError()

        setOfEffortsAsHex.add(effortAsHex)

        const effortAsBytes = Uint8Array.fromHex(effortAsHex)

        return await execute(module, method, paramsAsBytes, effortAsBytes)
      }

      if (method === "simulate") {
        const [module, method, paramsAsHex, effortAsHex] = params as [string, string, string, string]

        if (typeof module !== "string")
          throw new RpcInvalidParamsError()
        if (typeof method !== "string")
          throw new RpcInvalidParamsError()

        if (typeof paramsAsHex !== "string")
          throw new RpcInvalidParamsError()

        const paramsAsBytes = Uint8Array.fromHex(paramsAsHex)

        if (typeof effortAsHex !== "string")
          throw new RpcInvalidParamsError()
        if (effortAsHex.length !== 64)
          throw new RpcInvalidParamsError()
        if (setOfEffortsAsHex.has(effortAsHex))
          throw new RpcInvalidParamsError()

        setOfEffortsAsHex.add(effortAsHex)

        const effortAsBytes = Uint8Array.fromHex(effortAsHex)

        return await simulate(module, method, paramsAsBytes, effortAsBytes)
      }

      throw new RpcMethodNotFoundError()
    }

    const handle = async (request: RpcRequest) => {
      try {
        return new RpcOk(request.id, await route(request))
      } catch (cause: unknown) {
        return new RpcErr(request.id, RpcError.rewrap(cause))
      }
    }

    const parse = async (message: string) => {
      try {
        const request = RpcRequest.from(JSON.parse(message))

        const response = await handle(request)

        socket.send(JSON.stringify(response))
      } catch {
        socket.close()
      }
    }

    socket.addEventListener("message", (event) => parse(event.data))
  }

  return { onHttpRequest, onWebSocketRequest }
}