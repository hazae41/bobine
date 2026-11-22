import { Packed } from "@/libs/packed/mod.ts";
import { RpcPaymentError } from "@/mods/errors/mod.ts";
import { Runner } from "@/mods/runner/mod.ts";
import { Readable, Writable } from "@hazae41/binary";
import { RpcErr, RpcError, RpcInvalidParamsError, RpcMethodNotFoundError, RpcOk, RpcRequestInit } from "@hazae41/jsonrpc";
import { Mutex } from "@hazae41/mutex";
import { connect } from '@tursodatabase/database';
import { existsSync, mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

async function setup(path: string) {
  mkdirSync(join(path, "."), { recursive: true })
  mkdirSync(join(path, "scripts"), { recursive: true })

  const data = await connect(join(path, "records.db"))

  await data.exec(`CREATE TABLE IF NOT EXISTS events (
    nonce INTEGER PRIMARY KEY AUTOINCREMENT,

    moment INTEGER NOT NULL,

    module TEXT NOT NULL,
    
    key BLOB NOT NULL,

    value BLOB NOT NULL
  );`)

  await data.exec(`CREATE TABLE IF NOT EXISTS moments (
    nonce INTEGER PRIMARY KEY AUTOINCREMENT,
    
    epoch INTEGER NOT NULL,

    module TEXT NOT NULL,

    method TEXT NOT NULL,
    
    params BLOB NOT NULL
  );`)

  await data.close()
}

export async function serve(uuid: string, path: string) {
  await setup(path)

  const runner = Runner.spawn(uuid, path)
  const knowns = new Set<string>()

  const mutex = new Mutex(undefined)

  const route = async (request: RpcRequestInit) => {
    if (request.method === "bob_create") {
      const [codeAsHex, saltAsHex, effortAsHex] = request.params as [string, string, string]

      if (typeof codeAsHex !== "string")
        throw new RpcInvalidParamsError()

      const code = Uint8Array.fromHex(codeAsHex)

      if (typeof saltAsHex !== "string")
        throw new RpcInvalidParamsError()

      const saltAsRaw = Uint8Array.fromHex(saltAsHex)
      const saltAsRef = Readable.readFromBytes(Packed, saltAsRaw)

      if (typeof effortAsHex !== "string")
        throw new RpcInvalidParamsError()
      if (effortAsHex.length !== 64)
        throw new RpcInvalidParamsError()
      if (knowns.has(effortAsHex))
        throw new RpcInvalidParamsError()

      const effort = Uint8Array.fromHex(effortAsHex)

      using _ = await mutex.lockOrWait()

      knowns.add(effortAsHex)

      const proven = new Uint8Array(await crypto.subtle.digest("SHA-256", effort))
      const target = (2n ** 256n) / BigInt("0x" + proven.toHex())

      if (target < (code.length + saltAsRaw.length))
        throw new RpcPaymentError()

      const pack = Writable.writeToBytes(new Packed([code, saltAsRef]))

      const digestOfCodeAsRaw = new Uint8Array(await crypto.subtle.digest("SHA-256", code))
      const digestOfPackAsRaw = new Uint8Array(await crypto.subtle.digest("SHA-256", pack))

      const digestOfCodeAsHex = digestOfCodeAsRaw.toHex()
      const digestOfPackAsHex = digestOfPackAsRaw.toHex()

      if (!existsSync(join(path, "scripts", `${digestOfCodeAsHex}.wasm`)))
        writeFileSync(join(path, "scripts", `${digestOfCodeAsHex}.wasm`), code)

      if (!existsSync(join(path, "scripts", `${digestOfPackAsHex}.wasm`)))
        symlinkSync(`./${digestOfCodeAsHex}.wasm`, join(path, "scripts", `${digestOfPackAsHex}.wasm`))

      return digestOfPackAsHex
    }

    if (request.method === "bob_execute") {
      const [module, method, paramsAsHex, effortAsHex] = request.params as [string, string, string, string]

      if (typeof module !== "string")
        throw new RpcInvalidParamsError()
      if (typeof method !== "string")
        throw new RpcInvalidParamsError()

      if (typeof paramsAsHex !== "string")
        throw new RpcInvalidParamsError()

      const params = Uint8Array.fromHex(paramsAsHex)

      if (typeof effortAsHex !== "string")
        throw new RpcInvalidParamsError()
      if (effortAsHex.length !== 64)
        throw new RpcInvalidParamsError()
      if (knowns.has(effortAsHex))
        throw new RpcInvalidParamsError()

      const effort = Uint8Array.fromHex(effortAsHex)

      using _ = await mutex.lockOrWait()

      knowns.add(effortAsHex)

      const proven = new Uint8Array(await crypto.subtle.digest("SHA-256", effort))
      const target = (2n ** 256n) / BigInt("0x" + proven.toHex())

      const result = await runner.execute(module, method, params, target)

      return result.toHex()
    }

    if (request.method === "bob_simulate") {
      const [module, method, paramsAsHex, effortAsHex] = request.params as [string, string, string, string]

      if (typeof module !== "string")
        throw new RpcInvalidParamsError()
      if (typeof method !== "string")
        throw new RpcInvalidParamsError()

      if (typeof paramsAsHex !== "string")
        throw new RpcInvalidParamsError()

      const params = Uint8Array.fromHex(paramsAsHex)

      if (typeof effortAsHex !== "string")
        throw new RpcInvalidParamsError()
      if (effortAsHex.length !== 64)
        throw new RpcInvalidParamsError()
      if (knowns.has(effortAsHex))
        throw new RpcInvalidParamsError()

      const effort = Uint8Array.fromHex(effortAsHex)

      using _ = await mutex.lockOrWait()

      knowns.add(effortAsHex)

      const proven = new Uint8Array(await crypto.subtle.digest("SHA-256", effort))
      const target = (2n ** 256n) / BigInt("0x" + proven.toHex())

      const result = await runner.simulate(module, method, params, target)

      return result.toHex()
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