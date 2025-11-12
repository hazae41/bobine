declare global {
  interface Uint8Array {
    toBase64(): string;
  }

  interface Uint8ArrayConstructor {
    fromBase64(base64: string): Uint8Array<ArrayBuffer>;
  }
}

const verifierAsBytes = Uint8Array.fromBase64("QByZynvXGhaEscyTs8L2h8FWBnNIpAq52mE8SkeLSvQ=")
const signerAsBytes = Uint8Array.fromBase64("MC4CAQAwBQYDK2VwBCIEIOZmpSIQYsiOya6stoqWQ2cOBcuN0F/AmmU2c0wldqXb")

const verifier = await crypto.subtle.importKey("raw", verifierAsBytes, "Ed25519", true, ["verify"]);
const signer = await crypto.subtle.importKey("pkcs8", signerAsBytes, "Ed25519", true, ["sign"]);

export { };
