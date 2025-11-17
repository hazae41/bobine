import { Writable } from "@hazae41/binary";
import { Cursor } from "@hazae41/cursor";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import process from "node:process";
import { Module, TagSection } from "./mod.ts";

for (const path of process.argv.slice(2)) {
  const start = performance.now()

  const input = readFileSync(path)

  const module = Module.readOrThrow(new Cursor(input))

  const output = Writable.writeToBytesOrThrow(module)

  Module.readOrThrow(new Cursor(output))

  console.log(module.body.sections.find(section => section.kind === TagSection.kind))

  if (Buffer.compare(Buffer.from(input), Buffer.from(output)) !== 0)
    console.log(`Mismatch for ${path}`)

  const until = performance.now()

  console.log(`Parsed ${path} in ${(until - start).toFixed(2)}ms`)
}