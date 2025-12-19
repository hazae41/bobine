# Bobine

A blockchain in your garage

```bash
npm install -g @hazae41/bobine
```

[**🌐 Website**](https://bobine.tech/) • [**📦 NPM**](https://www.npmjs.com/package/@hazae41/bobine)

## Features

- Ultra simple
- WebAssembly modules
- Based on web technologies
- Resistant to 50% attacks
- Account* abstraction
- Verifiable without ZK

\* There are no built-in accounting concepts, only pure generic APIs for cryptography and storage

## Usage

### Running the server

Install the binary with Deno

```bash
deno install -gf -A npm:@hazae41/bobine
```

Generate an Ed25519 keypair by running the following code in your browser/deno/node/bun console

```typescript
const keypair = await crypto.subtle.generateKey("Ed25519", true, ["sign", "verify"])

const privateKey = await crypto.subtle.exportKey("pkcs8", keypair.privateKey)

const publicKey = await crypto.subtle.exportKey("raw", keypair.publicKey)

console.log(`ED25519_PRIVATE_KEY_HEX=${new Uint8Array(privateKey).toHex()}`)

console.log(`ED25519_PUBLIC_KEY_HEX=${new Uint8Array(publicKey).toHex()}`)
```

Create an `.env.local` file and replace your Ed25519 values

```env
DATABASE_PATH=./local/database.db

SCRIPTS_PATH=./local/scripts

ED25519_PRIVATE_KEY_HEX=302e020100300506032b657004220420edff8b2503b91f58bc0f0435ca17de549f89d6a7cde4c277161e031669395005
ED25519_PUBLIC_KEY_HEX=90dcd81a473a4e59a84df6cb8f77af3d34c7fd6171ed959ca04a75f07a57b4b9
```

Run the server

```bash
bobine serve --env=./.env.local
```

Or you can install `@hazae41/bobine` and use the `serve()` function

### Making your own module

You can clone my [AssemblyScript starter](https://github.com/hazae41/create-bobine-assemblyscript-module) to get started with AssemblyScript

### Using the HTTP API

#### POST /api/create

Creates a new module using some WebAssembly code and some unique salt

Accepts a form data with the following fields

- `code` as bytes = your WebAssembly code (your .wasm file)

- `salt` as bytes = some bytes (any length, can be 0) that will be hashed with your code to produce your module address

- `effort` as bytes = some unique 32 bytes whose sha256 `hash` validates `((2n ** 256n) / BigInt("0x" + hash.toHex())) > (code.length + salt.length)`

#### POST /api/execute

Execute some function on a module

Accepts a form data with the following fields

- `module` as string = your module address (32-bytes hex)

- `method` as string = WebAssembly function to be executed

- `params` as bytes = WebAssembly function parameters as pack-encoded bytes (see pack encoding below)

- `effort` as bytes =  some unique 32 bytes whose sha256 `hash` whose result in `((2n ** 256n) / BigInt("0x" + hash.toHex()))` will be the maximum number of sparks (gas) used

#### POST /api/simulate

Simulate some function on a module (it won't write anything to storage and will execute in mode `2` so verifications such as signatures can be skipped)

Accepts a form data with the following fields

- `module` as string = your module address (32-bytes hex)

- `method` as string = WebAssembly function to be executed

- `params` as bytes = WebAssembly function parameters as pack-encoded bytes (see pack encoding below)

- `effort` as bytes =  some unique 32 bytes whose sha256 `hash` whose result in `((2n ** 256n) / BigInt("0x" + hash.toHex()))` will be the maximum number of sparks (gas) used

### Using the WebAssembly API

The WebAssembly VM extensively uses reference types for its API and for module-to-module communication

#### Using the WebAssembly API via AssemblyScript

You can use [stdbob](https://github.com/hazae41/stdbob) to easily import AssemblyScript declarations for all internal modules

Or you can declare internal modules manually with the module name and method name

```tsx
@external("bigints", "add")
declare function add(x: externref, y: externref): externref
```

And you can declare external modules by using the module address as hex

```tsx
@external("5feeee846376f6436990aa2757bc67fbc4498bcc9993b647788e273ad6fde474", "add")
declare function add(x: externref, y: externref): externref
```

#### Blobs module

You can pass bytes between modules by storing them in the blob storage and loading them via reference

#### BigInts module

You can work with infinite-precision bigints and convert them with blobs and texts

And many others

#### Packs module

You can pack various arguments (numbers, refs) into a pack which can be passed between modules and/or encoded/decoded into bytes

#### Environment module

Get infos about the executing environment

#### Modules module

Modules are identified by their address as a blob of bytes (pure sha256-output 32-length bytes without any encoding)

You can dynamically create modules, call modules, get their bytecode 

#### Storage module

You can use a private key-value storage (it works like storage and events at the same time)

#### SHA-256 module

Use the SHA-256 hashing algorithm

#### Ed25519 module

Use the Ed25519 signing algorithm to verify any signature and (experimentally) sign payload using the miner's private key

#### Symbols module (experimental)

Create unique references that can be passed around

#### References module (experimental)

Translate any reference into a unique private pointer that can be stored into data structures

This can be useful if you want to check a reference for authenticity

```tsx
const sessions = new Set<i32>()

export function login(password: blobref): symbolref {
  const session = symbols.create()  

  sessions.put(symbols.numerize(session))

  return session
}

export function verify(session: symbolref) {
  return sessions.has(symbols.numerize(session))
}
```

You should never accept a pointer instead of a real reference because they can be easily guessed by an attacking module
