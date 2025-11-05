import { RpcMethodNotFoundError, type RpcRequestPreinit } from "@hazae41/jsonrpc";

declare const self: DedicatedWorkerGlobalScope;

self.addEventListener("message", async (event: MessageEvent<RpcRequestPreinit & { result: Int32Array<SharedArrayBuffer> }>) => {
  try {
    const { method, params, result } = event.data

    if (method === "ping") {
      result[0] = 1
      result[1] = 1

      Atomics.notify(result, 0)

      return
    }

    if (method === "ed25519_verify") {
      const [pubkeyAsBytes, signatureAsBytes, payloadAsBytes] = params as [Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>]

      const pubkeyAsRef = await crypto.subtle.importKey("raw", pubkeyAsBytes, "Ed25519", true, ["verify"])

      const verified = await crypto.subtle.verify("Ed25519", pubkeyAsRef, signatureAsBytes, payloadAsBytes)

      result[0] = 1
      result[1] = verified ? 1 : 0

      Atomics.notify(result, 0)

      return
    }

    throw new RpcMethodNotFoundError()
  } catch (_: unknown) {
    const { result } = event.data

    result[0] = 2

    return
  }
})