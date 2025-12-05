import { addresses } from "../../libs/address/mod"
import { blobref, blobs } from "../../libs/blobs/mod"
import { modules } from "../../libs/modules/mod"
import { packref, packs } from "../../libs/packs/mod"
import { sha256 } from "../../libs/sha256/mod"
import { storage } from "../../libs/storage/mod"

namespace owner {

  export function get(): blobref {
    const result = storage.get(packs.encode(packs.create1(blobs.save(String.UTF8.encode("owner")))))

    if (!result)
      return blobs.fromBase16(blobs.save(String.UTF8.encode("0000000000000000000000000000000000000000")))

    return packs.get<blobref>(packs.decode(result), 0)
  }

  export function set(address: blobref): void {
    storage.set(packs.encode(packs.create1(blobs.save(String.UTF8.encode("owner")))), packs.encode(packs.create1(address)))
  }

}

namespace balances {

  export function get(address: blobref): i64 {
    const result = storage.get(packs.encode(packs.create2(blobs.save(String.UTF8.encode("balance")), address)))

    if (!result)
      return 0

    return packs.get<i64>(packs.decode(result), 0)
  }

  export function set(address: blobref, amount: i64): void {
    storage.set(packs.encode(packs.create2(blobs.save(String.UTF8.encode("balance")), address)), packs.encode(packs.create1(amount)))
  }

}

/**
 * Initialize the token with a specific owner
 * @param creator 
 * @returns nothing
 */
export function init(creator: blobref): void {
  if (!blobs.equals(modules.self(), sha256.digest(packs.encode(packs.create2(modules.load(modules.self()), creator)))))
    throw new Error("Invalid creator")

  owner.set(creator)

  return
}

/**
 * Get the balance of a specific address
 * @param target 
 * @returns i64
 */
export function get_balance(target: blobref): i64 {
  return balances.get(target)
}

/**
 * Use the owner session to mint tokens to a specific address
 * @param session 
 * @param target 
 * @param amount 
 */
export function mint(session: packref, target: blobref, amount: i64): void {
  const sender = addresses.verify(session)

  if (!blobs.equals(sender, owner.get()))
    throw new Error("Unauthorized")

  balances.set(target, balances.get(target) + amount)

  storage.set(blobs.save(String.UTF8.encode("mint")), packs.encode(packs.create2(target, amount)))
}

/**
 * Use some session to transfer tokens to a specific address
 * @param session 
 * @param target 
 * @param amount 
 */
export function transfer(session: packref, target: blobref, amount: i64): void {
  const sender = addresses.verify(session)

  const bsender = balances.get(sender)
  const btarget = balances.get(target)

  if (bsender < amount)
    throw new Error("Insufficient balance")

  balances.set(sender, bsender - amount)
  balances.set(target, btarget + amount)

  storage.set(blobs.save(String.UTF8.encode("transfer")), packs.encode(packs.create3(sender, target, amount)))
}