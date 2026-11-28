/// <reference lib="webworker" />

import { Nullable } from "@/libs/nullable/mod.ts";
import { Runner } from "@/mods/bobine/runner/mod.ts";
import { RpcErr, RpcError, RpcMethodNotFoundError, RpcOk, RpcRequestInit } from "@hazae41/jsonrpc";
import { Packable } from "@hazae41/webpack";

declare const self: DedicatedWorkerGlobalScope;

export class RpcWorkerServer {

  constructor(
    readonly runner: Runner
  ) { }

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

    if (request.method === "create") {
      const [code, salt] = request.params as [Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>]

      const pack = await this.runner.create(code, salt)

      return pack
    }

    if (request.method === "execute") {
      const [module, method, params, target] = request.params as [string, string, Packable[], Nullable<bigint>]

      const proof = await this.runner.execute(module, method, params, target)

      return proof
    }

    if (request.method === "simulate") {
      const [module, method, params, target] = request.params as [string, string, Packable[], Nullable<bigint>]

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

  const runner = await Runner.setup(uuid, path)

  const server = new RpcWorkerServer(runner)

  self.addEventListener("message", async (event) => {
    const refs = await server.respond(event.data)

    const json = refs.toJSON()

    self.postMessage(json)
  }, { passive: true })

  self.postMessage({ id: null, result: "pong" })
}

await main()