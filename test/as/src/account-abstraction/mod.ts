namespace ed25519 {

  export const name = "9dc9d76c564647d594d980481156129875a7a416dba79e68e3dd75096c70aa2d"

  // @ts-ignore
  @external("9dc9d76c564647d594d980481156129875a7a416dba79e68e3dd75096c70aa2d", "login")
  export declare function login(pubkey: externref, signature: externref): externref

}

namespace token {

  // @ts-ignore
  @external("e1d6bb98cbee21e879710f6a60b95d78c857d1289a62fd86b25bd814a40e503d", "transfer")
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
  export declare function $log(message: externref): void

  export function log(message: string): void {
    $log(sharedMemory.save(String.UTF8.encode(message)))
  }

}

// main.ts

export function main(pubkey: externref, signature: externref, target: externref, amount: u64): void {
  const module = sharedMemory.save(String.UTF8.encode(ed25519.name))
  const session = ed25519.login(pubkey, signature)
  token.transfer(module, session, target, amount)
}