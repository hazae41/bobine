/// <reference types="../libs/bytes/lib.d.ts"/>

import { Readable, Writable } from "@hazae41/binary";
import { Pack } from "../libs/packs/mod.ts";

async function execute(module: string, method: string, params: Uint8Array<ArrayBuffer>) {
  const body = new FormData()
  body.append("module", module)
  body.append("method", method)
  body.append("params", new Blob([params]))

  const start = performance.now()

  const response = await fetch("http://localhost:8080/api/execute", { method: "POST", body });

  const until = performance.now()

  if (!response.ok)
    throw new Error("Failed", { cause: response })

  const result = Readable.readFromBytesOrThrow(Pack, await response.bytes())

  console.log(result)

  console.log(`Executed in ${(until - start).toFixed(2)}ms`)

  return result
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

await execute(module, method, Writable.writeToBytesOrThrow(parse(params)))