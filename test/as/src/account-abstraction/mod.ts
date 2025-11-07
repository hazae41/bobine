namespace ed25519 {

  export const name = "d3899b25520d395912b10e80891627e0c8efa9602597d65d3e27cfdf679706c0"

  // @ts-ignore
  @external("d3899b25520d395912b10e80891627e0c8efa9602597d65d3e27cfdf679706c0", "login")
  export declare function login(pubkey: externref, payload: externref, signature: externref): externref

}

namespace token {

  // @ts-ignore
  @external("f93a0c6f4013956d22bc809942dc117c2bc33addc4e22807f83c891ddd0dd8c7", "transfer")
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

export function main(module: externref, session: externref, target: externref, amount: externref): void {
  token.transfer(module, session, target, new DataView(sharedMemory.load(amount)).getUint64(0, true))
}