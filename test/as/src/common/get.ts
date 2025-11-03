// @ts-ignore
@external("b2a3b05c5fc5d646535183ab80dfd012cf37bd9910847b064e9af40dcbf07291", "get")
declare function lib_get(): number

// @ts-ignore
@external("e93d00c548e87a0127f5b983a1b4699d01d3f89fb669a126e385c8fd0713f77e", "set")
declare function set_set(value: number): void

export function main(): number {
  set_set(123)

  return lib_get()
}