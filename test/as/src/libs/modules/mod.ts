import { blobs } from "../blobs/mod";

export namespace modules {

  // @ts-ignore: decorator
  @external("modules", "load")
  export declare function load(name: blobs.blob): blobs.blob

  // @ts-ignore: decorator
  @external("modules", "create")
  export declare function create(code: blobs.blob, salt: blobs.blob): blobs.blob

  // @ts-ignore: decorator
  @external("modules", "self")
  export declare function self(): blobs.blob

}