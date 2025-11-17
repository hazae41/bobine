import { LEB128, type Module, Section } from "../wasm/mod.ts";

export function meter(module: Module, from: string, name: string) {
  const wtype = module.body.sections.find(section => section.kind === Section.TypeSection.kind) as Section.TypeSection
  const wimport = module.body.sections.find(section => section.kind === Section.ImportSection.kind) as Section.ImportSection
  const wcode = module.body.sections.find(section => section.kind === Section.CodeSection.kind) as Section.CodeSection

  if (wtype == null)
    throw new Error(`No type section`)
  if (wimport == null)
    throw new Error(`No import section`)
  if (wcode == null)
    throw new Error(`No code section`)

  const wstart = module.body.sections.find(section => section.kind === Section.StartSection.kind) as Section.StartSection

  wtype.descriptors.push({ prefix: Section.TypeSection.FuncType.kind, subtypes: [], body: new Section.TypeSection.FuncType([0x7f], []) })

  wimport.descriptors.unshift({ from: new TextEncoder().encode(from), name: new TextEncoder().encode(name), body: new Section.ImportSection.FunctionImport(wtype.descriptors.length - 1) })

  if (wstart != null)
    wstart.funcidx = wstart.funcidx + 1

  for (const func of wcode.bodies) {
    const instructions = new Array<Section.CodeSection.FunctionBody.Instruction>()

    const subinstructions = new Array<Section.CodeSection.FunctionBody.Instruction>()

    for (const instruction of func.instructions) {
      if ([0x10, 0x12, 0xd2].includes(instruction.opcode)) {
        const funcidx = instruction.params[0] as LEB128.U32

        instruction.params.length = 0

        instruction.params.push(new LEB128.U32(funcidx.value + 1))
      }

      if ([0x03, 0x04, 0x05, 0x0B, 0x0c, 0x0D, 0x0E, 0x0F].includes(instruction.opcode)) {
        subinstructions.push(instruction)

        instructions.push(new Section.CodeSection.FunctionBody.Instruction(0x41, [new LEB128.I32(subinstructions.length)]))
        instructions.push(new Section.CodeSection.FunctionBody.Instruction(0x10, [new LEB128.U32(0)]))

        instructions.push(...subinstructions)

        subinstructions.length = 0
      } else {
        subinstructions.push(instruction)
      }
    }

    instructions.push(...subinstructions)

    subinstructions.length = 0

    func.instructions.length = 0
    func.instructions.push(...instructions)

    continue
  }
}