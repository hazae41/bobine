import { readFileSync } from "node:fs";
import process from "node:process";
import { serveWithEnv } from "./mod.ts";

const {
  PORT = process.env.PORT || "8080",
  CERT = process.env.CERT,
  KEY = process.env.KEY,
} = process.env

const port = Number(PORT)

const cert = CERT != null ? readFileSync(CERT, "utf8") : undefined
const key = KEY != null ? readFileSync(KEY, "utf8") : undefined

const server = await serveWithEnv()

const route = async (request: Request) => {
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204 })

  return await server.onHttpRequest(request)
}

const onHttpRequest = async (request: Request) => {
  try {
    const response = await route(request)

    if (response.status === 101)
      return response

    response.headers.set("Access-Control-Allow-Origin", "*")
    response.headers.set("Access-Control-Allow-Methods", "*")
    response.headers.set("Access-Control-Allow-Headers", "*")

    return response
  } catch (cause: unknown) {
    console.error(cause)

    return new Response("Error", { status: 500 })
  }
}

Deno.serve({ hostname: "0.0.0.0", port, cert, key }, onHttpRequest)