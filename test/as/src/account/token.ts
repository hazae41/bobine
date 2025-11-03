// @ts-ignore
@external("692315bd342a3c04ce71c9b3aeb95f1f27a3e05cd9401469da71f0f1c1bf5eb9", "verify")
declare function verify(session: externref): boolean

namespace console {

  // @ts-ignore: decorator
  @external("console", "log")
  declare function $log(pointer: usize, length: usize): void

  export function log(message: string): void {
    const buffer = String.UTF8.encode(message)

    const bytes = Uint8Array.wrap(buffer)

    $log(bytes.dataStart, bytes.length)
  }

}

// token.ts

export function transfer(session: externref, amount: usize): void {
  const valid = verify(session)

  if (!valid)
    throw new Error("Invalid session")

  console.log(`Transferred ${amount.toString()} tokens`)
}