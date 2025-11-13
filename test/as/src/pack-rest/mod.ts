namespace blobs {

  export type blob = externref

  // @ts-ignore: decorator
  @external("blobs", "save")
  export declare function $save(offset: usize, length: usize): blob

  // @ts-ignore: decorator
  @external("blobs", "size")
  export declare function $size(blob: blob): usize

  // @ts-ignore: decorator
  @external("blobs", "load")
  export declare function $load(blob: blob, offset: usize): void

  export function save(buffer: ArrayBuffer): blob {
    const bytes = Uint8Array.wrap(buffer)

    const reference = $save(bytes.dataStart, bytes.length)

    return reference
  }

  export function load(blob: blob): ArrayBuffer {
    const bytes = new Uint8Array(<i32>$size(blob))

    $load(blob, bytes.dataStart)

    return bytes.buffer
  }

}

namespace packs {

  export type pack = externref

  // @ts-ignore
  @external("packs", "decode")
  export declare function decode(blob: blobs.blob): externref

  // @ts-ignore
  @external("packs", "encode")
  export declare function encode(pack: packs.pack): blobs.blob

  // @ts-ignore
  @external("packs", "create")
  export declare function create1<A>(arg0: A): packs.pack

  // @ts-ignore
  @external("packs", "create")
  export declare function create2<A, B>(arg0: A, arg1: B): packs.pack

  // @ts-ignore
  @external("packs", "create")
  export declare function create3<A, B, C>(arg0: A, arg1: B, arg2: C): packs.pack

  // @ts-ignore
  @external("packs", "create")
  export declare function create4<A, B, C, D>(arg0: A, arg1: B, arg2: C, arg3: D): packs.pack

  // @ts-ignore
  @external("packs", "get")
  export declare function get<T>(pack: packs.pack, index: usize): T

}

namespace dynamic {

  // @ts-ignore
  @external("dynamic", "rest")
  export declare function rest(pack: packs.pack): externref

  // @ts-ignore
  @external("dynamic", "call")
  export declare function call1<A>(module: blobs.blob, name: blobs.blob, arg0: A): packs.pack

  // @ts-ignore
  @external("dynamic", "call")
  export declare function call2<A, B>(module: blobs.blob, name: blobs.blob, arg0: A, arg1: B): packs.pack

  // @ts-ignore
  @external("dynamic", "call")
  export declare function call3<A, B, C>(module: blobs.blob, name: blobs.blob, arg0: A, arg1: B, arg2: C): packs.pack

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
  export declare function load(name: blobs.blob): blobs.blob

  // @ts-ignore: decorator
  @external("modules", "create")
  export declare function create(code: blobs.blob, salt: blobs.blob): blobs.blob

  // @ts-ignore: decorator
  @external("modules", "self")
  export declare function self(): blobs.blob

}

export function main(): void {
  const number = packs.get<usize>(dynamic.call1(modules.self(), blobs.save(String.UTF8.encode("test")), dynamic.rest(packs.create2(blobs.save(String.UTF8.encode("hello world")), 42))), 0)

  console.log(`number is ${number}`)
}

export function test(bytes: externref, number: usize): usize {
  console.log(String.UTF8.decode(blobs.load(bytes)))

  return number + 100
}