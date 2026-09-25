import { Locale } from "../../src/i18n/types";

export type Department = "Housekeeping" | "Maintenance" | "Front Office" | "Duty Manager" | "Food & Beverage";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";
export type EscalationReason = "sentimen_komplain" | "darurat" | "kompleksitas_tinggi" | "permintaan_tamu";

export interface ClassifyInput {
  message: string;
  roomNumber: string;
  guestName: string;
  /** Bahasa antarmuka tamu; dipakai bila bahasa pesan tidak bisa ditebak. */
  guestLocale: Locale;
  /** Petunjuk bahasa dari profil tamu (mis. "Japanese"). */
  languageHint: string;
}

/**
 * Hasil klasifikasi. Bentuk ini adalah kontrak antara server dan aplikasi:
 * pengklasifikasi aturan maupun Gemini wajib mengembalikan bentuk yang sama.
 */
export interface Classification {
  isDirectAnswer: boolean;
  category: string;
  taskTitle: string;
  quantity: number;
  confidence: number;
  assignedDepartment: Department;
  priority: Priority;
  ackMin: number;
  doneMin: number;
  translatedRequest: string;
  guestReply: string;
  isEmergency: boolean;
  isAngryComplaint: boolean;
  needsFoReview: boolean;
  detectedLanguage: Locale;
  suggestedOfferIds?: string[];
  needsHumanAgent?: boolean;
  escalationReason?: EscalationReason;
  /** Draf pesanan makanan; hanya menjadi pesanan setelah tamu mengonfirmasi. */
  orderItems?: { menuId: string; qty: number }[];
  /** Tamu menyebut makanan tanpa item tertentu: arahkan ke menu. */
  suggestFoodMenu?: boolean;
  lateCheckoutHour?: string;
  lateCheckoutFee?: number;
  bellboyService?: "luggage_help" | "luggage_pickup" | "escort" | "other";
}

export interface Classifier {
  readonly name: "gemini" | "rules";
  classify(input: ClassifyInput): Promise<Classification>;
}
