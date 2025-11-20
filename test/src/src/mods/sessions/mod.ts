import { blobref, blobs } from "../../libs/blobs/mod";
import { console } from "../../libs/console/mod";
import { refs } from "../../libs/externs/mod";
import { modules } from "../../libs/modules/mod";
import { packref } from "../../libs/packs/mod";
import { symbolref } from "../../libs/symbols/mod";

// @ts-ignore
@external("a6d74837aa9d121e7d518842ee6d5e2fb36fec7652fc9c500c1fcc593f014570", "login")
declare function session_login(): symbolref

// @ts-ignore
@external("a6d74837aa9d121e7d518842ee6d5e2fb36fec7652fc9c500c1fcc593f014570", "verify")
declare function session_verify(session: symbolref): bool

// @ts-ignore
@external("a6d74837aa9d121e7d518842ee6d5e2fb36fec7652fc9c500c1fcc593f014570", "keepmeloggedin")
declare function session_keepmeloggedin(session: symbolref, module: blobref): void

// @ts-ignore
@external("a6d74837aa9d121e7d518842ee6d5e2fb36fec7652fc9c500c1fcc593f014570", "logmeback")
declare function session_logmeback(module: blobref): void

const sessions = new Set<usize>();

export function onsession(session: packref): void {
  sessions.add(refs.numerize(session));
}

export function login(): void {
  session_keepmeloggedin(session_login(), modules.self())
}

export function logmeback(): void {
  session_logmeback(modules.self())

  const session = refs.denumerize(sessions.values().at(0))

  session_verify(session)

  console.log(blobs.save(String.UTF8.encode("Logged back in successfully")))
}