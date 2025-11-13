import { RpcMethodNotFoundError, type RpcRequestPreinit } from "@hazae41/jsonrpc";
import { connect } from "@tursodatabase/database";
import { runAsImmediateOrThrow } from "../../libs/sql/mod.ts";

declare const self: DedicatedWorkerGlobalScope;

const database = await connect(new URL(import.meta.url).searchParams.get("database")!)

self.addEventListener("message", async (event: MessageEvent<RpcRequestPreinit & { result: Int32Array<SharedArrayBuffer> }>) => {
  try {
    const { method, params, result } = event.data

    if (method === "storage_set") {
      return await runAsImmediateOrThrow(database, async (database) => {
        const [module, method, args, events] = params as [string, string, Uint8Array<ArrayBuffer>, [string, Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>][]]

        const moment = await database.prepare(`INSERT INTO moments (epoch, module, method, params) VALUES (0, ?, ?, ?);`).run(module, method, args)

        const writer = database.prepare(`INSERT INTO events (moment, module, key, value) VALUES (?, ?, ?, ?);`)

        for (const [module, key, value] of events)
          await writer.run(moment.lastInsertRowid, module, key, value)

        result[0] = 1
        result[1] = moment.lastInsertRowid

        Atomics.notify(result, 0)

        return
      })
    }

    if (method === "storage_get") {
      const [module, key] = params as [string, Uint8Array<ArrayBuffer>]

      const row = await database.prepare(`SELECT value FROM events event WHERE event.module = ? AND event.key = ? ORDER BY event.moment DESC LIMIT 1;`).get(module, key)

      if (row == null) {
        result[0] = 1

        result[1] = 2

        Atomics.notify(result, 0)

        return
      }

      const valueAsBytes = new Uint8Array(row.value)

      result[0] = 1

      result[1] = 1

      result[2] = valueAsBytes.length

      result.buffer.grow(result.buffer.byteLength + valueAsBytes.length)

      new Uint8Array(result.buffer).set(valueAsBytes, 4 + 4 + 4)

      Atomics.notify(result, 0)

      return
    }

    if (method === "sha256_digest") {
      const [payloadAsBytes] = params as [Uint8Array<ArrayBuffer>]

      const digestAsBytes = new Uint8Array(await crypto.subtle.digest("SHA-256", payloadAsBytes))

      result[0] = 1

      new Uint8Array(result.buffer).set(digestAsBytes, 4)

      Atomics.notify(result, 0)

      return
    }

    if (method === "ed25519_verify") {
      const [pubkeyAsBytes, signatureAsBytes, payloadAsBytes] = params as [Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>]

      const pubkeyAsRef = await crypto.subtle.importKey("raw", pubkeyAsBytes, "Ed25519", true, ["verify"])

      const verified = await crypto.subtle.verify("Ed25519", pubkeyAsRef, signatureAsBytes, payloadAsBytes)

      result[0] = 1

      result[1] = verified ? 1 : 0

      Atomics.notify(result, 0)

      return
    }

    throw new RpcMethodNotFoundError()
  } catch (error: unknown) {
    const { result } = event.data

    console.error(error)

    result[0] = 2

    Atomics.notify(result, 0)

    return
  }
})