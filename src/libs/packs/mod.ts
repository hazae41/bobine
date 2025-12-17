// deno-lint-ignore-file no-namespace

/// <reference types="../bytes/lib.d.ts"/>

import type { Cursor } from "@hazae41/cursor";

export class Pack {

  constructor(
    readonly values: Array<Pack.Value>
  ) { }

  sizeOrThrow() {
    return Pack.sizeOrThrow(this.values)
  }

  writeOrThrow(cursor: Cursor) {
    Pack.writeOrThrow(this.values, cursor)
  }

}

export namespace Pack {

  export type Value = null | number | Uint8Array | string | bigint | Array<Value>

  export function readOrThrow(cursor: Cursor): Array<Value> {
    const values = []

    while (true) {
      const type = cursor.readUint8OrThrow()

      if (type === 0)
        break

      if (type === 1) {
        values.push(null)
        continue
      }

      if (type === 2) {
        values.push(Pack.readOrThrow(cursor))
        continue
      }

      if (type === 3) {
        values.push(cursor.readFloat64OrThrow(true))
        continue
      }

      if (type === 4) {
        const size = cursor.readUint32OrThrow(true)
        values.push(cursor.readOrThrow(size))
        continue
      }

      if (type === 5) {
        const size = cursor.readUint32OrThrow(true)
        const data = cursor.readOrThrow(size)
        values.push(new TextDecoder().decode(data))
        continue
      }

      if (type === 6) {
        const negative = cursor.readUint8OrThrow()

        const size = cursor.readUint32OrThrow(true)
        const data = cursor.readOrThrow(size)

        const absolute = BigInt("0x" + data.toHex())

        values.push(negative ? -absolute : absolute)
        continue
      }

      throw new Error("Unknown pack type")
    }

    return values
  }

  export function sizeOrThrow(values: Array<Value>) {
    let size = 0

    for (const value of values) {
      if (value == null) {
        size += 1
        continue
      }

      if (Array.isArray(value)) {
        size += 1 + sizeOrThrow(value)
        continue
      }

      if (typeof value === "number") {
        size += 1 + 4
        continue
      }

      if (value instanceof Uint8Array) {
        size += 1 + 4 + value.length
        continue
      }

      if (typeof value === "string") {
        const data = new TextEncoder().encode(value)

        size += 1 + 4 + data.length
        continue
      }

      if (typeof value === "bigint") {
        const absolute = value < 0n ? -value : value

        const text = absolute.toString(16)
        const data = Uint8Array.fromHex(text.length % 2 === 1 ? "0" + text : text)

        size += 1 + 1 + 4 + data.length
        continue
      }

      throw new Error("Unknown pack value")
    }

    size += 1

    return size
  }

  export function writeOrThrow(values: Array<Value>, cursor: Cursor) {
    for (const value of values) {
      if (value == null) {
        cursor.writeUint8OrThrow(1)
        continue
      }

      if (Array.isArray(value)) {
        cursor.writeUint8OrThrow(2)
        writeOrThrow(value, cursor)
        continue
      }

      if (typeof value === "number") {
        cursor.writeUint8OrThrow(3)
        cursor.writeFloat64OrThrow(value, true)
        continue
      }

      if (value instanceof Uint8Array) {
        cursor.writeUint8OrThrow(4)
        cursor.writeUint32OrThrow(value.length, true)
        cursor.writeOrThrow(value)
        continue
      }

      if (typeof value === "string") {
        cursor.writeUint8OrThrow(5)

        const data = new TextEncoder().encode(value)

        cursor.writeUint32OrThrow(data.length, true)
        cursor.writeOrThrow(data)
        continue
      }

      if (typeof value === "bigint") {
        cursor.writeUint8OrThrow(6)

        const [negative, absolute] = value < 0n ? [1, -value] : [0, value]

        const text = absolute.toString(16)
        const data = Uint8Array.fromHex(text.length % 2 === 1 ? "0" + text : text)

        cursor.writeUint8OrThrow(negative)
        cursor.writeUint32OrThrow(data.length, true)
        cursor.writeOrThrow(data)
        continue
      }

      throw new Error("Unknown pack value")
    }

    cursor.writeUint8OrThrow(0)
    return
  }

}