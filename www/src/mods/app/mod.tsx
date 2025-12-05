// deno-lint-ignore-file no-cond-assign
import React, { useCallback, useEffect } from "react";
import { delocalize, Localized } from "../../libs/locale/mod.ts";

React;

const Motto = {
  en: "A blockchain in your garage",
  zh: "你车库里的区块链",
  hi: "आपके गैराज में एक ब्लॉकचेन",
  es: "Una blockchain en tu garaje",
  ar: "بلوكشين في المرآب الخاص بك",
  fr: "Une blockchain dans ton garage",
  de: "Eine Blockchain in deiner Garage",
  ru: "Блокчейн в вашем гараже",
  pt: "Uma blockchain na sua garagem",
  ja: "あなたのガレージにあるブロックチェーン",
  pa: "ਗੈਰੇਜ ਵਿੱਚ ਇੱਕ ਬਲੌਕਚੇਨ",
  bn: "আপনার গ্যারেজে একটি ব্লকচেইন",
  id: "Sebuah blockchain di garasi Anda",
  ur: "آپ کے گیراج میں ایک بلاک چین",
  ms: "Sebuah blockchain di garaj anda",
  it: "Una blockchain nel tuo garage",
  tr: "Garajınızda bir blok zinciri",
  ta: "உங்கள் கேரேஜில் ஒரு பிளாக்செயின்",
  te: "మీ గ్యారేజీలో ఒక బ్లాక్‌చెయిన్",
  ko: "당신의 차고에 있는 블록체인",
  vi: "Một blockchain trong ga ra của bạn",
  pl: "Blockchain w twoim garażu",
  ro: "O blockchain în garajul tău",
  nl: "Een blockchain in je garage",
  el: "Ένα blockchain στο γκαράζ σας",
  th: "บล็อกเชนในโรงรถของคุณ",
  cs: "Blockchain ve vaší garáži",
  hu: "Egy blokklánc a garázsodban",
  sv: "En blockchain i ditt garage",
  da: "En blockchain i dit garage",
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
    import { bigintref, bigints } from "@/libs/bigints/mod"
    import { blobs } from "@/libs/blobs/mod.ts"
    import { storage } from "@/libs/storage/mod"

    export function add(): bigintref {
      const key = blobs.save(String.UTF8.encode("counter"))

      const val = storage.get(key)

      if (!val) {
        const fresh = bigints.one()

        storage.set(key, bigints.encode(fresh))

        return fresh
      }

      const stale = bigints.decode(val)

      const fresh = bigints.inc(stale)

      storage.set(key, bigints.encode(fresh))

      return fresh
    }
  `).then(console.log), [])

  return <div className="text-2xl font-sans">
    {delocalize(Motto)}
  </div>
}