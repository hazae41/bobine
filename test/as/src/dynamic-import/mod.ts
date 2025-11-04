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

class Library {

  constructor(
    readonly pointer: usize
  ) { }

  static invoke(name: string): Library {
    const module = modules.invoke(name)
    const pointer = symbols.numerize(module)

    return new Library(pointer)
  }

  log(message: string): void {
    const module = symbols.denumerize(this.pointer)
    const buffer = sharedMemory.save(String.UTF8.encode(message))

    Library.log(module, buffer)
  }

}

namespace Library {

  // @ts-ignore
  @external("dynamic_functions", "log")
  export declare function log(module: externref, message: externref): void

}

export function main(): void {
  const library = Library.invoke("933f18d8b86a6e14fb4f7290a1e4c502b1b67626915e262aec37eec0a6d40012")

  library.log("Hello from AssemblyScript!")
}