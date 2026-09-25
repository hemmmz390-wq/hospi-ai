import { Language } from "../types";
import { seedNotifications, seedRooms, seedTickets, withActiveCounts } from "./seed";

export { SLA_ROUTING_CONFIG } from "./sla";
export { FOOD_MENU } from "./menu";

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: "id",
    name: "Bahasa Indonesia",
    nativeName: "Bahasa Indonesia",
    flag: "🇮🇩",
    greeting: "Selamat Datang di Hospi Resort",
    welcomeSub: "Pusat bantuan langsung ke staf hotel kami",
  },
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇬🇧",
    greeting: "Welcome to Hospi Resort",
    welcomeSub: "Direct assistance to our hotel team",
  },
  {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    greeting: "ホスピ・リゾートへようこそ",
    welcomeSub: "客室サービスへ直接つながります",
  },
  {
    code: "zh",
    name: "Chinese",
    nativeName: "中文",
    flag: "🇨🇳",
    greeting: "欢迎来到 Hospi 度假酒店",
    welcomeSub: "客房服务将为您提供全方位协助",
  },
  {
    code: "ko",
    name: "Korean",
    nativeName: "한국어",
    flag: "🇰🇷",
    greeting: "호스피 리조트에 오신 것을 환영합니다",
    welcomeSub: "호텔 직원과 바로 연결됩니다",
  },
  {
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
    flag: "🇷🇺",
    greeting: "Добро пожаловать в Hospi Resort",
    welcomeSub: "Прямая связь с персоналом отеля",
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    greeting: "Bienvenue à Hospi Resort",
    welcomeSub: "Assistance directe vers notre équipe",
  },
  {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    greeting: "Willkommen im Hospi Resort",
    welcomeSub: "Direkte Unterstützung durch unser Team",
  },
];

const seededAt = new Date();
const tickets = seedTickets(seededAt);

/** Waktu data demo dibuat. Data yang tersimpan lebih lama dari 12 jam dibuat ulang. */
export const SEEDED_AT = seededAt.toISOString();
export const INITIAL_TICKETS = tickets;
export const INITIAL_ROOMS = withActiveCounts(seedRooms(seededAt), tickets);
export const INITIAL_NOTIFICATIONS = seedNotifications(seededAt);
