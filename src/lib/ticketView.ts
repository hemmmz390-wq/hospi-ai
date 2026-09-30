import { Priority, ServiceTicket, TicketStatus, isTicketClosed } from "../types";
import type { TranslationKey } from "../i18n";

/**
 * Cara tiket ditampilkan. Data tetap memakai status lama (BARU, DITERIMA, ...);
 * berkas ini satu-satunya tempat yang menerjemahkannya ke bahasa tampilan.
 */

export type Tone = "neutral" | "strong" | "ok" | "warn" | "crit" | "muted";

export const isOrder = (t: ServiceTicket) => t.category === "dining";

export function staffStatusKey(t: ServiceTicket): TranslationKey {
  const order = isOrder(t);
  switch (t.status) {
    case "BARU":
      return "st.new";
    case "DITERIMA":
      return "st.accepted";
    case "DIKERJAKAN":
      return order ? "st.preparing" : "st.in_progress";
    case "SIAP":
      return "st.ready";
    case "DITUNDA":
      return "st.waiting";
    case "DIALIHKAN":
      return "st.transferred";
    case "SELESAI":
      return order ? "st.delivered" : "st.completed";
    case "DIKONFIRMASI":
    case "DITUTUP":
      return order ? "st.delivered" : "st.completed";
    case "DIBATALKAN":
      return "st.cancelled";
  }
}

export function statusTone(status: TicketStatus): Tone {
  switch (status) {
    case "BARU":
      return "strong";
    case "DITUNDA":
      return "warn";
    case "SELESAI":
    case "DIKONFIRMASI":
    case "DITUTUP":
      return "ok";
    case "DIBATALKAN":
      return "muted";
    default:
      return "neutral";
  }
}

/** Tiga langkah yang dilihat tamu: Diterima → Dikerjakan → Selesai. */
export type GuestStep = 0 | 1 | 2;
export function guestStep(t: ServiceTicket): GuestStep {
  if (["SELESAI", "DIKONFIRMASI", "DITUTUP"].includes(t.status)) return 2;
  if (["DIKERJAKAN", "SIAP", "DITUNDA"].includes(t.status)) return 1;
  return 0;
}

/** Empat langkah pesanan makanan: Diterima → Disiapkan → Siap → Diantar. */
export function orderStep(t: ServiceTicket): 0 | 1 | 2 | 3 {
  if (["SELESAI", "DIKONFIRMASI", "DITUTUP"].includes(t.status)) return 3;
  if (t.status === "SIAP") return 2;
  if (t.status === "DIKERJAKAN") return 1;
  return 0;
}

export const priorityKey = (p: Priority): TranslationKey => `pri.${p}` as TranslationKey;

export function priorityTone(p: Priority): Tone {
  if (p === "EMERGENCY") return "crit";
  if (p === "HIGH") return "strong";
  return "neutral";
}

const KNOWN_CATEGORIES = [
  "towel", "cleaning", "linen", "ac", "electricity", "plumbing", "tv_wifi", "key_lock",
  "billing_checkout", "complaint", "emergency", "dining", "bellboy", "excursion", "unclassified",
];

export function categoryKey(category: string): TranslationKey {
  if (category.startsWith("upsell_")) return "cat.upsell";
  return (KNOWN_CATEGORIES.includes(category) ? `cat.${category}` : "cat.unclassified") as TranslationKey;
}

export const isEscalated = (t: ServiceTicket) =>
  Boolean(t.parent_ticket) || (t.dept === "Duty Manager" && Boolean(t.isAngryComplaint));

// ------------------------------------------------------------
// SLA
// ------------------------------------------------------------

export type SlaState = "on_track" | "at_risk" | "breached" | "met" | "missed" | "none";

export interface SlaView {
  state: SlaState;
  /** Sisa waktu dalam ms (negatif bila sudah lewat). */
  remainingMs: number;
  /** 0..1+, porsi waktu SLA yang sudah terpakai. */
  progress: number;
}

export function completedAt(t: ServiceTicket): number | null {
  const done = [...t.timeline].reverse().find((e) => e.ev === "selesai");
  if (done?.ts) return new Date(done.ts).getTime();
  if (t.totalDurationMin) return new Date(t.sla.created_at).getTime() + t.totalDurationMin * 60000;
  return null;
}

export function slaView(t: ServiceTicket, now: number): SlaView {
  const created = new Date(t.sla.created_at).getTime();
  const due = new Date(t.sla.due_at).getTime();
  const total = Math.max(1, due - created);

  if (t.status === "DIBATALKAN") return { state: "none", remainingMs: 0, progress: 0 };
  if (isTicketClosed(t.status)) {
    const end = completedAt(t);
    const met = end === null || end <= due;
    return { state: met ? "met" : "missed", remainingMs: due - (end ?? due), progress: ((end ?? due) - created) / total };
  }

  const remainingMs = due - now;
  const progress = (now - created) / total;
  const state: SlaState = remainingMs < 0 ? "breached" : progress >= 0.75 ? "at_risk" : "on_track";
  return { state, remainingMs, progress };
}

export const slaTone = (s: SlaState): Tone =>
  s === "breached" || s === "missed" ? "crit" : s === "at_risk" ? "warn" : s === "met" ? "ok" : "neutral";

/** 08:42 untuk sisa di bawah satu jam, 1j 05m di atasnya. */
export function formatCountdown(ms: number): string {
  const abs = Math.abs(ms);
  const totalSec = Math.floor(abs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const minutesLeft = (ms: number) => Math.max(1, Math.ceil(ms / 60000));

/** Waktu respons: dari tiket dibuat sampai pertama kali diterima petugas. */
export function responseMinutes(t: ServiceTicket): number | null {
  const accepted = t.timeline.find((e) => e.ev === "diterima" && e.ts);
  if (!accepted?.ts) return null;
  return Math.max(0, Math.round((new Date(accepted.ts).getTime() - new Date(t.sla.created_at).getTime()) / 60000));
}

export function resolutionMinutes(t: ServiceTicket): number | null {
  if (t.totalDurationMin) return t.totalDurationMin;
  const end = completedAt(t);
  if (!end) return null;
  return Math.max(1, Math.round((end - new Date(t.sla.created_at).getTime()) / 60000));
}

/** Nomor yang ditampilkan: pesanan memakai ORD-, tiket lain HOS-. */
export const displayId = (t: ServiceTicket) => t.order?.id || t.id;
