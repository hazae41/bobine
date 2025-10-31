// @ts-ignore: decorator
@external("0xE1397f777BE7F246F04424b3EbadA68a5189cdb5", "transfer")
declare function token_transfer(target: string, amount: number): void

export function main(): void {
  token_transfer("0x8349A3FaA1fcDEA94183c1652af3b86853eac3F0", 100)
}