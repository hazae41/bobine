namespace ed25519 {

  export const name = "4d4dea45fb4e05a05480f7da6946533901d5becaed1bef24bde638195e3e69bc"

  // @ts-ignore
  @external("4d4dea45fb4e05a05480f7da6946533901d5becaed1bef24bde638195e3e69bc", "login")
  export declare function login(pubkey: externref, signature: externref): externref

}

namespace token {

  // @ts-ignore
  @external("18f89208ebfcf3deca9b3a1ddb3f3da25ee4630906a6e7bb032eb15b4796ce0a", "transfer")
  export declare function transfer(module: externref, session: externref, target: externref, amount: u64): void

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

namespace console {

  // @ts-ignore: decorator
  @external("console", "log")
  declare function $log(message: externref): void

  export function log(message: string): void {
    $log(sharedMemory.save(String.UTF8.encode(message)))
  }

}

// main.ts

export function main(): void {
  const module = sharedMemory.save(String.UTF8.encode(ed25519.name))

  const pubkey = sharedMemory.save(String.UTF8.encode("0xCAFEBABE"))
  const signature = sharedMemory.save(String.UTF8.encode("0xDEADBEEF"))

  const target = sharedMemory.save(String.UTF8.encode("0xFEEDBEEF"))

  const session = ed25519.login(pubkey, signature)

  console.log("Login successful")

  token.transfer(module, session, target, 10)
}