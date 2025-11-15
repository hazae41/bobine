import type { Writable } from "@hazae41/binary";
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
    public sections: Section[]
  ) { }

}

export namespace Body {

  export function readOrThrow(cursor: Cursor) {
    const sections: Section[] = []

    while (cursor.remaining > 0)
      sections.push(Section.readOrThrow(cursor))

    return new Body(sections)
  }

}

export type Section =
  | Section.Unknown
  | Section.Custom

export namespace Section {

  export class Unknown {

    constructor(
      readonly type: number,
      readonly data: Uint8Array
    ) { }

  }

  export function readOrThrow(cursor: Cursor) {
    const type = cursor.readUint8OrThrow()

    const size = LEB128.U32.readOrThrow(cursor)

    const data = cursor.readOrThrow(size.value)

    return new Unknown(type, data)
  }

  export class Custom {

    constructor(
      readonly name: string,
      readonly data: Uint8Array
    ) { }

    get type() {
      return Custom.type
    }

  }

  export namespace Custom {

    export const type = 0

    export function readOrThrow(cursor: Cursor) {
      const size = LEB128.U32.readOrThrow(cursor)

      const name = new TextDecoder().decode(cursor.readOrThrow(size.value))

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
          readonly method: number,
          readonly params: Writable[]
        ) { }

      }

      export namespace Instruction {

        export function readOrThrow(cursor: Cursor) {
          const method = cursor.readUint8OrThrow()

          if (method === 0x00)
            return new Instruction(method, [])
          if (method === 0x01)
            return new Instruction(method, [])
          if (method === 0x02)
            return new Instruction(method, [LEB128.I33.readOrThrow(cursor)])
          if (method === 0x03)
            return new Instruction(method, [LEB128.I33.readOrThrow(cursor)])
          if (method === 0x04)
            return new Instruction(method, [LEB128.I33.readOrThrow(cursor)])
          if (method === 0x05)
            return new Instruction(method, [])
          if (method === 0x0b)
            return new Instruction(method, [])
          if (method === 0x0c)
            return new Instruction(method, [LEB128.U32.readOrThrow(cursor)])
          if (method === 0x0d)
            return new Instruction(method, [LEB128.U32.readOrThrow(cursor)])
          if (method === 0x0f)
            return new Instruction(method, [])
          if (method === 0x10)
            return new Instruction(method, [LEB128.U32.readOrThrow(cursor)])
          if (method === 0x1a)
            return new Instruction(method, [])
          if (method === 0x1b)
            return new Instruction(method, [])
          if (method >= 0x20 && method < 0x28)
            return new Instruction(method, [LEB128.U32.readOrThrow(cursor)])
          if (method >= 0x28 && method < 0x3f)
            return new Instruction(method, [LEB128.U32.readOrThrow(cursor), LEB128.U32.readOrThrow(cursor)])
          if (method === 0x3f)
            return new Instruction(method, [LEB128.U32.readOrThrow(cursor)])
          if (method === 0x40)
            return new Instruction(method, [LEB128.U32.readOrThrow(cursor)])
          if (method === 0x41)
            return new Instruction(method, [LEB128.I32.readOrThrow(cursor)])
          if (method === 0x42)
            return new Instruction(method, [LEB128.I64.readOrThrow(cursor)])
          if (method >= 0x45 && method < 0xd0)
            return new Instruction(method, [])

          throw new Error(`Unknown instruction 0x${method.toString(16).padStart(2, "0")}`)
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