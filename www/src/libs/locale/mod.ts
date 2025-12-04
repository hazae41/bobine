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
