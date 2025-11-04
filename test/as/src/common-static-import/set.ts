// @ts-ignore
@external("b2a3b05c5fc5d646535183ab80dfd012cf37bd9910847b064e9af40dcbf07291", "set")
declare function lib_set(value: number): void

export function set(value: number): void {
  lib_set(value)
}