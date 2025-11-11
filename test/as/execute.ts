import { Cursor } from "@hazae41/cursor";

declare global {
  interface Uint8Array {
    toHex(): string;
  }

  interface Uint8ArrayConstructor {
    fromHex(hex: string): Uint8Array<ArrayBuffer>;
  }
}

const [name, func, ...args] = process.argv.slice(2)

const body = new FormData()

body.append("name", name)
body.append("func", func)

let length = 0

for (const arg of args) {
  const bytes = Uint8Array.fromHex(arg)

  if (bytes == null)
    throw new Error("Not found")

  length += 1 + 4 + bytes.length
  continue
}

const bytes = new Uint8Array(length)

const cursor = new Cursor(bytes)

for (const arg of args) {
  const bytes = Uint8Array.fromHex(arg)

  if (bytes == null)
    throw new Error("Not found")

  cursor.writeUint8OrThrow(3)
  cursor.writeUint32OrThrow(bytes.length, true)
  cursor.writeOrThrow(bytes)
  continue
}

body.append("args", new Blob([bytes]))

{
  const start = performance.now()

  const response = await fetch("http://bob.localhost:8080/api/execute", { method: "POST", body });

  if (!response.ok)
    throw new Error("Failed", { cause: response })

  console.log(await response.bytes().then(r => r.toHex()))

  const until = performance.now()

  console.log(`Executed in ${(until - start).toFixed(2)}ms`)
}