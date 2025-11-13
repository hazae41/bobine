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
  export declare function $save(offset: usize, length: usize): blobs.blob

  // @ts-ignore: decorator
  @external("blobs", "size")
  export declare function $size(blob: blobs.blob): usize

  // @ts-ignore: decorator
  @external("blobs", "load")
  export declare function $load(blob: blobs.blob, offset: usize): void

  export function save(buffer: ArrayBuffer): blob {
    const bytes = Uint8Array.wrap(buffer)

    const reference = $save(bytes.dataStart, bytes.length)

    return reference
  }

  export function load(blob: blobs.blob): ArrayBuffer {
    const bytes = new Uint8Array(<i32>$size(blob))

    $load(blob, bytes.dataStart)

    return bytes.buffer
  }

}

namespace bytes {

  // @ts-ignore: decorator
  @external("bytes", "concat")
  export declare function concat(left: blobs.blob, right: blobs.blob): externref

  // @ts-ignore: decorator
  @external("bytes", "equals")
  export declare function equals(left: blobs.blob, right: blobs.blob): bool

  // @ts-ignore: decorator
  @external("bytes", "to_hex")
  export declare function toHex(bytes: blobs.blob): blobs.blob

  // @ts-ignore: decorator
  @external("bytes", "from_hex")
  export declare function fromHex(hex: blobs.blob): blobs.blob

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

namespace console {

  // @ts-ignore: decorator
  @external("console", "log")
  declare function $log(message: externref): void

  export function log(message: string): void {
    $log(blobs.save(String.UTF8.encode(message)))
  }

}

namespace sha256 {

  // @ts-ignore: decorator
  @external("sha256", "digest")
  export declare function digest(payload: blobs.blob): blobs.blob

}

namespace accounts {

  export function verify(module: blobs.blob, session: externref): blobs.blob {
    return packs.get<blobs.blob>(dynamic.call1(module, blobs.save(String.UTF8.encode("verify")), session), 0)
  }

}

namespace storage {

  // @ts-ignore: decorator
  @external("storage", "get")
  export declare function get(key: externref): externref;

  // @ts-ignore: decorator
  @external("storage", "set")
  export declare function set(key: externref, value: externref): void;

}

namespace packs {

  // @ts-ignore
  @external("packs", "decode")
  export declare function decode(bytes: externref): externref

  // @ts-ignore
  @external("packs", "encode")
  export declare function encode(pack: externref): externref

  // @ts-ignore
  @external("packs", "create")
  export declare function create1<A>(arg0: A): externref

  // @ts-ignore
  @external("packs", "create")
  export declare function create2<A, B>(arg0: A, arg1: B): externref

  // @ts-ignore
  @external("packs", "get")
  export declare function get<T>(pack: externref, index: usize): T

}

// token.ts

namespace balances {

  export function get(address: externref): u64 {
    const result = storage.get(packs.encode(packs.create2(blobs.save(String.UTF8.encode("balance")), address)))

    if (!result)
      return 0

    return packs.get<u64>(packs.decode(result), 0)
  }

  export function set(address: externref, amount: u64): void {
    storage.set(packs.encode(packs.create2(blobs.save(String.UTF8.encode("balance")), address)), packs.encode(packs.create1(amount)))
  }

}

export function balance(address: externref): u64 {
  return balances.get(address)
}

export function mint(module: externref, session: externref, target: externref, amount: u64): void {
  const sender = address(module, accounts.verify(module, session))

  if (!bytes.equals(sender, bytes.fromHex(blobs.save(String.UTF8.encode("80c628865256f8abd98808b0952ae420970921fd")))))
    throw new Error("Unauthorized")

  balances.set(target, balances.get(target) + amount)
}

export function address(module: externref, modulus: externref): externref {
  const payload = packs.encode(packs.create2(module, modulus))

  const digest = blobs.load(sha256.digest(payload))

  return blobs.save(digest.slice(12))
}

export function transfer(module: externref, session: externref, target: externref, amount: u64): void {
  const sender = address(module, accounts.verify(module, session))

  const sender64 = balances.get(sender)
  const target64 = balances.get(target)

  if (sender64 < amount)
    throw new Error("Insufficient balance")

  balances.set(sender, sender64 - amount)
  balances.set(target, target64 + amount)

  console.log(`Transferred ${amount.toString()} tokens from 0x${String.UTF8.decode(blobs.load(bytes.toHex(sender)))} to 0x${String.UTF8.decode(blobs.load(bytes.toHex(target)))}`)
}