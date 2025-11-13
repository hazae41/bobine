import { blobs } from "../libs/blobs/mod"
import { bytes } from "../libs/bytes/mod"
import { dynamic } from "../libs/dynamic/mod"
import { symbols } from "../libs/symbols/mod"

class Library {

  constructor(
    readonly pointer: usize
  ) { }

  static new(name: string): Library {
    return new Library(symbols.numerize(bytes.fromHex(blobs.save(String.UTF8.encode(name)))))
  }

  log(message: string): void {
    dynamic.call1(symbols.denumerize(this.pointer), blobs.save(String.UTF8.encode("log")), blobs.save(String.UTF8.encode(message)))
  }

}

export function main(): void {
  const library = Library.new("25fbe28a6ab6dfc0ba3603ae3082fc66ccf05bd473e8ecaded1d966c7692c9ef")

  library.log("hello")
  library.log("world")

  return
}