export interface Config {
  readonly database: {
    readonly path: string
  },
  readonly scripts: {
    readonly path: string
  },
  readonly ed25519: {
    readonly pvtKeyAsHex: string,
    readonly pubKeyAsHex: string
  }
}