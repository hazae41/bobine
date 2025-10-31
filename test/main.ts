// @ts-ignore: decorator
@external("./2fe1bdbc44fe75ef7411d88d3c53bfb576cfbada762e0e89270d6bc5f6aa7fb1.wat", "hello")
declare function hello(x: string): string

export function main(): void {
  console.log(`${hello("main")}`)
}