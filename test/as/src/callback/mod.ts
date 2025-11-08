// @ts-ignore
@external("5feeee846376f6436990aa2757bc67fbc4498bcc9993b647788e273ad6fde474", "logmeback")
declare function logmeback(module: externref): void

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
  declare function $log(message: externref): void

  export function log(message: string): void {
    $log(blobs.save(String.UTF8.encode(message)))
  }

}

namespace modules {

  // @ts-ignore
  @external("modules", "main")
  export declare function main(): externref

  // @ts-ignore
  @external("modules", "self")
  export declare function self(): externref

  // @ts-ignore
  @external("modules", "load")
  export declare function $load(module: externref): void

  export function load(module: string): externref {
    const shared = blobs.save(String.UTF8.encode(module))

    $load(shared)

    return shared
  }

}

export function main(): void {
  logmeback(modules.self())
}

export function log(message: externref): void {
  console.log(String.UTF8.decode(blobs.load(message)));
}