namespace symbols {

  // @ts-ignore
  @external("symbols", "create")
  export declare function create(): externref

  // @ts-ignore
  @external("symbols", "numerize")
  export declare function numerize(symbol: externref): usize

  // @ts-ignore
  @external("symbols", "denumerize")
  export declare function denumerize(index: usize): externref

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

namespace modules {

  // @ts-ignore
  @external("modules", "main")
  export declare function main(): externref

  // @ts-ignore
  @external("modules", "self")
  export declare function self(): externref

}

namespace bytes {

  // @ts-ignore: decorator
  @external("bytes", "to_hex")
  export declare function toHex(bytes: externref): externref

  // @ts-ignore: decorator
  @external("bytes", "from_hex")
  export declare function fromHex(hex: externref): externref

}

namespace ed25519 {

  // @ts-ignore: decorator
  @external("ed25519", "verify")
  export declare function verify(pubkey: externref, signature: externref, payload: externref): boolean

}

namespace dynamic {

  // @ts-ignore
  @external("dynamic", "call_and_unpack")
  export declare function callpack3(module: externref, name: externref, arg0: externref, arg1: externref, pack2: externref): externref

}

// account.ts 

const nonces = new Map<usize, u64>()
const sessions = new Map<usize, usize>()

export function nonce(modulus: externref): u64 {
  return $nonce(symbols.numerize(modulus))
}

export function $nonce(modulus: usize): u64 {
  return nonces.has(modulus) ? nonces.get(modulus) : 0
}

export function verify(session: externref): externref {
  const isession = symbols.numerize(session)

  if (!sessions.has(isession))
    throw new Error("Not found")

  const imodulus = sessions.get(isession)

  return symbols.denumerize(imodulus)
}

export function call(module: externref, method: externref, payload: externref, pubkey: externref, signature: externref): void {
  const imodulus = symbols.numerize(pubkey)

  const nonce = $nonce(imodulus)

  const bmodule = sharedMemory.load(module)
  const bmethod = sharedMemory.load(method)
  const bpayload = sharedMemory.load(payload)

  const bmessage = new ArrayBuffer(bmodule.byteLength + bmethod.byteLength + bpayload.byteLength + 8)

  Uint8Array.wrap(bmessage).set(Uint8Array.wrap(bmodule), 0)
  Uint8Array.wrap(bmessage).set(Uint8Array.wrap(bmethod), bmodule.byteLength)
  Uint8Array.wrap(bmessage).set(Uint8Array.wrap(bpayload), bmodule.byteLength + bmethod.byteLength)

  new DataView(bmessage).setUint64(bmodule.byteLength + bmethod.byteLength + bpayload.byteLength, nonce, true)

  const message = sharedMemory.save(bmessage)

  const verified = ed25519.verify(pubkey, signature, message)

  if (!verified)
    throw new Error("Invalid signature")

  nonces.set(imodulus, nonce + 1)

  const session = symbols.create()

  sessions.set(symbols.numerize(session), imodulus)

  dynamic.callpack3(module, method, modules.self(), session, payload)
}