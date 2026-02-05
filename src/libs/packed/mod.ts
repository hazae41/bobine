// deno-lint-ignore-file no-namespace

/// <reference types="../bytes/lib.d.ts"/>

import type { Cursor } from "@hazae41/cursor";

export type Packable = null | number | Uint8Array | string | bigint | Array<Packable>

export class Packed {

  constructor(
    readonly value: Packable
  ) { }

  sizeOrThrow() {
    return Packed.sizeOrThrow(this.value)
  }

  writeOrThrow(cursor: Cursor) {
    Packed.writeOrThrow(this.value, cursor)
  }

}

export namespace Packed {

  export function readOrThrow(cursor: Cursor): Packable {
    const type = cursor.readUint8OrThrow()

    if (type === 0)
      return null

    if (type === 1)
      return cursor.readFloat64OrThrow(true)

    if (type === 2)
      return cursor.readOrThrow(cursor.readUint32OrThrow(true))

    if (type === 3) {
      const size = cursor.readUint32OrThrow(true)
      const data = cursor.readOrThrow(size)

      return new TextDecoder().decode(data)
    }

    if (type === 4) {
      const negative = cursor.readUint8OrThrow()

      const size = cursor.readUint32OrThrow(true)
      const data = cursor.readOrThrow(size)

      const absolute = BigInt("0x" + data.toHex())

      return negative ? -absolute : absolute
    }

    if (type === 5) {
      const length = cursor.readUint32OrThrow(true)
      const values = new Array<Packable>(length)

      for (let i = 0; i < length; i++)
        values[i] = readOrThrow(cursor)

      return values
    }

    throw new Error("Unknown pack type")
  }

  export function sizeOrThrow(value: Packable) {
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
      let size = 0

      size += 1

      size += 4

      for (const subvalue of value)
        size += sizeOrThrow(subvalue)

      return size
    }

    throw new Error("Unknown pack value")
  }

  export function writeOrThrow(value: Packable, cursor: Cursor) {
    if (value == null) {
      cursor.writeUint8OrThrow(0)

      return
    }

    if (typeof value === "number") {
      cursor.writeUint8OrThrow(1)

      cursor.writeFloat64OrThrow(value, true)

      return
    }

    if (value instanceof Uint8Array) {
      cursor.writeUint8OrThrow(2)

      cursor.writeUint32OrThrow(value.length, true)
      cursor.writeOrThrow(value)

      return
    }

    if (typeof value === "string") {
      cursor.writeUint8OrThrow(3)

      const data = new TextEncoder().encode(value)

      cursor.writeUint32OrThrow(data.length, true)
      cursor.writeOrThrow(data)

      return
    }

    if (typeof value === "bigint") {
      cursor.writeUint8OrThrow(4)

      const [negative, absolute] = value < 0n ? [1, -value] : [0, value]

      const text = absolute.toString(16)
      const data = Uint8Array.fromHex(text.length % 2 === 1 ? "0" + text : text)

      cursor.writeUint8OrThrow(negative)

      cursor.writeUint32OrThrow(data.length, true)
      cursor.writeOrThrow(data)

      return
    }

    if (Array.isArray(value)) {
      cursor.writeUint8OrThrow(5)

      cursor.writeUint32OrThrow(value.length, true)

      for (const subvalue of value)
        writeOrThrow(subvalue, cursor)

      return
    }

    throw new Error("Unknown pack value")
  }

}