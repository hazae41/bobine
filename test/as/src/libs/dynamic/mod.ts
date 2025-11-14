import { blobs } from "../blobs/mod";
import { packs } from "../packs/mod";

export namespace dynamic {

  // @ts-ignore
  @external("dynamic", "rest")
  export declare function rest(pack: packs.pack): externref

  // @ts-ignore
  @external("dynamic", "call")
  export declare function call(module: blobs.blob, name: blobs.blob, args: packs.pack): packs.pack

}