/**
 * Sync hub: satu salinan data hotel yang dibagi semua perangkat.
 *
 * Tamu di HP, Front Office di laptop, dan Maintenance di tablet membaca dan
 * menulis ke sini. Setiap perangkat mengirim perubahannya dan menerima
 * perubahan perangkat lain tiap 1,5 detik.
 *
 * Dua tempat penyimpanan:
 * - Redis (Upstash), bila KV_REST_API_URL/KV_REST_API_TOKEN terpasang.
 *   Semua instance server membaca data yang sama. Inilah mode yang andal.
 * - Memori server, sebagai cadangan. Di Vercel, permintaan bisa dilayani
 *   beberapa instance dengan memori masing-masing; perangkat lalu mengisi
 *   ulang instance yang tertinggal (lihat "need_full"). Tetap berjalan,
 *   tetapi lebih lambat dan lebih boros data.
 *
 * Aturan konflik: perubahan yang tiba paling akhir menang. Waktu dicap oleh
 * server, bukan oleh jam perangkat yang bisa berbeda-beda.
 */
import { RedisLike, redisFromEnv } from "./redis";

type Entity = Record<string, any> & { _ts?: number; _rev?: number };

export const COLLECTIONS = ["tickets", "rooms", "notifications", "escalations", "chats"] as const;
export type Collection = (typeof COLLECTIONS)[number];
export type Changes = Partial<Record<Collection, Entity[]>>;
type Epoch = { id: string; provisional: boolean };
type Write = { c: Collection; e: Entity; ts: number };

const KEY: Record<Collection, (e: Entity) => string> = {
  tickets: (e) => e.id,
  rooms: (e) => e.roomNumber,
  notifications: (e) => e.id,
  escalations: (e) => e.id,
  chats: (e) => e.room,
};

export interface SyncRequest {
  epoch: string | null;
  provisional: boolean;
  instance: string | null;
  since: number;
  changes?: Changes;
  full?: Changes;
  dirty?: Partial<Record<Collection, string[]>>;
}

export type SyncResponse =
  | { mode: "need_full"; instance: string; epoch: string | null; store: string }
  | { mode: "delta" | "replace"; instance: string; epoch: string; rev: number; data: Changes; store: string };

// ============================================================
// Backend
// ============================================================

interface Backend {
  readonly kind: "memory" | "redis";
  instance(): string;
  getEpoch(): Promise<Epoch | null>;
  reset(epoch: Epoch): Promise<void>;
  get(c: Collection, ids: string[]): Promise<Map<string, Entity>>;
  write(writes: Write[]): Promise<void>;
  changedSince(since: number): Promise<{ data: Changes; rev: number }>;
  all(): Promise<{ data: Changes; rev: number }>;
}

function memoryBackend(): Backend {
  const instance = `inst-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  let epoch: Epoch | null = null;
  let rev = 0;
  const items = Object.fromEntries(COLLECTIONS.map((c) => [c, new Map<string, Entity>()])) as Record<Collection, Map<string, Entity>>;
  const pick = (since: number) => {
    const data: Changes = {};
    for (const c of COLLECTIONS) data[c] = Array.from(items[c].values()).filter((e) => (e._rev || 0) > since);
    return { data, rev };
  };
  return {
    kind: "memory",
    instance: () => instance,
    getEpoch: async () => epoch,
    reset: async (next) => {
      epoch = next;
      for (const c of COLLECTIONS) items[c].clear();
    },
    get: async (c, ids) => new Map(ids.filter((id) => items[c].has(id)).map((id) => [id, items[c].get(id)!])),
    write: async (writes) => {
      for (const w of writes) {
        rev += 1;
        items[w.c].set(KEY[w.c](w.e), { ...w.e, _ts: w.ts, _rev: rev });
      }
    },
    changedSince: async (since) => pick(since),
    all: async () => pick(0),
  };
}

/**
 * Redis: satu hash per koleksi, satu sorted set berisi daftar perubahan
 * (skor = nomor revisi), dan satu penghitung revisi. Membaca perubahan
 * mengambil sedikit ke belakang (REV_WINDOW) supaya tulisan yang selesai
 * sedikit terlambat dari perangkat lain tidak terlewat; perangkat mengabaikan
 * data yang sudah dimilikinya.
 */
const PREFIX = "hospi:";
const REV_WINDOW = 50;

function redisBackend(redis: RedisLike): Backend {
  const hash = (c: Collection) => `${PREFIX}c:${c}`;
  const parse = (v: unknown): Entity | null => {
    try {
      return typeof v === "string" ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  };
  const all = async () => {
    const res = await redis.pipeline([...COLLECTIONS.map((c) => ["HGETALL", hash(c)]), ["GET", `${PREFIX}rev`]]);
    const data: Changes = {};
    COLLECTIONS.forEach((c, i) => {
      const flat = (res[i] as string[]) || [];
      const list: Entity[] = [];
      for (let k = 1; k < flat.length; k += 2) {
        const e = parse(flat[k]);
        if (e) list.push(e);
      }
      data[c] = list;
    });
    return { data, rev: Number(res[COLLECTIONS.length]) || 0 };
  };
  return {
    kind: "redis",
    instance: () => "redis",
    getEpoch: async () => parse(await redis.command(["GET", `${PREFIX}epoch`])) as Epoch | null,
    reset: async (next) => {
      await redis.pipeline([
        ...COLLECTIONS.map((c) => ["DEL", hash(c)]),
        ["DEL", `${PREFIX}changes`],
        ["SET", `${PREFIX}epoch`, JSON.stringify(next)],
      ]);
    },
    get: async (c, ids) => {
      const out = new Map<string, Entity>();
      if (ids.length === 0) return out;
      const values = (await redis.command<unknown[]>(["HMGET", hash(c), ...ids])) || [];
      ids.forEach((id, i) => {
        const e = parse(values[i]);
        if (e) out.set(id, e);
      });
      return out;
    },
    write: async (writes) => {
      if (writes.length === 0) return;
      const last = Number(await redis.command(["INCRBY", `${PREFIX}rev`, writes.length]));
      const first = last - writes.length + 1;
      const cmds: (string | number)[][] = [];
      writes.forEach((w, i) => {
        const id = KEY[w.c](w.e);
        const rev = first + i;
        cmds.push(["HSET", hash(w.c), id, JSON.stringify({ ...w.e, _ts: w.ts, _rev: rev })]);
        cmds.push(["ZADD", `${PREFIX}changes`, rev, `${w.c}|${id}`]);
      });
      await redis.pipeline(cmds);
    },
    changedSince: async (since) => {
      if (since <= 0) return all();
      const flat = (await redis.command<string[]>(["ZRANGEBYSCORE", `${PREFIX}changes`, `(${Math.max(0, since - REV_WINDOW)}`, "+inf", "WITHSCORES"])) || [];
      const byC = new Map<Collection, string[]>();
      let rev = since;
      for (let k = 0; k < flat.length; k += 2) {
        const [c, ...rest] = String(flat[k]).split("|");
        const id = rest.join("|");
        rev = Math.max(rev, Number(flat[k + 1]) || 0);
        if (!(COLLECTIONS as readonly string[]).includes(c)) continue;
        byC.set(c as Collection, [...(byC.get(c as Collection) || []), id]);
      }
      const data: Changes = {};
      const cs = Array.from(byC.keys());
      const res = await redis.pipeline(cs.map((c) => ["HMGET", hash(c), ...byC.get(c)!]));
      cs.forEach((c, i) => {
        data[c] = ((res[i] as unknown[]) || []).map(parse).filter((e): e is Entity => Boolean(e));
      });
      return { data, rev };
    },
    all,
  };
}

let backend: Backend | null = null;
function getBackend(): Backend {
  if (!backend) {
    const redis = redisFromEnv();
    backend = redis ? redisBackend(redis) : memoryBackend();
    console.log(`[sync] store: ${backend.kind}`);
  }
  return backend;
}

/** Untuk pengujian: pakai backend tertentu. */
export function useSyncBackend(kind: "memory" | RedisLike) {
  backend = kind === "memory" ? memoryBackend() : redisBackend(kind);
}

export const syncInstance = () => getBackend().instance();
export const syncStoreKind = () => getBackend().kind;

// ============================================================
// Protokol
// ============================================================

/** Chat per kamar: gabungan pesan kedua sisi, urutan kedatangan dipertahankan. */
function mergeChat(existing: Entity | undefined, incoming: Entity): Entity {
  if (!existing) return { room: incoming.room, messages: incoming.messages || [] };
  const byId = new Map<string, any>();
  for (const m of existing.messages || []) byId.set(m.id, m);
  for (const m of incoming.messages || []) byId.set(m.id, m);
  const seen = new Set<string>();
  const messages = [...(existing.messages || []), ...(incoming.messages || [])]
    .map((m) => m.id)
    .filter((id) => (seen.has(id) ? false : (seen.add(id), true)))
    .map((id) => byId.get(id));
  return { room: incoming.room, messages };
}

async function applyChanges(b: Backend, changes: Changes | undefined, now: number) {
  if (!changes) return;
  const writes: Write[] = [];
  for (const c of COLLECTIONS) {
    const list = (changes[c] || []).filter((e) => e && KEY[c](e));
    if (list.length === 0) continue;
    const existing = c === "chats" ? await b.get(c, list.map((e) => KEY[c](e))) : null;
    for (const e of list) writes.push({ c, e: c === "chats" ? mergeChat(existing!.get(KEY[c](e)), e) : e, ts: now });
  }
  await b.write(writes);
}

/**
 * Salinan lengkap dari perangkat. Entitas "dirty" (berubah di perangkat,
 * belum terkirim) selalu diterima. Selebihnya hanya mengisi yang belum ada
 * atau yang salinan servernya lebih tua — perangkat yang lama tidak aktif
 * tidak boleh menimpa perubahan terbaru.
 */
async function applyFull(b: Backend, full: Changes, dirty: SyncRequest["dirty"], now: number) {
  const writes: Write[] = [];
  for (const c of COLLECTIONS) {
    const list = (full[c] || []).filter((e) => e && KEY[c](e));
    if (list.length === 0) continue;
    const existing = await b.get(c, list.map((e) => KEY[c](e)));
    const dirtyIds = new Set(dirty?.[c] || []);
    for (const e of list) {
      const id = KEY[c](e);
      const old = existing.get(id);
      const merged = c === "chats" ? mergeChat(old, e) : e;
      if (dirtyIds.has(id)) writes.push({ c, e: merged, ts: now });
      else if (!old) writes.push({ c, e: merged, ts: e._ts || 0 });
      else if ((e._ts || 0) > (old._ts || 0)) writes.push({ c, e: merged, ts: e._ts || 0 });
      else if (c === "chats" && (merged.messages?.length || 0) > (old.messages?.length || 0)) writes.push({ c, e: merged, ts: old._ts || 0 });
    }
  }
  await b.write(writes);
}

/** Data perangkat menang hanya bila server kosong, atau perangkat baru saja reset. */
function clientWins(req: SyncRequest, server: Epoch | null) {
  if (!req.epoch) return false;
  if (!server) return true;
  if (req.epoch === server.id) return false;
  // Data otomatis di perangkat yang baru membuka aplikasi tidak boleh menimpa
  // demo yang sedang berjalan.
  if (req.provisional) return false;
  return req.epoch > server.id;
}

export async function handleSync(input: SyncRequest): Promise<SyncResponse> {
  const b = getBackend();
  const now = Date.now();
  // Epoch kosong tidak pernah diterima; kalau tidak, server tidak pernah punya
  // kumpulan data aktif dan meminta salinan lengkap terus-menerus.
  const req: SyncRequest = input.epoch ? input : { ...input, epoch: new Date(now).toISOString(), provisional: true };
  const base = { instance: b.instance(), store: b.kind };
  const server = await b.getEpoch();

  if (req.full) {
    if (clientWins(req, server)) {
      await b.reset({ id: req.epoch!, provisional: req.provisional });
      await applyFull(b, req.full, undefined, now);
    } else if (server && req.epoch === server.id) {
      await applyFull(b, req.full, req.dirty, now);
    } else {
      return { ...base, mode: "replace", epoch: server!.id, ...(await b.all()) };
    }
    const epoch = (await b.getEpoch())!;
    return { ...base, mode: "delta", epoch: epoch.id, ...(await b.all()) };
  }

  if (!server || req.instance !== b.instance() || clientWins(req, server)) {
    return { ...base, mode: "need_full", epoch: server?.id || null };
  }

  if (req.epoch !== server.id) {
    return { ...base, mode: "replace", epoch: server.id, ...(await b.all()) };
  }

  await applyChanges(b, req.changes, now);
  return { ...base, mode: "delta", epoch: server.id, ...(await b.changedSince(req.since)) };
}

/** Akses langsung untuk endpoint lama (/api/tickets, privasi). */
export const syncStore = {
  tickets: async () => (await getBackend().all()).data.tickets || [],
  getTicket: async (id: string) => (await getBackend().get("tickets", [id])).get(id),
  putTicket: async (t: Entity) => getBackend().write([{ c: "tickets", e: t, ts: Date.now() }]),
};
