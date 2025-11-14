import { blobs } from "../../libs/blobs/mod";
import { modules } from "../../libs/modules/mod";
import { packs } from "../../libs/packs/mod";

export function logmeback(module: blobs.blob): void {
  modules.call(module, blobs.save(String.UTF8.encode("log")), packs.create1(blobs.save(String.UTF8.encode("Hello from AssemblyScript!"))))
}