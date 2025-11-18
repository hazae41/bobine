import { symbols } from "../../libs/symbols/mod"

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