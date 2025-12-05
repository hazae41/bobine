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

const Motto = {
  en: "Your neighbor's blockchain",
  zh: "你邻居的区块链",
  hi: "आपके पड़ोसी का ब्लॉकचेन",
  es: "La blockchain de tu vecino",
  ar: "بلوكشين جارك",
  fr: "Une blockchain chez ton voisin",
  de: "Die Blockchain deines Nachbarn",
  ru: "Блокчейн вашего соседа",
  pt: "A blockchain do seu vizinho",
  ja: "あなたの隣人のブロックチェーン",
  pa: "ਤੁਹਾਡੇ ਪੜੋਸੀ ਦਾ ਬਲੌਕਚੇਨ",
  bn: "আপনার প্রতিবেশীর ব্লকচেইন",
  id: "Blockchain tetangga Anda",
  ur: "آپ کے پڑوسی کا بلاک چین",
  ms: "Rantai blok jiran anda",
  it: "La blockchain del tuo vicino",
  tr: "Komşunuzun blok zinciri",
  ta: "உங்கள் அயலவர் பிளாக்செயின்",
  te: "మీ పొరుగువారి బ్లాక్‌చెయిన్",
  ko: "이웃의 블록체인",
  vi: "Chuỗi khối của hàng xóm bạn",
  pl: "Blockchain twojego sąsiada",
  ro: "Blockchain vecinului tău",
  nl: "De blockchain van je buurman",
  el: "Το blockchain του γείτονά σας",
  th: "บล็อกเชนของเพื่อนบ้านของคุณ",
  cs: "Blockchain vašeho souseda",
  hu: "A szomszédod blokklánca",
  sv: "Din grannes blockchain",
  da: "Din nabos blockchain",
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
    {delocalize(HelloWorld)}
  </div>
}