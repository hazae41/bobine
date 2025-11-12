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

  // @ts-ignore: decorator
  @external("blobs", "save")
  export declare function $save(offset: usize, length: usize): externref

  // @ts-ignore: decorator
  @external("blobs", "size")
  export declare function $size(reference: externref): usize

  // @ts-ignore: decorator
  @external("blobs", "load")
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
  declare function $log(message: externref): void

  export function log(message: string): void {
    $log(blobs.save(String.UTF8.encode(message)))
  }

}

namespace sha256 {

  // @ts-ignore: decorator
  @external("sha256", "digest")
  export declare function digest(payload: externref): externref

}

namespace bytes {

  // @ts-ignore: decorator
  @external("bytes", "concat")
  export declare function concat(left: externref, right: externref): externref

  // @ts-ignore: decorator
  @external("bytes", "equals")
  export declare function equals(left: externref, right: externref): bool

  // @ts-ignore: decorator
  @external("bytes", "to_hex")
  export declare function toHex(bytes: externref): externref

  // @ts-ignore: decorator
  @external("bytes", "from_hex")
  export declare function fromHex(hex: externref): externref

}

namespace dynamic {

  // @ts-ignore
  @external("dynamic", "call")
  export declare function call1<A>(module: externref, name: externref, arg0: A): externref

}

namespace accounts {

  export function verify(module: externref, session: externref): externref {
    return dynamic.call1(module, blobs.save(String.UTF8.encode("verify")), session)
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
  export declare function create2<A, B>(arg0: A, arg1: B): externref

  // @ts-ignore
  @external("packs", "get")
  export declare function get<T>(pack: externref, index: usize): T

}

// token.ts

namespace balances {

  export function get(address: externref): u64 {
    return packs.get<u64>(packs.decode(storage.get(packs.encode(packs.create2(blobs.save(String.UTF8.encode("balance")), address)))), 0)
  }

  export function set(address: externref, amount: u64): void {
    storage.set(packs.encode(packs.create2(blobs.save(String.UTF8.encode("balance")), address)), packs.encode(packs.create2<u64, externref>(amount, address)))
  }

}

export function balance(address: externref): u64 {
  return balances.get(address)
}

export function mint(address: externref, amount: usize): void {
  balances.set(address, balances.get(address) + amount)
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