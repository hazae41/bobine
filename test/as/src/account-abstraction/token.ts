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

namespace accounts {

  // @ts-ignore: decorator
  @external("dynamic_functions", "verify")
  export declare function verify(module: externref, session: externref): externref

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
  // return sha256(module, modulus)
  return modulus
}

export function transfer(module: externref, session: externref, target: externref, amount: u64): void {
  const sender = address(module, accounts.verify(module, session))

  const isender = symbols.numerize(sender)
  const itarget = symbols.numerize(target)

  $mint(isender, 100)

  const bsender = $balance(isender)
  const btarget = $balance(itarget)

  if (bsender < amount)
    throw new Error("Insufficient balance")

  balances.set(isender, bsender - amount)
  balances.set(itarget, btarget + amount)

  console.log(`Transferred ${amount.toString()} tokens from ${isender} to ${itarget}`)
}