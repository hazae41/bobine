export namespace blobs {

  export type blob = externref

  // @ts-ignore: decorator
  @external("blobs", "save")
  export declare function $save(offset: usize, length: usize): blobs.blob

  // @ts-ignore: decorator
  @external("blobs", "size")
  export declare function $size(blob: blobs.blob): usize

  // @ts-ignore: decorator
  @external("blobs", "load")
  export declare function $load(blob: blobs.blob, offset: usize): void

  export function save(buffer: ArrayBuffer): blob {
    const bytes = Uint8Array.wrap(buffer)

    const reference = $save(bytes.dataStart, bytes.length)

    return reference
  }

  export function load(blob: blobs.blob): ArrayBuffer {
    const bytes = new Uint8Array(<i32>$size(blob))

    $load(blob, bytes.dataStart)

    return bytes.buffer
  }

  // @ts-ignore: decorator
  @external("blobs", "concat")
  export declare function concat(left: blobs.blob, right: blobs.blob): externref

  // @ts-ignore: decorator
  @external("blobs", "equals")
  export declare function equals(left: blobs.blob, right: blobs.blob): bool

  // @ts-ignore: decorator
  @external("blobs", "to_hex")
  export declare function toHex(bytes: blobs.blob): blobs.blob

  // @ts-ignore: decorator
  @external("blobs", "from_hex")
  export declare function fromHex(hex: blobs.blob): blobs.blob

  // @ts-ignore: decorator
  @external("blobs", "to_base64")
  export declare function toBase64(bytes: blobs.blob): blobs.blob

  // @ts-ignore: decorator
  @external("blobs", "from_base64")
  export declare function fromBase64(hex: blobs.blob): blobs.blob

}