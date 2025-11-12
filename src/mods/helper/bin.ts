import { RpcMethodNotFoundError, type RpcRequestPreinit } from "@hazae41/jsonrpc";
import { connect } from "@tursodatabase/database";
import { runAsImmediateOrThrow } from "../../libs/sql/mod.ts";

declare const self: DedicatedWorkerGlobalScope;

const database = await connect(new URL(import.meta.url).searchParams.get("database")!)

self.addEventListener("message", async (event: MessageEvent<RpcRequestPreinit & { result: Int32Array<SharedArrayBuffer> }>) => {
  try {
    const { method, params, result } = event.data

    if (method === "storage_set") {
      const [name, func, args, writes] = params as [string, string, Uint8Array<ArrayBuffer>, [Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>][], [Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>][]]

      const moment = await runAsImmediateOrThrow(database, async (database) => {
        const moment = await database.prepare(`INSERT INTO moments (epoch, module, method, params) VALUES (0, ?, ?, ?);`).run(name, func, args)

        const writer = database.prepare(`INSERT INTO events (moment, key, value) VALUES (?, ?, ?);`)

        for (const [key, value] of writes)
          writer.run(moment.lastInsertRowid, key, value)

        return moment.lastInsertRowid
      })

      result[0] = 1
      result[1] = moment

      Atomics.notify(result, 0)

      return
    }

    if (method === "storage_get") {
      const [keyAsBytes] = params as [Uint8Array<ArrayBuffer>]

      const row = await database.prepare(`SELECT value FROM events WHERE key = ?;`).get(keyAsBytes)

      if (row == null)
        throw new Error("Not found")

      const valueAsBytes = new Uint8Array(row.value)

      result[0] = 1

      result[1] = valueAsBytes.length

      result.buffer.grow(result.buffer.byteLength + valueAsBytes.length)

      new Uint8Array(result.buffer).set(valueAsBytes, 4 + 4)

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