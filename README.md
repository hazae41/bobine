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

### blobs

You can pass bytes between modules by storing them in the blob storage and loading them via reference

- `blobs.save(offset: u32, length: u32): blobref` = save `length` bytes at `offset` of your memory to the blob storage

- `blobs.load(blob: blobref, offset: u32): void` = load some blob into your memory at `offset`

- `blobs.equals(left: blobref, right: blobref): bool` = check if two blobs are equals without loading them into memory

- `blobs.concat(left: blobref, right: blobref): blobref` = concatenate two blobs without loading them into memory

- `blob.to_hex/from_hex/to_base64/from_base64(blob: blobref): blobref` = convert blobs to/from hex/base64 without loading them into memory

### packs

You can pack various arguments (numbers, refs) into a pack which can be passed between modules and/or encoded/decoded into bytes

- `packs.create(...values: any[]): packref` = create a new pack from the provided values (number, blobref, packref, null)

- `packs.encode(pack: packref): blobref` = encodes values into bytes using the following pseudocode

```tsx
function writePack(pack: packref) {
  for (const value of values) {
    if (value == null) {
      writeUint8(1)
      continue
    }

    if (typeof value === "number") {
      writeUint8(2)
      writeInt32(value, "little-endian")
      continue
    }
    
    if (typeof value === "bigint") {
      writeUint8(3)
      writeInt64(value, "little-endian")
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

    writeUint8(1) // anything else if encoded as null
    continue
  }

  writeUint8(0)
}
```

- `packs.decode(blob: blobref): packref` = decodes bytes into a pack of values using the same pseudocode but for reading

- `packs.concat(left: packref, right: packref)` = concatenate two packs into one (basically does `[...left, ...right]`)

- `packs.get<T>(pack: packref, index: u32): T` = get the value of a pack at `index` (throws if not found)

### env

Get infos about the executing environment

- `env.mode: u32` = `1` if execution, `2` is simulation

- `env.uuid(): blobref` = get the unique uuid of this environment (similar to a chain id)

###