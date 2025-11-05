namespace ed25519 {

  // @ts-ignore: decorator
  @external("ed25519", "verify")
  declare function verify(pubkey: Uint8Array, signature: Uint8Array, payload: Uint8Array): boolean

}

export function main() {

}