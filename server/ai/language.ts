import { replies } from "../../src/i18n/locales/replies";
import { LOCALES, Locale } from "../../src/i18n/types";

/** Normalkan kode bahasa apa pun ("zh-Hans-CN", "Chinese") ke Locale yang didukung. */
export function normalizeLocale(input?: string): Locale {
  if (!input) return "id";
  const raw = String(input).toLowerCase();
  const byName: Record<string, Locale> = {
    indonesia: "id", indonesian: "id", "bahasa indonesia": "id",
    english: "en", japanese: "ja", korean: "ko",
    chinese: "zh", mandarin: "zh", russian: "ru",
    french: "fr", german: "de",
  };
  if (byName[raw]) return byName[raw];
  const base = raw.split(/[-_]/)[0] as Locale;
  return (LOCALES as readonly string[]).includes(base) ? base : "id";
}

const STOPWORDS: Record<"id" | "en" | "fr" | "de", string[]> = {
  id: ["saya", "tolong", "kamar", "tidak", "boleh", "minta", "ya", "dan", "yang", "bisa", "mau", "di", "ke", "apa", "jam", "dong", "nggak", "gak", "kok", "sama", "untuk", "ada", "mohon"],
  en: ["the", "please", "my", "is", "can", "i", "room", "not", "and", "could", "would", "to", "a", "some", "isn't", "i'd", "get", "have", "there", "with", "at", "need"],
  fr: ["le", "la", "les", "je", "ne", "pas", "est", "de", "des", "pour", "vous", "chambre", "une", "un", "il", "moi", "mes", "avec", "pourriez", "voudrais"],
  de: ["der", "die", "das", "ich", "nicht", "ist", "und", "bitte", "mein", "meine", "zimmer", "ein", "eine", "können", "wir", "funktioniert", "kein", "mit"],
};

/**
 * Menebak bahasa yang benar-benar dipakai tamu dari pesannya.
 *
 * Aksara non-Latin langsung menentukan bahasanya. Untuk aksara Latin dipakai
 * hitungan kata umum; bila tidak ada yang menonjol, dipakai bahasa antarmuka
 * tamu. Tanpa ini mesin cadangan membalas dalam bahasa antarmuka, padahal tamu
 * bisa saja menulis dalam bahasa lain.
 */
export function detectLanguage(text: string, fallback: Locale): Locale {
  if (/[぀-ヿ]/.test(text)) return "ja";
  if (/[가-힯]/.test(text)) return "ko";
  if (/[一-鿿]/.test(text)) return "zh";
  if (/[Ѐ-ӿ]/.test(text)) return "ru";

  const words = text.toLowerCase().match(/[\p{L}']+/gu) || [];
  const score = { id: 0, en: 0, fr: 0, de: 0 };
  for (const w of words) {
    for (const lang of Object.keys(STOPWORDS) as (keyof typeof STOPWORDS)[]) {
      if (STOPWORDS[lang].includes(w)) score[lang] += 1;
    }
  }
  if (/[àâçéèêëîïôûùüÿœ]/.test(text.toLowerCase())) score.fr += 1;
  if (/[äöüß]/.test(text.toLowerCase())) score.de += 1;

  const ranked = (Object.entries(score) as [Locale, number][]).sort((a, b) => b[1] - a[1]);
  if (ranked[0][1] === 0 || ranked[0][1] === ranked[1][1]) return fallback;
  return ranked[0][0];
}

export type ReplyKey = keyof typeof replies;

/** Balasan mesin cadangan dalam bahasa tamu, dengan placeholder {nama} terisi. */
export function reply(key: ReplyKey, locale: Locale, vars: Record<string, string | number> = {}) {
  let out: string = replies[key][locale] || replies[key].en;
  for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
  return out;
}

const INTL: Record<Locale, string> = {
  id: "id-ID", en: "en-US", ja: "ja-JP", ko: "ko-KR", zh: "zh-CN", ru: "ru-RU", fr: "fr-FR", de: "de-DE",
};

export function formatRupiah(amount: number, locale: Locale) {
  return `Rp ${amount.toLocaleString(INTL[locale])}`;
}
