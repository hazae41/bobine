// @ts-ignore
@external("933f18d8b86a6e14fb4f7290a1e4c502b1b67626915e262aec37eec0a6d40012", "log")
declare function lib_log(message: externref): void

namespace sharedMemory {

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

export function main(): void {
  lib_log(sharedMemory.save(String.UTF8.encode("Hello from AssemblyScript!")));
}