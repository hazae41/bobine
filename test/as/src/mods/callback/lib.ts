import { blobs } from "../../libs/blobs/mod";
import { dynamic } from "../../libs/dynamic/mod";

export function logmeback(module: blobs.blob): void {
  dynamic.call1(module, blobs.save(String.UTF8.encode("log")), blobs.save(String.UTF8.encode("Hello from AssemblyScript!")))
}