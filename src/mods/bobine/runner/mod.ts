// deno-lint-ignore-file no-unused-vars no-explicit-any

import { meter } from "@/libs/metering/mod.ts";
import { Nullable } from "@/libs/nullable/mod.ts";
import { type Packable, Packed } from "@/libs/packed/mod.ts";
import { runAsImmediate } from "@/libs/sql/mod.ts";
import { RpcPaymentError } from "@/mods/bobine/errors/mod.ts";
import { Readable, Writable } from "@hazae41/binary";
import * as Wasm from "@hazae41/wasm";
import { connect, Database } from "@tursodatabase/database";
import { Buffer } from "node:buffer";
import { existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

export interface Run {
  readonly module: string,
  readonly method: string,
  readonly params: Packable[]

  readonly result: Packable,
  readonly sparks: bigint

  readonly reads: [string, Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>][]
  readonly writes: [string, Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>][]

  readonly logs: string[]
}

export class Runner {

  private constructor(
    readonly uuid: string,
    readonly path: string,
    readonly data: Database
  ) { }

  static async setup(uuid: string, path: string) {
    mkdirSync(join(path), { recursive: true })
    mkdirSync(join(path, "scripts"), { recursive: true })

    const data = await connect(join(path, "records.db"))

    await data.exec(`CREATE TABLE IF NOT EXISTS events (
      nonce INTEGER PRIMARY KEY AUTOINCREMENT,

      moment INTEGER NOT NULL,

      module TEXT NOT NULL,
      
      key BLOB NOT NULL,

      value BLOB NOT NULL
    );`)

    await data.exec(`CREATE TABLE IF NOT EXISTS moments (
      nonce INTEGER PRIMARY KEY AUTOINCREMENT,
      
      epoch INTEGER NOT NULL,

      module TEXT NOT NULL,

      method TEXT NOT NULL,
      
      params BLOB NOT NULL
    );`)

    return new Runner(uuid, path, data)
  }

  async create(code: Uint8Array<ArrayBuffer>, salt: Uint8Array<ArrayBuffer>) {
    const pack = Writable.writeToBytes(new Packed([code, salt]))

    const digestOfCodeAsRaw = new Uint8Array(await crypto.subtle.digest("SHA-256", code))
    const digestOfPackAsRaw = new Uint8Array(await crypto.subtle.digest("SHA-256", pack))

    const digestOfCodeAsHex = digestOfCodeAsRaw.toHex()
    const digestOfPackAsHex = digestOfPackAsRaw.toHex()

    if (!existsSync(join(this.path, "scripts", `${digestOfCodeAsHex}.wasm`)))
      writeFileSync(join(this.path, "scripts", `${digestOfCodeAsHex}.wasm`), code)

    if (!existsSync(join(this.path, "scripts", `${digestOfPackAsHex}.wasm`)))
      symlinkSync(`./${digestOfCodeAsHex}.wasm`, join(this.path, "scripts", `${digestOfPackAsHex}.wasm`), "file")

    return digestOfPackAsHex
  }

  async execute(module: string, method: string, params: Packable[], target?: Nullable<bigint>) {
    return await this.#run(1, module, method, params, target)
  }

  async simulate(module: string, method: string, params: Packable[], target?: Nullable<bigint>) {
    return await this.#run(2, module, method, params, target)
  }

  async #run(mode: number, module: string, method: string, params: Packable[], target?: Nullable<bigint>): Promise<Run> {
    let sparks = 0n

    const exports: WebAssembly.Imports = {}

    const logs = new Array<string>()

    const caches = new Map<string, Map<Packable, Packable>>()

    const reads = new Array<[string, Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>]>()
    const writes = new Array<[string, Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>]>()

    const encode = (value: Packable): Uint8Array<ArrayBuffer> => {
      return Writable.writeToBytes(new Packed(value))
    }

    const decode = (bytes: Uint8Array<ArrayBuffer>): Packable => {
      return Readable.readFromBytes(Packed, bytes)
    }

    const consume = (amount: number) => {
      sparks += BigInt(amount)

      if (process.env.NODE_ENV === "development")
        return
      if (target == null)
        return

      if (sparks > target)
        throw new RpcPaymentError("Out of sparks")

      return
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
          return this.uuid
        },
        panic: (message: string): never => {
          throw new Error(message)
        },
      }

      imports["sparks"] = {
        consume: (amount: number): void => {
          consume(amount >>> 0)
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
        save: (offset: number, length: number): Uint8Array<ArrayBuffer> => {
          const { memory } = current.instance.exports as { memory: WebAssembly.Memory }

          const view = new Uint8Array(memory.buffer, offset >>> 0, length >>> 0)

          return view.slice()
        },
        load: (blob: Uint8Array<ArrayBuffer>, offset: number): void => {
          const { memory } = current.instance.exports as { memory: WebAssembly.Memory }

          const view = new Uint8Array(memory.buffer, offset >>> 0, blob.length)

          view.set(blob)
        },
        length: (blob: Uint8Array<ArrayBuffer>): number => {
          return blob.length
        },
        concat: (left: Uint8Array<ArrayBuffer>, right: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> => {
          const concat = new Uint8Array(left.length + right.length)

          concat.set(left, 0)
          concat.set(right, left.length)

          return concat
        },
        equals: (left: Uint8Array<ArrayBuffer>, right: Uint8Array<ArrayBuffer>): boolean => {
          return !Buffer.compare(left, right)
        },
        includes: (haystack: Uint8Array<ArrayBuffer>, needle: Uint8Array<ArrayBuffer>): boolean => {
          return haystack.toHex().includes(needle.toHex())
        },
        slice: (blob: Uint8Array<ArrayBuffer>, start: number, end: number): Uint8Array<ArrayBuffer> => {
          return blob.slice(start >>> 0, end >>> 0)
        },
        from_base16: (text: string): Uint8Array<ArrayBuffer> => {
          return Uint8Array.fromHex(text)
        },
        to_base16: (blob: Uint8Array<ArrayBuffer>): string => {
          return blob.toHex()
        },
        from_base64: (text: string): Uint8Array<ArrayBuffer> => {
          return Uint8Array.fromBase64(text)
        },
        to_base64: (blob: Uint8Array<ArrayBuffer>): string => {
          return blob.toBase64()
        },
        encode: (value: Packable): Uint8Array<ArrayBuffer> => {
          return encode(value)
        },
        decode: (blob: Uint8Array<ArrayBuffer>): Packable => {
          return decode(blob)
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
        from_utf8: (bytes: Uint8Array<ArrayBuffer>): string => {
          return new TextDecoder().decode(bytes)
        },
        to_utf8: (text: string): Uint8Array<ArrayBuffer> => {
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
        min: (left: bigint, right: bigint): bigint => {
          return left < right ? left : right
        },
        max: (left: bigint, right: bigint): bigint => {
          return left > right ? left : right
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
        load: (module: string): Uint8Array<ArrayBuffer> => {
          return readFileSync(join(this.path, "scripts", `${module}.wasm`))
        },
        call: (module: string, method: string, params: Array<Packable>): [Packable] => {
          if (exports[module] == null)
            load(module)

          if (typeof exports[module][method] !== "function")
            throw new Error("Not found")

          return [exports[module][method](...params)]
        },
        create: async (code: Uint8Array<ArrayBuffer>, salt: Uint8Array<ArrayBuffer>): Promise<string> => {
          consume(code.length + salt.length)

          return await this.create(code, salt)
        }
      }

      imports["storage"] = {
        set: (key: Packable, fresh: Packable): void => {
          const cache = caches.get(module)!

          cache.set(key, fresh)

          const keyAsRaw = encode(key)

          const valueAsRaw = encode(fresh)

          writes.push([module, keyAsRaw, valueAsRaw])

          return
        },
        get: async (key: Packable): Promise<[Packable] | null> => {
          const cache = caches.get(module)!

          const stale = cache.get(key)

          if (stale != null)
            return [stale]

          const keyAsRaw = encode(key)

          const row = await this.data.get(`SELECT value FROM events event WHERE event.module = ? AND event.key = ? ORDER BY event.nonce DESC LIMIT 1;`, module, keyAsRaw)

          if (row == null)
            return null

          const valueAsRaw = new Uint8Array(row.value)

          reads.push([module, keyAsRaw, valueAsRaw])

          const fresh = decode(valueAsRaw)

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
        digest: async (payload: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> => {
          consume(payload.length)

          return new Uint8Array(await crypto.subtle.digest("SHA-256", payload))
        }
      }

      imports["ed25519"] = {
        verify: async (pubkey: Uint8Array<ArrayBuffer>, signature: Uint8Array<ArrayBuffer>, payload: Uint8Array<ArrayBuffer>): Promise<boolean> => {
          consume(payload.length)

          const material = await crypto.subtle.importKey("spki", pubkey, "Ed25519", true, ["verify"])

          return await crypto.subtle.verify("Ed25519", material, signature, payload)
        }
      }

      let meteredCodeAsRaw: Uint8Array<ArrayBuffer>

      if (target == null) {
        meteredCodeAsRaw = readFileSync(join(this.path, "scripts", `${module}.wasm`))
      } else if (existsSync(join(this.path, "scripts", `${module}.metered.wasm`))) {
        meteredCodeAsRaw = readFileSync(join(this.path, "scripts", `${module}.metered.wasm`))
      } else {
        const codeAsRaw = readFileSync(join(this.path, "scripts", `${module}.wasm`))

        const codeAsWasm = Readable.readFromBytes(Wasm.Module, codeAsRaw)

        meter(codeAsWasm, "sparks", "consume")

        meteredCodeAsRaw = Writable.writeToBytes(codeAsWasm)

        writeFileSync(join(this.path, "scripts", `${module}.metered.wasm`), meteredCodeAsRaw)
      }

      const meteredCodeAsModule = new WebAssembly.Module(meteredCodeAsRaw)

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

    if (!Array.isArray(params))
      throw new Error("Params is not an array")

    const result = await instance.exports[method](...params)

    if (mode !== 1)
      return { module, method, params, logs, reads, writes, result, sparks }
    if (!writes.length)
      return { module, method, params, logs, reads, writes, result, sparks }

    await runAsImmediate(this.data, async (database) => {
      const moment = await database.run(`INSERT INTO moments (epoch, module, method, params) VALUES (0, ?, ?, ?);`, module, method, params)

      const writer = await database.prepare(`INSERT INTO events (moment, module, key, value) VALUES (?, ?, ?, ?);`)

      for (const [module, key, value] of writes)
        await writer.run(moment.lastInsertRowid, module, key, value)

      return
    })

    return { module, method, params, logs, reads, writes, result, sparks }
  }

}