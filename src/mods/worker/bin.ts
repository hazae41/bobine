/// <reference lib="webworker" />

import { RpcWorkerServer } from "@/mods/worker/mod.ts";
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

  const server = new RpcWorkerServer(uuid, path, data)

  self.addEventListener("message", async (event) => {
    const refs = await server.respond(event.data)

    const json = refs.toJSON()

    self.postMessage(json)
  }, { passive: true })
}

if (import.meta.main) {
  await main()
}