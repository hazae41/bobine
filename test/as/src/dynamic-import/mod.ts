namespace symbols {

  // @ts-ignore
  @external("symbols", "create")
  export declare function create(): externref

  // @ts-ignore
  @external("symbols", "numerize")
  export declare function numerize(symbol: externref): usize

  // @ts-ignore
  @external("symbols", "denumerize")
  export declare function denumerize(index: usize): externref

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

namespace dynamic {

  // @ts-ignore
  @external("dynamic", "call")
  export declare function call1(module: externref, name: externref, arg0: externref): externref

}

class Library {

  constructor(
    readonly pointer: usize
  ) { }

  static invoke(name: string): Library {
    const module = modules.load(name)
    const pointer = symbols.numerize(module)

    return new Library(pointer)
  }

  log(message: string): void {
    const module = symbols.denumerize(this.pointer)
    const buffer = blobs.save(String.UTF8.encode(message))

    dynamic.call1(module, blobs.save(String.UTF8.encode("log")), buffer)
  }

}

export function main(): void {
  const library = Library.invoke("80862d2e7f92a1e8405a7c07e23cabd49d34d9a80a3204830f336efe352e1174")

  library.log("hello")
  library.log("world")

  return
}