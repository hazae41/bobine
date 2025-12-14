import { blobref, blobs, modules, packs, refs, storage, symbolref, symbols } from "@hazae41/stdbob"

const sessions = new Set<usize>()

export function login(): symbolref {
  const session = symbols.create()

  sessions.add(refs.numerize(session))

  return session
}

export function verify(session: symbolref): bool {
  return sessions.has(refs.numerize(session))
}

export function keepmeloggedin(session: symbolref, module: blobref): void {
  if (!verify(session))
    throw new Error("Invalid session")

  storage.set(module, blobs.save(new ArrayBuffer(0)))

  return
}

export function logmeback(module: blobref): void {
  const allowed = storage.get(module)

  if (!allowed)
    throw new Error("No stored session")

  const session = symbols.create()

  sessions.add(refs.numerize(session))

  modules.call(module, blobs.save(String.UTF8.encode("onsession")), packs.create1(session))
}