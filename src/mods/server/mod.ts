import { Packed } from "@/libs/packed/mod.ts";
import { RpcPaymentError } from "@/mods/errors/mod.ts";
import { Runner } from "@/mods/runner/mod.ts";
import { Readable, Writable } from "@hazae41/binary";
import { RpcErr, RpcError, RpcInvalidParamsError, RpcMethodNotFoundError, RpcOk, RpcRequestInit } from "@hazae41/jsonrpc";
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

  const mutex = Runner.spawn(uuid, path)
  const seens = new Set<string>()

  const route = async (request: RpcRequestInit) => {
    const { method, params } = request

    if (method === "bob_create") {
      const [codeAsHex, saltAsHex, effortAsHex] = params as [string, string, string]

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
      if (seens.has(effortAsHex))
        throw new RpcInvalidParamsError()

      seens.add(effortAsHex)

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

      if (!existsSync(join(path, "scripts", `${digestOfCodeAsHex}.wasm`)))
        writeFileSync(join(path, "scripts", `${digestOfCodeAsHex}.wasm`), codeAsRaw)

      if (!existsSync(join(path, "scripts", `${digestOfPackAsHex}.wasm`)))
        symlinkSync(`./${digestOfCodeAsHex}.wasm`, join(path, "scripts", `${digestOfPackAsHex}.wasm`))

      return digestOfPackAsHex
    }

    if (method === "bob_execute") {
      const [module, method, paramsAsHex, effortAsHex] = params as [string, string, string, string]

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
      if (seens.has(effortAsHex))
        throw new RpcInvalidParamsError()

      seens.add(effortAsHex)

      const effortAsRaw = Uint8Array.fromHex(effortAsHex)

      const sparksAsBigInt = (2n ** 256n) / BigInt("0x" + new Uint8Array(await crypto.subtle.digest("SHA-256", effortAsRaw)).toHex())

      const resultAsRaw = await mutex.execute(module, method, paramsAsRaw, sparksAsBigInt)
      const resultAsHex = resultAsRaw.toHex()

      return resultAsHex
    }

    if (method === "bob_simulate") {
      const [module, method, paramsAsHex, effortAsHex] = params as [string, string, string, string]

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
      if (seens.has(effortAsHex))
        throw new RpcInvalidParamsError()

      seens.add(effortAsHex)

      const effortAsRaw = Uint8Array.fromHex(effortAsHex)

      const sparksAsBigInt = (2n ** 256n) / BigInt("0x" + new Uint8Array(await crypto.subtle.digest("SHA-256", effortAsRaw)).toHex())

      const resultAsRaw = await mutex.simulate(module, method, paramsAsRaw, sparksAsBigInt)
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