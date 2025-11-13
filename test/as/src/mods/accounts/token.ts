import { accounts } from "../../libs/accounts/mod"
import { address } from "../../libs/address/mod"
import { blobs } from "../../libs/blobs/mod"
import { bytes } from "../../libs/bytes/mod"
import { console } from "../../libs/console/mod"
import { packs } from "../../libs/packs/mod"
import { storage } from "../../libs/storage/mod"

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

export function get_balance(address: externref): u64 {
  return balances.get(address)
}

export function mint(module: externref, session: externref, target: externref, amount: u64): void {
  const sender = address.compute(module, accounts.verify(module, session))

  if (!bytes.equals(sender, bytes.fromHex(blobs.save(String.UTF8.encode("80c628865256f8abd98808b0952ae420970921fd")))))
    throw new Error("Unauthorized")

  balances.set(target, balances.get(target) + amount)
}

export function transfer(module: externref, session: externref, target: externref, amount: u64): void {
  const sender = address.compute(module, accounts.verify(module, session))

  const sender64 = balances.get(sender)
  const target64 = balances.get(target)

  if (sender64 < amount)
    throw new Error("Insufficient balance")

  balances.set(sender, sender64 - amount)
  balances.set(target, target64 + amount)

  console.logAsString(`Transferred ${amount.toString()} tokens from 0x${String.UTF8.decode(blobs.load(bytes.toHex(sender)))} to 0x${String.UTF8.decode(blobs.load(bytes.toHex(target)))}`)
}