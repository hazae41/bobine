import { blobref } from "../../libs/blobs/mod";
import { console } from "../../libs/console/mod";

export function log(message: blobref): void {
  console.log(message);
}
