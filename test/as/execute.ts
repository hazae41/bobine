import { execSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const [entrypoint] = Deno.args

const exitpoint = join("./bin", relative("./src", entrypoint))

execSync(`asc ${entrypoint} -o ${exitpoint.replace(/\.ts$/, ".wasm")} -t ${exitpoint.replace(/\.ts$/, ".wat")} -b esm --enable reference-types`)

const body = await readFile(exitpoint.replace(/\.ts$/, ".wasm"))

await fetch("http://bob.localhost:8080/api/execute", { method: "POST", body });

console.log(new Uint8Array(await crypto.subtle.digest("SHA-256", body)).toHex())