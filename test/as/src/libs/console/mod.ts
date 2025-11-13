import { blobs } from "../blobs/mod";

export namespace console {

  // @ts-ignore: decorator
  @external("console", "log")
  export declare function log(message: blobs.blob): void

}