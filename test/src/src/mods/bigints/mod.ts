import { bigintref, bigints } from "../../libs/bigints/mod";
import { blobs } from "../../libs/blobs/mod";
import { console } from "../../libs/console/mod";

export function add(): bigintref {
  const a = bigints.fromBase10(blobs.save(String.UTF8.encode("123")))
  const b = bigints.fromBase10(blobs.save(String.UTF8.encode("456")))

  const c = bigints.add(a, b)

  console.log(bigints.toBase10(c))

  return c
}

export function very_big(): bigintref {
  const a = bigints.fromBase10(blobs.save(String.UTF8.encode("2")))
  const b = bigints.fromBase10(blobs.save(String.UTF8.encode("300")))

  const c = bigints.pow(a, b)

  console.log(bigints.toBase10(c))

  return c
}

export function smol(): i64 {
  return 12345
}