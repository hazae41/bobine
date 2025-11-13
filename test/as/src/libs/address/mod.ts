import { blobs } from "../blobs/mod"
import { packs } from "../packs/mod"
import { sha256 } from "../sha256/mod"

export namespace address {

  export function compute(module: externref, modulus: externref): externref {
    return blobs.save(blobs.load(sha256.digest(packs.encode(packs.create2(module, modulus)))).slice(12))
  }

}