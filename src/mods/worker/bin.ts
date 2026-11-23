/// <reference lib="webworker" />

import { Bobine } from "@/mods/bobine/mod.ts";
import { RpcErr, RpcError, RpcMethodNotFoundError, RpcOk, type RpcRequestInit } from "@hazae41/jsonrpc";
import { connect } from "@tursodatabase/database";
import { join } from "node:path";

declare const self: DedicatedWorkerGlobalScope;

async function main() {
  const url = new URL(location.href)

  const uuid = url.searchParams.get("uuid")

  if (uuid == null)
    throw new Error()

  const path = url.searchParams.get("path")

  if (path == null)
    throw new Error()

  const data = await connect(join(path, "records.db"))

  const bobine = new Bobine(uuid, path, data)

  const route = async (request: RpcRequestInit) => {
    if (request.method === "setup") {
      const _ = request.params

      await bobine.setup()

      return
    }

    if (request.method === "create") {
      const [code, salt] = request.params as [Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>]

      const pack = await bobine.create(code, salt)

      return pack
    }

    if (request.method === "execute") {
      const [module, method, params, target] = request.params as [string, string, Uint8Array<ArrayBuffer>, bigint]

      const proof = await bobine.execute(module, method, params, target)

      return proof
    }

    if (request.method === "simulate") {
      const [module, method, params, target] = request.params as [string, string, Uint8Array<ArrayBuffer>, bigint]

      const proof = await bobine.simulate(module, method, params, target)

      return proof
    }

    if (request.method === "verify") {
      // TODO
    }

    throw new RpcMethodNotFoundError()
  }

  const respond = async (request: RpcRequestInit) => {
    try {
      return new RpcOk(request.id, await route(request))
    } catch (cause: unknown) {
      return new RpcErr(request.id, RpcError.rewrap(cause))
    }
  }

  self.addEventListener("message", async (event) => {
    const refs = await respond(event.data)

    const json = refs.toJSON()

    self.postMessage(json)
  }, { passive: true })
}

if (import.meta.main) {
  await main()
}