import { bigintref, bigints, blobs, storage } from "@hazae41/stdbob"

export function add(): bigintref {
  const key = blobs.save(String.UTF8.encode("counter"))

  const val = storage.get(key)

  if (!val) {
    const fresh = bigints.one()

    storage.set(key, bigints.encode(fresh))

    return fresh
  }

  const stale = bigints.decode(val)

  const fresh = bigints.inc(stale)

  storage.set(key, bigints.encode(fresh))

  return fresh
}