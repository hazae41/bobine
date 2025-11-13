import { blobs } from "../../libs/blobs/mod";
import { console } from "../../libs/console/mod";

export function log(message: blobs.blob): void {
  console.logAsBlob(message);
}
