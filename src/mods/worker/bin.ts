// deno-lint-ignore-file no-explicit-any
import { Cursor } from "@hazae41/cursor";
import { RpcErr, RpcError, RpcOk, type RpcRequestInit } from "@hazae41/jsonrpc";
import { readFileSync } from "node:fs";

declare const self: DedicatedWorkerGlobalScope;

const runner = new Worker(new URL("../runner/bin.ts", import.meta.url), { type: "module" })

function run(name: string, wasm: Uint8Array<ArrayBuffer>, func: string, args: Array<Uint8Array<ArrayBuffer>>) {
  const main = name

  const exports: WebAssembly.Imports = {}

  const datas = new Map<symbol, Uint8Array>()
  const packs = new Map<symbol, Array<number | bigint | symbol>>()

  const load = (name: string, wasm: Uint8Array<ArrayBuffer>): WebAssembly.WebAssemblyInstantiatedSource => {
    const current: WebAssembly.WebAssemblyInstantiatedSource = {} as any

    const imports: WebAssembly.Imports = {}

    imports["env"] = {
      abort: (messageAsPointer: number): void => {
        const { memory } = current.instance.exports as { memory: WebAssembly.Memory }

        const memory32 = new Uint32Array(memory.buffer)
        const memory16 = new Uint16Array(memory.buffer)

        const start = messageAsPointer >>> 1
        const until = messageAsPointer + memory32[messageAsPointer - 4 >>> 2] >>> 1

        let offset = start
        let message = ""

        while (until - offset > 1024)
          message += String.fromCharCode(...memory16.subarray(offset, offset += 1024));

        message += String.fromCharCode(...memory16.subarray(offset, until));

        throw new Error(message)
      }
    }

    imports["console"] = {
      log: (messageAsSymbol: symbol): void => {
        const messageAsBytes = datas.get(messageAsSymbol)

        if (messageAsBytes == null)
          throw new Error("Not found")

        console.log(new TextDecoder().decode(messageAsBytes))
      }
    }

    imports["shared_memory"] = {
      save: (offset: number, length: number): symbol => {
        const { memory } = current.instance.exports as { memory: WebAssembly.Memory }

        const symbol = Symbol()

        const slice = new Uint8Array(memory.buffer, offset, length)

        datas.set(symbol, slice.slice())

        return symbol
      },
      size: (symbol: symbol): number => {
        const bytes = datas.get(symbol)

        if (bytes == null)
          throw new Error("Not found")

        return bytes.length
      },
      load: (symbol: symbol, offset: number): void => {
        const { memory } = current.instance.exports as { memory: WebAssembly.Memory }

        const bytes = datas.get(symbol)

        if (bytes == null)
          throw new Error("Not found")

        const slice = new Uint8Array(memory.buffer, offset, bytes.length)

        slice.set(bytes)
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
        const symbol = symbols.at(index)

        if (symbol == null)
          throw new Error("Not found")

        return symbol
      }
    }

    imports["modules"] = {
      main: (): symbol => {
        const moduleAsSymbol = Symbol()

        datas.set(moduleAsSymbol, Uint8Array.fromHex(main))

        return moduleAsSymbol
      },
      self: (): symbol => {
        const moduleAsSymbol = Symbol()

        datas.set(moduleAsSymbol, Uint8Array.fromHex(name))

        return moduleAsSymbol
      }
    }

    imports["bytes"] = {
      from_hex: (textAsSymbol: symbol): symbol => {
        const textAsBytes = datas.get(textAsSymbol)

        if (textAsBytes == null)
          throw new Error("Not found")

        const textAsString = new TextDecoder().decode(textAsBytes)

        const symbol = Symbol()

        datas.set(symbol, Uint8Array.fromHex(textAsString))

        return symbol
      },
      from_base64: (textAsSymbol: symbol): symbol => {
        const textAsBytes = datas.get(textAsSymbol)

        if (textAsBytes == null)
          throw new Error("Not found")

        const textAsString = new TextDecoder().decode(textAsBytes)

        const symbol = Symbol()

        datas.set(symbol, Uint8Array.fromBase64(textAsString))

        return symbol
      },
      to_hex: (bytesAsSymbol: symbol): symbol => {
        const bytesAsBytes = datas.get(bytesAsSymbol)

        if (bytesAsBytes == null)
          throw new Error("Not found")

        const symbol = Symbol()

        datas.set(symbol, new TextEncoder().encode(bytesAsBytes.toHex()))

        return symbol
      },
      to_base64: (bytesAsSymbol: symbol): symbol => {
        const bytesAsBytes = datas.get(bytesAsSymbol)

        if (bytesAsBytes == null)
          throw new Error("Not found")

        const symbol = Symbol()

        datas.set(symbol, new TextEncoder().encode(bytesAsBytes.toBase64()))

        return symbol
      }
    }

    imports["sha256"] = {
      digest: (payloadAsSymbol: symbol): symbol => {
        const payloadAsBytes = datas.get(payloadAsSymbol)

        if (payloadAsBytes == null)
          throw new Error("Not found")

        const result = new Int32Array(new SharedArrayBuffer((1 + 32) * 4))

        runner.postMessage({ method: "sha256_digest", params: [payloadAsBytes], result })

        if (Atomics.wait(result, 0, 0) !== "ok")
          throw new Error("Failed to wait")
        if (result[0] === 2)
          throw new Error("Internal error")

        const digestAsBytes = new Uint8Array(32)

        digestAsBytes.set(new Uint8Array(result.buffer, 4, 32))

        const symbol = Symbol()

        datas.set(symbol, digestAsBytes)

        return symbol
      }
    }

    imports["ed25519"] = {
      verify: (pubkeyAsSymbol: symbol, signatureAsSymbol: symbol, payloadAsSymbol: symbol): boolean => {
        const pubkeyAsBytes = datas.get(pubkeyAsSymbol)
        const signatureAsBytes = datas.get(signatureAsSymbol)
        const payloadAsBytes = datas.get(payloadAsSymbol)

        if (pubkeyAsBytes == null)
          throw new Error("Not found")
        if (signatureAsBytes == null)
          throw new Error("Not found")
        if (payloadAsBytes == null)
          throw new Error("Not found")

        const result = new Int32Array(new SharedArrayBuffer((1 + 1) * 4))

        runner.postMessage({ method: "ed25519_verify", params: [pubkeyAsBytes, signatureAsBytes, payloadAsBytes], result })

        if (Atomics.wait(result, 0, 0) !== "ok")
          throw new Error("Failed to wait")
        if (result[0] === 2)
          throw new Error("Internal error")

        return result[1] === 1
      }
    }

    imports["packs"] = {
      create: (...args: Array<number | bigint | symbol>): symbol => {
        const symbol = Symbol()

        packs.set(symbol, args)

        return symbol
      },
      length: (packAsSymbol: symbol): number => {
        const args = packs.get(packAsSymbol)

        if (args == null)
          throw new Error("Not found")

        return args.length
      },
      get(packAsSymbol: symbol, index: number): number | bigint | symbol {
        const args = packs.get(packAsSymbol)

        if (args == null)
          throw new Error("Not found")

        const arg = args[index]

        if (arg == null)
          throw new Error("Not found")

        return arg
      },
      encode: (packAsSymbol: symbol): symbol => {
        const args = packs.get(packAsSymbol)

        if (args == null)
          throw new Error("Not found")

        let length = 0

        for (const arg of args) {
          if (typeof arg === "number") {
            length += 1 + 4
            continue
          }

          if (typeof arg === "bigint") {
            length += 1 + 8
            continue
          }

          if (typeof arg === "symbol") {
            const bytes = datas.get(arg)

            if (bytes == null)
              throw new Error("Not found")

            length += 1 + 4 + bytes.length
            continue
          }

          throw new Error("Unknown type")
        }

        const bytes = new Uint8Array(length)

        const cursor = new Cursor(bytes)

        for (const arg of args) {
          if (typeof arg === "number") {
            cursor.writeUint8OrThrow(1)
            cursor.writeUint32OrThrow(arg)
            continue
          }

          if (typeof arg === "bigint") {
            cursor.writeUint8OrThrow(2)
            cursor.writeUint64OrThrow(arg)
            continue
          }

          if (typeof arg === "symbol") {
            const bytes = datas.get(arg)

            if (bytes == null)
              throw new Error("Not found")

            cursor.writeUint8OrThrow(3)
            cursor.writeUint32OrThrow(bytes.length)
            cursor.writeOrThrow(bytes)
            continue
          }

          throw new Error("Unknown type")
        }

        const symbol = Symbol()

        datas.set(symbol, bytes)

        return symbol
      },
      decode: (bytesAsSymbol: symbol): symbol => {
        const bytes = datas.get(bytesAsSymbol)

        if (bytes == null)
          throw new Error("Not found")

        const args = new Array<number | bigint | symbol>()

        const cursor = new Cursor(bytes)

        while (cursor.offset < cursor.length) {
          const type = cursor.readUint8OrThrow()

          if (type === 1) {
            args.push(cursor.readUint32OrThrow())
            continue
          }

          if (type === 2) {
            args.push(cursor.readUint64OrThrow())
            continue
          }

          if (type === 3) {
            const length = cursor.readUint32OrThrow()
            const slice = cursor.readOrThrow(length)
            const symbol = Symbol()

            datas.set(symbol, slice)

            args.push(symbol)
            continue
          }

          throw new Error("Unknown type")
        }

        const symbol = Symbol()

        packs.set(symbol, args)

        return symbol
      }
    }

    const rests = new Map<symbol, symbol>()

    imports["dynamic"] = {
      rest: (packAsSymbol: symbol): symbol => {
        const symbol = Symbol()

        rests.set(symbol, packAsSymbol)

        return symbol
      },
      call: (moduleAsSymbol: symbol, nameAsSymbol: symbol, ...args: any[]) => {
        const moduleAsBytes = datas.get(moduleAsSymbol)

        if (moduleAsBytes == null)
          throw new Error("Not found")

        const moduleAsString = moduleAsBytes.toHex()

        const nameAsBytes = datas.get(nameAsSymbol)

        if (nameAsBytes == null)
          throw new Error("Not found")

        const nameAsString = new TextDecoder().decode(nameAsBytes)

        if (exports[moduleAsString] == null)
          load(moduleAsString, readFileSync(`./local/scripts/${moduleAsString}.wasm`))

        if (typeof exports[moduleAsString][nameAsString] !== "function")
          throw new Error("Not found")

        const unpack = (packeds: Array<any>) => {
          const unpackeds = new Array<any>()

          const unpack = (packeds: Array<any>) => {
            for (const arg of packeds) {
              if (typeof arg !== "symbol") {
                unpackeds.push(arg)
                continue
              }

              const pack = rests.get(arg)

              if (pack == null) {
                unpackeds.push(arg)
                continue
              }

              rests.delete(arg)

              const subargs = packs.get(pack)

              if (subargs == null) {
                unpackeds.push(arg)
                continue
              }

              unpack(subargs)
            }
          }

          unpack(packeds)

          return unpackeds
        }

        return exports[moduleAsString][nameAsString](...unpack(args))
      }
    }

    const module = new WebAssembly.Module(wasm)

    for (const element of WebAssembly.Module.imports(module)) {
      const { module } = element

      if (imports[module] != null) {
        // NOOP
        continue
      }

      if (exports[module] != null) {
        imports[module] = exports[module]
        continue
      }

      const imported = load(module, readFileSync(`./local/scripts/${module}.wasm`))

      imports[module] = imported.instance.exports

      continue
    }

    const instance = new WebAssembly.Instance(module, imports)

    current.instance = instance
    current.module = module

    exports[name] = instance.exports

    return current
  }

  const { instance } = load(name, wasm)

  if (typeof instance.exports[func] !== "function")
    return

  instance.exports[func](...args.map(arg => {
    const symbol = Symbol()

    datas.set(symbol, arg)

    return symbol
  }))
}

self.addEventListener("message", (event: MessageEvent<RpcRequestInit>) => {
  const { id } = event.data

  try {
    const { params } = event.data

    const [name, wasm, func, args] = params as [string, Uint8Array<ArrayBuffer>, string, Array<Uint8Array<ArrayBuffer>>]

    const start = performance.now()

    run(name, wasm, func, args)

    const until = performance.now()

    console.log(`${(until - start).toFixed(2)}ms`)

    self.postMessage(new RpcOk(id, undefined))
  } catch (cause: unknown) {
    console.error(cause)

    self.postMessage(new RpcErr(id, RpcError.rewrap(cause)))
  }
})