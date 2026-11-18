/// <reference lib="deno.ns" />

import { readFileSync } from "node:fs";
import process from "node:process";
import { serve } from "./mod.ts";

export async function main(args: string[]) {
  const options: {
    data?: string,

    port?: number,

    cert?: string,

    key?: string,
  } = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg.startsWith("--env=")) {
      process.loadEnvFile(arg.slice("--env=".length))
      continue
    }

    if (arg.startsWith("--data=")) {
      options.data = arg.slice("--data=".length)
      continue
    }

    if (arg.startsWith("--port=")) {
      options.port = Number(arg.slice("--port=".length))
      continue
    }

    if (arg.startsWith("--cert=")) {
      options.cert = readFileSync(arg.slice("--cert=".length), "utf8")
      continue
    }

    if (arg.startsWith("--key=")) {
      options.key = readFileSync(arg.slice("--key=".length), "utf8")
      continue
    }

    if (arg === "--dev=true") {
      process.env.NODE_ENV = "development"
      continue
    }

    if (arg === "--dev=false") {
      process.env.NODE_ENV = "production"
      continue
    }

    if (arg === "--dev") {
      process.env.NODE_ENV = "development"
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  const {
    data = process.env.DATA || "./data",
    port = Number(process.env.PORT) || 8080,
    cert = process.env.CERT != null ? readFileSync(process.env.CERT, "utf8") : undefined,
    key = process.env.KEY != null ? readFileSync(process.env.KEY, "utf8") : undefined,
  } = options

  const server = await serve(data)

  const route = async (request: Request) => {
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204 })

    if (request.headers.get("Upgrade") === "websocket") {
      const { socket, response } = Deno.upgradeWebSocket(request)

      await server.onWebSocketRequest(request, socket)

      return response
    }

    return await server.onHttpRequest(request)
  }

  const onHttpRequest = async (request: Request) => {
    const response = await route(request)

    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "*")
    response.headers.set("Access-Control-Allow-Headers", "*")

    return response
  }

  Deno.serve({ hostname: "0.0.0.0", port, cert, key }, onHttpRequest)
}

if (import.meta.main) {
  await main(process.argv.slice(2))
}