namespace dynamic {

  // @ts-ignore
  @external("dynamic", "call")
  export declare function call1(module: externref, name: externref, arg0: externref): externref

}

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

export function logmeback(module: externref): void {
  dynamic.call1(module, sharedMemory.save(String.UTF8.encode("log")), sharedMemory.save(String.UTF8.encode("Hello from AssemblyScript!")))
}