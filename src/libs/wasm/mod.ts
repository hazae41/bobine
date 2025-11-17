import { Readable, Writable } from "@hazae41/binary";
import { Cursor } from "@hazae41/cursor";
import { Nullable } from "../nullable/mod.ts";

export class Module {

  constructor(
    readonly head: Head,
    readonly body: Body
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
    readonly version: number
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
    readonly sections: Section[]
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
    const sections: Section[] = []

    while (cursor.remaining > 0) {
      const type = cursor.readUint8OrThrow()

      const size = LEB128.U32.readOrThrow(cursor)

      const data = cursor.readOrThrow(size.value)

      if (type === Section.CustomSection.kind) {
        const section = Readable.readFromBytesOrThrow(Section.CustomSection, data)

        sections.push(section)

        continue
      }

      if (type === Section.TypeSection.kind) {
        const section = Readable.readFromBytesOrThrow(Section.TypeSection, data)

        sections.push(section)

        continue
      }

      if (type === Section.ImportSection.kind) {
        const section = Readable.readFromBytesOrThrow(Section.ImportSection, data)

        sections.push(section)

        continue
      }

      if (type === Section.ExportSection.kind) {
        const section = Readable.readFromBytesOrThrow(Section.ExportSection, data)

        sections.push(section)

        continue
      }

      if (type === Section.StartSection.kind) {
        const section = Readable.readFromBytesOrThrow(Section.StartSection, data)

        sections.push(section)

        continue
      }

      if (type === Section.CodeSection.kind) {
        const section = Readable.readFromBytesOrThrow(Section.CodeSection, data)

        sections.push(section)

        continue
      }

      sections.push(new Section.UnknownSection(type, data))

      continue
    }

    return new Body(sections)
  }

}

export type Section =
  | Section.UnknownSection
  | Section.CustomSection
  | Section.TypeSection
  | Section.ImportSection
  | Section.ExportSection
  | Section.StartSection
  | Section.CodeSection

export namespace Section {


  export class UnknownSection {

    constructor(
      readonly kind: number,
      readonly data: Uint8Array
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
      readonly name: Uint8Array,
      readonly data: Uint8Array
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
      readonly descriptors: TypeSection.TypeDescriptor[]
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
      readonly prefix: number
      readonly subtypes: number[]
      readonly body: TypeBody
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

        throw new Error(`Unknown type 0x${kind.toString(16).padStart(2, "0")}`)
      }

      return new TypeSection(types)
    }

    export type TypeBody =
      | FuncType
      | StructType
      | ArrayType

    export class FuncType {

      constructor(
        readonly params: number[],
        readonly results: number[]
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
        readonly fields: [number, boolean][]
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

        for (const [type, mutable] of this.fields) {
          cursor.writeUint8OrThrow(type)
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
          const type = cursor.readUint8OrThrow()
          const mutable = cursor.readUint8OrThrow() === 1

          fields.push([type, mutable])
        }

        return new StructType(fields)
      }

    }

    export class ArrayType {

      constructor(
        readonly type: number,
        readonly mutable: boolean
      ) { }

      get kind() {
        return ArrayType.kind
      }

      sizeOrThrow(): number {
        return 1 + 1
      }

      writeOrThrow(cursor: Cursor) {
        cursor.writeUint8OrThrow(this.type)
        cursor.writeUint8OrThrow(this.mutable ? 1 : 0)
      }

    }

    export namespace ArrayType {

      export const kind = 0x5F

      export function readOrThrow(cursor: Cursor) {
        const type = cursor.readUint8OrThrow()
        const mutable = cursor.readUint8OrThrow() === 1

        return new ArrayType(type, mutable)
      }

    }

  }

  export class ImportSection {

    constructor(
      readonly descriptors: ImportSection.ImportDescriptor[]
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
      readonly from: Uint8Array
      readonly name: Uint8Array
      readonly body: ImportBody
    }

    export function readOrThrow(cursor: Cursor) {
      const count = LEB128.U32.readOrThrow(cursor)

      const imports: ImportDescriptor[] = []

      for (let i = 0; i < count.value; i++) {
        const from = cursor.readOrThrow(LEB128.U32.readOrThrow(cursor).value)
        const name = cursor.readOrThrow(LEB128.U32.readOrThrow(cursor).value)

        const kind = cursor.readUint8OrThrow()

        if (kind === 0x00) {
          const body = FunctionImport.readOrThrow(cursor)
          imports.push({ from, name, body })
          continue
        }

        if (kind === 0x01) {
          const body = TableImport.readOrThrow(cursor)
          imports.push({ from, name, body })
          continue
        }

        if (kind === 0x02) {
          const body = MemoryImport.readOrThrow(cursor)
          imports.push({ from, name, body })
          continue
        }

        if (kind === 0x03) {
          const body = GlobalImport.readOrThrow(cursor)
          imports.push({ from, name, body })
          continue
        }

        throw new Error(`Unknown import 0x${kind.toString(16).padStart(2, "0")}`)
      }

      return new ImportSection(imports)
    }

    export type ImportBody =
      | FunctionImport
      | TableImport
      | MemoryImport
      | GlobalImport

    export class FunctionImport {

      constructor(
        readonly typeidx: number
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
        readonly type: number,
        readonly flag: number,
        readonly min: number,
        readonly max: Nullable<number>,
      ) { }

      get kind() {
        return TableImport.kind
      }

      sizeOrThrow(): number {
        let size = 1 + 1

        size += new LEB128.U32(this.min).sizeOrThrow()

        if (this.max != null)
          size += new LEB128.U32(this.max).sizeOrThrow()

        return size
      }

      writeOrThrow(cursor: Cursor) {
        cursor.writeUint8OrThrow(this.type)
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
        const type = cursor.readUint8OrThrow()
        const flag = cursor.readUint8OrThrow()

        const min = LEB128.U32.readOrThrow(cursor)
        const max = flag & 0x01 ? LEB128.U32.readOrThrow(cursor).value : null

        return new TableImport(type, flag, min.value, max)
      }

    }

    export class MemoryImport {

      constructor(
        readonly flag: number,
        readonly min: number,
        readonly max: Nullable<number>,
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
        readonly type: number,
        readonly mutability: number,
      ) { }

      get kind() {
        return GlobalImport.kind
      }

      sizeOrThrow(): number {
        return 1 + 1
      }

      writeOrThrow(cursor: Cursor) {
        cursor.writeUint8OrThrow(this.type)
        cursor.writeUint8OrThrow(this.mutability)
      }

    }

    export namespace GlobalImport {

      export const kind = 0x03

      export function readOrThrow(cursor: Cursor) {
        const type = cursor.readUint8OrThrow()
        const mutability = cursor.readUint8OrThrow()

        return new GlobalImport(type, mutability)
      }

    }

  }

  export class ExportSection {

    constructor(
      readonly descriptors: ExportSection.ExportDescriptor[]
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

      readonly name: Uint8Array

      readonly kind: number

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

  export class CodeSection {

    constructor(
      readonly bodies: CodeSection.FunctionBody[],
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

      const bodies: FunctionBody[] = []

      for (let i = 0; i < count.value; i++)
        bodies.push(FunctionBody.readOrThrow(cursor))

      return new CodeSection(bodies)
    }

    export class FunctionBody {

      constructor(
        readonly locals: FunctionBody.Local[],
        readonly instructions: FunctionBody.Instruction[]
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

        const instructions: Instruction[] = []

        while (subcursor.remaining > 0)
          instructions.push(Instruction.readOrThrow(subcursor))

        return new FunctionBody(locals, instructions)
      }

      export namespace Locals {

        export function readOrThrow(cursor: Cursor) {
          const count = LEB128.U32.readOrThrow(cursor)

          const locals: Local[] = []

          for (let i = 0; i < count.value; i++)
            locals.push(Local.readOrThrow(cursor))

          return locals
        }

      }

      export class Local {

        constructor(
          readonly size: number,
          readonly type: number
        ) { }

        sizeOrThrow(): number {
          return new LEB128.U32(this.size).sizeOrThrow() + 1
        }

        writeOrThrow(cursor: Cursor) {
          new LEB128.U32(this.size).writeOrThrow(cursor)

          cursor.writeUint8OrThrow(this.type)

          return
        }

      }

      export namespace Local {

        export function readOrThrow(cursor: Cursor) {
          const size = LEB128.U32.readOrThrow(cursor)
          const type = cursor.readUint8OrThrow()

          return new Local(size.value, type)
        }

      }

      export class Instruction {

        constructor(
          readonly opcode: number,
          readonly params: Writable[]
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

              const labels: LEB128.U32[] = []

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

              const types: LEB128.U32[] = []

              for (let i = 0; i < count.value; i++)
                types.push(LEB128.U32.readOrThrow(cursor))

              return new Instruction(opcode, [count, ...types])
            }
            case 0x1f: {
              const type = LEB128.I33.readOrThrow(cursor)

              const count = LEB128.U32.readOrThrow(cursor)

              const catches: Writable[] = []

              for (let i = 0; i < count.value; i++) {
                const kind = cursor.readUint8OrThrow()

                catches.push(new U8(kind))

                if (kind < 2)
                  catches.push(LEB128.U32.readOrThrow(cursor))

                catches.push(LEB128.U32.readOrThrow(cursor))
              }

              return new Instruction(opcode, [type, count, ...catches])
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

    }

  }

}

export namespace LEB128 {

  export class U64 {

    constructor(
      readonly value: bigint
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
      } while (byte & 0x80)

      return new U64(value)
    }

  }

  export class I64 {

    constructor(
      readonly value: bigint
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
      } while (byte & 0x80)

      if ((byte & 0x40) && (shift < 64n))
        value |= (-1n << shift)

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
      } while (byte & 0x80)

      return new U32(Number(value))
    }

  }

  export class I32 {

    constructor(
      readonly value: number
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
      } while (byte & 0x80)

      if ((byte & 0x40) && (shift < 64n))
        value |= (-1n << shift)

      return new I32(Number(value))
    }

  }

  export class I33 {

    constructor(
      readonly value: number
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
      } while (byte & 0x80)

      if ((byte & 0x40) && (shift < 64n))
        value |= (-1n << shift)

      return new I33(Number(value))
    }

  }

}

export class U8 {

  constructor(
    readonly value: number
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
    readonly value: number
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
    readonly value: number
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