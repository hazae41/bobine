import { RpcError } from "@hazae41/jsonrpc";

export class RpcPaymentError extends RpcError {
  readonly #class = RpcPaymentError
  readonly name = this.#class.name

  static readonly code = -32002
  static readonly message = "Payment required"

  constructor(message = RpcPaymentError.message) {
    super(RpcPaymentError.code, message)
  }

}