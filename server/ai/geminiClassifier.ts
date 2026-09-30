import { GoogleGenAI, Type } from "@google/genai";
import { UPSELL_OFFERS } from "../../src/data/upsellOffers";
import { FOOD_MENU } from "../../src/data/menu";
import { SLA_ROUTING_CONFIG, slaConfigFor, LATE_CHECKOUT_OPTIONS } from "../../src/data/sla";
import { Classification, Classifier, ClassifyInput } from "./types";
import { normalizeLocale } from "./language";

/**
 * Pengklasifikasi Gemini. Hanya aktif bila GEMINI_API_KEY terpasang.
 * Model dicoba berurutan; bila semuanya gagal, pemanggil jatuh ke aturan.
 */

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite"];

let client: GoogleGenAI | null = null;
export function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

function buildPrompt(input: ClassifyInput) {
  const routing = Object.entries(SLA_ROUTING_CONFIG)
    .map(([key, c]) => `- "${key}" (${c.category}) -> ${c.dept}, priority ${c.priority}, SLA ${c.doneMin} min`)
    .join("\n");
  const menu = FOOD_MENU.map((m) => `- ${m.id} | ${m.name} | Rp ${m.price}`).join("\n");
  const offers = UPSELL_OFFERS.map((o) => `- ${o.id} | ${o.title} | relevant for: ${o.triggers.join(", ")}`).join("\n");
  const late = LATE_CHECKOUT_OPTIONS.filter((o) => o.fee > 0).map((o) => `${o.hour} (Rp ${o.fee})`).join(", ");

  return `You are the classification layer of a hotel service platform. Convert the guest message into one structured request.

Guest: ${input.guestName}, room ${input.roomNumber}. Profile language hint: ${input.languageHint}.
Message: "${input.message}"

CATEGORIES (use the key verbatim):
${routing}
- "faq" -> answer directly (Wi-Fi password "Hospi_Resort"/"azure2026", breakfast 06:30–10:30 at The Azure Pavilion level 1, checkout 12:00). isDirectAnswer: true.

RULES
- Emergencies (fire, smoke, medical, security): category "emergency", priority EMERGENCY, isEmergency true, needsHumanAgent true. Do not diagnose. guestReply tells the guest the Front Office and Duty Manager are alerted, and if in danger to leave the room and call ext. 0 or 112.
- Angry complaints: category "complaint", department "Duty Manager", isAngryComplaint true.
- Food: if the guest names dishes from the menu, return isDirectAnswer true, category "dining", and orderItems with menu ids and quantities. Never place the order yourself; the guest confirms it in the app. If they only say they are hungry, set suggestFoodMenu true.
- Several items for the same department (e.g. towels and a bottle of water) become ONE request for that department. Bottled water and amenities go to Housekeeping, not Food & Beverage.
- Late checkout: category "billing_checkout", lateCheckoutHour one of 13:00/14:00/15:00. Fees: ${late}. It is NOT approved yet; say it is pending approval.
- Luggage help: category "bellboy".
- Sightseeing, places to visit, things to do nearby: isDirectAnswer true, category "faq", suggestExplore true. guestReply says the Explore page lists nearby places and the hotel can arrange a car with a driver. Do not create a ticket.
- If unsure (confidence < 0.8): category "unclassified", department "Front Office", needsFoReview true.
- taskTitle: short English title, max 5 words.
- translatedRequest: clear operational instruction in Indonesian for hotel staff.
- guestReply: 1–2 calm sentences confirming what will happen and roughly when. No sales pitch.

LANGUAGE
- Reply in the language the guest actually wrote in (id, en, ja, ko, zh, ru, fr, de). Report it in detectedLanguage.
- translatedRequest stays Indonesian.

MENU
${menu}

OFFERS (suggestedOfferIds, max 2, only when relevant; never for complaints, emergencies or broken items)
${offers}

ESCALATION
- needsHumanAgent true when the guest asks for a person, is angry, has an emergency, or needs human judgement.
- escalationReason: "sentimen_komplain" | "darurat" | "kompleksitas_tinggi" | "permintaan_tamu".`;
}

const schema = {
  type: Type.OBJECT,
  properties: {
    isDirectAnswer: { type: Type.BOOLEAN },
    category: { type: Type.STRING },
    taskTitle: { type: Type.STRING },
    quantity: { type: Type.NUMBER },
    confidence: { type: Type.NUMBER },
    assignedDepartment: { type: Type.STRING, enum: ["Housekeeping", "Maintenance", "Front Office", "Duty Manager", "Food & Beverage"] },
    priority: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH", "EMERGENCY"] },
    translatedRequest: { type: Type.STRING },
    guestReply: { type: Type.STRING },
    isEmergency: { type: Type.BOOLEAN },
    isAngryComplaint: { type: Type.BOOLEAN },
    needsFoReview: { type: Type.BOOLEAN },
    suggestedOfferIds: { type: Type.ARRAY, items: { type: Type.STRING } },
    needsHumanAgent: { type: Type.BOOLEAN },
    detectedLanguage: { type: Type.STRING, enum: ["id", "en", "ja", "ko", "zh", "ru", "fr", "de"] },
    escalationReason: { type: Type.STRING, enum: ["sentimen_komplain", "darurat", "kompleksitas_tinggi", "permintaan_tamu"] },
    orderItems: {
      type: Type.ARRAY,
      items: { type: Type.OBJECT, properties: { menuId: { type: Type.STRING }, qty: { type: Type.NUMBER } }, required: ["menuId", "qty"] },
    },
    suggestFoodMenu: { type: Type.BOOLEAN },
    suggestExplore: { type: Type.BOOLEAN },
    lateCheckoutHour: { type: Type.STRING },
  },
  required: ["isDirectAnswer", "category", "taskTitle", "quantity", "confidence", "assignedDepartment", "priority", "translatedRequest", "guestReply", "detectedLanguage"],
};

export const geminiClassifier: Classifier = {
  name: "gemini",
  async classify(input) {
    const ai = getGeminiClient();
    if (!ai) throw new Error("GEMINI_API_KEY not configured");

    let lastErr: unknown;
    for (const model of MODELS) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: buildPrompt(input),
          config: { responseMimeType: "application/json", responseSchema: schema },
        });
        const parsed = JSON.parse(res.text || "{}");
        const sla = slaConfigFor(parsed.category || "unclassified");
        const menuIds = new Set(FOOD_MENU.map((m) => m.id));
        const late = LATE_CHECKOUT_OPTIONS.find((o) => o.hour === parsed.lateCheckoutHour);

        const out: Classification = {
          ...parsed,
          quantity: Number(parsed.quantity) || 1,
          confidence: Number(parsed.confidence) || 0.8,
          ackMin: sla.ackMin,
          doneMin: sla.doneMin,
          isEmergency: Boolean(parsed.isEmergency),
          isAngryComplaint: Boolean(parsed.isAngryComplaint),
          needsFoReview: Boolean(parsed.needsFoReview),
          detectedLanguage: normalizeLocale(parsed.detectedLanguage),
          // Id menu dari model divalidasi: item yang tidak ada di menu dibuang.
          orderItems: Array.isArray(parsed.orderItems)
            ? parsed.orderItems.filter((i: { menuId: string }) => menuIds.has(i.menuId))
            : undefined,
          lateCheckoutHour: late?.hour,
          lateCheckoutFee: late?.fee,
        };
        if (out.orderItems && out.orderItems.length === 0) delete out.orderItems;
        return out;
      } catch (err) {
        lastErr = err;
        console.warn(`[ai] ${model} unavailable, trying next model`);
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error("All Gemini models unavailable");
  },
};
