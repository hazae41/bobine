namespace symbols {

  // @ts-ignore
  @external("symbols", "create")
  export declare function create(): externref

  // @ts-ignore
  @external("symbols", "compare")
  export declare function compare(left: externref, right: externref): boolean

  // @ts-ignore
  @external("symbols", "save")
  export declare function save(value: externref): usize

  // @ts-ignore
  @external("symbols", "load")
  export declare function load(index: usize): externref

}

export function main(): boolean {
  const a = symbols.create()

  const i = symbols.save(a)

  const b = symbols.load(i)

  if (!symbols.compare(a, b))
    return false

  const c = symbols.create()

  if (symbols.compare(a, c))
    return false
  if (symbols.compare(b, c))
    return false

  return true
}