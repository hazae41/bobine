import { blobs } from "../../libs/blobs/mod";
import { console } from "../../libs/console/mod";

// @ts-ignore
@external("metering", "meter")
declare function meter(value: u64): void

export function main(): void {
  console.log(blobs.save(String.UTF8.encode("Hello, world!")))
  meter(100)
}