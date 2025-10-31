export function hello(x: string): string {
  return `Hello, ${x}!`
}

export function main(): void {
  console.log(`${hello("import")}`)
}