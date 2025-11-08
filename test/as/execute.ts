import { Cursor } from "@hazae41/cursor";
import { execSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join, relative } from "node:path";

declare global {
  interface Uint8Array {
    toHex(): string;
  }

  interface Uint8ArrayConstructor {
    fromHex(hex: string): Uint8Array<ArrayBuffer>;
  }
}

const [entrypoint, ...args] = process.argv.slice(2)

const exitpoint = join("./bin", relative("./src", entrypoint))

execSync(`asc ${entrypoint} -o ${exitpoint.replace(/\.ts$/, ".wasm")} -t ${exitpoint.replace(/\.ts$/, ".wat")} -b esm --enable reference-types`)

const wasm = await readFile(exitpoint.replace(/\.ts$/, ".wasm"))
const name = new Uint8Array(await crypto.subtle.digest("SHA-256", wasm)).toHex()

const body = new FormData()

body.append("name", name)
body.append("func", "main")

let length = 0

for (const arg of args) {
  const bytes = Uint8Array.fromHex(arg)

  if (bytes == null)
    throw new Error("Not found")

  length += 1 + 4 + bytes.length
  continue
}

const bytes = new Uint8Array(length)

const cursor = new Cursor(bytes)

for (const arg of args) {
  const bytes = Uint8Array.fromHex(arg)

  if (bytes == null)
    throw new Error("Not found")

  cursor.writeUint8OrThrow(3)
  cursor.writeUint32OrThrow(bytes.length, true)
  cursor.writeOrThrow(bytes)
  continue
}

body.append("args", new Blob([bytes]))

body.append("mod0", new Blob([wasm]))

console.log(name)

const start = performance.now()

await fetch("http://bob.localhost:8080/api/execute", { method: "POST", body });

const until = performance.now()

console.log(`Executed in ${until - start}ms`)