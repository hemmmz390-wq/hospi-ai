import { Locale } from "../../src/i18n/types";
import { findMenuItemsInText, indexOfKeyword } from "../../src/data/menu";
import { LATE_CHECKOUT_OPTIONS, slaConfigFor } from "../../src/data/sla";
import { Classification, ClassifyInput } from "./types";
import { detectLanguage, formatRupiah, reply, ReplyKey } from "./language";

/**
 * Pengklasifikasi berbasis aturan.
 *
 * Dipakai selama GEMINI_API_KEY belum dipasang, dan sebagai cadangan saat
 * Gemini tidak tersedia. Aturan dicek berurutan dari yang paling mendesak:
 * darurat → komplain → permintaan staf → pesanan makanan → pertanyaan umum →
 * permintaan layanan. Urutan itu penting: "ada asap, tolong" harus menjadi
 * darurat walau juga memuat kata "tolong".
 *
 * Bentuk hasilnya sama persis dengan pengklasifikasi Gemini, sehingga keduanya
 * bisa saling menggantikan tanpa aplikasi tahu bedanya.
 */

const has = (lower: string, words: string[]) => words.some((w) => indexOfKeyword(lower, w) !== -1);

export const EMERGENCY_WORDS = [
  "kebakaran", "api", "asap", "fire", "smoke", "burning", "terbakar",
  "darurat", "emergency", "ambulance", "ambulans", "dokter", "doctor",
  "pingsan", "unconscious", "bleeding", "berdarah", "heart attack", "serangan jantung",
  "can't breathe", "cannot breathe", "sesak napas", "sakit parah",
  "火事", "火災", "煙", "救急", "火灾", "着火", "烟", "急救", "화재", "연기", "구급차",
  "пожар", "дым", "скорая", "feu", "fumée", "urgence", "feuer", "rauch", "notfall", "krankenwagen",
];

export const COMPLAINT_WORDS = [
  "kecewa", "marah", "komplain", "keluhan", "lambat banget", "lama banget", "tidak profesional",
  "unacceptable", "terrible", "horrible", "angry", "complaint", "disappointed", "worst", "ridiculous",
  "недоволен", "ужасно", "жалоба", "déçu", "inacceptable", "plainte", "enttäuscht", "beschwerde", "unmöglich",
  "がっかり", "ひどい", "苦情", "失望", "投诉", "太差", "실망", "불만", "최악",
];

export const HUMAN_WORDS = [
  "bicara dengan staf", "bicara sama orang", "ngomong sama orang", "manusia", "petugas asli",
  "manager", "manajer", "resepsionis", "real person", "human", "speak to someone", "talk to someone",
  "talk to a person", "talk to staff", "customer service", "staff member",
  "担当者", "スタッフと話", "人工", "真人", "직원과", "상담원", "оператор", "живой человек",
  "parler à quelqu'un", "un humain", "mit jemandem sprechen", "mitarbeiter sprechen",
];

const FOOD_WORDS = [
  "makan", "makanan", "lapar", "food", "hungry", "eat", "menu", "order food", "room service",
  "食べ", "食事", "ルームサービス", "吃", "饭", "点餐", "음식", "배고", "룸서비스",
  "еда", "поесть", "голод", "manger", "repas", "faim", "essen", "hunger", "speisekarte",
];

const AMENITY_ITEMS: { words: string[]; label: string }[] = [
  { words: ["handuk", "towel", "タオル", "毛巾", "浴巾", "수건", "полотенц", "serviette", "handtuch", "handtücher"], label: "towels" },
  { words: ["air mineral", "botol air", "bottle of water", "bottles of water", "bottled water", "water bottle", "mineral water", "drinking water", "ミネラルウォーター", "水を", "矿泉水", "瓶装水", "생수", "물 한", "бутылк", "eau minérale", "bouteille d'eau", "mineralwasser", "wasserflasche"], label: "water" },
  { words: ["sabun", "soap", "sampo", "shampoo", "石鹸", "シャンプー", "香皂", "洗发水", "비누", "샴푸", "мыло", "шампунь", "savon", "shampooing", "seife"], label: "toiletries" },
  { words: ["tisu", "tissue", "tissues", "toilet paper", "tisu toilet", "ティッシュ", "纸巾", "휴지", "салфетк", "mouchoirs", "taschentücher"], label: "tissues" },
  { words: ["sandal", "slippers", "スリッパ", "拖鞋", "슬리퍼", "тапочк", "chaussons", "hausschuhe"], label: "slippers" },
  { words: ["sikat gigi", "toothbrush", "amenities", "toiletries", "歯ブラシ", "牙刷", "칫솔", "зубная щётка", "brosse à dents", "zahnbürste"], label: "toiletries" },
];

const CLEANING_WORDS = ["bersih", "bersihkan", "clean", "cleaning", "make up room", "rapikan", "sampah", "vacuum", "掃除", "清掃", "打扫", "清扫", "청소", "уборк", "убрать", "nettoyer", "faire la chambre", "reinigen", "aufräumen"];
const LINEN_WORDS = ["sprei", "seprai", "linen", "bantal", "pillow", "selimut", "blanket", "bedsheet", "sheets", "枕", "毛布", "シーツ", "枕头", "被子", "床单", "베개", "이불", "подушк", "одеял", "oreiller", "couverture", "draps", "kissen", "decke", "bettwäsche"];
const AC_WORDS = ["ac", "a/c", "aircon", "air con", "air conditioner", "air conditioning", "tidak dingin", "kurang dingin", "gak dingin", "nggak dingin", "not cooling", "not cold", "too hot in", "エアコン", "冷房", "空调", "冷气", "에어컨", "냉방", "кондиционер", "climatisation", "clim", "klimaanlage", "klima"];
const ELECTRIC_WORDS = ["lampu", "listrik", "mati lampu", "saklar", "colokan", "stopkontak", "light", "lamp", "power", "socket", "outlet", "電気", "照明", "コンセント", "灯", "电源", "插座", "전기", "조명", "콘센트", "свет", "лампа", "розетк", "lumière", "lampe", "prise", "licht", "steckdose", "nachttischlampe"];
const PLUMBING_WORDS = ["air panas", "hot water", "shower", "mampet", "kran", "keran", "wastafel", "toilet", "kloset", "sink", "clogged", "blocked", "leak", "bocor", "お湯", "シャワー", "トイレ", "詰ま", "热水", "淋浴", "马桶", "堵", "온수", "샤워", "변기", "막혔", "горячей воды", "душ", "раковин", "засор", "унитаз", "eau chaude", "douche", "bouché", "lavabo", "warmwasser", "dusche", "verstopft", "waschbecken"];
const TV_WIFI_WORDS = ["tv", "televisi", "television", "remote", "テレビ", "リモコン", "电视", "遥控", "리모컨", "텔레비전", "телевизор", "пульт", "télé", "télécommande", "fernseher", "fernbedienung"];
const WIFI_WORDS = ["wifi", "wi-fi", "internet", "ワイファイ", "無線", "网络", "와이파이", "인터넷", "интернет", "вай-фай"];
const WIFI_PROBLEM = ["slow", "lambat", "lemot", "not working", "tidak bisa", "gak bisa", "putus", "mati", "down", "can't connect", "cannot connect", "no internet", "problem", "masalah", "遅い", "つながらない", "慢", "连不上", "느려", "안 돼", "медленн", "не работает", "lent", "ne marche pas", "langsam", "funktioniert nicht"];
const PASSWORD_WORDS = ["password", "kata sandi", "sandi", "パスワード", "密码", "비밀번호", "пароль", "mot de passe", "passwort"];
const BREAKFAST_Q = ["sarapan", "breakfast", "makan pagi", "朝食", "早餐", "조식", "завтрак", "petit-déjeuner", "petit déjeuner", "frühstück"];
const LOCK_WORDS = ["kunci", "keycard", "key card", "kartu kamar", "terkunci", "locked out", "door lock", "カードキー", "鍵", "房卡", "门锁", "카드키", "열쇠", "ключ", "замок", "carte-clé", "carte de la chambre", "clé", "schlüssel", "schlüsselkarte"];
const CHECKOUT_WORDS = ["checkout", "check-out", "check out", "late check", "チェックアウト", "退房", "체크아웃", "выезд", "départ", "auschecken"];
const CHECKOUT_Q = ["jam berapa", "what time", "when is", "何時", "几点", "몇 시", "во сколько", "à quelle heure", "wann"];
const BELLBOY_WORDS = ["luggage", "baggage", "bags", "suitcase", "koper", "barang bawaan", "bellboy", "porter", "荷物", "行李", "짐", "캐리어", "багаж", "чемодан", "bagages", "valise", "gepäck", "koffer"];

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, satu: 1, dua: 2, tiga: 3, empat: 4,
  deux: 2, trois: 3, zwei: 2, drei: 3,
};

function quantityIn(lower: string): number {
  const digit = lower.match(/\b([1-9])\b/);
  if (digit) return Number(digit[1]);
  for (const [w, n] of Object.entries(NUMBER_WORDS)) {
    if (indexOfKeyword(lower, w) !== -1) return n;
  }
  const cjk = lower.match(/([1-9２-９])\s*(枚|本|条|개|장)/);
  if (cjk) return Number(cjk[1]) || 2;
  if (/二|두|две|два/.test(lower)) return 2;
  return 1;
}

/** "at 2", "jam 2 siang", "14:00", "2pm" → jam late check-out yang tersedia. */
function requestedCheckoutHour(lower: string): string {
  // Angka pertama di kalimat bisa saja nomor kamar ("kamar 812"), jadi cari
  // angka yang jelas menunjuk jam lebih dulu.
  const patterns = [
    /(?:^|\s)(?:at|jam|pukul|until|till|sampai|hingga|à|um|bis|до|к)\s*(\d{1,2})(?:[:.h](\d{2}))?\s*(pm|am|siang|sore)?/,
    /\b(\d{1,2})[:.](\d{2})\b()/,
    /\b(\d{1,2})\s*(?:()|)(pm|am)\b/,
    /(\d{1,2})\s*(?:時|点|시)()()/,
  ];
  let hour = 14;
  let suffix: string | undefined;
  for (const re of patterns) {
    const m = lower.match(re);
    if (m) {
      hour = Number(m[1]);
      suffix = m[3];
      break;
    }
  }
  if (suffix === "pm" || suffix === "siang" || suffix === "sore" || hour < 7) hour = hour < 12 ? hour + 12 : hour;
  if (hour <= 13) return "13:00";
  if (hour >= 15) return "15:00";
  return "14:00";
}

type Draft = Omit<Classification, "guestReply" | "ackMin" | "doneMin" | "detectedLanguage"> & {
  replyKey: ReplyKey;
  replyVars?: Record<string, string | number>;
};

export function classifyWithRules(input: ClassifyInput): Classification {
  const { message, roomNumber, guestName } = input;
  const lower = message.toLowerCase();
  const lang: Locale = detectLanguage(message, input.guestLocale);

  const draft = decide(lower, message, roomNumber, guestName);
  const sla = slaConfigFor(draft.category);
  const vars: Record<string, string | number> = { room: roomNumber, guest: guestName, min: sla.doneMin, ...(draft.replyVars || {}) };
  if (typeof vars.fee === "number") vars.fee = formatRupiah(vars.fee, lang);

  const { replyKey, replyVars: _unused, ...rest } = draft;
  return {
    ...rest,
    ackMin: sla.ackMin,
    doneMin: sla.doneMin,
    detectedLanguage: lang,
    guestReply: reply(replyKey, lang, vars),
  };
}

function base(category: string, title: string, dept: Classification["assignedDepartment"], op: string): Draft {
  const sla = slaConfigFor(category);
  return {
    isDirectAnswer: false,
    category,
    taskTitle: title,
    quantity: 1,
    confidence: 0.95,
    assignedDepartment: dept,
    priority: sla.priority || "MEDIUM",
    isEmergency: false,
    isAngryComplaint: false,
    needsFoReview: false,
    translatedRequest: op,
    replyKey: "reply.unclassified",
  };
}

function decide(lower: string, message: string, room: string, guest: string): Draft {
  const quote = `"${message}"`;

  // 0. Darurat — selalu menang.
  if (has(lower, EMERGENCY_WORDS)) {
    return {
      ...base("emergency", "Emergency reported", "Front Office", `[DARURAT] Laporan darurat dari Kamar ${room}: ${quote}. Security dan Duty Manager segera ke lokasi.`),
      priority: "EMERGENCY",
      confidence: 1,
      isEmergency: true,
      needsHumanAgent: true,
      escalationReason: "darurat",
      replyKey: "reply.emergency",
    };
  }

  // 1. Komplain / nada marah → Duty Manager.
  if (has(lower, COMPLAINT_WORDS)) {
    return {
      ...base("complaint", "Guest complaint", "Duty Manager", `[KOMPLAIN] Keluhan tamu Kamar ${room} (${guest}): ${quote}. Duty Manager harap menghubungi tamu.`),
      priority: "HIGH",
      isAngryComplaint: true,
      replyKey: "reply.complaint",
    };
  }

  // 2. Tamu meminta bicara dengan staf.
  if (has(lower, HUMAN_WORDS)) {
    return {
      ...base("unclassified", "Guest asked to talk to staff", "Front Office", `Tamu Kamar ${room} meminta berbicara dengan staf: ${quote}.`),
      confidence: 1,
      needsHumanAgent: true,
      escalationReason: "permintaan_tamu",
      replyKey: "reply.human",
    };
  }

  // 3. Pesanan makanan: menyebut item menu → draf pesanan yang harus dikonfirmasi tamu.
  const items = findMenuItemsInText(message);
  if (items.length > 0) {
    return {
      ...base("dining", "Food order", "Food & Beverage", `Draf pesanan Kamar ${room}: ${quote}.`),
      isDirectAnswer: true,
      orderItems: items,
      replyKey: "reply.dining",
    };
  }

  // 4. Pertanyaan umum yang dijawab langsung tanpa tiket.
  const aboutWifi = has(lower, WIFI_WORDS);
  if (aboutWifi && has(lower, WIFI_PROBLEM)) {
    return {
      ...base("tv_wifi", "Wi-Fi not working", "Maintenance", `[IT] Gangguan Wi-Fi di Kamar ${room}: ${quote}.`),
      replyKey: "reply.tv_wifi",
    };
  }
  if (aboutWifi || has(lower, PASSWORD_WORDS)) {
    return { ...base("faq", "Wi-Fi details", "Front Office", ""), isDirectAnswer: true, confidence: 0.99, replyKey: "reply.faq.wifi" };
  }
  const aboutCheckout = has(lower, CHECKOUT_WORDS);
  if (aboutCheckout && has(lower, CHECKOUT_Q) && !/late|lambat|telat|tardif|spät|レイト|延迟|레이트|поздн/.test(lower)) {
    return { ...base("faq", "Checkout time", "Front Office", ""), isDirectAnswer: true, confidence: 0.99, replyKey: "reply.faq.checkout" };
  }
  if (has(lower, BREAKFAST_Q) && !has(lower, FOOD_WORDS.filter((w) => w !== "menu"))) {
    return { ...base("faq", "Breakfast hours", "Food & Beverage", ""), isDirectAnswer: true, confidence: 0.99, replyKey: "reply.faq.breakfast" };
  }
  if (has(lower, FOOD_WORDS)) {
    return { ...base("faq", "Food menu", "Food & Beverage", ""), isDirectAnswer: true, confidence: 0.9, suggestFoodMenu: true, replyKey: "reply.dining.menu" };
  }

  // 5. Late check-out → Front Office, menunggu persetujuan.
  if (aboutCheckout) {
    const hour = requestedCheckoutHour(lower);
    const fee = LATE_CHECKOUT_OPTIONS.find((o) => o.hour === hour)?.fee || 0;
    return {
      ...base("billing_checkout", `Late checkout until ${hour}`, "Front Office", `Tamu Kamar ${room} meminta late check-out sampai ${hour} (biaya Rp ${fee.toLocaleString("id-ID")}). Perlu persetujuan FO.`),
      lateCheckoutHour: hour,
      lateCheckoutFee: fee,
      replyKey: "reply.checkout",
      replyVars: { hour, fee },
    };
  }

  // 6. Bellboy.
  if (has(lower, BELLBOY_WORDS)) {
    return {
      ...base("bellboy", "Help with luggage", "Front Office", `Bellboy ke Kamar ${room} untuk membantu barang bawaan: ${quote}.`),
      bellboyService: "luggage_help",
      replyKey: "reply.bellboy",
    };
  }

  // 7. Amenities (termasuk air mineral) → satu tiket Housekeeping.
  const amenities = AMENITY_ITEMS.filter((a) => has(lower, a.words)).map((a) => a.label);
  const uniqueAmenities = Array.from(new Set(amenities));
  if (uniqueAmenities.length > 0) {
    const qty = quantityIn(lower);
    const title =
      uniqueAmenities.length === 1
        ? `Extra ${uniqueAmenities[0]}`
        : `Extra ${uniqueAmenities.slice(0, -1).join(", ")} & ${uniqueAmenities[uniqueAmenities.length - 1]}`;
    return {
      ...base("towel", title.charAt(0).toUpperCase() + title.slice(1), "Housekeeping", `Antar ke Kamar ${room}: ${quote}.`),
      quantity: qty,
      replyKey: "reply.towel",
    };
  }

  // 8. Linen & bantal.
  if (has(lower, LINEN_WORDS)) {
    return { ...base("linen", "Extra linen or pillows", "Housekeeping", `Tambahan linen/bantal untuk Kamar ${room}: ${quote}.`), quantity: quantityIn(lower), replyKey: "reply.linen" };
  }

  // 9. Kamar dibersihkan.
  if (has(lower, CLEANING_WORDS)) {
    return { ...base("cleaning", "Room cleaning", "Housekeeping", `Make up room Kamar ${room}. Catatan tamu: ${quote}.`), replyKey: "reply.cleaning" };
  }

  // 10. Kerusakan teknis. AC dicek sebelum plumbing: "AC bocor" adalah soal AC,
  //     bukan saluran air. "air panas" tidak ada di daftar kata AC.
  if (has(lower, AC_WORDS)) {
    const acTitle = /bocor|menetes|leak|drip|水漏れ|漏水|새|протека|fuit|tropft/.test(lower)
      ? "AC leaking"
      : /bunyi|berisik|noise|noisy|loud|音|噪音|소리|шум|bruit|laut|geräusch/.test(lower)
        ? "AC making noise"
        : "AC not cooling";
    return { ...base("ac", acTitle, "Maintenance", `[PRIORITAS TINGGI] Laporan AC Kamar ${room}: ${quote}. Teknisi harap segera periksa unit.`), confidence: 0.97, replyKey: "reply.ac" };
  }
  if (has(lower, PLUMBING_WORDS)) {
    return { ...base("plumbing", "Plumbing issue", "Maintenance", `[PLUMBING] Gangguan air di Kamar ${room}: ${quote}.`), replyKey: "reply.plumbing" };
  }
  if (has(lower, ELECTRIC_WORDS)) {
    return { ...base("electricity", "Electrical issue", "Maintenance", `[TEKNIS] Gangguan listrik/lampu di Kamar ${room}: ${quote}.`), replyKey: "reply.electricity" };
  }
  if (has(lower, TV_WIFI_WORDS)) {
    return { ...base("tv_wifi", "TV not working", "Maintenance", `Gangguan TV di Kamar ${room}: ${quote}.`), replyKey: "reply.tv_wifi" };
  }
  if (has(lower, LOCK_WORDS)) {
    return { ...base("key_lock", "Door lock / key card", "Front Office", `[URGENT] Masalah kunci Kamar ${room}: ${quote}. FO siapkan kartu baru.`), replyKey: "reply.key_lock" };
  }

  // 11. Tidak yakin → Front Office membaca sendiri.
  return {
    ...base("unclassified", "Guest request", "Front Office", `[PERLU DIBACA FO] Pesan tamu Kamar ${room}: ${quote}`),
    confidence: 0.62,
    needsFoReview: true,
    replyKey: "reply.unclassified",
  };
}
