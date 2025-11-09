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

namespace bytes {

  // @ts-ignore: decorator
  @external("bytes", "to_hex")
  export declare function toHex(bytes: externref): externref

  // @ts-ignore: decorator
  @external("bytes", "from_hex")
  export declare function fromHex(hex: externref): externref

}

namespace dynamic {

  // @ts-ignore
  @external("dynamic", "call")
  export declare function call1<A>(module: externref, name: externref, arg0: A): externref

}

class Library {

  constructor(
    readonly pointer: usize
  ) { }

  static invoke(name: string): Library {
    const module = bytes.fromHex(blobs.save(String.UTF8.encode(name)))
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
  const library = Library.invoke("25fbe28a6ab6dfc0ba3603ae3082fc66ccf05bd473e8ecaded1d966c7692c9ef")

  library.log("hello")
  library.log("world")

  return
}