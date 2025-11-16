import { Readable, type Writable } from "@hazae41/binary";
import { Cursor } from "@hazae41/cursor";

export class Module {

  constructor(
    readonly head: Head,
    readonly body: Body
  ) { }

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
    readonly table: Body.Sections,
    readonly array: Section[]
  ) { }

}

export namespace Body {

  export interface Sections {

    [Section.CodeSection.type]?: Section<Section.CodeSection>

    [key: number]: Section | undefined

  }

  export function readOrThrow(cursor: Cursor) {
    const table: Sections = {}
    const array: Section[] = []

    while (cursor.remaining > 0) {
      const type = cursor.readUint8OrThrow()

      const size = LEB128.U32.readOrThrow(cursor)

      const data = cursor.readOrThrow(size.value)

      if (type === Section.Custom.type) {
        const section = new Section(Readable.readFromBytesOrThrow(Section.Custom, data))

        array.push(section)

        continue
      }

      if (type === Section.CodeSection.type) {
        const section = new Section(Readable.readFromBytesOrThrow(Section.CodeSection, data))

        if (table[Section.CodeSection.type] != null)
          throw new Error("Duplicate code section")

        table[Section.CodeSection.type] = section

        array.push(section)

        continue
      }

      array.push(new Section(new Section.Unknown(type, data)))

      continue
    }

    return new Body(table, array)
  }

}

export class Section<T extends Section.Data = Section.Data> {

  constructor(
    readonly data: T
  ) { }

  sizeOrThrow(): number {
    return 1 + new LEB128.U32(this.data.sizeOrThrow()).sizeOrThrow() + this.data.sizeOrThrow()
  }

  writeOrThrow(cursor: Cursor) {
    cursor.writeUint8OrThrow(this.data.type)

    new LEB128.U32(this.data.sizeOrThrow()).writeOrThrow(cursor)

    this.data.writeOrThrow(cursor)
  }

}

export namespace Section {

  export type Data =
    | Section.Unknown
    | Section.Custom
    | Section.CodeSection


  export class Unknown {

    constructor(
      readonly type: number,
      readonly data: Uint8Array
    ) { }

    sizeOrThrow(): number {
      return this.data.length
    }

    writeOrThrow(cursor: Cursor) {
      cursor.writeOrThrow(this.data)
    }

  }

  export class Custom {

    constructor(
      readonly name: Uint8Array,
      readonly data: Uint8Array
    ) { }

    get type() {
      return Custom.type
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

  export namespace Custom {

    export const type = 0

    export function readOrThrow(cursor: Cursor) {
      const size = LEB128.U32.readOrThrow(cursor)

      const name = cursor.readOrThrow(size.value)

      const data = cursor.readOrThrow(cursor.remaining)

      return new Custom(name, data)
    }

  }

  export class CodeSection {

    constructor(
      readonly functions: CodeSection.Function[],
    ) { }

    get type() {
      return CodeSection.type
    }

    sizeOrThrow(): number {
      let size = 0

      size += new LEB128.U32(this.functions.length).sizeOrThrow()

      for (const func of this.functions)
        size += func.sizeOrThrow()

      return size
    }

    writeOrThrow(cursor: Cursor) {
      new LEB128.U32(this.functions.length).writeOrThrow(cursor)

      for (const func of this.functions)
        func.writeOrThrow(cursor)

      return
    }

  }

  export namespace CodeSection {

    export const type = 10

    export function readOrThrow(cursor: Cursor) {
      const count = LEB128.U32.readOrThrow(cursor)

      const functions: Function[] = []

      for (let i = 0; i < count.value; i++)
        functions.push(Function.readOrThrow(cursor))

      return new CodeSection(functions)
    }

    export class Function {

      constructor(
        readonly locals: Function.Local[],
        readonly instructions: Function.Instruction[]
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

    export namespace Function {

      export function readOrThrow(cursor: Cursor) {
        const size = LEB128.U32.readOrThrow(cursor)
        const data = cursor.readOrThrow(size.value)

        const subcursor = new Cursor(data)

        const locals = Locals.readOrThrow(subcursor)

        const instructions: Instruction[] = []

        while (subcursor.remaining > 0)
          instructions.push(Instruction.readOrThrow(subcursor))

        return new Function(locals, instructions)
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
      let value = this.value
      let size = 0

      while (true) {
        size += 1

        value >>= 7n

        if (value === 0n)
          break

        continue
      }

      return size
    }

    writeOrThrow(cursor: Cursor) {
      let value = this.value

      while (true) {
        let byte = Number(value & 0x7Fn)

        value >>= 7n

        if (value !== 0n)
          byte |= 0x80

        cursor.writeUint8OrThrow(byte)

        if (value === 0n)
          break

        continue
      }
    }

  }

  export namespace U64 {

    export function readOrThrow(cursor: Cursor) {
      let value = 0n
      let shift = 0n

      let byte: number

      while (true) {
        byte = cursor.readUint8OrThrow()

        value |= (BigInt(byte & 0x7F) << shift);

        if ((byte & 0x80) === 0)
          break

        shift += 7n;

        if (shift > 63n)
          throw new Error("LEB128 value too large")

        continue
      }

      return new U64(value)
    }

  }

  export class I64 {

    constructor(
      readonly value: bigint
    ) { }

    sizeOrThrow(): number {
      let value = this.value

      let size = 0

      while (true) {
        size += 1

        const byte = Number(value & 0x7Fn)

        value >>= 7n

        if ((value === 0n && (byte & 0x40) === 0) || (value === -1n && (byte & 0x40) !== 0))
          break

        continue
      }

      return size
    }

    writeOrThrow(cursor: Cursor) {
      let value = this.value

      let more = true

      while (more) {
        let byte = Number(this.value & 0x7Fn)

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

      while (true) {
        byte = cursor.readUint8OrThrow()

        value |= (BigInt(byte & 0x7F) << shift);

        if ((byte & 0x80) === 0)
          break

        shift += 7n;

        if (shift > 63n)
          throw new Error("LEB128 value too large")

        continue
      }

      if ((byte & 0x40) && (shift < 64n))
        value |= (-1n << shift)

      return new I64(value)
    }

  }

  export class U32 {

    constructor(
      readonly value: number
    ) { }

    sizeOrThrow(): number {
      let value = this.value
      let size = 0

      while (true) {
        size += 1

        value >>>= 7

        if (value === 0)
          break

        continue
      }

      return size
    }

    writeOrThrow(cursor: Cursor) {
      let value = this.value

      while (true) {
        let byte = value & 0x7F

        value >>>= 7

        if (value !== 0)
          byte |= 0x80

        cursor.writeUint8OrThrow(byte)

        if (value === 0)
          break

        continue
      }
    }

  }

  export namespace U32 {

    export function readOrThrow(cursor: Cursor) {
      let value = 0
      let shift = 0

      let byte: number

      while (true) {
        byte = cursor.readUint8OrThrow()

        value |= ((byte & 0x7F) << shift);

        if ((byte & 0x80) === 0)
          break

        shift += 7;

        if (shift > 35)
          throw new Error("LEB128 value too large")

        continue
      }

      return new U32(value)
    }

  }

  export class I32 {

    constructor(
      readonly value: number
    ) { }

    sizeOrThrow(): number {
      let value = this.value

      let size = 0

      while (true) {
        size += 1

        const byte = value & 0x7F

        value >>= 7

        if ((value === 0 && (byte & 0x40) === 0) || (value === -1 && (byte & 0x40) !== 0))
          break

        continue
      }

      return size
    }

    writeOrThrow(cursor: Cursor) {
      let value = this.value

      let more = true

      while (more) {
        let byte = value & 0x7F

        value >>= 7

        if ((value === 0 && (byte & 0x40) === 0) || (value === -1 && (byte & 0x40) !== 0)) {
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
      let value = 0
      let shift = 0

      let byte: number

      while (true) {
        byte = cursor.readUint8OrThrow()

        value |= ((byte & 0x7F) << shift);

        if ((byte & 0x80) === 0)
          break

        shift += 7;

        if (shift > 35)
          throw new Error("LEB128 value too large")

        continue
      }

      if ((byte & 0x40) && (shift < 32))
        value |= (-1 << shift)

      return new I32(value)
    }

  }

  export class I33 {

    constructor(
      readonly value: bigint
    ) { }

    sizeOrThrow(): number {
      let value = this.value

      let size = 0

      while (true) {
        size += 1

        const byte = Number(value & 0x7Fn)

        value >>= 7n

        if ((value === 0n && (byte & 0x40) === 0) || (value === -1n && (byte & 0x40) !== 0))
          break

        continue
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

  export namespace I33 {

    export function readOrThrow(cursor: Cursor) {
      let value = 0n
      let shift = 0n

      let byte: number

      while (true) {
        byte = cursor.readUint8OrThrow()

        value |= (BigInt(byte & 0x7F) << shift);

        if ((byte & 0x80) === 0)
          break

        shift += 7n;

        if (shift > 35n)
          throw new Error("LEB128 value too large")

        continue
      }

      if ((byte & 0x40) && (shift < 64n))
        value |= (-1n << shift)

      return new I33(value)
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