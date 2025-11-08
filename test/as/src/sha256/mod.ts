namespace blobs {

  // @ts-ignore: decorator
  @external("shared_memory", "save")
  export declare function $save(offset: usize, length: usize): externref

  // @ts-ignore: decorator
  @external("shared_memory", "size")
  export declare function $size(reference: externref): usize

  // @ts-ignore: decorator
  @external("shared_memory", "load")
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

namespace console {

  // @ts-ignore: decorator
  @external("console", "log")
  export declare function $log(message: externref): void

  export function log(message: string): void {
    $log(blobs.save(String.UTF8.encode(message)))
  }

}

namespace bytes {

  // @ts-ignore: decorator
  @external("bytes", "to_hex")
  export declare function toHex(bytes: externref): externref

  // @ts-ignore: decorator
  @external("bytes", "from_hex")
  export declare function fromHex(hex: externref): externref

}


namespace sha256 {

  // @ts-ignore: decorator
  @external("sha256", "digest")
  export declare function digest(payload: externref): externref

}

export function main(): void {
  const data = blobs.save(String.UTF8.encode("hello world"))
  const hash = sha256.digest(data)

  console.$log(bytes.toHex(hash))
}