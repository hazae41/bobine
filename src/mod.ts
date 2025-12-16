#!/usr/bin/env deno

export * from "./mods/mod.ts";

import { readFileSync } from "node:fs";
import process from "node:process";
import { work } from "./libs/effort/mod.ts";
import * as server from "./mods/server/bin.ts";

export async function main(args: string[]) {
  const subargs = new Array<string>();

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg.startsWith("--")) {
      subargs.push(arg)
      continue
    }

    if (arg === "serve") {
      subargs.push(...args.slice(i + 1))
      await server.main(subargs)
      return
    }

    if (arg === "create") {
      subargs.push(...args.slice(i + 1))

      const options: {
        file?: Uint8Array<ArrayBuffer>,

        salt?: Uint8Array<ArrayBuffer>,

        server?: URL
      } = {}

      for (let i = 0; i < subargs.length; i++) {
        const subarg = args[i]

        if (!subarg.startsWith("--")) {
          options.file = readFileSync(subarg)
          continue
        }

        if (subarg.startsWith("--salt=")) {
          options.salt = Uint8Array.fromHex(subarg.slice("--salt=".length))
          continue
        }

        if (subarg.startsWith("--server=")) {
          options.server = new URL(subarg.slice("--server=".length))
          continue
        }

        throw new Error(`Unknown argument: ${arg}`)
      }

      const {
        file,
        salt = new Uint8Array(),
        server = new URL("http://localhost:8080"),
      } = options

      if (file == null)
        throw new Error("File is required")

      const body = new FormData()

      body.append("code", new Blob([file]))
      body.append("salt", new Blob([salt]))

      const effort = await work(file.length + salt.length)

      body.append("effort", new Blob([effort]))

      const endpoint = new URL("/api/create", server)

      const response = await fetch(endpoint, { method: "POST", body })

      if (!response.ok)
        throw new Error("Failed", { cause: response })

      console.log(await response.json())
      return
    }

    if (arg === "execute") {
      console.log("Execute command is not implemented yet.")
      return
    }

    if (arg === "simulate") {
      console.log("Simulate command is not implemented yet.")
      return
    }

    break
  }

  console.log("serve [--env=<env file as path>] [--port=<port>] [--dev]")
  return
}

if (import.meta.main) {
  await main(process.argv.slice(2));
}