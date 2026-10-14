import { createHmac, randomInt, timingSafeEqual } from "crypto";

/**
 * Kode akses tamu sungguhan.
 *
 * Front Office meminta kode saat check-in. Server membuat kode 6 karakter dan
 * sidik jarinya (HMAC dengan rahasia server). Hanya sidik jari yang disimpan di
 * data kamar (ikut tersinkron ke semua perangkat); tanpa rahasia server, kode
 * tidak bisa ditebak dari sidik jari itu. Tamu masuk dengan nomor kamar + kode,
 * dan servernya yang memeriksa.
 */

// Tanpa huruf yang mudah tertukar (0/O, 1/I/L).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function secret(): string {
  return process.env.GUEST_ACCESS_SECRET || process.env.VAPID_PRIVATE_KEY || "hospi-demo-secret";
}

export function accessHash(room: string, code: string): string {
  return createHmac("sha256", secret()).update(`${room.trim()}:${code.trim().toUpperCase()}`).digest("hex");
}

export function issueCode(room: string): { code: string; hash: string } {
  let code = "";
  for (let i = 0; i < 6; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return { code, hash: accessHash(room, code) };
}

export function verifyCode(room: string, code: string, storedHash: string | undefined): boolean {
  if (!storedHash || !code) return false;
  const a = Buffer.from(accessHash(room, code), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Batas percobaan per alamat IP, supaya kode tidak bisa ditebak beruntun. */
const attempts = new Map<string, { n: number; since: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 12;

export function tooManyAttempts(ip: string): boolean {
  const now = Date.now();
  const a = attempts.get(ip);
  if (!a || now - a.since > WINDOW_MS) {
    attempts.set(ip, { n: 1, since: now });
    return false;
  }
  a.n += 1;
  return a.n > MAX_ATTEMPTS;
}
