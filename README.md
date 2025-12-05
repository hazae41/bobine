# Bobine

Your neighbor's chain of compute

## HTTP API

### POST /api/create

Creates a new module using some WebAssembly code and some unique salt

Accepts a form data with the following fields

- `code` as bytes = your WebAssembly code (your .wasm file)

- `salt` as bytes = some bytes (any length, can be 0) that will be hashed with your code to produce your module address

- `effort` as bytes = some unique 32 bytes whose sha256 `hash` validates `((2n ** 256n) / BigInt("0x" + hash.toHex())) > (code.length + salt.length)`

### POST /api/execute

Execute some function on a module

Accepts a form data with the following fields

- `module` as string = your module address (32-bytes hex)

- `method` as string = WebAssembly function to be executed

- `params` as bytes = WebAssembly function parameters as pack-encoded bytes (see pack encoding below)

- `effort` as bytes =  some unique 32 bytes whose sha256 `hash` whose result in `((2n ** 256n) / BigInt("0x" + hash.toHex()))` will be the maximum number of sparks (gas) used

### POST /api/simulate

Simulate some function on a module (it won't write anything to storage and will execute in mode `2` so verifications such as signatures can be skipped)

Accepts a form data with the following fields

- `module` as string = your module address (32-bytes hex)

- `method` as string = WebAssembly function to be executed

- `params` as bytes = WebAssembly function parameters as pack-encoded bytes (see pack encoding below)

- `effort` as bytes =  some unique 32 bytes whose sha256 `hash` whose result in `((2n ** 256n) / BigInt("0x" + hash.toHex()))` will be the maximum number of sparks (gas) used

## WebAssembly API

### <module>

You can use any module method by using the module address as hex

```tsx
@external("5feeee846376f6436990aa2757bc67fbc4498bcc9993b647788e273ad6fde474", "add")
declare function add(x: i32, y: i32): i32
```

### blobs

You can pass bytes between modules by storing them in the blob storage and loading them via reference

- `blobs.save(offset: i32, length: i32): blobref` = save `length` bytes at `offset` of your memory to the blob storage

- `blobs.load(blob: blobref, offset: i32): void` = load some blob into your memory at `offset`

- `blobs.equals(left: blobref, right: blobref): bool` = check if two blobs are equals without loading them into memory

- `blobs.concat(left: blobref, right: blobref): blobref` = concatenate two blobs without loading them into memory

- `blob.to_hex/from_hex/to_base64/from_base64(blob: blobref): blobref` = convert blobs to/from hex/base64 without loading them into memory

### bigints

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

### packs

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

### env

Get infos about the executing environment

- `env.mode: i32` = `1` if execution, `2` is simulation

- `env.uuid(): blobref` = get the unique uuid of this environment (similar to a chain id)

### modules

Modules are identified by their address as a blob of bytes (pure sha256-output 32-length bytes without any encoding)

- `modules.load(module: blobref): blobref` = get the code of module as a blob

- `modules.call(module: blobref, method: blobref, params: packref): packref` = dynamically call a module method with the given params as pack and return value as a 1-length pack

- `modules.create(code: blobref, salt: blobref): blobref` = dynamically create a new module with the given code and salt, returns the module address

- `modules.self(): blobref` = get your module address as blob

### storage

You can use a private storage (it works like storage and events at the same time)

- `storage.set(key: blobref, value: blobref): void` = set some value to storage at key

- `storage.get(key: blobref): blobref` = get the latest value from storage at key

### sha256

Use the SHA-256 hashing algorithm

- `sha256.digest(payload: blobref): blobref` = hash the payload and returns the digest

### ed25519

Use the Ed25519 signing algorithm

- `ed25519.verify(pubkey: blobref, signature: blobref, payload: blobref): boolean` = verify a signature

- `ed25519.sign(payload: blobref): blobref` = (experimental) sign payload using the miner's private key

### symbols (experimental)

- `symbols.create(): symbolref` = create a unique reference that can be passed around

### refs (experimental)

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