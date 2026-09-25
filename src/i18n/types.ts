export const LOCALES = ["id", "en", "ja", "ko", "zh", "ru", "fr", "de"] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * Satu entri terjemahan wajib mengisi SEMUA bahasa di LOCALES.
 * TypeScript menolak kamus yang kelewat satu bahasa, jadi tidak mungkin ada teks
 * yang diam-diam jatuh kembali ke Bahasa Indonesia tanpa ketahuan.
 */
export type Entry = Record<Locale, string>;

export type Dictionary = Record<string, Entry>;

export const LOCALE_META: Record<
  Locale,
  { name: string; nativeName: string; flag: string; intl: string }
> = {
  id: { name: "Bahasa Indonesia", nativeName: "Bahasa Indonesia", flag: "🇮🇩", intl: "id-ID" },
  en: { name: "English", nativeName: "English", flag: "🇬🇧", intl: "en-US" },
  ja: { name: "Japanese", nativeName: "日本語", flag: "🇯🇵", intl: "ja-JP" },
  ko: { name: "Korean", nativeName: "한국어", flag: "🇰🇷", intl: "ko-KR" },
  zh: { name: "Chinese", nativeName: "中文", flag: "🇨🇳", intl: "zh-CN" },
  ru: { name: "Russian", nativeName: "Русский", flag: "🇷🇺", intl: "ru-RU" },
  fr: { name: "French", nativeName: "Français", flag: "🇫🇷", intl: "fr-FR" },
  de: { name: "German", nativeName: "Deutsch", flag: "🇩🇪", intl: "de-DE" },
};
