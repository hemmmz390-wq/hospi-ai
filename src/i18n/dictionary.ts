import { app } from "./locales/app";
import { guestApp } from "./locales/guestApp";
import { staffApp } from "./locales/staffApp";
import { landing } from "./locales/landing";
import { replies } from "./locales/replies";
import { explore } from "./locales/explore";

/**
 * Kamus tunggal aplikasi, disusun key-major: satu key berisi kedelapan bahasa
 * berdampingan. Menambah teks baru memaksa penulisnya mengisi semua bahasa
 * sekaligus — TypeScript menolak entri yang kelewat satu bahasa.
 */
export const dictionary = {
  ...app,
  ...guestApp,
  ...staffApp,
  ...landing,
  ...replies,
  ...explore,
};

export type TranslationKey = keyof typeof dictionary;
