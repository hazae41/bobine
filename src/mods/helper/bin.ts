import { RpcMethodNotFoundError, type RpcRequestPreinit } from "@hazae41/jsonrpc";
import { connect } from "@tursodatabase/database";
import { runAsImmediateOrThrow } from "../../libs/sql/mod.ts";
import type { Config } from "../config/mod.ts";

declare const self: DedicatedWorkerGlobalScope;

const config = await fetch(self.name).then(res => res.json()) as Config

const ed25519PvtkeyAsHex = config.ed25519.pvtKeyAsHex
const ed25519PvtkeyAsBytes = Uint8Array.fromHex(ed25519PvtkeyAsHex)

const database = await connect(config.database.path)

self.addEventListener("message", async (event: MessageEvent<RpcRequestPreinit & { result: Int32Array<SharedArrayBuffer> }>) => {
  try {
    const request = event.data

    if (request.method === "storage_set") {
      return await runAsImmediateOrThrow(database, async (database) => {
        const [module, method, args, writes] = event.data.params as [string, string, Uint8Array<ArrayBuffer>, [string, string, Uint8Array<ArrayBuffer>][]]

        const moment = await database.prepare(`INSERT INTO moments (epoch, module, method, params) VALUES (0, ?, ?, ?);`).run(module, method, args)

        const writer = database.prepare(`INSERT INTO events (moment, module, key, value) VALUES (?, ?, ?, ?);`)

        for (const [module, key, value] of writes)
          await writer.run(moment.lastInsertRowid, module, key, value)

        request.result[0] = 1

        request.result[1] = moment.lastInsertRowid

        Atomics.notify(request.result, 0)

        return
      })
    }

    if (request.method === "storage_get") {
      const [module, key] = request.params as [string, string]

      const row = await database.prepare(`SELECT value FROM events event WHERE event.module = ? AND event.key = ? ORDER BY event.nonce DESC LIMIT 1;`).get(module, key)

      if (row == null) {
        request.result[0] = 1

        request.result[1] = 2

        Atomics.notify(request.result, 0)

        return
      }

      const valueAsBytes = new Uint8Array(row.value)

      request.result[0] = 1

      request.result[1] = 1

      request.result[2] = valueAsBytes.length

      request.result.buffer.grow(request.result.buffer.byteLength + valueAsBytes.length)

      new Uint8Array(request.result.buffer).set(valueAsBytes, 4 + 4 + 4)

      Atomics.notify(request.result, 0)

      return
    }

    if (request.method === "sha256_digest") {
      const [payloadAsBytes] = request.params as [Uint8Array<ArrayBuffer>]

      const digestAsBytes = new Uint8Array(await crypto.subtle.digest("SHA-256", payloadAsBytes))

      request.result[0] = 1

      new Uint8Array(request.result.buffer).set(digestAsBytes, 4)

      Atomics.notify(request.result, 0)

      return
    }

    if (request.method === "ed25519_verify") {
      const [pubkeyAsBytes, signatureAsBytes, payloadAsBytes] = request.params as [Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>]

      const pubkeyAsKey = await crypto.subtle.importKey("raw", pubkeyAsBytes, "Ed25519", true, ["verify"])

      const verified = await crypto.subtle.verify("Ed25519", pubkeyAsKey, signatureAsBytes, payloadAsBytes)

      request.result[0] = 1

      request.result[1] = verified ? 1 : 0

      Atomics.notify(request.result, 0)

      return
    }

    if (request.method === "ed25519_sign") {
      const [payloadAsBytes] = request.params as [Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>]

      const pvtkeyAsKey = await crypto.subtle.importKey("pkcs8", ed25519PvtkeyAsBytes, "Ed25519", false, ["sign"]);

      const signatureAsBytes = new Uint8Array(await crypto.subtle.sign("Ed25519", pvtkeyAsKey, payloadAsBytes))

      request.result[0] = 1

      new Uint8Array(request.result.buffer).set(signatureAsBytes, 4)

      Atomics.notify(request.result, 0)

      return
    }

    throw new RpcMethodNotFoundError()
  } catch (error: unknown) {
    const request = event.data

    console.error(error)

    request.result[0] = 2

    Atomics.notify(request.result, 0)

    return
  }
})