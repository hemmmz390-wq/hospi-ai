import { Entry } from "../types";

/**
 * Pembuat entri ringkas. Urutan argumen WAJIB mengikuti LOCALES:
 * id, en, ja, ko, zh, ru, fr, de.
 */
export const e = (id: string, en: string, ja: string, ko: string, zh: string, ru: string, fr: string, de: string): Entry => ({
  id,
  en,
  ja,
  ko,
  zh,
  ru,
  fr,
  de,
});
