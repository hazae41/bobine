// deno-lint-ignore-file no-explicit-any
import { Readable, Writable } from "@hazae41/binary";
import { RpcErr, RpcError, RpcMethodNotFoundError, RpcOk, type RpcRequestInit } from "@hazae41/jsonrpc";
import * as Wasm from "@hazae41/wasm";
import { Buffer } from "node:buffer";
import { existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { meter } from "../../libs/metering/mod.ts";
import { Pack } from "../../libs/packs/mod.ts";

declare const self: DedicatedWorkerGlobalScope;

const helper = new Worker(import.meta.resolve(`@/mods/helper/bin.ts${new URL(import.meta.url).search}`), { type: "module" })

function run(module: string, method: string, params: Uint8Array<ArrayBuffer>, mode: number) {
  const exports: WebAssembly.Imports = {}

  let sparks = 100000

  const blobs = new Map<symbol, Uint8Array>()
  const packs = new Map<symbol, Array<number | bigint | symbol | null>>()

  const cache = new Map<symbol, symbol>()

  const writes = new Array<[string, Uint8Array, Uint8Array]>()

  const repack = (values: Array<number | bigint | symbol | null>): Pack => {
    return new Pack(values.map(value => {
      if (typeof value !== "symbol")
        return value

      const blob = blobs.get(value)

      if (blob != null)
        return blob

      const pack = packs.get(value)

      if (pack != null)
        return repack(pack)

      throw new Error("Not found")
    }))
  }

  const unpack = (pack: Pack): Array<number | bigint | symbol | null> => {
    return pack.values.map(value => {
      if (value instanceof Pack) {
        const packref = Symbol()

        packs.set(packref, unpack(value))

        return packref
      }

      if (value instanceof Uint8Array) {
        const blobref = Symbol()

        blobs.set(blobref, value)

        return blobref
      }

      return value
    })
  }

  const encode = (values: Array<number | bigint | symbol | null>): Uint8Array => {
    return Writable.writeToBytesOrThrow(repack(values))
  }

  const decode = (bytes: Uint8Array): Array<number | bigint | symbol | null> => {
    return unpack(Readable.readFromBytesOrThrow(Pack, bytes))
  }

  const sha256 = (payload: Uint8Array): Uint8Array => {
    consume(payload.length * 256)

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
      log: (blobref: symbol): void => {
        const bytes = blobs.get(blobref)

        if (bytes == null)
          throw new Error("Not found")

        console.log(new TextDecoder().decode(bytes))
      }
    }

    imports["blobs"] = {
      save: (offset: number, length: number): symbol => {
        const { memory } = current.instance.exports as { memory: WebAssembly.Memory }

        const blobref = Symbol()

        const slice = new Uint8Array(memory.buffer, offset >>> 0, length >>> 0)

        blobs.set(blobref, slice.slice())

        return blobref
      },
      size: (blobref: symbol): number => {
        const bytes = blobs.get(blobref)

        if (bytes == null)
          throw new Error("Not found")

        return bytes.length
      },
      load: (blobref: symbol, offset: number): void => {
        const { memory } = current.instance.exports as { memory: WebAssembly.Memory }

        const bytes = blobs.get(blobref)

        if (bytes == null)
          throw new Error("Not found")

        const slice = new Uint8Array(memory.buffer, offset >>> 0, bytes.length)

        slice.set(bytes)
      },
      concat: (leftAsBlobref: symbol, rightAsBlobref: symbol): symbol => {
        const leftAsBytes = blobs.get(leftAsBlobref)
        const rightAsBytes = blobs.get(rightAsBlobref)

        if (leftAsBytes == null)
          throw new Error("Not found")
        if (rightAsBytes == null)
          throw new Error("Not found")

        const concatAsBytes = new Uint8Array(leftAsBytes.length + rightAsBytes.length)
        concatAsBytes.set(leftAsBytes, 0)
        concatAsBytes.set(rightAsBytes, leftAsBytes.length)

        const concatAsBlobref = Symbol()

        blobs.set(concatAsBlobref, concatAsBytes)

        return concatAsBlobref
      },
      equals: (leftAsBlobref: symbol, rightAsBlobref: symbol): boolean => {
        const leftAsBytes = blobs.get(leftAsBlobref)
        const rightAsBytes = blobs.get(rightAsBlobref)

        if (leftAsBytes == null)
          throw new Error("Not found")
        if (rightAsBytes == null)
          throw new Error("Not found")

        if (leftAsBytes.length !== rightAsBytes.length)
          return false

        return !Buffer.compare(leftAsBytes, rightAsBytes)
      },
      from_hex: (textAsBlobref: symbol): symbol => {
        const textAsBytes = blobs.get(textAsBlobref)

        if (textAsBytes == null)
          throw new Error("Not found")

        const outputAsBlobref = Symbol()

        blobs.set(outputAsBlobref, Uint8Array.fromHex(new TextDecoder().decode(textAsBytes)))

        return outputAsBlobref
      },
      from_base64: (inputAsBlobref: symbol): symbol => {
        const inputAsBytes = blobs.get(inputAsBlobref)

        if (inputAsBytes == null)
          throw new Error("Not found")

        const outputAsBlobref = Symbol()

        blobs.set(outputAsBlobref, Uint8Array.fromBase64(new TextDecoder().decode(inputAsBytes)))

        return outputAsBlobref
      },
      to_hex: (inputAsBlobref: symbol): symbol => {
        const inputAsBytes = blobs.get(inputAsBlobref)

        if (inputAsBytes == null)
          throw new Error("Not found")

        const outputAsBlobref = Symbol()

        blobs.set(outputAsBlobref, new TextEncoder().encode(inputAsBytes.toHex()))

        return outputAsBlobref
      },
      to_base64: (inputAsBlobref: symbol): symbol => {
        const inputsAsBytes = blobs.get(inputAsBlobref)

        if (inputsAsBytes == null)
          throw new Error("Not found")

        const outputAsBlobref = Symbol()

        blobs.set(outputAsBlobref, new TextEncoder().encode(inputsAsBytes.toBase64()))

        return outputAsBlobref
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
      create: (wasmAsBlobref: symbol, saltAsBlobref: symbol): symbol => {
        const wasmAsBytes = blobs.get(wasmAsBlobref)

        if (wasmAsBytes == null)
          throw new Error("Not found")

        const saltAsBytes = blobs.get(saltAsBlobref)

        if (saltAsBytes == null)
          throw new Error("Not found")

        const packAsBytes = encode([wasmAsBlobref, saltAsBlobref])

        const digestOfWasmAsBytes = sha256(wasmAsBytes)
        const digestOfPackAsBytes = sha256(packAsBytes)

        const digestOfWasmAsHex = digestOfWasmAsBytes.toHex()
        const digestOfPackAsHex = digestOfPackAsBytes.toHex()

        if (!existsSync(`./local/scripts/${digestOfPackAsHex}.wasm`)) {
          mkdirSync(`./local/scripts`, { recursive: true })

          writeFileSync(`./local/scripts/${digestOfWasmAsHex}.wasm`, wasmAsBytes)

          symlinkSync(`./${digestOfWasmAsHex}.wasm`, `./local/scripts/${digestOfPackAsHex}.wasm`, "file")
        }

        const moduleAsBlobref = Symbol()

        blobs.set(moduleAsBlobref, digestOfPackAsBytes)

        return moduleAsBlobref
      },
      call: (moduleAsBlobref: symbol, methodAsBlobref: symbol, paramsAsPackref: symbol): symbol => {
        const moduleAsBytes = blobs.get(moduleAsBlobref)

        if (moduleAsBytes == null)
          throw new Error("Not found")

        const moduleAsString = moduleAsBytes.toHex()

        const methodAsBytes = blobs.get(methodAsBlobref)

        if (methodAsBytes == null)
          throw new Error("Not found")

        const methodAsString = new TextDecoder().decode(methodAsBytes)

        if (exports[moduleAsString] == null)
          load(moduleAsString)

        if (typeof exports[moduleAsString][methodAsString] !== "function")
          throw new Error("Not found")

        const paramsAsPack = packs.get(paramsAsPackref)

        if (paramsAsPack == null)
          throw new Error("Not found")

        const resultAsPackref = Symbol()

        packs.set(resultAsPackref, [exports[moduleAsString][methodAsString](...paramsAsPack)])

        return resultAsPackref
      },
      load: (moduleAsBlobref: symbol): symbol => {
        const moduleAsBytes = blobs.get(moduleAsBlobref)

        if (moduleAsBytes == null)
          throw new Error("Not found")

        const wasmAsBytes = readFileSync(`./local/scripts/${moduleAsBytes.toHex()}.wasm`)

        const wasmAsBlobref = Symbol()

        blobs.set(wasmAsBlobref, wasmAsBytes)

        return wasmAsBlobref
      },
      self: (): symbol => {
        const blobref = Symbol()

        blobs.set(blobref, Uint8Array.fromHex(module))

        return blobref
      }
    }

    imports["sha256"] = {
      digest: (payloadAsBlobref: symbol): symbol => {
        const payloadAsBytes = blobs.get(payloadAsBlobref)

        if (payloadAsBytes == null)
          throw new Error("Not found")

        const blobref = Symbol()

        blobs.set(blobref, sha256(payloadAsBytes))

        return blobref
      }
    }

    imports["ed25519"] = {
      verify: (pubkeyAsBlobref: symbol, signatureAsBlobref: symbol, payloadAsBlobref: symbol): boolean => {
        const pubkeyAsBytes = blobs.get(pubkeyAsBlobref)
        const signatureAsBytes = blobs.get(signatureAsBlobref)
        const payloadAsBytes = blobs.get(payloadAsBlobref)

        if (pubkeyAsBytes == null)
          throw new Error("Not found")
        if (signatureAsBytes == null)
          throw new Error("Not found")
        if (payloadAsBytes == null)
          throw new Error("Not found")

        consume(payloadAsBytes.length * 256)

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
        const packref = Symbol()

        packs.set(packref, values)

        return packref
      },
      concat: (leftAsPackref: symbol, rightAsPackref: symbol): symbol => {
        const leftAsPack = packs.get(leftAsPackref)
        const rightAsPack = packs.get(rightAsPackref)

        if (leftAsPack == null)
          throw new Error("Not found")
        if (rightAsPack == null)
          throw new Error("Not found")

        const concatAsPackref = Symbol()

        packs.set(concatAsPackref, [...leftAsPack, ...rightAsPack])

        return concatAsPackref
      },
      length: (packref: symbol): number => {
        const pack = packs.get(packref)

        if (pack == null)
          throw new Error("Not found")

        return pack.length
      },
      get(packref: symbol, index: number): number | bigint | symbol | null {
        const pack = packs.get(packref)

        if (pack == null)
          throw new Error("Not found")
        if ((index >>> 0) > pack.length - 1)
          throw new Error("Out of bounds")

        return pack[index >>> 0]
      },
      encode: (packref: symbol): symbol => {
        const pack = packs.get(packref)

        if (pack == null)
          throw new Error("Not found")

        const blobref = Symbol()

        blobs.set(blobref, encode(pack))

        return blobref
      },
      decode: (blobref: symbol): symbol => {
        const bytes = blobs.get(blobref)

        if (bytes == null)
          throw new Error("Not found")

        const packref = Symbol()

        packs.set(packref, decode(bytes))

        return packref
      }
    }

    imports["storage"] = {
      set: (keyAsBlobref: symbol, valueAsBlobref: symbol): void => {
        const keyAsBytes = blobs.get(keyAsBlobref)
        const valueAsBytes = blobs.get(valueAsBlobref)

        if (keyAsBytes == null)
          throw new Error("Not found")
        if (valueAsBytes == null)
          throw new Error("Not found")

        cache.set(keyAsBlobref, valueAsBlobref)

        writes.push([module, keyAsBytes, valueAsBytes])

        return
      },
      get: (keyAsBlobref: symbol): symbol | null => {
        const keyAsBytes = blobs.get(keyAsBlobref)

        if (keyAsBytes == null)
          throw new Error("Not found")

        const staleValueAsBlob = cache.get(keyAsBlobref)

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

        const valueAsBlobref = Symbol()

        blobs.set(valueAsBlobref, valueAsBytes)
        cache.set(keyAsBlobref, valueAsBlobref)

        return valueAsBlobref
      }
    }

    imports["chain"] = {
      uuid: (): symbol => {
        const blobref = Symbol()

        blobs.set(blobref, Uint8Array.fromHex("8a8f19d1de0e4fcd9ab15cd7ed5de6dd"))

        return blobref
      }
    }

    let meteredWasmAsBytes: Uint8Array<ArrayBuffer>

    if (!existsSync(`./local/scripts/${module}.metered.wasm`)) {
      const wasmAsBytes = readFileSync(`./local/scripts/${module}.wasm`)

      const wasmAsParsed = Readable.readFromBytesOrThrow(Wasm.Module, wasmAsBytes)

      meter(wasmAsParsed, "sparks", "consume")

      meteredWasmAsBytes = Writable.writeToBytesOrThrow(wasmAsParsed)

      writeFileSync(`./local/scripts/${module}.metered.wasm`, meteredWasmAsBytes)
    } else {
      meteredWasmAsBytes = readFileSync(`./local/scripts/${module}.metered.wasm`)
    }

    const meteredWasmAsModule = new WebAssembly.Module(meteredWasmAsBytes)

    for (const descriptor of WebAssembly.Module.imports(meteredWasmAsModule)) {
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

    const meteredWasmAsInstance = new WebAssembly.Instance(meteredWasmAsModule, imports)

    current.instance = meteredWasmAsInstance
    current.module = meteredWasmAsModule

    exports[module] = meteredWasmAsInstance.exports

    return current
  }

  const { instance } = load(module)

  if (typeof instance.exports[method] !== "function")
    throw new Error("Not found")

  const result = encode([instance.exports[method](...decode(params))])

  // console.log(`Remaining ${sparks} sparks`)

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