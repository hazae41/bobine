import { JSON } from "assemblyscript-json";


import type { } from "../node_modules/assemblyscript/std/assembly/index.d.ts";

// @ts-ignore: decorator
@external("log")
declare function log(x: number): number

export function main(): void {
  JSON.from("hello world").toString()
  String.UTF8
  log(123)
}