import { blobs } from "../blobs/mod";
import { packs } from "../packs/mod";

export namespace dynamic {

  // @ts-ignore
  @external("dynamic", "rest")
  export declare function rest(pack: packs.pack): externref

  // @ts-ignore
  @external("dynamic", "call")
  export declare function call1<A>(module: blobs.blob, name: blobs.blob, arg0: A): packs.pack

  // @ts-ignore
  @external("dynamic", "call")
  export declare function call2<A, B>(module: blobs.blob, name: blobs.blob, arg0: A, arg1: B): packs.pack

  // @ts-ignore
  @external("dynamic", "call")
  export declare function call3<A, B, C>(module: blobs.blob, name: blobs.blob, arg0: A, arg1: B, arg2: C): packs.pack

  // @ts-ignore
  @external("dynamic", "call")
  export declare function call4<A, B, C, D>(module: blobs.blob, name: blobs.blob, arg0: A, arg1: B, arg2: C, arg3: D): packs.pack

  // @ts-ignore
  @external("dynamic", "call")
  export declare function call5<A, B, C, D, E>(module: blobs.blob, name: blobs.blob, arg0: A, arg1: B, arg2: C, arg3: D, arg4: E): packs.pack

  // @ts-ignore
  @external("dynamic", "call")
  export declare function call6<A, B, C, D, E, F>(module: blobs.blob, name: blobs.blob, arg0: A, arg1: B, arg2: C, arg3: D, arg4: E, arg5: F): packs.pack

}