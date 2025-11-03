import { JSON } from "../node_modules/assemblyscript-json/assembly"

// @ts-ignore: decorator
@external("test", "invoke")
declare function invoke(): Token

namespace console {

  // @ts-ignore: decorator
  @external("console", "log")
  declare function logAsUtf8(pointer: usize, length: usize): void

  export function log(val: string): void {
    const buffer = String.UTF8.encode(val)
    const bytes = Uint8Array.wrap(buffer)

    logAsUtf8(bytes.dataStart, bytes.length)
  }

}

namespace sharedMemory {

  // @ts-ignore: decorator
  @external("shared_memory", "put")
  export declare function put(ptr: usize, len: usize): usize

  // @ts-ignore: decorator
  @external("shared_memory", "len")
  export declare function len(idx: usize): usize

  // @ts-ignore: decorator
  @external("shared_memory", "get")
  export declare function get(idx: usize, ptr: usize): void

}

declare class Token {
  // @ts-ignore: decorator
  @external("virtual", "name")
  name: usize
}

function from(idx: usize): JSON.Value {
  const buf = new Uint8Array(<i32>sharedMemory.len(idx))

  sharedMemory.get(idx, buf.dataStart)

  return JSON.parse(String.UTF8.decode(buf.buffer))
}

function into(val: JSON.Value): usize {
  const str = val.stringify()
  const arr = String.UTF8.encode(str)
  const buf = Uint8Array.wrap(arr)

  return sharedMemory.put(buf.dataStart, buf.length)
}

export function main(): void {
  console.log("hello world")
}
