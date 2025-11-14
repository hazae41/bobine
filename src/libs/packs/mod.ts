import { Cursor } from "@hazae41/cursor";

export type Pack = Array<number | bigint | Uint8Array | Pack | null>

export namespace Pack {

  export function size(input: Pack): number {
    let length = 0

    for (const arg of input) {
      if (typeof arg === "number") {
        length += 1 + 4
        continue
      }

      if (typeof arg === "bigint") {
        length += 1 + 8
        continue
      }

      if (arg instanceof Uint8Array) {
        length += 1 + 4 + arg.length
        continue
      }

      if (Array.isArray(arg)) {
        length += 1 + 4 + size(arg)
        continue
      }

      length += 1
      continue
    }

    return length
  }

  export function encode(input: Pack): Uint8Array<ArrayBuffer> {
    const bytes = new Uint8Array(size(input))

    const cursor = new Cursor(bytes)

    for (const arg of input) {
      if (typeof arg === "number") {
        cursor.writeUint8OrThrow(1)
        cursor.writeUint32OrThrow(arg, true)
        continue
      }

      if (typeof arg === "bigint") {
        cursor.writeUint8OrThrow(2)
        cursor.writeUint64OrThrow(arg, true)
        continue
      }

      if (arg instanceof Uint8Array) {
        cursor.writeUint8OrThrow(3)
        cursor.writeUint32OrThrow(arg.length, true)
        cursor.writeOrThrow(arg)
        continue
      }

      if (Array.isArray(arg)) {
        cursor.writeUint8OrThrow(4)
        const packed = encode(arg)
        cursor.writeUint32OrThrow(packed.length, true)
        cursor.writeOrThrow(packed)
        continue
      }

      cursor.writeUint8OrThrow(0)
    }

    return bytes
  }

  export function decode(bytes: Uint8Array<ArrayBuffer>): Pack {
    const pack = []

    const cursor = new Cursor(bytes)

    while (cursor.offset < cursor.length) {
      const type = cursor.readUint8OrThrow()

      if (type === 0) {
        pack.push(null)
        continue
      }

      if (type === 1) {
        pack.push(cursor.readUint32OrThrow(true))
        continue
      }

      if (type === 2) {
        pack.push(cursor.readUint64OrThrow(true))
        continue
      }

      if (type === 3) {
        const length = cursor.readUint32OrThrow(true)
        pack.push(cursor.readOrThrow(length))
        continue
      }

      if (type === 4) {
        const length = cursor.readUint32OrThrow(true)
        const subbytes = cursor.readOrThrow(length)
        pack.push(decode(subbytes))
        continue
      }
    }

    return pack
  }

  export function parse(values: string[]): Pack {
    const pack: Pack = []

    for (const arg of values) {
      if (arg.startsWith("0x")) {
        pack.push(Uint8Array.fromHex(arg.slice(2)))
        continue
      }

      if (arg.endsWith("n")) {
        pack.push(BigInt(arg.slice(0, -1)))
        continue
      }

      pack.push(Number(arg))
      continue
    }

    return pack
  }


}