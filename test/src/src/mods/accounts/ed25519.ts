import { addresses } from "../../libs/address/mod"
import { blobref, blobs } from "../../libs/blobs/mod"
import { ed25519 } from "../../libs/ed25519/mod"
import { env } from "../../libs/env/mod"
import { refs } from "../../libs/externs/mod"
import { modules } from "../../libs/modules/mod"
import { packref, packs } from "../../libs/packs/mod"
import { storage } from "../../libs/storage/mod"

namespace nonces {

  export function get(address: blobref): i64 {
    const result = storage.get(packs.encode(packs.create2(blobs.save(String.UTF8.encode("nonce")), address)))

    if (!result)
      return 0

    return packs.get<i64>(packs.decode(result), 0)
  }

  export function set(address: blobref, amount: i64): void {
    storage.set(packs.encode(packs.create2(blobs.save(String.UTF8.encode("nonce")), address)), packs.encode(packs.create1(amount)))
  }

}

export function get_nonce(address: blobref): i64 {
  return nonces.get(address)
}

const sessions = new Set<usize>()

export function verify(session: packref): bool {
  return sessions.has(refs.numerize(session))
}

export function call(module: blobref, method: blobref, payload: blobref, pubkey: blobref, signature: blobref): packref {
  const address = addresses.compute(modules.self(), pubkey)

  const nonce = nonces.get(address)

  const message = packs.encode(packs.create5(env.uuid(), module, method, payload, nonce))

  if (!ed25519.verify(pubkey, signature, message) && env.mode === 1)
    throw new Error("Invalid signature")

  nonces.set(address, nonce + 1)

  const session = packs.create2(modules.self(), pubkey)

  sessions.add(refs.numerize(session))

  return modules.call(module, method, packs.concat(packs.create1(session), packs.decode(payload)))
}