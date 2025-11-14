import { blobs } from "../../libs/blobs/mod";
import { dynamic } from "../../libs/dynamic/mod";
import { packs } from "../../libs/packs/mod";

export function logmeback(module: blobs.blob): void {
  dynamic.call(module, blobs.save(String.UTF8.encode("log")), packs.create1(blobs.save(String.UTF8.encode("Hello from AssemblyScript!"))))
}