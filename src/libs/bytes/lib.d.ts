interface Uint8Array {
  toHex(): string;
}

interface Uint8ArrayConstructor {
  fromHex(hex: string): Uint8Array;
}