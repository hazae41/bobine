/// <reference types="../libs/bytes/lib.d.ts"/>

import { Readable, Writable } from "@hazae41/binary"
import { generate } from "../libs/effort/mod"
import { Pack } from "../libs/packs/mod"

async function execute(module: string, method: string, params: Uint8Array<ArrayBuffer>) {
  const body = new FormData()
  body.append("module", module)
  body.append("method", method)
  body.append("params", new Blob([params]))
  body.append("effort", new Blob([await generate(10n ** 6n)]))

  const start = performance.now()

  const response = await fetch("https://bob0.deno0.hazae41.me/api/execute", { method: "POST", body });

  const until = performance.now()

  if (!response.ok)
    throw new Error("Failed", { cause: response })

  const result = Readable.readFromBytesOrThrow(Pack, await response.bytes())

  console.log(result)

  console.log(`Executed in ${(until - start).toFixed(2)}ms`)

  return result.values
}

async function ed25519(module: string, method: string, params: Uint8Array<ArrayBuffer>) {
  const ed25519 = "e303c3a6918df68d71fba155b5f184035d3a178324973b4055bbd6f270a19a4b"

  const signer = await crypto.subtle.importKey("pkcs8", Uint8Array.fromBase64("MC4CAQAwBQYDK2VwBCIEIOZmpSIQYsiOya6stoqWQ2cOBcuN0F/AmmU2c0wldqXb"), "Ed25519", true, ["sign"]);
  const verifier = Uint8Array.fromBase64("QByZynvXGhaEscyTs8L2h8FWBnNIpAq52mE8SkeLSvQ=")

  const address = new Uint8Array(await crypto.subtle.digest("SHA-256", Writable.writeToBytesOrThrow(new Pack([Uint8Array.fromHex(ed25519), verifier])))).slice(-20)

  console.log(address.toHex())

  const [nonce] = await execute(ed25519, "get_nonce", Writable.writeToBytesOrThrow(new Pack([address])))

  const message = Writable.writeToBytesOrThrow(new Pack([Uint8Array.fromHex("8a8f19d1de0e4fcd9ab15cd7ed5de6dd"), Uint8Array.fromHex(module), new TextEncoder().encode(method), params, nonce]))
  const signature = new Uint8Array(await crypto.subtle.sign("Ed25519", signer, message))

  return await execute(ed25519, "call", Writable.writeToBytesOrThrow(new Pack([Uint8Array.fromHex(module), new TextEncoder().encode(method), params, verifier, signature])))
}

const [module, method, ...params] = process.argv.slice(2)

function parse(texts: string[]): Pack {
  const values = new Array<Pack.Value>()

  for (const text of texts) {
    if (text.startsWith("0x")) {
      values.push(Uint8Array.fromHex(text.slice(2)))
      continue
    }

    if (text.endsWith("n")) {
      values.push(BigInt(text.slice(0, -1)))
      continue
    }

    values.push(Number(text))
    continue
  }

  return new Pack(values)
}

await ed25519(module, method, Writable.writeToBytesOrThrow(parse(params)))