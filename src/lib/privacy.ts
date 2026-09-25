import { Role } from "../types";

/**
 * Minimisasi identitas tamu di antarmuka staf.
 *
 * Front Office dan Duty Manager berurusan langsung dengan tamu, jadi melihat
 * nama lengkap. Housekeeping, Maintenance, dan F&B cukup tahu nomor kamar —
 * nama mereka lihat tersamar. Nomor telepon selalu tersamar; membukanya
 * dicatat di log privasi.
 */
export function canSeeGuestName(role: Role): boolean {
  return role === "front_office" || role === "duty_manager" || role === "tourist";
}

export function maskName(name: string): string {
  if (!name) return "";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${Array.from(part)[0]}***`)
    .join(" ");
}

export function maskPhone(phone?: string): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  return `•••• ${digits.slice(-4)}`;
}

export function maskEmail(email?: string): string {
  if (!email) return "—";
  const [user, domain] = email.split("@");
  return `${user.slice(0, 1)}•••@${domain}`;
}

export function guestNameFor(role: Role, name: string): string {
  return canSeeGuestName(role) ? name : maskName(name);
}
