import { blobref, blobs, sha256 } from "@hazae41/stdbob"

export function main(): blobref {
  return sha256.digest(blobs.save(String.UTF8.encode("hello world")))
}