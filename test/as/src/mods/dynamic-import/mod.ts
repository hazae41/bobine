import { blobs } from "../../libs/blobs/mod"
import { modules } from "../../libs/modules/mod"
import { packs } from "../../libs/packs/mod"
import { symbols } from "../../libs/symbols/mod"

class Library {

  constructor(
    readonly pointer: usize
  ) { }

  static new(module: string): Library {
    return new Library(symbols.numerize(blobs.fromHex(blobs.save(String.UTF8.encode(module)))))
  }

  log(message: string): void {
    modules.call(symbols.denumerize(this.pointer), blobs.save(String.UTF8.encode("log")), packs.create1(blobs.save(String.UTF8.encode(message))))
  }

}

export function main(): void {
  const library = Library.new("25fbe28a6ab6dfc0ba3603ae3082fc66ccf05bd473e8ecaded1d966c7692c9ef")

  library.log("hello")
  library.log("world")

  return
}