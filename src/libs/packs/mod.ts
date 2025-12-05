/// <reference types="../bytes/lib.d.ts"/>

import type { Cursor } from "@hazae41/cursor";

export class Pack {

  constructor(
    readonly values: Array<Pack.Value>
  ) { }

  sizeOrThrow() {
    let size = 0

    for (const value of this.values) {
      if (value == null) {
        size += 1
        continue
      }

      if (typeof value === "number") {
        size += 1 + 4
        continue
      }

      if (typeof value === "bigint") {
        const text = value.toString(16)
        const data = Uint8Array.fromHex(text.length % 2 === 1 ? "0" + text : text)

        size += 1 + 4 + data.length
        continue
      }

      if (value instanceof Uint8Array) {
        size += 1 + 4 + value.length
        continue
      }

      if (value instanceof Pack) {
        size += 1 + value.sizeOrThrow()
        continue
      }

      throw new Error("Unknown pack value")
    }

    size += 1

    return size
  }

  writeOrThrow(cursor: Cursor) {
    for (const value of this.values) {
      if (value == null) {
        cursor.writeUint8OrThrow(1)
        continue
      }

      if (typeof value === "number") {
        cursor.writeUint8OrThrow(2)
        cursor.writeFloat64OrThrow(value, true)
        continue
      }

      if (typeof value === "bigint") {
        cursor.writeUint8OrThrow(3)

        const text = value.toString(16)
        const data = Uint8Array.fromHex(text.length % 2 === 1 ? "0" + text : text)

        cursor.writeUint32OrThrow(data.length, true)
        cursor.writeOrThrow(data)
        continue
      }

      if (value instanceof Uint8Array) {
        cursor.writeUint8OrThrow(4)
        cursor.writeUint32OrThrow(value.length, true)
        cursor.writeOrThrow(value)
        continue
      }

      if (value instanceof Pack) {
        cursor.writeUint8OrThrow(5)
        value.writeOrThrow(cursor)
        continue
      }

      throw new Error("Unknown pack value")
    }

    cursor.writeUint8OrThrow(0)
    return
  }

}

export namespace Pack {

  export type Value = null | number | bigint | Uint8Array | Pack

  export function readOrThrow(cursor: Cursor): Pack {
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
        values.push(cursor.readFloat64OrThrow(true))
        continue
      }

      if (type === 3) {
        const size = cursor.readUint32OrThrow(true)
        const data = cursor.readOrThrow(size)
        values.push(BigInt("0x" + data.toHex()))
        continue
      }

      if (type === 4) {
        const size = cursor.readUint32OrThrow(true)
        values.push(cursor.readOrThrow(size))
        continue
      }

      if (type === 5) {
        values.push(Pack.readOrThrow(cursor))
        continue
      }

      throw new Error("Unknown pack type")
    }

    return new Pack(values)
  }

}