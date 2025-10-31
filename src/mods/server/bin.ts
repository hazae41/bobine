import { serveWithEnv } from "./mod.ts";

const {
  PORT = Deno.env.get("PORT") || "8080",
  CERT = Deno.env.get("CERT"),
  KEY = Deno.env.get("KEY"),
} = Deno.env.toObject()

const port = Number(PORT)

const cert = CERT != null ? Deno.readTextFileSync(CERT) : undefined
const key = KEY != null ? Deno.readTextFileSync(KEY) : undefined

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