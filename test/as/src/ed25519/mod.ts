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

namespace bytes {

  // @ts-ignore: decorator
  @external("bytes", "from_hex")
  export declare function from_hex(text: externref): externref

}

namespace ed25519 {

  // @ts-ignore: decorator
  @external("ed25519", "verify")
  export declare function verify(pubkey: externref, signature: externref, payload: externref): boolean

}

export function main(): boolean {
  const pubkey = bytes.from_hex(sharedMemory.save(String.UTF8.encode("E0293454F6B94439F24BE13CD9DE35C5A2958808B3932A518A33161CB1D811E8")))
  const signature = bytes.from_hex(sharedMemory.save(String.UTF8.encode("146BD4C4BFC4B13FC3BE444F9A65DEBD684339E251E07A37AC486E283B8953FF7EBEEFB0F8334BDEE30A9F17F2B0232625F8FEA559A27A2279AB32BF2151660C")))
  const payload = sharedMemory.save(String.UTF8.encode("hello world"))

  return ed25519.verify(pubkey, signature, payload)
}