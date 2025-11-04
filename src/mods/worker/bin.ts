// deno-lint-ignore-file no-explicit-any
import { RpcErr, RpcError, RpcOk, type RpcRequestInit } from "@hazae41/jsonrpc";
import { readFileSync } from "node:fs";

declare const self: DedicatedWorkerGlobalScope;

function load(wasm: Uint8Array<ArrayBuffer>): WebAssembly.WebAssemblyInstantiatedSource {
  const exports: WebAssembly.Imports = {}

  const modules = new Map<symbol, string>()
  const shareds = new Map<symbol, Uint8Array>()
  const futures = new Map<symbol, PromiseWithResolvers<symbol>>()

  const load = (_: string, wasm: Uint8Array<ArrayBuffer>): WebAssembly.WebAssemblyInstantiatedSource => {
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

    imports["modules"] = {
      invoke: (offset: number, length: number): symbol => {
        const { memory } = current.instance.exports as { memory: WebAssembly.Memory }

        const module = new TextDecoder().decode(new Uint8Array(memory.buffer, offset, length))

        if (exports[module] != null) {
          const symbol = Symbol()

          modules.set(symbol, module)

          return symbol
        }

        const imported = load(module, readFileSync(`./local/scripts/${module}.wasm`))

        exports[module] = imported.instance.exports

        const symbol = Symbol()

        modules.set(symbol, module)

        return symbol
      }
    }

    imports["futures"] = {
      create(): symbol {
        const symbol = Symbol()

        const future = Promise.withResolvers<symbol>()

        futures.set(symbol, future)

        return symbol
      },
      resolve(symbol: symbol, result: symbol): void {
        const future = futures.get(symbol)

        if (future == null)
          throw new Error("Not found")

        future.resolve(result)
      },
      reject(symbol: symbol): void {
        const future = futures.get(symbol)

        if (future == null)
          throw new Error("Not found")

        future.reject()
      },
      wait(symbol: symbol) {
        const { onfulfilled, onrejected } = current.instance.exports as { onfulfilled: (future: symbol, result: symbol) => void, onrejected: (future: symbol) => void }

        const future = futures.get(symbol)

        if (future == null)
          throw new Error("Not found")

        future.promise.then((result) => onfulfilled(symbol, result)).catch(() => onrejected(symbol))
      }
    }

    imports["dynamic_functions"] = {}

    const module = new WebAssembly.Module(wasm)

    for (const element of WebAssembly.Module.imports(module)) {
      const { module, name } = element

      if (module === "dynamic_functions") {
        imports["dynamic_functions"][name] = (symbol: symbol, ...args: any[]) => {
          const module = modules.get(symbol)

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

      exports[module] = imported.instance.exports
      imports[module] = imported.instance.exports

      continue
    }

    const instance = new WebAssembly.Instance(module, imports)

    current.instance = instance
    current.module = module

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