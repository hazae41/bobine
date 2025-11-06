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

const body = new FormData()

body.append("0", new Blob([wasm]))

for (let i = 0; i < args.length; i++)
  body.append(`${i + 1}`, args[i].startsWith("0x") ? new Blob([Uint8Array.fromHex(args[i].slice(2))]) : args[i]);

await fetch("http://bob.localhost:8080/api/execute", { method: "POST", body });

console.log(new Uint8Array(await crypto.subtle.digest("SHA-256", wasm)).toHex())