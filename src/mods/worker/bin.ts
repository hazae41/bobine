// deno-lint-ignore-file no-explicit-any no-unused-vars

import { Readable, Writable } from "@hazae41/binary";
import { RpcErr, RpcError, RpcMethodNotFoundError, RpcOk, type RpcRequestInit } from "@hazae41/jsonrpc";
import * as Wasm from "@hazae41/wasm";
import { Buffer } from "node:buffer";
import { existsSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { meter } from "../../libs/metering/mod.ts";
import { Pack } from "../../libs/packs/mod.ts";

declare const self: DedicatedWorkerGlobalScope;

const url = new URL(import.meta.url)

const databaseAsPath = url.searchParams.get("database")!
const scriptsAsPath = url.searchParams.get("scripts")!

const helper = new Worker(import.meta.resolve(`@/mods/helper/bin.ts${url.search}`), { type: "module" })

function run(module: string, method: string, params: Uint8Array<ArrayBuffer>, mode: number, maxsparks?: bigint) {
  let sparks = 0n

  const exports: WebAssembly.Imports = {}

  const caches = new Map<string, Map<Uint8Array, Uint8Array>>()
  const writes = new Array<[string, Uint8Array, Uint8Array]>()

  const pack_encode = (pack: Pack): Uint8Array => {
    return Writable.writeToBytesOrThrow(pack)
  }

  const pack_decode = (bytes: Uint8Array): Pack => {
    return Readable.readFromBytesOrThrow(Pack, bytes)
  }

  const sha256_digest = (payload: Uint8Array): Uint8Array => {
    sparks_consume(BigInt(payload.length) * 256n)

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

  const sparks_consume = (amount: bigint) => {
    sparks += amount

    if (maxsparks != null && sparks > maxsparks)
      throw new Error("Out of sparks")

    return
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
      log: (blob: Uint8Array): void => {
        console.log(new TextDecoder().decode(blob))
      }
    }

    imports["blobs"] = {
      save: (offset: number, length: number): Uint8Array => {
        const { memory } = current.instance.exports as { memory: WebAssembly.Memory }

        const view = new Uint8Array(memory.buffer, offset >>> 0, length >>> 0)

        return view.slice()
      },
      size: (blob: Uint8Array): number => {
        return blob.length
      },
      load: (blob: Uint8Array, offset: number): void => {
        const { memory } = current.instance.exports as { memory: WebAssembly.Memory }

        const view = new Uint8Array(memory.buffer, offset >>> 0, blob.length)

        view.set(blob)
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
      from_base16: (text: Uint8Array): Uint8Array => {
        return Uint8Array.fromHex(new TextDecoder().decode(text))
      },
      from_base64: (text: Uint8Array): Uint8Array => {
        return Uint8Array.fromBase64(new TextDecoder().decode(text))
      },
      to_base16: (bytes: Uint8Array): Uint8Array => {
        return new TextEncoder().encode(bytes.toHex())
      },
      to_base64: (bytes: Uint8Array): Uint8Array => {
        return new TextEncoder().encode(bytes.toBase64())
      }
    }

    imports["bigints"] = {
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
      from_base16: (text: Uint8Array): bigint => {
        return BigInt("0x" + new TextDecoder().decode(text))
      },
      to_base16: (bigint: bigint): Uint8Array => {
        return new TextEncoder().encode(bigint.toString(16))
      },
      from_base10: (text: Uint8Array): bigint => {
        return BigInt(new TextDecoder().decode(text))
      },
      to_base10: (bigint: bigint): Uint8Array => {
        return new TextEncoder().encode(bigint.toString())
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

    imports["modules"] = {
      create: (wasmAsBytes: Uint8Array, saltAsBytes: Uint8Array): Uint8Array => {
        const packAsBytes = pack_encode(new Pack([wasmAsBytes, saltAsBytes]))

        const digestOfWasmAsBytes = sha256_digest(wasmAsBytes)
        const digestOfPackAsBytes = sha256_digest(packAsBytes)

        const digestOfWasmAsHex = digestOfWasmAsBytes.toHex()
        const digestOfPackAsHex = digestOfPackAsBytes.toHex()

        if (!existsSync(`${scriptsAsPath}/${digestOfWasmAsHex}.wasm`))
          writeFileSync(`${scriptsAsPath}/${digestOfWasmAsHex}.wasm`, wasmAsBytes)

        if (!existsSync(`${scriptsAsPath}/${digestOfPackAsHex}.wasm`))
          symlinkSync(`./${digestOfWasmAsHex}.wasm`, `${scriptsAsPath}/${digestOfPackAsHex}.wasm`, "file")

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
        return readFileSync(`${scriptsAsPath}/${moduleAsBytes.toHex()}.wasm`)
      },
      self: (): Uint8Array => {
        return Uint8Array.fromHex(module)
      }
    }

    imports["sha256"] = {
      digest: (payload: Uint8Array): Uint8Array => {
        return sha256_digest(payload)
      }
    }

    imports["ed25519"] = {
      verify: (pubkey: Uint8Array, signature: Uint8Array, payload: Uint8Array): boolean => {
        sparks_consume(BigInt(payload.length) * 256n)

        const result = new Int32Array(new SharedArrayBuffer(4 + 4))

        helper.postMessage({ method: "ed25519_verify", params: [pubkey, signature, payload], result })

        if (Atomics.wait(result, 0, 0) !== "ok")
          throw new Error("Failed to wait")
        if (result[0] === 2)
          throw new Error("Internal error")

        return result[1] === 1
      }
    }

    imports["packs"] = {
      create: (...values: Array<Pack.Value>): Pack => {
        return new Pack(values)
      },
      concat: (left: Pack, right: Pack): Pack => {
        return new Pack([...left.values, ...right.values])
      },
      length: (pack: Pack): number => {
        return pack.values.length
      },
      get(pack: Pack, index: number): Pack.Value {
        const value = pack.values[index >>> 0]

        if (value === undefined)
          throw new Error("Not found")

        return value
      },
      encode: (pack: Pack): Uint8Array => {
        return pack_encode(pack)
      },
      decode: (blob: Uint8Array): Pack => {
        return pack_decode(blob)
      }
    }

    imports["storage"] = {
      set: (key: Uint8Array, value: Uint8Array): void => {
        const cache = caches.get(module)!

        cache.set(key, value)

        writes.push([module, key, value])

        return
      },
      get: (key: Uint8Array): Uint8Array | null => {
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

        const fresh = new Uint8Array(result.buffer, 4 + 4 + 4, result[2]).slice()

        cache.set(key, fresh)

        return fresh
      }
    }

    let meteredWasmAsBytes: Uint8Array<ArrayBuffer>

    if (!existsSync(`${scriptsAsPath}/${module}.metered.wasm`)) {
      const wasmAsBytes = readFileSync(`${scriptsAsPath}/${module}.wasm`)

      const wasmAsParsed = Readable.readFromBytesOrThrow(Wasm.Module, wasmAsBytes)

      meter(wasmAsParsed, "sparks", "consume")

      meteredWasmAsBytes = Writable.writeToBytesOrThrow(wasmAsParsed)

      writeFileSync(`${scriptsAsPath}/${module}.metered.wasm`, meteredWasmAsBytes)
    } else {
      meteredWasmAsBytes = readFileSync(`${scriptsAsPath}/${module}.metered.wasm`)
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

  const result = pack_encode(new Pack(instance.exports[method](...pack_decode(params).values)))

  return { result, writes, sparks }
}

self.addEventListener("message", (event: MessageEvent<RpcRequestInit>) => {
  try {
    const request = event.data

    if (request.method === "execute") {
      const [module, method, params, maxsparks] = request.params as [string, string, Uint8Array<ArrayBuffer>, bigint]

      const start = performance.now()

      const { result, writes, sparks } = run(module, method, params, 1, maxsparks)

      const until = performance.now()

      console.log(`Evaluated ${(until - start).toFixed(2)}ms with ${sparks} sparks`)

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
      const [module, method, params, maxsparks] = request.params as [string, string, Uint8Array<ArrayBuffer>, bigint]

      const start = performance.now()

      const { result, sparks } = run(module, method, params, 2, maxsparks)

      const until = performance.now()

      console.log(`Evaluated ${(until - start).toFixed(2)}ms with ${sparks} sparks`)

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