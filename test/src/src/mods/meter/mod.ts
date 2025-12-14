import { blobref, blobs, sha256 } from "@hazae41/stdbob"

export function main(): blobref {
  let result = sha256.digest(blobs.save(String.UTF8.encode("Hello world!")))

  for (let i = 0; i < 10; i++)
    result = sha256.digest(result)

  return result
}