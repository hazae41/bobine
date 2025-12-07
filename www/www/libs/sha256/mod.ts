import { blobref } from "../blobs/mod";

export namespace sha256 {

  // @ts-ignore: decorator
  @external("sha256", "digest")
  export declare function digest(payload: blobref): blobref

}