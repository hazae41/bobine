import { readFile } from "node:fs/promises";

const [name] = Deno.args

const code = await readFile(name, "utf8");
const body = JSON.stringify({ code });

await fetch("http://bob.localhost:8080/api/execute", { method: "POST", body });

const data = new TextEncoder().encode(code)
const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", data)).toHex()

console.log(hash)