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

function size(input: Pack): number {
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

function encode(input: Pack): Uint8Array<ArrayBuffer> {
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

function decode(bytes: Uint8Array<ArrayBuffer>): Pack {
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

const ed25519 = "38903647f7edf7092297ce144c4704a495b57683ca8ef2c0a1cefc0a2bc01967"

const signer = await crypto.subtle.importKey("pkcs8", Uint8Array.fromBase64("MC4CAQAwBQYDK2VwBCIEIOZmpSIQYsiOya6stoqWQ2cOBcuN0F/AmmU2c0wldqXb"), "Ed25519", true, ["sign"]);
const verifier = Uint8Array.fromBase64("QByZynvXGhaEscyTs8L2h8FWBnNIpAq52mE8SkeLSvQ=")

const address = new Uint8Array(await crypto.subtle.digest("SHA-256", encode([Uint8Array.fromHex(ed25519), verifier]))).slice(-20)

async function execute(module: string, method: string, args: Uint8Array<ArrayBuffer>) {
  const body = new FormData()
  body.append("name", module)
  body.append("func", method)
  body.append("args", new Blob([args]))

  const start = performance.now()

  const response = await fetch("http://bob.localhost:8080/api/execute", { method: "POST", body });

  const until = performance.now()

  if (!response.ok)
    throw new Error("Failed", { cause: response })

  const result = decode(await response.bytes())

  console.log(result)

  console.log(`Executed in ${(until - start).toFixed(2)}ms`)

  return result
}

async function signAndExecute(submodule: string, submethod: string, subargs: Uint8Array<ArrayBuffer>) {
  const submoduleAsBytes = Uint8Array.fromHex(submodule)
  const submethodAsBytes = new TextEncoder().encode(submethod)

  const [nonce] = await execute(ed25519, "nonce", encode([address]))

  const message = encode([Uint8Array.fromHex("8a8f19d1de0e4fcd9ab15cd7ed5de6dd"), submoduleAsBytes, submethodAsBytes, subargs, nonce])
  const signature = new Uint8Array(await crypto.subtle.sign("Ed25519", signer, message))

  await execute(ed25519, "main", encode([submoduleAsBytes, submethodAsBytes, subargs, verifier, signature]));
}

await signAndExecute("43895e5c28214e2cc638c7586fdd8d2c09c706df2b70dfe58b01b4e2cc1af521", "transfer", encode([Uint8Array.fromHex("deadbeef"), 42n]))