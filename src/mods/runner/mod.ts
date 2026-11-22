import { RpcRequest, RpcResponse, RpcResponseInit } from "@hazae41/jsonrpc";

export class Runner {

  constructor(
    readonly worker: Worker
  ) { }

  static spawn(uuid: string, path: string) {
    const url = new URL(import.meta.resolve("./bin.ts"))

    url.searchParams.set("uuid", uuid)

    url.searchParams.set("path", path)

    const worker = new Worker(url, { type: "module" })

    return new Runner(worker)
  }

  async execute(module: string, method: string, params: Uint8Array<ArrayBuffer>, sparks: bigint) {
    using stack = new DisposableStack()

    const future = Promise.withResolvers<Uint8Array<ArrayBuffer>>()

    const aborter = new AbortController()
    stack.defer(() => aborter.abort())

    this.worker.addEventListener("message", (event: MessageEvent<RpcResponseInit<Uint8Array<ArrayBuffer>>>) => {
      RpcResponse.from(event.data).inspectSync(future.resolve).inspectErrSync(future.reject)
    }, { signal: aborter.signal })

    this.worker.addEventListener("error", (event: ErrorEvent) => {
      future.reject(event.error)
    }, { signal: aborter.signal })

    this.worker.addEventListener("messageerror", (event: MessageEvent) => {
      future.reject(event.data)
    }, { signal: aborter.signal })

    AbortSignal.timeout(1000).addEventListener("abort", (reason) => {
      future.reject(reason)
    }, { signal: aborter.signal })

    this.worker.postMessage(new RpcRequest(null, "execute", [module, method, params, sparks]))

    return await future.promise
  }

  async simulate(module: string, method: string, params: Uint8Array<ArrayBuffer>, sparks: bigint) {
    using stack = new DisposableStack()

    const future = Promise.withResolvers<Uint8Array<ArrayBuffer>>()

    const aborter = new AbortController()
    stack.defer(() => aborter.abort())

    this.worker.addEventListener("message", (event: MessageEvent<RpcResponseInit<Uint8Array<ArrayBuffer>>>) => {
      RpcResponse.from(event.data).inspectSync(future.resolve).inspectErrSync(future.reject)
    }, { signal: aborter.signal })

    this.worker.addEventListener("error", (event: ErrorEvent) => {
      future.reject(event.error)
    }, { signal: aborter.signal })

    this.worker.addEventListener("messageerror", (event: MessageEvent) => {
      future.reject(event.data)
    }, { signal: aborter.signal })

    AbortSignal.timeout(1000).addEventListener("abort", (reason) => {
      future.reject(reason)
    }, { signal: aborter.signal })

    this.worker.postMessage(new RpcRequest(null, "simulate", [module, method, params, sparks]))

    return await future.promise
  }

}