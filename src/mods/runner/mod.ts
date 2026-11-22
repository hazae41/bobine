import { RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@hazae41/jsonrpc";

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
    return await this.#request<Uint8Array<ArrayBuffer>>({ method: "execute", params: [module, method, params, sparks] })
  }

  async simulate(module: string, method: string, params: Uint8Array<ArrayBuffer>, sparks: bigint) {
    return await this.#request<Uint8Array<ArrayBuffer>>({ method: "simulate", params: [module, method, params, sparks] })
  }

  async #request<T>(request: RpcRequestPreinit) {
    using stack = new DisposableStack()

    const future = Promise.withResolvers<T>()

    const aborter = new AbortController()
    stack.defer(() => aborter.abort())

    this.worker.addEventListener("message", (event: MessageEvent<RpcResponseInit<T>>) => {
      RpcResponse.from(event.data).inspectSync(future.resolve).inspectErrSync(future.reject)
    }, { signal: aborter.signal })

    this.worker.addEventListener("error", (event: ErrorEvent) => {
      future.reject(event.error)
    }, { signal: aborter.signal })

    this.worker.addEventListener("messageerror", (event: MessageEvent) => {
      future.reject(event.data)
    }, { signal: aborter.signal })

    this.worker.postMessage(request)

    return await future.promise
  }

}