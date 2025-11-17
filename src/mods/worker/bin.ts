// deno-lint-ignore-file no-explicit-any
import { Readable, Writable } from "@hazae41/binary";
import { Cursor } from "@hazae41/cursor";
import { RpcErr, RpcError, RpcMethodNotFoundError, RpcOk, type RpcRequestInit } from "@hazae41/jsonrpc";
import { Buffer } from "node:buffer";
import { existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { meter } from "../../libs/metering/mod.ts";
import { Module } from "../../libs/wasm/mod.ts";

declare const self: DedicatedWorkerGlobalScope;

const helper = new Worker(import.meta.resolve(`@/mods/helper/bin.ts${new URL(import.meta.url).search}`), { type: "module" })

function run(module: string, method: string, params: Uint8Array<ArrayBuffer>, mode: number) {
  const exports: WebAssembly.Imports = {}

  let sparks = 10000

  const blobs = new Map<symbol, Uint8Array>()
  const packs = new Map<symbol, Array<number | bigint | symbol | null>>()

  const cache = new Map<symbol, symbol>()

  const writes = new Array<[string, Uint8Array, Uint8Array]>()

  const size = (input: Array<number | bigint | symbol | null>): number => {
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

      if (typeof arg === "symbol") {
        const blob = blobs.get(arg)

        if (blob != null) {
          length += 1 + 4 + blob.length
          continue
        }

        const pack = packs.get(arg)

        if (pack != null) {
          length += 1 + 4 + size(pack)
          continue
        }

        throw new Error("Could not resolve symbol")
      }

      length += 1
      continue
    }

    return length
  }

  const encode = (input: Array<number | bigint | symbol | null>): Uint8Array => {
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
        cursor.writeBigUint64OrThrow(arg, true)
        continue
      }

      if (typeof arg === "symbol") {
        const blob = blobs.get(arg)

        if (blob != null) {
          cursor.writeUint8OrThrow(3)
          cursor.writeUint32OrThrow(blob.length, true)
          cursor.writeOrThrow(blob)
          continue
        }

        const pack = packs.get(arg)

        if (pack != null) {
          const encoded = encode(pack)

          cursor.writeUint8OrThrow(4)
          cursor.writeUint32OrThrow(encoded.length, true)
          cursor.writeOrThrow(encoded)
          continue
        }

        throw new Error("Could not resolve symbol")
      }

      cursor.writeUint8OrThrow(0)
    }

    return bytes
  }

  const decode = (bytes: Uint8Array): Array<number | bigint | symbol | null> => {
    const values = new Array<number | bigint | symbol | null>()

    const cursor = new Cursor(bytes)

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
        const data = cursor.readOrThrow(size)

        const blob = Symbol()

        blobs.set(blob, data)

        values.push(blob)
        continue
      }

      if (type === 4) {
        const size = cursor.readUint32OrThrow(true)
        const data = cursor.readOrThrow(size)

        const blob = Symbol()

        packs.set(blob, decode(data))

        values.push(blob)
        continue
      }

      throw new Error("Unknown type")
    }

    return values
  }

  const sha256 = (payload: Uint8Array): Uint8Array => {
    const result = new Int32Array(new SharedArrayBuffer((1 + 32) * 4))

    helper.postMessage({ method: "sha256_digest", params: [payload], result })

    if (Atomics.wait(result, 0, 0) !== "ok")
      throw new Error("Failed to wait")
    if (result[0] === 2)
      throw new Error("Internal error")

    const digest = new Uint8Array(32)

    digest.set(new Uint8Array(result.buffer, 4, 32))

    return digest
  }

  const consume = (amount: number) => {
    sparks -= amount

    if (sparks < 0)
      throw new Error("Out of sparks")

    return
  }

  const load = (module: string): WebAssembly.WebAssemblyInstantiatedSource => {
    const current: WebAssembly.WebAssemblyInstantiatedSource = {} as any

    const imports: WebAssembly.Imports = {}

    imports["env"] = {
      mode: mode,
      abort: (): never => {
        throw new Error("Aborted")
      }
    }

    imports["sparks"] = {
      remaining: (): number => {
        return sparks
      },
      consume: (amount: number): void => {
        consume(amount >>> 0)
      }
    }

    imports["console"] = {
      log: (messageAsBlob: symbol): void => {
        const messageAsBytes = blobs.get(messageAsBlob)

        if (messageAsBytes == null)
          throw new Error("Not found")

        console.log(new TextDecoder().decode(messageAsBytes))
      }
    }

    imports["blobs"] = {
      save: (offset: number, length: number): symbol => {
        const { memory } = current.instance.exports as { memory: WebAssembly.Memory }

        const blob = Symbol()

        const slice = new Uint8Array(memory.buffer, offset >>> 0, length >>> 0)

        blobs.set(blob, slice.slice())

        return blob
      },
      size: (blob: symbol): number => {
        const bytes = blobs.get(blob)

        if (bytes == null)
          throw new Error("Not found")

        return bytes.length
      },
      load: (blob: symbol, offset: number): void => {
        const { memory } = current.instance.exports as { memory: WebAssembly.Memory }

        const bytes = blobs.get(blob)

        if (bytes == null)
          throw new Error("Not found")

        const slice = new Uint8Array(memory.buffer, offset >>> 0, bytes.length)

        slice.set(bytes)
      },
      concat: (leftAsBlob: symbol, rightAsBlob: symbol): symbol => {
        const leftAsBytes = blobs.get(leftAsBlob)
        const rightAsBytes = blobs.get(rightAsBlob)

        if (leftAsBytes == null)
          throw new Error("Not found")
        if (rightAsBytes == null)
          throw new Error("Not found")

        const concatAsBytes = new Uint8Array(leftAsBytes.length + rightAsBytes.length)
        concatAsBytes.set(leftAsBytes, 0)
        concatAsBytes.set(rightAsBytes, leftAsBytes.length)

        const concatAsBlob = Symbol()

        blobs.set(concatAsBlob, concatAsBytes)

        return concatAsBlob
      },
      equals: (leftAsBlob: symbol, rightAsBlob: symbol): boolean => {
        const leftAsBytes = blobs.get(leftAsBlob)
        const rightAsBytes = blobs.get(rightAsBlob)

        if (leftAsBytes == null)
          throw new Error("Not found")
        if (rightAsBytes == null)
          throw new Error("Not found")

        if (leftAsBytes.length !== rightAsBytes.length)
          return false

        return !Buffer.compare(leftAsBytes, rightAsBytes)
      },
      from_hex: (textAsBlob: symbol): symbol => {
        const textAsBytes = blobs.get(textAsBlob)

        if (textAsBytes == null)
          throw new Error("Not found")

        const outputAsBlob = Symbol()

        blobs.set(outputAsBlob, Uint8Array.fromHex(new TextDecoder().decode(textAsBytes)))

        return outputAsBlob
      },
      from_base64: (inputAsBlob: symbol): symbol => {
        const inputAsBytes = blobs.get(inputAsBlob)

        if (inputAsBytes == null)
          throw new Error("Not found")

        const outputAsBlob = Symbol()

        blobs.set(outputAsBlob, Uint8Array.fromBase64(new TextDecoder().decode(inputAsBytes)))

        return outputAsBlob
      },
      to_hex: (inputAsBlob: symbol): symbol => {
        const inputAsBytes = blobs.get(inputAsBlob)

        if (inputAsBytes == null)
          throw new Error("Not found")

        const outputAsBlob = Symbol()

        blobs.set(outputAsBlob, new TextEncoder().encode(inputAsBytes.toHex()))

        return outputAsBlob
      },
      to_base64: (inputAsBlob: symbol): symbol => {
        const inputsAsBytes = blobs.get(inputAsBlob)

        if (inputsAsBytes == null)
          throw new Error("Not found")

        const outputAsBlob = Symbol()

        blobs.set(outputAsBlob, new TextEncoder().encode(inputsAsBytes.toBase64()))

        return outputAsBlob
      }
    }

    const symbols = new Array<symbol>()
    const numbers = new Map<symbol, number>()

    imports["symbols"] = {
      create: (): symbol => {
        return Symbol()
      },
      numerize: (symbol: symbol): number => {
        const stale = numbers.get(symbol)

        if (stale != null)
          return stale

        const fresh = symbols.push(symbol) - 1

        numbers.set(symbol, fresh)

        return fresh
      },
      denumerize: (index: number): symbol => {
        const symbol = symbols.at(index >>> 0)

        if (symbol == null)
          throw new Error("Not found")

        return symbol
      }
    }

    imports["modules"] = {
      create: (wasmAsBlob: symbol, saltAsBlob: symbol): symbol => {
        const wasmAsBytes = blobs.get(wasmAsBlob)

        if (wasmAsBytes == null)
          throw new Error("Not found")

        const saltAsBytes = blobs.get(saltAsBlob)

        if (saltAsBytes == null)
          throw new Error("Not found")

        const packAsBytes = encode([wasmAsBlob, saltAsBlob])

        const digestOfWasmAsBytes = sha256(wasmAsBytes)
        const digestOfPackAsBytes = sha256(packAsBytes)

        const digestOfWasmAsHex = digestOfWasmAsBytes.toHex()
        const digestOfPackAsHex = digestOfPackAsBytes.toHex()

        if (!existsSync(`./local/scripts/${digestOfPackAsHex}.wasm`)) {
          mkdirSync(`./local/scripts`, { recursive: true })

          writeFileSync(`./local/scripts/${digestOfWasmAsHex}.wasm`, wasmAsBytes)

          symlinkSync(`./${digestOfWasmAsHex}.wasm`, `./local/scripts/${digestOfPackAsHex}.wasm`, "file")
        }

        const moduleAsBlob = Symbol()

        blobs.set(moduleAsBlob, digestOfPackAsBytes)

        return moduleAsBlob
      },
      call: (moduleAsBlob: symbol, methodAsBlob: symbol, paramsAsPack: symbol): symbol => {
        const moduleAsBytes = blobs.get(moduleAsBlob)

        if (moduleAsBytes == null)
          throw new Error("Not found")

        const moduleAsString = moduleAsBytes.toHex()

        const methodAsBytes = blobs.get(methodAsBlob)

        if (methodAsBytes == null)
          throw new Error("Not found")

        const methodAsString = new TextDecoder().decode(methodAsBytes)

        if (exports[moduleAsString] == null)
          load(moduleAsString)

        if (typeof exports[moduleAsString][methodAsString] !== "function")
          throw new Error("Not found")

        const paramsAsValues = packs.get(paramsAsPack)

        if (paramsAsValues == null)
          throw new Error("Not found")

        const resultAsPack = Symbol()

        packs.set(resultAsPack, [exports[moduleAsString][methodAsString](...paramsAsValues)])

        return resultAsPack
      },
      load: (moduleAsBlob: symbol): symbol => {
        const moduleAsBytes = blobs.get(moduleAsBlob)

        if (moduleAsBytes == null)
          throw new Error("Not found")

        const wasmAsBlob = Symbol()

        blobs.set(wasmAsBlob, readFileSync(`./local/scripts/${moduleAsBytes.toHex()}.wasm`))

        return wasmAsBlob
      },
      self: (): symbol => {
        const blob = Symbol()

        blobs.set(blob, Uint8Array.fromHex(module))

        return blob
      }
    }

    imports["sha256"] = {
      digest: (payloadAsBlob: symbol): symbol => {
        const payloadAsBytes = blobs.get(payloadAsBlob)

        if (payloadAsBytes == null)
          throw new Error("Not found")

        const blob = Symbol()

        blobs.set(blob, sha256(payloadAsBytes))

        return blob
      }
    }

    imports["ed25519"] = {
      verify: (pubkeyAsBlob: symbol, signatureAsBlob: symbol, payloadAsBlob: symbol): boolean => {
        const pubkeyAsBytes = blobs.get(pubkeyAsBlob)
        const signatureAsBytes = blobs.get(signatureAsBlob)
        const payloadAsBytes = blobs.get(payloadAsBlob)

        if (pubkeyAsBytes == null)
          throw new Error("Not found")
        if (signatureAsBytes == null)
          throw new Error("Not found")
        if (payloadAsBytes == null)
          throw new Error("Not found")

        const result = new Int32Array(new SharedArrayBuffer(4 + 4))

        helper.postMessage({ method: "ed25519_verify", params: [pubkeyAsBytes, signatureAsBytes, payloadAsBytes], result })

        if (Atomics.wait(result, 0, 0) !== "ok")
          throw new Error("Failed to wait")
        if (result[0] === 2)
          throw new Error("Internal error")

        return result[1] === 1
      }
    }

    imports["packs"] = {
      create: (...values: Array<number | bigint | symbol | null>): symbol => {
        const pack = Symbol()

        packs.set(pack, values)

        return pack
      },
      concat: (leftAsPack: symbol, rightAsPack: symbol): symbol => {
        const leftAsValues = packs.get(leftAsPack)
        const rightAsValues = packs.get(rightAsPack)

        if (leftAsValues == null)
          throw new Error("Not found")
        if (rightAsValues == null)
          throw new Error("Not found")

        const concatAsPack = Symbol()

        packs.set(concatAsPack, [...leftAsValues, ...rightAsValues])

        return concatAsPack
      },
      length: (pack: symbol): number => {
        const values = packs.get(pack)

        if (values == null)
          throw new Error("Not found")

        return values.length
      },
      get(pack: symbol, index: number): number | bigint | symbol | null {
        const values = packs.get(pack)

        if (values == null)
          throw new Error("Not found")
        if ((index >>> 0) > values.length - 1)
          throw new Error("Out of bounds")

        return values[index >>> 0]
      },
      encode: (pack: symbol): symbol => {
        const values = packs.get(pack)

        if (values == null)
          throw new Error("Not found")

        const blob = Symbol()

        blobs.set(blob, encode(values))

        return blob
      },
      decode: (blob: symbol): symbol => {
        const bytes = blobs.get(blob)

        if (bytes == null)
          throw new Error("Not found")

        const pack = Symbol()

        packs.set(pack, decode(bytes))

        return pack
      }
    }

    imports["storage"] = {
      set: (keyAsBlob: symbol, valueAsBlob: symbol): void => {
        const keyAsBytes = blobs.get(keyAsBlob)
        const valueAsBytes = blobs.get(valueAsBlob)

        if (keyAsBytes == null)
          throw new Error("Not found")
        if (valueAsBytes == null)
          throw new Error("Not found")

        cache.set(keyAsBlob, valueAsBlob)

        writes.push([module, keyAsBytes, valueAsBytes])

        return
      },
      get: (keyAsBlob: symbol): symbol | null => {
        const keyAsBytes = blobs.get(keyAsBlob)

        if (keyAsBytes == null)
          throw new Error("Not found")

        const staleValueAsBlob = cache.get(keyAsBlob)

        if (staleValueAsBlob != null)
          return staleValueAsBlob

        const result = new Int32Array(new SharedArrayBuffer(4 + 4 + 4, { maxByteLength: ((4 + 4 + 4) + (1024 * 1024)) }))

        helper.postMessage({ method: "storage_get", params: [module, keyAsBytes], result })

        if (Atomics.wait(result, 0, 0) !== "ok")
          throw new Error("Failed to wait")
        if (result[0] === 2)
          throw new Error("Internal error")
        if (result[1] === 2)
          return null

        const valueAsBytes = new Uint8Array(result.buffer, 4 + 4 + 4, result[2]).slice()
        const valueAsBlob = Symbol()

        blobs.set(valueAsBlob, valueAsBytes)
        cache.set(keyAsBlob, valueAsBlob)

        return valueAsBlob
      }
    }

    imports["chain"] = {
      uuid: (): symbol => {
        const blob = Symbol()

        blobs.set(blob, Uint8Array.fromHex("8a8f19d1de0e4fcd9ab15cd7ed5de6dd"))

        return blob
      }
    }

    const wasmAsBytes = readFileSync(`./local/scripts/${module}.wasm`)

    consume(wasmAsBytes.length)

    const wasmAsParsed = Readable.readFromBytesOrThrow(Module, wasmAsBytes)

    meter(wasmAsParsed, "sparks", "consume")

    const wasmAsModule = new WebAssembly.Module(Writable.writeToBytesOrThrow(wasmAsParsed))

    for (const descriptor of WebAssembly.Module.imports(wasmAsModule)) {
      if (imports[descriptor.module] != null) {
        // NOOP
        continue
      }

      if (exports[descriptor.module] != null) {
        imports[descriptor.module] = exports[descriptor.module]
        continue
      }

      const { instance } = load(descriptor.module)

      imports[descriptor.module] = instance.exports

      continue
    }

    const wasmAsInstance = new WebAssembly.Instance(wasmAsModule, imports)

    current.instance = wasmAsInstance
    current.module = wasmAsModule

    exports[module] = wasmAsInstance.exports

    return current
  }

  const { instance } = load(module)

  if (typeof instance.exports[method] !== "function")
    throw new Error("Not found")

  const result = encode([instance.exports[method](...decode(params))])

  return { result, writes }
}

self.addEventListener("message", (event: MessageEvent<RpcRequestInit>) => {
  try {
    const request = event.data

    if (request.method === "execute") {
      const [module, method, params] = request.params as [string, string, Uint8Array<ArrayBuffer>]

      const start = performance.now()

      const { result, writes } = run(module, method, params, 1)

      const until = performance.now()

      console.log(`Evaluated ${(until - start).toFixed(2)}ms`)

      if (writes.length) {
        const result = new Int32Array(new SharedArrayBuffer(4 + 4))

        helper.postMessage({ method: "storage_set", params: [module, method, params, writes], result })

        if (Atomics.wait(result, 0, 0) !== "ok")
          throw new Error("Failed to wait")
        if (result[0] === 2)
          throw new Error("Internal error")

        console.log(`Wrote ${writes.length} events to storage`)
      }

      self.postMessage(new RpcOk(request.id, result))

      return
    }

    if (request.method === "simulate") {
      const [module, method, params] = request.params as [string, string, Uint8Array<ArrayBuffer>]

      const start = performance.now()

      const { result } = run(module, method, params, 2)

      const until = performance.now()

      console.log(`Evaluated ${(until - start).toFixed(2)}ms`)

      self.postMessage(new RpcOk(request.id, result))

      return
    }

    throw new RpcMethodNotFoundError()
  } catch (cause: unknown) {
    const request = event.data

    console.error(cause)

    self.postMessage(new RpcErr(request.id, RpcError.rewrap(cause)))
  }
})