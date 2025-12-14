import { blobref, blobs, console, modules, sha256 } from "@hazae41/stdbob"

export function init(message: blobref): void {
  if (!blobs.equals(modules.self(), sha256.digest(blobs.concat(sha256.digest(modules.load(modules.self())), sha256.digest(message)))))
    throw new Error("Module integrity check failed")

  console.log(message)
}

export function clone(message: blobref): blobref {
  return modules.create(modules.load(modules.self()), message)
}