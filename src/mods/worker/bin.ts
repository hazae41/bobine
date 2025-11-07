// deno-lint-ignore-file no-explicit-any
import { RpcErr, RpcError, RpcOk, type RpcRequestInit } from "@hazae41/jsonrpc";
import { readFileSync } from "node:fs";

declare const self: DedicatedWorkerGlobalScope;

const runner = new Worker(new URL("../runner/bin.ts", import.meta.url), { type: "module" })

function run(name: string, wasm: Uint8Array<ArrayBuffer>, func: string, args: Array<Uint8Array<ArrayBuffer>>) {
  const main = name

  const exports: WebAssembly.Imports = {}

  const shareds = new Map<symbol, Uint8Array>()

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
        const messageAsBytes = shareds.get(messageAsSymbol)

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

        shareds.set(symbol, slice.slice())

        return symbol
      },
      size: (symbol: symbol): number => {
        const bytes = shareds.get(symbol)

        if (bytes == null)
          throw new Error("Not found")

        return bytes.length
      },
      load: (symbol: symbol, offset: number): void => {
        const { memory } = current.instance.exports as { memory: WebAssembly.Memory }

        const bytes = shareds.get(symbol)

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

        shareds.set(moduleAsSymbol, Uint8Array.fromHex(main))

        return moduleAsSymbol
      },
      self: (): symbol => {
        const moduleAsSymbol = Symbol()

        shareds.set(moduleAsSymbol, Uint8Array.fromHex(name))

        return moduleAsSymbol
      },
      load: (nameAsSymbol: symbol): void => {
        const moduleAsBytes = shareds.get(nameAsSymbol)

        if (moduleAsBytes == null)
          throw new Error("Not found")

        const moduleAsString = moduleAsBytes.toHex()

        if (exports[moduleAsString] != null)
          return

        load(moduleAsString, readFileSync(`./local/scripts/${moduleAsString}.wasm`))
      }
    }

    imports["bytes"] = {
      from_hex: (textAsSymbol: symbol): symbol => {
        const textAsBytes = shareds.get(textAsSymbol)

        if (textAsBytes == null)
          throw new Error("Not found")

        const textAsString = new TextDecoder().decode(textAsBytes)

        const symbol = Symbol()

        shareds.set(symbol, Uint8Array.fromHex(textAsString))

        return symbol
      },
      from_base64: (textAsSymbol: symbol): symbol => {
        const textAsBytes = shareds.get(textAsSymbol)

        if (textAsBytes == null)
          throw new Error("Not found")

        const textAsString = new TextDecoder().decode(textAsBytes)

        const symbol = Symbol()

        shareds.set(symbol, Uint8Array.fromBase64(textAsString))

        return symbol
      },
      to_hex: (bytesAsSymbol: symbol): symbol => {
        const bytesAsBytes = shareds.get(bytesAsSymbol)

        if (bytesAsBytes == null)
          throw new Error("Not found")

        const symbol = Symbol()

        shareds.set(symbol, new TextEncoder().encode(bytesAsBytes.toHex()))

        return symbol
      },
      to_base64: (bytesAsSymbol: symbol): symbol => {
        const bytesAsBytes = shareds.get(bytesAsSymbol)

        if (bytesAsBytes == null)
          throw new Error("Not found")

        const symbol = Symbol()

        shareds.set(symbol, new TextEncoder().encode(bytesAsBytes.toBase64()))

        return symbol
      }
    }

    imports["sha256"] = {
      digest: (payloadAsSymbol: symbol): symbol => {
        const payloadAsBytes = shareds.get(payloadAsSymbol)

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

        shareds.set(symbol, digestAsBytes)

        return symbol
      }
    }

    imports["ed25519"] = {
      verify: (pubkeyAsSymbol: symbol, signatureAsSymbol: symbol, payloadAsSymbol: symbol): boolean => {
        const pubkeyAsBytes = shareds.get(pubkeyAsSymbol)
        const signatureAsBytes = shareds.get(signatureAsSymbol)
        const payloadAsBytes = shareds.get(payloadAsSymbol)

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

    imports["dynamic"] = {
      call: (moduleAsSymbol: symbol, nameAsSymbol: symbol, ...args: any[]) => {
        const moduleAsBytes = shareds.get(moduleAsSymbol)

        if (moduleAsBytes == null)
          throw new Error("Not found")

        const moduleAsString = moduleAsBytes.toHex()

        const nameAsBytes = shareds.get(nameAsSymbol)

        if (nameAsBytes == null)
          throw new Error("Not found")

        const nameAsString = new TextDecoder().decode(nameAsBytes)

        if (typeof exports[moduleAsString][nameAsString] !== "function")
          throw new Error("Not found")

        return exports[moduleAsString][nameAsString](...args)
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

    shareds.set(symbol, arg)

    return symbol
  }))
}

self.addEventListener("message", (event: MessageEvent<RpcRequestInit>) => {
  const { id } = event.data

  try {
    const { params } = event.data

    const [name, wasm, func, args] = params as [string, Uint8Array<ArrayBuffer>, string, Array<Uint8Array<ArrayBuffer>>]

    run(name, wasm, func, args)

    self.postMessage(new RpcOk(id, undefined))
  } catch (cause: unknown) {
    console.error(cause)

    self.postMessage(new RpcErr(id, RpcError.rewrap(cause)))
  }
})