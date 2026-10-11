import type { TranslationKey } from "../i18n";
import { LOCALE_META, LOCALES, Locale } from "../i18n/types";
import { ServiceTicket } from "../types";

type T = (key: TranslationKey, vars?: Record<string, string | number>) => string;

/**
 * Judul tiket tersimpan dalam bahasa Inggris (dari AI, data contoh, dan
 * permintaan cepat). Di layar staf judul itu diterjemahkan ke bahasa staf.
 * Judul yang tidak dikenal (mis. nama paket tur) ditampilkan apa adanya.
 */
const TITLES: Record<string, TranslationKey> = {
  "room cleaning": "tt.roomCleaning",
  "extra bath towels": "tt.bathTowels",
  "no hot water": "tt.noHotWater",
  "extra pillows": "tt.extraPillows",
  "extra pillow": "tt.extraPillows",
  "ac not cooling": "tt.acNotCooling",
  "ac making noise": "tt.acNoise",
  "ac leaking": "tt.acLeaking",
  "ac leaking water": "tt.acLeaking",
  "ac issue": "tt.acIssue",
  "water & tissues": "tt.waterTissues",
  "tv remote not responding": "tt.tvRemote",
  "tv not working": "tt.tvBroken",
  "wi-fi not working": "tt.wifiBroken",
  "special request": "tt.specialRequest",
  "soap & shampoo": "tt.soapShampoo",
  "room slippers": "tt.slippers",
  "pool towels": "tt.poolTowels",
  "luggage pick-up": "tt.luggagePickup",
  "help with luggage": "tt.luggageHelp",
  escort: "tt.escort",
  "bell service": "tt.bellService",
  "late checkout request": "tt.lateRequest",
  "key card not working": "tt.keyCard",
  "door lock / key card": "tt.doorLock",
  "extra blanket": "tt.blanket",
  "complaint: room not cleaned": "tt.complaintNotCleaned",
  "blocked sink": "tt.blockedSink",
  "bedside lamp not working": "tt.lamp",
  "guest complaint": "tt.guestComplaint",
  "food order": "tt.foodOrder",
  "electrical issue": "tt.electrical",
  "plumbing issue": "tt.plumbing",
  "emergency reported": "tt.emergency",
  "fire or smoke": "tt.fire",
  "medical emergency": "tt.medical",
  security: "tt.security",
  emergency: "tt.emergency",
  "extra linen or pillows": "tt.linenPillows",
  "guest asked to talk to staff": "tt.talkToStaff",
  "guest request": "tt.guestRequest",
  "guest message (ai unavailable)": "tt.aiUnavailable",
  amenities: "tt.amenities",
  "bottled water": "tt.bottledWater",
};

const ITEMS: Record<string, TranslationKey> = {
  towels: "ti.towels",
  toiletries: "ti.toiletries",
  tissues: "ti.tissues",
  slippers: "ti.slippers",
  "dental kit": "ti.dental",
  water: "ti.water",
};

export function ticketTitle(t: T, ticket: Pick<ServiceTicket, "taskTitle">): string {
  return translateTitle(t, ticket.taskTitle);
}

function translateTitle(t: T, raw: string): string {
  const title = raw.trim();
  // "Extra pillow ×2": terjemahkan judulnya, pertahankan jumlahnya.
  const qty = title.match(/^(.*?)(\s×\d+)$/);
  if (qty) return translateTitle(t, qty[1]) + qty[2];

  const key = TITLES[title.toLowerCase()];
  if (key) return t(key);

  let m = title.match(/^In-room dining \((\d+) items?\)$/i);
  if (m) return t("tt.dining", { n: m[1] });
  m = title.match(/^Table (\S+) order \((\d+) items?\)$/i);
  if (m) return t("tt.table", { table: m[1], n: m[2] });
  m = title.match(/^Late checkout until (.+)$/i);
  if (m) return t("tt.late", { hour: m[1] });
  m = title.match(/^Car to (.+)$/i);
  if (m) return t("g.exTitle", { place: m[1] });
  m = title.match(/^Escalation: (.+)$/i);
  if (m) return t("tt.escalation", { title: translateTitle(t, m[1]) });
  m = title.match(/^Extra (.+)$/i);
  if (m) {
    const parts = m[1].split(/,\s*|\s+&\s+/).map((p) => p.trim().toLowerCase());
    if (parts.every((p) => ITEMS[p])) return t("tt.extra", { items: parts.map((p) => t(ITEMS[p])).join(", ") });
  }
  return title;
}

/** Nama bahasa tamu dalam bahasa staf, mis. "Japanese" → "Jepang" untuk staf berbahasa Indonesia. */
export function languageName(original: string, staffLocale: Locale): string {
  const code = LOCALES.find((l) => LOCALE_META[l].name === original || LOCALE_META[l].nativeName === original || l === original);
  if (!code) return original;
  try {
    const name = new Intl.DisplayNames([LOCALE_META[staffLocale].intl], { type: "language" }).of(code);
    return name ? name.charAt(0).toLocaleUpperCase(LOCALE_META[staffLocale].intl) + name.slice(1) : original;
  } catch {
    return LOCALE_META[code].nativeName;
  }
}

const ACTION_CATEGORIES = [
  "towel", "cleaning", "ac", "electricity", "plumbing", "tv_wifi", "key_lock", "billing_checkout",
  "complaint", "emergency", "dining", "bellboy", "excursion",
];

/**
 * Instruksi operasional dalam bahasa staf. Untuk staf berbahasa Indonesia
 * dipakai instruksi asli dari AI (paling rinci). Untuk bahasa lain, instruksi
 * disusun dari data tiket: judul, kamar, jumlah, dan tindakan per kategori.
 * Isi bebas pesan tamu tidak diterjemahkan mesin; pesan aslinya tetap tampil.
 */
export function operationalText(t: T, ticket: ServiceTicket, staffLocale: Locale): string {
  if (staffLocale === "id" && ticket.translatedRequest) return ticket.translatedRequest;
  const category = ticket.category === "linen" ? "towel" : ticket.category.startsWith("upsell_") ? "upsell" : ticket.category;
  const action: TranslationKey = ACTION_CATEGORIES.includes(category) || category === "upsell" ? (`op.do.${category}` as TranslationKey) : "op.do.unclassified";
  const lines = [t("op.head", { title: ticketTitle(t, ticket), room: ticket.room })];
  if (ticket.qty > 1 && !ticket.order) lines.push(t("op.qty", { n: ticket.qty }));
  lines.push(t(action));
  const guestLang = languageName(ticket.originalLanguage, staffLocale);
  if (ticket.originalLanguage && LOCALE_META[staffLocale].name !== ticket.originalLanguage) lines.push(t("op.lang", { lang: guestLang }));
  // Bahasa Jepang dan Mandarin tidak memakai spasi antarkalimat.
  return lines.join(staffLocale === "ja" || staffLocale === "zh" ? "" : " ");
}
