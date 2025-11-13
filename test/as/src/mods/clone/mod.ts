import { blobs } from "../../libs/blobs/mod"
import { bytes } from "../../libs/bytes/mod"
import { modules } from "../../libs/modules/mod"
import { sha256 } from "../../libs/sha256/mod"

export function init(message: externref): void {
  if (!bytes.equals(modules.self(), sha256.digest(bytes.concat(sha256.digest(modules.load(modules.self())), sha256.digest(message)))))
    throw new Error("Module integrity check failed")

  console.log(String.UTF8.decode(blobs.load(message)))
}

export function clone(message: externref): externref {
  return modules.create(modules.load(modules.self()), message)
}