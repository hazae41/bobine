import { blobs } from "../../libs/blobs/mod"
import { bytes } from "../../libs/bytes/mod"
import { console } from "../../libs/console/mod"
import { modules } from "../../libs/modules/mod"
import { sha256 } from "../../libs/sha256/mod"

export function init(message: blobs.blob): void {
  if (!bytes.equals(modules.self(), sha256.digest(bytes.concat(sha256.digest(modules.load(modules.self())), sha256.digest(message)))))
    throw new Error("Module integrity check failed")

  console.logAsBlob(message)
}

export function clone(message: blobs.blob): externref {
  return modules.create(modules.load(modules.self()), message)
}