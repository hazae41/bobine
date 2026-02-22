# Getting started

## Start the server

### Terminally

Install Deno

```bash
npm install -g deno
```

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

### Programmatically

Or you can install `@hazae41/bobine` and use the `serve()` function

## Making your own module

You can clone my [AssemblyScript starter](https://github.com/hazae41/create-bobine-assemblyscript-module) to get started with AssemblyScript