// deno-lint-ignore-file no-explicit-any
import { RpcErr, RpcError, RpcOk, type RpcRequestInit } from "@hazae41/jsonrpc";
import { readFile } from "node:fs/promises";

declare const self: DedicatedWorkerGlobalScope;

async function load(wasm: Uint8Array<ArrayBuffer>): Promise<WebAssembly.WebAssemblyInstantiatedSource> {
  const exports: WebAssembly.Imports = {}

  const shares = new Array<Uint8Array>()

  const load = async (wasm: Uint8Array<ArrayBuffer>): Promise<WebAssembly.WebAssemblyInstantiatedSource> => {
    const current: WebAssembly.WebAssemblyInstantiatedSource = {} as any

    const imports: WebAssembly.Imports = {}

    imports["env"] = {
      abort: () => {
        throw new Error()
      }
    }

    imports["console"] = {
      log: (offset: number, length: number) => {
        const { memory } = current.instance.exports as { memory: WebAssembly.Memory }

        const bytes = new Uint8Array(memory.buffer, offset, length)

        console.log(new TextDecoder().decode(bytes))
      }
    }

    imports["shared_memory"] = {
      put: (offset: number, length: number): number => {
        const { memory } = current.instance.exports as { memory: WebAssembly.Memory }

        const bytes = new Uint8Array(memory.buffer, offset, length)

        return shares.push(bytes.slice()) - 1
      },
      len(index: number): number {
        return shares[index].length
      },
      get: (index: number, offset: number): void => {
        const { memory } = current.instance.exports as { memory: WebAssembly.Memory }

        const bytes = new Uint8Array(memory.buffer, offset, shares[index].length)

        bytes.set(shares[index])

        delete shares[index]
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

      const imported = await load(await readFile(`./local/scripts/${element.module}.wasm`))

      exports[element.module] = imported.instance.exports
      imports[element.module] = imported.instance.exports

      continue
    }

    const instance = await WebAssembly.instantiate(module, imports)

    current.instance = instance
    current.module = module

    return current
  }

  return await load(wasm)
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