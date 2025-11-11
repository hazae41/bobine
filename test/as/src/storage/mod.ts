namespace blobs {

  // @ts-ignore: decorator
  @external("blobs", "save")
  export declare function $save(offset: usize, length: usize): externref

  // @ts-ignore: decorator
  @external("blobs", "size")
  export declare function $size(reference: externref): usize

  // @ts-ignore: decorator
  @external("blobs", "load")
  export declare function $load(reference: externref, offset: usize): void

  export function save(buffer: ArrayBuffer): externref {
    const bytes = Uint8Array.wrap(buffer)

    const reference = $save(bytes.dataStart, bytes.length)

    return reference
  }

  export function load(reference: externref): ArrayBuffer {
    const bytes = new Uint8Array(<i32>$size(reference))

    $load(reference, bytes.dataStart)

    return bytes.buffer
  }

}

namespace storage {

  // @ts-ignore: decorator
  @external("storage", "get")
  export declare function get(key: externref): externref;

  // @ts-ignore: decorator
  @external("storage", "set")
  export declare function set(key: externref, value: externref): void;

}

export function set(): void {
  storage.set(blobs.save(String.UTF8.encode("greeting")), blobs.save(String.UTF8.encode("Hello, World!")))
}

export function get(): externref {
  return storage.get(blobs.save(String.UTF8.encode("greeting")))
}