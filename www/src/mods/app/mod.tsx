/// <reference types="@/libs/bytes/lib.d.ts"/>

import hljs from "highlight.js/lib/core";

// @deno-types="npm:highlight.js"
import typescript from "highlight.js/lib/languages/typescript";

// @deno-types="npm:highlight.js"
import rust from "highlight.js/lib/languages/rust";

import { Outline } from "@/libs/heroicons/mod.ts";
import { hexdump } from "@/libs/hexdump/mod.ts";
import { Lang } from "@/libs/lang/mod.ts";
import { Nullable } from "@/libs/nullable/mod.ts";
import { ChildrenProps } from "@/libs/props/children/mod.ts";
import { RpcRequest, RpcResponse, RpcResponseInit } from "@hazae41/jsonrpc";
import React, { JSX, useCallback, useEffect, useState } from "react";

hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("rust", rust);

React;

export function App() {
  return <div className="h-full w-full flex flex-col overflow-y-scroll animate-opacity-in text-pretty">
    <div className="w-full flex justify-center">
      <img className="h-[40dvh] rotate-180" src="/engie.png" />
    </div>
    <div className="p-safe">
      <div className="p-8 flex-none flex flex-col items-center">
        <div className="text-center text-5xl md:text-6xl font-medium">
          {Lang.match({
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
          })}
        </div>
        <div className="h-4" />
        <div className="text-center text-default-contrast text-xl md:text-2xl">
          {Lang.match({
            en: "An ultra-simple blockchain with instant finality",
            zh: "一个极其简单且具有即时终局性的区块链",
            hi: "एक अल्ट्रा-साधारण ब्लॉकचेन के साथ त्वरित अंतिमता",
            es: "Una blockchain ultra simple con finalización instantánea",
            ar: "بلوكشين بسيطة للغاية مع نهاية فورية",
            fr: "Une blockchain ultra simple avec une finalité instantanée",
            de: "Eine ultra-einfache Blockchain mit sofortiger Endgültigkeit",
            ru: "Ультра-простая блокчейн с мгновенной финальностью",
            pt: "Uma blockchain ultra simples com finalização instantânea",
            ja: "超シンプルなブロックチェーンと即時の最終性",
            pa: "ਇੱਕ ਅਲਟਰਾ-ਸਧਾਰਨ ਬਲੌਕਚੇਨ ਨਾਲ ਤੁਰੰਤ ਅੰਤਿਮਤਾ",
            bn: "একটি আল্ট্রা-সরল ব্লকচেইন সহ তাত্ক্ষণিক চূড়ান্ততা",
            id: "Sebuah blockchain ultra-sederhana dengan finalitas instan",
            ur: "ایک الٹرا سادہ بلاک چین کے ساتھ فوری حتمیت",
            ms: "Sebuah blockchain ultra-sederhana dengan ketetapan segera",
            it: "Una blockchain ultra-semplice con finalità istantanea",
            tr: "Anında kesinlik ile ultra basit bir blok zinciri",
            ta: "ஒரு அற்புதமான எளிய பிளாக்செயின் உடன் உடனடி இறுதி",
            te: "అల్ట్రా-సింపుల్ బ్లాక్‌చెయిన్‌తో తక్షణ ఫైనాలిటీ",
            ko: "초간단 블록체인과 즉각적인 최종성",
            vi: "Một blockchain siêu đơn giản với tính cuối cùng tức thì",
            pl: "Ultra-prosty blockchain z natychmiastową ostatecznością",
            ro: "O blockchain ultra-simplu cu finalitate instantanee",
            nl: "Een ultra-eenvoudige blockchain met onmiddellijke finaliteit",
            el: "Ένα εξαιρετικά απλό blockchain με άμεση τελειότητα",
            th: "บล็อกเชนที่เรียบง่ายมากพร้อมความสมบูรณ์แบบทันที",
            cs: "Ultra jednoduchý blockchain s okamžitou finalitou",
            hu: "Egy rendkívül egyszerű blokklánc azonnali véglegességgel",
            sv: "En ultrasimpel blockchain med omedelbar finalitet",
            da: "En ultrasimpel blockchain med øjeblikkelig finalitet",
          })}
        </div>
        <div className="h-16" />
        <Outline.ChevronDownIcon className="size-6 text-default-half-contrast" />
        <div className="h-[max(24rem,50dvh)]" />
        <div className="text-center text-5xl md:text-6xl font-medium">
          {Lang.match({
            en: "Contracts in WebAssembly",
            zh: "WebAssembly 智能合约",
            hi: "WebAssembly में कॉन्ट्रैक्ट्स",
            es: "Contratos en WebAssembly",
            ar: "العقود في WebAssembly",
            fr: "Contrats en WebAssembly",
            de: "Verträge in WebAssembly",
            ru: "Контракты в WebAssembly",
            pt: "Contratos em WebAssembly",
            ja: "WebAssembly のコントラクト",
            pa: "WebAssembly ਵਿੱਚ ਠੇਕੇ",
            bn: "WebAssembly এ চুক্তি",
            id: "Kontrak di WebAssembly",
            ur: "WebAssembly میں معاہدے",
            ms: "Kontrak dalam WebAssembly",
            it: "Contratti in WebAssembly",
            tr: "WebAssembly'de Sözleşmeler",
            ta: "WebAssembly இல் ஒப்பந்தங்கள்",
            te: "WebAssemblyలో ఒప్పందాలు",
            ko: "WebAssembly의 계약",
            vi: "Hợp đồng trong WebAssembly",
            pl: "Kontrakty w WebAssembly",
            ro: "Contracte în WebAssembly",
            nl: "Contracten in WebAssembly",
            el: "Συμβόλαια σε WebAssembly",
            th: "สัญญาใน WebAssembly",
            cs: "Smlouvy ve WebAssembly",
            hu: "Szerződések WebAssembly-ben",
            sv: "Kontrakt i WebAssembly",
            da: "Kontrakter i WebAssembly",
          })}
        </div>
        <div className="h-4" />
        <div className="text-center text-default-contrast text-xl md:text-2xl">
          {Lang.match({
            en: "You can write modules in any language that compiles to WebAssembly",
            zh: "您可以使用任何编译为 WebAssembly 的语言编写模块",
            hi: "आप किसी भी भाषा में मॉड्यूल लिख सकते हैं जो WebAssembly में संकलित होती है",
            es: "Puedes escribir módulos en cualquier lenguaje que se compile a WebAssembly",
            ar: "يمكنك كتابة وحدات بأي لغة يتم تجميعها إلى WebAssembly",
            fr: "Vous pouvez écrire des modules dans n'importe quel langage qui se compile en WebAssembly",
            de: "Sie können Module in jeder Sprache schreiben, die in WebAssembly kompiliert wird",
            ru: "Вы можете писать модули на любом языке, который компилируется в WebAssembly",
            pt: "Você pode escrever módulos em qualquer linguagem que compile para WebAssembly",
            ja: "WebAssembly にコンパイルされる任意の言語でモジュールを書くことができます",
            pa: "ਤੁਸੀਂ ਕਿਸੇ ਵੀ ਭਾਸ਼ਾ ਵਿੱਚ ਮਾਡਿਊਲ ਲਿਖ ਸਕਦੇ ਹੋ ਜੋ WebAssembly ਵਿੱਚ ਕੰਪਾਈਲ ਹੁੰਦੀ ਹੈ",
            bn: "আপনি যে কোনও ভাষায় মডিউল লিখতে পারেন যা ওয়েবঅ্যাসেম্বলি-তে কম্পাইল করে",
            id: "Anda dapat menulis modul dalam bahasa apa pun yang dikompilasi ke WebAssembly",
            ur: "آپ کسی بھی زبان میں ماڈیولز لکھ سکتے ہیں جو WebAssembly میں مرتب ہوتی ہے",
            ms: "Anda boleh menulis modul dalam mana-mana bahasa yang disusun ke WebAssembly",
            it: "Puoi scrivere moduli in qualsiasi linguaggio che si compila in WebAssembly",
            tr: "WebAssembly'ye derlenen herhangi bir dilde modüller yazabilirsiniz",
            ta: "WebAssembly க்கு தொகுக்கப்படும் எந்த மொழியிலும் நீங்கள் மாட்யூல்கள் எழுதலாம்",
            te: "WebAssemblyకి కంపైల్ అయ్యే ఏ భాషలోనైనా మీరు మాడ్యూల్స్‌ను రాయవచ్చు",
            ko: "WebAssembly로 컴파일되는 모든 언어로 모듈을 작성할 수 있습니다",
            vi: "Bạn có thể viết các mô-đun bằng bất kỳ ngôn ngữ nào biên dịch sang WebAssembly",
            pl: "Możesz pisać moduły w dowolnym języku, który kompiluje się do WebAssembly",
            ro: "Puteți scrie module în orice limbaj care se compilează în WebAssembly",
            nl: "Je kunt modules schrijven in elke taal die compileert naar WebAssembly",
            el: "Μπορείτε να γράψετε μονάδες σε οποιαδήποτε γλώσσα που μεταγλωττίζεται σε WebAssembly",
            th: "คุณสามารถเขียนโมดูลในภาษาใดก็ได้ที่คอมไพล์เป็น WebAssembly",
            cs: "Moduly můžete psát v jakémkoli jazyce, který se překládá do WebAssembly",
            hu: "Bármilyen nyelven írhat modulokat, amely WebAssembly-re fordul",
            sv: "Du kan skriva moduler i vilket språk som helst som kompileras till WebAssembly",
            da: "Du kan skrive moduler i ethvert sprog, der kompileres til WebAssembly",
          })}
        </div>
        <div className="h-16" />
        <div className="w-full max-w-[600px] flex flex-col">
          <div className="p-4">
            <div className="text-xl md:text-2xl font-medium">
              counter.wasm
            </div>
            <div className="h-2" />
            <div className="text-default-contrast">
              {"WebAssembly"}
            </div>
          </div>
          <div className="bg-default-contrast rounded-xl p-4 pe-2">
            <div className="pe-2 h-[400px] overflow-y-scroll whitespace-pre-line text-left font-mono" dir="ltr">
              {hexdump}
            </div>
          </div>
        </div>
        <div className="h-[max(24rem,50dvh)]" />
        <div className="text-center text-5xl md:text-6xl font-medium">
          {Lang.match({
            en: "No extra tooling required",
            zh: "无需额外工具",
            hi: "कोई अतिरिक्त टूलिंग आवश्यक नहीं",
            es: "No se requiere herramientas adicionales",
            ar: "لا يلزم وجود أدوات إضافية",
            fr: "Aucun outil supplémentaire requis",
            de: "Keine zusätzliche Werkzeugkette erforderlich",
            ru: "Не требуется дополнительных инструментов",
            pt: "Nenhuma ferramenta extra necessária",
            ja: "追加のツールは不要です",
            pa: "ਕੋਈ ਵਾਧੂ ਟੂਲਿੰਗ ਦੀ ਲੋੜ ਨਹੀਂ",
            bn: "অতিরিক্ত টুলিং প্রয়োজন নেই",
            id: "Tidak diperlukan alat tambahan",
            ur: "کوئی اضافی ٹولنگ کی ضرورت نہیں",
            ms: "Tiada alat tambahan diperlukan",
            it: "Non sono necessari strumenti aggiuntivi",
            tr: "Ek araç gerektirmez",
            ta: "கூடுதல் கருவிகள் தேவையில்லை",
            te: "అదనపు టూలింగ్ అవసరం లేదు",
            ko: "추가 도구가 필요하지 않습니다",
            vi: "Không cần công cụ bổ sung",
            pl: "Nie są wymagane dodatkowe narzędzia",
            ro: "Nu sunt necesare instrumente suplimentare",
            nl: "Geen extra tooling vereist",
            el: "Δεν απαιτούνται επιπλέον εργαλεία",
            th: "ไม่ต้องการเครื่องมือเพิ่มเติม",
            cs: "Není vyžadováno žádné další nářadí",
            hu: "Nincs szükség további eszközökre",
            sv: "Inga extra verktyg krävs",
            da: "Intet ekstra værktøj kræves",
          })}
        </div>
        <div className="h-4" />
        <div className="text-center text-default-contrast text-xl md:text-2xl">
          {Lang.match({
            en: "Just upload any .wasm file, and execute any exported function",
            zh: "只需上传任何 .wasm 文件，并执行任何导出的函数",
            hi: "बस किसी भी .wasm फ़ाइल को अपलोड करें, और किसी भी निर्यातित फ़ंक्शन को निष्पादित करें",
            es: "Simplemente sube cualquier archivo .wasm y ejecuta cualquier función exportada",
            ar: "فقط قم بتحميل أي ملف .wasm وقم بتنفيذ أي وظيفة مُصدرة",
            fr: "Il suffit d'envoyer n'importe quel fichier .wasm et d'exécuter n'importe quelle fonction exportée",
            de: "Laden Sie einfach eine .wasm-Datei hoch und führen Sie eine exportierte Funktion aus",
            ru: "Просто загрузите любой файл .wasm и выполните любую экспортированную функцию",
            pt: "Basta fazer upload de qualquer arquivo .wasm e executar qualquer função exportada",
            ja: "任意の .wasm ファイルをアップロードし、エクスポートされた関数を実行するだけです",
            pa: "ਸਿਰਫ ਕਿਸੇ ਵੀ .wasm ਫਾਈਲ ਨੂੰ ਅਪਲੋਡ ਕਰੋ, ਅਤੇ ਕਿਸੇ ਵੀ ਨਿਰਯਾਤਿਤ ਫੰਕਸ਼ਨ ਨੂੰ ਚਲਾਓ",
            bn: "শুধু যেকোন .wasm ফাইল আপলোড করুন, এবং যেকোন রপ্তানিকৃত ফাংশন কার্যকর করুন",
            id: "Cukup unggah file .wasm apa pun, dan jalankan fungsi ekspor apa pun",
            ur: "بس کسی بھی .wasm فائل اپ لوڈ کریں، اور کسی بھی برآمد شدہ فنکشن کو چلائیں",
            ms: "Muat naik mana-mana fail .wasm, dan laksanakan mana-mana fungsi yang dieksport",
            it: "Basta caricare un file .wasm qualsiasi ed eseguire qualsiasi funzione esportata",
            tr: "Herhangi bir .wasm dosyasını yükleyin ve dışa aktarılan herhangi bir işlevi çalıştırın",
            ta: "எந்த .wasm கோப்பையும் பதிவேற்றவும், ஏற்றுமதி செய்யப்பட்ட எந்த செயல்பாட்டையும் இயக்கவும்",
            te: "ఏదైనా .wasm ఫైల్‌ను అప్‌లోడ్ చేయండి, మరియు ఎగుమతి చేయబడిన ఏ ఫంక్షన్‌ను అయినా అమలు చేయండి",
            ko: "임의의 .wasm 파일을 업로드하고 내보낸 함수를 실행하기만 하면 됩니다",
            vi: "Chỉ cần tải lên bất kỳ tệp .wasm nào và thực thi bất kỳ chức năng xuất nào",
            pl: "Wystarczy przesłać dowolny plik .wasm i wykonać dowolną eksportowaną funkcję",
            ro: "Doar încărcați orice fișier .wasm și executați orice funcție exportată",
            nl: "Upload gewoon een .wasm-bestand en voer een geëxporteerde functie uit",
            el: "Απλώς ανεβάστε οποιοδήποτε αρχείο .wasm και εκτελέστε οποιαδήποτε εξαγόμενη λειτουργία",
            th: "เพียงอัปโหลดไฟล์ .wasm ใดก็ได้ และเรียกใช้ฟังก์ชันที่ส่งออกใดก็ได้",
            cs: "Stačí nahrát libovolný soubor .wasm a spustit libovolnou exportovanou funkci",
            hu: "Csak töltsön fel egy .wasm fájlt, és hajtson végre egy exportált funkciót",
            sv: "Ladda bara upp en .wasm-fil och kör en exporterad funktion",
            da: "Upload bare en .wasm-fil, og udfør en eksporteret funktion",
          })}
        </div>
        <div className="h-16" />
        <div className="w-full flex flex-wrap justify-center gap-16">
          <div className="w-full max-w-[600px] flex flex-col">
            <div className="p-4">
              <div className="text-xl md:text-2xl font-medium">
                counter.ts
              </div>
              <div className="h-2" />
              <div className="text-default-contrast">
                {"AssemblyScript"}
              </div>
            </div>
            <Code language="typescript">
              {`import { bigintref, bigints, blobs, storage } from "@hazae41/stdbob";

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
          <div className="w-full max-w-[600px] flex flex-col">
            <div className="p-4">
              <div className="text-xl md:text-2xl font-medium">
                counter.rs
              </div>
              <div className="h-2" />
              <div className="text-default-contrast">
                {"Rust"}
              </div>
            </div>
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
        <div className="h-[max(24rem,50dvh)]" />
        <div className="text-center text-5xl md:text-6xl font-medium">
          {Lang.match({
            en: "Full account abstraction",
            zh: "完整的账户抽象",
            hi: "पूर्ण खाता अमूर्तता",
            es: "Abstracción completa de cuentas",
            ar: "تجريد الحساب الكامل",
            fr: "Abstraction complète des comptes",
            de: "Vollständige Kontoabstraktion",
            ru: "Полная абстракция аккаунта",
            pt: "Abstração completa de conta",
            ja: "完全なアカウント抽象化",
            pa: "ਪੂਰੀ ਖਾਤਾ ਅਮੂਰਤੀਕਰਨ",
            bn: "পূর্ণ অ্যাকাউন্ট বিমূর্ততা",
            id: "Abstraksi akun penuh",
            ur: "مکمل اکاؤنٹ تجرید",
            ms: "Abstraksi akaun penuh",
            it: "Astrazione completa del conto",
            tr: "Tam hesap soyutlaması",
            ta: "முழு கணக்கு சுருக்கம்",
            te: "పూర్తి ఖాతా సారాంశం",
            ko: "완전한 계정 추상화",
            vi: "Trừu tượng tài khoản đầy đủ",
            pl: "Pełna abstrakcja konta",
            ro: "Abstracție completă a contului",
            nl: "Volledige accountabstractie",
            el: "Πλήρης αφαίρεση λογαριασμού",
            th: "นามธรรมบัญชีเต็มรูปแบบ",
            cs: "Úplná abstrakce účtu",
            hu: "Teljes fiókabsztrakció",
            sv: "Fullständig kontobesträckning",
            da: "Fuld kontoabstraktion",
          })}
        </div>
        <div className="h-4" />
        <div className="text-center text-default-contrast text-xl md:text-2xl">
          {Lang.match({
            en: "No built-in concept of accounts, use any account module you want",
            zh: "没有内置的账户概念，使用您想要的任何账户模块",
            hi: "खातों की कोई अंतर्निहित अवधारणा नहीं है, किसी भी खाता मॉड्यूल का उपयोग करें जो आप चाहते हैं",
            es: "No hay un concepto incorporado de cuentas, use cualquier módulo de cuenta que desee",
            ar: "لا يوجد مفهوم مدمج للحسابات، استخدم أي وحدة حساب تريدها",
            fr: "Il n'y a pas de concept intégré de comptes, utilisez n'importe quel module de compte que vous souhaitez",
            de: "Es gibt kein eingebautes Konto-Konzept, verwenden Sie jedes gewünschte Kontomodul",
            ru: "Нет встроенной концепции аккаунтов, используйте любой модуль аккаунта, который вы хотите",
            pt: "Não há conceito incorporado de contas, use qualquer módulo de conta que desejar",
            ja: "アカウントの組み込み概念はなく、任意のアカウントモジュールを使用できます",
            pa: "ਖਾਤਿਆਂ ਦੀ ਕੋਈ ਅੰਦਰੂਨੀ ਧਾਰਣਾ ਨਹੀਂ ਹੈ, ਕਿਸੇ ਵੀ ਖਾਤਾ ਮਾਡਿਊਲ ਨੂੰ ਵਰਤੋਂ ਜੋ ਤੁਸੀਂ ਚਾਹੁੰਦੇ ਹੋ",
            bn: "অ্যাকাউন্টের কোনও বিল্ট-ইন ধারণা নেই, আপনি যে কোনও অ্যাকাউন্ট মডিউল ব্যবহার করুন",
            id: "Tidak ada konsep akun bawaan, gunakan modul akun apa pun yang Anda inginkan",
            ur: "اکاؤنٹس کا کوئی بلٹ ان تصور نہیں ہے، جو بھی اکاؤنٹ ماڈیول آپ چاہتے ہیں استعمال کریں",
            ms: "Tiada konsep akaun terbina dalam, gunakan mana-mana modul akaun yang anda mahukan",
            it: "Non esiste un concetto incorporato di account, utilizza qualsiasi modulo di account desideri",
            tr: "Yerleşik bir hesap kavramı yok, istediğiniz herhangi bir hesap modülünü kullanın",
            ta: "கணக்குகளின் எந்த உள்ளமைக்கப்பட்ட கருத்தும் இல்லை, நீங்கள் விரும்பும் எந்த கணக்கு மாட்யூலையும் பயன்படுத்தவும்",
            te: "ఖాతాల యొక్క ఎలాంటి బిల్ట్-ఇన్ కాన్సెప్ట్ లేదు, మీరు కోరుకునే ఏ ఖాతా మాడ్యూల్‌ను ఉపయోగించండి",
            ko: "계정의 내장 개념이 없으며 원하는 모든 계정 모듈을 사용하십시오",
            vi: "Không có khái niệm tài khoản tích hợp sẵn, hãy sử dụng bất kỳ mô-đun tài khoản nào bạn muốn",
            pl: "Brak wbudowanej koncepcji kont, użyj dowolnego modułu konta, którego chcesz",
            ro: "Nu există un concept încorporat de conturi, utilizați orice modul de cont doriți",
            nl: "Er is geen ingebouwd concept van accounts, gebruik elk accountmodule dat je wilt",
            el: "Δεν υπάρχει ενσωματωμένη έννοια λογαριασμών, χρησιμοποιήστε οποιοδήποτε μοντέλο λογαριασμού θέλετε",
            th: "ไม่มีแนวคิดบัญชีในตัว ใช้โมดูลบัญชีใดก็ได้ที่คุณต้องการ",
            cs: "Neexistuje žádný vestavěný koncept účtů, použijte jakýkoli modul účtu, který chcete",
            hu: "Nincs beépített fiókkoncepció, használjon bármilyen fiókmodult, amelyet szeretne",
            sv: "Ingen inbyggd kontokoncept, använd vilken kontomodul du vill",
            da: "Intet indbygget kontobegreb, brug enhver kontomodel, du ønsker",
          })}
        </div>
        <div className="h-16" />
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-lg md:text-xl">
              secp256k1.wasm
            </div>
            <div className="h-2" />
            <div className="text-default-contrast">
              Bitcoin, Ethereum
            </div>
          </div>
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-lg md:text-xl">
              ed25519.wasm
            </div>
            <div className="h-2" />
            <div className="text-default-contrast">
              Solana, Signal, Tor
            </div>
          </div>
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-lg md:text-xl">
              secp256r1.wasm
            </div>
            <div className="h-2" />
            <div className="text-default-contrast">
              Passkeys, Hyperledger
            </div>
          </div>
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-lg md:text-xl">
              mldsa44.wasm
            </div>
            <div className="h-2" />
            <div className="text-default-contrast">
              {Lang.match({
                en: "Post-quantum",
                zh: "后量子",
                hi: "पोस्ट-क्वांटम",
                es: "Post-cuántico",
                ar: "ما بعد الكم",
                fr: "Post-quantique",
                de: "Post-Quanten",
                ru: "Пост-квантовый",
                pt: "Pós-quântico",
                ja: "ポスト量子",
                pa: "ਪੋਸਟ-ਕਵਾਂਟਮ",
                bn: "পোস্ট-কোয়ান্টাম",
                id: "Pasca-kuantum",
                ur: "پوسٹ کوانٹم",
                ms: "Pasca-kuantum",
                it: "Post-quantum",
                tr: "Kuantum sonrası",
                ta: "போஸ்ட்-குவாண்டம்",
                te: "పోస్ట్-క్వాంటమ్",
                ko: "포스트 양자",
                vi: "Hậu lượng tử",
                pl: "Post-kwantowy",
                ro: "Post-cuantic",
                nl: "Post-kwantum",
                el: "Μετα-κβαντικός",
                th: "หลังควอนตัม",
                cs: "Post-kvantový",
                hu: "Poszt-kvantum",
                sv: "Post-kvant",
                da: "Post-kvante",
              })}
            </div>
          </div>
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-lg md:text-xl">
              schnorr.wasm
            </div>
            <div className="h-2" />
            <div className="text-default-contrast">
              {Lang.match({
                en: "Multi-signature",
                zh: "多重签名",
                hi: "मल्टी-सिग्नेचर",
                es: "Multifirma",
                ar: "توقيع متعدد",
                fr: "Multi-signature",
                de: "Mehrfachsignatur",
                ru: "Мультиподпись",
                pt: "Multisig",
                ja: "マルチシグネチャ",
                pa: "ਮਲਟੀ-ਸਿਗਨੇਚਰ",
                bn: "মাল্টি-সিগনেচার",
                id: "Multi-tanda tangan",
                ur: "کثیر دستخط",
                ms: "Multi-tandatangan",
                it: "Multifirma",
                tr: "Çoklu imza",
                ta: "பல-கையொப்பம்",
                te: "బహుళ-సంతకం",
                ko: "다중 서명",
                vi: "Đa chữ ký",
                pl: "Wielopodpis",
                ro: "Multi-semnătură",
                nl: "Multi-handtekening",
                el: "Πολυ-υπογραφή",
                th: "หลายลายเซ็น",
                cs: "Více podpisů",
                hu: "Többszörös aláírás",
                sv: "Fler-signatur",
                da: "Multi-signatur",
              })}
            </div>
          </div>
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-lg md:text-xl">
              custom.wasm
            </div>
            <div className="h-2" />
            <div className="text-default-contrast">
              {Lang.match({
                en: "Your own module",
                zh: "您自己的模块",
                hi: "आपका अपना मॉड्यूल",
                es: "Tu propio módulo",
                ar: "وحدتك الخاصة",
                fr: "Votre propre module",
                de: "Ihr eigenes Modul",
                ru: "Ваш собственный модуль",
                pt: "Seu próprio módulo",
                ja: "あなた自身のモジュール",
                pa: "ਤੁਹਾਡਾ ਆਪਣਾ ਮਾਡਿਊਲ",
                bn: "আপনার নিজস্ব মডিউল",
                id: "Modul Anda sendiri",
                ur: "آپ کا اپنا ماڈیول",
                ms: "Modul anda sendiri",
                it: "Il tuo modulo",
                tr: "Kendi modülünüz",
                ta: "உங்கள் சொந்த மாட்யூல்",
                te: "మీ స్వంత మాడ్యూల్",
                ko: "당신만의 모듈",
                vi: "Mô-đun của riêng bạn",
                pl: "Twój własny moduł",
                ro: "Propriul tău modul",
                nl: "Je eigen module",
                el: "Το δικό σου μοντέλο",
                th: "โมดูลของคุณเอง",
                cs: "Vlastní modul",
                hu: "Saját modulod",
                sv: "Din egen modul",
                da: "Dit eget modul",
              })}
            </div>
          </div>
        </div>
        <div className="h-[max(24rem,50dvh)]" />
        <div className="text-center text-5xl md:text-6xl font-medium">
          {Lang.match({
            en: "Capability-based security",
            zh: "基于能力的安全性",
            hi: "क्षमता-आधारित सुरक्षा",
            es: "Seguridad basada en capacidades",
            ar: "الأمان القائم على القدرات",
            fr: "Sécurité basée sur les capacités",
            de: "Fähigkeitsbasierte Sicherheit",
            ru: "Безопасность на основе возможностей",
            pt: "Segurança baseada em capacidade",
            ja: "能力ベースのセキュリティ",
            pa: "ਕੁਸ਼ਲਤਾ-ਆਧਾਰਿਤ ਸੁਰੱਖਿਆ",
            bn: "ক্ষমতা-ভিত্তিক নিরাপত্তা",
            id: "Keamanan berbasis kapabilitas",
            ur: "صلاحیت پر مبنی سیکیورٹی",
            ms: "Keselamatan berasaskan keupayaan",
            it: "Sicurezza basata sulle capacità",
            tr: "Yetenek tabanlı güvenlik",
            ta: "திறன் அடிப்படையிலான பாதுகாப்பு",
            te: "సామర్థ్య ఆధారిత భద్రత",
            ko: "역량 기반 보안",
            vi: "Bảo mật dựa trên khả năng",
            pl: "Bezpieczeństwo oparte na możliwościach",
            ro: "Securitate bazată pe capacități",
            nl: "Capabiliteitsgebaseerde beveiliging",
            el: "Ασφάλεια με βάση τις δυνατότητες",
            th: "ความปลอดภัยตามความสามารถ",
            cs: "Bezpečnost založená na schopnostech",
            hu: "Képességalapú biztonság",
            sv: "Kapacitetsbaserad säkerhet",
            da: "Kapabilitetsbaseret sikkerhed",
          })}
        </div>
        <div className="h-4" />
        <div className="text-center text-default-contrast text-xl md:text-2xl">
          {Lang.match({
            en: "No more approve-then-transfer, modules can get temporary access",
            zh: "不再需要先批准然后转账，模块可以获得临时访问权限",
            hi: "और अधिक स्वीकृति-फिर-स्थानांतरण नहीं, मॉड्यूल अस्थायी पहुंच प्राप्त कर सकते हैं",
            es: "No más aprobar-luego-transferir, los módulos pueden obtener acceso temporal",
            ar: "لا مزيد من الموافقة ثم النقل، يمكن للوحدات الحصول على وصول مؤقت",
            fr: "Plus d'approuver-puis-transférer, les modules peuvent obtenir un accès temporaire",
            de: "Kein Genehmigen-dann-Übertragen mehr, Module können vorübergehenden Zugriff erhalten",
            ru: "Больше не нужно одобрять-потом-переводить, модули могут получить временный доступ",
            pt: "Não há mais aprovar-depois-transferir, os módulos podem obter acesso temporário",
            ja: "承認してから転送することはもうありません。モジュールは一時的なアクセスを取得できます",
            pa: "ਹੋਰ ਮਨਜ਼ੂਰੀ-ਫਿਰ-ਟ੍ਰਾਂਸਫਰ ਨਹੀਂ, ਮਾਡਿਊਲ ਅਸਥਾਈ ਪਹੁੰਚ ਪ੍ਰਾਪਤ ਕਰ ਸਕਦੇ ਹਨ",
            bn: "আর অনুমোদন-তারপর-স্থানান্তর নেই, মডিউলগুলি অস্থায়ী অ্যাক্সেস পেতে পারে",
            id: "Tidak perlu lagi menyetujui-lalu-mentransfer, modul dapat memperoleh akses sementara",
            ur: "مزید منظوری-پھر-منتقلی نہیں، ماڈیولز عارضی رسائی حاصل کر سکتے ہیں",
            ms: "Tiada lagi lulus-kemudian-pindah, modul boleh mendapatkan akses sementara",
            it: "Niente più approva-then-transfer, i moduli possono ottenere un accesso temporaneo",
            tr: "Artık onayla-sonra-transfer yok, modüller geçici erişim alabilir",
            ta: "மேலும் அங்கீகாரம்-பிறகு-பரிமாற்றம் இல்லை, மாட்யூல்கள் தற்காலிக அணுகலைப் பெறலாம்",
            te: "మరింత ఆమోదించండి-తర్వాత-బదిలీ చేయవద్దు, మాడ్యూల్స్ తాత్కాలిక యాక్సెస్ పొందవచ్చు",
            ko: "더 이상 승인-그런 다음-전송이 필요하지 않으며 모듈은 임시 액세스를 얻을 수 있습니다",
            vi: "Không còn phê duyệt-sau-đó-chuyển nữa, các mô-đun có thể truy cập tạm thời",
            pl: "Koniec z zatwierdzaniem-następnie-przenoszeniem, moduły mogą uzyskać tymczasowy dostęp",
            ro: "Nu mai aprobați-apoi-transferați, modulele pot obține acces temporar",
            nl: "Niet meer goedkeuren-dan-overdragen, modules kunnen tijdelijke toegang krijgen",
            el: "Όχι πια έγκριση-μετά-μεταφορά, τα μοντέλα μπορούν να αποκτήσουν προσωρινή πρόσβαση",
            th: "ไม่ต้องอนุมัติ-แล้ว-โอนอีกต่อไป โมดูลสามารถเข้าถึงชั่วคราวได้",
            cs: "Už žádné schvalování-poté-převod, moduly mohou získat dočasný přístup",
            hu: "Nincs több jóváhagyás-aztán-átutalás, a modulok ideiglenes hozzáférést kaphatnak",
            sv: "Ingen mer godkännande-sedan-överföring, moduler kan få tillfällig åtkomst",
            da: "Ikke mere godkend-then-overfør, moduler kan få midlertidig adgang",
          })}
        </div>
        <div className="h-16" />
        <div className="w-full max-w-[800px] flex flex-col">
          <div className="p-4">
            <div className="text-xl md:text-2xl font-medium">
              vault.ts
            </div>
            <div className="h-2" />
            <div className="text-default-contrast">
              {"AssemblyScript"}
            </div>
          </div>
          <Code language="typescript">
            {`export function deposit(session: sessionref, amount: bigintref): void {
  token.transfer(session, modules.self(), amount)
}`}
          </Code>
        </div>
        <div className="h-[max(24rem,50dvh)]" />
        <div className="text-center text-5xl md:text-6xl font-medium">
          {Lang.match({
            en: "Gas paid via proof-of-work",
            zh: "通过工作量证明支付燃气费",
            hi: "प्रूफ-ऑफ-वर्क के माध्यम से गैस का भुगतान किया गया",
            es: "Gas pagado a través de prueba de trabajo",
            ar: "الغاز المدفوع عبر إثبات العمل",
            fr: "Gaz payé via preuve de travail",
            de: "Gas bezahlt über Proof-of-Work",
            ru: "Газ оплачивается через доказательство работы",
            pt: "Gás pago via prova de trabalho",
            ja: "ガスはプルーフ・オブ・ワークで支払われます",
            pa: "ਗੈਸ ਦਾ ਭੁਗਤਾਨ ਪ੍ਰੂਫ-ਆਫ-ਵਰਕ ਰਾਹੀਂ ਕੀਤਾ ਗਿਆ",
            bn: "প্রুফ-অফ-ওয়ার্কের মাধ্যমে গ্যাস প্রদান করা হয়েছে",
            id: "Gas dibayar melalui bukti kerja",
            ur: "گیس پروف آف ورک کے ذریعے ادا کی گئی",
            ms: "Gas dibayar melalui bukti kerja",
            it: "Gas pagato tramite proof-of-work",
            tr: "Gaz, iş kanıtı yoluyla ödenir",
            ta: "பணியாற்றல் மூலம் எரிபொருள் செலுத்தப்பட்டது",
            te: "ప్రూఫ్-ఆఫ్-వర్క్ ద్వారా గ్యాస్ చెల్లించబడింది",
            ko: "작업 증명을 통한 가스 지불",
            vi: "Gas được thanh toán thông qua bằng chứng công việc",
            pl: "Opłata za gaz poprzez dowód pracy",
            ro: "Gaz plătit prin dovada muncii",
            nl: "Gas betaald via proof-of-work",
            el: "Αέριο που πληρώνεται μέσω απόδειξης εργασίας",
            th: "แก๊สที่จ่ายผ่านการพิสูจน์การทำงาน",
            cs: "Plyn placený prostřednictvím důkazu o práci",
            hu: "Gáz fizetve munkabizonyítvány révén",
            sv: "Gas betalas via proof-of-work",
            da: "Gas betalt via proof-of-work",
          })}
        </div>
        <div className="h-4" />
        <div className="text-center text-default-contrast text-xl md:text-2xl">
          {Lang.match({
            en: "Never run out of gas, just compute some hashes to pay for your transactions",
            zh: "永远不会耗尽燃气，只需计算一些哈希值来支付您的交易费用",
            hi: "गैस कभी खत्म न हो, बस अपने लेनदेन के लिए भुगतान करने के लिए कुछ हैश की गणना करें",
            es: "Nunca te quedes sin gas, solo calcula algunos hashes para pagar tus transacciones",
            ar: "لا تنفد أبدًا من الغاز، فقط قم بحساب بعض التجزئات لدفع ثمن معاملاتك",
            fr: "Ne manquez jamais de gaz, calculez simplement quelques hachages pour payer vos transactions",
            de: "Gehen Sie nie wieder ohne Gas aus, berechnen Sie einfach einige Hashes, um Ihre Transaktionen zu bezahlen",
            ru: "Никогда не оставайтесь без газа, просто вычислите несколько хэшей, чтобы оплатить свои транзакции",
            pt: "Nunca fique sem gás, basta calcular alguns hashes para pagar suas transações",
            ja: "ガスがなくなることはありません。トランザクションの支払いのためにいくつかのハッシュを計算するだけです",
            pa: "ਕਦੇ ਵੀ ਗੈਸ ਖਤਮ ਨਾ ਕਰੋ, ਸਿਰਫ ਆਪਣੇ ਲੈਣ-ਦੇਣ ਲਈ ਕੁਝ ਹੈਸ਼ ਦੀ ਗਣਨਾ ਕਰੋ",
            bn: "কখনও গ্যাস শেষ হবে না, আপনার লেনদেনের জন্য অর্থ প্রদান করতে কিছু হ্যাশ গণনা করুন",
            id: "Jangan pernah kehabisan gas, cukup hitung beberapa hash untuk membayar transaksi Anda",
            ur: "گیس کبھی ختم نہ ہو، اپنے لین دین کی ادائیگی کے لیے کچھ ہیشز کا حساب لگائیں",
            ms: "Jangan pernah kehabisan gas, cuma kira beberapa hash untuk membayar transaksi anda",
            it: "Non rimanere mai senza gas, calcola semplicemente alcuni hash per pagare le tue transazioni",
            tr: "Gazınız asla bitmesin, işlemleriniz için ödeme yapmak üzere bazı hash'ler hesaplayın",
            ta: "எப்போதும் எரிபொருள் முடிவடையாது, உங்கள் பரிவர்த்தனைகளுக்கு பணம் செலுத்த சில ஹாஷ்களை கணக்கிடுங்கள்",
            te: "ఎప్పుడూ గ్యాస్ ముగియదు, మీ లావాదేవీల కోసం చెల్లించడానికి కొన్ని హాష్‌లను లెక్కించండి",
            ko: "가스가 다 떨어지지 않도록 거래 비용을 지불하기 위해 일부 해시를 계산하십시오",
            vi: "Không bao giờ hết gas, chỉ cần tính toán một số băm để thanh toán cho các giao dịch của bạn",
            pl: "Nigdy nie zabraknie gazu, po prostu oblicz kilka skrótów, aby zapłacić za swoje transakcje",
            ro: "Nu rămâneți niciodată fără gaz, calculați doar câteva hash-uri pentru a vă plăti tranzacțiile",
            nl: "Raak nooit zonder gas, bereken gewoon wat hashes om voor je transacties te betalen",
            el: "Μην ξεμείνετε ποτέ από αέριο, απλώς υπολογίστε μερικά hashes για να πληρώσετε τις συναλλαγές σας",
            th: "อย่าให้แก๊สหมด เพียงคำนวณแฮชบางส่วนเพื่อชำระค่าธรรมเนียมการทำธุรกรรมของคุณ",
            cs: "Nikdy nedojde plyn, stačí vypočítat několik hashů, abyste zaplatili své transakce",
            hu: "Sose fogyjon el a gáz, csak számoljon néhány hasht a tranzakciói kifizetéséhez",
            sv: "Få aldrig på gas, beräkna bara några hash för att betala för dina transaktioner",
            da: "Løb aldrig tør for gas, beregn bare nogle hashes for at betale for dine transaktioner",
          })}
        </div>
        <div className="h-16" />
        <div className="w-full max-w-[600px] flex flex-col">
          <div className="bg-default-contrast rounded-xl p-4 pe-2">
            <div className="pe-2 h-[400px] overflow-y-scroll whitespace-pre-line font-mono">
              <SparksMachine />
            </div>
          </div>
        </div>
        <div className="h-4" />
        <div className="text-center text-default-contrast">
          {Lang.match({
            en: "Live sparks generated in your browser",
            zh: "在您的浏览器中生成实时火花",
            hi: "आपके ब्राउज़र में लाइव स्पार्क्स उत्पन्न हुए",
            es: "Chispas en vivo generadas en tu navegador",
            ar: "شرارات حية تم إنشاؤها في متصفحك",
            fr: "Des étincelles en direct générées dans votre navigateur",
            de: "Live-Sparks, die in Ihrem Browser generiert werden",
            ru: "Живые искры, созданные в вашем браузере",
            pt: "Faíscas ao vivo geradas no seu navegador",
            ja: "ブラウザで生成されたライブスパーク",
            pa: "ਤੁਹਾਡੇ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਲਾਈਵ ਸਪਾਰਕਸ ਬਣਾਏ ਗਏ",
            bn: "আপনার ব্রাউজারে তৈরি লাইভ স্পার্কস",
            id: "Sparks langsung yang dihasilkan di browser Anda",
            ur: "آپ کے براؤزر میں پیدا ہونے والے لائیو اسپارکس",
            ms: "Sparks langsung yang dijana dalam pelayar anda",
            it: "Sparks live generati nel tuo browser",
            tr: "Tarayıcınızda oluşturulan canlı kıvılcımlar",
            ta: "உங்கள் உலாவியில் உருவாக்கப்பட்ட நேரடி ஸ்பார்க்ஸ்",
            te: "మీ బ్రౌజర్‌లో ఉత్పత్తి అయిన ప్రత్యక్ష స్పార్క్స్",
            ko: "브라우저에서 생성된 라이브 스파크",
            vi: "Sparks trực tiếp được tạo trong trình duyệt của bạn",
            pl: "Na żywo iskry generowane w Twojej przeglądarce",
            ro: "Scântei live generate în browserul dvs.",
            nl: "Live vonken gegenereerd in uw browser",
            el: "Ζωντανές σπίθες που δημιουργούνται στο πρόγραμμα περιήγησής σας",
            th: "สปาร์กสดที่สร้างขึ้นในเบราว์เซอร์ของคุณ",
            cs: "Živé jiskry generované ve vašem prohlížeči",
            hu: "Élő szikrák generálva a böngészőjében",
            sv: "Live-sparks genererade i din webbläsare",
            da: "Live-sparks genereret i din browser",
          })}
        </div>
        <div className="h-[max(24rem,50dvh)]" />
        <div className="text-center text-5xl md:text-6xl font-medium">
          {Lang.match({
            en: "All sales final",
            zh: "所有销售均为最终销售",
            hi: "सभी बिक्री अंतिम हैं",
            es: "Todas las ventas son finales",
            ar: "جميع المبيعات نهائية",
            fr: "Toutes les ventes sont finales",
            de: "Alle Verkäufe sind endgültig",
            ru: "Все продажи окончательны",
            pt: "Todas as vendas são finais",
            ja: "すべての販売は最終的なものです",
            pa: "ਸਭ ਵਿਕਰੀ ਅੰਤਿਮ ਹਨ",
            bn: "সমস্ত বিক্রয় চূড়ান্ত",
            id: "Semua penjualan final",
            ur: "تمام فروخت حتمی ہیں",
            ms: "Semua jualan adalah muktamad",
            it: "Tutte le vendite sono definitive",
            tr: "Tüm satışlar kesindir",
            ta: "அனைத்து விற்பனைகளும் இறுதி",
            te: "అన్ని అమ్మకాలు తుది",
            ko: "모든 판매는 최종적입니다",
            vi: "Tất cả các giao dịch bán hàng đều là cuối cùng",
            pl: "Wszystkie sprzedaże są ostateczne",
            ro: "Toate vânzările sunt finale",
            nl: "Alle verkopen zijn definitief",
            el: "Όλες οι πωλήσεις είναι τελικές",
            th: "การขายทั้งหมดถือเป็นครั้งสุดท้าย",
            cs: "Všechny prodeje jsou konečné",
            hu: "Minden eladás végleges",
            sv: "Alla försäljningar är slutgiltiga",
            da: "Alle salg er endelige",
          })}
        </div>
        <div className="h-4" />
        <div className="text-center text-default-contrast text-xl md:text-2xl">
          {Lang.match({
            en: "Finality is instant, no reorg, no fifty-percent attack",
            zh: "最终性是即时的，没有重组，没有百分之五十的攻击",
            hi: "फाइनलिटी तात्कालिक है, कोई रीऑर्ग नहीं, कोई पचास प्रतिशत हमला नहीं",
            es: "La finalidad es instantánea, sin reorganización, sin ataque del cincuenta por ciento",
            ar: "النهائية فورية، لا إعادة تنظيم، لا هجوم بنسبة خمسين في المائة",
            fr: "La finalité est instantanée, pas de réorganisation, pas d'attaque à cinquante pour cent",
            de: "Finalität ist sofortig, keine Reorganisation, kein Fünfzig-Prozent-Angriff",
            ru: "Финальность мгновенна, без реорганизации, без атаки на пятьдесят процентов",
            pt: "A finalização é instantânea, sem reorganização, sem ataque de cinquenta por cento",
            ja: "最終性は即時であり、再編成も50パーセントの攻撃もありません",
            pa: "ਫਾਈਨਲਟੀ ਤੁਰੰਤ ਹੈ, ਕੋਈ ਰੀਆਰਗ ਨਹੀਂ, ਕੋਈ ਪੰਜਾਹ ਪ੍ਰਤੀਸ਼ਤ ਹਮਲਾ ਨਹੀਂ",
            bn: "ফাইনালিটি তাৎক্ষণিক, কোনও পুনর্গঠন নেই, কোনও পঞ্চাশ শতাংশ আক্রমণ নেই",
            id: "Finalitas instan, tidak ada reorganisasi, tidak ada serangan lima puluh persen",
            ur: "فائنلٹی فوری ہے، کوئی ری آرگ نہیں، کوئی پچاس فیصد حملہ نہیں",
            ms: "Kesudahan adalah segera, tiada penyusunan semula, tiada serangan lima puluh peratus",
            it: "La finalità è istantanea, nessuna riorganizzazione, nessun attacco del cinquanta percento",
            tr: "Nihai sonuç anında gerçekleşir, yeniden düzenleme yok, yüzde elli saldırı yok",
            ta: "இறுதி திடீரென உள்ளது, எந்த மறுசீரமைப்பும் இல்லை, ஐம்பது சதவீத தாக்குதலும் இல்லை",
            te: "ఫైనాలిటీ తక్షణమే, రీయార్గ్ లేదు, యాభై శాతం దాడి లేదు",
            ko: "최종성은 즉각적이며 재조직화나 50% 공격이 없습니다",
            vi: "Tính cuối cùng là tức thì, không có tái tổ chức, không có cuộc tấn công năm mươi phần trăm",
            pl: "Ostateczność jest natychmiastowa, brak reorganizacji, brak ataku pięćdziesięciu procent",
            ro: "Finalitatea este instantanee, fără reorganizare, fără atac de cincizeci la sută",
            nl: "Finaliteit is direct, geen reorganisatie, geen vijftig procent aanval",
            el: "Η τελική είναι άμεση, χωρίς αναδιοργάνωση, χωρίς επίθεση πενήντα τοις εκατό",
            th: "ความสิ้นสุดเป็นทันที ไม่มีการจัดระเบียบใหม่ ไม่มีการโจมตีห้าสิบเปอร์เซ็นต์",
            cs: "Finalita je okamžitá, žádná reorganizace, žádný padesátiprocentní útok",
            hu: "A véglegesség azonnali, nincs átszervezés, nincs ötven százalékos támadás",
            sv: "Finalitet är omedelbar, ingen omorganisation, ingen femtio-procentig attack",
            da: "Finalitet er øjeblikkelig, ingen omorganisering, ingen halvtreds-procent angreb",
          })}
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
        <div className="text-center text-5xl md:text-6xl font-medium">
          {Lang.match({
            en: "High throughput",
            zh: "高吞吐量",
            hi: "उच्च थ्रूपुट",
            es: "Alto rendimiento",
            ar: "عالي الإنتاجية",
            fr: "Haut débit",
            de: "Hoher Durchsatz",
            ru: "Высокая пропускная способность",
            pt: "Alta taxa de transferência",
            ja: "高スループット",
            pa: "ਉੱਚ ਥਰੂਪੁੱਟ",
            bn: "উচ্চ থ্রুপুট",
            id: "Throughput tinggi",
            ur: "اعلی تھروپٹ",
            ms: "Throughput tinggi",
            it: "Alto rendimento",
            tr: "Yüksek verim",
            ta: "உயர் த்ரூபுட்",
            te: "హై థ్రూపుట్",
            ko: "높은 처리량",
            vi: "Thông lượng cao",
            pl: "Wysoka przepustowość",
            ro: "Debit mare",
            nl: "Hoge doorvoer",
            el: "Υψηλή απόδοση",
            th: "อัตราการถ่ายโอนข้อมูลสูง",
            cs: "Vysoká propustnost",
            hu: "Nagy áteresztőképesség",
            sv: "Hög genomströmning",
            da: "Høj gennemstrømning",
          })}
        </div>
        <div className="h-4" />
        <div className="text-center text-default-contrast text-xl md:text-2xl">
          {Lang.match({
            en: "Expect thousands of transactions per second",
            zh: "每秒预期数千笔交易",
            hi: "प्रति सेकंड हजारों लेनदेन की उम्मीद करें",
            es: "Espere miles de transacciones por segundo",
            ar: "توقع آلاف المعاملات في الثانية",
            fr: "Attendez-vous à des milliers de transactions par seconde",
            de: "Erwarten Sie Tausende von Transaktionen pro Sekunde",
            ru: "Ожидайте тысячи транзакций в секунду",
            pt: "Espere milhares de transações por segundo",
            ja: "1秒あたり数千のトランザクションを期待してください",
            pa: "ਪ੍ਰਤੀ ਸਕਿੰਟ ਹਜ਼ਾਰਾਂ ਲੈਣ-ਦੇਣ ਦੀ ਉਮੀਦ ਕਰੋ",
            bn: "প্রতি সেকেন্ডে হাজার হাজার লেনদেনের প্রত্যাশা করুন",
            id: "Harapkan ribuan transaksi per detik",
            ur: "فی سیکنڈ ہزاروں لین دین کی توقع کریں",
            ms: "Jangkaan ribuan transaksi setiap saat",
            it: "Aspettatevi migliaia di transazioni al secondo",
            tr: "Saniyede binlerce işlem bekleyin",
            ta: "ஒரு விநாடிக்கு ஆயிரக்கணக்கான பரிவர்த்தனைகளை எதிர்பார்க்கவும்",
            te: "ప్రతి సెకనుకు వేల లావాదేవీలను ఆశించండి",
            ko: "초당 수천 건의 트랜잭션을 기대하세요",
            vi: "Mong đợi hàng nghìn giao dịch mỗi giây",
            pl: "Oczekuj tysięcy transakcji na sekundę",
            ro: "Așteptați-vă la mii de tranzacții pe secundă",
            nl: "Verwacht duizenden transacties per seconde",
            el: "Αναμένετε χιλιάδες συναλλαγές ανά δευτερόλεπτο",
            th: "คาดหวังธุรกรรมหลายพันรายการต่อวินาที",
            cs: "Očekávejte tisíce transakcí za sekundu",
            hu: "Számítson másodpercenként több ezer tranzakcióra",
            sv: "Förvänta dig tusentals transaktioner per sekund",
            da: "Forvent tusindvis af transaktioner pr. sekund",
          })}
        </div>
        <div className="h-32" />
        <WasmMachine />
        <div className="h-4" />
        <div className="text-center text-default-contrast">
          {Lang.match({
            en: "Live transactions running in your browser",
            zh: "在您的浏览器中运行的实时交易",
            hi: "आपके ब्राउज़र में चल रहे लाइव लेनदेन",
            es: "Transacciones en vivo que se ejecutan en tu navegador",
            ar: "المعاملات الحية التي تعمل في متصفحك",
            fr: "Transactions en direct s'exécutant dans votre navigateur",
            de: "Live-Transaktionen, die in Ihrem Browser ausgeführt werden",
            ru: "Живые транзакции, выполняемые в вашем браузере",
            pt: "Transações ao vivo sendo executadas no seu navegador",
            ja: "ブラウザで実行されているライブトランザクション",
            pa: "ਤੁਹਾਡੇ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਚੱਲ ਰਹੀਆਂ ਲਾਈਵ ਲੈਣ-ਦੇਣ",
            bn: "আপনার ব্রাউজারে চলমান লাইভ লেনদেন",
            id: "Transaksi langsung yang berjalan di browser Anda",
            ur: "آپ کے براؤزر میں چلنے والے لائیو لین دین",
            ms: "Transaksi langsung yang berjalan dalam pelayar anda",
            it: "Transazioni live in esecuzione nel tuo browser",
            tr: "Tarayıcınızda çalışan canlı işlemler",
            ta: "உங்கள் உலாவியில் இயங்கும் நேரடி பரிவர்த்தனைகள்",
            te: "మీ బ్రౌజర్‌లో నడిచే ప్రత్యక్ష లావాదేవీలు",
            ko: "브라우저에서 실행되는 라이브 트랜잭션",
            vi: "Giao dịch trực tiếp đang chạy trong trình duyệt của bạn",
            pl: "Transakcje na żywo działające w Twojej przeglądarce",
            ro: "Tranzacții live care rulează în browserul dvs.",
            nl: "Live transacties die in uw browser worden uitgevoerd",
            el: "Ζωντανές συναλλαγές που εκτελούνται στο πρόγραμμα περιήγησής σας",
            th: "ธุรกรรมสดที่ทำงานในเบราว์เซอร์ของคุณ",
            cs: "Živé transakce běžící ve vašem prohlížeči",
            hu: "Élő tranzakciók futnak a böngészőjében",
            sv: "Live-transaktioner som körs i din webbläsare",
            da: "Live-transaktioner, der kører i din browser",
          })}
        </div>
        <div className="h-[max(24rem,50dvh)]" />
        <div className="text-center text-5xl md:text-6xl font-medium">
          {Lang.match({
            en: "Made for the web",
            zh: "为网络而生",
            hi: "वेब के लिए बनाया गया",
            es: "Hecho para la web",
            ar: "مصنوع للويب",
            fr: "Conçu pour le web",
            de: "Für das Web gemacht",
            ru: "Создано для Интернета",
            pt: "Feito para a web",
            ja: "ウェブのために作られた",
            pa: "ਵੈੱਬ ਲਈ ਬਣਾਇਆ ਗਿਆ",
            bn: "ওয়েবের জন্য তৈরি",
            id: "Dibuat untuk web",
            ur: "ویب کے لیے بنایا گیا",
            ms: "Dibuat untuk web",
            it: "Realizzato per il web",
            tr: "Web için yapıldı",
            ta: "வலைக்காக உருவாக்கப்பட்டது",
            te: "వెబ్ కోసం తయారు చేయబడింది",
            ko: "웹을 위해 만들어졌습니다",
            vi: "Được tạo cho web",
            pl: "Stworzony dla sieci",
            ro: "Creat pentru web",
            nl: "Gemaakt voor het web",
            el: "Κατασκευασμένο για τον ιστό",
            th: "สร้างขึ้นสำหรับเว็บ",
            cs: "Vytvořeno pro web",
            hu: "A web számára készült",
            sv: "Gjord för webben",
            da: "Lav til nettet",
          })}
        </div>
        <div className="h-4" />
        <div className="text-center text-default-contrast text-xl md:text-2xl">
          {Lang.match({
            en: "Made with web technologies, everything can run in a browser",
            zh: "使用网络技术制作，一切都可以在浏览器中运行",
            hi: "वेब तकनीकों के साथ बनाया गया, सब कुछ ब्राउज़र में चल सकता है",
            es: "Hecho con tecnologías web, todo puede ejecutarse en un navegador",
            ar: "مصنوع بتقنيات الويب، يمكن تشغيل كل شيء في المتصفح",
            fr: "Conçu avec des technologies web, tout peut fonctionner dans un navigateur",
            de: "Hergestellt mit Webtechnologien, alles kann in einem Browser ausgeführt werden",
            ru: "Создано с использованием веб-технологий, все может работать в браузере",
            pt: "Feito com tecnologias web, tudo pode ser executado em um navegador",
            ja: "Webテクノロジーで作成されており、すべてがブラウザで実行できます",
            pa: "ਵੈੱਬ ਤਕਨਾਲੋਜੀਆਂ ਨਾਲ ਬਣਾਇਆ ਗਿਆ, ਸਭ ਕੁਝ ਬ੍ਰਾਊਜ਼ਰ ਵਿੱਚ ਚੱਲ ਸਕਦਾ ਹੈ",
            bn: "ওয়েব প্রযুক্তি দিয়ে তৈরি, সবকিছু ব্রাউজারে চালানো যেতে পারে",
            id: "Dibuat dengan teknologi web, semuanya dapat dijalankan di browser",
            ur: "ویب ٹیکنالوجیز کے ساتھ بنایا گیا، سب کچھ براؤزر میں چل سکتا ہے",
            ms: "Dibuat dengan teknologi web, semuanya boleh dijalankan dalam pelayar",
            it: "Realizzato con tecnologie web, tutto può essere eseguito in un browser",
            tr: "Web teknolojileri ile yapıldı, her şey bir tarayıcıda çalışabilir",
            ta: "வலை தொழில்நுட்பங்களுடன் உருவாக்கப்பட்டது, அனைத்தும் உலாவியில் இயங்கலாம்",
            te: "వెబ్ టెక్నాలజీలతో తయారు చేయబడింది, అన్నీ బ్రౌజర్‌లో నడవచ్చు",
            ko: "웹 기술로 제작되었으며 모든 것이 브라우저에서 실행될 수 있습니다",
            vi: "Được tạo bằng công nghệ web, mọi thứ có thể chạy trong trình duyệt",
            pl: "Wykonane za pomocą technologii internetowych, wszystko może działać w przeglądarce",
            ro: "Realizat cu tehnologii web, totul poate rula într-un browser",
            nl: "Gemaakt met webtechnologieën, alles kan in een browser worden uitgevoerd",
            el: "Κατασκευασμένο με τεχνολογίες ιστού, όλα μπορούν να εκτελεστούν σε πρόγραμμα περιήγησης",
            th: "สร้างด้วยเทคโนโลยีเว็บ ทุกอย่างสามารถทำงานในเบราว์เซอร์ได้",
            cs: "Vytvořeno pomocí webových technologií, vše může běžet v prohlížeči",
            hu: "Webes technológiákkal készült, minden böngészőben futtatható",
            sv: "Gjord med webteknologier, allt kan köras i en webbläsare",
            da: "Lav med webteknologier, alt kan køre i en browser",
          })}
        </div>
        <div className="h-32" />
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-lg md:text-xl text-center">
              WebAssembly
            </div>
          </div>
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-lg md:text-xl text-center">
              WebSocket
            </div>
          </div>
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-lg md:text-xl text-center">
              HTTP
            </div>
          </div>
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-lg md:text-xl text-center">
              TypeScript
            </div>
          </div>
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-lg md:text-xl text-center">
              Workers
            </div>
          </div>
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-lg md:text-xl text-center">
              AssemblyScript
            </div>
          </div>
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-lg md:text-xl text-center">
              BigInt
            </div>
          </div>
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-lg md:text-xl text-center">
              OPFS
            </div>
          </div>
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-lg md:text-xl text-center">
              SHA-256
            </div>
          </div>
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-lg md:text-xl text-center">
              Ed25519
            </div>
          </div>
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-lg md:text-xl text-center">
              IndexedDB
            </div>
          </div>
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-lg md:text-xl text-center">
              Base64
            </div>
          </div>
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-lg md:text-xl text-center">
              JSON
            </div>
          </div>
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-lg md:text-xl text-center">
              FormData
            </div>
          </div>
          <div className="bg-default-contrast p-4 rounded-xl">
            <div className="text-lg md:text-xl text-center">
              SQLite
            </div>
          </div>
        </div>
        <div className="h-[max(24rem,50dvh)]" />
        <div className="text-center text-5xl md:text-6xl font-medium">
          {Lang.match({
            en: "Run it yourself",
            zh: "自己运行它",
            hi: "इसे खुद चलाएं",
            es: "Ejecutarlo tú mismo",
            ar: "قم بتشغيلها بنفسك",
            fr: "Exécutez-le vous-même",
            de: "Führen Sie es selbst aus",
            ru: "Запустите это самостоятельно",
            pt: "Execute você mesmo",
            ja: "自分で実行する",
            pa: "ਇਸਨੂੰ ਖੁਦ ਚਲਾਓ",
            bn: "নিজে এটি চালান",
            id: "Jalankan sendiri",
            ur: "خود اسے چلائیں",
            ms: "Jalankan sendiri",
            it: "Eseguilo tu stesso",
            tr: "Kendiniz çalıştırın",
            ta: "நீங்கள் அதை இயக்குங்கள்",
            te: "దీనిని మీరు నడపండి",
            ko: "직접 실행해 보세요",
            vi: "Tự chạy nó",
            pl: "Uruchom to sam",
            ro: "Rulați-l singur",
            nl: "Voer het zelf uit",
            el: "Τρέξτε το μόνοι σας",
            th: "เรียกใช้ด้วยตัวคุณเอง",
            cs: "Spusťte to sami",
            hu: "Futtassa maga",
            sv: "Kör det själv",
            da: "Kør det selv",
          })}
        </div>
        <div className="h-4" />
        <a className="text-center text-default-contrast text-xl md:text-2xl hover:underline"
          href="https://github.com/hazae41/bobine"
          target="_blank noreferrer">
          {Lang.match({
            en: "Click here to open GitHub",
            zh: "点击此处打开GitHub",
            hi: "GitHub खोलने के लिए यहां क्लिक करें",
            es: "Haga clic aquí para abrir GitHub",
            ar: "انقر هنا لفتح GitHub",
            fr: "Cliquez ici pour ouvrir GitHub",
            de: "Klicken Sie hier, um GitHub zu öffnen",
            ru: "Нажмите здесь, чтобы открыть GitHub",
            pt: "Clique aqui para abrir o GitHub",
            ja: "GitHubを開くにはここをクリックしてください",
            pa: "GitHub ਖੋਲ੍ਹਣ ਲਈ ਇੱਥੇ ਕਲਿੱਕ ਕਰੋ",
            bn: "GitHub খুলতে এখানে ক্লিক করুন",
            id: "Klik di sini untuk membuka GitHub",
            ur: "GitHub کھولنے کے لیے یہاں کلک کریں",
            ms: "Klik di sini untuk membuka GitHub",
            it: "Clicca qui per aprire GitHub",
            tr: "GitHub'u açmak için buraya tıklayın",
            ta: "GitHub திறக்க இங்கே கிளிக் செய்யவும்",
            te: "GitHub ను తెరవడానికి ఇక్కడ క్లిక్ చేయండి",
            ko: "GitHub를 열려면 여기를 클릭하세요",
            vi: "Nhấp vào đây để mở GitHub",
            pl: "Kliknij tutaj, aby otworzyć GitHub",
            ro: "Faceți clic aici pentru a deschide GitHub",
            nl: "Klik hier om GitHub te openen",
            el: "Κάντε κλικ εδώ για να ανοίξετε το GitHub",
            th: "คลิกที่นี่เพื่อเปิด GitHub",
            cs: "Klikněte zde pro otevření GitHubu",
            hu: "Kattintson ide a GitHub megnyitásához",
            sv: "Klicka här för att öppna GitHub",
            da: "Klik her for at åbne GitHub",
          })}
        </a>
        <div className="h-[max(24rem,50dvh)]" />
        <a className="text-center hover:underline"
          href="https://brume.tech"
          target="_blank noreferrer">
          {Lang.match({
            en: "Made by cypherpunks",
            zh: "由赛博朋克制作",
            hi: "साइबरपंक द्वारा बनाया गया",
            es: "Hecho por cypherpunks",
            ar: "مصنوع من قبل سايفربانكس",
            fr: "Fait par des cypherpunks",
            de: "Hergestellt von Cypherpunks",
            ru: "Создано киберпанками",
            pt: "Feito por cypherpunks",
            ja: "サイバーパンクによって作られた",
            pa: "ਸਾਈਬਰਪੰਕਸ ਦੁਆਰਾ ਬਣਾਇਆ ਗਿਆ",
            bn: "সাইফারপাঙ্ক দ্বারা তৈরি",
            id: "Dibuat oleh cypherpunks",
            ur: "سائبرپنکس کے ذریعہ بنایا گیا",
            ms: "Dibuat oleh cypherpunks",
            it: "Realizzato da cypherpunks",
            tr: "Cypherpunks tarafından yapıldı",
            ta: "சைபர்பங்க்ஸ் மூலம் உருவாக்கப்பட்டது",
            te: "సైఫర్పంక్స్ ద్వారా తయారు చేయబడింది",
            ko: "사이버펑크가 제작",
            vi: "Được tạo bởi cypherpunks",
            pl: "Stworzone przez cypherpunks",
            ro: "Realizat de cypherpunks",
            nl: "Gemaakt door cypherpunks",
            el: "Κατασκευάστηκε από cypherpunks",
            th: "สร้างโดย cypherpunks",
            cs: "Vytvořeno cypherpunks",
            hu: "Cypherpunks által készített",
            sv: "Gjord av cypherpunks",
            da: "Lavet af cypherpunks",
          })}
        </a>
        <div className="h-4" />
      </div>
    </div>
  </div>
}

export function Code(props: ChildrenProps & { language: string }) {
  const { children, language } = props

  const [code, setCode] = useState<Nullable<HTMLElement>>()

  useEffect(() => {
    if (!code)
      return
    code.innerHTML = hljs.highlight(code.textContent, { language }).value
  }, [code, language])

  return <div className="h-full w-full bg-default-contrast rounded-xl p-4 pb-2">
    <div className="pb-2 text-left whitespace-pre font-mono overflow-x-scroll" dir="ltr"
      ref={setCode}>
      {children}
    </div>
  </div>
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

    setMessages(messages => [Lang.match({
      en: `You just generated ${value.toString()} sparks`,
      zh: `您刚刚生成了 ${value.toString()} 个火花`,
      hi: `आपने अभी-अभी ${value.toString()} स्पार्क्स जनरेट किए हैं`,
      es: `Acabas de generar ${value.toString()} chispas`,
      ar: `لقد قمت للتو بإنشاء ${value.toString()} شرارات`,
      fr: `Vous venez de générer ${value.toString()} étincelles`,
      de: `Sie haben gerade ${value.toString()} Funken erzeugt`,
      ru: `Вы только что сгенерировали ${value.toString()} искр`,
      pt: `Você acabou de gerar ${value.toString()} faíscas`,
      ja: `あなたはちょうど${value.toString()}スパークを生成しました`,
      pa: `ਤੁਸੀਂ ਹੁਣੇ ਹੀ ${value.toString()} ਸਪਾਰਕਸ ਜਨਰੇਟ ਕੀਤੇ ਹਨ`,
      bn: `আপনি মাত্র ${value.toString()} স্পার্কস তৈরি করেছেন`,
      id: `Anda baru saja menghasilkan ${value.toString()} sparks`,
      ur: `آپ نے ابھی ${value.toString()} چنگاریاں پیدا کی ہیں`,
      ms: `Anda baru sahaja menjana ${value.toString()} sparks`,
      it: `Hai appena generato ${value.toString()} scintille`,
      tr: `Az önce ${value.toString()} kıvılcım ürettiniz`,
      ta: `நீங்கள் இப்போது ${value.toString()} ஸ்பார்க்ஸை உருவாக்கியுள்ளீர்கள்`,
      te: `మీరు ఇప్పుడే ${value.toString()} స్పార్క్స్‌ను ఉత్పత్తి చేశారు`,
      ko: `방금 ${value.toString()} 스파크를 생성했습니다`,
      vi: `Bạn vừa tạo ra ${value.toString()} tia lửa`,
      pl: `Właśnie wygenerowałeś ${value.toString()} iskier`,
      ro: `Tocmai ai generat ${value.toString()} scântei`,
      nl: `Je hebt zojuist ${value.toString()} vonken gegenereerd`,
      el: `Μόλις δημιουργήσατε ${value.toString()} σπινθήρες`,
      th: `คุณเพิ่งสร้างประกายไฟ ${value.toString()}`,
      cs: `Právě jste vygenerovali ${value.toString()} jisker`,
      hu: `Éppen most generáltál ${value.toString()} szikrát`,
      sv: `Du genererade precis ${value.toString()} gnistor`,
      da: `Du har lige genereret ${value.toString()} gnister`,
    }), ...messages.slice(0, 100)])
  }, [worker])

  const [running, setRunning] = useState<boolean>(false)

  const [observer, setObserver] = useState<IntersectionObserver>()

  useEffect(() => {
    setObserver(new IntersectionObserver((entries) => setRunning(entries[0].isIntersecting)))
  }, [])

  const [div, setDiv] = useState<Nullable<HTMLDivElement>>()

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

  const [div, setDiv] = useState<Nullable<HTMLDivElement>>()

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
      <div className={`absolute bg-opposite left-[${x}%] bottom-[${y}%] -translate-x-[${(x / 2) + 25}%] translate-y-[${(y / 2) + 25}%] size-1 rounded-full`} />
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