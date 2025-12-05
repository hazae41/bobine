import { blobref } from "../blobs/mod";

export type bigintref = externref

export namespace bigints {

  // @ts-ignore: decorator
  @external("bigints", "zero")
  export declare function zero(): bigintref

  // @ts-ignore: decorator
  @external("bigints", "one")
  export declare function one(): bigintref

  // @ts-ignore: decorator
  @external("bigints", "two")
  export declare function two(): bigintref

  // @ts-ignore: decorator
  @external("bigints", "three")
  export declare function three(): bigintref

  // @ts-ignore: decorator
  @external("bigints", "four")
  export declare function four(): bigintref

  // @ts-ignore: decorator
  @external("bigints", "five")
  export declare function five(): bigintref

  // @ts-ignore: decorator
  @external("bigints", "six")
  export declare function six(): bigintref

  // @ts-ignore: decorator
  @external("bigints", "seven")
  export declare function seven(): bigintref

  // @ts-ignore: decorator
  @external("bigints", "eight")
  export declare function eight(): bigintref

  // @ts-ignore: decorator
  @external("bigints", "nine")
  export declare function nine(): bigintref

  // @ts-ignore: decorator
  @external("bigints", "ten")
  export declare function ten(): bigintref

  // @ts-ignore: decorator
  @external("bigints", "inc")
  export declare function inc(value: bigintref): bigintref

  // @ts-ignore: decorator
  @external("bigints", "dec")
  export declare function dec(value: bigintref): bigintref

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
  @external("bigints", "encode")
  export declare function encode(bigint: bigintref): blobref

  // @ts-ignore: decorator
  @external("bigints", "decode")
  export declare function decode(blob: blobref): bigintref

  // @ts-ignore: decorator
  @external("bigints", "to_base16")
  export declare function toBase16(bigint: bigintref): blobref

  // @ts-ignore: decorator
  @external("bigints", "from_base16")
  export declare function fromBase16(base16: blobref): bigintref

  // @ts-ignore: decorator
  @external("bigints", "to_base10")
  export declare function toBase10(bigint: bigintref): blobref

  // @ts-ignore: decorator
  @external("bigints", "from_base10")
  export declare function fromBase10(base10: blobref): bigintref

}