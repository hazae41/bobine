import { blobs } from "../blobs/mod";

export namespace storage {

  // @ts-ignore: decorator
  @external("storage", "get")
  export declare function get(key: externref): blobs.blob;

  // @ts-ignore: decorator
  @external("storage", "set")
  export declare function set(key: blobs.blob, value: blobs.blob): void;

}