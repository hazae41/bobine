import { refs, symbols } from "@hazae41/stdbob"

export function main(): bool {
  const a = symbols.create(), ia = refs.numerize(a)

  const b = refs.denumerize(ia), ib = refs.numerize(b)

  if (ia !== ib)
    return false

  const c = symbols.create(), ic = refs.numerize(c)

  if (ia === ic)
    return false
  if (ib === ic)
    return false

  return true
}