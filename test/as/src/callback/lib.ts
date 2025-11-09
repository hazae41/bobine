namespace dynamic {

  // @ts-ignore
  @external("dynamic", "call")
  export declare function call1<A>(module: externref, name: externref, arg0: A): externref

}

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

export function logmeback(module: externref): void {
  dynamic.call1(module, blobs.save(String.UTF8.encode("log")), blobs.save(String.UTF8.encode("Hello from AssemblyScript!")))
}