import { bigintref, bigints } from "../../libs/bigints/mod"
import { blobs } from "../../libs/blobs/mod.ts"
import { storage } from "../../libs/storage/mod"

export function get(): bigintref {
  const value = storage.get(blobs.save(String.UTF8.encode("counter")))

  if (!value)
    return bigints.zero()

  return bigints.decode(value)
}

export function add(): void {
  const key = blobs.save(String.UTF8.encode("counter"))

  const value = storage.get(key)

  if (!value) {
    storage.set(key, bigints.encode(bigints.one()))
  } else {
    storage.set(key, bigints.encode(bigints.add(bigints.decode(value), bigints.one())))
  }
}