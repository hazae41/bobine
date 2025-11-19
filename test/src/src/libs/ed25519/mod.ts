import { blobref } from "../blobs/mod";

export namespace ed25519 {

  // @ts-ignore: decorator
  @external("ed25519", "verify")
  export declare function verify(pubkey: blobref, signature: blobref, payload: blobref): boolean

}