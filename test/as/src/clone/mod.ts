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
  export declare function create(code: externref, salt: externref): externref

  // @ts-ignore: decorator
  @external("modules", "self")
  export declare function self(): externref

}

namespace sha256 {

  // @ts-ignore: decorator
  @external("sha256", "digest")
  export declare function digest(payload: externref): externref

}

namespace bytes {

  // @ts-ignore: decorator
  @external("bytes", "concat")
  export declare function concat(left: externref, right: externref): externref

  // @ts-ignore: decorator
  @external("bytes", "equals")
  export declare function equals(left: externref, right: externref): bool

  // @ts-ignore: decorator
  @external("bytes", "to_hex")
  export declare function toHex(bytes: externref): externref

  // @ts-ignore: decorator
  @external("bytes", "from_hex")
  export declare function fromHex(hex: externref): externref

}

export function init(message: externref): void {
  if (!bytes.equals(modules.self(), sha256.digest(bytes.concat(sha256.digest(modules.load(modules.self())), sha256.digest(message)))))
    throw new Error("Module integrity check failed")

  console.log(String.UTF8.decode(blobs.load(message)))
}

export function clone(message: externref): externref {
  return modules.create(modules.load(modules.self()), message)
}