// deno-lint-ignore-file no-cond-assign
/// <reference lib="deno.ns" />

import { RpcRequest, RpcResponse, type RpcResponseInit } from "@hazae41/jsonrpc";
import { Mutex } from "@hazae41/mutex";
import { connect } from '@tursodatabase/database';
import { existsSync, mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { Pack } from "../../libs/packs/mod.ts";

export async function serveWithEnv(prefix = "") {
  const {
    DATABASE_PATH = Deno.env.get(prefix + "DATABASE_PATH"),
  } = {}

  if (DATABASE_PATH == null)
    throw new Error("DATABASE_PATH is not set")

  Deno.mkdirSync(dirname(DATABASE_PATH), { recursive: true })

  const database = await connect(DATABASE_PATH)

  await database.exec(`CREATE TABLE IF NOT EXISTS events (
    nonce INTEGER PRIMARY KEY AUTOINCREMENT,

    moment INTEGER NOT NULL,

    module TEXT NOT NULL,
    
    key BLOB NOT NULL,
    value BLOB NOT NULL
  );`)

  await database.exec(`CREATE TABLE IF NOT EXISTS moments (
    nonce INTEGER PRIMARY KEY AUTOINCREMENT,
    
    epoch INTEGER NOT NULL,

    module TEXT NOT NULL,
    method TEXT NOT NULL,
    params BLOB NOT NULL
  );`)

  await database.close()

  return serve(DATABASE_PATH)
}

export function serve(database: string) {
  const worker = new Mutex(new Worker(import.meta.resolve(`@/mods/worker/bin.ts?database=${database}`), { name: "worker", type: "module" }))

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

    if (match = new URLPattern("/api/create", request.url).exec(request.url)) {
      if (request.method === "POST") {
        const form = await request.formData()

        const wasmAsEntry = form.get("code")

        if (wasmAsEntry == null)
          return Response.json(null, { status: 400 })
        if (typeof wasmAsEntry === "string")
          return Response.json(null, { status: 400 })

        const saltAsEntry = form.get("salt")

        if (saltAsEntry == null)
          return Response.json(null, { status: 400 })
        if (typeof saltAsEntry === "string")
          return Response.json(null, { status: 400 })

        const wasmAsBytes = await wasmAsEntry.bytes()
        const saltAsBytes = await saltAsEntry.bytes()

        const packAsBytes = Pack.encode([wasmAsBytes, saltAsBytes])

        const digestOfWasmAsBytes = new Uint8Array(await crypto.subtle.digest("SHA-256", wasmAsBytes))
        const digestOfPackAsBytes = new Uint8Array(await crypto.subtle.digest("SHA-256", packAsBytes))

        const digestOfWasmAsHex = digestOfWasmAsBytes.toHex()
        const digestOfPackAsHex = digestOfPackAsBytes.toHex()

        if (!existsSync(`./local/scripts/${digestOfPackAsHex}.wasm`)) {
          mkdirSync(`./local/scripts`, { recursive: true })

          writeFileSync(`./local/scripts/${digestOfWasmAsHex}.wasm`, wasmAsBytes)

          symlinkSync(`./${digestOfWasmAsHex}.wasm`, `./local/scripts/${digestOfPackAsHex}.wasm`)
        }

        return Response.json(digestOfPackAsHex)
      }

      return Response.json(null, { status: 405, headers: { "Allow": "POST" } })
    }

    // TODO /api/simulate

    if (match = new URLPattern("/api/execute", request.url).exec(request.url)) {
      if (request.method === "POST") {
        using stack = new DisposableStack()

        const form = await request.formData()

        const nameAsEntry = form.get("name")

        if (nameAsEntry == null)
          return Response.json(null, { status: 400 })
        if (typeof nameAsEntry !== "string")
          return Response.json(null, { status: 400 })

        const funcAsEntry = form.get("func")

        if (funcAsEntry == null)
          return Response.json(null, { status: 400 })
        if (typeof funcAsEntry !== "string")
          return Response.json(null, { status: 400 })

        const argsAsEntry = form.get("args")

        if (argsAsEntry == null)
          return Response.json(null, { status: 400 })
        if (typeof argsAsEntry === "string")
          return Response.json(null, { status: 400 })

        const argsAsBytes = await argsAsEntry.bytes()

        const future = Promise.withResolvers<Uint8Array<ArrayBuffer>>()

        const aborter = new AbortController()
        stack.defer(() => aborter.abort())

        stack.use(await worker.lockOrWait())

        worker.get().addEventListener("message", (event: MessageEvent<RpcResponseInit<Uint8Array<ArrayBuffer>>>) => {
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

        worker.get().postMessage(new RpcRequest(null, "execute", [nameAsEntry, funcAsEntry, argsAsBytes]))

        return new Response(await future.promise)
      }

      return Response.json(null, { status: 405, headers: { "Allow": "POST" } })
    }

    return Response.json(null, { status: 404 })
  }

  return { onHttpRequest }
}