// deno-lint-ignore-file no-cond-assign
/// <reference lib="deno.ns" />

import { RpcErr, RpcError, RpcMethodNotFoundError, RpcOk, RpcRequest, type RpcRequestInit, type RpcResponseInit } from "@hazae41/jsonrpc";
import { connect, type Database } from '@tursodatabase/database';
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
        const { code } = await request.json()

        if (code == null)
          return Response.json(null, { status: 400 })

        using stack = new DisposableStack()

        const aborter = new AbortController()
        stack.defer(() => aborter.abort())

        const workers = new Map<string, Worker>()

        const data = new TextEncoder().encode(code)
        const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", data)).toHex()
        const file = `./data/bob/scripts/${hash}.ts`

        mkdirSync(dirname(file), { recursive: true })

        writeFileSync(file, data)

        const url = URL.createObjectURL(new Blob([data], { type: "text/javascript" }))

        const worker = new Worker(url, { name: file, type: "module", deno: { permissions: "none" } })

        stack.defer(() => worker.terminate())

        workers.set(hash, worker)

        const future = Promise.withResolvers<void>()

        type RpcMessageInit = RpcRequestInit | RpcResponseInit

        const routeOrThrow = (source: Worker, request: RpcRequest, transfers: Transferable[]) => {
          const { method, params } = request

          if (method === "import") {
            const [hash] = params as [string]

            if (workers.has(hash))
              throw new Error("Already imported")

            const file = `./data/bob/scripts/${hash}.ts`
            const data = readFileSync(file)

            const url = URL.createObjectURL(new Blob([data], { type: "text/javascript" }))

            const worker = new Worker(url, { name: file, type: "module", deno: { permissions: "none" } })

            stack.defer(() => worker.terminate())

            worker.addEventListener("message", (event) => {
              const [message, transfers] = event.data as [RpcMessageInit, Transferable[]]

              if ("method" in message === false)
                return

              const request = RpcRequest.from(message)

              try {
                const result = routeOrThrow(worker, request, transfers)

                const response = new RpcOk(request.id, result)

                worker.postMessage([response])
              } catch (cause: unknown) {
                const error = RpcError.rewrap(cause)

                const response = new RpcErr(request.id, error)

                worker.postMessage([response])
              }
            }, { signal: aborter.signal })

            workers.set(hash, worker)

            return
          }

          if (method === "message") {
            const [hash, message] = params as [string, unknown]

            const worker = workers.get(hash)

            if (worker == null)
              throw new Error("Not imported")

            worker.postMessage([message, transfers], transfers)

            return
          }

          if (method === "return") {
            source.terminate()

            if (source === worker)
              future.resolve()

            return
          }

          throw new RpcMethodNotFoundError()
        }

        worker.addEventListener("message", (event: MessageEvent<unknown>) => {
          const [message, transfers] = event.data as [RpcMessageInit, Transferable[]]

          if ("method" in message === false)
            return

          const request = RpcRequest.from(message)

          try {
            const result = routeOrThrow(worker, request, transfers)

            const response = new RpcOk(request.id, result)

            worker.postMessage([response])
          } catch (cause: unknown) {
            const error = RpcError.rewrap(cause)

            const response = new RpcErr(request.id, error)

            worker.postMessage([response])
          }
        }, { signal: aborter.signal })

        AbortSignal.timeout(1000).addEventListener("abort", (reason) => {
          future.reject(reason)
        }, { signal: aborter.signal })

        await future.promise

        return Response.json(null)
      }

      return Response.json(null, { status: 405, headers: { "Allow": "POST" } })
    }

    return Response.json(null, { status: 404 })
  }

  return { onHttpRequest }
}