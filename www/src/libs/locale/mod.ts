export type Locale =
  | "en"
  | "zh"
  | "hi"
  | "es"
  | "ar"
  | "fr"
  | "de"
  | "ru"
  | "pt"
  | "ja"
  | "pa"
  | "bn"
  | "id"
  | "ur"
  | "ms"
  | "it"
  | "tr"
  | "ta"
  | "te"
  | "ko"
  | "vi"
  | "pl"
  | "ro"
  | "nl"
  | "el"
  | "th"
  | "cs"
  | "hu"
  | "sv"
  | "da"

export type Localized = string | Record<Locale, string>

export function delocalize(localized: Localized) {
  if (typeof localized === "string")
    return localized

  if (localized[document.documentElement.lang] != null)
    return localized[document.documentElement.lang]

  for (const language of navigator.languages) {
    const locale = language.split("-")[0]

    if (localized[locale] != null)
      return localized[locale]

    continue
  }

  return localized["en"]
}

export const dir = {
  en: "ltr",
  zh: "ltr",
  hi: "ltr",
  es: "ltr",
  ar: "rtl",
  fr: "ltr",
  de: "ltr",
  ru: "ltr",
  pt: "ltr",
  ja: "ltr",
  pa: "ltr",
  bn: "ltr",
  id: "ltr",
  ur: "rtl",
  ms: "ltr",
  it: "ltr",
  tr: "ltr",
  ta: "ltr",
  te: "ltr",
  ko: "ltr",
  vi: "ltr",
  pl: "ltr",
  ro: "ltr",
  nl: "ltr",
  el: "ltr",
  th: "ltr",
  cs: "ltr",
  hu: "ltr",
  sv: "ltr",
  da: "ltr",
} as const