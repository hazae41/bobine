import { blobs } from "../../libs/blobs/mod"
import { sha256 } from "../../libs/sha256/mod"

export function main(): blobs.blob {
  return sha256.digest(blobs.save(String.UTF8.encode("hello world")))
}