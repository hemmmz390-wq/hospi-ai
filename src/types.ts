export type Role =
  | "tourist"
  | "front_office"
  | "housekeeping"
  | "maintenance"
  | "duty_manager"
  | "food_beverage";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";

export type Department =
  | "Housekeeping"
  | "Maintenance"
  | "Front Office"
  | "Duty Manager"
  | "Food & Beverage";

/** Ke mana pesanan makanan diantar. */
export type DiningDestination = "room" | "table";

/** Satu-satunya daftar departemen yang bisa dipilih di antarmuka. */
export const ALL_DEPARTMENTS: Department[] = [
  "Housekeeping",
  "Maintenance",
  "Front Office",
  "Duty Manager",
  "Food & Beverage",
];

// Standard State Machine from Workflow:
// BARU > DITERIMA > DIKERJAKAN > SELESAI > DIKONFIRMASI > DITUTUP
// Branch states: DITUNDA, DIALIHKAN, DIBATALKAN
export type TicketStatus =
  | "BARU"
  | "DITERIMA"
  | "DIKERJAKAN"
  /** Khusus pesanan makanan: dapur selesai memasak, belum diantar/disantap. */
  | "SIAP"
  | "SELESAI"
  | "DIKONFIRMASI"
  | "DITUTUP"
  | "DITUNDA"
  | "DIALIHKAN"
  | "DIBATALKAN";

/**
 * Status yang berarti tiket sudah tidak berjalan lagi, jadi tidak boleh lagi
 * dihitung sebagai pelanggaran SLA, eskalasi, atau tugas aktif.
 *
 * Daftar ini sengaja dijadikan satu tempat: sebelumnya tiap layar menuliskan
 * sendiri daftarnya dan ada yang kelewat "DIKONFIRMASI", sehingga tiket yang
 * baru saja dikonfirmasi tamu justru muncul kembali sebagai pelanggaran SLA
 * lengkap dengan alarmnya.
 */
export const CLOSED_STATUSES: TicketStatus[] = [
  "SELESAI",
  "DIKONFIRMASI",
  "DITUTUP",
  "DIBATALKAN",
];

export const isTicketClosed = (status: TicketStatus): boolean =>
  CLOSED_STATUSES.includes(status);

export type SeverityLevel = "Ringan" | "Sedang" | "Berat"; // Berat = Kamar tidak bisa dihuni

export type RoomStatus =
  | "Clean"
  /** Kosong, belum tentu siap huni. */
  | "Vacant"
  | "Occupied"
  | "Needs Cleaning"
  | "In Progress"
  | "Do Not Disturb"
  | "Maintenance";

export interface GuestInfo {
  roomNumber: string;
  name: string;
  language: Language;
  token: string;
  roomType?: string;
  checkInDate?: string;
  checkOutDate?: string;
  checkOutTime?: string; // e.g. "12:00"
  lateCheckoutGranted?: boolean;
  lateCheckoutTime?: string; // e.g. "14:00"
  /** Data kontak — hanya ditampilkan tersamar di antarmuka staf. */
  phone?: string;
  email?: string;
  nationality?: string;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  greeting: string;
  welcomeSub: string;
}

export interface TimelineEntry {
  id: string;
  at: string; // e.g. "21:14"
  ev: "dibuat" | "diterima" | "dikerjakan" | "siap" | "selesai" | "dikonfirmasi" | "ditutup" | "ditunda" | "dilanjutkan" | "dialihkan" | "dibatalkan" | "eskalasi" | "komplain";
  by: string; // "bot" | staff name | "tamu" | "Duty Manager"
  note?: string;
  /** Waktu lengkap (ISO). `at` hanya jam:menit, tidak cukup untuk analitik. */
  ts?: string;
}

export interface ServiceTicketSLA {
  ack_min: number; // e.g. 2 min
  done_min: number; // e.g. 10 min
  created_at: string; // ISO string
  ack_due_at: string; // ISO string
  due_at: string; // ISO string
}

export interface ServiceTicketProof {
  photo_before?: string | null;
  photo_after?: string | null;
  note?: string | null;
  spareparts?: string[] | null;
}

export interface ServiceTicketDefer {
  reason: string | null;
  promised_at: string | null;
  deferred_by?: string;
}

export interface ServiceTicket {
  id: string; // e.g. "A-2417"
  room: string; // e.g. "812"
  roomNumber?: string; // backwards compatibility alias
  guestName: string;
  channel: "qr_web" | "chat_ai" | "manual_fo" | "whatsapp";
  raw_text: string; // Transkrip asli percakapan tamu
  originalRequest?: string; // alias for raw_text
  category: string; // "towel" | "cleaning" | "ac" | "maintenance" | "linen" | "lock" | "other"
  taskTitle: string;
  qty: number;
  confidence: number; // 0.0 to 1.0 (if < 0.8 => routes to FO with label "PERLU DIBACA")
  needsFoReview?: boolean; // true when confidence < 0.8
  dept: Department;
  assignedDepartment?: Department; // alias
  priority: Priority;
  status: TicketStatus;
  assignee?: string; // e.g. "stf_rina"
  assignedStaff?: string; // alias
  severity?: SeverityLevel;
  sla: ServiceTicketSLA;
  timeline: TimelineEntry[];
  proof?: ServiceTicketProof;
  defer?: ServiceTicketDefer;
  guest_rating?: "thumbs_up" | "thumbs_down" | null;
  /**
   * Nilai 1–5 dari tamu. `guest_rating` tetap diisi (≤2 = thumbs_down) supaya
   * jalur eskalasi lama ke Duty Manager tetap satu-satunya jalur.
   */
  guest_score?: number;
  rating_comment?: string;
  parent_ticket?: string | null; // For reopened tickets on thumbs_down
  idempotency_key: string; // e.g. "812-towel-2126"
  isDuplicate?: boolean;
  duplicateCount?: number;
  isEmergency?: boolean;
  isAngryComplaint?: boolean;
  /** Hanya terisi pada tiket berkategori "dining". */
  diningDestination?: DiningDestination;
  /** Hanya terisi bila diningDestination === "table". */
  tableNumber?: string;
  /** Terisi bila tiket ini adalah pesanan makanan (kategori "dining"). */
  order?: FoodOrderInfo;
  /** Terisi bila tiket ini adalah permintaan late check-out. */
  lateCheckout?: { hour: string; fee: number };
  /** Terisi bila tiket ini adalah permintaan bellboy. */
  bellboy?: { service: "luggage_help" | "luggage_pickup" | "escort" | "other"; note?: string };
  /** Terisi bila tiket ini adalah permintaan mobil ke tempat wisata. */
  excursion?: { placeId: string; place: string; pickupAt: string; asap: boolean; people: number; assist: boolean; note?: string };
  /** Jenis darurat yang dipilih tamu, bila tiket dibuat lewat tombol darurat. */
  emergencyType?: "fire" | "medical" | "security" | "other";
  translatedRequest: string; // Indonesian operational instruction for staff
  originalLanguage: string;
  createdAtTime: string; // formatted time e.g. "21:14"
  completedAtTime?: string;
  totalDurationMin?: number;
}

export interface FoodOrderLine {
  menuId: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface FoodOrderInfo {
  /** Nomor pesanan untuk tamu & dapur, mis. "ORD-2048". */
  id: string;
  items: FoodOrderLine[];
  notes?: string;
  total: number;
  payment: "room_folio";
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai" | "system";
  text: string;
  timestamp: string;
  ticket?: ServiceTicket;
  isDirectAnswer?: boolean;
  confidence?: number;
  isEmergency?: boolean;
  isAngryComplaint?: boolean;
  needsFoReview?: boolean;
  isVoiceMessage?: boolean;
  audioDurationSec?: number;
  audioUrl?: string;
  /** Penawaran kontekstual yang menyertai balasan AI (Contextual Upselling) */
  offers?: UpsellOffer[];
  /** Pesan ini dikirim oleh staf manusia, bukan AI (Human Escalation) */
  isHumanAgent?: boolean;
  agentName?: string;
  /** Pemberitahuan sistem bahwa percakapan dialihkan ke manusia */
  isEscalationNotice?: boolean;
  /**
   * Draf pesanan makanan yang dikenali AI dari chat. Belum menjadi pesanan
   * sampai tamu menekan konfirmasi — AI tidak boleh memesan atas nama tamu.
   */
  orderDraft?: { items: { menuId: string; qty: number }[]; confirmedTicketId?: string };
  /** Tamu menyebut makanan tanpa item tertentu: tampilkan tombol ke menu. */
  action?: "open_food_menu" | "open_explore";
  /** Pesan gagal diproses AI; tiket tetap dibuat ke Front Office. */
  aiUnavailable?: boolean;
}

export interface HotelRoom {
  roomNumber: string;
  floor: number;
  guestName: string;
  guestLanguage: string;
  /** Kode bahasa antarmuka tamu kamar ini (id, en, ja, ...). */
  guestLocale?: string;
  guestPhone?: string;
  guestEmail?: string;
  nationality?: string;
  checkInDate?: string;
  checkOutDate?: string;
  roomType: "Deluxe Pool Villa" | "Ocean Panorama Suite" | "Grand Heritage Suite" | "Executive Garden Room";
  status: RoomStatus;
  assignedHousekeeper?: string;
  activeTickets: number;
  lastCleaned: string;
  phoneExtension: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  priority: Priority;
  targetRole: Role | "all";
  read: boolean;
  ticketId?: string;
  roomNumber?: string;
  type?: "sla_breach" | "sla_warning" | "new_ticket" | "defer" | "reopened" | "emergency" | "order_ready" | "rating";
}

export interface SLAConfig {
  category: string;
  dept: Department;
  ackMin: number;
  doneMin: number;
  overflowTarget: "Front Office" | "Duty Manager";
  /** Prioritas bawaan bila pembuat tiket tidak menentukannya. */
  priority?: Priority;
}

export interface FoodMenuItem {
  id: string;
  name: string;
  nameIndo: string;
  category: "Indonesian Classic" | "Western Mains" | "Dessert & Bowls" | "Beverages" | string;
  price: number;
  formattedPrice: string;
  description: string;
  dietary?: string[];
  prepTime: string;
  image: string;
  available: boolean;
  isPopular?: boolean;
}

export type AttractionCategory = "culture" | "nature" | "beach" | "food" | "shopping";
export type DayPart = "morning" | "afternoon" | "evening";

/** Tempat wisata yang direkomendasikan concierge. Deskripsinya ada di kamus (ex.place.<id>). */
export interface Attraction {
  id: string;
  name: string;
  category: AttractionCategory;
  distanceKm: number;
  driveMin: number;
  hours: string;
  /** Perkiraan tiket masuk per orang dewasa, rupiah. 0 = gratis. */
  fee: number;
  bestAt: DayPart[];
  /** Seberapa berat jalan kakinya: penting untuk tamu lansia dan keluarga. */
  effort: "easy" | "moderate" | "hard";
  familyFriendly: boolean;
  mapsQuery: string;
  /** Paket tur hotel yang mengunjungi tempat ini (id dari UPSELL_OFFERS). */
  tourOfferId?: string;
}

export type ColorTune = "luxury_gold" | "deep_navy" | "emerald_sanctuary" | "warm_terracotta";

export interface ColorTuneInfo {
  id: ColorTune;
  name: string;
  desc: string;
  swatch: string;
  headerBg: string;
  bgClass: string;
  primaryClass: string;
  accentText: string;
  cardBorder: string;
}

// ============================================================
// Contextual Upselling
// ============================================================

export type UpsellCategory = "tour" | "spa" | "transport" | "dining" | "room";

export interface UpsellOffer {
  id: string;
  title: string;
  category: UpsellCategory;
  dept: Department;
  description: string;
  price: number;
  formattedPrice: string;
  durationLabel: string;
  posItemCode: string; // kode item untuk POS / folio charge
  /** Kategori tiket atau kata kunci yang membuat penawaran ini relevan */
  triggers: string[];
}

// ============================================================
// Human Escalation System
// ============================================================

export type EscalationReason =
  | "sentimen_komplain"
  | "darurat"
  | "kompleksitas_tinggi"
  | "permintaan_tamu";

export type EscalationStatus = "menunggu" | "ditangani" | "selesai";

export interface EscalationSession {
  id: string;
  room: string;
  guestName: string;
  reason: EscalationReason;
  reasonNote: string;
  status: EscalationStatus;
  startedAt: string;
  agentName?: string;
  /** Selama true, HOSPI AI berhenti membalas dan semua pesan tamu masuk ke antrean manusia */
  aiPaused: boolean;
  targetRole: "front_office" | "duty_manager";
}

// ============================================================
// PMS / POS Integration
// ============================================================

export type IntegrationStatus = "connected" | "simulated" | "degraded" | "disconnected";

export interface PmsConnection {
  vendor: string;
  kind: "PMS" | "POS";
  status: IntegrationStatus;
  endpoint: string;
  lastSyncAt: string;
  capabilities: string[];
}

export interface FolioCharge {
  id: string;
  room: string;
  description: string;
  itemCode: string;
  amount: number;
  formattedAmount: string;
  postedAt: string;
  source: "POS" | "PMS";
  ticketId?: string;
}

// ============================================================
// Data Privacy & Compliance
// ============================================================

export type PrivacyAction =
  | "pii_redacted"
  /** Staf membuka data kontak tamu yang semula tersamar. */
  | "pii_viewed"
  | "chat_anonymized"
  | "retention_purge"
  | "export_requested";

export interface PrivacyLogEntry {
  id: string;
  at: string;
  action: PrivacyAction;
  scope: string;
  detail: string;
}

// ============================================================
// Staf hotel
// ============================================================

export interface StaffMember {
  /** Id stabil; tiket lama menyimpan id ini di `assignee` (mis. "stf_rina"). */
  id: string;
  name: string;
  role: Exclude<Role, "tourist">;
  dept: Department;
  /** Keterangan singkat, mis. "Lantai 8" atau "Teknisi AC". */
  area: string;
  onDuty: boolean;
}
