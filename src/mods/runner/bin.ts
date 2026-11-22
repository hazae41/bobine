/// <reference lib="webworker" />

import { Bobine } from "@/mods/bobine/mod.ts";
import { RpcErr, RpcError, RpcMethodNotFoundError, RpcOk, type RpcRequestInit } from "@hazae41/jsonrpc";
import { connect } from "@tursodatabase/database";
import { join } from "node:path";

declare const self: DedicatedWorkerGlobalScope;

async function main() {
  const url = new URL(location.href)

  const uuid = url.searchParams.get("uuid")!

  const path = url.searchParams.get("path")!

  const data = await connect(join(path, "records.db"))

  const bobine = new Bobine(uuid, path, data)

  const onmessage = async (event: MessageEvent<RpcRequestInit>) => {
    try {
      const request = event.data

      if (request.method === "setup") {
        const _ = request.params

        await bobine.setup()

        self.postMessage(new RpcOk(request.id, undefined).toJSON())

        return
      }

      if (request.method === "create") {
        const [code, salt] = request.params as [Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>]

        const pack = await bobine.create(code, salt)

        self.postMessage(new RpcOk(request.id, pack).toJSON())

        return
      }

      if (request.method === "execute") {
        const [module, method, params, target] = request.params as [string, string, Uint8Array<ArrayBuffer>, bigint]

        const proof = await bobine.execute(module, method, params, target)

        self.postMessage(new RpcOk(request.id, proof).toJSON())

        return
      }

      if (request.method === "simulate") {
        const [module, method, params, target] = request.params as [string, string, Uint8Array<ArrayBuffer>, bigint]

        const proof = await bobine.simulate(module, method, params, target)

        self.postMessage(new RpcOk(request.id, proof).toJSON())

        return
      }

      if (request.method === "verify") {
        // TODO
      }

      throw new RpcMethodNotFoundError()
    } catch (cause: unknown) {
      const request = event.data

      const error = RpcError.rewrap(cause)

      self.postMessage(new RpcErr(request.id, error).toJSON())
    }
  }

  self.addEventListener("message", onmessage, { passive: true })
}

if (import.meta.main) {
  await main()
}