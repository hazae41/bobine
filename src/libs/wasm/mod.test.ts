import { Readable, Writable } from "@hazae41/binary";
import { Cursor } from "@hazae41/cursor";
import { readFileSync } from "node:fs";
import { LEB128, Module, Section } from "./mod.ts";

const input = readFileSync("./test/as/bin/storage/mod.wasm")

const module = Module.readOrThrow(new Cursor(input))

for (const section of module.body.sections) {
  if (section.type !== Section.CodeSection.type)
    continue
  const code = Readable.readFromBytesOrThrow(Section.CodeSection, section.data)

  for (const func of code.functions) {
    for (const instruction of func.instructions) {
      console.log(instruction)
    }
  }
}

const u128 = Writable.writeToBytesOrThrow(new LEB128.U64(128n))
console.log(u128, Readable.readFromBytesOrThrow(LEB128.U64, u128))

const in1 = Writable.writeToBytesOrThrow(new LEB128.I64(-1n))
console.log(in1, Readable.readFromBytesOrThrow(LEB128.I64, in1))
