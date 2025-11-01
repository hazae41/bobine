// deno-lint-ignore-file no-explicit-any
import { RpcErr, RpcError, RpcOk, type RpcRequestInit } from "@hazae41/jsonrpc";
import { readFile } from "node:fs/promises";

declare const self: DedicatedWorkerGlobalScope;

function extract<T extends ArrayBufferLike>(memory: Uint8Array<T>, pointer: number): Uint8Array<T> {
  let until = pointer

  for (; until < memory.byteLength && memory[until] !== 0; until++);

  return memory.subarray(pointer, until)
}

function adapt(source: WebAssembly.WebAssemblyInstantiatedSource, exportsWithPointers: WebAssembly.Exports) {
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

function unadapt(source: WebAssembly.WebAssemblyInstantiatedSource, exportsWithBytes: WebAssembly.Exports) {
  const exportsWithPointers: WebAssembly.Exports = { ...exportsWithBytes }

  for (const key in exportsWithBytes) {
    const methodWithBytes = exportsWithBytes[key]

    if (typeof methodWithBytes !== "function")
      continue

    exportsWithPointers[key] = (inputAsPointer?: number) => {
      const { alloc, memory } = source.instance.exports as { memory: WebAssembly.Memory, alloc: (size: number) => number }

      const bytes = new Uint8Array(memory.buffer)

      if (inputAsPointer == null) {
        const outputAsBytes = methodWithBytes()

        if (outputAsBytes == null)
          return

        const outputAsPointer = alloc(outputAsBytes.length + 1)

        bytes.set(outputAsBytes, outputAsPointer)
        bytes[outputAsPointer + outputAsBytes.length] = 0

        return outputAsPointer
      }

      const inputAsBytes = extract(bytes, inputAsPointer)

      const outputAsBytes = methodWithBytes(inputAsBytes)

      if (outputAsBytes == null)
        return

      const outputAsPointer = alloc(outputAsBytes.length + 1)

      bytes.set(outputAsBytes, outputAsPointer)
      bytes[outputAsPointer + outputAsBytes.length] = 0

      return outputAsPointer
    }
  }

  return exportsWithPointers
}

async function load(wasm: Uint8Array<ArrayBuffer>, wast: string): Promise<WebAssembly.WebAssemblyInstantiatedSource> {
  const exported: WebAssembly.WebAssemblyInstantiatedSource = { instance: null } as any

  const imports: WebAssembly.Imports = { env: { abort: () => { throw new Error() } } }

  for (const match of wast.matchAll(/^ *\(import \"([a-f0-9]{64})\" .+\)$/gm)) {
    const [module] = match.slice(1)

    if (imports[module] != null)
      continue

    const wasm = await readFile(`./local/scripts/${module}.wasm`)
    const wast = await readFile(`./local/scripts/${module}.wast`, "utf8")

    const imported = await load(wasm, wast)

    imports[module] = unadapt(exported, adapt(imported, imported.instance.exports))

    continue
  }

  const { instance, module } = await WebAssembly.instantiate(wasm, imports)

  exported.instance = instance
  exported.module = module

  return exported
}

self.addEventListener("message", async (event: MessageEvent<RpcRequestInit>) => {
  const { id } = event.data

  try {
    const { params } = event.data

    const [wasm, wast] = params as [Uint8Array<ArrayBuffer>, string]

    const loaded = await load(wasm, wast)

    const adapted = adapt(loaded, loaded.instance.exports)

    const input = new TextEncoder().encode(JSON.stringify("hello"))

    // @ts-ignore: main
    const bytes = adapted.main(input)

    const output = JSON.parse(new TextDecoder().decode(bytes))

    console.log(output)

    self.postMessage(new RpcOk(id, undefined))
  } catch (cause: unknown) {
    console.error(cause)

    self.postMessage(new RpcErr(id, RpcError.rewrap(cause)))
  }
})