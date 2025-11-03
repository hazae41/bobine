namespace symbols {

  // @ts-ignore
  @external("symbols", "create")
  export declare function create(): externref

  // @ts-ignore
  @external("symbols", "compare")
  export declare function compare(left: externref, right: externref): boolean

  // @ts-ignore
  @external("symbols", "save")
  export declare function save(value: externref): usize

  // @ts-ignore
  @external("symbols", "load")
  export declare function load(index: usize): externref

}

@unmanaged
class Account {

  pointer: usize

  constructor(
    pointer: usize
  ) {
    this.pointer = pointer
  }

  static create(balance: u64): Account {
    return new Account(symbols.save(Account.$create(balance)))
  }

  get balance(): u64 {
    return Account.$get_balance(symbols.load(this.pointer))
  }

}

namespace Account {

  // @ts-ignore
  @external("a73a241b7becedf2e2e7e192880aa95a14c0ed3a77409aca32d76d40635125e1", "account_create")
  export declare function $create(balance: u64): externref

  // @ts-ignore
  @external("a73a241b7becedf2e2e7e192880aa95a14c0ed3a77409aca32d76d40635125e1", "account_get_balance")
  export declare function $get_balance(account: externref): u64

}

export function main(): u64 {
  return Account.create(1000).balance
}