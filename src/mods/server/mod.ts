// deno-lint-ignore-file no-cond-assign
/// <reference lib="deno.ns" />

import { RpcRequest, RpcResponse, RpcResponseInit } from "@hazae41/jsonrpc";
import { Mutex } from "@hazae41/mutex";
import { connect, type Database } from '@tursodatabase/database';
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export async function serveWithEnv(prefix = "") {
  const {
    DATABASE_PATH = Deno.env.get(prefix + "DATABASE_PATH"),
  } = {}

  if (DATABASE_PATH == null)
    throw new Error("DATABASE_PATH is not set")

  Deno.mkdirSync(dirname(DATABASE_PATH), { recursive: true })

  const database = await connect(DATABASE_PATH)

  await database.exec(`CREATE TABLE IF NOT EXISTS moments (
    nonce INTEGER PRIMARY KEY AUTOINCREMENT,

    time INTEGER NOT NULL,
    data JSONB NOT NULL,
    hash TEXT NOT NULL
  );`)

  return serve(database)
}

export function serve(database: Database) {
  const worker = new Mutex(new Worker(import.meta.resolve("@/mods/worker/bin.ts"), { name: "worker", type: "module" }))

  const onHttpRequest = async (request: Request) => {
    if (request.headers.get("Upgrade") === "websocket") {
      const uuid = new URL(request.url).searchParams.get("session")

      if (uuid == null)
        return Response.json(null, { status: 401 })

      const { socket, response } = Deno.upgradeWebSocket(request)

      const routeOrThrow = async (message: string) => {
        return
      }

      const handleOrClose = async (request: string) => {
        try {
          if (!request)
            return

          const response = await routeOrThrow(request)

          if (response == null)
            return

          socket.send(JSON.stringify(response))
        } catch {
          socket.close()
        }
      }

      socket.addEventListener("message", async (event) => {
        if (typeof event.data !== "string")
          return
        return await handleOrClose(event.data)
      })

      return response
    }

    // deno-lint-ignore no-unused-vars
    let match: URLPatternResult | null

    // TODO /api/simulate

    if (match = new URLPattern("/api/execute", request.url).exec(request.url)) {
      if (request.method === "POST") {
        const form = await request.formData()

        const code = form.get("0")

        if (code == null)
          return Response.json(null, { status: 400 })
        if (typeof code === "string")
          return Response.json(null, { status: 400 })

        const wasm = await code.bytes()

        const args = new Array<string | Uint8Array<ArrayBuffer>>()

        for (let i = 1; ; i++) {
          const entry = form.get(`${i}`)

          if (entry == null)
            break

          if (typeof entry === "string")
            args.push(entry)
          else
            args.push(await entry.bytes())

          continue
        }

        using stack = new DisposableStack()

        const name = new Uint8Array(await crypto.subtle.digest("SHA-256", wasm)).toHex()
        const file = `./local/scripts/${name}.wasm`

        mkdirSync(dirname(file), { recursive: true })

        writeFileSync(file, wasm)

        const future = Promise.withResolvers<void>()

        const aborter = new AbortController()
        stack.defer(() => aborter.abort())

        stack.use(await worker.lockOrWait())

        worker.get().addEventListener("message", (event: MessageEvent<RpcResponseInit<void>>) => {
          RpcResponse.from(event.data).inspectSync(future.resolve).inspectErrSync(future.reject)
        }, { signal: aborter.signal })

        worker.get().addEventListener("error", (event: ErrorEvent) => {
          future.reject(event.error)
        }, { signal: aborter.signal })

        worker.get().addEventListener("messageerror", (event: MessageEvent) => {
          future.reject(event.data)
        }, { signal: aborter.signal })

        AbortSignal.timeout(1000).addEventListener("abort", (reason) => {
          future.reject(reason)
        }, { signal: aborter.signal })

        worker.get().postMessage(new RpcRequest(null, "execute", [name, wasm, args]))

        await future.promise

        return Response.json(null)
      }

      return Response.json(null, { status: 405, headers: { "Allow": "POST" } })
    }

    return Response.json(null, { status: 404 })
  }

  return { onHttpRequest }
}