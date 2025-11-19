export async function generate(target: number | bigint) {
  while (true) {
    const effort = crypto.getRandomValues(new Uint8Array(32))

    const value = (2n ** 256n) / BigInt("0x" + new Uint8Array(await crypto.subtle.digest("SHA-256", effort)).toHex())

    if (value < target)
      continue

    return effort
  }
}