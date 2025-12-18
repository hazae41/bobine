// deno-lint-ignore-file no-explicit-any no-unused-vars ban-unused-ignore

import { Readable, Writable } from "@hazae41/binary";
import { RpcErr, RpcError, RpcMethodNotFoundError, RpcOk, type RpcRequestInit } from "@hazae41/jsonrpc";
import * as Wasm from "@hazae41/wasm";
import { Buffer } from "node:buffer";
import { existsSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { meter } from "../../libs/metering/mod.ts";
import { Pack } from "../../libs/packs/mod.ts";
import type { Config } from "../config/mod.ts";

declare const self: DedicatedWorkerGlobalScope;

const config = await fetch(self.name).then(res => res.json()) as Config

const helper = new Worker(import.meta.resolve("../helper/bin.js"), { name: self.name, type: "module" })

function run(module: string, method: string, params: Uint8Array<ArrayBuffer>, mode: number, maxsparks?: bigint) {
  let sparks = 0n

  const exports: WebAssembly.Imports = {}

  const logs = new Array<string>()

  const caches = new Map<string, Map<string, Array<Pack.Value>>>()

  const reads = new Array<[string, string, Uint8Array<ArrayBuffer>]>()
  const writes = new Array<[string, string, Uint8Array<ArrayBuffer>]>()

  const pack_encode = (pack: Array<Pack.Value>): Uint8Array<ArrayBuffer> => {
    return Writable.writeToBytesOrThrow(new Pack(pack))
  }

  const pack_decode = (bytes: Uint8Array): Array<Pack.Value> => {
    return Readable.readFromBytesOrThrow(Pack, bytes)
  }

  const sparks_consume = (amount: bigint) => {
    sparks += amount

    if (maxsparks != null && sparks > maxsparks)
      throw new Error("Out of sparks")

    return
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
      abort: (): never => {
        throw new Error("Aborted")
      },
      uuid: (): Uint8Array => {
        return Uint8Array.fromHex("8a8f19d1de0e4fcd9ab15cd7ed5de6dd")
      }
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
      to_base16: (bytes: Uint8Array): string => {
        return bytes.toHex()
      },
      from_base64: (text: string): Uint8Array => {
        return Uint8Array.fromBase64(text)
      },
      to_base64: (bytes: Uint8Array): string => {
        return bytes.toBase64()
      },
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
      create: (...values: Array<Pack.Value>): Array<Pack.Value> => {
        return values
      },
      concat: (left: Array<Pack.Value>, right: Array<Pack.Value>): Array<Pack.Value> => {
        return [...left, ...right]
      },
      length: (pack: Array<Pack.Value>): number => {
        return pack.length
      },
      get(pack: Array<Pack.Value>, index: number): Pack.Value {
        const value = pack[index >>> 0]

        if (value === undefined)
          throw new Error("Not found")

        return value
      },
      encode: (pack: Array<Pack.Value>): Uint8Array => {
        return pack_encode(pack)
      },
      decode: (blob: Uint8Array): Array<Pack.Value> => {
        return pack_decode(blob)
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
      create: (wasmAsBytes: Uint8Array, saltAsBytes: Uint8Array): Uint8Array => {
        const packAsBytes = pack_encode([wasmAsBytes, saltAsBytes])

        const digestOfWasmAsBytes = sha256_digest(wasmAsBytes)
        const digestOfPackAsBytes = sha256_digest(packAsBytes)

        const digestOfWasmAsHex = digestOfWasmAsBytes.toHex()
        const digestOfPackAsHex = digestOfPackAsBytes.toHex()

        if (!existsSync(`${config.scripts.path}/${digestOfWasmAsHex}.wasm`))
          writeFileSync(`${config.scripts.path}/${digestOfWasmAsHex}.wasm`, wasmAsBytes)

        if (!existsSync(`${config.scripts.path}/${digestOfPackAsHex}.wasm`))
          symlinkSync(`./${digestOfWasmAsHex}.wasm`, `${config.scripts.path}/${digestOfPackAsHex}.wasm`, "file")
        return digestOfPackAsBytes
      },
      call: (moduleAsBytes: Uint8Array, methodAsBytes: Uint8Array, paramsAsPack: Pack): Pack => {
        const moduleAsString = moduleAsBytes.toHex()
        const methodAsString = new TextDecoder().decode(methodAsBytes)

        if (exports[moduleAsString] == null)
          load(moduleAsString)

        if (typeof exports[moduleAsString][methodAsString] !== "function")
          throw new Error("Not found")

        return new Pack([exports[moduleAsString][methodAsString](...paramsAsPack.values)])
      },
      load: (moduleAsBytes: Uint8Array): Uint8Array => {
        return readFileSync(`${config.scripts.path}/${moduleAsBytes.toHex()}.wasm`)
      },
      self: (): Uint8Array => {
        return Uint8Array.fromHex(module)
      }
    }

    imports["storage"] = {
      set: (key: string, fresh: Array<Pack.Value>): void => {
        const cache = caches.get(module)!

        cache.set(key, fresh)

        const value = pack_encode(fresh)

        writes.push([module, key, value])

        return
      },
      get: (key: string): Array<Pack.Value> | null => {
        const cache = caches.get(module)!

        const stale = cache.get(key)

        if (stale != null)
          return stale

        const result = new Int32Array(new SharedArrayBuffer(4 + 4 + 4, { maxByteLength: ((4 + 4 + 4) + (1024 * 1024)) }))

        helper.postMessage({ method: "storage_get", params: [module, key], result })

        if (Atomics.wait(result, 0, 0) !== "ok")
          throw new Error("Failed to wait")
        if (result[0] === 2)
          throw new Error("Internal error")
        if (result[1] === 2)
          return null

        const value = new Uint8Array(result.buffer, 4 + 4 + 4, result[2]).slice()

        const fresh = pack_decode(value)

        cache.set(key, fresh)

        reads.push([module, key, value])

        return fresh
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

    let meteredWasmAsBytes: Uint8Array<ArrayBuffer>

    if (!existsSync(`${config.scripts.path}/${module}.metered.wasm`)) {
      const wasmAsBytes = readFileSync(`${config.scripts.path}/${module}.wasm`)

      const wasmAsParsed = Readable.readFromBytesOrThrow(Wasm.Module, wasmAsBytes)

      meter(wasmAsParsed, "sparks", "consume")

      meteredWasmAsBytes = Writable.writeToBytesOrThrow(wasmAsParsed)

      writeFileSync(`${config.scripts.path}/${module}.metered.wasm`, meteredWasmAsBytes)
    } else {
      meteredWasmAsBytes = readFileSync(`${config.scripts.path}/${module}.metered.wasm`)
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

  const returned = [instance.exports[method](...pack_decode(params))]

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