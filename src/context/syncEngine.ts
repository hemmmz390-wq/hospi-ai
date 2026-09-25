import React, { useCallback, useEffect, useRef } from "react";
import { AppNotification, ChatMessage, EscalationSession, HotelRoom, ServiceTicket } from "../types";
import { readJson, writeJson } from "./persistence";

/**
 * Sinkronisasi antar-perangkat lewat /api/sync (lihat server/sync.ts).
 *
 * Cara kerja singkat:
 * - Perangkat ingat versi terakhir tiap data yang sudah dikirim/diterima.
 *   Data yang referensinya berubah sejak itu dianggap "berubah" dan dikirim.
 * - Server membalas dengan semua perubahan dari perangkat lain.
 * - Bila server baru menyala (kosong) atau instance-nya berganti, server
 *   meminta salinan lengkap dan perangkat mengirimnya.
 * - Reset demo membuat "epoch" baru; perangkat lain otomatis ikut.
 */

type Collection = "tickets" | "rooms" | "notifications" | "escalations" | "chats";
type ChatEntity = { room: string; messages: ChatMessage[] };
type AnyEntity = Record<string, any>;

const EPOCH_KEY = "hospi_epoch_v1";
export type Epoch = { id: string; provisional: boolean };

export function readEpoch(): Epoch | null {
  return readJson<Epoch | null>(EPOCH_KEY, null);
}
export function writeEpoch(epoch: Epoch) {
  writeJson(EPOCH_KEY, epoch);
}

const KEY: Record<Collection, (e: AnyEntity) => string> = {
  tickets: (e) => e.id,
  rooms: (e) => e.roomNumber,
  notifications: (e) => e.id,
  escalations: (e) => e.id,
  chats: (e) => e.room,
};
const COLLECTIONS: Collection[] = ["tickets", "rooms", "notifications", "escalations", "chats"];

export interface SyncBindings {
  tickets: ServiceTicket[];
  rooms: HotelRoom[];
  notifications: AppNotification[];
  escalations: EscalationSession[];
  chats: Record<string, ChatMessage[]>;
  setTickets: React.Dispatch<React.SetStateAction<ServiceTicket[]>>;
  setRooms: React.Dispatch<React.SetStateAction<HotelRoom[]>>;
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  setEscalations: React.Dispatch<React.SetStateAction<EscalationSession[]>>;
  setChats: React.Dispatch<React.SetStateAction<Record<string, ChatMessage[]>>>;
}

export type SyncStatus = "connecting" | "live" | "offline";

function entitiesOf(b: SyncBindings, c: Collection): AnyEntity[] {
  if (c === "chats") return Object.entries(b.chats).map(([room, messages]) => ({ room, messages }));
  return b[c] as AnyEntity[];
}

/**
 * Referensi chat per kamar adalah array pesannya; entitas {room, messages}
 * dibuat baru tiap kali, jadi yang dibandingkan adalah array-nya.
 */
const identity = (c: Collection, e: AnyEntity) => (c === "chats" ? (e as ChatEntity).messages : e);

export function useServerSync(bindings: SyncBindings, onStatus: (s: SyncStatus) => void) {
  const ref = useRef(bindings);
  ref.current = bindings;

  const chatRevs = useRef(new Map<string, number>());
  const meta = useRef({
    instance: null as string | null,
    since: 0,
    lastSynced: Object.fromEntries(COLLECTIONS.map((c) => [c, new Map<string, unknown>()])) as Record<Collection, Map<string, unknown>>,
    inFlight: false,
    again: false,
    failures: 0,
  });

  /** Tandai keadaan saat ini sebagai sudah tersinkron (mis. setelah menerima data dari tab lain). */
  const markAllSynced = useCallback(() => {
    for (const c of COLLECTIONS) {
      const map = meta.current.lastSynced[c];
      map.clear();
      for (const e of entitiesOf(ref.current, c)) map.set(KEY[c](e), identity(c, e));
    }
  }, []);

  const collect = (full: boolean) => {
    const changes: Partial<Record<Collection, AnyEntity[]>> = {};
    const dirty: Partial<Record<Collection, string[]>> = {};
    const sent: { c: Collection; id: string; ident: unknown }[] = [];
    for (const c of COLLECTIONS) {
      const map = meta.current.lastSynced[c];
      const all = entitiesOf(ref.current, c);
      const changed = all.filter((e) => map.get(KEY[c](e)) !== identity(c, e));
      changed.forEach((e) => sent.push({ c, id: KEY[c](e), ident: identity(c, e) }));
      if (full) {
        changes[c] = all;
        dirty[c] = changed.map((e) => KEY[c](e));
      } else if (changed.length) {
        changes[c] = changed;
      }
    }
    return { changes, dirty, sent };
  };

  /**
   * Menggabungkan data dari server. Memakai updater fungsional: state yang
   * dipakai selalu yang terbaru, termasuk perubahan lokal yang belum sempat
   * dirender — jadi tiket yang baru dibuat tamu tidak tertimpa.
   */
  const apply = (data: Partial<Record<Collection, AnyEntity[]>>, replace: boolean) => {
    const b = ref.current;
    for (const c of COLLECTIONS) {
      const incoming = data[c] || [];
      if (!replace && incoming.length === 0) continue;
      const map = meta.current.lastSynced[c];
      // Salinan sebelum setState: updater harus murni (StrictMode memanggilnya dua kali).
      const snap = new Map(map);

      if (c === "chats") {
        b.setChats((prev) => {
          const next: Record<string, ChatMessage[]> = replace ? {} : { ...prev };
          if (replace) map.clear();
          for (const e of incoming as ChatEntity[] & { _rev?: number }[]) {
            const localDirty = !replace && prev[e.room] && snap.get(e.room) !== prev[e.room];
            if (localDirty) continue;
            const rev = (e as { _rev?: number })._rev;
            if (!replace && rev !== undefined && chatRevs.current.get(e.room) === rev) continue;
            if (rev !== undefined) chatRevs.current.set(e.room, rev);
            next[e.room] = e.messages || [];
            map.set(e.room, next[e.room]);
          }
          return next;
        });
        continue;
      }

      const merge = (prev: AnyEntity[]): AnyEntity[] => {
        const result: AnyEntity[] = replace ? [] : [...prev];
        const index = new Map(result.map((e, i) => [KEY[c](e), i]));
        if (replace) map.clear();
        const added: AnyEntity[] = [];
        for (const e of incoming) {
          const id = KEY[c](e);
          const at = index.get(id);
          const local = at !== undefined ? result[at] : undefined;
          if (!replace && local && snap.get(id) !== local) continue; // perubahan lokal belum terkirim
          // Sudah punya versi yang sama persis (server mengirim ulang sebagai jaring pengaman).
          if (!replace && local && local._rev !== undefined && local._rev === e._rev && local._ts === e._ts) continue;
          if (at !== undefined) result[at] = e;
          else added.push(e);
          map.set(id, e);
        }
        const out = [...added, ...result];
        if (c === "tickets") out.sort((x, y) => String(y.sla?.created_at || "").localeCompare(String(x.sla?.created_at || "")));
        if (c === "notifications") out.sort((x, y) => String(y.timestamp || "").localeCompare(String(x.timestamp || "")));
        return out;
      };
      if (c === "tickets") b.setTickets((p) => merge(p) as ServiceTicket[]);
      if (c === "rooms") b.setRooms((p) => merge(p) as HotelRoom[]);
      if (c === "notifications") b.setNotifications((p) => merge(p) as AppNotification[]);
      if (c === "escalations") b.setEscalations((p) => merge(p) as EscalationSession[]);
    }
  };

  const syncOnce = useCallback(async (forceFull = false): Promise<void> => {
    const m = meta.current;
    if (m.inFlight) {
      m.again = true;
      return;
    }
    m.inFlight = true;
    try {
      // Data dari versi lama belum punya epoch: buat satu (otomatis, bukan reset).
      let epoch = readEpoch();
      if (!epoch?.id) {
        epoch = { id: new Date().toISOString(), provisional: true };
        writeEpoch(epoch);
      }
      const { changes, dirty, sent } = collect(forceFull);
      const body = forceFull
        ? { epoch: epoch?.id || null, provisional: epoch?.provisional ?? true, instance: m.instance, since: 0, full: changes, dirty }
        : { epoch: epoch?.id || null, provisional: epoch?.provisional ?? true, instance: m.instance, since: m.since, changes };

      const res = await fetch("/api/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      m.failures = 0;
      onStatus("live");
      m.instance = json.instance;

      if (json.mode === "need_full") {
        m.inFlight = false;
        return syncOnce(true);
      }

      // Yang sudah terkirim dianggap tersinkron, selama belum berubah lagi.
      for (const s of sent) {
        const nowEntity = entitiesOf(ref.current, s.c).find((e) => KEY[s.c](e) === s.id);
        if (nowEntity && identity(s.c, nowEntity) === s.ident) m.lastSynced[s.c].set(s.id, s.ident);
      }

      if (json.mode === "replace") {
        writeEpoch({ id: json.epoch, provisional: true });
        apply(json.data, true);
      } else {
        if (!epoch || epoch.id !== json.epoch) writeEpoch({ id: json.epoch, provisional: epoch?.provisional ?? true });
        apply(json.data, false);
      }
      m.since = json.rev;
    } catch {
      m.failures += 1;
      if (m.failures >= 2) onStatus("offline");
    } finally {
      m.inFlight = false;
      if (m.again) {
        m.again = false;
        setTimeout(() => syncOnce(), 50);
      }
    }
  }, [onStatus]);

  // Detak rutin: 1,5 detik saat terlihat, 3 detik saat tab di belakang (mis. layar
  // staf di jendela lain saat presentasi).
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const loop = () => {
      syncOnce();
      timer = setTimeout(loop, document.visibilityState === "visible" ? 1500 : 3000);
    };
    loop();
    const onVisible = () => document.visibilityState === "visible" && syncOnce();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [syncOnce]);

  // Perubahan lokal dikirim segera, tidak menunggu detak berikutnya.
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => syncOnce(), 150);
  }, [bindings.tickets, bindings.rooms, bindings.notifications, bindings.escalations, bindings.chats, syncOnce]);

  /** Setelah reset demo: server diberi data baru dan semua perangkat ikut. */
  const pushReset = useCallback(() => {
    meta.current.instance = null;
    meta.current.since = 0;
    for (const c of COLLECTIONS) meta.current.lastSynced[c].clear();
    setTimeout(() => syncOnce(true), 50);
  }, [syncOnce]);

  return { markAllSynced, pushReset };
}
