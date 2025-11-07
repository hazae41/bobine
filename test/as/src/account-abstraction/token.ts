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

namespace console {

  // @ts-ignore: decorator
  @external("console", "log")
  declare function $log(message: externref): void

  export function log(message: string): void {
    $log(sharedMemory.save(String.UTF8.encode(message)))
  }

}

namespace sha256 {

  // @ts-ignore: decorator
  @external("sha256", "digest")
  export declare function digest(payload: externref): externref

}

namespace bytes {

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
  export declare function call1(module: externref, name: externref, arg0: externref): externref

}

namespace accounts {

  export function verify(module: externref, session: externref): externref {
    return dynamic.call1(module, sharedMemory.save(String.UTF8.encode("verify")), session)
  }

}

// token.ts

const balances = new Map<usize, u64>()

export function balance(address: externref): u64 {
  return $balance(symbols.numerize(address))
}

export function $balance(address: usize): u64 {
  return balances.has(address) ? balances.get(address) : 0
}

export function mint(address: externref, amount: usize): void {
  return $mint(symbols.numerize(address), amount)
}

export function $mint(address: usize, amount: usize): void {
  balances.set(address, $balance(address) + amount)
}

export function address(module: externref, modulus: externref): externref {
  const bmodule = Uint8Array.wrap(sharedMemory.load(module))
  const bmodulus = Uint8Array.wrap(sharedMemory.load(modulus))

  const payload = new Uint8Array(bmodule.length + bmodulus.length)
  payload.set(bmodule, 0)
  payload.set(bmodulus, bmodule.length)

  const digest = sharedMemory.load(sha256.digest(sharedMemory.save(payload.buffer)))

  return sharedMemory.save(digest.slice(12))
}

export function transfer(module: externref, session: externref, target: externref, amount: externref): void {
  const sender = address(module, accounts.verify(module, session))

  const isender = symbols.numerize(sender)
  const itarget = symbols.numerize(target)

  $mint(isender, 100)

  const sender64 = $balance(isender)
  const target64 = $balance(itarget)

  const amount64 = new DataView(sharedMemory.load(amount)).getUint64(0, true)

  if (sender64 < amount64)
    throw new Error("Insufficient balance")

  balances.set(isender, sender64 - amount64)
  balances.set(itarget, target64 + amount64)

  console.log(`Transferred ${amount64.toString()} tokens from 0x${String.UTF8.decode(sharedMemory.load(bytes.toHex(sender)))} to 0x${String.UTF8.decode(sharedMemory.load(bytes.toHex(target)))}`)
}