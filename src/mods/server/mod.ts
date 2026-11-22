import { Packed } from "@/libs/packed/mod.ts";
import { RpcPaymentError } from "@/mods/errors/mod.ts";
import { RpcRunner } from "@/mods/runner/mod.ts";
import { Readable, Writable } from "@hazae41/binary";
import { RpcErr, RpcError, RpcInvalidParamsError, RpcMethodNotFoundError, RpcOk, RpcRequestInit } from "@hazae41/jsonrpc";
import { Mutex } from "@hazae41/mutex";
import { Database } from '@tursodatabase/database';
import { existsSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export class Server {

  readonly subserver: RpcServer

  constructor(
    readonly uuid: string,
    readonly path: string,
    readonly data: Database
  ) {
    this.subserver = new RpcServer(uuid, path, data)
  }

  async setup() {
    await this.subserver.setup()
  }

  async respond(request: Request) {
    const response = await this.#route(request)

    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "*")
    response.headers.set("Access-Control-Allow-Headers", "*")

    return response
  }

  async #route(request: Request) {
    if (request.headers.get("Upgrade") === "websocket")
      return this.#upgrade(request)

    if (request.method === "OPTIONS")
      return Response.json(null, { status: 204 })
    if (request.method === "POST")
      return Response.json(await this.subserver.respond(await request.json()), { status: 200 })

    return Response.json(null, { status: 405 })
  }

  #upgrade(request: Request) {
    const { socket, response } = Deno.upgradeWebSocket(request)

    socket.addEventListener("message", async (event) => {
      socket.send(JSON.stringify(await this.subserver.respond(JSON.parse(event.data))))
    }, { passive: true })

    return response
  }

}

export class RpcServer {

  readonly runner: RpcRunner

  readonly seens = new Set<string>()
  readonly mutex = new Mutex(undefined)

  constructor(
    readonly uuid: string,
    readonly path: string,
    readonly data: Database
  ) {
    this.runner = RpcRunner.spawn(uuid, path)
  }

  async setup() {
    await this.runner.setup()
  }

  async respond(request: RpcRequestInit) {
    try {
      return new RpcOk(request.id, await this.#route(request))
    } catch (cause: unknown) {
      return new RpcErr(request.id, RpcError.rewrap(cause))
    }
  }

  async #route(request: RpcRequestInit) {
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
      if (this.seens.has(effortAsHex))
        throw new RpcInvalidParamsError()

      const effort = Uint8Array.fromHex(effortAsHex)

      using _ = await this.mutex.lockOrWait()

      this.seens.add(effortAsHex)

      const proven = new Uint8Array(await crypto.subtle.digest("SHA-256", effort))
      const target = (2n ** 256n) / BigInt("0x" + proven.toHex())

      if (target < (code.length + saltAsRaw.length))
        throw new RpcPaymentError()

      const pack = Writable.writeToBytes(new Packed([code, saltAsRef]))

      const digestOfCodeAsRaw = new Uint8Array(await crypto.subtle.digest("SHA-256", code))
      const digestOfPackAsRaw = new Uint8Array(await crypto.subtle.digest("SHA-256", pack))

      const digestOfCodeAsHex = digestOfCodeAsRaw.toHex()
      const digestOfPackAsHex = digestOfPackAsRaw.toHex()

      if (!existsSync(join(this.path, "scripts", `${digestOfCodeAsHex}.wasm`)))
        writeFileSync(join(this.path, "scripts", `${digestOfCodeAsHex}.wasm`), code)

      if (!existsSync(join(this.path, "scripts", `${digestOfPackAsHex}.wasm`)))
        symlinkSync(`./${digestOfCodeAsHex}.wasm`, join(this.path, "scripts", `${digestOfPackAsHex}.wasm`))

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
      if (this.seens.has(effortAsHex))
        throw new RpcInvalidParamsError()

      const effort = Uint8Array.fromHex(effortAsHex)

      using _ = await this.mutex.lockOrWait()

      this.seens.add(effortAsHex)

      const proven = new Uint8Array(await crypto.subtle.digest("SHA-256", effort))
      const target = (2n ** 256n) / BigInt("0x" + proven.toHex())

      const result = await this.runner.execute(module, method, params, target)

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
      if (this.seens.has(effortAsHex))
        throw new RpcInvalidParamsError()

      const effort = Uint8Array.fromHex(effortAsHex)

      using _ = await this.mutex.lockOrWait()

      this.seens.add(effortAsHex)

      const proven = new Uint8Array(await crypto.subtle.digest("SHA-256", effort))
      const target = (2n ** 256n) / BigInt("0x" + proven.toHex())

      const result = await this.runner.simulate(module, method, params, target)

      return result.toHex()
    }

    throw new RpcMethodNotFoundError()
  }

}