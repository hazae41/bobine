# Bobine

A blockchain in your garage

https://bobine.tech/

[**📦 NPM**](https://www.npmjs.com/package/@hazae41/bobine) • [**📦 JSR**](https://jsr.io/@hazae41/bobine)

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

#### Running the server via binary

Install the binary with Deno

```bash
deno install -gf -A jsr:@hazae41/bobine
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

#### Running the server via library

Install `@hazae41/bobine` and use the `serve()` function

### Creating a module

#### Creating a module via binary

Install the binary with Deno

```bash
deno install -gf -A jsr:@hazae41/bobine
```

Deploy your .wasm file

```bash
bobine create ./module.wasm --server=http://localhost:8080
```

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

- `blobs.save(offset: i32, length: i32): blobref` = save `length` bytes at `offset` of your memory to the blob storage

- `blobs.load(blob: blobref, offset: i32): void` = load some blob into your memory at `offset`

- `blobs.equals(left: blobref, right: blobref): bool` = check if two blobs are equals without loading them into memory

- `blobs.concat(left: blobref, right: blobref): blobref` = concatenate two blobs without loading them into memory

- `blob.to_hex/from_hex/to_base64/from_base64(blob: blobref): blobref` = convert blobs to/from hex/base64 without loading them into memory

#### BigInts module

You can work with infinite-precision bigints

- `bigints.add(left: bigintref, right: bigintref): bigintref` = add two bigints

- `bigints.sub(left: bigintref, right: bigintref): bigintref` = subtract two bigints

- `bigints.mul(left: bigintref, right: bigintref): bigintref` = multiply two bigints

- `bigints.div(left: bigintref, right: bigintref): bigintref` = divide two bigints

- `bigints.pow(left: bigintref, right: bigintref): bigintref` = left ** right

- `bigints.encode(bigint: bigintref): blobref` = convert bigint to bytes

- `bigints.decode(base16: blobref): bigintref` = convert bytes to bigint

- `bigints.to_base16(bigint: bigintref): blobref` = convert bigint to hex utf8 bytes

- `bigints.from_base16(base16: blobref): bigintref` = convert hex utf8 bytes to bigint

- `bigints.to_base10(bigint: bigintref): blobref` = convert bigint to base10 utf8 bytes

- `bigints.from_base10(base16: blobref): bigintref` = convert base10 utf8 bytes to bigint

#### Packs module

You can pack various arguments (numbers, refs) into a pack which can be passed between modules and/or encoded/decoded into bytes

- `packs.create(...values: any[]): packref` = create a new pack from the provided values (number, blobref, packref, null)

- `packs.encode(pack: packref): blobref` = encodes values into bytes using the following pseudocode

```tsx
function writePack(pack: packref) {
  for (const value of values) {
    if (isNull(value)) {
      writeUint8(1)
      continue
    }

    if (isNumber(value)) {
      writeUint8(2)
      writeFloat64(value, "little-endian")
      continue
    }
    
    if (isBigInt(value)) {
      writeUint8(3)
      writeUint32(value.toHex().length, "little-endian")
      writeBytes(value.toHex())
      continue
    }

    if (isBlobref(value)) {
      writeUint8(4)
      writeUint32(value.length, "little-endian")
      writeBytes(value)
      continue
    }

    if (isPackref(value)) {
      writeUint8(5)
      writePack(value)
      continue
    }

    throw new Error()
  }

  writeUint8(0)
}
```

- `packs.decode(blob: blobref): packref` = decodes bytes into a pack of values using the same pseudocode but for reading

- `packs.concat(left: packref, right: packref)` = concatenate two packs into one (basically does `[...left, ...right]`)

- `packs.get<T>(pack: packref, index: i32): T` = get the value of a pack at `index` (throws if not found)

- `packs.length(pack: packref): i32` = get the length of a pack

#### Environment module

Get infos about the executing environment

- `env.mode: i32` = `1` if execution, `2` is simulation

- `env.uuid(): blobref` = get the unique uuid of this environment (similar to a chain id)

#### Modules module

Modules are identified by their address as a blob of bytes (pure sha256-output 32-length bytes without any encoding)

- `modules.load(module: blobref): blobref` = get the code of module as a blob

- `modules.call(module: blobref, method: blobref, params: packref): packref` = dynamically call a module method with the given params as pack and return value as a 1-length pack

- `modules.create(code: blobref, salt: blobref): blobref` = dynamically create a new module with the given code and salt, returns the module address

- `modules.self(): blobref` = get your module address as blob

#### Storage module

You can use a private storage (it works like storage and events at the same time)

- `storage.set(key: blobref, value: blobref): void` = set some value to storage at key

- `storage.get(key: blobref): blobref` = get the latest value from storage at key

#### SHA-256 module

Use the SHA-256 hashing algorithm

- `sha256.digest(payload: blobref): blobref` = hash the payload and returns the digest

#### Ed25519 module

Use the Ed25519 signing algorithm

- `ed25519.verify(pubkey: blobref, signature: blobref, payload: blobref): boolean` = verify a signature

- `ed25519.sign(payload: blobref): blobref` = (experimental) sign payload using the miner's private key

#### Symbols module (experimental)

- `symbols.create(): symbolref` = create a unique reference that can be passed around

#### References module (experimental)

- `refs.numerize(ref: symbolref/blobref/packref): i32` = translate any reference into a unique private pointer that can be stored into data structures

- `refs.denumerize(pointer: i32): symbolref/blobref/packref` = get the exact same reference back from your private pointer 

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
