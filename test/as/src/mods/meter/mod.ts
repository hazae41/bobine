import { blobs } from "../../libs/blobs/mod";
import { sha256 } from "../../libs/sha256/mod";

export function main(): externref {
  let result = sha256.digest(blobs.save(String.UTF8.encode("Hello world!")))

  for (let i = 0; i < 10; i++)
    result = sha256.digest(result)

  return result
}