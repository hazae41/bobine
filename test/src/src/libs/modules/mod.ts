import { blobs } from "../blobs/mod";
import { packs } from "../packs/mod";

export namespace modules {

  // @ts-ignore: decorator
  @external("modules", "load")
  export declare function load(module: blobs.blob): blobs.blob

  // @ts-ignore
  @external("modules", "call")
  export declare function call(module: blobs.blob, method: blobs.blob, params: packs.pack): packs.pack

  // @ts-ignore: decorator
  @external("modules", "create")
  export declare function create(code: blobs.blob, salt: blobs.blob): blobs.blob

  // @ts-ignore: decorator
  @external("modules", "self")
  export declare function self(): blobs.blob

}