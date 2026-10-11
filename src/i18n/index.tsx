import React, { createContext, useContext, useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { Locale, LOCALES, LOCALE_META } from "./types";
import { dictionary, TranslationKey } from "./dictionary";
export type { TranslationKey };

const STORAGE_KEY = "hospi_locale_v1";

/**
 * Menebak bahasa awal dari browser tamu (Fase 1: Onboarding).
 * `navigator.languages` dicoba berurutan agar "ja-JP" -> "ja", "zh-Hans-CN" -> "zh".
 * Jatuh ke Bahasa Indonesia bila tidak ada yang cocok.
 */
export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "id";
  const candidates = [
    ...(navigator.languages || []),
    navigator.language,
  ].filter(Boolean) as string[];

  for (const tag of candidates) {
    const base = tag.toLowerCase().split("-")[0];
    const hit = LOCALES.find((l) => l === base);
    if (hit) return hit;
  }
  return "id";
}

function readStoredLocale(key: string = STORAGE_KEY): Locale | null {
  try {
    const saved = localStorage.getItem(key);
    return LOCALES.find((l) => l === saved) || null;
  } catch {
    return null;
  }
}

type Vars = Record<string, string | number>;

/**
 * Bahasa disimpan per "lingkup": tiap kamar tamu punya bahasanya sendiri
 * (bawaan: bahasa di profil tamu), staf punya satu bahasa bersama yang diatur
 * Front Office, dan halaman umum (landing, demo) memakai lingkup umum.
 * Dengan begitu tamu Jepang di 501 dan tamu Inggris di 508 tampil berbeda,
 * sementara laporan staf mengikuti bahasa staf.
 */
type Scope = { key: string; fallback: Locale };

interface I18nContextValue {
  locale: Locale;
  /** Pindah lingkup bahasa. Dipakai lewat useLocaleScope(). */
  setScope: (key: string, fallback: Locale) => void;
  setLocale: (l: Locale) => void;
  /** Terjemahkan sebuah key. `vars` mengisi placeholder bergaya {nama}. */
  t: (key: TranslationKey, vars?: Vars) => string;
  /** Format angka rupiah mengikuti locale aktif. */
  formatCurrency: (amount: number) => string;
  /** Format angka biasa mengikuti locale aktif. */
  formatNumber: (n: number) => string;
  localeMeta: typeof LOCALE_META;
  availableLocales: readonly Locale[];
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(
    () => readStoredLocale() || detectBrowserLocale()
  );
  const scopeRef = useRef<Scope>({ key: STORAGE_KEY, fallback: detectBrowserLocale() });

  const setScope = useCallback((key: string, fallback: Locale) => {
    scopeRef.current = { key, fallback };
    setLocaleState(readStoredLocale(key) || fallback);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(scopeRef.current.key, l);
    } catch {
      /* mode privat: cukup simpan di memori */
    }
  }, []);

  // Bantu pembaca layar & pemenggalan kata browser mengikuti bahasa aktif.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (key: TranslationKey, vars?: Vars) => {
      const entry = dictionary[key];
      if (!entry) {
        // Key tidak dikenal: tampilkan key-nya agar cepat ketahuan saat pengembangan,
        // bukan string kosong yang diam-diam hilang dari layar.
        if ((import.meta as any).env?.DEV) console.warn(`[i18n] key tidak ditemukan: ${key}`);
        return key;
      }
      let out = entry[locale] || entry.id;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          out = out.split(`{${k}}`).join(String(v));
        }
      }
      return out;
    },
    [locale]
  );

  // "Rp 150.000" / "Rp 150,000": simbol rupiah yang dikenal tamu, pemisah ribuan
  // mengikuti bahasa. Format mata uang bawaan Intl menulis "IDR 150,000".
  const formatCurrency = useCallback(
    (amount: number) => `Rp ${new Intl.NumberFormat(LOCALE_META[locale].intl, { maximumFractionDigits: 0 }).format(amount)}`,
    [locale]
  );

  const formatNumber = useCallback(
    (n: number) => new Intl.NumberFormat(LOCALE_META[locale].intl).format(n),
    [locale]
  );

  return (
    <I18nContext.Provider
      value={{
        locale,
        setScope,
        setLocale,
        t,
        formatCurrency,
        formatNumber,
        localeMeta: LOCALE_META,
        availableLocales: LOCALES,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n harus dipakai di dalam <I18nProvider>");
  return ctx;
}

/**
 * Pakai lingkup bahasa selama komponen ini tampil, lalu kembali ke lingkup
 * umum. useLayoutEffect: bahasa sudah benar sebelum layar pertama digambar.
 */
export function useLocaleScope(key: string, fallback: Locale) {
  const { setScope } = useI18n();
  useLayoutEffect(() => {
    setScope(key, fallback);
  }, [key, fallback, setScope]);
  useLayoutEffect(() => () => setScope(STORAGE_KEY, readStoredLocale() || detectBrowserLocale()), [setScope]);
}

/** Kunci penyimpanan bahasa per kamar tamu dan untuk staf. */
export const guestLocaleKey = (room: string) => `hospi_locale_room_${room}`;
export const STAFF_LOCALE_KEY = "hospi_locale_staff";
/** Bahasa laporan staf bila Front Office belum memilih. */
export const STAFF_DEFAULT_LOCALE: Locale = "id";

/** Bahasa yang sedang dipakai tamu di kamar tertentu (untuk mode presentasi). */
export function storedGuestLocale(room: string, fallback: Locale): Locale {
  return readStoredLocale(guestLocaleKey(room)) || fallback;
}

export type { Locale };
export { LOCALES, LOCALE_META };

/**
 * Pembantu untuk mengubah nilai domain (status tiket, departemen, prioritas,
 * status kamar) menjadi key kamus yang bertipe benar.
 */
export const statusKey = (s: string) => `status.${s}` as TranslationKey;
export const deptKey = (d: string) => `dept.${d}` as TranslationKey;
export const priorityKey = (p: string) => `priority.${p}` as TranslationKey;
export const roomStatusKey = (r: string) => `room.${r}` as TranslationKey;
