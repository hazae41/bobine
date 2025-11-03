// deno-lint-ignore-file no-explicit-any
import { RpcErr, RpcError, RpcOk, type RpcRequestInit } from "@hazae41/jsonrpc";
import { readFile } from "node:fs/promises";

declare const self: DedicatedWorkerGlobalScope;

async function load(wasm: Uint8Array<ArrayBuffer>): Promise<WebAssembly.WebAssemblyInstantiatedSource> {
  const exports: WebAssembly.Imports = {}

  const shareds = new Map<symbol, Uint8Array>()

  const load = async (name: string, wasm: Uint8Array<ArrayBuffer>): Promise<WebAssembly.WebAssemblyInstantiatedSource> => {
    const current: WebAssembly.WebAssemblyInstantiatedSource = {} as any

    const imports: WebAssembly.Imports = {}

    imports["env"] = {
      abort: (): never => {
        throw new Error()
      }
    }

    imports["console"] = {
      log: (offset: number, length: number): void => {
        const { memory } = current.instance.exports as { memory: WebAssembly.Memory }

        const bytes = new Uint8Array(memory.buffer, offset, length)

        console.log(new TextDecoder().decode(bytes))
      }
    }

    imports["shared_memory"] = {
      save: (offset: number, length: number): symbol => {
        const { memory } = current.instance.exports as { memory: WebAssembly.Memory }

        const symbol = Symbol()

        const slice = new Uint8Array(memory.buffer, offset, length)
        const clone = new Uint8Array(slice)

        shareds.set(symbol, clone)

        return symbol
      },
      size(symbol: symbol): number {
        const value = shareds.get(symbol)

        if (value == null)
          throw new Error("Not found")

        return value.length
      },
      load: (symbol: symbol, offset: number): void => {
        const { memory } = current.instance.exports as { memory: WebAssembly.Memory }

        const value = shareds.get(symbol)

        if (value == null)
          throw new Error("Not found")

        const slice = new Uint8Array(memory.buffer, offset, value.length)

        slice.set(value)

        shareds.delete(symbol)
      }
    }

    const symbols = new Array<symbol>()
    const numbers = new Map<symbol, number>()

    imports["symbols"] = {
      create(): symbol {
        return Symbol()
      },
      numerize(symbol: symbol): number {
        const stale = numbers.get(symbol)

        if (stale != null)
          return stale

        const fresh = symbols.push(symbol) - 1

        numbers.set(symbol, fresh)

        return fresh
      },
      denumerize(number: number): symbol {
        const symbol = symbols.at(number)

        if (symbol == null)
          throw new Error("Not found")

        return symbol
      }
    }

    imports["virtual"] = {}

    const module = await WebAssembly.compile(wasm)

    for (const element of WebAssembly.Module.imports(module)) {
      console.log(element)

      if (element.module === "virtual") {
        imports["virtual"][element.name] = (pointer: number) => console.log(`Called ${element.name} with pointer ${pointer}`)
        continue
      }

      if (imports[element.module] != null) {
        // NOOP
        continue
      }

      if (exports[element.module] != null) {
        imports[element.module] = exports[element.module]
        continue
      }

      const imported = await load(element.module, await readFile(`./local/scripts/${element.module}.wasm`))

      exports[element.module] = imported.instance.exports
      imports[element.module] = imported.instance.exports

      continue
    }

    const instance = await WebAssembly.instantiate(module, imports)

    current.instance = instance
    current.module = module

    return current
  }

  return await load("main", wasm)
}

self.addEventListener("message", async (event: MessageEvent<RpcRequestInit>) => {
  const { id } = event.data

  try {
    const { params } = event.data

    const [wasm] = params as [Uint8Array<ArrayBuffer>]

    const main = await load(wasm)

    if (typeof main.instance.exports.main === "function")
      console.log(main.instance.exports.main())

    self.postMessage(new RpcOk(id, undefined))
  } catch (cause: unknown) {
    console.error(cause)

    self.postMessage(new RpcErr(id, RpcError.rewrap(cause)))
  }
})