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

namespace console {

  // @ts-ignore: decorator
  @external("console", "log")
  export declare function $log(message: externref): void

  export function log(message: string): void {
    $log(blobs.save(String.UTF8.encode(message)))
  }

}

namespace packs {

  // @ts-ignore
  @external("packs", "create")
  export declare function create2<A, B>(arg0: A, arg1: B): externref

  // @ts-ignore
  @external("packs", "get")
  export declare function get<T>(pack: externref, index: usize): T

}

export function test(): externref {
  return packs.create2(blobs.save(String.UTF8.encode("hello world")), 42)
}

export function main(): void {
  const pack = test()

  const bytes = packs.get<externref>(pack, 0)
  const value = packs.get<usize>(pack, 1)

  console.log(String.UTF8.decode(blobs.load(bytes)))
  console.log(value.toString())
}