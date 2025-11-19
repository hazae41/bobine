/// <reference types="../libs/bytes/lib.d.ts"/>

import { execSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const [entrypoint, salt = ""] = process.argv.slice(2)

const exitpoint = join("./bin", relative("./src", entrypoint))

const start = performance.now()

execSync(`asc ${entrypoint} -o ${exitpoint.replace(/\.ts$/, ".wasm")} -t ${exitpoint.replace(/\.ts$/, ".wat")} -b esm --optimizeLevel 3 --converge --runtime stub --enable reference-types`)

const end = performance.now()

console.log(`Compiled in ${(end - start).toFixed(2)}ms`)

const body = new FormData()

body.append("code", new Blob([await readFile(exitpoint.replace(/\.ts$/, ".wasm"))]))
body.append("salt", new Blob([Uint8Array.fromHex(salt.slice(2))]))

{
  const start = performance.now()

  const response = await fetch("http://localhost:8080/api/create", { method: "POST", body });

  if (!response.ok)
    throw new Error("Failed", { cause: response })

  console.log(await response.json())

  const until = performance.now()

  console.log(`Created in ${(until - start).toFixed(2)}ms`)
}