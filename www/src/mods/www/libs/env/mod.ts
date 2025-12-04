import { blobref } from "../blobs/mod";

export namespace env {

  // @ts-ignore: decorator
  @external("env", "mode")
  export declare const mode: usize

  // @ts-ignore: decorator
  @external("env", "uuid")
  export declare function uuid(): blobref

  // @ts-ignore: decorator
  @external("env", "test")
  export declare function test(x: blobref): void

}