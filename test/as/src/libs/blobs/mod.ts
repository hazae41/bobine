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

}