/// <reference lib="deno.ns" />

import { Server } from "@/mods/server/mod.ts";
import { connect } from "@tursodatabase/database";
import { join } from "node:path";
import process from "node:process";

export async function main(args: string[]) {
  const options: {
    uuid?: string,

    path?: string,

    port?: number
  } = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg.startsWith("--env=")) {
      process.loadEnvFile(arg.slice("--env=".length))
      continue
    }

    if (arg.startsWith("--uuid=")) {
      options.uuid = arg.slice("--uuid=".length)
      continue
    }

    if (arg.startsWith("--data=")) {
      options.path = arg.slice("--data=".length)
      continue
    }

    if (arg.startsWith("--port=")) {
      options.port = Number(arg.slice("--port=".length))
      continue
    }

    if (arg === "--dev") {
      process.env.NODE_ENV = "development"
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  const {
    uuid = process.env.UUID || "98e31aaf-c518-430b-8863-eed26c44d91f",
    path = process.env.DATA || "./data",
    port = Number(process.env.PORT) || 8080
  } = options

  const data = await connect(join(path, "records.db"))

  const server = new Server(uuid, path, data)

  await server.setup()

  Deno.serve({ hostname: "0.0.0.0", port }, (request) => server.respond(request))
}

if (import.meta.main) {
  await main(process.argv.slice(2))
}