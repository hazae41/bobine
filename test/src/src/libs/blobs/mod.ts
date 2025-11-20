export type blobref = externref

export namespace blobs {

  // @ts-ignore: decorator
  @external("blobs", "save")
  export declare function $save(offset: usize, length: usize): blobref

  // @ts-ignore: decorator
  @external("blobs", "size")
  export declare function $size(blob: blobref): usize

  // @ts-ignore: decorator
  @external("blobs", "load")
  export declare function $load(blob: blobref, offset: usize): void

  export function save(buffer: ArrayBuffer): blobref {
    const bytes = Uint8Array.wrap(buffer)

    const reference = $save(bytes.dataStart, bytes.length)

    return reference
  }

  export function load(blob: blobref): ArrayBuffer {
    const bytes = new Uint8Array(<i32>$size(blob))

    $load(blob, bytes.dataStart)

    return bytes.buffer
  }

  // @ts-ignore: decorator
  @external("blobs", "concat")
  export declare function concat(left: blobref, right: blobref): blobref

  // @ts-ignore: decorator
  @external("blobs", "equals")
  export declare function equals(left: blobref, right: blobref): bool

  // @ts-ignore: decorator
  @external("blobs", "to_base16")
  export declare function toBase16(bytes: blobref): blobref

  // @ts-ignore: decorator
  @external("blobs", "from_base16")
  export declare function fromBase16(base16: blobref): blobref

  // @ts-ignore: decorator
  @external("blobs", "to_base64")
  export declare function toBase64(bytes: blobref): blobref

  // @ts-ignore: decorator
  @external("blobs", "from_base64")
  export declare function fromBase64(base64: blobref): blobref

}