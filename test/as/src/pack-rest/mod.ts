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

  // @ts-ignore
  @external("modules", "main")
  export declare function main(): externref

  // @ts-ignore
  @external("modules", "self")
  export declare function self(): externref

}

namespace packs {

  // @ts-ignore
  @external("packs", "create")
  export declare function create2<A, B>(arg0: A, arg1: B): externref

}


namespace dynamic {

  // @ts-ignore
  @external("dynamic", "rest")
  export declare function rest(pack: externref): externref

  // @ts-ignore
  @external("dynamic", "call")
  export declare function call1<A>(module: externref, name: externref, arg0: A): usize

}

export function main(): void {
  const number = dynamic.call1(modules.self(), blobs.save(String.UTF8.encode("test")), dynamic.rest(packs.create2(blobs.save(String.UTF8.encode("hello world")), 42)))

  console.log(`number is ${number}`)
}

export function test(bytes: externref, number: usize): usize {
  console.log(String.UTF8.decode(blobs.load(bytes)))

  return number + 100
}