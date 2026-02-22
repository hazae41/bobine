# Using the WebAssembly API

## AssemblyScript

### Internal modules

The WebAssembly VM has built-in modules to help with various types (bytes, strings, numbers, modules, ...)

#### Helper

You can use [stdbob](https://github.com/hazae41/stdbob) to easily import AssemblyScript declarations for all internal modules

#### Manual

Or you can declare internal modules manually with the module name and method name

```tsx
@external("bigints", "add")
declare function add(x: externref, y: externref): externref
```

### External modules

And you can declare external modules by using the module address as hex

```tsx
@external("5feeee846376f6436990aa2757bc67fbc4498bcc9993b647788e273ad6fde474", "add")
declare function add(x: externref, y: externref): externref
```