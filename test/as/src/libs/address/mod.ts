import { blobs } from "../blobs/mod"
import { dynamic } from "../dynamic/mod"
import { packs } from "../packs/mod"
import { sha256 } from "../sha256/mod"

export namespace addresses {

  export function compute(module: blobs.blob, pubkey: blobs.blob): blobs.blob {
    return blobs.save(blobs.load(sha256.digest(packs.encode(packs.create2(module, pubkey)))).slice(12))
  }

  export function verify(session: packs.pack): blobs.blob {
    const module = packs.get<blobs.blob>(session, 0)
    const pubkey = packs.get<blobs.blob>(session, 1)

    if (!packs.get<bool>(dynamic.call(module, blobs.save(String.UTF8.encode("verify")), packs.create1(session)), 0))
      throw new Error("Invalid session")

    return compute(module, pubkey)
  }

}