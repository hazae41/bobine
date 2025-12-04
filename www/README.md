# Starter

Start a cool webapp with React and Tailwind

## Features

- Built on web standards and fundamentals
- Works with any client-side and/or static-side library (e.g. React, jQuery)
- Focused on security and simplicity without degrading performances
- Supply-chain hardened with the bare minimum dependencies
- Built for Deno but backward compatible with Node/Bun
- Deploy it anywhere HTML/CSS/JS files can be stored
- Builds are cross-platform cross-runtime reproducible
- Immutably cached with a 1-year cached service worker

## Stack

- `deno` for the runtime
- `react` and `react-dom` for rendering
- `tailwindcss` via `@hazae41/rewind` and `@hazae41/labase` for the styles
- `esbuild` via `@hazae41/glace` for bundling
- `@hazae41/immutable` for immutable caching

## Setup

### Development

Install Deno

```bash
npm install -g deno
```

Clone this repository

```bash
git clone https://github.com/hazae41/starter.git && cd ./starter && rm -rf ./.git && git init
```

Install

```bash
deno install
```

Develop

```bash
deno task develop
```

### Vercel

Just setup the build command

```bash
deno task examine && deno task prepack
```

The output directory

```path
./out
```

The install command

```bash
npm install -g deno && deno install
```

## Usage

- Develop

```bash
deno task develop
```


- Test

```bash
deno task examine
```


- Build

```bash
deno task prepack
```

- Serve

```bash
deno task produce
```

- Install new package

```bash
npm install [-D] <package>
```