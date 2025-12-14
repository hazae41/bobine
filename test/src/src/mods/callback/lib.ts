import { blobref, blobs, modules, packs } from "@hazae41/stdbob";

export function logmeback(module: blobref): void {
  modules.call(module, blobs.save(String.UTF8.encode("log")), packs.create1(blobs.save(String.UTF8.encode("Hello from AssemblyScript!"))))
}