import { Cursor } from "@hazae41/cursor";

declare global {
  interface Uint8Array {
    toHex(): string;
  }

  interface Uint8ArrayConstructor {
    fromHex(hex: string): Uint8Array<ArrayBuffer>;
  }

  interface Uint8Array {
    toBase64(): string;
  }

  interface Uint8ArrayConstructor {
    fromBase64(base64: string): Uint8Array<ArrayBuffer>;
  }
}

type Pack = Array<number | bigint | Uint8Array | Pack | null>

const size = (input: Pack): number => {
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

const encode = (input: Pack): Uint8Array<ArrayBuffer> => {
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

const ed25519 = "38903647f7edf7092297ce144c4704a495b57683ca8ef2c0a1cefc0a2bc01967"

const signer = await crypto.subtle.importKey("pkcs8", Uint8Array.fromBase64("MC4CAQAwBQYDK2VwBCIEIOZmpSIQYsiOya6stoqWQ2cOBcuN0F/AmmU2c0wldqXb"), "Ed25519", true, ["sign"]);
const verifier = Uint8Array.fromBase64("QByZynvXGhaEscyTs8L2h8FWBnNIpAq52mE8SkeLSvQ=")

const address = new Uint8Array(await crypto.subtle.digest("SHA-256", encode([Uint8Array.fromHex(ed25519), verifier]))).slice(12)

console.log(address.toHex())

const submodule = Uint8Array.fromHex("43895e5c28214e2cc638c7586fdd8d2c09c706df2b70dfe58b01b4e2cc1af521")
const submethod = new TextEncoder().encode("mint")
const subargs = encode([address, 100n])

const message = encode([Uint8Array.fromHex("8a8f19d1de0e4fcd9ab15cd7ed5de6dd"), submodule, submethod, subargs, 0n])
const signature = new Uint8Array(await crypto.subtle.sign("Ed25519", signer, message))

const args = encode([submodule, submethod, subargs, verifier, signature])

const body = new FormData()
body.append("name", ed25519)
body.append("func", "main")
body.append("args", new Blob([args]))

{
  const start = performance.now()

  const response = await fetch("http://bob.localhost:8080/api/execute", { method: "POST", body });

  if (!response.ok)
    throw new Error("Failed", { cause: response })

  console.log(await response.bytes().then(r => r.toHex()))

  const until = performance.now()

  console.log(`Executed in ${(until - start).toFixed(2)}ms`)
}