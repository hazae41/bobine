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

  // @ts-ignore
  @external("modules", "load")
  export declare function $load(module: externref): void

  export function load(module: string): externref {
    const shared = sharedMemory.save(String.UTF8.encode(module))

    $load(shared)

    return shared
  }

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

namespace args {

  // @ts-ignore: decorator
  @external("args", "count")
  export declare function count(): usize

  // @ts-ignore: decorator
  @external("args", "value")
  export declare function value(index: usize): externref

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

function $payload(module: ArrayBuffer, nonce: u64): ArrayBuffer {
  const count: i32 = <i32>args.count()

  const argc = count < 1 ? 0 : count - 1
  const argv = new Array<ArrayBuffer>(argc)

  let argl = 0

  for (let i = 0; i < argc; i++) {
    const arg = args.value(i)

    argv[i] = sharedMemory.load(arg)

    argl += argv[i].byteLength
  }

  const payload = new ArrayBuffer(32 + argl + 8)

  Uint8Array.wrap(payload).set(Uint8Array.wrap(module), 0)

  for (let i = 0, offset = 32; i < argc; i++) {
    const arg = argv[i]

    Uint8Array.wrap(payload).set(Uint8Array.wrap(arg), offset)

    offset += arg.byteLength
  }

  new DataView(payload).setUint64(32 + argl, nonce, true)

  return payload
}

export function login(modulus: externref, signature: externref): externref {
  const imodulus = symbols.numerize(modulus)

  const main = sharedMemory.load(bytes.fromHex(modules.main()))

  const nonce = $nonce(imodulus)
  const payload = $payload(main, nonce)

  const verified = ed25519.verify(modulus, signature, sharedMemory.save(payload))

  if (!verified)
    throw new Error("Invalid signature")

  nonces.set(imodulus, nonce + 1)

  const session = symbols.create()

  sessions.set(symbols.numerize(session), imodulus)

  return session
}

export function verify(session: externref): externref {
  const isession = symbols.numerize(session)

  if (!sessions.has(isession))
    throw new Error("Not found")

  const imodulus = sessions.get(isession)

  return symbols.denumerize(imodulus)
}
