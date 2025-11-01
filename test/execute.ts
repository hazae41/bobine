import { readFile } from "node:fs/promises";

const [wasm, wast] = Deno.args

const body = new FormData()

body.append("wasm", new Blob([await readFile(wasm)]))
body.append("wast", new Blob([await readFile(wast)]))

await fetch("http://bob.localhost:8080/api/execute", { method: "POST", body });

const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", await readFile(wasm))).toHex()

console.log(hash)