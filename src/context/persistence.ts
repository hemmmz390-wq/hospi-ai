import { AppNotification, ChatMessage, EscalationSession, HotelRoom, ServiceTicket } from "../types";
import { seedNotifications, seedRooms, seedTickets, withActiveCounts } from "../data/seed";

/**
 * Penyimpanan lokal (localStorage) untuk data demo.
 *
 * Tidak ada database: seluruh data hotel hidup di browser. Kunci-kunci di bawah
 * juga menjadi saluran sinkronisasi antar-tab — tab tamu dan tab staf saling
 * melihat perubahan lewat event `storage`.
 */
export const KEYS = {
  tickets: "hospi_tickets_v4",
  rooms: "hospi_rooms_v4",
  notifications: "hospi_notifs_v4",
  chats: "hospi_chats_v4",
  escalations: "hospi_escalations_v4",
  seededAt: "hospi_seeded_at_v4",
  simulation: "hospi_simulation_v1",
  alarmMuted: "hospi_alarm_muted_v1",
  privacyLocal: "hospi_privacy_local_v1",
  offerStats: "hospi_offer_stats_v1",
} as const;


export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* kuota penuh atau mode privat: data tetap hidup di memori */
  }
}

/** Data demo yang tersimpan lebih lama dari ini dibuat ulang, supaya SLA tidak semuanya "lewat". */
const STALE_AFTER_MS = 12 * 60 * 60 * 1000;

export interface DemoData {
  tickets: ServiceTicket[];
  rooms: HotelRoom[];
  notifications: AppNotification[];
  chats: Record<string, ChatMessage[]>;
  escalations: EscalationSession[];
}

export function freshDemoData(): DemoData {
  const now = new Date();
  const tickets = seedTickets(now);
  return {
    tickets,
    rooms: withActiveCounts(seedRooms(now), tickets),
    notifications: seedNotifications(now),
    chats: {},
    escalations: [],
  };
}

export function loadDemoData(): DemoData {
  const seededAt = readJson<string | null>(KEYS.seededAt, null);
  const stale = !seededAt || Date.now() - Date.parse(seededAt) > STALE_AFTER_MS;
  const tickets = readJson<ServiceTicket[] | null>(KEYS.tickets, null);

  if (stale || !tickets) {
    const fresh = freshDemoData();
    writeJson(KEYS.seededAt, new Date().toISOString());
    // Data otomatis (bukan reset sengaja): kalau server sudah punya data demo
    // yang sedang berjalan, perangkat ini ikut data server, bukan menimpanya.
    writeJson("hospi_epoch_v1", { id: new Date().toISOString(), provisional: true });
    return fresh;
  }
  return {
    tickets,
    rooms: readJson<HotelRoom[]>(KEYS.rooms, freshDemoData().rooms),
    notifications: readJson<AppNotification[]>(KEYS.notifications, []),
    chats: readJson<Record<string, ChatMessage[]>>(KEYS.chats, {}),
    escalations: readJson<EscalationSession[]>(KEYS.escalations, []),
  };
}

/** Nomor berikutnya untuk prefiks tertentu, dari nomor terbesar yang sudah ada. */
export function nextNumber(ids: (string | undefined)[], prefix: string, start: number): number {
  let max = start - 1;
  for (const id of ids) {
    if (!id || !id.startsWith(prefix)) continue;
    const n = Number(id.slice(prefix.length));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max + 1;
}
