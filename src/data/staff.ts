import { Role, StaffMember } from "../types";

/**
 * Daftar staf yang bertugas. Id lama ("stf_rina", "eng_budi") dipertahankan
 * karena tiket tersimpan dari versi sebelumnya merujuk ke id tersebut.
 */
export const STAFF: StaffMember[] = [
  { id: "stf_sarah", name: "Sarah Tan", role: "front_office", dept: "Front Office", area: "Front desk", onDuty: true },
  { id: "stf_made", name: "Made Wirawan", role: "front_office", dept: "Front Office", area: "Concierge & bell service", onDuty: true },
  { id: "stf_ayu", name: "Ayu Lestari", role: "front_office", dept: "Front Office", area: "Guest relations", onDuty: true },

  { id: "stf_rina", name: "Rina Kartika", role: "housekeeping", dept: "Housekeeping", area: "Floors 7–8", onDuty: true },
  { id: "stf_komang", name: "Komang Sari", role: "housekeeping", dept: "Housekeeping", area: "Floors 5–6", onDuty: true },
  { id: "stf_putu", name: "Putu Ari", role: "housekeeping", dept: "Housekeeping", area: "Floors 3–4", onDuty: true },
  { id: "stf_wayan", name: "Wayan Dewi", role: "housekeeping", dept: "Housekeeping", area: "Floors 1–2", onDuty: true },

  { id: "eng_budi", name: "Budi Santoso", role: "maintenance", dept: "Maintenance", area: "AC & ventilation", onDuty: true },
  { id: "eng_nyoman", name: "Nyoman Adi", role: "maintenance", dept: "Maintenance", area: "Plumbing & electrical", onDuty: true },
  { id: "eng_kadek", name: "Kadek Surya", role: "maintenance", dept: "Maintenance", area: "Wi-Fi & in-room tech", onDuty: false },

  { id: "dm_andre", name: "Andre Wijaya", role: "duty_manager", dept: "Duty Manager", area: "Duty manager on shift", onDuty: true },

  { id: "fb_gede", name: "Gede Pratama", role: "food_beverage", dept: "Food & Beverage", area: "Kitchen", onDuty: true },
  { id: "fb_nia", name: "Nia Putri", role: "food_beverage", dept: "Food & Beverage", area: "In-room dining", onDuty: true },
];

/** Profil yang dipakai saat masuk demo sebagai peran tertentu. */
export const DEFAULT_STAFF_FOR_ROLE: Record<Exclude<Role, "tourist">, string> = {
  front_office: "stf_sarah",
  housekeeping: "stf_rina",
  maintenance: "eng_budi",
  duty_manager: "dm_andre",
  food_beverage: "fb_gede",
};

/**
 * Tiket menyimpan petugas dalam beberapa bentuk: id ("stf_rina"), nama lengkap,
 * atau label lama ("Rina (Floor 8)"). Semuanya diselesaikan ke satu profil.
 */
export function resolveStaff(ref?: string | null): StaffMember | undefined {
  if (!ref) return undefined;
  const byId = STAFF.find((s) => s.id === ref);
  if (byId) return byId;
  const lower = ref.toLowerCase();
  return STAFF.find(
    (s) => s.name.toLowerCase() === lower || lower.startsWith(s.name.split(" ")[0].toLowerCase())
  );
}

export function staffDisplayName(ref?: string | null): string | undefined {
  if (!ref) return undefined;
  return resolveStaff(ref)?.name || ref;
}
