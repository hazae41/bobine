// @ts-ignore: decorator
@external("sender")
declare function sender(): string

export function balanceOf(_address: string): number {
  return 1000
}

export function transfer(_target: string, amount: number): void {
  const _ = balanceOf(sender()) - amount
}





