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

namespace modules {

  // @ts-ignore: decorator
  @external("modules", "load")
  export declare function load(name: externref): externref

  // @ts-ignore: decorator
  @external("modules", "create")
  export declare function create1<T>(code: externref, func: externref, arg0: T): void

  // @ts-ignore: decorator
  @external("modules", "self")
  export declare function self(): externref

}

export function main(message: externref): void {
  console.log(String.UTF8.decode(blobs.load(message)))
}

export function clone(message: externref): void {
  modules.create1(modules.load(modules.self()), blobs.save(String.UTF8.encode("main")), message)
}