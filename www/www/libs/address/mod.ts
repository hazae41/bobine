import { blobref, blobs } from "../blobs/mod"
import { modules } from "../modules/mod"
import { packref, packs } from "../packs/mod"
import { sha256 } from "../sha256/mod"

export namespace addresses {

  export function compute(module: blobref, pubkey: blobref): blobref {
    return blobs.save(blobs.load(sha256.digest(packs.encode(packs.create2(module, pubkey)))).slice(12))
  }

  export function verify(session: packref): blobref {
    const module = packs.get<blobref>(session, 0)
    const pubkey = packs.get<blobref>(session, 1)

    if (!packs.get<bool>(modules.call(module, blobs.save(String.UTF8.encode("verify")), packs.create1(session)), 0))
      throw new Error("Invalid session")

    return compute(module, pubkey)
  }

}