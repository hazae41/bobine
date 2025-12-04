import { blobref } from "../blobs/mod";
import { packref } from "../packs/mod";

export namespace modules {

  // @ts-ignore: decorator
  @external("modules", "load")
  export declare function load(module: blobref): blobref

  // @ts-ignore
  @external("modules", "call")
  export declare function call(module: blobref, method: blobref, params: packref): packref

  // @ts-ignore: decorator
  @external("modules", "create")
  export declare function create(code: blobref, salt: blobref): blobref

  // @ts-ignore: decorator
  @external("modules", "self")
  export declare function self(): blobref

}