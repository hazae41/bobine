/// <reference types="@/libs/bytes/lib.d.ts"/>

import hljs from "highlight.js/lib/core";

// @deno-types="npm:highlight.js"
import typescript from "highlight.js/lib/languages/typescript";

// @deno-types="npm:highlight.js"
import rust from "highlight.js/lib/languages/rust";

import { RpcRequest, RpcResponse, RpcResponseInit } from "@hazae41/jsonrpc";
import React, { JSX, useCallback, useEffect, useState } from "react";
import { Outline } from "../../libs/heroicons/mod.ts";
import { hexdump } from "../../libs/hexdump/mod.ts";
import { delocalize, Localized } from "../../libs/locale/mod.ts";
import { ChildrenProps } from "../../libs/props/children/mod.ts";

hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("rust", rust);

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
  // const f = useCallback(async (module: string) => {
  //   const asc = await import("assemblyscript/asc")

  //   const future = Promise.withResolvers<Uint8Array>()

  //   const { error } = await asc.main([
  //     "mod.ts",
  //     "--outFile", "mod.wasm",
  //     "--runtime", "stub",
  //     "--optimizeLevel", "3",
  //     "--enable", "reference-types"
  //   ], {
  //     stdout: {
  //       write(message: string) {
  //         console.log(message)
  //       }
  //     },
  //     stderr: {
  //       write(message: string) {
  //         console.error(message)
  //       }
  //     },
  //     listFiles() {
  //       console.log("listFiles")

  //       return ["mod.ts"]
  //     },
  //     async readFile(filename: string) {
  //       console.log("readFile", filename)

  //       if (filename === "mod.ts")
  //         return module

  //       let match: RegExpMatchArray | null = null

  //       if (match = filename.match(/^node_modules\/@\/libs\/(.*)$/))
  //         return await fetch(`/libs/${match[1]}`).then(res => res.text())

  //       return null
  //     },
  //     writeFile(filename: string, content: Uint8Array) {
  //       console.log("writeFile", filename)

  //       if (filename !== "mod.wasm")
  //         return
  //       future.resolve(content)
  //     }
  //   })

  //   if (error != null)
  //     future.reject(new Error(error.message))

  //   return await future.promise
  // }, [])

  // useEffect(() => void f(`
  //   import { bigintref, bigints } from "@/libs/bigints/mod.ts"
  //   import { blobs } from "@/libs/blobs/mod.ts"
  //   import { storage } from "@/libs/storage/mod.ts"

  //   export function add(): bigintref {
  //     const key = blobs.save(String.UTF8.encode("counter"))

  //     const val = storage.get(key)

  //     if (!val) {
  //       const fresh = bigints.one()

  //       storage.set(key, bigints.encode(fresh))

  //       return fresh
  //     }

  //     const stale = bigints.decode(val)

  //     const fresh = bigints.inc(stale)

  //     storage.set(key, bigints.encode(fresh))

  //     return fresh
  //   }
  // `).then(console.log).catch(console.error), [])

  return <div className="h-full w-full flex flex-col overflow-y-scroll animate-opacity-in">
    <div className="w-full flex justify-center">
      <img className="h-[40dvh] rotate-180" src="/engie.png" />
    </div>
    <div className="p-safe">
      <div className="p-4 flex-none flex flex-col items-center">
        <div className="text-center text-6xl font-medium">
          {delocalize(Title)}
        </div>
        <div className="h-4" />
        <div className="text-center text-default-contrast text-2xl">
          {delocalize(Subtitle)}
        </div>
        <div className="h-16" />
        <Outline.ChevronDownIcon className="size-6 text-default-half-contrast" />
        <div className="h-[max(24rem,50dvh)]" />
        <div className="text-center text-6xl font-medium">
          {"Embracing WebAssembly"}
        </div>
        <div className="h-4" />
        <div className="text-center text-default-contrast text-2xl">
          {"You can write modules in any language that compiles to WebAssembly"}
        </div>
        <div className="h-16" />
        <div className="w-full max-w-[600px] flex flex-col">
          <div className="p-4">
            <div className="text-2xl font-medium">
              counter.wasm
            </div>
            <div className="h-2" />
            <div className="text-default-contrast">
              {"WebAssembly"}
            </div>
          </div>
          <div className="bg-default-contrast rounded-xl p-4 pe-2">
            <div className="h-[400px] overflow-y-scroll whitespace-pre-wrap font-mono">
              {hexdump}
            </div>
          </div>
        </div>
        <div className="h-[max(24rem,50dvh)]" />
        <div className="text-center text-6xl font-medium">
          {"No extra tooling required"}
        </div>
        <div className="h-4" />
        <div className="text-center text-default-contrast text-2xl">
          {"Just upload any .wasm file, and execute any exported function"}
        </div>
        <div className="h-16" />
        <div className="w-full flex flex-wrap justify-center gap-16">
          <div className="w-full max-w-[600px] flex flex-col">
            <div className="p-4">
              <div className="text-2xl font-medium">
                counter.ts
              </div>
              <div className="h-2" />
              <div className="text-default-contrast">
                {"AssemblyScript"}
              </div>
            </div>
            <div className="h-full w-full bg-default-contrast rounded-xl p-4">
              <Code language="typescript">
                {`import { bigintref, bigints } from "@/libs/bigints/mod.ts"
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
}`}
              </Code>
            </div>
          </div>
          <div className="w-full max-w-[600px] flex flex-col">
            <div className="p-4">
              <div className="text-2xl font-medium">
                counter.rs
              </div>
              <div className="h-2" />
              <div className="text-default-contrast">
                {"Rust"}
              </div>
            </div>
            <div className="h-full w-full bg-default-contrast rounded-xl p-4">
              <Code language="rust">
                {`use stdbob::{bigints, blobs, storage};

#[no_mangle]
pub extern "C" fn add() -> bigints::BigIntRef {
    let key = blobs::save("counter".as_bytes());

    let val = storage::get(&key);

    if val.is_none() {
        let fresh = bigints::one();

        storage::set(&key, &bigints::encode(&fresh));

        return fresh;
    }

    let stale = bigints::decode(&val.unwrap());

    let fresh = bigints::inc(&stale);

    storage::set(&key, &bigints::encode(&fresh));
    
    fresh
}`}
              </Code>
            </div>
          </div>
        </div>
        <div className="h-[max(24rem,50dvh)]" />
        <div className="text-center text-6xl font-medium">
          {"Full account abstraction"}
        </div>
        <div className="h-4" />
        <div className="text-center text-default-contrast text-2xl">
          {"No built-in concept of accounts, use any accounting module you want"}
        </div>
        <div className="h-16" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-xl font-medium">
              secp256k1.wasm
            </div>
            <div className="h-2" />
            <div className="text-default-contrast">
              Bitcoin, Ethereum
            </div>
          </div>
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-xl font-medium">
              ed25519.wasm
            </div>
            <div className="h-2" />
            <div className="text-default-contrast">
              Solana, Signal, Tor
            </div>
          </div>
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-xl font-medium">
              secp256r1.wasm
            </div>
            <div className="h-2" />
            <div className="text-default-contrast">
              Passkeys, Hyperledger
            </div>
          </div>
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-xl font-medium">
              mldsa44.wasm
            </div>
            <div className="h-2" />
            <div className="text-default-contrast">
              Post-quantum
            </div>
          </div>
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-xl font-medium">
              schnorr.wasm
            </div>
            <div className="h-2" />
            <div className="text-default-contrast">
              Multi-signature
            </div>
          </div>
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-xl font-medium">
              custom.wasm
            </div>
            <div className="h-2" />
            <div className="text-default-contrast">
              Your own scheme
            </div>
          </div>
        </div>
        <div className="h-[max(24rem,50dvh)]" />
        <div className="text-center text-6xl font-medium">
          {"Capability-based security"}
        </div>
        <div className="h-4" />
        <div className="text-center text-default-contrast text-2xl">
          {"No more approve-then-transfer, modules can get temporary access"}
        </div>
        <div className="h-16" />
        <div className="w-full max-w-[800px] flex flex-col">
          <div className="p-4">
            <div className="text-2xl font-medium">
              vault.ts
            </div>
            <div className="h-2" />
            <div className="text-default-contrast">
              {"AssemblyScript"}
            </div>
          </div>
          <div className="h-full w-full bg-default-contrast rounded-xl p-4">
            <Code language="typescript">
              {`export function deposit(session: sessionref, amount: bigintref): void {
  token.transfer(session, modules.self(), amount)
}`}
            </Code>
          </div>
        </div>
        <div className="h-[max(24rem,50dvh)]" />
        <div className="text-center text-6xl font-medium">
          {"Gas paid via proof-of-work"}
        </div>
        <div className="h-4" />
        <div className="text-center text-default-contrast text-2xl">
          {"Never run out of gas, just compute some hashes to pay for your transactions"}
        </div>
        <div className="h-16" />
        <div className="w-full max-w-[600px] flex flex-col">
          <div className="bg-default-contrast rounded-xl p-4 pe-2">
            <div className="h-[400px] overflow-y-scroll whitespace-pre-wrap font-mono">
              <SparksMachine />
            </div>
          </div>
        </div>
        <div className="h-[max(24rem,50dvh)]" />
        <div className="text-center text-6xl font-medium">
          {"All sales final"}
        </div>
        <div className="h-4" />
        <div className="text-center text-default-contrast text-2xl">
          {"Finality is instant, no reorg, no 50% attack"}
        </div>
        <div className="h-32" />
        <div className="flex items-center gap-4">
          <div className="bg-default-contrast size-16 rounded-xl flex items-center justify-center font-medium" >
            #1
          </div>
          <Outline.LinkIcon className="size-4 text-default-contrast rotate-45" />
          <div className="bg-default-contrast size-16 rounded-xl flex items-center justify-center font-medium" >
            #2
          </div>
          <Outline.LinkIcon className="size-4 text-default-contrast rotate-45" />
          <div className="bg-default-contrast size-16 rounded-xl flex items-center justify-center font-medium" >
            #3
          </div>
        </div>
        <div className="h-[max(24rem,50dvh)]" />
        <div className="text-center text-6xl font-medium">
          {"High throughput"}
        </div>
        <div className="h-4" />
        <div className="text-center text-default-contrast text-2xl">
          {"Expect thousands of transactions per second"}
        </div>
        <div className="h-32" />
        <WasmMachine />
        <div className="h-4" />
        <div className="text-center text-default-contrast text-xl">
          {"Live transactions per second running in your browser"}
        </div>
        <div className="h-[max(24rem,50dvh)]" />
      </div>
    </div>
  </div>
}

export function Code(props: ChildrenProps & { language: string }) {
  const { children, language } = props

  const [code, setCode] = useState<HTMLElement>()

  useEffect(() => {
    if (!code)
      return
    code.innerHTML = hljs.highlight(code.textContent, { language }).value
  }, [code, language])

  return <code className="whitespace-pre-wrap font-mono wrap-break-word"
    ref={setCode}>
    {children}
  </code>
}

export function SparksMachine() {
  const [worker, setWorker] = useState<Worker>()

  useEffect(() => {
    const worker = new Worker("/sparks.worker.js", { type: "module" })

    setWorker(worker)

    return () => worker.terminate()
  }, [])

  const [messages, setMessages] = useState<string[]>([])

  const run = useCallback(async () => {
    if (worker == null)
      return

    using stack = new DisposableStack()

    const future = Promise.withResolvers<bigint>()

    const aborter = new AbortController()
    stack.defer(() => aborter.abort())

    worker.addEventListener("message", (event: MessageEvent<RpcResponseInit<bigint>>) => {
      RpcResponse.from(event.data).inspectSync(future.resolve).inspectErrSync(future.reject)
    }, { signal: aborter.signal })

    worker.addEventListener("error", (event: ErrorEvent) => {
      future.reject(event.error)
    }, { signal: aborter.signal })

    worker.addEventListener("messageerror", (event: MessageEvent) => {
      future.reject(event.data)
    }, { signal: aborter.signal })

    worker.postMessage(new RpcRequest(crypto.randomUUID(), "generate", []))

    const value = await future.promise

    setMessages(messages => [`You just generated ${value.toString()} sparks`, ...messages.slice(0, 100)])
  }, [worker])

  const [running, setRunning] = useState<boolean>(false)

  const [observer, setObserver] = useState<IntersectionObserver>()

  useEffect(() => {
    setObserver(new IntersectionObserver((entries) => setRunning(entries[0].isIntersecting)))
  }, [])

  const [div, setDiv] = useState<HTMLDivElement>()

  useEffect(() => {
    if (observer == null)
      return
    if (div == null)
      return

    observer.observe(div)

    return () => observer.unobserve(div)
  }, [observer, div])

  const loop = useCallback(async (signal: AbortSignal) => {
    if (worker == null)
      return
    while (!signal.aborted) await run()
  }, [run, worker])

  useEffect(() => {
    if (worker == null)
      return
    if (!running)
      return
    const aborter = new AbortController()

    loop(aborter.signal).catch(console.error)

    return () => aborter.abort()
  }, [loop, worker, running])

  return <div ref={setDiv}>
    {messages.join("\n")}
  </div>
}

export function WasmMachine() {
  const [worker, setWorker] = useState<Worker>()

  useEffect(() => {
    const worker = new Worker("/counter.worker.js", { type: "module" })

    setWorker(worker)

    return () => worker.terminate()
  }, [])

  const [count, setCount] = useState<number>(1)

  const run = useCallback(async () => {
    if (worker == null)
      return
    using stack = new DisposableStack()

    const future = Promise.withResolvers<number>()

    const aborter = new AbortController()
    stack.defer(() => aborter.abort())

    worker.addEventListener("message", (event: MessageEvent<RpcResponseInit<number>>) => {
      RpcResponse.from(event.data).inspectSync(future.resolve).inspectErrSync(future.reject)
    }, { signal: aborter.signal })

    worker.addEventListener("error", (event: ErrorEvent) => {
      future.reject(event.error)
    }, { signal: aborter.signal })

    worker.addEventListener("messageerror", (event: MessageEvent) => {
      future.reject(event.data)
    }, { signal: aborter.signal })

    worker.postMessage(new RpcRequest(crypto.randomUUID(), "execute", []))

    const value = await future.promise

    setCount(value)
  }, [worker])

  const [running, setRunning] = useState<boolean>(false)

  const [observer, setObserver] = useState<IntersectionObserver>()

  useEffect(() => {
    setObserver(new IntersectionObserver((entries) => setRunning(entries[0].isIntersecting)))
  }, [])

  const [div, setDiv] = useState<HTMLDivElement>()

  useEffect(() => {
    if (observer == null)
      return
    if (div == null)
      return

    observer.observe(div)

    return () => observer.unobserve(div)
  }, [observer, div])

  const loop = useCallback(async (signal: AbortSignal) => {
    if (worker == null)
      return
    while (!signal.aborted) await run()
  }, [run, worker])

  useEffect(() => {
    if (worker == null)
      return
    if (!running)
      return
    const aborter = new AbortController()

    loop(aborter.signal).catch(console.error)

    return () => aborter.abort()
  }, [loop, worker, running])

  const x = Math.round(100 * (50 - 50 * Math.cos((Math.log(Math.min(count, 100000)) / Math.log(100000)) * Math.PI))) / 100
  const y = Math.floor(100 * (100 * Math.sin((Math.log(Math.min(count, 100000)) / Math.log(100000)) * Math.PI))) / 100

  return <>
    <div className="relative w-full max-w-[400px] aspect-2/1 overflow-hidden">
      <div className="absolute z-10 h-full w-full flex flex-col items-center justify-end">
        <div className="text-2xl">
          <div ref={setDiv}>
            {count} TPS
          </div>
        </div>
      </div>
      <div className="absolute w-full aspect-square rounded-full border-2 border-default-contrast" />
      <div className={`absolute bg-opposite left-[${x}%] bottom-[${y}%] translate-y-full size-1 rounded-full`} />
    </div>
    <div className="h-4" />
    <div className="w-full max-w-[400px] flex items-center justify-between">
      <div className="">
        0 TPS
      </div>
      <div className="">
        100K TPS
      </div>
    </div>
  </>
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

export function WideClickableOppositeAnchor(props: ChildrenProps & JSX.IntrinsicElements["a"] & { "aria-disabled"?: boolean }) {
  const { children, "aria-disabled": disabled = false, ...rest } = props

  return <a className="flex-1 group po-2 bg-opposite border border-opposite text-opposite rounded-xl outline-none whitespace-nowrap aria-[disabled=false]:hover:bg-opposite-double-contrast focus-visible:outline-default-contrast aria-disabled:opacity-50 transition-opacity"
    aria-disabled={disabled}
    {...rest}>
    <GapperAndClickerInAnchorDiv>
      {children}
    </GapperAndClickerInAnchorDiv>
  </a>
}

export function WideClickableOppositeButton(props: ChildrenProps & JSX.IntrinsicElements["button"]) {
  const { children, ...rest } = props

  return <button className="flex-1 group po-2 bg-opposite text-opposite rounded-xl outline-none whitespace-nowrap enabled:hover:bg-opposite-double-contrast focus-visible:outline-opposite disabled:opacity-50 transition-opacity"
    {...rest}>
    <GapperAndClickerInButtonDiv>
      {children}
    </GapperAndClickerInButtonDiv>
  </button>
}

export function GapperAndClickerInButtonDiv(props: ChildrenProps) {
  const { children } = props

  return <div className="h-full w-full flex justify-center items-center gap-2 group-enabled:group-active:scale-90 transition-transform">
    {children}
  </div>
}

export function GapperAndClickerInAnchorDiv(props: ChildrenProps) {
  const { children } = props

  return <div className="h-full w-full flex justify-center items-center gap-2 group-aria-[disabled=false]:group-active:scale-90 transition-transform">
    {children}
  </div>
}