#!/usr/bin/env deno

export * from "./mods/mod.ts";

import process from "node:process";
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

    break
  }

  console.log("serve [--env=<env file as path>] [--port=<port>] [--dev]")
  return
}

if (import.meta.main) {
  await main(process.argv.slice(2));
}