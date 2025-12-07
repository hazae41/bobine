import { blobref } from "../blobs/mod";

export namespace storage {

  // @ts-ignore: decorator
  @external("storage", "get")
  export declare function get(key: blobref): blobref;

  // @ts-ignore: decorator
  @external("storage", "set")
  export declare function set(key: blobref, value: blobref): void;

}