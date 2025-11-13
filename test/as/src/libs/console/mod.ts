import { blobs } from "../blobs/mod";

export namespace console {

  // @ts-ignore: decorator
  @external("console", "log")
  export declare function logAsBlob(message: blobs.blob): void

  export function logAsString(message: string): void {
    logAsBlob(blobs.save(String.UTF8.encode(message)))
  }

}