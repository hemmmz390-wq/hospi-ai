import { Attraction, DayPart } from "../types";

/**
 * Tempat wisata pilihan concierge di sekitar hotel (area Ubud).
 *
 * Jarak dan waktu tempuh dihitung dari hotel dengan mobil di jam normal.
 * Harga tiket adalah perkiraan untuk demo; aplikasi selalu menyebutnya
 * "perkiraan" kepada tamu.
 */
export const ATTRACTIONS: Attraction[] = [
  { id: "ubud-palace", name: "Ubud Palace & Art Market", category: "culture", distanceKm: 3, driveMin: 10, hours: "08:00–19:00", fee: 0, bestAt: ["morning", "afternoon", "evening"], effort: "easy", familyFriendly: true, mapsQuery: "Puri Saren Agung Ubud" },
  { id: "monkey-forest", name: "Sacred Monkey Forest", category: "nature", distanceKm: 3, driveMin: 10, hours: "09:00–18:00", fee: 80000, bestAt: ["morning", "afternoon"], effort: "easy", familyFriendly: true, mapsQuery: "Sacred Monkey Forest Sanctuary Ubud" },
  { id: "campuhan", name: "Campuhan Ridge Walk", category: "nature", distanceKm: 4, driveMin: 12, hours: "06:00–18:30", fee: 0, bestAt: ["morning", "evening"], effort: "moderate", familyFriendly: true, mapsQuery: "Campuhan Ridge Walk Ubud" },
  { id: "goa-gajah", name: "Goa Gajah (Elephant Cave)", category: "culture", distanceKm: 5, driveMin: 15, hours: "08:00–17:00", fee: 50000, bestAt: ["morning", "afternoon"], effort: "moderate", familyFriendly: true, mapsQuery: "Goa Gajah Bali" },
  { id: "bebek-sawah", name: "Bebek Tepi Sawah", category: "food", distanceKm: 5, driveMin: 15, hours: "10:00–22:00", fee: 0, bestAt: ["afternoon", "evening"], effort: "easy", familyFriendly: true, mapsQuery: "Bebek Tepi Sawah Ubud" },
  { id: "tegallalang", name: "Tegallalang Rice Terrace", category: "nature", distanceKm: 10, driveMin: 25, hours: "07:00–18:00", fee: 25000, bestAt: ["morning"], effort: "moderate", familyFriendly: true, mapsQuery: "Tegallalang Rice Terrace", tourOfferId: "off-tour-ubud" },
  { id: "tirta-empul", name: "Tirta Empul Temple", category: "culture", distanceKm: 15, driveMin: 30, hours: "08:00–18:00", fee: 75000, bestAt: ["morning", "afternoon"], effort: "easy", familyFriendly: true, mapsQuery: "Pura Tirta Empul", tourOfferId: "off-tour-ubud" },
  { id: "sukawati", name: "Sukawati Art Market", category: "shopping", distanceKm: 12, driveMin: 30, hours: "08:00–18:00", fee: 0, bestAt: ["morning", "afternoon"], effort: "easy", familyFriendly: true, mapsQuery: "Pasar Seni Sukawati" },
  { id: "tukad-cepung", name: "Tukad Cepung Waterfall", category: "nature", distanceKm: 20, driveMin: 40, hours: "08:00–17:00", fee: 20000, bestAt: ["morning"], effort: "hard", familyFriendly: false, mapsQuery: "Tukad Cepung Waterfall" },
  { id: "sanur", name: "Sanur Beach", category: "beach", distanceKm: 25, driveMin: 50, hours: "06:00–18:00", fee: 0, bestAt: ["morning", "afternoon"], effort: "easy", familyFriendly: true, mapsQuery: "Pantai Sanur" },
  { id: "kintamani", name: "Kintamani – Mount Batur View", category: "nature", distanceKm: 35, driveMin: 60, hours: "08:00–17:00", fee: 50000, bestAt: ["morning", "afternoon"], effort: "easy", familyFriendly: true, mapsQuery: "Kintamani Mount Batur viewpoint", tourOfferId: "off-tour-sunrise" },
  { id: "tanah-lot", name: "Tanah Lot Temple", category: "culture", distanceKm: 45, driveMin: 75, hours: "07:00–19:00", fee: 75000, bestAt: ["afternoon"], effort: "easy", familyFriendly: true, mapsQuery: "Tanah Lot Temple" },
];

export type DayPartNow = DayPart | "night";

/** Bagian hari sekarang. Malam larut → rekomendasi untuk besok pagi. */
export function dayPartOf(date = new Date()): DayPartNow {
  const h = date.getHours();
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 16) return "afternoon";
  if (h >= 16 && h < 21) return "evening";
  return "night";
}

export const fitsNow = (a: Attraction, part: DayPartNow) => a.bestAt.includes(part === "night" ? "morning" : part);

/** Urutan rekomendasi: yang cocok sekarang dulu, lalu yang lebih dekat. */
export function rankAttractions(list: Attraction[], part: DayPartNow) {
  return [...list].sort((a, b) => Number(fitsNow(b, part)) - Number(fitsNow(a, part)) || a.driveMin - b.driveMin);
}

export const mapsUrl = (a: Attraction) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.mapsQuery)}`;
