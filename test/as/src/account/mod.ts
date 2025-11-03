// @ts-ignore
@external("692315bd342a3c04ce71c9b3aeb95f1f27a3e05cd9401469da71f0f1c1bf5eb9", "login")
declare function login(signature: externref): externref

// @ts-ignore
@external("10cfaa0046a5a0d54fc4818b7cd386ab480e4b0f8234d431979175a7320839f6", "transfer")
declare function transfer(session: externref, amount: usize): void

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

// main.ts

export function main(): void {
  const session = login(sharedMemory.save(String.UTF8.encode("0xDEADBEEF")))

  console.log("Login successful")

  transfer(session, 100)
}