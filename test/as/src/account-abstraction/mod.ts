namespace ed25519 {

  export const name = "b4efb79b0eac81ff82c3dd5386ae576423603d0e2334cf6688af6210ed5c1bdb"

  // @ts-ignore
  @external("b4efb79b0eac81ff82c3dd5386ae576423603d0e2334cf6688af6210ed5c1bdb", "login")
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

// main.ts

export function main(pubkey: externref, signature: externref, target: externref, amount: u64): void {
  const module = sharedMemory.save(String.UTF8.encode(ed25519.name))
  token.transfer(module, ed25519.login(pubkey, signature), target, amount)
}