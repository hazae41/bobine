import { RpcErr, RpcError, type RpcRequestInit } from "@hazae41/jsonrpc";
import { readFile } from "node:fs/promises";
import wassemble from "wassemble/wassemble.mjs";

declare const self: DedicatedWorkerGlobalScope;

async function load(code: string) {
  const instances: Record<string, WebAssembly.Instance> = {}
  const functions: Record<string, unknown> = {}

  const matches = code.matchAll(/^ *\(import \"([a-zA-Z0-9]+)\" .+\)$/gm)

  for (const match of matches) {
    const [module, name] = match.slice(1)

    const instance = instances[module]

    if (instance == null) {
      const code = await readFile(`./data/bob/scripts/${module}.wat`, "utf8")
      const wasm = await WebAssembly.instantiate(wassemble(code))

      const { instance } = wasm

      instances[module] = instance

      functions[module] = wasm.instance.exports[name]

      continue
    }

    functions[module] = instance.exports[name]

    continue
  }

  const wasm = await WebAssembly.instantiate(wassemble(code))

  return wasm.instance
}

self.addEventListener("message", async (event: MessageEvent<RpcRequestInit>) => {
  const { id } = event.data

  try {
    const { params } = event.data

    const [code] = params as [string]

    await load(code)

  } catch (cause: unknown) {
    self.postMessage(new RpcErr(id, RpcError.rewrap(cause)))
  }
})