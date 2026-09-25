import {
  AppNotification,
  Department,
  FoodOrderLine,
  HotelRoom,
  Priority,
  RoomStatus,
  ServiceTicket,
  TicketStatus,
  TimelineEntry,
} from "../types";
import { LOCALE_META, Locale } from "../i18n/types";
import { FOOD_MENU } from "./menu";
import { SLA_ROUTING_CONFIG } from "./sla";

/**
 * Data demo hotel: 52 kamar, tamu dari delapan bahasa, dan tiket di setiap
 * keadaan yang perlu terlihat saat demo (baru, dikerjakan, hampir lewat SLA,
 * lewat SLA, ditunda, dieskalasi, selesai dengan rating).
 *
 * Semua waktu dihitung mundur dari saat data dibuat, supaya timer SLA langsung
 * terlihat hidup. Nomor tiket berhenti di HOS-1047 dan pesanan di ORD-2047:
 * permintaan pertama yang dibuat saat demo menjadi HOS-1048 / ORD-2048.
 */

type GuestSeed = {
  name: string;
  locale: Locale;
  nationality: string;
  phone: string;
  nights: [number, number]; // [sudah menginap, sisa malam]
};

const ROOM_TYPES: HotelRoom["roomType"][] = [
  "Executive Garden Room",
  "Deluxe Pool Villa",
  "Ocean Panorama Suite",
  "Grand Heritage Suite",
];

/** Kamar per lantai. 410, 508, dan 812 dipertahankan: QR kamar lama menunjuk ke sana. */
const FLOORS: Record<number, string[]> = {
  1: ["101", "102", "103", "104", "105", "106"],
  2: ["201", "202", "203", "204", "205", "206"],
  3: ["301", "302", "303", "304", "305", "306"],
  4: ["401", "402", "403", "404", "405", "406", "410"],
  5: ["501", "502", "503", "504", "505", "506", "507", "508"],
  6: ["601", "602", "603", "604", "605", "606"],
  7: ["701", "702", "703", "704", "705", "706"],
  8: ["801", "802", "803", "804", "805", "806", "812"],
};

const G = (
  name: string,
  locale: Locale,
  nationality: string,
  phone: string,
  nights: [number, number] = [2, 2]
): GuestSeed => ({ name, locale, nationality, phone, nights });

const GUESTS: Record<string, GuestSeed> = {
  "101": G("Nadia Putri", "id", "Indonesia", "+62 813 2254 7710", [1, 3]),
  "102": G("Chen Wei", "zh", "China", "+86 138 0013 4521", [3, 1]),
  "104": G("Liam O'Connor", "en", "Ireland", "+353 87 412 6620"),
  "105": G("Park Ji-woo", "ko", "South Korea", "+82 10 4417 2093", [1, 4]),
  "201": G("Yuki Tanaka", "ja", "Japan", "+81 90 3321 8864"),
  "202": G("Olga Petrova", "ru", "Russia", "+7 916 552 4031", [4, 2]),
  "204": G("Sarah Jenkins", "en", "United Kingdom", "+44 7700 900 412"),
  "205": G("Lucas Martin", "fr", "France", "+33 6 12 44 80 27"),
  "206": G("Sophie Müller", "de", "Germany", "+49 151 2270 3345"),
  "301": G("Wang Fang", "zh", "China", "+86 139 2201 7788", [2, 0]),
  "302": G("Daniel Kim", "ko", "South Korea", "+82 10 7781 3302"),
  "304": G("Anna Schmidt", "de", "Germany", "+49 160 9981 2214"),
  "305": G("John Smith", "en", "United States", "+1 415 555 0142"),
  "306": G("Rizky Pratama", "id", "Indonesia", "+62 812 7788 1905"),
  "401": G("Isabelle Dubois", "fr", "France", "+33 7 81 22 45 90", [3, 0]),
  "402": G("Dmitri Ivanov", "ru", "Russia", "+7 925 118 3390"),
  "404": G("Mei Ling", "zh", "Singapore", "+65 9123 4471"),
  "405": G("Hiroshi Yamamoto", "ja", "Japan", "+81 80 6612 0935"),
  "410": G("Emma Walsh", "en", "Australia", "+61 412 553 870"),
  "501": G("Kenji Sato", "ja", "Japan", "+81 90 4418 2276"),
  "502": G("Maria Rossi", "en", "Italy", "+39 347 552 1180"),
  "503": G("Budi Hartono", "id", "Indonesia", "+62 811 3902 6614"),
  "505": G("Lee Seo-yeon", "ko", "South Korea", "+82 10 2290 5541"),
  "506": G("Thomas Becker", "de", "Austria", "+43 664 221 8870"),
  "508": G("Alex Rivera", "en", "United States", "+1 646 555 8274", [1, 3]),
  "601": G("Priya Nair", "en", "India", "+91 98450 22107"),
  "602": G("Ahmad Fauzi", "id", "Indonesia", "+62 857 4410 2296", [2, 0]),
  "603": G("Camille Laurent", "fr", "Belgium", "+32 470 55 12 88"),
  "605": G("Li Na", "zh", "China", "+86 137 7719 0034"),
  "606": G("Ekaterina Smirnova", "ru", "Russia", "+7 903 771 2285"),
  "701": G("Michael Brown", "en", "Canada", "+1 604 555 0199"),
  "702": G("Sakura Ito", "ja", "Japan", "+81 70 2254 9918"),
  "704": G("Jonas Weber", "de", "Germany", "+49 172 440 1188"),
  "705": G("Dewi Anggraini", "id", "Indonesia", "+62 878 1123 4409"),
  "706": G("Choi Min-jun", "ko", "South Korea", "+82 10 5530 7712"),
  "801": G("Charlotte Evans", "en", "New Zealand", "+64 21 556 204"),
  "803": G("Zhang Wei", "zh", "China", "+86 136 5520 1147"),
  "804": G("Ivan Kuznetsov", "ru", "Russia", "+7 911 204 6673"),
  "805": G("Chloé Bernard", "fr", "France", "+33 6 55 20 71 46"),
  "806": G("Siti Rahma", "id", "Indonesia", "+62 812 6601 2287"),
  "812": G("Hendra Wijaya", "id", "Indonesia", "+62 812 3456 7821", [2, 0]),
};

/** Status kamar kosong. Kamar berpenghuni selalu "Occupied" kecuali disebut di sini. */
const ROOM_STATUS: Record<string, RoomStatus> = {
  "103": "Clean",
  "106": "Clean",
  "203": "Needs Cleaning",
  "303": "Clean",
  "403": "Maintenance",
  "406": "Vacant",
  "504": "Needs Cleaning",
  "507": "Clean",
  "604": "Clean",
  "703": "In Progress",
  "802": "Clean",
  // Berpenghuni tetapi pintu bertanda jangan diganggu
  "702": "Do Not Disturb",
  // Berpenghuni, AC sedang diperbaiki
  "305": "Maintenance",
};

const HOUSEKEEPER_FOR_FLOOR: Record<number, string> = {
  1: "Wayan Dewi", 2: "Wayan Dewi", 3: "Putu Ari", 4: "Putu Ari",
  5: "Komang Sari", 6: "Komang Sari", 7: "Rina Kartika", 8: "Rina Kartika",
};

const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const emailFor = (name: string) =>
  `${name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z ]/g, "")
    .trim()
    .replace(/\s+/g, ".")}@example.com`;

export function seedRooms(now = new Date()): HotelRoom[] {
  const rooms: HotelRoom[] = [];
  for (const [floorStr, numbers] of Object.entries(FLOORS)) {
    const floor = Number(floorStr);
    numbers.forEach((roomNumber, i) => {
      const g = GUESTS[roomNumber];
      const day = 24 * 60 * 60 * 1000;
      rooms.push({
        roomNumber,
        floor,
        guestName: g ? g.name : "",
        guestLanguage: g ? LOCALE_META[g.locale].name : "",
        guestLocale: g?.locale,
        guestPhone: g?.phone,
        guestEmail: g ? emailFor(g.name) : undefined,
        nationality: g?.nationality,
        checkInDate: g ? isoDate(new Date(now.getTime() - g.nights[0] * day)) : undefined,
        checkOutDate: g ? isoDate(new Date(now.getTime() + g.nights[1] * day)) : undefined,
        roomType: ROOM_TYPES[(floor + i) % ROOM_TYPES.length],
        status: ROOM_STATUS[roomNumber] || (g ? "Occupied" : "Clean"),
        assignedHousekeeper: HOUSEKEEPER_FOR_FLOOR[floor],
        activeTickets: 0,
        lastCleaned: "",
        phoneExtension: roomNumber,
      });
    });
  }
  return rooms;
}

// ------------------------------------------------------------
// Tiket
// ------------------------------------------------------------

type TicketSeed = {
  n: number; // nomor HOS-n
  room: string;
  category: string;
  title: string;
  text: string; // pesan asli tamu, dalam bahasanya sendiri
  op: string; // instruksi operasional (Bahasa Indonesia, untuk staf)
  ago: number; // menit sejak dibuat
  status: TicketStatus;
  staff?: string; // nama petugas
  priority?: Priority;
  dept?: Department;
  channel?: ServiceTicket["channel"];
  /** Untuk tiket selesai: berapa menit sampai selesai. */
  took?: number;
  score?: number;
  comment?: string;
  defer?: { reason: string; promiseInMin: number };
  confidence?: number;
  order?: { id: number; items: [string, number][]; notes?: string; table?: string };
  lateCheckout?: { hour: string; fee: number };
  bellboy?: ServiceTicket["bellboy"];
  angry?: boolean;
  parent?: number;
  qty?: number;
};

const T: TicketSeed[] = [
  // ---------------- Selesai / ditutup (untuk analitik & riwayat) ----------------
  { n: 1008, room: "301", category: "dining", title: "In-room dining (3 items)", text: "Two lattes and pancakes to the room, please.", op: "Pesanan kamar 301: 2x Latte, 1x Pancake.", ago: 320, status: "DIKONFIRMASI", staff: "Nia Putri", took: 24, score: 5, order: { id: 2040, items: [["fm-9", 2], ["fm-12", 1]] } },
  { n: 1009, room: "301", category: "towel", title: "Extra bath towels", text: "请再给我两条浴巾。", op: "Tambahan 2 handuk mandi untuk Kamar 301.", ago: 300, status: "DIKONFIRMASI", staff: "Putu Ari", took: 8, score: 5, qty: 2 },
  { n: 1010, room: "801", category: "cleaning", title: "Room cleaning", text: "Could you make up the room while we're at the pool?", op: "Make up room Kamar 801 saat tamu di kolam renang.", ago: 280, status: "DIKONFIRMASI", staff: "Rina Kartika", took: 27, score: 4 },
  { n: 1011, room: "704", category: "dining", title: "In-room dining (2 items)", text: "Ein Club-Sandwich und einen Tee, bitte.", op: "Pesanan kamar 704: 1x Club Sandwich, 1x Teh Jahe.", ago: 250, status: "DIKONFIRMASI", staff: "Nia Putri", took: 22, score: 4, order: { id: 2041, items: [["fm-19", 1], ["fm-23", 1]] } },
  { n: 1012, room: "506", category: "ac", title: "AC not cooling", text: "Die Klimaanlage kühlt nicht.", op: "AC Kamar 506 tidak dingin. Periksa freon dan filter.", ago: 230, status: "DIKONFIRMASI", staff: "Budi Santoso", took: 18, score: 5, priority: "HIGH" },
  { n: 1013, room: "101", category: "linen", title: "Extra pillows", text: "Minta bantal tambahan dua ya.", op: "Tambahan 2 bantal untuk Kamar 101.", ago: 210, status: "DIKONFIRMASI", staff: "Wayan Dewi", took: 12, score: 5, qty: 2 },
  { n: 1014, room: "702", category: "dining", title: "In-room dining (2 items)", text: "サラダとココナッツをお願いします。", op: "Pesanan kamar 702: 1x Buddha Bowl, 1x Kelapa Muda.", ago: 190, status: "SELESAI", staff: "Nia Putri", took: 19, order: { id: 2042, items: [["fm-16", 1], ["fm-8", 1]] } },
  { n: 1015, room: "605", category: "plumbing", title: "No hot water", text: "淋浴没有热水。", op: "Air panas shower Kamar 605 tidak keluar.", ago: 170, status: "DIKONFIRMASI", staff: "Nyoman Adi", took: 52, score: 3, priority: "HIGH" },
  { n: 1016, room: "202", category: "cleaning", title: "Room cleaning", text: "Пожалуйста, уберите номер.", op: "Make up room Kamar 202.", ago: 150, status: "DIKONFIRMASI", staff: "Wayan Dewi", took: 26, score: 4 },
  { n: 1017, room: "803", category: "dining", title: "In-room dining (1 item)", text: "一份炒饭，谢谢。", op: "Pesanan kamar 803: 1x Nasi Goreng Kampung.", ago: 130, status: "DIKONFIRMASI", staff: "Gede Pratama", took: 21, score: 5, order: { id: 2043, items: [["fm-1", 1]] } },
  { n: 1018, room: "705", category: "bellboy", title: "Luggage pick-up", text: "Tolong ambil koper di kamar, saya mau check-out.", op: "Ambil koper di Kamar 705 untuk check-out.", ago: 110, status: "DIKONFIRMASI", staff: "Made Wirawan", took: 7, score: 5, bellboy: { service: "luggage_pickup" } },
  { n: 1019, room: "410", category: "cleaning", title: "Room cleaning", text: "Can the room be cleaned this morning?", op: "Make up room Kamar 410 pagi ini.", ago: 120, status: "DIKONFIRMASI", staff: "Putu Ari", took: 72, score: 1, comment: "Waited over an hour and had to ask again at reception." },
  { n: 1020, room: "502", category: "towel", title: "Pool towels", text: "Two pool towels please.", op: "2 handuk kolam renang untuk Kamar 502.", ago: 35, status: "SELESAI", staff: "Komang Sari", took: 9, qty: 2 },
  { n: 1021, room: "806", category: "towel", title: "Room slippers", text: "Minta sandal kamar.", op: "Sandal kamar untuk Kamar 806.", ago: 60, status: "DIBATALKAN", staff: "Rina Kartika" },

  // ---------------- Pesanan makanan yang sedang berjalan ----------------
  { n: 1022, room: "202", category: "dining", title: "In-room dining (2 items)", text: "English breakfast and an orange juice, please.", op: "Pesanan kamar 202: 1x English Breakfast, 1x Jus Jeruk.", ago: 2, status: "BARU", order: { id: 2044, items: [["fm-13", 1], ["fm-22", 1]] } },
  { n: 1023, room: "105", category: "dining", title: "In-room dining (3 items)", text: "나시고랭 두 개랑 오렌지 주스 하나 주세요. 덜 맵게요.", op: "Pesanan kamar 105: 2x Nasi Goreng, 1x Jus Jeruk. Kurang pedas.", ago: 12, status: "DIKERJAKAN", staff: "Gede Pratama", order: { id: 2045, items: [["fm-1", 2], ["fm-22", 1]], notes: "Less spicy" } },
  { n: 1024, room: "606", category: "dining", title: "In-room dining (2 items)", text: "Бургер и картофель фри, пожалуйста.", op: "Pesanan kamar 606: 1x Burger Wagyu, 1x Kentang Truffle.", ago: 22, status: "SIAP", staff: "Gede Pratama", dept: "Housekeeping", order: { id: 2046, items: [["fm-4", 1], ["fm-17", 1]] } },
  { n: 1025, room: "401", category: "dining", title: "Table 7 order (2 items)", text: "Un bol d'açaí et un latte, table 7.", op: "Pesanan Meja 7: 1x Açaí Bowl, 1x Latte.", ago: 5, status: "DITERIMA", staff: "Nia Putri", order: { id: 2047, items: [["fm-6", 1], ["fm-9", 1]], table: "7" } },

  // ---------------- Tiket aktif ----------------
  { n: 1026, room: "101", category: "towel", title: "Soap & shampoo", text: "Minta sabun dan sampo tambahan ya.", op: "Tambahan sabun dan sampo untuk Kamar 101.", ago: 1, status: "BARU" },
  { n: 1027, room: "104", category: "towel", title: "Water & tissues", text: "Could we get two extra bottles of water and some tissues?", op: "2 botol air mineral dan tisu untuk Kamar 104.", ago: 6, status: "DITERIMA", staff: "Wayan Dewi", qty: 2 },
  { n: 1028, room: "105", category: "cleaning", title: "Room cleaning", text: "방 청소 부탁드립니다. 30분 후에 나갈 거예요.", op: "Make up room Kamar 105, tamu keluar 30 menit lagi.", ago: 9, status: "BARU" },
  { n: 1029, room: "201", category: "linen", title: "Extra blanket", text: "毛布をもう一枚お願いします。", op: "Tambahan 1 selimut untuk Kamar 201.", ago: 12, status: "DIKERJAKAN", staff: "Wayan Dewi" },
  { n: 1030, room: "206", category: "electricity", title: "Bedside lamp not working", text: "Die Nachttischlampe funktioniert nicht.", op: "Lampu samping tempat tidur Kamar 206 mati.", ago: 5, status: "BARU", priority: "HIGH" },
  { n: 1031, room: "302", category: "ac", title: "AC making noise", text: "에어컨에서 이상한 소리가 나요.", op: "AC Kamar 302 berbunyi aneh. Periksa kipas indoor.", ago: 18, status: "DITERIMA", staff: "Budi Santoso", priority: "HIGH" },
  { n: 1032, room: "304", category: "key_lock", title: "Key card not working", text: "Meine Schlüsselkarte funktioniert nicht mehr.", op: "Kartu kunci Kamar 304 tidak berfungsi. Siapkan kartu baru.", ago: 13, status: "BARU", priority: "HIGH" },
  { n: 1033, room: "401", category: "bellboy", title: "Help with luggage", text: "Pouvez-vous m'aider avec mes bagages ? Je pars à 14h.", op: "Bantu bawa koper Kamar 401, tamu berangkat 14:00.", ago: 4, status: "DITERIMA", staff: "Made Wirawan", bellboy: { service: "luggage_help" } },
  { n: 1034, room: "402", category: "complaint", title: "Complaint: room not cleaned", text: "Уже второй раз прошу убрать номер, никто не пришёл. Очень недоволен.", op: "[KOMPLAIN] Tamu Kamar 402 sudah dua kali minta kamar dibersihkan, belum ada yang datang.", ago: 8, status: "BARU", priority: "HIGH", angry: true },
  { n: 1035, room: "404", category: "tv_wifi", title: "TV remote not responding", text: "电视遥控器没有反应。", op: "Remote TV Kamar 404 tidak berfungsi.", ago: 14, status: "BARU" },
  { n: 1036, room: "812", category: "towel", title: "Extra bath towels", text: "Mba boleh minta handuk 2 ya, yang di kamar basah semua", op: "Tambahan 2 handuk mandi untuk Kamar 812. Handuk di kamar basah.", ago: 4, status: "DIKERJAKAN", staff: "Rina Kartika", qty: 2 },
  { n: 1037, room: "505", category: "unclassified", title: "Special request", text: "혹시 아기 침대를 추가할 수 있나요?", op: "[PERLU DIBACA FO] Tamu menanyakan kemungkinan tambahan tempat tidur bayi.", ago: 4, status: "BARU", confidence: 0.62 },
  { n: 1038, room: "602", category: "billing_checkout", title: "Late checkout until 14:00", text: "Boleh late checkout jam 2 siang?", op: "Tamu Kamar 602 meminta late check-out sampai 14:00 (biaya Rp 150.000).", ago: 10, status: "BARU", lateCheckout: { hour: "14:00", fee: 150000 } },
  { n: 1039, room: "603", category: "cleaning", title: "Room cleaning", text: "Pourriez-vous faire la chambre maintenant ?", op: "Make up room Kamar 603.", ago: 22, status: "DITERIMA", staff: "Komang Sari" },
  { n: 1040, room: "606", category: "plumbing", title: "Blocked sink", text: "Засорилась раковина в ванной.", op: "Wastafel kamar mandi Kamar 606 mampet.", ago: 26, status: "DIKERJAKAN", staff: "Nyoman Adi", priority: "HIGH" },
  { n: 1041, room: "701", category: "ac", title: "AC not cooling", text: "The air conditioning isn't cooling at all.", op: "AC Kamar 701 tidak dingin sama sekali.", ago: 26, status: "BARU", priority: "HIGH" },
  { n: 1042, room: "702", category: "towel", title: "Extra bath towels", text: "タオルを2枚追加でお願いします。", op: "Tambahan 2 handuk mandi untuk Kamar 702.", ago: 3, status: "BARU", qty: 2 },
  { n: 1043, room: "704", category: "linen", title: "Extra pillows", text: "Könnten wir zwei zusätzliche Kissen bekommen?", op: "Tambahan 2 bantal untuk Kamar 704.", ago: 9, status: "DIKERJAKAN", staff: "Rina Kartika", qty: 2 },
  { n: 1044, room: "803", category: "cleaning", title: "Room cleaning", text: "请现在打扫房间。", op: "Make up room Kamar 803 sekarang.", ago: 15, status: "BARU" },
  { n: 1045, room: "305", category: "ac", title: "AC leaking water", text: "The AC is leaking water heavily onto the floor right below the unit.", op: "AC Kamar 305 bocor, air menetes ke lantai di bawah unit indoor.", ago: 15, status: "DIKERJAKAN", staff: "Budi Santoso", priority: "HIGH" },
  { n: 1046, room: "405", category: "plumbing", title: "No hot water", text: "シャワーのお湯が出ません。", op: "Air panas shower Kamar 405 tidak keluar.", ago: 50, status: "DITUNDA", staff: "Nyoman Adi", priority: "HIGH", defer: { reason: "Water heater thermostat on order", promiseInMin: 60 } },
  { n: 1047, room: "410", category: "complaint", title: "Escalation: room cleaning", text: "Can the room be cleaned this morning?", op: "[ESKALASI] Tamu Kamar 410 memberi rating 1/5 untuk pembersihan kamar (HOS-1019).", ago: 20, status: "BARU", priority: "HIGH", dept: "Duty Manager", parent: 1019, score: 1, comment: "Waited over an hour and had to ask again at reception." },
];

const fmtTime = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function seedTickets(now = new Date()): ServiceTicket[] {
  const menu = new Map(FOOD_MENU.map((m) => [m.id, m]));

  return T.map((s) => {
    const guest = GUESTS[s.room];
    const config = SLA_ROUTING_CONFIG[s.category] || SLA_ROUTING_CONFIG.unclassified;
    const created = new Date(now.getTime() - s.ago * 60000);
    const at = (min: number) => new Date(created.getTime() + min * 60000);
    const dept: Department = s.dept || (s.angry ? "Duty Manager" : config.dept);
    const priority: Priority = s.priority || config.priority || "MEDIUM";

    const tl: TimelineEntry[] = [];
    const push = (ev: TimelineEntry["ev"], min: number, by: string, note?: string) => {
      const d = at(min);
      tl.push({ id: `seed-${s.n}-${tl.length}`, at: fmtTime(d), ts: d.toISOString(), ev, by, note });
    };

    push("dibuat", 0, s.channel === "manual_fo" ? "Front Office" : "bot", s.parent ? `Eskalasi otomatis dari HOS-${s.parent}` : undefined);
    const reached = (st: TicketStatus[]) => st.includes(s.status);
    const done = s.took ?? Math.max(1, s.ago - 1);
    if (s.staff && !reached(["BARU"])) push("diterima", Math.min(2, done), s.staff);
    if (s.staff && reached(["DIKERJAKAN", "SIAP", "SELESAI", "DIKONFIRMASI", "DITUNDA"])) push("dikerjakan", Math.min(4, done), s.staff);
    if (s.defer) push("ditunda", Math.min(20, done), s.staff || "Maintenance", s.defer.reason);
    if (reached(["SIAP"])) push("siap", Math.min(18, done), s.staff || "Kitchen");
    if (reached(["SELESAI", "DIKONFIRMASI"])) push("selesai", done, s.staff || "Staff");
    if (reached(["DIKONFIRMASI"]) && s.score) push("dikonfirmasi", done + 3, "tamu", `Rating ${s.score}/5`);
    if (reached(["DIBATALKAN"])) push("dibatalkan", 3, "tamu", "Guest no longer needs it");

    const lines: FoodOrderLine[] | undefined = s.order?.items.map(([id, qty]) => {
      const m = menu.get(id)!;
      return { menuId: id, name: m.name, qty, unitPrice: m.price };
    });

    const ticket: ServiceTicket = {
      id: `HOS-${s.n}`,
      room: s.room,
      roomNumber: s.room,
      guestName: guest?.name || `Room ${s.room}`,
      channel: s.channel || (s.category === "dining" ? "qr_web" : "chat_ai"),
      raw_text: s.text,
      originalRequest: s.text,
      category: s.category,
      taskTitle: s.title,
      qty: s.qty || (lines ? lines.reduce((n, l) => n + l.qty, 0) : 1),
      confidence: s.confidence ?? 0.95,
      needsFoReview: (s.confidence ?? 0.95) < 0.8,
      dept,
      assignedDepartment: dept,
      priority,
      status: s.status,
      assignee: s.staff,
      assignedStaff: s.staff,
      sla: {
        ack_min: config.ackMin,
        done_min: config.doneMin,
        created_at: created.toISOString(),
        ack_due_at: at(config.ackMin).toISOString(),
        due_at: at(config.doneMin + (s.defer ? s.defer.promiseInMin : 0)).toISOString(),
      },
      timeline: tl,
      idempotency_key: `seed-${s.n}`,
      translatedRequest: s.op,
      originalLanguage: guest ? LOCALE_META[guest.locale].name : "English",
      createdAtTime: fmtTime(created),
      isAngryComplaint: s.angry,
      parent_ticket: s.parent ? `HOS-${s.parent}` : undefined,
      guest_score: s.score,
      guest_rating: s.score ? (s.score <= 2 ? "thumbs_down" : "thumbs_up") : undefined,
      rating_comment: s.comment,
      lateCheckout: s.lateCheckout,
      bellboy: s.bellboy,
    };

    if (s.defer) {
      ticket.defer = {
        reason: s.defer.reason,
        promised_at: fmtTime(new Date(now.getTime() + s.defer.promiseInMin * 60000)),
        deferred_by: s.staff,
      };
    }
    if (reached(["SELESAI", "DIKONFIRMASI"])) {
      ticket.completedAtTime = fmtTime(at(done));
      ticket.totalDurationMin = done;
    }
    if (s.order && lines) {
      ticket.order = {
        id: `ORD-${s.order.id}`,
        items: lines,
        notes: s.order.notes,
        total: lines.reduce((n, l) => n + l.qty * l.unitPrice, 0),
        payment: "room_folio",
      };
      if (s.order.table) {
        ticket.diningDestination = "table";
        ticket.tableNumber = s.order.table;
      } else {
        ticket.diningDestination = "room";
      }
    }
    return ticket;
  }).sort((a, b) => b.sla.created_at.localeCompare(a.sla.created_at));
}

export function seedNotifications(now = new Date()): AppNotification[] {
  const ago = (min: number) => new Date(now.getTime() - min * 60000).toISOString();
  return [
    { id: "seed-n1", title: "SLA breached", message: "HOS-1041 · Room 701 · AC not cooling", timestamp: ago(6), priority: "HIGH", targetRole: "all", read: false, ticketId: "HOS-1041", roomNumber: "701", type: "sla_breach" },
    { id: "seed-n2", title: "Guest rated 1/5", message: "HOS-1019 · Room 410", timestamp: ago(20), priority: "HIGH", targetRole: "duty_manager", read: false, ticketId: "HOS-1047", roomNumber: "410", type: "rating" },
    { id: "seed-n3", title: "New complaint", message: "HOS-1034 · Room 402", timestamp: ago(8), priority: "HIGH", targetRole: "duty_manager", read: false, ticketId: "HOS-1034", roomNumber: "402", type: "new_ticket" },
    { id: "seed-n4", title: "Order ready", message: "ORD-2046 · Room 606", timestamp: ago(4), priority: "MEDIUM", targetRole: "housekeeping", read: false, ticketId: "HOS-1024", roomNumber: "606", type: "order_ready" },
    { id: "seed-n5", title: "New request", message: "HOS-1042 · Room 702 · Extra bath towels", timestamp: ago(3), priority: "MEDIUM", targetRole: "housekeeping", read: false, ticketId: "HOS-1042", roomNumber: "702", type: "new_ticket" },
    { id: "seed-n6", title: "New order", message: "ORD-2044 · Room 202", timestamp: ago(2), priority: "MEDIUM", targetRole: "food_beverage", read: false, ticketId: "HOS-1022", roomNumber: "202", type: "new_ticket" },
    { id: "seed-n7", title: "New request", message: "HOS-1030 · Room 206 · Bedside lamp", timestamp: ago(5), priority: "HIGH", targetRole: "maintenance", read: false, ticketId: "HOS-1030", roomNumber: "206", type: "new_ticket" },
    { id: "seed-n8", title: "Late checkout request", message: "HOS-1038 · Room 602 · until 14:00", timestamp: ago(10), priority: "MEDIUM", targetRole: "front_office", read: false, ticketId: "HOS-1038", roomNumber: "602", type: "new_ticket" },
  ];
}

/** Hitung ulang jumlah tiket aktif per kamar dari daftar tiket. */
export function withActiveCounts(rooms: HotelRoom[], tickets: ServiceTicket[]): HotelRoom[] {
  const open = new Map<string, number>();
  for (const t of tickets) {
    if (["SELESAI", "DIKONFIRMASI", "DITUTUP", "DIBATALKAN"].includes(t.status)) continue;
    open.set(t.room, (open.get(t.room) || 0) + 1);
  }
  return rooms.map((r) => ({ ...r, activeTickets: open.get(r.roomNumber) || 0 }));
}
