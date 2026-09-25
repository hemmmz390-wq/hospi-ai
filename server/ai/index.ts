import { UPSELL_OFFERS, pickContextualOffers } from "../../src/data/upsellOffers";
import { Classification, ClassifyInput } from "./types";
import { classifyWithRules, COMPLAINT_WORDS, EMERGENCY_WORDS, HUMAN_WORDS } from "./ruleClassifier";
import { geminiClassifier, getGeminiClient } from "./geminiClassifier";
import { indexOfKeyword } from "../../src/data/menu";

export { normalizeLocale } from "./language";
export { getGeminiClient } from "./geminiClassifier";
export type { Classification, ClassifyInput } from "./types";

/**
 * AIService: satu pintu untuk klasifikasi permintaan tamu.
 *
 * - Gemini dipakai bila GEMINI_API_KEY terpasang.
 * - Selain itu, atau bila Gemini gagal, dipakai pengklasifikasi aturan.
 *
 * Penjaga keselamatan (darurat, komplain, permintaan manusia, penawaran) selalu
 * dijalankan di sini setelah klasifikasi, apa pun penyedianya. Model bahasa
 * tidak bisa menawar aturan ini.
 */
export const aiService = {
  provider(): "gemini" | "rules" {
    return getGeminiClient() ? "gemini" : "rules";
  },

  async classify(input: ClassifyInput): Promise<{ source: "gemini" | "fallback_engine"; data: Classification & { offers: typeof UPSELL_OFFERS } }> {
    let result: Classification;
    let source: "gemini" | "fallback_engine" = "fallback_engine";

    if (this.provider() === "gemini") {
      try {
        result = await geminiClassifier.classify(input);
        source = "gemini";
      } catch (err) {
        console.warn("[ai] Gemini unavailable, using rule-based classifier:", (err as Error)?.message);
        result = classifyWithRules(input);
      }
    } else {
      result = classifyWithRules(input);
    }

    return { source, data: applyGuards(result, input.message) };
  },
};

const mentions = (lower: string, words: string[]) => words.some((w) => indexOfKeyword(lower, w) !== -1);

function applyGuards(parsed: Classification, message: string) {
  const lower = message.toLowerCase();
  const isEmergency = parsed.isEmergency || mentions(lower, EMERGENCY_WORDS);
  const isAngry = !isEmergency && (parsed.isAngryComplaint || mentions(lower, COMPLAINT_WORDS));
  const wantsHuman = mentions(lower, HUMAN_WORDS);

  const out: Classification = { ...parsed };
  if (isEmergency) {
    out.isEmergency = true;
    out.priority = "EMERGENCY";
    out.category = "emergency";
    out.assignedDepartment = "Front Office";
    out.isDirectAnswer = false;
    delete out.orderItems;
  }
  if (isAngry) {
    out.isAngryComplaint = true;
    out.assignedDepartment = "Duty Manager";
    out.priority = "HIGH";
  }

  // Penawaran: id dari model divalidasi ke katalog; bila kosong dipakai
  // pencocokan aturan. Tidak ada penawaran sama sekali untuk tamu yang sedang
  // marah, dalam keadaan darurat, atau melaporkan sesuatu yang rusak.
  let offers = (parsed.suggestedOfferIds || [])
    .map((id) => UPSELL_OFFERS.find((o) => o.id === id))
    .filter((o): o is (typeof UPSELL_OFFERS)[number] => Boolean(o))
    .slice(0, 2);
  if (offers.length === 0) {
    offers = pickContextualOffers({ category: out.category, message, isEmergency, isAngryComplaint: isAngry });
  }
  const broken = ["ac", "electricity", "plumbing", "tv_wifi", "key_lock", "complaint", "emergency"].includes(out.category);
  if (isEmergency || isAngry || broken || out.orderItems) offers = [];

  const needsHumanAgent = Boolean(out.needsHumanAgent) || wantsHuman || isEmergency || isAngry;
  let escalationReason = out.escalationReason;
  if (isEmergency) escalationReason = "darurat";
  else if (isAngry) escalationReason = "sentimen_komplain";
  else if (wantsHuman) escalationReason = "permintaan_tamu";
  else if (needsHumanAgent && !escalationReason) escalationReason = "kompleksitas_tinggi";

  return {
    ...out,
    offers,
    suggestedOfferIds: offers.map((o) => o.id),
    needsHumanAgent,
    escalationReason: needsHumanAgent ? escalationReason : undefined,
  };
}
