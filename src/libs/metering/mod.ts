import * as Wasm from "@hazae41/wasm";
import { Nullable } from "../nullable/mod.ts";

export function meter(module: Wasm.Module, from: string, name: string) {
  let wtype = module.body.sections.find(section => section.kind === Wasm.TypeSection.kind) as Nullable<Wasm.TypeSection>

  let wimport = module.body.sections.find(section => section.kind === Wasm.ImportSection.kind) as Nullable<Wasm.ImportSection>

  const wexport = module.body.sections.find(section => section.kind === Wasm.ExportSection.kind) as Nullable<Wasm.ExportSection>

  const wcode = module.body.sections.find(section => section.kind === Wasm.CodeSection.kind) as Nullable<Wasm.CodeSection>

  const welem = module.body.sections.find(section => section.kind === Wasm.ElementSection.kind) as Nullable<Wasm.ElementSection>

  const wstart = module.body.sections.find(section => section.kind === Wasm.StartSection.kind) as Nullable<Wasm.StartSection>

  if (wtype == null) {
    wtype = new Wasm.TypeSection([])

    module.body.sections.unshift(wtype)
  }

  if (wimport == null) {
    wimport = new Wasm.ImportSection([])

    const before = module.body.sections.findLastIndex(section => section.kind < Wasm.ImportSection.kind)

    module.body.sections.splice(before + 1, 0, wimport)
  }

  wtype.descriptors.push({ prefix: Wasm.TypeSection.FuncType.kind, subtypes: [], body: new Wasm.TypeSection.FuncType([0x7f], []) })

  wimport.descriptors.unshift({ from: new TextEncoder().encode(from), name: new TextEncoder().encode(name), body: new Wasm.ImportSection.FunctionImport(wtype.descriptors.length - 1) })

  if (wstart != null)
    wstart.funcidx++

  if (welem != null) {
    for (const segment of welem.segments) {
      switch (segment.flag) {
        case 0: {
          for (let i = 0; i < segment.funcidxs.length; i++) {
            segment.funcidxs[i]++
            continue
          }

          for (const instruction of segment.instructions) {
            if (![0xd2].includes(instruction.opcode))
              continue

            (instruction.params[0] as Wasm.LEB128.U32).value++

            continue
          }

          break
        }

        case 1: {
          for (const element of segment.elements) {
            for (const instruction of element) {
              if (![0xd2].includes(instruction.opcode))
                continue

              (instruction.params[0] as Wasm.LEB128.U32).value++

              continue
            }

            continue
          }

          break
        }

        case 2: {
          for (const instruction of segment.instructions) {
            if (![0xd2].includes(instruction.opcode))
              continue

            (instruction.params[0] as Wasm.LEB128.U32).value++

            continue
          }

          for (const element of segment.elements) {
            for (const instruction of element) {
              if (![0xd2].includes(instruction.opcode))
                continue

              (instruction.params[0] as Wasm.LEB128.U32).value++

              continue
            }

            continue
          }

          break
        }

        case 3: {
          for (const element of segment.elements) {
            for (const instruction of element) {
              if (![0xd2].includes(instruction.opcode))
                continue

              (instruction.params[0] as Wasm.LEB128.U32).value++

              continue
            }

            continue
          }

          break
        }

        case 4: {
          for (let i = 0; i < segment.funcidxs.length; i++) {
            segment.funcidxs[i]++
            continue
          }

          for (const instruction of segment.instructions) {
            if (![0xd2].includes(instruction.opcode))
              continue

            (instruction.params[0] as Wasm.LEB128.U32).value++

            continue
          }

          break
        }

        case 5: {
          for (let i = 0; i < segment.funcidxs.length; i++) {
            segment.funcidxs[i]++
            continue
          }

          break
        }

        case 6: {
          for (let i = 0; i < segment.funcidxs.length; i++) {
            segment.funcidxs[i]++
            continue
          }

          for (const instruction of segment.instructions) {
            if (![0xd2].includes(instruction.opcode))
              continue

            (instruction.params[0] as Wasm.LEB128.U32).value++

            continue
          }

          break
        }

        case 7: {
          for (let i = 0; i < segment.funcidxs.length; i++) {
            segment.funcidxs[i]++
            continue
          }

          break
        }
      }

      continue
    }
  }

  if (wcode != null) {
    for (const body of wcode.bodies) {
      const instructions = new Array<Wasm.Instruction>()

      const subinstructions = new Array<Wasm.Instruction>()

      for (const instruction of body.instructions) {
        if ([0x10, 0x12, 0xd2].includes(instruction.opcode))
          (instruction.params[0] as Wasm.LEB128.U32).value++

        if ([0x03, 0x04, 0x05, 0x0B, 0x0c, 0x0D, 0x0E, 0x0F, 0xd5, 0xd6].includes(instruction.opcode)) {
          subinstructions.push(instruction)

          instructions.push(new Wasm.Instruction(0x41, [new Wasm.LEB128.I32(subinstructions.length)]))
          instructions.push(new Wasm.Instruction(0x10, [new Wasm.LEB128.U32(0)]))

          instructions.push(...subinstructions)

          subinstructions.length = 0
        } else {
          subinstructions.push(instruction)
        }

        continue
      }

      instructions.push(...subinstructions)

      body.instructions = instructions

      continue
    }
  }

  if (wexport != null) {
    for (const descriptor of wexport.descriptors) {
      if (descriptor.kind !== 0x00)
        continue

      descriptor.xidx++

      continue
    }
  }
}