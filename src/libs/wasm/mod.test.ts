import { Readable } from "@hazae41/binary";
import { Cursor } from "@hazae41/cursor";
import { readFileSync } from "node:fs";
import process from "node:process";
import { Module, Section } from "./mod.ts";

for (const path of process.argv.slice(2)) {
  const start = performance.now()

  const input = readFileSync(path)

  const module = Module.readOrThrow(new Cursor(input))

  for (const section of module.body.sections) {
    if (section.type !== Section.CodeSection.type)
      continue
    const code = Readable.readFromBytesOrThrow(Section.CodeSection, section.data)
    const cost = code.functions.reduce((a, b) => a + b.instructions.length, 0)
    console.log(cost)
  }

  const until = performance.now()

  console.log(`Parsed ${path} in ${(until - start).toFixed(2)}ms`)
}

// const u128 = Writable.writeToBytesOrThrow(new LEB128.U64(128n))
// console.log(u128, Readable.readFromBytesOrThrow(LEB128.U64, u128))

// const in1 = Writable.writeToBytesOrThrow(new LEB128.I64(-1n))
// console.log(in1, Readable.readFromBytesOrThrow(LEB128.I64, in1))
