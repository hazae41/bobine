import { blobref } from "../blobs/mod";

export type bigintref = externref

export namespace bigints {

  // @ts-ignore: decorator
  @external("bigints", "add")
  export declare function add(left: bigintref, right: bigintref): bigintref

  // @ts-ignore: decorator
  @external("bigints", "sub")
  export declare function sub(left: bigintref, right: bigintref): bigintref

  // @ts-ignore: decorator
  @external("bigints", "mul")
  export declare function mul(left: bigintref, right: bigintref): bigintref

  // @ts-ignore: decorator
  @external("bigints", "div")
  export declare function div(left: bigintref, right: bigintref): bigintref

  // @ts-ignore: decorator
  @external("bigints", "pow")
  export declare function pow(left: bigintref, right: bigintref): bigintref

  // @ts-ignore: decorator
  @external("bigints", "from_base16")
  export declare function fromBase16(base16: blobref): bigintref

  // @ts-ignore: decorator
  @external("bigints", "to_base16")
  export declare function toBase16(bigint: bigintref): blobref

  // @ts-ignore: decorator
  @external("bigints", "from_base10")
  export declare function fromBase10(base10: blobref): bigintref

  // @ts-ignore: decorator
  @external("bigints", "to_base10")
  export declare function toBase10(bigint: bigintref): blobref

}