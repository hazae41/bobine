# Bobine

WebAssembly-based metered chain of compute

```bash
npm install @hazae41/bobine
```

[**📦 NPM**](https://www.npmjs.com/package/@hazae41/bobine)

## Ecosystem

- [Awesome Bobine](https://github.com/hazae41/awesome-bobine) / A curated list on Bobine ecosystem

## Usage

```tsx
const runner = await Runner.setup("c00c3fb2-36d4-42af-aaa7-4b30b22259a0", "./data")

const target = await runner.create(readFileSync("./program.wasm"))

const { logs, result, sparks } = await runner.execute(target, "main", ["Hello world"], 100n)

for (const log of logs)
  console.log(log)

console.log(result)
console.log(sparks)
```