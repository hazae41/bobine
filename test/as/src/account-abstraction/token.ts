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
  export declare function verify(module: externref, session: externref): bool

  // @ts-ignore: decorator
  @external("dynamic_functions", "address")
  export declare function address(module: externref, session: externref): externref

}

// token.ts

const balances = new Map<usize, usize>()

export function set(account: usize, amount: usize): void {
  balances.set(account, amount)
}

export function balanceOf(account: usize): usize {
  const balance = balances.get(account)

  if (balance == null)
    return 0

  return balance
}

export function transfer(module: externref, session: externref, target: externref, amount: usize): void {
  const valid = accounts.verify(module, session)

  if (!valid)
    throw new Error("Invalid session")

  const sender = accounts.address(module, session)

  const isender = symbols.numerize(sender)
  const itarget = symbols.numerize(target)

  balances.set(isender, balanceOf(isender) - amount)
  balances.set(itarget, balanceOf(itarget) + amount)

  console.log(`Transferred ${amount.toString()} tokens`)
}