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

const accounts = new Map<usize, Account>();

class Account {

  balance: u64

  constructor(
    pointer: usize,
    balance: u64
  ) {
    this.balance = balance;
  }

}

export function account_create(balance: u64): externref {
  const symbol = symbols.create()
  const pointer = symbols.save(symbol)
  const account = new Account(pointer, balance)
  accounts.set(pointer, account)
  return symbol
}

export function account_get_balance(symbol: externref): u64 {

}