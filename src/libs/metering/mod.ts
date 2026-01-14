import * as Wasm from "@hazae41/wasm";

export function meter(module: Wasm.Module, from: string, name: string) {
  let wtype = module.body.sections.find(section => section.kind === Wasm.TypeSection.kind) as Wasm.TypeSection

  if (wtype == null) {
    wtype = new Wasm.TypeSection([])

    module.body.sections.unshift(wtype)
  }

  let wimport = module.body.sections.find(section => section.kind === Wasm.ImportSection.kind) as Wasm.ImportSection

  if (wimport == null) {
    wimport = new Wasm.ImportSection([])

    const before = module.body.sections.findLastIndex(section => section.kind < Wasm.ImportSection.kind)

    module.body.sections.splice(before + 1, 0, wimport)
  }

  let wexport = module.body.sections.find(section => section.kind === Wasm.ExportSection.kind) as Wasm.ExportSection

  if (wexport == null) {
    wexport = new Wasm.ExportSection([])

    const before = module.body.sections.findLastIndex(section => section.kind < Wasm.ExportSection.kind)

    module.body.sections.splice(before + 1, 0, wexport)
  }

  let wcode = module.body.sections.find(section => section.kind === Wasm.CodeSection.kind) as Wasm.CodeSection

  if (wcode == null) {
    wcode = new Wasm.CodeSection([])

    const before = module.body.sections.findLastIndex(section => section.kind < Wasm.CodeSection.kind)

    module.body.sections.splice(before + 1, 0, wcode)
  }

  const welem = module.body.sections.find(section => section.kind === Wasm.ElementSection.kind) as Wasm.ElementSection

  if (welem != null) {
    for (const segment of welem.segments) {
      switch (segment.flag) {
        case 0: {
          for (let i = 0; i < segment.funcidxs.length; i++)
            segment.funcidxs[i]++
          break
        }
        case 1:
        case 2: {
          for (const element of segment.elements) {
            for (const instruction of element) {
              if (instruction.opcode === 0xd2)
                (instruction.params[0] as Wasm.LEB128.U32).value++
            }
          }
          break
        }
      }
    }
  }

  const wstart = module.body.sections.find(section => section.kind === Wasm.StartSection.kind) as Wasm.StartSection

  wtype.descriptors.push({ prefix: Wasm.TypeSection.FuncType.kind, subtypes: [], body: new Wasm.TypeSection.FuncType([0x7f], []) })

  wimport.descriptors.unshift({ from: new TextEncoder().encode(from), name: new TextEncoder().encode(name), body: new Wasm.ImportSection.FunctionImport(wtype.descriptors.length - 1) })

  if (wstart != null)
    wstart.funcidx++

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
    }

    instructions.push(...subinstructions)

    body.instructions = instructions

    continue
  }


  for (const descriptor of wexport.descriptors) {
    if (descriptor.kind !== 0x00)
      continue
    descriptor.xidx++
  }
}