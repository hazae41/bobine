/// <reference lib="webworker" />

import { Nullable } from "@/libs/nullable/mod.ts";
import { Runner } from "@/mods/bobine/runner/mod.ts";
import { RpcErr, RpcError, RpcMethodNotFoundError, RpcOk, RpcRequestInit } from "@hazae41/jsonrpc";
import { connect, Database } from "@tursodatabase/database";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

declare const self: DedicatedWorkerGlobalScope;

export class RpcWorkerServer {

  readonly runner: Runner

  constructor(
    readonly uuid: string,
    readonly path: string,
    readonly data: Database
  ) {
    this.runner = new Runner(uuid, path, data)
  }

  async respond(request: RpcRequestInit) {
    try {
      return new RpcOk(request.id, await this.#route(request))
    } catch (cause: unknown) {
      return new RpcErr(request.id, RpcError.rewrap(cause))
    }
  }

  async #route(request: RpcRequestInit) {
    if (request.method === "ping") {
      const _ = request.params

      // NOOP 

      return "pong"
    }

    if (request.method === "setup") {
      const _ = request.params

      await this.runner.setup()

      return
    }

    if (request.method === "create") {
      const [code, salt] = request.params as [Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>]

      const pack = await this.runner.create(code, salt)

      return pack
    }

    if (request.method === "execute") {
      const [module, method, params, target] = request.params as [string, string, Uint8Array<ArrayBuffer>, Nullable<bigint>]

      const proof = await this.runner.execute(module, method, params, target)

      return proof
    }

    if (request.method === "simulate") {
      const [module, method, params, target] = request.params as [string, string, Uint8Array<ArrayBuffer>, Nullable<bigint>]

      const proof = await this.runner.simulate(module, method, params, target)

      return proof
    }

    throw new RpcMethodNotFoundError()
  }

}

async function main() {
  const url = new URL(location.href)

  const uuid = url.searchParams.get("uuid")

  if (uuid == null)
    throw new Error()

  const path = url.searchParams.get("path")

  if (path == null)
    throw new Error()

  mkdirSync(join(path, "."), { recursive: true })

  const data = await connect(join(path, "records.db"))

  const server = new RpcWorkerServer(uuid, path, data)

  self.addEventListener("message", async (event) => {
    const refs = await server.respond(event.data)

    const json = refs.toJSON()

    self.postMessage(json)
  }, { passive: true })

  self.postMessage({ id: null, result: "pong" })
}

await main()