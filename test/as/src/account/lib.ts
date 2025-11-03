namespace symbols {

  // @ts-ignore
  @external("symbols", "create")
  export declare function create(): externref

  // @ts-ignore
  @external("symbols", "compare")
  export declare function compare(left: externref, right: externref): boolean

  // @ts-ignore
  @external("symbols", "save")
  export declare function save(value: externref): usize

  // @ts-ignore
  @external("symbols", "load")
  export declare function load(index: usize): externref

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

// account.ts

export function login(signature: externref): externref {
  const text = String.UTF8.decode(sharedMemory.load(signature))

  if (text !== "0xDEADBEEF")
    throw new Error("Invalid signature")

  const session = symbols.create()

  symbols.save(session)

  return session
}

export function verify(session: externref): boolean {
  return symbols.compare(session, symbols.load(0))
}