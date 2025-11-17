import { Readable, Writable } from "@hazae41/binary";
import { Cursor } from "@hazae41/cursor";
import { Nullable } from "../nullable/mod.ts";

export class Module {

  constructor(
    public head: Head,
    public body: Body
  ) { }

  sizeOrThrow(): number {
    return this.head.sizeOrThrow() + this.body.sizeOrThrow()
  }

  writeOrThrow(cursor: Cursor) {
    this.head.writeOrThrow(cursor)
    this.body.writeOrThrow(cursor)
  }

}

export namespace Module {

  export function readOrThrow(cursor: Cursor) {
    const head = Head.readOrThrow(cursor)
    const body = Body.readOrThrow(cursor)

    return new Module(head, body)
  }

}

export class Head {

  constructor(
    public version: number
  ) { }

  sizeOrThrow(): number {
    return 4 + 4
  }

  writeOrThrow(cursor: Cursor) {
    cursor.writeUint32OrThrow(1836278016, true)
    cursor.writeUint32OrThrow(this.version, true)
  }

}

export namespace Head {

  export function readOrThrow(cursor: Cursor) {
    const magic = cursor.readUint32OrThrow(true)

    if (magic !== 1836278016)
      throw new Error("Invalid magic number")

    const version = cursor.readUint32OrThrow(true)

    if (version !== 1)
      throw new Error("Unsupported version")

    return new Head(version)
  }

}

export class Body {

  constructor(
    public sections: Section[]
  ) { }

  sizeOrThrow(): number {
    let size = 0

    for (const section of this.sections)
      size += 1 + new LEB128.U32(section.sizeOrThrow()).sizeOrThrow() + section.sizeOrThrow()

    return size
  }

  writeOrThrow(cursor: Cursor) {
    for (const section of this.sections) {
      cursor.writeUint8OrThrow(section.kind)

      new LEB128.U32(section.sizeOrThrow()).writeOrThrow(cursor)

      section.writeOrThrow(cursor)
    }
  }

}

export namespace Body {

  export function readOrThrow(cursor: Cursor) {
    const sections = new Array<Section>()

    while (cursor.remaining > 0) {
      const kind = cursor.readUint8OrThrow()

      const size = LEB128.U32.readOrThrow(cursor)

      const data = cursor.readOrThrow(size.value)

      if (kind === CustomSection.kind) {
        const section = Readable.readFromBytesOrThrow(CustomSection, data)

        sections.push(section)

        continue
      }

      if (kind === TypeSection.kind) {
        const section = Readable.readFromBytesOrThrow(TypeSection, data)

        sections.push(section)

        continue
      }

      if (kind === ImportSection.kind) {
        const section = Readable.readFromBytesOrThrow(ImportSection, data)

        sections.push(section)

        continue
      }

      if (kind === FunctionSection.kind) {
        const section = Readable.readFromBytesOrThrow(FunctionSection, data)

        sections.push(section)

        continue
      }

      if (kind === TableSection.kind) {
        const section = Readable.readFromBytesOrThrow(TableSection, data)

        sections.push(section)

        continue
      }

      if (kind === MemorySection.kind) {
        const section = Readable.readFromBytesOrThrow(MemorySection, data)

        sections.push(section)

        continue
      }

      if (kind === GlobalSection.kind) {
        const section = Readable.readFromBytesOrThrow(GlobalSection, data)

        sections.push(section)

        continue
      }

      if (kind === ExportSection.kind) {
        const section = Readable.readFromBytesOrThrow(ExportSection, data)

        sections.push(section)

        continue
      }

      if (kind === StartSection.kind) {
        const section = Readable.readFromBytesOrThrow(StartSection, data)

        sections.push(section)

        continue
      }

      if (kind === ElementSection.kind) {
        const section = Readable.readFromBytesOrThrow(ElementSection, data)

        sections.push(section)

        continue
      }

      if (kind === CodeSection.kind) {
        const section = Readable.readFromBytesOrThrow(CodeSection, data)

        sections.push(section)

        continue
      }

      sections.push(new UnknownSection(kind, data))

      continue
    }

    return new Body(sections)
  }

}

export type Section =
  | UnknownSection
  | CustomSection
  | TypeSection
  | ImportSection
  | FunctionSection
  | TableSection
  | GlobalSection
  | MemorySection
  | ExportSection
  | StartSection
  | ElementSection
  | CodeSection

export class UnknownSection {

  constructor(
    public kind: number,
    public data: Uint8Array
  ) { }

  sizeOrThrow(): number {
    return this.data.length
  }

  writeOrThrow(cursor: Cursor) {
    cursor.writeOrThrow(this.data)
  }

}

export class CustomSection {

  constructor(
    public name: Uint8Array,
    public data: Uint8Array
  ) { }

  get kind() {
    return CustomSection.kind
  }

  sizeOrThrow(): number {
    return new LEB128.U32(this.name.length).sizeOrThrow() + this.name.length + this.data.length
  }

  writeOrThrow(cursor: Cursor) {
    new LEB128.U32(this.name.length).writeOrThrow(cursor)

    cursor.writeOrThrow(this.name)

    cursor.writeOrThrow(this.data)
  }

}

export namespace CustomSection {

  export const kind = 0

  export function readOrThrow(cursor: Cursor) {
    const size = LEB128.U32.readOrThrow(cursor)

    const name = cursor.readOrThrow(size.value)

    const data = cursor.readOrThrow(cursor.remaining)

    return new CustomSection(name, data)
  }

}

export class TypeSection {

  constructor(
    public descriptors: TypeSection.TypeDescriptor[]
  ) { }

  get kind() {
    return TypeSection.kind
  }

  sizeOrThrow(): number {
    let size = 0

    size += new LEB128.U32(this.descriptors.length).sizeOrThrow()

    for (const descriptor of this.descriptors) {
      size += 1

      if (descriptor.prefix === TypeSection.FuncType.kind) {
        size += descriptor.body.sizeOrThrow()
        continue
      }

      if (descriptor.prefix === 0x4E || descriptor.prefix === 0x4D) {
        size += new LEB128.U32(descriptor.subtypes.length).sizeOrThrow()

        for (const subtype of descriptor.subtypes)
          size += new LEB128.U32(subtype).sizeOrThrow()

        // NOOP
      }

      size += 1

      size += descriptor.body.sizeOrThrow()
      continue
    }

    return size
  }

  writeOrThrow(cursor: Cursor) {
    new LEB128.U32(this.descriptors.length).writeOrThrow(cursor)

    for (const descriptor of this.descriptors) {
      cursor.writeUint8OrThrow(descriptor.prefix)

      if (descriptor.prefix === TypeSection.FuncType.kind) {
        descriptor.body.writeOrThrow(cursor)
        continue
      }

      if (descriptor.prefix === 0x4E || descriptor.prefix === 0x4D) {
        new LEB128.U32(descriptor.subtypes.length).writeOrThrow(cursor)

        for (const subtype of descriptor.subtypes)
          new LEB128.U32(subtype).writeOrThrow(cursor)

        // NOOP
      }

      cursor.writeUint8OrThrow(descriptor.body.kind)

      descriptor.body.writeOrThrow(cursor)
      continue
    }

    return
  }

}

export namespace TypeSection {

  export const kind = 0x01

  export interface TypeDescriptor {
    prefix: number
    subtypes: number[]
    body: TypeBody
  }

  export function readOrThrow(cursor: Cursor) {
    const count = LEB128.U32.readOrThrow(cursor)

    const types = new Array<TypeDescriptor>()

    for (let i = 0; i < count.value; i++) {
      const prefix = cursor.readUint8OrThrow()

      if (prefix === FuncType.kind) {
        const body = FuncType.readOrThrow(cursor)
        types.push({ prefix, subtypes: [], body })
        continue
      }

      const subtypes = new Array<number>()

      if (prefix === 0x4E || prefix === 0x4D) {
        const subcount = LEB128.U32.readOrThrow(cursor)

        for (let j = 0; j < subcount.value; j++)
          subtypes.push(LEB128.U32.readOrThrow(cursor).value)

        // NOOP
      }

      const kind = cursor.readUint8OrThrow()

      if (kind === FuncType.kind) {
        const body = FuncType.readOrThrow(cursor)
        types.push({ prefix, subtypes, body })
        continue
      }

      if (kind === StructType.kind) {
        const body = StructType.readOrThrow(cursor)
        types.push({ prefix, subtypes, body })
        continue
      }

      if (kind === ArrayType.kind) {
        const body = ArrayType.readOrThrow(cursor)
        types.push({ prefix, subtypes, body })
        continue
      }

      throw new Error(`Unknown section 0x${kind.toString(16).padStart(2, "0")}`)
    }

    return new TypeSection(types)
  }

  export type TypeBody =
    | FuncType
    | StructType
    | ArrayType

  export class FuncType {

    constructor(
      public params: number[],
      public results: number[]
    ) { }

    get kind() {
      return FuncType.kind
    }

    sizeOrThrow(): number {
      let size = 0

      size += new LEB128.U32(this.params.length).sizeOrThrow()

      size += this.params.length

      size += new LEB128.U32(this.results.length).sizeOrThrow()

      size += this.results.length

      return size
    }

    writeOrThrow(cursor: Cursor) {
      new LEB128.U32(this.params.length).writeOrThrow(cursor)

      for (const param of this.params)
        cursor.writeUint8OrThrow(param)

      new LEB128.U32(this.results.length).writeOrThrow(cursor)

      for (const result of this.results)
        cursor.writeUint8OrThrow(result)

      return
    }

  }

  export namespace FuncType {

    export const kind = 0x60

    export function readOrThrow(cursor: Cursor) {
      const pcount = LEB128.U32.readOrThrow(cursor)

      const params = new Array<number>()

      for (let i = 0; i < pcount.value; i++)
        params.push(cursor.readUint8OrThrow())

      const rcount = LEB128.U32.readOrThrow(cursor)

      const results = new Array<number>()

      for (let i = 0; i < rcount.value; i++)
        results.push(cursor.readUint8OrThrow())

      return new FuncType(params, results)
    }

  }

  export class StructType {

    constructor(
      public fields: [number, boolean][]
    ) { }

    get kind() {
      return StructType.kind
    }

    sizeOrThrow(): number {
      let size = 0

      size += new LEB128.U32(this.fields.length).sizeOrThrow()

      for (const _ of this.fields)
        size += 1 + 1

      return size
    }

    writeOrThrow(cursor: Cursor) {
      new LEB128.U32(this.fields.length).writeOrThrow(cursor)

      for (const [valtype, mutable] of this.fields) {
        cursor.writeUint8OrThrow(valtype)
        cursor.writeUint8OrThrow(mutable ? 1 : 0)
      }

      return
    }

  }

  export namespace StructType {

    export const kind = 0x5E

    export function readOrThrow(cursor: Cursor) {
      const count = LEB128.U32.readOrThrow(cursor)

      const fields = new Array<[number, boolean]>()

      for (let i = 0; i < count.value; i++) {
        const valtype = cursor.readUint8OrThrow()
        const mutable = cursor.readUint8OrThrow() === 1

        fields.push([valtype, mutable])
      }

      return new StructType(fields)
    }

  }

  export class ArrayType {

    constructor(
      public valtype: number,
      public mutable: boolean
    ) { }

    get kind() {
      return ArrayType.kind
    }

    sizeOrThrow(): number {
      return 1 + 1
    }

    writeOrThrow(cursor: Cursor) {
      cursor.writeUint8OrThrow(this.valtype)
      cursor.writeUint8OrThrow(this.mutable ? 1 : 0)
    }

  }

  export namespace ArrayType {

    export const kind = 0x5F

    export function readOrThrow(cursor: Cursor) {
      const valtype = cursor.readUint8OrThrow()
      const mutable = cursor.readUint8OrThrow() === 1

      return new ArrayType(valtype, mutable)
    }

  }

}

export class ImportSection {

  constructor(
    public descriptors: ImportSection.ImportDescriptor[]
  ) { }

  get kind() {
    return ImportSection.kind
  }

  sizeOrThrow(): number {
    let size = 0

    size += new LEB128.U32(this.descriptors.length).sizeOrThrow()

    for (const descriptor of this.descriptors) {
      size += new LEB128.U32(descriptor.from.length).sizeOrThrow() + descriptor.from.length

      size += new LEB128.U32(descriptor.name.length).sizeOrThrow() + descriptor.name.length

      size += 1

      size += descriptor.body.sizeOrThrow()
    }

    return size
  }

  writeOrThrow(cursor: Cursor) {
    new LEB128.U32(this.descriptors.length).writeOrThrow(cursor)

    for (const descriptor of this.descriptors) {
      new LEB128.U32(descriptor.from.length).writeOrThrow(cursor)
      cursor.writeOrThrow(descriptor.from)

      new LEB128.U32(descriptor.name.length).writeOrThrow(cursor)
      cursor.writeOrThrow(descriptor.name)

      cursor.writeUint8OrThrow(descriptor.body.kind)

      descriptor.body.writeOrThrow(cursor)
    }
  }
}

export namespace ImportSection {

  export const kind = 0x02

  export interface ImportDescriptor {
    from: Uint8Array
    name: Uint8Array
    body: ImportBody
  }

  export function readOrThrow(cursor: Cursor) {
    const count = LEB128.U32.readOrThrow(cursor)

    const descriptors = new Array<ImportDescriptor>()

    for (let i = 0; i < count.value; i++) {
      const from = cursor.readOrThrow(LEB128.U32.readOrThrow(cursor).value)
      const name = cursor.readOrThrow(LEB128.U32.readOrThrow(cursor).value)

      const kind = cursor.readUint8OrThrow()

      if (kind === 0x00) {
        const body = FunctionImport.readOrThrow(cursor)
        descriptors.push({ from, name, body })
        continue
      }

      if (kind === 0x01) {
        const body = TableImport.readOrThrow(cursor)
        descriptors.push({ from, name, body })
        continue
      }

      if (kind === 0x02) {
        const body = MemoryImport.readOrThrow(cursor)
        descriptors.push({ from, name, body })
        continue
      }

      if (kind === 0x03) {
        const body = GlobalImport.readOrThrow(cursor)
        descriptors.push({ from, name, body })
        continue
      }

      throw new Error(`Unknown import 0x${kind.toString(16).padStart(2, "0")}`)
    }

    return new ImportSection(descriptors)
  }

  export type ImportBody =
    | FunctionImport
    | TableImport
    | MemoryImport
    | GlobalImport

  export class FunctionImport {

    constructor(
      public typeidx: number
    ) { }

    get kind() {
      return FunctionImport.kind
    }

    sizeOrThrow(): number {
      return new LEB128.U32(this.typeidx).sizeOrThrow()
    }

    writeOrThrow(cursor: Cursor) {
      new LEB128.U32(this.typeidx).writeOrThrow(cursor)
    }

  }

  export namespace FunctionImport {

    export const kind = 0x00

    export function readOrThrow(cursor: Cursor) {
      return new FunctionImport(LEB128.U32.readOrThrow(cursor).value)
    }

  }

  export class TableImport {

    constructor(
      public reftype: number,
      public flag: number,
      public min: number,
      public max: Nullable<number>,
    ) { }

    get kind() {
      return TableImport.kind
    }

    sizeOrThrow(): number {
      let size = 0

      size += 1

      size += 1

      size += new LEB128.U32(this.min).sizeOrThrow()

      if (this.max != null)
        size += new LEB128.U32(this.max).sizeOrThrow()

      return size
    }

    writeOrThrow(cursor: Cursor) {
      cursor.writeUint8OrThrow(this.reftype)

      cursor.writeUint8OrThrow(this.flag)

      new LEB128.U32(this.min).writeOrThrow(cursor)

      if (this.max != null)
        new LEB128.U32(this.max).writeOrThrow(cursor)

      return
    }

  }

  export namespace TableImport {

    export const kind = 0x01

    export function readOrThrow(cursor: Cursor) {
      const reftype = cursor.readUint8OrThrow()

      const flag = cursor.readUint8OrThrow()

      const min = LEB128.U32.readOrThrow(cursor).value
      const max = flag & 0x01 ? LEB128.U32.readOrThrow(cursor).value : null

      return new TableImport(reftype, flag, min, max)
    }

  }

  export class MemoryImport {

    constructor(
      public flag: number,
      public min: number,
      public max: Nullable<number>,
    ) { }

    get kind() {
      return MemoryImport.kind
    }

    sizeOrThrow(): number {
      let size = 1

      size += new LEB128.U32(this.min).sizeOrThrow()

      if (this.max != null)
        size += new LEB128.U32(this.max).sizeOrThrow()

      return size
    }

    writeOrThrow(cursor: Cursor) {
      cursor.writeUint8OrThrow(this.flag)

      new LEB128.U32(this.min).writeOrThrow(cursor)

      if (this.max != null)
        new LEB128.U32(this.max).writeOrThrow(cursor)

      return
    }

  }

  export namespace MemoryImport {

    export const kind = 0x02

    export function readOrThrow(cursor: Cursor) {
      const flag = cursor.readUint8OrThrow()

      const min = LEB128.U32.readOrThrow(cursor)
      const max = flag & 0x01 ? LEB128.U32.readOrThrow(cursor).value : null

      return new MemoryImport(flag, min.value, max)
    }

  }

  export class GlobalImport {

    constructor(
      public valtype: number,
      public mutable: number,
    ) { }

    get kind() {
      return GlobalImport.kind
    }

    sizeOrThrow(): number {
      return 1 + 1
    }

    writeOrThrow(cursor: Cursor) {
      cursor.writeUint8OrThrow(this.valtype)
      cursor.writeUint8OrThrow(this.mutable)
    }

  }

  export namespace GlobalImport {

    export const kind = 0x03

    export function readOrThrow(cursor: Cursor) {
      const valtype = cursor.readUint8OrThrow()
      const mutable = cursor.readUint8OrThrow()

      return new GlobalImport(valtype, mutable)
    }

  }

}

export class FunctionSection {

  constructor(
    public typeidxs: number[]
  ) { }

  get kind() {
    return FunctionSection.kind
  }

  sizeOrThrow(): number {
    let size = 0

    size += new LEB128.U32(this.typeidxs.length).sizeOrThrow()

    for (const typeidx of this.typeidxs)
      size += new LEB128.U32(typeidx).sizeOrThrow()

    return size
  }

  writeOrThrow(cursor: Cursor) {
    new LEB128.U32(this.typeidxs.length).writeOrThrow(cursor)

    for (const typeidx of this.typeidxs)
      new LEB128.U32(typeidx).writeOrThrow(cursor)

    return
  }

}

export namespace FunctionSection {

  export const kind = 0x03

  export function readOrThrow(cursor: Cursor) {
    const count = LEB128.U32.readOrThrow(cursor)

    const typeidxs = new Array<number>()

    for (let i = 0; i < count.value; i++)
      typeidxs.push(LEB128.U32.readOrThrow(cursor).value)

    return new FunctionSection(typeidxs)
  }

}

export class TableSection {

  constructor(
    public descriptors: TableSection.TableDescriptor[]
  ) { }

  get kind() {
    return TableSection.kind
  }

  sizeOrThrow(): number {
    let size = 0

    size += new LEB128.U32(this.descriptors.length).sizeOrThrow()

    for (const descriptor of this.descriptors) {
      size += 1

      size += 1

      size += new LEB128.U32(descriptor.min).sizeOrThrow()

      if (descriptor.max != null)
        size += new LEB128.U32(descriptor.max).sizeOrThrow()

      continue
    }

    return size
  }

  writeOrThrow(cursor: Cursor) {
    new LEB128.U32(this.descriptors.length).writeOrThrow(cursor)

    for (const descriptor of this.descriptors) {
      cursor.writeUint8OrThrow(descriptor.reftype)

      cursor.writeUint8OrThrow(descriptor.flag)

      new LEB128.U32(descriptor.min).writeOrThrow(cursor)

      if (descriptor.max != null)
        new LEB128.U32(descriptor.max).writeOrThrow(cursor)

      continue
    }

    return
  }

}

export namespace TableSection {

  export const kind = 0x04

  export interface TableDescriptor {
    reftype: number
    flag: number
    min: number
    max: Nullable<number>
  }

  export function readOrThrow(cursor: Cursor) {
    const count = LEB128.U32.readOrThrow(cursor)

    const descriptors = new Array<TableDescriptor>()

    for (let i = 0; i < count.value; i++) {
      const reftype = cursor.readUint8OrThrow()

      const flag = cursor.readUint8OrThrow()

      const min = LEB128.U32.readOrThrow(cursor).value
      const max = flag & 0x01 ? LEB128.U32.readOrThrow(cursor).value : null

      descriptors.push({ reftype, flag, min, max })
    }

    return new TableSection(descriptors)
  }

}

export class MemorySection {

  constructor(
    public descriptors: MemorySection.MemoryDescriptor[]
  ) { }

  get kind() {
    return MemorySection.kind
  }

  sizeOrThrow(): number {
    let size = 0

    size += new LEB128.U32(this.descriptors.length).sizeOrThrow()

    for (const descriptor of this.descriptors) {
      size += 1

      size += new LEB128.U32(descriptor.min).sizeOrThrow()

      if (descriptor.max != null)
        size += new LEB128.U32(descriptor.max).sizeOrThrow()

      continue
    }

    return size
  }

  writeOrThrow(cursor: Cursor) {
    new LEB128.U32(this.descriptors.length).writeOrThrow(cursor)

    for (const descriptor of this.descriptors) {
      cursor.writeUint8OrThrow(descriptor.flag)

      new LEB128.U32(descriptor.min).writeOrThrow(cursor)

      if (descriptor.max != null)
        new LEB128.U32(descriptor.max).writeOrThrow(cursor)

      continue
    }

    return
  }

}

export namespace MemorySection {

  export const kind = 0x05

  export interface MemoryDescriptor {
    flag: number
    min: number
    max: Nullable<number>
  }

  export function readOrThrow(cursor: Cursor) {
    const count = LEB128.U32.readOrThrow(cursor)

    const descriptors = new Array<MemoryDescriptor>()

    for (let i = 0; i < count.value; i++) {
      const flag = cursor.readUint8OrThrow()

      const min = LEB128.U32.readOrThrow(cursor).value
      const max = flag & 0x01 ? LEB128.U32.readOrThrow(cursor).value : null

      descriptors.push({ flag, min, max })
    }

    return new MemorySection(descriptors)
  }

}

export class GlobalSection {

  constructor(
    public descriptors: GlobalSection.GlobalDescriptor[]
  ) { }

  get kind() {
    return GlobalSection.kind
  }

  sizeOrThrow(): number {
    let size = 0

    size += new LEB128.U32(this.descriptors.length).sizeOrThrow()

    for (const descriptor of this.descriptors) {
      size += 1
      size += 1

      for (const instruction of descriptor.instructions)
        size += instruction.sizeOrThrow()

      continue
    }

    return size
  }

  writeOrThrow(cursor: Cursor) {
    new LEB128.U32(this.descriptors.length).writeOrThrow(cursor)

    for (const descriptor of this.descriptors) {
      cursor.writeUint8OrThrow(descriptor.valtype)
      cursor.writeUint8OrThrow(descriptor.mutable)

      for (const instruction of descriptor.instructions)
        instruction.writeOrThrow(cursor)

      continue
    }

    return
  }

}

export namespace GlobalSection {

  export const kind = 0x06

  export interface GlobalDescriptor {

    valtype: number
    mutable: number

    instructions: Instruction[]

  }

  export function readOrThrow(cursor: Cursor) {
    const count = LEB128.U32.readOrThrow(cursor)

    const descriptors = new Array<GlobalDescriptor>()

    for (let i = 0; i < count.value; i++) {
      const valtype = cursor.readUint8OrThrow()
      const mutable = cursor.readUint8OrThrow()

      const instructions = new Array<Instruction>()

      while (true) {
        const instruction = Instruction.readOrThrow(cursor)

        instructions.push(instruction)

        if (instruction.opcode === 0x0b)
          break

        continue
      }

      descriptors.push({ valtype, mutable, instructions })
    }

    return new GlobalSection(descriptors)
  }

}

export class ExportSection {

  constructor(
    public descriptors: ExportSection.ExportDescriptor[]
  ) { }

  get kind() {
    return ExportSection.kind
  }

  sizeOrThrow(): number {
    let size = 0

    size += new LEB128.U32(this.descriptors.length).sizeOrThrow()

    for (const descriptor of this.descriptors) {
      size += new LEB128.U32(descriptor.name.length).sizeOrThrow()

      size += descriptor.name.length

      size += 1

      size += new LEB128.U32(descriptor.xidx).sizeOrThrow()
    }

    return size
  }

  writeOrThrow(cursor: Cursor) {
    new LEB128.U32(this.descriptors.length).writeOrThrow(cursor)

    for (const descriptor of this.descriptors) {
      new LEB128.U32(descriptor.name.length).writeOrThrow(cursor)

      cursor.writeOrThrow(descriptor.name)

      cursor.writeUint8OrThrow(descriptor.kind)

      new LEB128.U32(descriptor.xidx).writeOrThrow(cursor)
    }

    return
  }
}

export namespace ExportSection {

  export const kind = 0x07

  export interface ExportDescriptor {

    name: Uint8Array

    kind: number

    xidx: number

  }

  export function readOrThrow(cursor: Cursor) {
    const count = LEB128.U32.readOrThrow(cursor)

    const exports = new Array<ExportDescriptor>()

    for (let i = 0; i < count.value; i++) {
      const name = cursor.readOrThrow(LEB128.U32.readOrThrow(cursor).value)
      const kind = cursor.readUint8OrThrow()
      const xidx = LEB128.U32.readOrThrow(cursor).value

      exports.push({ name, kind, xidx })
    }

    return new ExportSection(exports)
  }

}

export class StartSection {

  constructor(
    public funcidx: number
  ) { }

  get kind() {
    return StartSection.kind
  }

  sizeOrThrow(): number {
    return new LEB128.U32(this.funcidx).sizeOrThrow()
  }

  writeOrThrow(cursor: Cursor) {
    new LEB128.U32(this.funcidx).writeOrThrow(cursor)
  }

}

export namespace StartSection {

  export const kind = 0x08

  export function readOrThrow(cursor: Cursor) {
    return new StartSection(LEB128.U32.readOrThrow(cursor).value)
  }

}

export class ElementSection {

  constructor(
    public segments: ElementSection.ElementSegment[]
  ) { }

  get kind() {
    return ElementSection.kind
  }

  sizeOrThrow(): number {
    let size = 0

    size += new LEB128.U32(this.segments.length).sizeOrThrow()

    for (const segment of this.segments) {
      size += 1

      if (segment.flag === 0) {
        for (const instruction of segment.instructions)
          size += instruction.sizeOrThrow()

        size += new LEB128.U32(segment.funcidxs.length).sizeOrThrow()

        for (const funcidx of segment.funcidxs)
          size += new LEB128.U32(funcidx).sizeOrThrow()

        continue
      }

      if (segment.flag === 1) {
        size += 1

        size += new LEB128.U32(segment.elements.length).sizeOrThrow()

        for (const instructions of segment.elements)
          for (const instruction of instructions)
            size += instruction.sizeOrThrow()

        continue
      }

      if (segment.flag === 2) {
        size += new LEB128.U32(segment.tableidx).sizeOrThrow()

        for (const instruction of segment.instructions)
          size += instruction.sizeOrThrow()

        size += 1

        size += new LEB128.U32(segment.elements.length).sizeOrThrow()

        for (const instructions of segment.elements)
          for (const instruction of instructions)
            size += instruction.sizeOrThrow()

        continue
      }

      if (segment.flag === 3) {
        size += 1

        size += new LEB128.U32(segment.elements.length).sizeOrThrow()

        for (const instructions of segment.elements)
          for (const instruction of instructions)
            size += instruction.sizeOrThrow()

        continue
      }

      if (segment.flag === 4) {
        for (const instruction of segment.instructions)
          size += instruction.sizeOrThrow()

        size += new LEB128.U32(segment.funcidxs.length).sizeOrThrow()

        for (const funcidx of segment.funcidxs)
          size += new LEB128.U32(funcidx).sizeOrThrow()

        continue
      }

      if (segment.flag === 5) {
        size += 1

        size += new LEB128.U32(segment.funcidxs.length).sizeOrThrow()

        for (const funcidx of segment.funcidxs)
          size += new LEB128.U32(funcidx).sizeOrThrow()

        continue
      }

      if (segment.flag === 6) {
        size += new LEB128.U32(segment.tableidx).sizeOrThrow()

        for (const instruction of segment.instructions)
          size += instruction.sizeOrThrow()

        size += 1

        size += new LEB128.U32(segment.funcidxs.length).sizeOrThrow()

        for (const funcidx of segment.funcidxs)
          size += new LEB128.U32(funcidx).sizeOrThrow()

        continue
      }

      if (segment.flag === 7) {
        size += 1

        size += new LEB128.U32(segment.funcidxs.length).sizeOrThrow()

        for (const funcidx of segment.funcidxs)
          size += new LEB128.U32(funcidx).sizeOrThrow()

        continue
      }
    }

    return size
  }

  writeOrThrow(cursor: Cursor) {
    new LEB128.U32(this.segments.length).writeOrThrow(cursor)

    for (const segment of this.segments) {
      cursor.writeUint8OrThrow(segment.flag)

      if (segment.flag === 0) {
        for (const instruction of segment.instructions)
          instruction.writeOrThrow(cursor)

        new LEB128.U32(segment.funcidxs.length).writeOrThrow(cursor)

        for (const funcidx of segment.funcidxs)
          new LEB128.U32(funcidx).writeOrThrow(cursor)

        continue
      }

      if (segment.flag === 1) {
        cursor.writeUint8OrThrow(segment.reftype)

        new LEB128.U32(segment.elements.length).writeOrThrow(cursor)

        for (const instructions of segment.elements)
          for (const instruction of instructions)
            instruction.writeOrThrow(cursor)

        continue
      }

      if (segment.flag === 2) {
        new LEB128.U32(segment.tableidx).writeOrThrow(cursor)

        for (const instruction of segment.instructions)
          instruction.writeOrThrow(cursor)

        cursor.writeUint8OrThrow(segment.reftype)

        new LEB128.U32(segment.elements.length).writeOrThrow(cursor)

        for (const instructions of segment.elements)
          for (const instruction of instructions)
            instruction.writeOrThrow(cursor)

        continue
      }

      if (segment.flag === 3) {
        cursor.writeUint8OrThrow(segment.reftype)

        new LEB128.U32(segment.elements.length).writeOrThrow(cursor)

        for (const instructions of segment.elements)
          for (const instruction of instructions)
            instruction.writeOrThrow(cursor)

        continue
      }

      if (segment.flag === 4) {
        for (const instruction of segment.instructions)
          instruction.writeOrThrow(cursor)

        new LEB128.U32(segment.funcidxs.length).writeOrThrow(cursor)

        for (const funcidx of segment.funcidxs)
          new LEB128.U32(funcidx).writeOrThrow(cursor)

        continue
      }

      if (segment.flag === 5) {
        cursor.writeUint8OrThrow(segment.reftype)

        new LEB128.U32(segment.funcidxs.length).writeOrThrow(cursor)

        for (const funcidx of segment.funcidxs)
          new LEB128.U32(funcidx).writeOrThrow(cursor)

        continue
      }

      if (segment.flag === 6) {
        new LEB128.U32(segment.tableidx).writeOrThrow(cursor)

        for (const instruction of segment.instructions)
          instruction.writeOrThrow(cursor)

        cursor.writeUint8OrThrow(segment.reftype)

        new LEB128.U32(segment.funcidxs.length).writeOrThrow(cursor)

        for (const funcidx of segment.funcidxs)
          new LEB128.U32(funcidx).writeOrThrow(cursor)

        continue
      }

      if (segment.flag === 7) {
        cursor.writeUint8OrThrow(segment.reftype)

        new LEB128.U32(segment.funcidxs.length).writeOrThrow(cursor)

        for (const funcidx of segment.funcidxs)
          new LEB128.U32(funcidx).writeOrThrow(cursor)

        continue
      }
    }
  }
}

export namespace ElementSection {

  export const kind = 0x09

  export type ElementSegment =
    | { flag: 0, instructions: Instruction[], funcidxs: number[] }
    | { flag: 1, reftype: number, elements: Instruction[][] }
    | { flag: 2, tableidx: number, instructions: Instruction[], reftype: number, elements: Instruction[][] }
    | { flag: 3, reftype: number, elements: Instruction[][] }
    | { flag: 4, instructions: Instruction[], funcidxs: number[] }
    | { flag: 5, reftype: number, funcidxs: number[] }
    | { flag: 6, tableidx: number, instructions: Instruction[], reftype: number, funcidxs: number[] }
    | { flag: 7, reftype: number, funcidxs: number[] }

  export function readOrThrow(cursor: Cursor) {
    const count = LEB128.U32.readOrThrow(cursor)

    const segments = new Array<ElementSegment>()

    for (let i = 0; i < count.value; i++) {
      const flag = cursor.readUint8OrThrow()

      if (flag === 0) {
        const instructions = new Array<Instruction>()

        while (true) {
          const instruction = Instruction.readOrThrow(cursor)

          instructions.push(instruction)

          if (instruction.opcode === 0x0b)
            break

          continue
        }

        const count = LEB128.U32.readOrThrow(cursor)

        const funcidxs = new Array<number>()

        for (let j = 0; j < count.value; j++)
          funcidxs.push(LEB128.U32.readOrThrow(cursor).value)

        segments.push({ flag, instructions, funcidxs })
        continue
      }

      if (flag === 1) {
        const reftype = cursor.readUint8OrThrow()

        const count = LEB128.U32.readOrThrow(cursor)

        const elements = new Array<Array<Instruction>>()

        for (let j = 0; j < count.value; j++) {
          const instructions = new Array<Instruction>()

          while (true) {
            const instruction = Instruction.readOrThrow(cursor)

            instructions.push(instruction)

            if (instruction.opcode === 0x0b)
              break

            continue
          }

          elements.push(instructions)
        }

        segments.push({ flag, reftype, elements })
        continue
      }

      if (flag === 2) {
        const tableidx = LEB128.U32.readOrThrow(cursor).value

        const instructions = new Array<Instruction>()

        while (true) {
          const instruction = Instruction.readOrThrow(cursor)

          instructions.push(instruction)

          if (instruction.opcode === 0x0b)
            break

          continue
        }

        const reftype = cursor.readUint8OrThrow()

        const count = LEB128.U32.readOrThrow(cursor)

        const elements = new Array<Array<Instruction>>()

        for (let j = 0; j < count.value; j++) {
          const instructions = new Array<Instruction>()

          while (true) {
            const instruction = Instruction.readOrThrow(cursor)

            instructions.push(instruction)

            if (instruction.opcode === 0x0b)
              break

            continue
          }

          elements.push(instructions)
        }

        segments.push({ flag, tableidx, instructions, reftype, elements })
        continue
      }

      if (flag === 3) {
        const reftype = cursor.readUint8OrThrow()

        const count = LEB128.U32.readOrThrow(cursor)

        const elements = new Array<Array<Instruction>>()

        for (let j = 0; j < count.value; j++) {
          const instructions = new Array<Instruction>()

          while (true) {
            const instruction = Instruction.readOrThrow(cursor)

            instructions.push(instruction)

            if (instruction.opcode === 0x0b)
              break

            continue
          }

          elements.push(instructions)
        }

        segments.push({ flag, reftype, elements })
        continue
      }

      if (flag === 4) {
        const instructions = new Array<Instruction>()

        while (true) {
          const instruction = Instruction.readOrThrow(cursor)

          instructions.push(instruction)

          if (instruction.opcode === 0x0b)
            break

          continue
        }

        const count = LEB128.U32.readOrThrow(cursor)

        const funcidxs = new Array<number>()

        for (let j = 0; j < count.value; j++)
          funcidxs.push(LEB128.U32.readOrThrow(cursor).value)

        segments.push({ flag, instructions, funcidxs })
        continue
      }

      if (flag === 5) {
        const reftype = cursor.readUint8OrThrow()

        const count = LEB128.U32.readOrThrow(cursor)

        const funcidxs = new Array<number>()

        for (let j = 0; j < count.value; j++)
          funcidxs.push(LEB128.U32.readOrThrow(cursor).value)

        segments.push({ flag, reftype, funcidxs })
        continue
      }

      if (flag === 6) {
        const tableidx = LEB128.U32.readOrThrow(cursor).value

        const instructions = new Array<Instruction>()

        while (true) {
          const instruction = Instruction.readOrThrow(cursor)

          instructions.push(instruction)

          if (instruction.opcode === 0x0b)
            break

          continue
        }

        const reftype = cursor.readUint8OrThrow()

        const count = LEB128.U32.readOrThrow(cursor)

        const funcidxs = new Array<number>()

        for (let j = 0; j < count.value; j++)
          funcidxs.push(LEB128.U32.readOrThrow(cursor).value)

        segments.push({ flag, tableidx, instructions, reftype, funcidxs })
        continue
      }

      if (flag === 7) {
        const reftype = cursor.readUint8OrThrow()

        const count = LEB128.U32.readOrThrow(cursor)

        const funcidxs = new Array<number>()

        for (let j = 0; j < count.value; j++)
          funcidxs.push(LEB128.U32.readOrThrow(cursor).value)

        segments.push({ flag, reftype, funcidxs })
        continue
      }

      throw new Error(`Unknown element segment flag 0x${flag.toString(16).padStart(2, "0")}`)
    }

    return new ElementSection(segments)
  }

}

export class CodeSection {

  constructor(
    public bodies: CodeSection.FunctionBody[],
  ) { }

  get kind() {
    return CodeSection.kind
  }

  sizeOrThrow(): number {
    let size = 0

    size += new LEB128.U32(this.bodies.length).sizeOrThrow()

    for (const func of this.bodies)
      size += func.sizeOrThrow()

    return size
  }

  writeOrThrow(cursor: Cursor) {
    new LEB128.U32(this.bodies.length).writeOrThrow(cursor)

    for (const func of this.bodies)
      func.writeOrThrow(cursor)

    return
  }

}

export namespace CodeSection {

  export const kind = 0x0A

  export function readOrThrow(cursor: Cursor) {
    const count = LEB128.U32.readOrThrow(cursor)

    const bodies = new Array<FunctionBody>()

    for (let i = 0; i < count.value; i++)
      bodies.push(FunctionBody.readOrThrow(cursor))

    return new CodeSection(bodies)
  }

  export class FunctionBody {

    constructor(
      public locals: FunctionBody.Local[],
      public instructions: Instruction[]
    ) { }

    sizeOrThrow(): number {
      let subsize = 0

      subsize += new LEB128.U32(this.locals.length).sizeOrThrow()

      for (const local of this.locals)
        subsize += local.sizeOrThrow()

      for (const instruction of this.instructions)
        subsize += instruction.sizeOrThrow()

      return new LEB128.U32(subsize).sizeOrThrow() + subsize
    }

    writeOrThrow(cursor: Cursor) {
      let subsize = 0

      subsize += new LEB128.U32(this.locals.length).sizeOrThrow()

      for (const local of this.locals)
        subsize += local.sizeOrThrow()

      for (const instruction of this.instructions)
        subsize += instruction.sizeOrThrow()

      new LEB128.U32(subsize).writeOrThrow(cursor)

      new LEB128.U32(this.locals.length).writeOrThrow(cursor)

      for (const local of this.locals)
        local.writeOrThrow(cursor)

      for (const instruction of this.instructions)
        instruction.writeOrThrow(cursor)

      return
    }

  }

  export namespace FunctionBody {

    export function readOrThrow(cursor: Cursor) {
      const size = LEB128.U32.readOrThrow(cursor)
      const data = cursor.readOrThrow(size.value)

      const subcursor = new Cursor(data)

      const locals = Locals.readOrThrow(subcursor)

      const instructions = new Array<Instruction>()

      while (subcursor.remaining > 0)
        instructions.push(Instruction.readOrThrow(subcursor))

      return new FunctionBody(locals, instructions)
    }

    export namespace Locals {

      export function readOrThrow(cursor: Cursor) {
        const count = LEB128.U32.readOrThrow(cursor)

        const locals = new Array<Local>()

        for (let i = 0; i < count.value; i++)
          locals.push(Local.readOrThrow(cursor))

        return locals
      }

    }

    export class Local {

      constructor(
        public count: number,
        public valtype: number
      ) { }

      sizeOrThrow(): number {
        return new LEB128.U32(this.count).sizeOrThrow() + 1
      }

      writeOrThrow(cursor: Cursor) {
        new LEB128.U32(this.count).writeOrThrow(cursor)

        cursor.writeUint8OrThrow(this.valtype)

        return
      }

    }

    export namespace Local {

      export function readOrThrow(cursor: Cursor) {
        const count = LEB128.U32.readOrThrow(cursor)
        const valtype = cursor.readUint8OrThrow()

        return new Local(count.value, valtype)
      }

    }

  }

}



export class Instruction {

  constructor(
    public opcode: number,
    public params: Writable[]
  ) { }

  sizeOrThrow(): number {
    let size = 1

    for (const param of this.params)
      size += param.sizeOrThrow()

    return size
  }

  writeOrThrow(cursor: Cursor) {
    cursor.writeUint8OrThrow(this.opcode)

    for (const param of this.params)
      param.writeOrThrow(cursor)

    return
  }

}

export namespace Instruction {

  export function readOrThrow(cursor: Cursor) {
    const opcode = cursor.readUint8OrThrow()

    switch (opcode) {
      case 0x00:
      case 0x01:
        return new Instruction(opcode, [])
      case 0x02:
      case 0x03:
      case 0x04:
        return new Instruction(opcode, [LEB128.I33.readOrThrow(cursor)])
      case 0x05:
        return new Instruction(opcode, [])
      case 0x08:
        return new Instruction(opcode, [LEB128.U32.readOrThrow(cursor)])
      case 0x0a:
        return new Instruction(opcode, [])
      case 0x0b:
        return new Instruction(opcode, [])
      case 0x0c:
      case 0x0d:
        return new Instruction(opcode, [LEB128.U32.readOrThrow(cursor)])
      case 0x0e: {
        const count = LEB128.U32.readOrThrow(cursor)

        const labels = new Array<LEB128.U32>()

        for (let i = 0; i < count.value; i++)
          labels.push(LEB128.U32.readOrThrow(cursor))

        const fallback = LEB128.U32.readOrThrow(cursor)

        return new Instruction(opcode, [count, ...labels, fallback])
      }
      case 0x0f:
        return new Instruction(opcode, [])
      case 0x10:
        return new Instruction(opcode, [LEB128.U32.readOrThrow(cursor)])
      case 0x11:
        return new Instruction(opcode, [LEB128.U32.readOrThrow(cursor), LEB128.U32.readOrThrow(cursor)])
      case 0x12:
        return new Instruction(opcode, [LEB128.U32.readOrThrow(cursor)])
      case 0x13:
        return new Instruction(opcode, [LEB128.U32.readOrThrow(cursor), LEB128.U32.readOrThrow(cursor)])
      case 0x14:
      case 0x15:
        return new Instruction(opcode, [LEB128.U32.readOrThrow(cursor)])
      case 0x1a:
      case 0x1b:
        return new Instruction(opcode, [])
      case 0x1c: {
        const count = LEB128.U32.readOrThrow(cursor)

        const types = new Array<LEB128.U32>()

        for (let i = 0; i < count.value; i++)
          types.push(LEB128.U32.readOrThrow(cursor))

        return new Instruction(opcode, [count, ...types])
      }
      case 0x1f: {
        const blocktype = LEB128.I33.readOrThrow(cursor)

        const count = LEB128.U32.readOrThrow(cursor)

        const catches = new Array<Writable>()

        for (let i = 0; i < count.value; i++) {
          const kind = cursor.readUint8OrThrow()

          catches.push(new U8(kind))

          if (kind < 2)
            catches.push(LEB128.U32.readOrThrow(cursor))

          catches.push(LEB128.U32.readOrThrow(cursor))
        }

        return new Instruction(opcode, [blocktype, count, ...catches])
      }
      case 0x20:
      case 0x21:
      case 0x22:
      case 0x23:
      case 0x24:
      case 0x25:
      case 0x26:
        return new Instruction(opcode, [LEB128.U32.readOrThrow(cursor)])
      case 0x28:
      case 0x29:
      case 0x2a:
      case 0x2b:
      case 0x2c:
      case 0x2d:
      case 0x2e:
      case 0x2f:
      case 0x30:
      case 0x31:
      case 0x32:
      case 0x33:
      case 0x34:
      case 0x35:
      case 0x36:
      case 0x37:
      case 0x38:
      case 0x39:
      case 0x3a:
      case 0x3b:
      case 0x3c:
      case 0x3d:
      case 0x3e:
        return new Instruction(opcode, [LEB128.U32.readOrThrow(cursor), LEB128.U32.readOrThrow(cursor)])
      case 0x3f:
      case 0x40:
        return new Instruction(opcode, [LEB128.U32.readOrThrow(cursor)])
      case 0x41:
        return new Instruction(opcode, [LEB128.I32.readOrThrow(cursor)])
      case 0x42:
        return new Instruction(opcode, [LEB128.I64.readOrThrow(cursor)])
      case 0x43:
        return new Instruction(opcode, [F32.readOrThrow(cursor)])
      case 0x44:
        return new Instruction(opcode, [F64.readOrThrow(cursor)])
      case 0x45:
      case 0x46:
      case 0x47:
      case 0x48:
      case 0x49:
      case 0x4a:
      case 0x4b:
      case 0x4c:
      case 0x4d:
      case 0x4e:
      case 0x4f:
      case 0x50:
      case 0x51:
      case 0x52:
      case 0x53:
      case 0x54:
      case 0x55:
      case 0x56:
      case 0x57:
      case 0x58:
      case 0x59:
      case 0x5a:
      case 0x5b:
      case 0x5c:
      case 0x5d:
      case 0x5e:
      case 0x5f:
      case 0x60:
      case 0x61:
      case 0x62:
      case 0x63:
      case 0x64:
      case 0x65:
      case 0x66:
      case 0x67:
      case 0x68:
      case 0x69:
      case 0x6a:
      case 0x6b:
      case 0x6c:
      case 0x6d:
      case 0x6e:
      case 0x6f:
      case 0x70:
      case 0x71:
      case 0x72:
      case 0x73:
      case 0x74:
      case 0x75:
      case 0x76:
      case 0x77:
      case 0x78:
      case 0x79:
      case 0x7a:
      case 0x7b:
      case 0x7c:
      case 0x7d:
      case 0x7e:
      case 0x7f:
      case 0x80:
      case 0x81:
      case 0x82:
      case 0x83:
      case 0x84:
      case 0x85:
      case 0x86:
      case 0x87:
      case 0x88:
      case 0x89:
      case 0x8a:
      case 0x8b:
      case 0x8c:
      case 0x8d:
      case 0x8e:
      case 0x8f:
      case 0x90:
      case 0x91:
      case 0x92:
      case 0x93:
      case 0x94:
      case 0x95:
      case 0x96:
      case 0x97:
      case 0x98:
      case 0x99:
      case 0x9a:
      case 0x9b:
      case 0x9c:
      case 0x9d:
      case 0x9e:
      case 0x9f:
      case 0xa0:
      case 0xa1:
      case 0xa2:
      case 0xa3:
      case 0xa4:
      case 0xa5:
      case 0xa6:
      case 0xa7:
      case 0xa8:
      case 0xa9:
      case 0xaa:
      case 0xab:
      case 0xac:
      case 0xad:
      case 0xae:
      case 0xaf:
      case 0xb0:
      case 0xb1:
      case 0xb2:
      case 0xb3:
      case 0xb4:
      case 0xb5:
      case 0xb6:
      case 0xb7:
      case 0xb8:
      case 0xb9:
      case 0xba:
      case 0xbb:
      case 0xbc:
      case 0xbd:
      case 0xbe:
      case 0xbf:
      case 0xc0:
      case 0xc1:
      case 0xc2:
      case 0xc3:
      case 0xc4:
        return new Instruction(opcode, [])
      case 0xd0:
        return new Instruction(opcode, [LEB128.I33.readOrThrow(cursor)])
      case 0xd1:
        return new Instruction(opcode, [])
      case 0xd2:
        return new Instruction(opcode, [LEB128.U32.readOrThrow(cursor)])
      case 0xd3:
      case 0xd4:
        return new Instruction(opcode, [])
      case 0xd5:
      case 0xd6:
        return new Instruction(opcode, [LEB128.U32.readOrThrow(cursor)])
      case 0xfc: {
        const subopcode = LEB128.U32.readOrThrow(cursor)

        switch (subopcode.value) {
          case 0x00:
          case 0x01:
          case 0x02:
          case 0x03:
          case 0x04:
          case 0x05:
          case 0x06:
          case 0x07:
            return new Instruction(opcode, [subopcode])
          case 0x08:
            return new Instruction(opcode, [subopcode, LEB128.U32.readOrThrow(cursor), LEB128.U32.readOrThrow(cursor)])
          case 0x09:
            return new Instruction(opcode, [subopcode, LEB128.U32.readOrThrow(cursor)])
          case 0x0a:
            return new Instruction(opcode, [subopcode, LEB128.U32.readOrThrow(cursor), LEB128.U32.readOrThrow(cursor)])
          case 0x0b:
            return new Instruction(opcode, [subopcode, LEB128.U32.readOrThrow(cursor)])
          case 0x0c:
            return new Instruction(opcode, [subopcode, LEB128.U32.readOrThrow(cursor), LEB128.U32.readOrThrow(cursor)])
          case 0x0d:
            return new Instruction(opcode, [subopcode, LEB128.U32.readOrThrow(cursor)])
          case 0x0e:
            return new Instruction(opcode, [subopcode, LEB128.U32.readOrThrow(cursor), LEB128.U32.readOrThrow(cursor)])
          case 0x0f:
            return new Instruction(opcode, [subopcode, LEB128.U32.readOrThrow(cursor)])
          case 0x10:
            return new Instruction(opcode, [subopcode, LEB128.U32.readOrThrow(cursor)])
          case 0x11:
            return new Instruction(opcode, [subopcode, LEB128.U32.readOrThrow(cursor)])
        }

        throw new Error(`Unknown sub-opcode 0x${subopcode.value.toString(16).padStart(2, "0")}`)
      }
    }

    throw new Error(`Unknown opcode 0x${opcode.toString(16).padStart(2, "0")}`)
  }
}

export namespace LEB128 {

  export class U64 {

    constructor(
      public value: bigint
    ) { }

    sizeOrThrow(): number {
      let size = 0

      let value = this.value

      do {
        let byte = Number(value & 0x7Fn)

        value >>= 7n

        if (value !== 0n)
          byte |= 0x80

        size += 1
      } while (value !== 0n)

      return size
    }

    writeOrThrow(cursor: Cursor) {
      let value = this.value

      do {
        let byte = Number(value & 0x7Fn)

        value >>= 7n

        if (value !== 0n)
          byte |= 0x80

        cursor.writeUint8OrThrow(byte)
      } while (value !== 0n)
    }

  }

  export namespace U64 {

    export function readOrThrow(cursor: Cursor) {
      let value = 0n
      let shift = 0n

      let byte: number

      do {
        byte = cursor.readUint8OrThrow()

        value |= (BigInt(byte & 0x7F) << shift)

        shift += 7n

        continue
      } while ((byte & 0x80) && (shift < 70n))

      if (value > (2n ** 64n - 1n))
        throw new Error(`Value exceeds U64 range`)

      return new U64(value)
    }

  }

  export class I64 {

    constructor(
      public value: bigint
    ) { }

    sizeOrThrow(): number {
      let size = 0

      let value = this.value

      let more = true

      while (more) {
        let byte = Number(value & 0x7Fn)

        value >>= 7n

        if ((value === 0n && (byte & 0x40) === 0) || (value === -1n && (byte & 0x40) !== 0)) {
          more = false
        } else {
          byte |= 0x80
        }

        size += 1
      }

      return size
    }

    writeOrThrow(cursor: Cursor) {
      let value = this.value

      let more = true

      while (more) {
        let byte = Number(value & 0x7Fn)

        value >>= 7n

        if ((value === 0n && (byte & 0x40) === 0) || (value === -1n && (byte & 0x40) !== 0)) {
          more = false
        } else {
          byte |= 0x80
        }

        cursor.writeUint8OrThrow(byte)
      }
    }

  }

  export namespace I64 {

    export function readOrThrow(cursor: Cursor) {
      let value = 0n
      let shift = 0n

      let byte: number

      do {
        byte = cursor.readUint8OrThrow()

        value |= (BigInt(byte & 0x7F) << shift)

        shift += 7n

        continue
      } while ((byte & 0x80) && (shift < 70n))

      if (byte & 0x40)
        value |= (-1n << shift)

      if (value > (2n ** 63n - 1n))
        throw new Error(`Value exceeds I64 range`)

      return new I64(value)
    }

  }

  export class U32 {

    constructor(
      public value: number
    ) { }

    sizeOrThrow(): number {
      let size = 0

      let value = BigInt(this.value)

      do {
        let byte = Number(value & 0x7Fn)

        value >>= 7n

        if (value !== 0n)
          byte |= 0x80

        size += 1
      } while (value !== 0n)

      return size
    }

    writeOrThrow(cursor: Cursor) {
      let value = BigInt(this.value)

      do {
        let byte = Number(value & 0x7Fn)

        value >>= 7n

        if (value !== 0n)
          byte |= 0x80

        cursor.writeUint8OrThrow(byte)
      } while (value !== 0n)
    }

  }

  export namespace U32 {

    export function readOrThrow(cursor: Cursor) {
      let value = 0n
      let shift = 0n

      let byte: number

      do {
        byte = cursor.readUint8OrThrow()

        value |= (BigInt(byte & 0x7F) << shift)

        shift += 7n

        continue
      } while ((byte & 0x80) && (shift < 70n))

      if (value > ((2n ** 32n) - 1n))
        throw new Error(`Value exceeds U32 range`)

      return new U32(Number(value))
    }

  }

  export class I32 {

    constructor(
      public value: number
    ) { }

    sizeOrThrow(): number {
      let size = 0

      let value = BigInt(this.value)

      let more = true

      while (more) {
        let byte = Number(value & 0x7Fn)

        value >>= 7n

        if ((value === 0n && (byte & 0x40) === 0) || (value === -1n && (byte & 0x40) !== 0)) {
          more = false
        } else {
          byte |= 0x80
        }

        size += 1
      }

      return size
    }

    writeOrThrow(cursor: Cursor) {
      let value = BigInt(this.value)

      let more = true

      while (more) {
        let byte = Number(value & 0x7Fn)

        value >>= 7n

        if ((value === 0n && (byte & 0x40) === 0) || (value === -1n && (byte & 0x40) !== 0)) {
          more = false
        } else {
          byte |= 0x80
        }

        cursor.writeUint8OrThrow(byte)
      }
    }

  }

  export namespace I32 {

    export function readOrThrow(cursor: Cursor) {
      let value = 0n
      let shift = 0n

      let byte: number

      do {
        byte = cursor.readUint8OrThrow()

        value |= (BigInt(byte & 0x7F) << shift)

        shift += 7n

        continue
      } while ((byte & 0x80) && (shift < 70n))

      if (byte & 0x40)
        value |= (-1n << shift)

      if (value > (2n ** 31n - 1n))
        throw new Error(`Value exceeds I32 range`)

      return new I32(Number(value))
    }

  }

  export class I33 {

    constructor(
      public value: number
    ) { }

    sizeOrThrow(): number {
      let size = 0

      let value = BigInt(this.value)

      let more = true

      while (more) {
        let byte = Number(value & 0x7Fn)

        value >>= 7n

        if ((value === 0n && (byte & 0x40) === 0) || (value === -1n && (byte & 0x40) !== 0)) {
          more = false
        } else {
          byte |= 0x80
        }

        size += 1
      }

      return size
    }

    writeOrThrow(cursor: Cursor) {
      let value = BigInt(this.value)

      let more = true

      while (more) {
        let byte = Number(value & 0x7Fn)

        value >>= 7n

        if ((value === 0n && (byte & 0x40) === 0) || (value === -1n && (byte & 0x40) !== 0)) {
          more = false
        } else {
          byte |= 0x80
        }

        cursor.writeUint8OrThrow(byte)
      }
    }

  }

  export namespace I33 {

    export function readOrThrow(cursor: Cursor) {
      let value = 0n
      let shift = 0n

      let byte: number

      do {
        byte = cursor.readUint8OrThrow()

        value |= (BigInt(byte & 0x7F) << shift)

        shift += 7n

        continue
      } while ((byte & 0x80) && (shift < 70n))

      if (byte & 0x40)
        value |= (-1n << shift)

      if (value > ((2n ** 32n) - 1n))
        throw new Error(`Value exceeds I33 range`)

      return new I33(Number(value))
    }

  }

}

export class U8 {

  constructor(
    public value: number
  ) { }

  sizeOrThrow(): number {
    return 1
  }

  writeOrThrow(cursor: Cursor) {
    cursor.writeUint8OrThrow(this.value)
  }

}

export namespace U8 {

  export function readOrThrow(cursor: Cursor) {
    return new U8(cursor.readUint8OrThrow())
  }

}

export class F32 {

  constructor(
    public value: number
  ) { }

  sizeOrThrow(): number {
    return 4
  }

  writeOrThrow(cursor: Cursor) {
    cursor.writeFloat32OrThrow(this.value, true)
  }

}

export namespace F32 {

  export function readOrThrow(cursor: Cursor) {
    return new F32(cursor.readFloat32OrThrow(true))
  }

}

export class F64 {

  constructor(
    public value: number
  ) { }

  sizeOrThrow(): number {
    return 8
  }

  writeOrThrow(cursor: Cursor) {
    cursor.writeFloat64OrThrow(this.value, true)
  }

}

export namespace F64 {

  export function readOrThrow(cursor: Cursor) {
    return new F64(cursor.readFloat64OrThrow(true))
  }

}