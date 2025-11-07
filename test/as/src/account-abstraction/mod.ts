namespace ed25519 {

  export const name = "8b8d7299bd5049bade73956dfc6dc7f4a492665b08c84eb77d3f52a0c2cca775"

  // @ts-ignore
  @external("8b8d7299bd5049bade73956dfc6dc7f4a492665b08c84eb77d3f52a0c2cca775", "login")
  export declare function login(pubkey: externref, signature: externref): externref

}

namespace token {

  // @ts-ignore
  @external("38bbcdc1759d97e021ff33553a4da407612bf1ba1febd9936629837c793d84e3", "transfer")
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

export function main(pubkey: externref, target: externref, amount: externref, signature: externref): void {
  const module = sharedMemory.save(String.UTF8.encode(ed25519.name))
  const amount64 = new DataView(sharedMemory.load(amount)).getUint64(0, true)
  token.transfer(module, ed25519.login(pubkey, signature), target, amount64)
}