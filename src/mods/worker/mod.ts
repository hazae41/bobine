import { RpcRequest, RpcResponse, RpcResponseInit } from "@hazae41/jsonrpc";
import { Mutex } from "@hazae41/mutex";

export function spawn(uuid: string, data: string) {
  const url = new URL(import.meta.resolve("./bin.ts"))

  url.searchParams.set("uuid", uuid)

  url.searchParams.set("data", data)

  return new Worker(url, { type: "module" })
}

export async function execute(mutex: Mutex<Worker>, module: string, method: string, params: Uint8Array<ArrayBuffer>, sparks: bigint) {
  using stack = new DisposableStack()

  const future = Promise.withResolvers<Uint8Array<ArrayBuffer>>()

  const aborter = new AbortController()
  stack.defer(() => aborter.abort())

  stack.use(await mutex.lockOrWait())

  mutex.get().addEventListener("message", (event: MessageEvent<RpcResponseInit<Uint8Array<ArrayBuffer>>>) => {
    RpcResponse.from(event.data).inspectSync(future.resolve).inspectErrSync(future.reject)
  }, { signal: aborter.signal })

  mutex.get().addEventListener("error", (event: ErrorEvent) => {
    future.reject(event.error)
  }, { signal: aborter.signal })

  mutex.get().addEventListener("messageerror", (event: MessageEvent) => {
    future.reject(event.data)
  }, { signal: aborter.signal })

  AbortSignal.timeout(1000).addEventListener("abort", (reason) => {
    future.reject(reason)
  }, { signal: aborter.signal })

  mutex.get().postMessage(new RpcRequest(null, "execute", [module, method, params, sparks]))

  return await future.promise
}

export async function simulate(mutex: Mutex<Worker>, module: string, method: string, params: Uint8Array<ArrayBuffer>, sparks: bigint) {
  using stack = new DisposableStack()

  const future = Promise.withResolvers<Uint8Array<ArrayBuffer>>()

  const aborter = new AbortController()
  stack.defer(() => aborter.abort())

  stack.use(await mutex.lockOrWait())

  mutex.get().addEventListener("message", (event: MessageEvent<RpcResponseInit<Uint8Array<ArrayBuffer>>>) => {
    RpcResponse.from(event.data).inspectSync(future.resolve).inspectErrSync(future.reject)
  }, { signal: aborter.signal })

  mutex.get().addEventListener("error", (event: ErrorEvent) => {
    future.reject(event.error)
  }, { signal: aborter.signal })

  mutex.get().addEventListener("messageerror", (event: MessageEvent) => {
    future.reject(event.data)
  }, { signal: aborter.signal })

  AbortSignal.timeout(1000).addEventListener("abort", (reason) => {
    future.reject(reason)
  }, { signal: aborter.signal })

  mutex.get().postMessage(new RpcRequest(null, "simulate", [module, method, params, sparks]))

  return await future.promise
}