import { CodeSection, ExportSection, ImportSection, Instruction, LEB128, type Module, StartSection, TypeSection } from "../wasm/mod.ts";

export function meter(module: Module, from: string, name: string) {
  const wtype = module.body.sections.find(section => section.kind === TypeSection.kind) as TypeSection
  const wimport = module.body.sections.find(section => section.kind === ImportSection.kind) as ImportSection
  const wexport = module.body.sections.find(section => section.kind === ExportSection.kind) as ExportSection
  const wcode = module.body.sections.find(section => section.kind === CodeSection.kind) as CodeSection

  if (wtype == null)
    throw new Error(`No type section`)
  if (wimport == null)
    throw new Error(`No import section`)
  if (wexport == null)
    throw new Error(`No export section`)
  if (wcode == null)
    throw new Error(`No code section`)

  const wstart = module.body.sections.find(section => section.kind === StartSection.kind) as StartSection

  wtype.descriptors.push({ prefix: TypeSection.FuncType.kind, subtypes: [], body: new TypeSection.FuncType([0x7f], []) })

  wimport.descriptors.unshift({ from: new TextEncoder().encode(from), name: new TextEncoder().encode(name), body: new ImportSection.FunctionImport(wtype.descriptors.length - 1) })

  if (wstart != null)
    wstart.funcidx++

  for (const body of wcode.bodies) {
    const instructions = new Array<Instruction>()

    const subinstructions = new Array<Instruction>()

    for (const instruction of body.instructions) {
      if ([0x10, 0x12, 0xd2].includes(instruction.opcode))
        (instruction.params[0] as LEB128.U32).value++

      if ([0x03, 0x04, 0x05, 0x0B, 0x0c, 0x0D, 0x0E, 0x0F, 0xd5, 0xd6].includes(instruction.opcode)) {
        subinstructions.push(instruction)

        instructions.push(new Instruction(0x41, [new LEB128.I32(subinstructions.length)]))
        instructions.push(new Instruction(0x10, [new LEB128.U32(0)]))

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