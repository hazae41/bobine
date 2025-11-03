namespace symbols {

  // @ts-ignore
  @external("symbols", "create")
  export declare function create(): externref

  // @ts-ignore
  @external("symbols", "numerize")
  export declare function numerize(symbol: externref): usize

  // @ts-ignore
  @external("symbols", "denumerize")
  export declare function denumerize(index: usize): externref

}

export function main(): boolean {
  const a = symbols.create(), ia = symbols.numerize(a)

  const b = symbols.denumerize(ia), ib = symbols.numerize(b)

  if (ia !== ib)
    return false

  const c = symbols.create(), ic = symbols.numerize(c)

  if (ia === ic)
    return false
  if (ib === ic)
    return false

  return true
}