import { blobs } from "../blobs/mod";

export namespace chain {

  // @ts-ignore: decorator
  @external("chain", "uuid")
  export declare function uuid(): blobs.blob

}