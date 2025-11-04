// deno-lint-ignore-file no-explicit-any
import { RpcErr, RpcError, RpcOk, type RpcRequestInit } from "@hazae41/jsonrpc";
import { readFile } from "node:fs/promises";

declare const self: DedicatedWorkerGlobalScope;

async function load(wasm: Uint8Array<ArrayBuffer>): Promise<WebAssembly.WebAssemblyInstantiatedSource> {
  const exports: WebAssembly.Imports = {}

  const modules = new Map<symbol, string>()
  const shareds = new Map<symbol, Uint8Array>()
  const futures = new Map<symbol, PromiseWithResolvers<symbol>>()

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

    imports["modules"] = {
      import: (offset: number, length: number): symbol => {
        const { memory } = current.instance.exports as { memory: WebAssembly.Memory }

        const symbol = Symbol()

        const future = Promise.withResolvers<symbol>()

        Promise.try(async () => {
          const module = new TextDecoder().decode(new Uint8Array(memory.buffer, offset, length))

          if (exports[module] != null) {
            const symbol = Symbol()

            modules.set(symbol, module)

            return symbol
          }

          const imported = await load(module, await readFile(`./local/scripts/${module}.wasm`))

          exports[module] = imported.instance.exports

          const symbol = Symbol()

          modules.set(symbol, module)

          return symbol
        }).then(future.resolve).catch(future.reject)

        futures.set(symbol, future)

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
      rejects(symbol: symbol): void {
        const future = futures.get(symbol)

        if (future == null)
          throw new Error("Not found")

        future.reject()
      },
      await(symbol: symbol) {
        const { settle } = current.instance.exports as { settle: (future: symbol, result: symbol | null) => void }

        const future = futures.get(symbol)

        if (future == null)
          throw new Error("Not found")

        future.promise.then((result) => settle(symbol, result)).catch(() => settle(symbol, null))
      }
    }

    imports["dynamic_functions"] = {}

    const module = await WebAssembly.compile(wasm)

    for (const element of WebAssembly.Module.imports(module)) {
      const { module, name } = element

      if (module === "dynamic_functions") {
        imports["dynamic_functions"][name] = (symbol: symbol) => {
          const module = modules.get(symbol)

          if (module == null)
            throw new Error("Not found")

          if (typeof exports[module][name] !== "function")
            throw new Error("Not found")

          return exports[module][name]()
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

      const imported = await load(module, await readFile(`./local/scripts/${module}.wasm`))

      exports[module] = imported.instance.exports
      imports[module] = imported.instance.exports

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