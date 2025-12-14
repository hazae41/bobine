import { blobref, blobs, storage } from "@hazae41/stdbob"

export function set(): void {
  storage.set(blobs.save(String.UTF8.encode("greeting")), blobs.save(String.UTF8.encode("Hello, World!!")))
}

export function get(): blobref {
  return storage.get(blobs.save(String.UTF8.encode("greeting")))
}