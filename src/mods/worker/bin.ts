// deno-lint-ignore-file no-explicit-any
import { RpcErr, RpcError, RpcOk, type RpcRequestInit } from "@hazae41/jsonrpc";
import { readFile } from "node:fs/promises";

declare const self: DedicatedWorkerGlobalScope;

function extract<T extends ArrayBufferLike>(memory: Uint8Array<T>, pointer: number): Uint8Array<T> {
  let until = pointer

  for (; until < memory.byteLength && memory[until] !== 0; until++);

  return memory.subarray(pointer, until)
}

function exp(source: WebAssembly.WebAssemblyInstantiatedSource, exportsWithPointers: WebAssembly.Exports) {
  const exportsWithBytes: WebAssembly.Exports = { ...exportsWithPointers }

  for (const key in exportsWithPointers) {
    const methodWithPointers = exportsWithPointers[key]

    if (typeof methodWithPointers !== "function")
      continue

    exportsWithBytes[key] = (inputAsBytes?: Uint8Array) => {
      const { alloc, memory } = source.instance.exports as { memory: WebAssembly.Memory, alloc: (size: number) => number }

      const bytes = new Uint8Array(memory.buffer)

      if (inputAsBytes == null) {
        const outputAsPointer = methodWithPointers()

        if (outputAsPointer == null)
          return

        return extract(bytes, outputAsPointer)
      }

      const inputAsPointer = alloc(inputAsBytes.length + 1)

      bytes.set(inputAsBytes, inputAsPointer)
      bytes[inputAsPointer + inputAsBytes.length] = 0

      const outputAsPointer = methodWithPointers(inputAsPointer)

      if (outputAsPointer == null)
        return

      return extract(bytes, outputAsPointer)
    }
  }

  return exportsWithBytes
}

async function load(wasm: Uint8Array<ArrayBuffer>): Promise<WebAssembly.WebAssemblyInstantiatedSource> {
  const current: WebAssembly.WebAssemblyInstantiatedSource = {} as any

  const module = await WebAssembly.compile(wasm)

  const imports: WebAssembly.Imports = {}

  const shared_memory = new Array<Uint8Array>()

  imports["env"] = {
    abort: () => { throw new Error() },
    log: (idx: number) => console.log(new TextDecoder().decode(shared_memory[idx]))
  }

  imports["shared_memory"] = {
    put: (ptr: number, len: number): number => {
      const { memory } = current.instance.exports as { memory: WebAssembly.Memory }

      const bytes = new Uint8Array(memory.buffer, ptr, len)

      return shared_memory.push(bytes.slice()) - 1
    },
    len(idx: number): number {
      return shared_memory[idx].length
    },
    get: (idx: number, ptr: number): void => {
      const { memory } = current.instance.exports as { memory: WebAssembly.Memory }

      const bytes = new Uint8Array(memory.buffer, ptr, shared_memory[idx].length)

      bytes.set(shared_memory[idx])

      delete shared_memory[idx]
    }
  }

  imports["virtual"] = {}

  for (const element of WebAssembly.Module.imports(module)) {
    console.log(element)

    if (element.module === "virtual") {
      imports["virtual"][element.name] = (pointer: number) => {
        console.log(`Called ${element.name} with pointer ${pointer}`)
        return 123
      }
      continue
    }

    if (imports[element.module] != null)
      continue

    const imported = await load(await readFile(`./local/scripts/${element.module}.wasm`))

    imports[element.module] = imported.instance.exports

    continue
  }

  const instance = await WebAssembly.instantiate(module, imports)

  current.instance = instance
  current.module = module

  return current
}

self.addEventListener("message", async (event: MessageEvent<RpcRequestInit>) => {
  const { id } = event.data

  try {
    const { params } = event.data

    const [wasm] = params as [Uint8Array<ArrayBuffer>]

    const main = await load(wasm)

    // @ts-ignore: main
    main.instance.exports.main()

    self.postMessage(new RpcOk(id, undefined))
  } catch (cause: unknown) {
    console.error(cause)

    self.postMessage(new RpcErr(id, RpcError.rewrap(cause)))
  }
})