import { Role } from "../types";

/**
 * AuthenticationService (demo).
 *
 * Tidak ada autentikasi sungguhan: ini lingkungan demo. Sesi disimpan per tab
 * (sessionStorage) dengan salinan di localStorage sebagai bawaan untuk tab baru.
 * Hasilnya: satu tab bisa menjadi tamu kamar 508 sementara tab lain menjadi
 * Front Office, dan keduanya tidak saling menimpa saat dimuat ulang.
 *
 * Saat autentikasi sungguhan dipasang, hanya berkas ini yang perlu diganti.
 */
export type Session =
  | { kind: "guest"; room: string }
  | { kind: "staff"; role: Exclude<Role, "tourist">; staffId: string };

const KEY = "hospi_session_v2";

function read(storage: Storage | undefined): Session | null {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s?.kind === "guest" && typeof s.room === "string") return s;
    if (s?.kind === "staff" && typeof s.role === "string" && typeof s.staffId === "string") return s;
  } catch {
    /* penyimpanan tidak tersedia */
  }
  return null;
}

function write(storage: Storage | undefined, session: Session | null) {
  try {
    if (!storage) return;
    if (session) storage.setItem(KEY, JSON.stringify(session));
    else storage.removeItem(KEY);
  } catch {
    /* mode privat: sesi hanya hidup di memori */
  }
}

const safe = (fn: () => Storage) => {
  try {
    return fn();
  } catch {
    return undefined;
  }
};

export const sessionService = {
  load(): Session | null {
    return read(safe(() => sessionStorage)) || read(safe(() => localStorage));
  },
  save(session: Session) {
    write(safe(() => sessionStorage), session);
    write(safe(() => localStorage), session);
  },
  clear() {
    write(safe(() => sessionStorage), null);
    write(safe(() => localStorage), null);
  },
};
