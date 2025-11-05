// @ts-ignore: decorator
@external("ed25519", "ping")
declare function ping(): boolean

export function main(): boolean {
  return ping()
}