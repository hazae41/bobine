import { blobs } from "../../libs/blobs/mod"
import { chain } from "../../libs/chain/mod"
import { dynamic } from "../../libs/dynamic/mod"
import { ed25519 } from "../../libs/ed25519/mod"
import { modules } from "../../libs/modules/mod"
import { packs } from "../../libs/packs/mod"
import { storage } from "../../libs/storage/mod"
import { symbols } from "../../libs/symbols/mod"

namespace nonces {

  export function get(address: externref): u64 {
    const result = storage.get(packs.encode(packs.create2(blobs.save(String.UTF8.encode("nonce")), address)))

    if (!result)
      return 0

    return packs.get<u64>(packs.decode(result), 0)
  }

  export function set(address: externref, amount: u64): void {
    storage.set(packs.encode(packs.create2(blobs.save(String.UTF8.encode("nonce")), address)), packs.encode(packs.create1(amount)))
  }

}

const sessions = new Map<usize, usize>()

export function nonce(modulus: externref): u64 {
  return nonces.get(modulus)
}

export function verify(session: externref): externref {
  const isession = symbols.numerize(session)

  if (!sessions.has(isession))
    throw new Error("Not found")

  const imodulus = sessions.get(isession)

  return symbols.denumerize(imodulus)
}

export function main(module: externref, method: externref, payload: externref, modulus: externref, signature: externref): packs.pack {
  const nonce = nonces.get(modulus)

  const message = packs.encode(packs.create5(chain.uuid(), module, method, payload, nonce))

  if (!ed25519.verify(modulus, signature, message))
    throw new Error("Invalid signature")

  nonces.set(modulus, nonce + 1)

  const session = symbols.create()

  sessions.set(symbols.numerize(session), symbols.numerize(modulus))

  return dynamic.call3(module, method, modules.self(), session, dynamic.rest(packs.decode(payload)))
}