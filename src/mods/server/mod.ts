// deno-lint-ignore-file no-unused-vars require-await no-cond-assign

import { Packed } from "@/libs/packed/mod.ts";
import { Readable, Writable } from "@hazae41/binary";
import { RpcRequest, RpcResponse, type RpcResponseInit } from "@hazae41/jsonrpc";
import { Mutex } from "@hazae41/mutex";
import { connect } from '@tursodatabase/database';
import { existsSync, mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export async function serve(storage: string): Promise<{ onHttpRequest(request: Request): Promise<Response>, onWebSocketRequest(request: Request, socket: WebSocket): Promise<void> }> {
  mkdirSync(dirname(storage), { recursive: true })

  const database = await connect(join(storage, "database.db"))

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

  mkdirSync(join(storage, "scripts"), { recursive: true })

  const setOfEffortsAsHex = new Set<string>()

  const url = new URL(import.meta.resolve("../worker/bin.ts"))

  url.searchParams.set("storage", storage)

  const worker = new Mutex(new Worker(url, { name: storage, type: "module" }))

  const onHttpRequest = async (request: Request) => {
    let match: URLPatternResult | null

    if (match = new URLPattern("/api/create", request.url).exec(request.url)) {
      if (request.method === "POST") {
        const form = await request.formData()

        const codeAsEntry = form.get("code")

        if (codeAsEntry == null)
          return Response.json(null, { status: 400 })
        if (typeof codeAsEntry === "string")
          return Response.json(null, { status: 400 })

        const codeAsBytes = await codeAsEntry.bytes()

        const saltAsEntry = form.get("salt")

        if (saltAsEntry == null)
          return Response.json(null, { status: 400 })
        if (typeof saltAsEntry === "string")
          return Response.json(null, { status: 400 })

        const saltAsBytes = await saltAsEntry.bytes()

        const effortAsEntry = form.get("effort")

        if (effortAsEntry == null)
          return Response.json(null, { status: 400 })
        if (typeof effortAsEntry === "string")
          return Response.json(null, { status: 400 })

        const effortAsBytes = await effortAsEntry.bytes()

        if (effortAsBytes.length !== 32)
          return Response.json(null, { status: 400 })

        const effortAsHex = effortAsBytes.toHex()

        if (setOfEffortsAsHex.has(effortAsHex))
          return Response.json(null, { status: 402 })

        setOfEffortsAsHex.add(effortAsHex)

        const sparksAsBigInt = (2n ** 256n) / BigInt("0x" + new Uint8Array(await crypto.subtle.digest("SHA-256", effortAsBytes)).toHex())

        if (sparksAsBigInt < (codeAsBytes.length + saltAsBytes.length))
          return Response.json(null, { status: 402 })

        const saltAsValue = Readable.readFromBytes(Packed, saltAsBytes)

        const packAsBytes = Writable.writeToBytes(new Packed([codeAsBytes, saltAsValue]))

        const digestOfCodeAsBytes = new Uint8Array(await crypto.subtle.digest("SHA-256", codeAsBytes))
        const digestOfPackAsBytes = new Uint8Array(await crypto.subtle.digest("SHA-256", packAsBytes))

        const digestOfCodeAsHex = digestOfCodeAsBytes.toHex()
        const digestOfPackAsHex = digestOfPackAsBytes.toHex()

        if (!existsSync(join(storage, "scripts", `${digestOfCodeAsHex}.wasm`)))
          writeFileSync(join(storage, "scripts", `${digestOfCodeAsHex}.wasm`), codeAsBytes)

        if (!existsSync(join(storage, "scripts", `${digestOfPackAsHex}.wasm`)))
          symlinkSync(`./${digestOfCodeAsHex}.wasm`, join(storage, "scripts", `${digestOfPackAsHex}.wasm`))

        return Response.json(digestOfPackAsHex)
      }

      return Response.json(null, { status: 405, headers: { "Allow": "POST" } })
    }

    if (match = new URLPattern("/api/execute", request.url).exec(request.url)) {
      if (request.method === "POST") {
        using stack = new DisposableStack()

        const form = await request.formData()

        const moduleAsEntry = form.get("module")

        if (moduleAsEntry == null)
          return Response.json(null, { status: 400 })
        if (typeof moduleAsEntry !== "string")
          return Response.json(null, { status: 400 })

        const methodAsEntry = form.get("method")

        if (methodAsEntry == null)
          return Response.json(null, { status: 400 })
        if (typeof methodAsEntry !== "string")
          return Response.json(null, { status: 400 })

        const paramsAsEntry = form.get("params")

        if (paramsAsEntry == null)
          return Response.json(null, { status: 400 })
        if (typeof paramsAsEntry === "string")
          return Response.json(null, { status: 400 })

        const paramsAsBytes = await paramsAsEntry.bytes()

        const effortAsEntry = form.get("effort")

        if (effortAsEntry == null)
          return Response.json(null, { status: 400 })
        if (typeof effortAsEntry === "string")
          return Response.json(null, { status: 400 })

        const effortAsBytes = await effortAsEntry.bytes()

        if (effortAsBytes.length !== 32)
          return Response.json(null, { status: 400 })

        const effortAsHex = effortAsBytes.toHex()

        if (setOfEffortsAsHex.has(effortAsHex))
          return Response.json(null, { status: 402 })

        setOfEffortsAsHex.add(effortAsHex)

        const sparksAsBigInt = (2n ** 256n) / BigInt("0x" + new Uint8Array(await crypto.subtle.digest("SHA-256", effortAsBytes)).toHex())

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

        worker.get().postMessage(new RpcRequest(null, "execute", [moduleAsEntry, methodAsEntry, paramsAsBytes, sparksAsBigInt]))

        return new Response(await future.promise)
      }

      return Response.json(null, { status: 405, headers: { "Allow": "POST" } })
    }

    if (match = new URLPattern("/api/simulate", request.url).exec(request.url)) {
      if (request.method === "POST") {
        using stack = new DisposableStack()

        const form = await request.formData()

        const moduleAsEntry = form.get("module")

        if (moduleAsEntry == null)
          return Response.json(null, { status: 400 })
        if (typeof moduleAsEntry !== "string")
          return Response.json(null, { status: 400 })

        const methodAsEntry = form.get("method")

        if (methodAsEntry == null)
          return Response.json(null, { status: 400 })
        if (typeof methodAsEntry !== "string")
          return Response.json(null, { status: 400 })

        const paramsAsEntry = form.get("params")

        if (paramsAsEntry == null)
          return Response.json(null, { status: 400 })
        if (typeof paramsAsEntry === "string")
          return Response.json(null, { status: 400 })

        const paramsAsBytes = await paramsAsEntry.bytes()

        const effortAsEntry = form.get("effort")

        if (effortAsEntry == null)
          return Response.json(null, { status: 400 })
        if (typeof effortAsEntry === "string")
          return Response.json(null, { status: 400 })

        const effortAsBytes = await effortAsEntry.bytes()

        if (effortAsBytes.length !== 32)
          return Response.json(null, { status: 400 })

        const effortAsHex = effortAsBytes.toHex()

        if (setOfEffortsAsHex.has(effortAsHex))
          return Response.json(null, { status: 402 })

        setOfEffortsAsHex.add(effortAsHex)

        const sparksAsBigInt = (2n ** 256n) / BigInt("0x" + new Uint8Array(await crypto.subtle.digest("SHA-256", effortAsBytes)).toHex())

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

        worker.get().postMessage(new RpcRequest(null, "simulate", [moduleAsEntry, methodAsEntry, paramsAsBytes, sparksAsBigInt]))

        return new Response(await future.promise)
      }

      return Response.json(null, { status: 405, headers: { "Allow": "POST" } })
    }

    return Response.json(null, { status: 404 })
  }

  const onWebSocketRequest = async (request: Request, socket: WebSocket) => {
    const route = (_message: string) => {
      return
    }

    const handleOrClose = async (request: string) => {
      try {
        if (!request)
          return

        const response = await route(request)

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
  }

  return { onHttpRequest, onWebSocketRequest }
}