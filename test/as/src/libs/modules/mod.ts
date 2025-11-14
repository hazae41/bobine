import { blobs } from "../blobs/mod";
import { packs } from "../packs/mod";

export namespace modules {

  // @ts-ignore: decorator
  @external("modules", "load")
  export declare function load(name: blobs.blob): blobs.blob

  // @ts-ignore
  @external("dynamic", "call")
  export declare function call(name: blobs.blob, func: blobs.blob, args: packs.pack): packs.pack

  // @ts-ignore: decorator
  @external("modules", "create")
  export declare function create(code: blobs.blob, salt: blobs.blob): blobs.blob

  // @ts-ignore: decorator
  @external("modules", "self")
  export declare function self(): blobs.blob

}