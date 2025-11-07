namespace ed25519 {

  export const name = "d3899b25520d395912b10e80891627e0c8efa9602597d65d3e27cfdf679706c0"

  // @ts-ignore
  @external("d3899b25520d395912b10e80891627e0c8efa9602597d65d3e27cfdf679706c0", "login")
  export declare function login(pubkey: externref, payload: externref, signature: externref): externref

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
  const accounts = sharedMemory.save(String.UTF8.encode(ed25519.name))

  const btarget = sharedMemory.load(target)
  const bamount = sharedMemory.load(amount)

  const bpayload = new ArrayBuffer(btarget.byteLength + bamount.byteLength)
  Uint8Array.wrap(bpayload).set(Uint8Array.wrap(btarget), 0)
  Uint8Array.wrap(bpayload).set(Uint8Array.wrap(bamount), btarget.byteLength)

  const payload = sharedMemory.save(bpayload)
  const amount64 = new DataView(bamount).getUint64(0, true)

  token.transfer(accounts, ed25519.login(pubkey, payload, signature), target, amount64)
}