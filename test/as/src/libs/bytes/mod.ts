import { blobs } from "../blobs/mod";

export namespace bytes {

  // @ts-ignore: decorator
  @external("bytes", "concat")
  export declare function concat(left: blobs.blob, right: blobs.blob): externref

  // @ts-ignore: decorator
  @external("bytes", "equals")
  export declare function equals(left: blobs.blob, right: blobs.blob): bool

  // @ts-ignore: decorator
  @external("bytes", "to_hex")
  export declare function toHex(bytes: blobs.blob): blobs.blob

  // @ts-ignore: decorator
  @external("bytes", "from_hex")
  export declare function fromHex(hex: blobs.blob): blobs.blob

}