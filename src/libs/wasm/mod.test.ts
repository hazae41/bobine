import { Readable, Writable } from "@hazae41/binary";
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

  const remodule = Module.readOrThrow(new Cursor(output))

  console.log(Buffer.compare(Buffer.from(input), Buffer.from(output)) === 0 ? "✅" : "❌")

  // writeFileSync("./a.txt", input.toHex())
  // writeFileSync("./b.wasm", output)

  const until = performance.now()

  console.log(`Parsed ${path} in ${(until - start).toFixed(2)}ms`)
}

console.log(Readable.readFromBytesOrThrow(LEB128.I64, Writable.writeToBytesOrThrow(new LEB128.I64(-8446744073709551616n))))