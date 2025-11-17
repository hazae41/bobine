import { Writable } from "@hazae41/binary";
import { Cursor } from "@hazae41/cursor";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import process from "node:process";
import { LEB128, Module } from "./mod.ts";

for (const path of process.argv.slice(2)) {
  const start = performance.now()

  const input = readFileSync(path)

  const module = Module.readOrThrow(new Cursor(input))

  const output = Writable.writeToBytesOrThrow(module)

  console.log(Buffer.compare(Buffer.from(input), Buffer.from(output)) === 0 ? "✅" : "❌")

  console.log(module.body.table["1"]?.descriptors)

  // writeFileSync("./a.txt", input.toHex())
  // writeFileSync("./b.txt", output.toHex())

  const until = performance.now()

  console.log(`Parsed ${path} in ${(until - start).toFixed(2)}ms`)
}

const leb = LEB128.I33.readOrThrow(new Cursor(Uint8Array.fromHex("4041d00841900941d600")))

console.log(Writable.writeToBytesOrThrow(leb).toHex())
