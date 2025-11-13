import { blobs } from "../blobs/mod";

export namespace packs {

  export type pack = externref

  // @ts-ignore
  @external("packs", "decode")
  export declare function decode(blob: blobs.blob): externref

  // @ts-ignore
  @external("packs", "encode")
  export declare function encode(pack: packs.pack): blobs.blob

  // @ts-ignore
  @external("packs", "create")
  export declare function create1<A>(arg0: A): packs.pack

  // @ts-ignore
  @external("packs", "create")
  export declare function create2<A, B>(arg0: A, arg1: B): packs.pack

  // @ts-ignore
  @external("packs", "create")
  export declare function create3<A, B, C>(arg0: A, arg1: B, arg2: C): packs.pack

  // @ts-ignore
  @external("packs", "create")
  export declare function create4<A, B, C, D>(arg0: A, arg1: B, arg2: C, arg3: D): packs.pack

  // @ts-ignore
  @external("packs", "create")
  export declare function create5<A, B, C, D, E>(arg0: A, arg1: B, arg2: C, arg3: D, arg4: E): packs.pack

  // @ts-ignore
  @external("packs", "create")
  export declare function create6<A, B, C, D, E, F>(arg0: A, arg1: B, arg2: C, arg3: D, arg4: E, arg5: F): packs.pack

  // @ts-ignore
  @external("packs", "get")
  export declare function get<T>(pack: packs.pack, index: usize): T

}