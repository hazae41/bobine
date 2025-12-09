import "@hazae41/symbol-dispose-polyfill";

import "@hazae41/disposable-stack-polyfill";

import { RpcErr, RpcError, RpcMethodNotFoundError, RpcOk, RpcRequestInit } from "@hazae41/jsonrpc";

self.addEventListener("message", async (event) => {
  try {
    const request = event.data as RpcRequestInit

    if (request.method === "generate") {
      const start = performance.now()
      const until = start + 1000

      let value = 0n

      while (performance.now() < until) {
        const seed = crypto.getRandomValues(new Uint8Array(32))
        const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", seed))

        value += ((2n ** 256n) / BigInt("0x" + hash.toHex()))
      }

      const response = new RpcOk(request.id, value)

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