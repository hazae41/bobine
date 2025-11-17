import { blobs } from "../../libs/blobs/mod";
import { console } from "../../libs/console/mod";

export function main(): void {
  for (let i = 0; i < 10; i++) {
    console.log(blobs.save(String.UTF8.encode("Hello world!")))
  }
}