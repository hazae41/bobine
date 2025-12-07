import { blobref } from "../blobs/mod";

export type packref = externref

export namespace packs {

  // @ts-ignore
  @external("packs", "decode")
  export declare function decode(blob: blobref): packref

  // @ts-ignore
  @external("packs", "encode")
  export declare function encode(pack: packref): blobref

  // @ts-ignore
  @external("packs", "concat")
  export declare function concat(left: packref, right: packref): packref

  // @ts-ignore
  @external("packs", "create")
  export declare function create1<A>(arg0: A): packref

  // @ts-ignore
  @external("packs", "create")
  export declare function create2<A, B>(arg0: A, arg1: B): packref

  // @ts-ignore
  @external("packs", "create")
  export declare function create3<A, B, C>(arg0: A, arg1: B, arg2: C): packref

  // @ts-ignore
  @external("packs", "create")
  export declare function create4<A, B, C, D>(arg0: A, arg1: B, arg2: C, arg3: D): packref

  // @ts-ignore
  @external("packs", "create")
  export declare function create5<A, B, C, D, E>(arg0: A, arg1: B, arg2: C, arg3: D, arg4: E): packref

  // @ts-ignore
  @external("packs", "create")
  export declare function create6<A, B, C, D, E, F>(arg0: A, arg1: B, arg2: C, arg3: D, arg4: E, arg5: F): packref

  // @ts-ignore
  @external("packs", "create")
  export declare function create7<A, B, C, D, E, F, G>(arg0: A, arg1: B, arg2: C, arg3: D, arg4: E, arg5: F, arg6: G): packref

  // @ts-ignore
  @external("packs", "create")
  export declare function create8<A, B, C, D, E, F, G, H>(arg0: A, arg1: B, arg2: C, arg3: D, arg4: E, arg5: F, arg6: G, arg7: H): packref

  // @ts-ignore
  @external("packs", "create")
  export declare function create9<A, B, C, D, E, F, G, H, I>(arg0: A, arg1: B, arg2: C, arg3: D, arg4: E, arg5: F, arg6: G, arg7: H, arg8: I): packref

  // @ts-ignore: decorator
  @external("packs", "length")
  export declare function length(pack: packref): usize

  // @ts-ignore
  @external("packs", "get")
  export declare function get<T>(pack: packref, index: usize): T

}