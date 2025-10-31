// deno-lint-ignore-file no-explicit-any

import { RpcErr, RpcError, RpcOk, type RpcRequestInit } from "@hazae41/jsonrpc";
import { compileString } from "assemblyscript/asc";
import { readFile } from "node:fs/promises";

declare const self: DedicatedWorkerGlobalScope;

async function load(code: string): Promise<WebAssembly.Exports> {
  const { error, binary, text, "binary.js": glue } = await compileString(code, { bindings: ["raw"] }) as any

  if (error != null)
    throw new Error("AssemblyScript compilation failed", { cause: error })

  const { instantiate } = await import(URL.createObjectURL(new Blob([glue], { type: "application/javascript" })))

  const module = await WebAssembly.compile(binary)

  const imports: WebAssembly.Imports = {}

  for (const match of text!.matchAll(/^ *\(import \"\.\/([a-zA-Z0-9]+)\.wat\" .+\)$/gm)) {
    const [name] = match.slice(1)

    if (imports[name] != null)
      continue

    const code = await readFile(`./local/scripts/${name}.ts`, "utf8")

    const exports = await load(code)

    imports[`./${name}.wat`] = exports

    continue
  }

  const exports = await instantiate(module, imports)

  return exports
}

self.addEventListener("message", async (event: MessageEvent<RpcRequestInit>) => {
  const { id } = event.data

  try {
    const { params } = event.data

    const [code] = params as [string]

    const exports = await load(code)

    // @ts-ignore: main
    exports.main()

    self.postMessage(new RpcOk(id, undefined))
  } catch (cause: unknown) {
    console.error(cause)

    self.postMessage(new RpcErr(id, RpcError.rewrap(cause)))
  }
})