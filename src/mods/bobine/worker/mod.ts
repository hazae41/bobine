import { Nullable } from "@/libs/nullable/mod.ts";
import { RpcRequest, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@hazae41/jsonrpc";

export class RpcWorkerClient {

  constructor(
    readonly worker: Worker
  ) { }

  static async spawn(uuid: string, path: string) {
    const url = new URL(import.meta.resolve("./bin.js"))

    url.searchParams.set("uuid", uuid)

    url.searchParams.set("path", path)

    const worker = new Worker(url, { type: "module" })

    const client = new RpcWorkerClient(worker)

    await client.#request({ id: null, method: "ping" })

    return client
  }

  async setup() {
    return await this.#request<Uint8Array<ArrayBuffer>>({ method: "setup" })
  }

  async create(code: Uint8Array<ArrayBuffer>, salt: Uint8Array<ArrayBuffer>) {
    return await this.#request<string>({ method: "create", params: [code, salt] })
  }

  async execute(module: string, method: string, params: Uint8Array<ArrayBuffer>, target?: Nullable<bigint>) {
    return await this.#request<Uint8Array<ArrayBuffer>>({ method: "execute", params: [module, method, params, target] })
  }

  async simulate(module: string, method: string, params: Uint8Array<ArrayBuffer>, target?: Nullable<bigint>) {
    return await this.#request<Uint8Array<ArrayBuffer>>({ method: "simulate", params: [module, method, params, target] })
  }

  async #request<T>(init: RpcRequestPreinit) {
    const { id = crypto.randomUUID(), method, params } = init

    using stack = new DisposableStack()

    const future = Promise.withResolvers<T>()

    const aborter = new AbortController()
    stack.defer(() => aborter.abort())

    const request = new RpcRequest(id, method, params)

    this.worker.addEventListener("message", (event: MessageEvent<RpcResponseInit<T>>) => {
      const response = RpcResponse.from(event.data)

      if (response.id !== request.id)
        return

      response.inspectSync(future.resolve).inspectErrSync(future.reject)
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