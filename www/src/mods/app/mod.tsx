// deno-lint-ignore-file no-cond-assign
import React, { useCallback, useEffect } from "react";
import { delocalize, Localized } from "../../libs/locale/mod.ts";

React;

const HelloWorld = {
  en: "Hello world",
  zh: "你好，世界",
  hi: "नमस्ते दुनिया",
  es: "Hola mundo",
  ar: "مرحبا بالعالم",
  fr: "Bonjour le monde",
  de: "Hallo Welt",
  ru: "Привет, мир",
  pt: "Olá mundo",
  ja: "こんにちは世界",
  pa: "ਹੈਲੋ ਵਰਲਡ",
  bn: "হ্যালো ওয়ার্ল্ড",
  id: "Halo dunia",
  ur: "ہیلو ورلڈ",
  ms: "Hai dunia",
  it: "Ciao mondo",
  tr: "Merhaba dünya",
  ta: "ஹலோ வேர்ல்ட்",
  te: "హలో వరల్డ్",
  ko: "안녕하세요 세계",
  vi: "Xin chào thế giới",
  pl: "Witaj świecie",
  ro: "Salut lume",
  nl: "Hallo wereld",
  el: "Γειά σου κόσμε",
  th: "สวัสดีชาวโลก",
  cs: "Ahoj světe",
  hu: "Helló világ",
  sv: "Hej världen",
  da: "Hej verden",
} satisfies Localized

export function App() {
  const f = useCallback(async (module: string) => {
    const asc = await import("assemblyscript/asc")

    const future = Promise.withResolvers<Uint8Array>()

    await asc.main([
      "mod.ts",
      "--outFile", "mod.wasm",
      "--runtime", "stub",
      "--optimizeLevel", "3",
      "--enable", "reference-types"
    ], {
      listFiles() {
        return ["mod.ts"]
      },
      async readFile(filename: string) {
        if (filename === "mod.ts")
          return module

        let match: RegExpMatchArray | null = null

        if (match = filename.match(/^node_modules\/@\/libs\/(.*)$/))
          return await fetch(`/libs/${match[1]}`).then(res => res.text())

        return null
      },
      writeFile(filename: string, content: Uint8Array) {
        if (filename !== "mod.wasm")
          return
        future.resolve(content)
      }
    })

    return await future.promise
  }, [])

  useEffect(() => void f(`
    import { blobref, blobs } from "@/libs/blobs/mod.ts"
    import { packref, packs } from "@/libs/packs/mod.ts"

    namespace counter {

      export function get(): bigintref {
        const result = storage.get(packs.encode(packs.create2(blobs.save(String.UTF8.encode("nonce")), address)))

        if (!result)
          return 0

        return packs.get<u64>(packs.decode(result), 0)
      }

      export function set(address: blobref, amount: u64): void {
        storage.set(packs.encode(packs.create2(blobs.save(String.UTF8.encode("nonce")), address)), packs.encode(packs.create1(amount)))
      }

    }

    export function get(): bigintref {

    }

    export function add(): void {
      return a + b;
    }

  `).then(console.log), [])

  return <div className="text-2xl font-sans">
    {delocalize(HelloWorld)}
  </div>
}