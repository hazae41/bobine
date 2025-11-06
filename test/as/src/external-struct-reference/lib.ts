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

class Account {

  balance: u64

  constructor(
    balance: u64
  ) {
    this.balance = balance;
  }

}

const accounts = new Map<usize, Account>();

export function account_create(balance: u64): externref {
  const symbol = symbols.create()

  const pointer = symbols.numerize(symbol)
  const account = new Account(balance)
  accounts.set(pointer, account)

  return symbol
}

export function account_get_balance(symbol: externref): u64 {
  return accounts.get(symbols.numerize(symbol)).balance
}

export function account_set_balance(symbol: externref, balance: u64): void {
  accounts.get(symbols.numerize(symbol)).balance = balance
}