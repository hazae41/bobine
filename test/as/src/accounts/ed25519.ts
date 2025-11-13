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

namespace blobs {

  export type blob = externref

  // @ts-ignore: decorator
  @external("blobs", "save")
  export declare function $save(offset: usize, length: usize): blob

  // @ts-ignore: decorator
  @external("blobs", "size")
  export declare function $size(blob: blob): usize

  // @ts-ignore: decorator
  @external("blobs", "load")
  export declare function $load(blob: blob, offset: usize): void

  export function save(buffer: ArrayBuffer): blob {
    const bytes = Uint8Array.wrap(buffer)

    const reference = $save(bytes.dataStart, bytes.length)

    return reference
  }

  export function load(blob: blob): ArrayBuffer {
    const bytes = new Uint8Array(<i32>$size(blob))

    $load(blob, bytes.dataStart)

    return bytes.buffer
  }

}

namespace packs {

  export type pack = externref

  // @ts-ignore
  @external("packs", "decode")
  export declare function decode(blob: blobs.blob): externref

  // @ts-ignore
  @external("packs", "encode")
  export declare function encode(pack: packs.pack): blobs.blob

  // @ts-ignore
  @external("packs", "create")
  export declare function create1<A>(arg0: A): packs.pack

  // @ts-ignore
  @external("packs", "create")
  export declare function create2<A, B>(arg0: A, arg1: B): packs.pack

  // @ts-ignore
  @external("packs", "create")
  export declare function create3<A, B, C>(arg0: A, arg1: B, arg2: C): packs.pack

  // @ts-ignore
  @external("packs", "create")
  export declare function create4<A, B, C, D>(arg0: A, arg1: B, arg2: C, arg3: D): packs.pack

  // @ts-ignore
  @external("packs", "get")
  export declare function get<T>(pack: packs.pack, index: usize): T

}

namespace dynamic {

  // @ts-ignore
  @external("dynamic", "rest")
  export declare function rest(pack: packs.pack): externref

  // @ts-ignore
  @external("dynamic", "call")
  export declare function call1<A>(module: blobs.blob, name: blobs.blob, arg0: A): packs.pack

  // @ts-ignore
  @external("dynamic", "call")
  export declare function call2<A, B>(module: blobs.blob, name: blobs.blob, arg0: A, arg1: B): packs.pack

  // @ts-ignore
  @external("dynamic", "call")
  export declare function call3<A, B, C>(module: blobs.blob, name: blobs.blob, arg0: A, arg1: B, arg2: C): packs.pack

}

namespace modules {

  // @ts-ignore: decorator
  @external("modules", "load")
  export declare function load(name: blobs.blob): blobs.blob

  // @ts-ignore: decorator
  @external("modules", "create")
  export declare function create(code: blobs.blob, salt: blobs.blob): blobs.blob

  // @ts-ignore: decorator
  @external("modules", "self")
  export declare function self(): blobs.blob

}

namespace ed25519 {

  // @ts-ignore: decorator
  @external("ed25519", "verify")
  export declare function verify(pubkey: blobs.blob, signature: blobs.blob, payload: blobs.blob): boolean

}

namespace storage {

  // @ts-ignore: decorator
  @external("storage", "get")
  export declare function get(key: externref): externref;

  // @ts-ignore: decorator
  @external("storage", "set")
  export declare function set(key: externref, value: externref): void;

}

namespace nonces {

  export function get(address: externref): u64 {
    const result = storage.get(packs.encode(packs.create2(blobs.save(String.UTF8.encode("nonce")), address)))

    if (!result)
      return 0

    return packs.get<u64>(packs.decode(result), 0)
  }

  export function set(address: externref, amount: u64): void {
    storage.set(packs.encode(packs.create2(blobs.save(String.UTF8.encode("nonce")), address)), packs.encode(packs.create1(amount)))
  }

}

// account.ts 

const sessions = new Map<usize, usize>()

export function nonce(modulus: externref): u64 {
  return nonces.get(modulus)
}

export function verify(session: externref): externref {
  const isession = symbols.numerize(session)

  if (!sessions.has(isession))
    throw new Error("Not found")

  const imodulus = sessions.get(isession)

  return symbols.denumerize(imodulus)
}

export function main(module: externref, method: externref, payload: externref, modulus: externref, signature: externref): packs.pack {
  const nonce = nonces.get(modulus)

  const message = packs.encode(packs.create4(module, method, payload, nonce))

  if (!ed25519.verify(modulus, signature, message))
    throw new Error("Invalid signature")

  nonces.set(modulus, nonce + 1)

  const session = symbols.create()

  sessions.set(symbols.numerize(session), symbols.numerize(modulus))

  return dynamic.call3(module, method, modules.self(), session, dynamic.rest(packs.decode(payload)))
}