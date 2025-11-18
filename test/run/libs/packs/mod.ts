import { Cursor } from "@hazae41/cursor";

export class Pack {

  constructor(
    readonly values: Array<Pack.Value>
  ) { }

  sizeOrThrow() {
    let size = 0

    for (const value of this.values) {
      if (typeof value === "number") {
        size += 1 + 4
        continue
      }

      if (typeof value === "bigint") {
        size += 1 + 8
        continue
      }

      if (value instanceof Uint8Array) {
        size += 1 + 4 + value.length
        continue
      }

      if (value instanceof Pack) {
        size += 1 + 4 + value.sizeOrThrow()
        continue
      }

      size += 1
      continue
    }

    return size
  }

  writeOrThrow(cursor: Cursor) {
    for (const value of this.values) {
      if (typeof value === "number") {
        cursor.writeUint8OrThrow(1)
        cursor.writeUint32OrThrow(value, true)
        continue
      }

      if (typeof value === "bigint") {
        cursor.writeUint8OrThrow(2)
        cursor.writeBigUint64OrThrow(value, true)
        continue
      }

      if (value instanceof Uint8Array) {
        cursor.writeUint8OrThrow(3)
        cursor.writeUint32OrThrow(value.length, true)
        cursor.writeOrThrow(value)
        continue
      }

      if (value instanceof Pack) {
        cursor.writeUint8OrThrow(4)
        cursor.writeUint32OrThrow(value.sizeOrThrow(), true)
        value.writeOrThrow(cursor)
        continue
      }

      cursor.writeUint8OrThrow(0)
    }
  }

}

export namespace Pack {

  export type Value = number | bigint | Uint8Array | Pack | null

  export function readOrThrow(cursor: Cursor): Pack {
    const values = []

    while (cursor.offset < cursor.length) {
      const type = cursor.readUint8OrThrow()

      if (type === 0) {
        values.push(null)
        continue
      }

      if (type === 1) {
        values.push(cursor.readUint32OrThrow(true))
        continue
      }

      if (type === 2) {
        values.push(cursor.readBigUint64OrThrow(true))
        continue
      }

      if (type === 3) {
        const size = cursor.readUint32OrThrow(true)
        values.push(cursor.readOrThrow(size))
        continue
      }

      if (type === 4) {
        const size = cursor.readUint32OrThrow(true)
        const data = new Cursor(cursor.readOrThrow(size))
        values.push(Pack.readOrThrow(data))
        continue
      }
    }

    return new Pack(values)
  }

}