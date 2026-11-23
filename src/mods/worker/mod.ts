import { Runner } from "@/mods/runner/mod.ts";
import { RpcErr, RpcError, RpcMethodNotFoundError, RpcOk, RpcRequestInit, RpcRequestPreinit, RpcResponse, RpcResponseInit } from "@hazae41/jsonrpc";
import { Database } from "@tursodatabase/database";

export class RpcWorkerServer {

  readonly runner: Runner

  constructor(
    readonly uuid: string,
    readonly path: string,
    readonly data: Database
  ) {
    this.runner = new Runner(uuid, path, data)
  }

  async respond(request: RpcRequestInit) {
    try {
      return new RpcOk(request.id, await this.#route(request))
    } catch (cause: unknown) {
      return new RpcErr(request.id, RpcError.rewrap(cause))
    }
  }

  async #route(request: RpcRequestInit) {
    if (request.method === "setup") {
      const _ = request.params

      await this.runner.setup()

      return
    }

    if (request.method === "create") {
      const [code, salt] = request.params as [Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>]

      const pack = await this.runner.create(code, salt)

      return pack
    }

    if (request.method === "execute") {
      const [module, method, params, target] = request.params as [string, string, Uint8Array<ArrayBuffer>, bigint]

      const proof = await this.runner.execute(module, method, params, target)

      return proof
    }

    if (request.method === "simulate") {
      const [module, method, params, target] = request.params as [string, string, Uint8Array<ArrayBuffer>, bigint]

      const proof = await this.runner.simulate(module, method, params, target)

      return proof
    }

    throw new RpcMethodNotFoundError()
  }

}

export class RpcWorkerClient {

  constructor(
    readonly worker: Worker
  ) { }

  static spawn(uuid: string, path: string) {
    const url = new URL(import.meta.resolve("./bin.ts"))

    url.searchParams.set("uuid", uuid)

    url.searchParams.set("path", path)

    const worker = new Worker(url, { type: "module" })

    return new RpcWorkerClient(worker)
  }

  async setup() {
    return await this.#request<Uint8Array<ArrayBuffer>>({ method: "setup" })
  }

  async create(code: Uint8Array<ArrayBuffer>, salt: Uint8Array<ArrayBuffer>) {
    return await this.#request<string>({ method: "create", params: [code, salt] })
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