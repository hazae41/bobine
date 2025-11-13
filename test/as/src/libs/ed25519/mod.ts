import { blobs } from "../blobs/mod";

export namespace ed25519 {

  // @ts-ignore: decorator
  @external("ed25519", "verify")
  export declare function verify(pubkey: blobs.blob, signature: blobs.blob, payload: blobs.blob): boolean

}