import { bigints } from "../../libs/bigints/mod";
import { blobs } from "../../libs/blobs/mod";
import { console } from "../../libs/console/mod";

export function main(): void {
  const a = bigints.fromBase10(blobs.save(String.UTF8.encode("123")))
  const b = bigints.fromBase10(blobs.save(String.UTF8.encode("456")))

  const c = bigints.add(a, b)

  console.log(bigints.toBase10(c))
}