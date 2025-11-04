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

  pointer: usize

  constructor(pointer: usize) {
    this.pointer = pointer
  }

  static create(balance: u64): Account {
    return new Account(symbols.numerize(Account.$create(balance)))
  }

  get balance(): u64 {
    return Account.$get_balance(symbols.denumerize(this.pointer))
  }

  set balance(value: u64) {
    Account.$set_balance(symbols.denumerize(this.pointer), value)
  }

}

namespace Account {

  // @ts-ignore
  @external("9456e360b5600759a095a894b8d17cdd746d631cfbcc16e94a18febf8116372e", "account_create")
  export declare function $create(balance: u64): externref

  // @ts-ignore
  @external("9456e360b5600759a095a894b8d17cdd746d631cfbcc16e94a18febf8116372e", "account_get_balance")
  export declare function $get_balance(account: externref): u64

  // @ts-ignore
  @external("9456e360b5600759a095a894b8d17cdd746d631cfbcc16e94a18febf8116372e", "account_set_balance")
  export declare function $set_balance(account: externref, value: u64): void

}

export function main(): u64 {
  const account = Account.create(1000)

  account.balance = 123

  return account.balance
}