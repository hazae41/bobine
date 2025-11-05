// deno-lint-ignore-file no-explicit-any
import { RpcErr, RpcError, RpcOk, type RpcRequestInit } from "@hazae41/jsonrpc";
import { readFileSync } from "node:fs";

declare const self: DedicatedWorkerGlobalScope;

const runner = new Worker(new URL("../runner/bin.ts", import.meta.url), { type: "module" })

function load(wasm: Uint8Array<ArrayBuffer>): WebAssembly.WebAssemblyInstantiatedSource {
  const exports: WebAssembly.Imports = {}

  const symbolByModule = new Map<string, symbol>()
  const moduleBySymbol = new Map<symbol, string>()

  const shareds = new Map<symbol, Uint8Array>()

  const load = (name: string, wasm: Uint8Array<ArrayBuffer>): WebAssembly.WebAssemblyInstantiatedSource => {
    const current: WebAssembly.WebAssemblyInstantiatedSource = {} as any

    const symbol = Symbol()

    symbolByModule.set(name, symbol)
    moduleBySymbol.set(symbol, name)

    const imports: WebAssembly.Imports = {}

    imports["env"] = {
      abort: (): never => {
        throw new Error()
      }
    }

    imports["console"] = {
      log: (messageAsSymbol: symbol): void => {
        const messageAsBytes = shareds.get(messageAsSymbol)

        if (messageAsBytes == null)
          throw new Error("Not found")

        console.log(new TextDecoder().decode(messageAsBytes))

        shareds.delete(messageAsSymbol)
      }
    }

    imports["shared_memory"] = {
      save: (offset: number, length: number): symbol => {
        const { memory } = current.instance.exports as { memory: WebAssembly.Memory }

        const symbol = Symbol()

        const slice = new Uint8Array(memory.buffer, offset, length)

        shareds.set(symbol, slice)

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

        shareds.delete(symbol)
      }
    }

    const symbols = new Array<symbol>()
    const numbers = new Map<symbol, number>()

    imports["symbols"] = {
      create: (): symbol => {
        return Symbol()
      },
      destroy: (symbol: symbol): void => {
        const index = numbers.get(symbol)

        if (index == null)
          throw new Error("Not found")

        delete symbols[index]
        numbers.delete(symbol)
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
      self: (): symbol => {
        const symbol = symbolByModule.get(name)

        if (symbol == null)
          throw new Error("Not found")

        return symbol
      },
      invoke: (nameAsSymbol: symbol): symbol => {
        const nameAsString = new TextDecoder().decode(shareds.get(nameAsSymbol))

        if (nameAsString == null)
          throw new Error("Not found")

        const stale = symbolByModule.get(nameAsString)

        if (stale != null)
          return stale

        load(nameAsString, readFileSync(`./local/scripts/${nameAsString}.wasm`))

        const fresh = Symbol()

        symbolByModule.set(nameAsString, fresh)
        moduleBySymbol.set(fresh, nameAsString)

        return fresh
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

        const result = new Int32Array(new SharedArrayBuffer(2 * 4))

        runner.postMessage({ method: "ed25519_verify", params: [pubkeyAsBytes, signatureAsBytes, payloadAsBytes], result })

        if (Atomics.wait(result, 0, 0) !== "ok")
          throw new Error("Failed to wait")
        if (result[0] === 2)
          throw new Error("Internal error")

        return result[1] === 1
      }
    }

    imports["dynamic_functions"] = {}

    const module = new WebAssembly.Module(wasm)

    for (const element of WebAssembly.Module.imports(module)) {
      const { module, name } = element

      if (module === "dynamic_functions") {
        imports["dynamic_functions"][name] = (symbol: symbol, ...args: any[]) => {
          const module = moduleBySymbol.get(symbol)

          if (module == null)
            throw new Error("Not found")

          if (typeof exports[module][name] !== "function")
            throw new Error("Not found")

          return exports[module][name](...args)
        }

        continue
      }

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

  return load("main", wasm)
}

self.addEventListener("message", (event: MessageEvent<RpcRequestInit>) => {
  const { id } = event.data

  try {
    const { params } = event.data

    const [wasm] = params as [Uint8Array<ArrayBuffer>]

    const main = load(wasm)

    if (typeof main.instance.exports.main === "function")
      console.log(main.instance.exports.main())

    console.log("finished")

    self.postMessage(new RpcOk(id, undefined))
  } catch (cause: unknown) {
    console.error(cause)

    self.postMessage(new RpcErr(id, RpcError.rewrap(cause)))
  }
})