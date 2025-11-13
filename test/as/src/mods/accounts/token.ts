import { addresses } from "../../libs/address/mod"
import { blobs } from "../../libs/blobs/mod"
import { modules } from "../../libs/modules/mod"
import { packs } from "../../libs/packs/mod"
import { sha256 } from "../../libs/sha256/mod"
import { storage } from "../../libs/storage/mod"

namespace owner {

  export function get(): blobs.blob {
    const result = storage.get(packs.encode(packs.create1(blobs.save(String.UTF8.encode("owner")))))

    if (!result)
      return blobs.fromHex(blobs.save(String.UTF8.encode("0000000000000000000000000000000000000000")))

    return packs.get<blobs.blob>(packs.decode(result), 0)
  }

  export function set(address: externref): void {
    storage.set(packs.encode(packs.create1(blobs.save(String.UTF8.encode("owner")))), packs.encode(packs.create1(address)))
  }

}

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

export function init(creator: blobs.blob): void {
  if (!blobs.equals(modules.self(), sha256.digest(blobs.concat(sha256.digest(modules.load(modules.self())), sha256.digest(creator)))))
    throw new Error("Invalid creator")

  owner.set(creator)

  return
}

export function get_balance(target: blobs.blob): u64 {
  return balances.get(target)
}

export function mint(session: packs.pack, target: blobs.blob, amount: u64): void {
  const sender = addresses.verify(session)

  if (!blobs.equals(sender, owner.get()))
    throw new Error("Unauthorized")

  balances.set(target, balances.get(target) + amount)

  storage.set(blobs.save(String.UTF8.encode("mint")), packs.encode(packs.create2(target, amount)))
}

export function transfer(session: packs.pack, target: blobs.blob, amount: u64): void {
  const sender = addresses.verify(session)

  const bsender = balances.get(sender)
  const btarget = balances.get(target)

  if (bsender < amount)
    throw new Error("Insufficient balance")

  balances.set(sender, bsender - amount)
  balances.set(target, btarget + amount)

  storage.set(blobs.save(String.UTF8.encode("transfer")), packs.encode(packs.create3(sender, target, amount)))
}