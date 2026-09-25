import { UpsellOffer, UpsellCategory } from "../types";
import { indexOfKeyword } from "./menu";

/**
 * Katalog penawaran kontekstual (Contextual Upselling).
 *
 * `triggers` berisi kategori tiket atau kata kunci dari pesan tamu yang membuat
 * penawaran ini relevan. Penawaran TIDAK PERNAH ditampilkan saat tiket berstatus
 * darurat atau saat tamu sedang komplain — aturan itu dijaga di
 * `pickContextualOffers()` di bawah dan di sisi server.
 */
export const UPSELL_OFFERS: UpsellOffer[] = [
  {
    id: "off-tour-ubud",
    title: "Tur Budaya Ubud (Half-Day)",
    category: "tour",
    dept: "Front Office",
    description:
      "Pura Tirta Empul, terasering Tegallalang, dan galeri seni lokal. Termasuk sopir berbahasa Inggris.",
    price: 750000,
    formattedPrice: "Rp 750.000",
    durationLabel: "5 jam · jemput di lobi",
    posItemCode: "TOUR-UBUD-HD",
    triggers: ["explore", "attraction", "tour", "wisata", "jalan", "rekomendasi", "itinerary"],
  },
  {
    id: "off-tour-sunrise",
    title: "Sunrise Trekking Gunung Batur",
    category: "tour",
    dept: "Front Office",
    description:
      "Berangkat 02.00, sarapan di puncak. Cocok untuk tamu yang menginap lebih dari 2 malam.",
    price: 1100000,
    formattedPrice: "Rp 1.100.000",
    durationLabel: "8 jam · butuh konfirmasi H-1",
    posItemCode: "TOUR-BATUR-SR",
    triggers: ["tour", "wisata", "sunrise", "trekking", "explore"],
  },
  {
    id: "off-spa-massage",
    title: "Balinese Massage 90 Menit",
    category: "spa",
    dept: "Front Office",
    description:
      "Pijat tradisional di spa hotel atau langsung di kamar. Terapis wanita/pria dapat dipilih.",
    price: 480000,
    formattedPrice: "Rp 480.000",
    durationLabel: "90 menit · slot hari ini tersedia",
    posItemCode: "SPA-BAL-90",
    triggers: ["spa", "massage", "pijat", "lelah", "capek", "pegal", "relax", "tour", "wisata"],
  },
  {
    id: "off-spa-couple",
    title: "Couple Spa Ritual + Bunga Segar",
    category: "spa",
    dept: "Front Office",
    description: "Paket berdua: body scrub, flower bath, dan teh jahe hangat.",
    price: 1250000,
    formattedPrice: "Rp 1.250.000",
    durationLabel: "2 jam · perlu reservasi 3 jam sebelumnya",
    posItemCode: "SPA-COUPLE-RIT",
    triggers: ["spa", "massage", "pijat", "anniversary", "honeymoon", "romantic"],
  },
  {
    id: "off-transport-airport",
    title: "Antar Bandara Mobil Pribadi",
    category: "transport",
    dept: "Front Office",
    description: "Kendaraan ber-AC dengan sopir, dijadwalkan menyesuaikan jam checkout Anda.",
    price: 350000,
    formattedPrice: "Rp 350.000",
    durationLabel: "1 jam perjalanan · jemput di lobi",
    posItemCode: "TRF-APT-PRIV",
    triggers: ["billing_checkout", "checkout", "bandara", "airport", "transport", "taksi", "pulang"],
  },
  {
    id: "off-dining-dinner",
    title: "Set Dinner Tepi Kolam",
    category: "dining",
    dept: "Food & Beverage",
    description: "Menu 4 hidangan dengan pilihan seafood atau vegetarian, disajikan pukul 19.00.",
    price: 620000,
    formattedPrice: "Rp 620.000",
    durationLabel: "Pesan sebelum pukul 16.00",
    posItemCode: "FNB-SET-POOL",
    triggers: ["food", "dining", "restoran", "makan", "dinner", "lapar", "menu"],
  },
];

/** Kategori tiket yang TIDAK BOLEH disertai penawaran apa pun. */
const NO_OFFER_CATEGORIES = ["emergency", "complaint", "key_lock", "ac", "electricity", "plumbing", "tv_wifi"];

/**
 * Penawaran cadangan saat tidak ada trigger yang cocok.
 *
 * Banyak permintaan (handuk, linen, air mineral) tidak mengisyaratkan minat apa pun.
 * Tanpa daftar ini, memesan handuk tidak akan pernah memunculkan tawaran. Dua
 * layanan ini dipilih karena relevan untuk hampir semua tamu resor dan tidak
 * mengasumsikan rencana tertentu.
 */
const GENERAL_APPEAL_IDS = ["off-spa-massage", "off-tour-ubud"];

/**
 * Kategori tiket -> kategori penawaran yang TIDAK boleh disarankan setelahnya.
 * Menawarkan set dinner kepada tamu yang baru saja memesan makan malam, atau
 * late check-out kepada tamu yang baru saja mengajukannya, membuat asisten
 * terasa tidak menyimak.
 */
const REDUNDANT_AFTER: Record<string, UpsellCategory[]> = {
  dining: ["dining"],
  food: ["dining"],
  billing_checkout: ["room"],
  upsell_dining: ["dining"],
  upsell_room: ["room"],
  upsell_spa: ["spa"],
  upsell_tour: ["tour"],
  upsell_transport: ["transport"],
};

/**
 * Memilih maksimal `limit` penawaran yang relevan dengan konteks interaksi tamu.
 * Mengembalikan array kosong bila konteksnya tidak pantas untuk penawaran —
 * darurat, komplain, atau kerusakan yang sedang mengganggu kenyamanan tamu.
 */
export function pickContextualOffers(params: {
  category?: string;
  message?: string;
  isEmergency?: boolean;
  isAngryComplaint?: boolean;
  limit?: number;
  /** Kategori penawaran yang dikecualikan secara eksplisit oleh pemanggil. */
  exclude?: UpsellCategory[];
  /**
   * Bila tidak ada trigger yang cocok, tetap kembalikan penawaran umum.
   * Dipakai pada jalur pemesanan; dimatikan pada klasifikasi chat agar AI tidak
   * menyisipkan tawaran ke percakapan yang tidak ada kaitannya.
   */
  fallbackWhenNoMatch?: boolean;
}): UpsellOffer[] {
  const {
    category = "",
    message = "",
    isEmergency,
    isAngryComplaint,
    limit = 2,
    exclude = [],
    fallbackWhenNoMatch = false,
  } = params;

  if (isEmergency || isAngryComplaint) return [];
  if (NO_OFFER_CATEGORIES.includes(category)) return [];

  const blocked = new Set<UpsellCategory>([...(REDUNDANT_AFTER[category] || []), ...exclude]);

  const haystack = `${category} ${message}`.toLowerCase();

  const scored = UPSELL_OFFERS.filter((o) => !blocked.has(o.category)).map((offer) => {
    // Kata utuh: "late" tidak boleh cocok dengan "chocolate".
    const hits = offer.triggers.filter((t) => indexOfKeyword(haystack, t) !== -1).length;
    return { offer, hits };
  })
    .filter((s) => s.hits > 0)
    .sort((a, b) => b.hits - a.hits);

  if (scored.length > 0) return scored.slice(0, limit).map((s) => s.offer);

  if (!fallbackWhenNoMatch) return [];
  return UPSELL_OFFERS.filter(
    (o) => GENERAL_APPEAL_IDS.includes(o.id) && !blocked.has(o.category)
  ).slice(0, limit);
}
