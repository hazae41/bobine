import { blobs } from "../../libs/blobs/mod"
import { storage } from "../../libs/storage/mod"

export function set(): void {
  storage.set(blobs.save(String.UTF8.encode("greeting")), blobs.save(String.UTF8.encode("Hello, World!!")))
}

export function get(): externref {
  return storage.get(blobs.save(String.UTF8.encode("greeting")))
}