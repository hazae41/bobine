// @ts-ignore
@external("473dc9c2c978e577a0f0b119f13404e80dafd9f7883c010fa494faa43849d4ad", "logmeback")
declare function logmeback(module: externref): void

namespace console {

  // @ts-ignore: decorator
  @external("console", "log")
  declare function $log(pointer: usize, length: usize): void

  export function log(message: string): void {
    const buffer = String.UTF8.encode(message)

    const bytes = Uint8Array.wrap(buffer)

    $log(bytes.dataStart, bytes.length)
  }

}

namespace modules {

  // @ts-ignore
  @external("modules", "self")
  export declare function self(): externref

  // @ts-ignore
  @external("modules", "invoke")
  export declare function $invoke(offset: usize, length: usize): externref

  export function invoke(module: string): externref {
    const buffer = String.UTF8.encode(module)

    const bytes = Uint8Array.wrap(buffer)

    return $invoke(bytes.dataStart, bytes.length)
  }

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

export function main(): void {
  logmeback(modules.self())
}

export function log(message: externref): void {
  console.log(String.UTF8.decode(sharedMemory.load(message)));
}