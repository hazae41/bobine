import { Writable } from "@hazae41/binary";
import { Cursor } from "@hazae41/cursor";
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { LEB128, Module, Section } from "./mod.ts";

for (const path of process.argv.slice(2)) {
  const start = performance.now()

  const input = readFileSync(path)

  const module = Module.readOrThrow(new Cursor(input))

  const typelen = module.body.table[Section.TypeSection.kind]!.descriptors.push({ prefix: Section.TypeSection.FuncType.kind, subtypes: [], body: new Section.TypeSection.FuncType([0x7f], []) })
  const importlen = module.body.table[Section.ImportSection.kind]!.descriptors.push({ from: new TextEncoder().encode("env"), name: new TextEncoder().encode("imported_func"), body: new Section.ImportSection.FunctionImport(typelen - 1) })

  const output = Writable.writeToBytesOrThrow(module)

  console.log(output.slice(0, 8).toHex())

  const remodule = Module.readOrThrow(new Cursor(output))

  // console.log(Buffer.compare(Buffer.from(input), Buffer.from(output)) === 0 ? "✅" : "❌")

  console.log(remodule.body.table["1"]?.descriptors)
  console.log(remodule.body.table["2"]?.descriptors)
  console.log(remodule.body.table["8"]?.funcidx)

  // writeFileSync("./a.txt", input.toHex())
  writeFileSync("./b.wasm", output)

  const until = performance.now()

  console.log(`Parsed ${path} in ${(until - start).toFixed(2)}ms`)
}

const leb = LEB128.I33.readOrThrow(new Cursor(Uint8Array.fromHex("4041d00841900941d600")))

console.log(Writable.writeToBytesOrThrow(leb).toHex())
