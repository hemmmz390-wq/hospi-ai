import { getGeminiClient } from "./ai/geminiClassifier";

/**
 * Terjemahan pesan tamu ke bahasa Inggris untuk laporan staf.
 *
 * - Gemini bila GEMINI_API_KEY terpasang (paling akurat).
 * - Selain itu MyMemory (layanan terjemahan gratis, tanpa key, kuota harian
 *   terbatas). Pesan tamu dikirim ke layanan itu untuk diterjemahkan.
 *
 * Gagal menerjemahkan tidak pernah menghalangi tiket: laporan tetap memuat
 * pesan asli, terjemahan hanya ditambahkan bila berhasil.
 */

const MYMEMORY_LANG: Record<string, string> = { id: "id", ja: "ja", ko: "ko", zh: "zh-CN", ru: "ru", fr: "fr", de: "de" };
const cache = new Map<string, string>();
/** Alasan gagal terakhir (untuk diagnosa lewat /api/translate). */
export let lastTranslateError = "";

async function viaGemini(text: string, from: string): Promise<string | null> {
  const ai = getGeminiClient();
  if (!ai) return null;
  try {
    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Translate this hotel guest message from ${from} to natural English. Output only the translation.\n\n${text}`,
    });
    return (res.text || "").trim() || null;
  } catch {
    return null;
  }
}

async function viaMyMemory(text: string, from: string): Promise<string | null> {
  const src = MYMEMORY_LANG[from];
  if (!src) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    // Batas layanan sekitar 500 byte per permintaan.
    const q = text.slice(0, 450);
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${src}|en`, { signal: ctrl.signal });
    if (!res.ok) {
      console.warn("[translate] MyMemory HTTP", res.status);
      lastTranslateError = `http_${res.status}`;
      return null;
    }
    const json: any = await res.json();
    const out = String(json?.responseData?.translatedText || "").trim();
    // Saat kuota habis layanan mengembalikan pesan peringatan, bukan terjemahan.
    if (!out || json?.quotaFinished || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(out)) {
      console.warn("[translate] MyMemory menolak:", json?.responseStatus, json?.responseDetails || out.slice(0, 120));
      lastTranslateError = `rejected_${json?.responseStatus}: ${String(json?.responseDetails || out).slice(0, 120)}`;
      return null;
    }
    if (out === text.trim()) lastTranslateError = `same_as_source: status=${json?.responseStatus} match=${json?.responseData?.match} details=${String(json?.responseDetails || "").slice(0, 80)}`;
    return out;
  } catch (err) {
    console.warn("[translate] MyMemory gagal:", (err as Error)?.message);
    lastTranslateError = `error: ${(err as Error)?.message}`;
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Terjemahkan ke bahasa Inggris. `from` adalah kode bahasa aplikasi (id, ja, ko, zh, ru, fr, de). */
export async function translateToEnglish(text: string, from: string): Promise<string | null> {
  const clean = String(text || "").trim();
  if (!clean || from === "en") return null;
  lastTranslateError = "";
  const key = `${from}:${clean}`;
  const hit = cache.get(key);
  if (hit) return hit;
  let out = await viaGemini(clean, from);
  // Layanan gratis kadang mengembalikan teks asli atau gagal sesaat: coba sampai tiga kali.
  for (let attempt = 0; !out && attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 400 * attempt));
    const candidate = await viaMyMemory(clean, from);
    if (candidate && candidate.toLowerCase() !== clean.toLowerCase()) out = candidate;
  }
  if (out && out.toLowerCase() !== clean.toLowerCase()) {
    if (cache.size > 2000) cache.clear();
    cache.set(key, out);
    return out;
  }
  return null;
}
