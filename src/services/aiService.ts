import { Department, Priority, UpsellOffer } from "../types";
import { http } from "./http";

/**
 * AIService (klien). Klasifikasi selalu dikerjakan server: server yang memilih
 * penyedia (Gemini bila API key ada, aturan bila tidak). Aplikasi hanya melihat
 * hasil yang bentuknya sama untuk kedua penyedia.
 */
export interface ClassificationResult {
  isDirectAnswer: boolean;
  category: string;
  taskTitle: string;
  quantity: number;
  confidence: number;
  assignedDepartment: Department;
  priority: Priority;
  translatedRequest: string;
  guestReply: string;
  isEmergency: boolean;
  isAngryComplaint: boolean;
  needsFoReview: boolean;
  detectedLanguage: string;
  offers: UpsellOffer[];
  needsHumanAgent: boolean;
  escalationReason?: "sentimen_komplain" | "darurat" | "kompleksitas_tinggi" | "permintaan_tamu";
  orderItems?: { menuId: string; qty: number }[];
  suggestFoodMenu?: boolean;
  lateCheckoutHour?: string;
  lateCheckoutFee?: number;
  bellboyService?: "luggage_help" | "luggage_pickup" | "escort" | "other";
}

export const aiService = {
  async classify(input: {
    message: string;
    roomNumber: string;
    guestName: string;
    guestLanguage: string;
    locale: string;
  }): Promise<{ source: "gemini" | "fallback_engine"; data: ClassificationResult }> {
    const res = await http<{ success: boolean; source: "gemini" | "fallback_engine"; data: ClassificationResult }>(
      "/api/ai/process",
      { method: "POST", json: input, timeoutMs: 20000 }
    );
    if (!res.success || !res.data) throw new Error("classification_failed");
    return { source: res.source, data: res.data };
  },
};
