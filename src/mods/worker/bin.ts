/// <reference lib="webworker" />

import { meter } from "@/libs/metering/mod.ts";
import { type Packable, Packed } from "@/libs/packed/mod.ts";
import { Readable, Writable } from "@hazae41/binary";
import { RpcErr, RpcError, RpcMethodNotFoundError, RpcOk, type RpcRequestInit } from "@hazae41/jsonrpc";
import * as Wasm from "@hazae41/wasm";
import { Buffer } from "node:buffer";
import { existsSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import process from "node:process";
import type { Config } from "../config/mod.ts";

declare const self: DedicatedWorkerGlobalScope;

const config = await fetch(self.name).then(res => res.json()) as Config

const helper = new Worker(import.meta.resolve("../helper/bin.js"), { name: self.name, type: "module" })

function run(module: string, method: string, params: Uint8Array<ArrayBuffer>, mode: number, maxsparks?: bigint) {
  let sparks = 0n

  const exports: WebAssembly.Imports = {}

  const logs = new Array<string>()

  const caches = new Map<string, Map<Packable, Packable>>()

  const reads = new Array<[string, Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>]>()
  const writes = new Array<[string, Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>]>()

  const pack_encode = (value: Packable): Uint8Array<ArrayBuffer> => {
    return Writable.writeToBytesOrThrow(new Packed(value))
  }

  const pack_decode = (bytes: Uint8Array): Packable => {
    return Readable.readFromBytesOrThrow(Packed, bytes)
  }

  const sparks_consume = (amount: bigint) => {
    sparks += amount

    if (process.env.NODE_ENV !== "production")
      return

    if (maxsparks == null)
      return
    if (sparks < maxsparks)
      return

    throw new Error("Out of sparks")
  }

  const sha256_digest = (payload: Uint8Array): Uint8Array => {
    sparks_consume(BigInt(payload.length) * 256n)

    const result = new Int32Array(new SharedArrayBuffer(4 + 32))

    helper.postMessage({ method: "sha256_digest", params: [payload], result })

    if (Atomics.wait(result, 0, 0) !== "ok")
      throw new Error("Failed to wait")
    if (result[0] === 2)
      throw new Error("Internal error")

    return new Uint8Array(result.buffer, 4, 32).slice()
  }

  const ed25519_verify = (pubkey: Uint8Array, signature: Uint8Array, payload: Uint8Array): boolean => {
    sparks_consume(BigInt(payload.length) * 256n)

    const result = new Int32Array(new SharedArrayBuffer(4 + 4))

    helper.postMessage({ method: "ed25519_verify", params: [pubkey, signature, payload], result })

    if (Atomics.wait(result, 0, 0) !== "ok")
      throw new Error("Failed to wait")
    if (result[0] === 2)
      throw new Error("Internal error")

    return result[1] === 1
  }

  const ed25519_sign = (subpayload: Uint8Array): Uint8Array => {
    sparks_consume(BigInt(subpayload.length) * 256n)

    const payload = pack_encode([Uint8Array.fromHex(module), subpayload])

    const result = new Int32Array(new SharedArrayBuffer(4 + 64))

    helper.postMessage({ method: "ed25519_sign", params: [payload], result })

    if (Atomics.wait(result, 0, 0) !== "ok")
      throw new Error("Failed to wait")
    if (result[0] === 2)
      throw new Error("Internal error")

    return new Uint8Array(result.buffer, 4, 64).slice()
  }

  const load = (module: string): WebAssembly.WebAssemblyInstantiatedSource => {
    const current: WebAssembly.WebAssemblyInstantiatedSource = {} as any

    caches.set(module, new Map())

    const imports: WebAssembly.Imports = {}

    imports["env"] = {
      mode: mode,
      abort: (...args: unknown[]): void => {
        return
      },
      uuid: (): string => {
        return "17fa1cb5-c5af-4cfd-9bea-1a36590b890d"
      },
      panic: (message: string): never => {
        throw new Error(message)
      },
    }

    imports["sparks"] = {
      remaining: (): bigint => {
        return sparks
      },
      consume: (amount: number): void => {
        sparks_consume(BigInt(amount >>> 0))
      }
    }

    imports["console"] = {
      log: (text: string): void => {
        logs.push(text)

        console.log(text)

        return
      }
    }

    imports["blobs"] = {
      save: (offset: number, length: number): Uint8Array => {
        const { memory } = current.instance.exports as { memory: WebAssembly.Memory }

        const view = new Uint8Array(memory.buffer, offset >>> 0, length >>> 0)

        return view.slice()
      },
      load: (blob: Uint8Array, offset: number): void => {
        const { memory } = current.instance.exports as { memory: WebAssembly.Memory }

        const view = new Uint8Array(memory.buffer, offset >>> 0, blob.length)

        view.set(blob)
      },
      length: (blob: Uint8Array): number => {
        return blob.length
      },
      concat: (left: Uint8Array, right: Uint8Array): Uint8Array => {
        const concat = new Uint8Array(left.length + right.length)

        concat.set(left, 0)
        concat.set(right, left.length)

        return concat
      },
      equals: (left: Uint8Array, right: Uint8Array): boolean => {
        return !Buffer.compare(left, right)
      },
      includes: (haystack: Uint8Array, needle: Uint8Array): boolean => {
        return haystack.toHex().includes(needle.toHex())
      },
      slice: (blob: Uint8Array, start: number, end: number): Uint8Array => {
        return blob.slice(start >>> 0, end >>> 0)
      },
      from_base16: (text: string): Uint8Array => {
        return Uint8Array.fromHex(text)
      },
      to_base16: (blob: Uint8Array): string => {
        return blob.toHex()
      },
      from_base64: (text: string): Uint8Array => {
        return Uint8Array.fromBase64(text)
      },
      to_base64: (blob: Uint8Array): string => {
        return blob.toBase64()
      },
      encode: (value: Packable): Uint8Array => {
        return pack_encode(value)
      },
      decode: (blob: Uint8Array): Packable => {
        return pack_decode(blob)
      }
    }

    imports["texts"] = {
      length: (text: string): number => {
        return new TextEncoder().encode(text).length
      },
      concat: (left: string, right: string): string => {
        return left + right
      },
      equals: (left: string, right: string): boolean => {
        return left === right
      },
      includes: (haystack: string, needle: string): boolean => {
        return haystack.includes(needle)
      },
      slice: (text: string, start: number, end: number): string => {
        return text.slice(start >>> 0, end >>> 0)
      },
      from_utf8: (bytes: Uint8Array): string => {
        return new TextDecoder().decode(bytes)
      },
      to_utf8: (text: string): Uint8Array => {
        return new TextEncoder().encode(text)
      },
      to_uppercase: (text: string): string => {
        return text.toUpperCase()
      },
      to_lowercase: (text: string): string => {
        return text.toLowerCase()
      },
      trim: (text: string): string => {
        return text.trim()
      }
    }

    imports["packs"] = {
      create: (...values: Array<Packable>): Array<Packable> => {
        return values
      },
      concat: (left: Array<Packable>, right: Array<Packable>): Array<Packable> => {
        return [...left, ...right]
      },
      length: (pack: Array<Packable>): number => {
        return pack.length
      },
      get(pack: Array<Packable>, index: number): Packable {
        const value = pack[index >>> 0]

        if (value === undefined)
          throw new Error("Not found")

        return value
      }
    }

    imports["bigints"] = {
      identity: (value: bigint): bigint => {
        return value
      },
      zero: (): bigint => {
        return 0n
      },
      one: (): bigint => {
        return 1n
      },
      two: (): bigint => {
        return 2n
      },
      three: (): bigint => {
        return 3n
      },
      four: (): bigint => {
        return 4n
      },
      five: (): bigint => {
        return 5n
      },
      six: (): bigint => {
        return 6n
      },
      seven: (): bigint => {
        return 7n
      },
      eight: (): bigint => {
        return 8n
      },
      nine: (): bigint => {
        return 9n
      },
      ten: (): bigint => {
        return 10n
      },
      inc: (value: bigint): bigint => {
        return value + 1n
      },
      dec: (value: bigint): bigint => {
        return value - 1n
      },
      neg: (value: bigint): bigint => {
        return -value
      },
      add: (left: bigint, right: bigint): bigint => {
        return left + right
      },
      sub: (left: bigint, right: bigint): bigint => {
        return left - right
      },
      mul: (left: bigint, right: bigint): bigint => {
        return left * right
      },
      div: (left: bigint, right: bigint): bigint => {
        return left / right
      },
      pow: (left: bigint, right: bigint): bigint => {
        return left ** right
      },
      mod: (left: bigint, right: bigint): bigint => {
        return left % right
      },
      lt: (left: bigint, right: bigint): boolean => {
        return left < right
      },
      lte: (left: bigint, right: bigint): boolean => {
        return left <= right
      },
      gt: (left: bigint, right: bigint): boolean => {
        return left > right
      },
      gte: (left: bigint, right: bigint): boolean => {
        return left >= right
      },
      eq: (left: bigint, right: bigint): boolean => {
        return left === right
      },
      neq: (left: bigint, right: bigint): boolean => {
        return left !== right
      },
      from_base16: (text: string): bigint => {
        return BigInt("0x" + text)
      },
      to_base16: (bigint: bigint): string => {
        return bigint.toString(16)
      },
      from_base10: (text: string): bigint => {
        return BigInt(text)
      },
      to_base10: (bigint: bigint): string => {
        return bigint.toString()
      }
    }

    imports["modules"] = {
      self: (): string => {
        return module
      },
      load: (module: string): Uint8Array => {
        return readFileSync(`${config.scripts.path}/${module}.wasm`)
      },
      call: (module: string, method: string, params: Array<Packable>): [Packable] => {
        if (exports[module] == null)
          load(module)

        if (typeof exports[module][method] !== "function")
          throw new Error("Not found")

        return [exports[module][method](...params)]
      },
      create: (code: Uint8Array, salt: Packable): string => {
        const pack = pack_encode([code, salt])

        const digestOfCodeAsBytes = sha256_digest(code)
        const digestOfPackAsBytes = sha256_digest(pack)

        const digestOfCodeAsHex = digestOfCodeAsBytes.toHex()
        const digestOfPackAsHex = digestOfPackAsBytes.toHex()

        if (!existsSync(`${config.scripts.path}/${digestOfCodeAsHex}.wasm`))
          writeFileSync(`${config.scripts.path}/${digestOfCodeAsHex}.wasm`, code)

        if (!existsSync(`${config.scripts.path}/${digestOfPackAsHex}.wasm`))
          symlinkSync(`./${digestOfCodeAsHex}.wasm`, `${config.scripts.path}/${digestOfPackAsHex}.wasm`, "file")

        return digestOfPackAsHex
      }
    }

    imports["storage"] = {
      set: (key: Packable, fresh: Packable): void => {
        const cache = caches.get(module)!

        cache.set(key, fresh)

        const keyAsBytes = pack_encode(key)

        const valueAsBytes = pack_encode(fresh)

        writes.push([module, keyAsBytes, valueAsBytes])

        return
      },
      get: (key: Packable): [Packable] | null => {
        const cache = caches.get(module)!

        const stale = cache.get(key)

        if (stale != null)
          return [stale]

        const keyAsBytes = pack_encode(key)

        const result = new Int32Array(new SharedArrayBuffer(4 + 4 + 4, { maxByteLength: ((4 + 4 + 4) + (1024 * 1024)) }))

        helper.postMessage({ method: "storage_get", params: [module, keyAsBytes], result })

        if (Atomics.wait(result, 0, 0) !== "ok")
          throw new Error("Failed to wait")
        if (result[0] === 2)
          throw new Error("Internal error")
        if (result[1] === 2)
          return null

        const valueAsBytes = new Uint8Array(result.buffer, 4 + 4 + 4, result[2]).slice()

        reads.push([module, keyAsBytes, valueAsBytes])

        const fresh = pack_decode(valueAsBytes)

        cache.set(key, fresh)

        return [fresh]
      }
    }

    imports["symbols"] = {
      create: (): symbol => {
        return Symbol()
      }
    }

    const refs = new Array<unknown>()
    const ptrs = new Map<unknown, number>()

    imports["refs"] = {
      numerize: (ref: unknown): number => {
        const stale = ptrs.get(ref)

        if (stale != null)
          return stale

        const fresh = refs.push(ref) - 1

        ptrs.set(ref, fresh)

        return fresh
      },
      denumerize: (ptr: number): unknown => {
        const ref = refs.at(ptr >>> 0)

        if (ref == null)
          throw new Error("Not found")

        return ref
      }
    }

    imports["sha256"] = {
      digest: (payload: Uint8Array): Uint8Array => {
        return sha256_digest(payload)
      }
    }

    imports["ed25519"] = {
      verify: (pubkey: Uint8Array, signature: Uint8Array, payload: Uint8Array): boolean => {
        return ed25519_verify(pubkey, signature, payload)
      },
      sign: (payload: Uint8Array): Uint8Array => {
        return ed25519_sign(payload)
      }
    }

    let meteredCodeAsBytes: Uint8Array<ArrayBuffer>

    if (!existsSync(`${config.scripts.path}/${module}.metered.wasm`)) {
      const codeAsBytes = readFileSync(`${config.scripts.path}/${module}.wasm`)

      const codeAsWasm = Readable.readFromBytesOrThrow(Wasm.Module, codeAsBytes)

      meter(codeAsWasm, "sparks", "consume")

      meteredCodeAsBytes = Writable.writeToBytesOrThrow(codeAsWasm)

      writeFileSync(`${config.scripts.path}/${module}.metered.wasm`, meteredCodeAsBytes)
    } else {
      meteredCodeAsBytes = readFileSync(`${config.scripts.path}/${module}.metered.wasm`)
    }

    const meteredCodeAsModule = new WebAssembly.Module(meteredCodeAsBytes)

    for (const descriptor of WebAssembly.Module.imports(meteredCodeAsModule)) {
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

    const meteredCodeAsInstance = new WebAssembly.Instance(meteredCodeAsModule, imports)

    current.instance = meteredCodeAsInstance
    current.module = meteredCodeAsModule

    exports[module] = meteredCodeAsInstance.exports

    return current
  }

  const { instance } = load(module)

  if (typeof instance.exports[method] !== "function")
    throw new Error("Not found")

  const args = pack_decode(params)

  if (!Array.isArray(args))
    throw new Error("Params is not an array")

  const returned = instance.exports[method](...args)

  if (mode !== 1)
    return pack_encode([logs, reads, writes, returned, sparks])

  if (writes.length) {
    const result = new Int32Array(new SharedArrayBuffer(4 + 4))

    helper.postMessage({ method: "storage_set", params: [module, method, params, writes], result })

    if (Atomics.wait(result, 0, 0) !== "ok")
      throw new Error("Failed to wait")
    if (result[0] === 2)
      throw new Error("Internal error")

    // NOOP
  }

  return pack_encode([logs, reads, writes, returned, sparks])
}

self.addEventListener("message", (event: MessageEvent<RpcRequestInit>) => {
  try {
    const request = event.data

    if (request.method === "execute") {
      const [module, method, params, maxsparks] = request.params as [string, string, Uint8Array<ArrayBuffer>, bigint]

      const proof = run(module, method, params, 1, maxsparks)

      self.postMessage(new RpcOk(request.id, proof))

      return
    }

    if (request.method === "simulate") {
      const [module, method, params, maxsparks] = request.params as [string, string, Uint8Array<ArrayBuffer>, bigint]

      const proof = run(module, method, params, 2, maxsparks)

      self.postMessage(new RpcOk(request.id, proof))

      return
    }

    if (request.method === "verify") {
      // TODO
    }

    throw new RpcMethodNotFoundError()
  } catch (cause: unknown) {
    const request = event.data

    console.error(cause)

    self.postMessage(new RpcErr(request.id, RpcError.rewrap(cause)))
  }
})