// deno-lint-ignore-file no-namespace

import type { Cursor } from "@hazae41/cursor";

export type Packable = null | number | Uint8Array | string | bigint | Array<Packable>

export class Packed {

  constructor(
    readonly value: Packable
  ) { }

  size() {
    return Packed.size(this.value)
  }

  write(cursor: Cursor) {
    Packed.write(this.value, cursor)
  }

}

export namespace Packed {

  export function read(cursor: Cursor): Packable {
    const type = cursor.readUint8()

    if (type === 0)
      return null

    if (type === 1)
      return cursor.readFloat64(true)

    if (type === 2)
      return cursor.read(cursor.readUint32(true))

    if (type === 3) {
      const size = cursor.readUint32(true)
      const data = cursor.read(size)

      return new TextDecoder().decode(data)
    }

    if (type === 4) {
      const negative = cursor.readUint8()

      const size = cursor.readUint32(true)
      const data = cursor.read(size)

      const absolute = BigInt("0x" + data.toHex())

      return negative ? -absolute : absolute
    }

    if (type === 5) {
      const length = cursor.readUint32(true)
      const values = new Array<Packable>(length)

      for (let i = 0; i < length; i++)
        values[i] = read(cursor)

      return values
    }

    throw new Error("Unknown pack type")
  }

  export function size(value: Packable) {
    if (value == null)
      return 1

    if (typeof value === "number")
      return 1 + 8

    if (value instanceof Uint8Array)
      return 1 + 4 + value.length

    if (typeof value === "string")
      return 1 + 4 + new TextEncoder().encode(value).length

    if (typeof value === "bigint") {
      const absolute = value < 0n ? -value : value

      const text = absolute.toString(16)
      const data = Uint8Array.fromHex(text.length % 2 === 1 ? "0" + text : text)

      return 1 + 1 + 4 + data.length
    }

    if (Array.isArray(value)) {
      let total = 0

      total += 1

      total += 4

      for (const subvalue of value)
        total += size(subvalue)

      return total
    }

    throw new Error("Unknown pack value")
  }

  export function write(value: Packable, cursor: Cursor) {
    if (value == null) {
      cursor.writeUint8(0)

      return
    }

    if (typeof value === "number") {
      cursor.writeUint8(1)

      cursor.writeFloat64(value, true)

      return
    }

    if (value instanceof Uint8Array) {
      cursor.writeUint8(2)

      cursor.writeUint32(value.length, true)
      cursor.write(value)

      return
    }

    if (typeof value === "string") {
      cursor.writeUint8(3)

      const data = new TextEncoder().encode(value)

      cursor.writeUint32(data.length, true)
      cursor.write(data)

      return
    }

    if (typeof value === "bigint") {
      cursor.writeUint8(4)

      const [negative, absolute] = value < 0n ? [1, -value] : [0, value]

      const text = absolute.toString(16)
      const data = Uint8Array.fromHex(text.length % 2 === 1 ? "0" + text : text)

      cursor.writeUint8(negative)

      cursor.writeUint32(data.length, true)
      cursor.write(data)

      return
    }

    if (Array.isArray(value)) {
      cursor.writeUint8(5)

      cursor.writeUint32(value.length, true)

      for (const subvalue of value)
        write(subvalue, cursor)

      return
    }

    throw new Error("Unknown pack value")
  }

}