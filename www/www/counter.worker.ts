import "@hazae41/symbol-dispose-polyfill";

import "@hazae41/disposable-stack-polyfill";

import { RpcErr, RpcError, RpcMethodNotFoundError, RpcOk, RpcRequestInit } from "@hazae41/jsonrpc";

const response = await fetch("/counter.wasm")
const module = await WebAssembly.compileStreaming(response)

let stored: Uint8Array | null = null

async function execute() {
  const imports: WebAssembly.Imports = {}

  imports["env"] = {
    abort: () => {
      throw new Error()
    }
  }

  imports["blobs"] = {
    save: (offset: number, length: number): Uint8Array => {
      const { memory } = instance.exports as { memory: WebAssembly.Memory }

      const view = new Uint8Array(memory.buffer, offset >>> 0, length >>> 0)

      return view.slice()
    }
  }

  imports["bigints"] = {
    one: (): bigint => {
      return 1n
    },
    inc: (value: bigint): bigint => {
      return value + 1n
    },
    encode: (bigint: bigint): Uint8Array => {
      const text = bigint.toString(16)
      const data = Uint8Array.fromHex(text.length % 2 === 1 ? "0" + text : text)

      return data
    },
    decode: (bytes: Uint8Array): bigint => {
      return BigInt("0x" + bytes.toHex())
    }
  }

  imports["storage"] = {
    set: (key: Uint8Array, value: Uint8Array): void => {
      stored = value
    },
    get: (key: Uint8Array): Uint8Array | null => {
      return stored
    }
  }

  const instance = await WebAssembly.instantiate(module, imports)

  // @ts-ignore: ignore
  instance.exports.add()
}


self.addEventListener("message", async (event) => {
  try {
    const request = event.data as RpcRequestInit

    if (request.method === "execute") {
      const start = performance.now()
      const until = start + 1000

      let count = 0

      for (; performance.now() < until; count++)
        await execute()

      const response = new RpcOk(request.id, count)

      self.postMessage(response)
      return
    }

    throw new RpcMethodNotFoundError()
  } catch (e: unknown) {
    const request = event.data as RpcRequestInit

    const error = RpcError.rewrap(e)

    const response = new RpcErr(request.id, error)

    self.postMessage(response)
  }
})