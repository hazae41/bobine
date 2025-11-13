import { blobs } from "../blobs/mod";
import { dynamic } from "../dynamic/mod";
import { packs } from "../packs/mod";

export namespace accounts {

  export function verify(module: blobs.blob, session: externref): blobs.blob {
    return packs.get<blobs.blob>(dynamic.call1(module, blobs.save(String.UTF8.encode("verify")), session), 0)
  }

}