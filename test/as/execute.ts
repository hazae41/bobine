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
const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", wasm)).toHex()

const body = new FormData()

body.append("name", hash)
body.append("func", "main")

for (let i = 0; i < args.length; i++)
  body.append(`arg${i}`, new Blob([Uint8Array.fromHex(args[i])]));

body.append("mod0", new Blob([wasm]))

await fetch("http://bob.localhost:8080/api/execute", { method: "POST", body });

console.log(hash)