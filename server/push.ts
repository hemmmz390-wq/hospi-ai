import webpush from "web-push";
import { syncStore } from "./sync";
import { dictionary, TranslationKey } from "../src/i18n/dictionary";
import { LOCALES, Locale } from "../src/i18n/types";

/**
 * Notifikasi push ke HP/tablet staf (Web Push + VAPID).
 *
 * Aktif bila VAPID_PUBLIC_KEY dan VAPID_PRIVATE_KEY terpasang. Langganan
 * disimpan per perangkat bersama peran staf dan bahasanya, di Redis bila ada
 * (andal di Vercel), atau di memori server.
 *
 * Pemicunya notifikasi aplikasi (tiket baru, darurat, SLA lewat, rating
 * buruk, pesanan siap, tamu minta staf) yang tiba di server lewat sinkronisasi.
 */

type Role = "front_office" | "housekeeping" | "maintenance" | "duty_manager" | "food_beverage";
type Subscription = { endpoint: string; keys: { p256dh: string; auth: string } };
/** role "guest": HP tamu, terikat ke kamar dan masa menginapnya (stay). */
type Record_ = { sub: Subscription; role: Role | "guest"; locale: Locale; at: number; room?: string; stay?: string };
type Notification = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  targetRole: string;
  read?: boolean;
  ticketId?: string;
  type?: string;
  roomNumber?: string;
  stay?: string;
  guestNotice?: { kind: string; vars?: Record<string, string | number> };
};

const ROLES: Role[] = ["front_office", "housekeeping", "maintenance", "duty_manager", "food_beverage"];
const HASH = "hospi:push";
/** Hanya notifikasi yang baru terjadi yang dikirim; data contoh dan data lama tidak. */
const FRESH_MS = 2 * 60 * 1000;

const TITLE: Record<string, TranslationKey> = {
  sla_breach: "notif.slaBreach",
  emergency: "notif.emergency",
  rating: "notif.lowRating",
  reopened: "notif.lowRating",
  order_ready: "notif.orderReady",
  defer: "notif.onHold",
  new_ticket: "notif.newRequest",
};

let configured: boolean | null = null;
export function pushEnabled(): boolean {
  if (configured !== null) return configured;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return (configured = false);
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://hospi-ai.vercel.app", pub, priv);
  return (configured = true);
}

export const pushPublicKey = () => (pushEnabled() ? process.env.VAPID_PUBLIC_KEY! : null);

// ---------------- Penyimpanan langganan ----------------
// Disimpan sebagai koleksi tersinkron "pushSubs": ikut tersalin ke perangkat
// staf, sehingga setelah server restart daftar HP pulih dari perangkat yang
// tersambung berikutnya (Redis bila dipasang, memori bila tidak).
async function saveRecord(r: Record_) {
  await syncStore.putPushSub({ endpoint: r.sub.endpoint, ...r, deleted: false });
}

async function removeRecord(endpoint: string) {
  await syncStore.putPushSub({ endpoint, deleted: true, at: Date.now() });
}

async function allRecords(): Promise<Record_[]> {
  return ((await syncStore.pushSubs()) as any[]).filter((e) => !e.deleted && e.sub?.endpoint) as Record_[];
}

// ---------------- API ----------------
function validSub(sub: any): sub is Subscription {
  return Boolean(sub && typeof sub.endpoint === "string" && sub.endpoint.startsWith("https://") && sub.keys?.p256dh && sub.keys?.auth);
}

export async function subscribe(sub: unknown, role: unknown, locale: unknown, room?: unknown, stay?: unknown) {
  if (!validSub(sub)) throw new Error("invalid_subscription");
  const isGuest = role === "guest" && typeof room === "string" && /^\d{3,4}$/.test(room);
  const r: Record_ = {
    sub: { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
    role: isGuest ? "guest" : ROLES.includes(role as Role) ? (role as Role) : "front_office",
    locale: (LOCALES as readonly string[]).includes(locale as string) ? (locale as Locale) : "id",
    at: Date.now(),
    ...(isGuest ? { room: room as string, stay: typeof stay === "string" ? stay : "" } : {}),
  };
  await saveRecord(r);
  return r;
}

export async function unsubscribe(endpoint: unknown) {
  if (typeof endpoint === "string") await removeRecord(endpoint);
}

/** Kabar untuk tamu: disusun dalam bahasa tamu dari kamus. */
function guestPayload(n: Notification, locale: Locale) {
  const key = `g.notice.${n.guestNotice?.kind}` as TranslationKey;
  let body = dictionary[key]?.[locale] || dictionary[key]?.en || "";
  for (const [k, v] of Object.entries(n.guestNotice?.vars || {})) body = body.split(`{${k}}`).join(String(v));
  return JSON.stringify({ title: "Hospi Resort Bali", body, tag: n.ticketId || n.id, url: "/guest/chat", urgent: false });
}

function payloadFor(n: Notification, locale: Locale) {
  const key = n.type ? TITLE[n.type] : undefined;
  const title = key && dictionary[key] ? dictionary[key][locale] || dictionary[key].id : n.title;
  return JSON.stringify({
    title: `HOSPI · ${title}`,
    body: n.message,
    tag: n.ticketId || n.id,
    url: n.ticketId ? `/staff?ticket=${encodeURIComponent(n.ticketId)}` : "/staff",
    urgent: n.type === "emergency" || n.type === "sla_breach",
  });
}

async function send(r: Record_, payload: string, urgent: boolean) {
  try {
    await webpush.sendNotification(r.sub, payload, { TTL: 600, urgency: urgent ? "high" : "normal", timeout: 5000 });
    return true;
  } catch (err: any) {
    // Perangkat sudah mencabut izin atau langganan kedaluwarsa: hapus.
    if (err?.statusCode === 404 || err?.statusCode === 410) await removeRecord(r.sub.endpoint);
    else console.warn("[push] gagal mengirim:", err?.statusCode || err?.message);
    return false;
  }
}

/** Kirim notifikasi baru ke perangkat staf yang perannya dituju. */
export async function pushNotifications(list: Notification[]) {
  if (!pushEnabled() || list.length === 0) return;
  const now = Date.now();
  const fresh = list.filter((n) => !n.read && !n.id.startsWith("seed-") && now - new Date(n.timestamp).getTime() < FRESH_MS);
  if (fresh.length === 0) return;
  const records = await allRecords();
  if (records.length === 0) return;
  const jobs: Promise<boolean>[] = [];
  for (const n of fresh) {
    // Kabar untuk tamu: hanya ke HP tamu kamar itu, pada masa menginap yang sama.
    if (n.targetRole === "tourist") {
      for (const r of records) {
        if (r.role !== "guest" || r.room !== n.roomNumber || (r.stay || "") !== (n.stay || "")) continue;
        jobs.push(send(r, guestPayload(n, r.locale), false));
      }
      continue;
    }
    for (const r of records) {
      if (r.role === "guest") continue;
      if (n.targetRole !== "all" && n.targetRole !== r.role) continue;
      jobs.push(send(r, payloadFor(n, r.locale), n.type === "emergency" || n.type === "sla_breach"));
    }
  }
  await Promise.allSettled(jobs);
}

/** Notifikasi uji ke satu perangkat, dari tombol di Pengaturan. */
export async function pushTest(endpoint: unknown) {
  if (!pushEnabled() || typeof endpoint !== "string") return false;
  const r = (await allRecords()).find((x) => x.sub.endpoint === endpoint);
  if (!r) return false;
  const title = dictionary["push.testTitle" as TranslationKey]?.[r.locale] || "HOSPI";
  const body = dictionary["push.testBody" as TranslationKey]?.[r.locale] || "";
  return send(r, JSON.stringify({ title, body, tag: "hospi-test", url: "/staff", urgent: false }), false);
}
