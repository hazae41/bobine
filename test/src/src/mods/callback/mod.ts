import { blobref } from "../../libs/blobs/mod";
import { console } from "../../libs/console/mod";
import { modules } from "../../libs/modules/mod";

// @ts-ignore
@external("5feeee846376f6436990aa2757bc67fbc4498bcc9993b647788e273ad6fde474", "logmeback")
declare function logmeback(module: blobref): void

export function main(): void {
  logmeback(modules.self())
}

export function log(message: blobref): void {
  console.log(message);
}