// deno-lint-ignore-file no-cond-assign
import React, { JSX, useCallback, useEffect } from "react";
import { Outline } from "../../libs/heroicons/mod.ts";
import { delocalize, Localized } from "../../libs/locale/mod.ts";
import { Try } from "../../libs/messages/mod.ts";
import { ChildrenProps } from "../../libs/props/children/mod.ts";

React;

const Title = {
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

const Subtitle = {
  en: "An ultra-simple blockchain, verifiable without any ZK, and resistant to 50% attacks",
  zh: "一个超简单的区块链，无需任何零知识证明即可验证，并且能抵抗50%的攻击",
  hi: "एक अल्ट्रा-साधारण ब्लॉकचेन, बिना किसी ZK के सत्यापित किया जा सकता है, और 50% हमलों के प्रति प्रतिरोधी",
  es: "Una blockchain ultra simple, verificable sin ningún ZK, y resistente a ataques del 50%",
  ar: "بلوكشين بسيط للغاية، يمكن التحقق منه بدون أي ZK، ومقاوم لهجمات بنسبة 50٪",
  fr: "Une blockchain ultra-simple, vérifiable sans aucun ZK, et résistante aux attaques à 50%",
  de: "Eine ultra-einfache Blockchain, die ohne ZK verifizierbar ist und resistent gegen 50%-Angriffe ist",
  ru: "Ультра-простая блокчейн-система, проверяемая без каких-либо ZK и устойчивая к атакам на 50%",
  pt: "Uma blockchain ultra-simples, verificável sem qualquer ZK, e resistente a ataques de 50%",
  ja: "超シンプルなブロックチェーンで、ZKなしで検証可能で、50％の攻撃に耐性があります",
  pa: "ਇੱਕ ਅਲਟਰਾ-ਸਧਾਰਨ ਬਲੌਕਚੇਨ, ਬਿਨਾਂ ਕਿਸੇ ZK ਦੇ ਸੱਚਾਈਯੋਗ, ਅਤੇ 50% ਹਮਲਿਆਂ ਦੇ ਪ੍ਰਤੀਰੋਧੀ",
  bn: "একটি আল্ট্রা-সরল ব্লকচেইন, যেটি কোনও ZK ছাড়াই যাচাইযোগ্য, এবং ৫০% আক্রমণের বিরুদ্ধে প্রতিরোধী",
  id: "Sebuah blockchain yang sangat sederhana, dapat diverifikasi tanpa ZK apa pun, dan tahan terhadap serangan 50%",
  ur: "ایک الٹرا سادہ بلاک چین، بغیر کسی ZK کے قابل تصدیق، اور 50٪ حملوں کے خلاف مزاحم",
  ms: "Sebuah blockchain yang sangat mudah, boleh disahkan tanpa sebarang ZK, dan tahan terhadap serangan 50%",
  it: "Una blockchain ultra-semplice, verificabile senza alcun ZK, e resistente agli attacchi del 50%",
  tr: "Son derece basit bir blok zinciri, herhangi bir ZK olmadan doğrulanabilir ve %50 saldırılara karşı dirençlidir",
  ta: "ஒரு அற்புதமாக எளிய பிளாக்செயின், எந்த ZK இல்லாமல் சரிபார்க்கக்கூடியது, மற்றும் 50% தாக்குதல்களுக்கு எதிர்ப்பு கொண்டது",
  te: "అల్ట్రా-సింపుల్ బ్లాక్‌చెయిన్, ఏదైనా ZK లేకుండా నిర్ధారించదగినది, మరియు 50% దాడులకు ప్రతిఘటించగలదు",
  ko: "초간단 블록체인으로, 어떤 ZK 없이도 검증 가능하며 50% 공격에 저항할 수 있습니다",
  vi: "Một blockchain siêu đơn giản, có thể xác minh mà không cần ZK, và chống chịu được các cuộc tấn công 50%",
  pl: "Ultra-prosty blockchain, weryfikowalny bez żadnego ZK i odporny na ataki 50%",
  ro: "O blockchain ultra-simplă, verificabilă fără niciun ZK și rezistentă la atacuri de 50%",
  nl: "Een ultra-eenvoudige blockchain, verifieerbaar zonder enige ZK, en bestand tegen 50%-aanvallen",
  el: "Ένα εξαιρετικά απλό blockchain, επαληθεύσιμο χωρίς κανένα ZK και ανθεκτικό σε επιθέσεις 50%",
  th: "บล็อกเชนที่เรียบง่ายมาก สามารถตรวจสอบได้โดยไม่ต้องใช้ ZK ใดๆ และทนทานต่อการโจมตี 50%",
  cs: "Ultra jednoduchý blockchain, ověřitelný bez jakéhokoli ZK a odolný vůči útokům na 50%",
  hu: "Egy rendkívül egyszerű blokklánc, amely ZK nélkül is ellenőrizhető, és ellenáll a 50%-os támadásoknak",
  sv: "En ultrasimpel blockchain, verifierbar utan någon ZK, och motståndskraftig mot 50%-attacker",
  da: "En ultrasimpel blockchain, verificerbar uden nogen ZK, og modstandsdygtig over for 50%-angreb",
} satisfies Localized

export function App() {
  const f = useCallback(async (module: string) => {
    const asc = await import("assemblyscript/asc")

    const future = Promise.withResolvers<Uint8Array>()

    const { error } = await asc.main([
      "mod.ts",
      "--outFile", "mod.wasm",
      "--runtime", "stub",
      "--optimizeLevel", "3",
      "--enable", "reference-types"
    ], {
      stdout: {
        write(message: string) {
          console.log(message)
        }
      },
      stderr: {
        write(message: string) {
          console.error(message)
        }
      },
      listFiles() {
        console.log("listFiles")

        return ["mod.ts"]
      },
      async readFile(filename: string) {
        console.log("readFile", filename)

        if (filename === "mod.ts")
          return module

        let match: RegExpMatchArray | null = null

        if (match = filename.match(/^node_modules\/@\/libs\/(.*)$/))
          return await fetch(`/libs/${match[1]}`).then(res => res.text())

        return null
      },
      writeFile(filename: string, content: Uint8Array) {
        console.log("writeFile", filename)

        if (filename !== "mod.wasm")
          return
        future.resolve(content)
      }
    })

    if (error != null)
      future.reject(new Error(error.message))

    return await future.promise
  }, [])

  useEffect(() => void f(`
    import { bigintref, bigints } from "@/libs/bigints/mod.ts"
    import { blobs } from "@/libs/blobs/mod.ts"
    import { storage } from "@/libs/storage/mod.ts"

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
  `).then(console.log).catch(console.error), [])

  return <div className="p-safe h-full w-full flex flex-col overflow-y-scroll animate-opacity-in">
    <div className="p-4 h-[max(24rem,100dvh-16rem)] flex-none flex flex-col items-center">
      <div className="grow" />
      <div className="text-center text-6xl font-medium">
        {delocalize(Title)}
      </div>
      <div className="h-4" />
      <div className="text-center text-default-contrast text-2xl">
        {delocalize(Subtitle)}
      </div>
      <div className="grow" />
      <div className="flex items-center">
        <ClickableOppositeAnchor>
          <Outline.BoltIcon className="size-5" />
          {delocalize(Try)}
        </ClickableOppositeAnchor>
      </div>
      <div className="grow" />
    </div>
  </div>
}

export function ClickableOppositeAnchor(props: ChildrenProps & JSX.IntrinsicElements["a"] & { "aria-disabled"?: boolean }) {
  const { children, "aria-disabled": disabled = false, ...rest } = props

  return <a className="group po-2 bg-opposite text-opposite rounded-xl outline-none aria-[disabled=false]:hover:bg-opposite-double-contrast focus-visible:outline-opposite aria-disabled:opacity-50 transition-opacity"
    aria-disabled={disabled}
    {...rest}>
    <GapperAndClickerInAnchorDiv>
      {children}
    </GapperAndClickerInAnchorDiv>
  </a>
}

export function GapperAndClickerInAnchorDiv(props: ChildrenProps) {
  const { children } = props

  return <div className="h-full w-full flex justify-center items-center gap-2 group-aria-[disabled=false]:group-active:scale-90 transition-transform">
    {children}
  </div>
}