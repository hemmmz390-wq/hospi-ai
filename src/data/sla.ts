import { SLAConfig } from "../types";

/**
 * Aturan SLA per kategori permintaan.
 *
 * ackMin  = batas waktu tiket harus diterima petugas.
 * doneMin = batas waktu tiket harus selesai.
 *
 * Nilai ini juga ditampilkan apa adanya di Settings → SLA rules, jadi satu
 * tempat ini adalah sumber kebenarannya.
 */
export const SLA_ROUTING_CONFIG: Record<string, SLAConfig> = {
  emergency: { category: "Emergency", dept: "Front Office", ackMin: 1, doneMin: 5, overflowTarget: "Duty Manager", priority: "EMERGENCY" },
  key_lock: { category: "Door lock / key card", dept: "Front Office", ackMin: 2, doneMin: 10, overflowTarget: "Duty Manager", priority: "HIGH" },
  ac: { category: "Air conditioning", dept: "Maintenance", ackMin: 3, doneMin: 20, overflowTarget: "Duty Manager", priority: "HIGH" },
  electricity: { category: "Electrical", dept: "Maintenance", ackMin: 3, doneMin: 30, overflowTarget: "Duty Manager", priority: "HIGH" },
  plumbing: { category: "Plumbing", dept: "Maintenance", ackMin: 3, doneMin: 30, overflowTarget: "Duty Manager", priority: "HIGH" },
  tv_wifi: { category: "TV & Wi-Fi", dept: "Maintenance", ackMin: 5, doneMin: 45, overflowTarget: "Front Office", priority: "MEDIUM" },
  complaint: { category: "Complaint", dept: "Duty Manager", ackMin: 2, doneMin: 30, overflowTarget: "Duty Manager", priority: "HIGH" },
  towel: { category: "Amenities", dept: "Housekeeping", ackMin: 2, doneMin: 15, overflowTarget: "Front Office", priority: "MEDIUM" },
  linen: { category: "Linen & pillows", dept: "Housekeeping", ackMin: 5, doneMin: 20, overflowTarget: "Front Office", priority: "MEDIUM" },
  cleaning: { category: "Room cleaning", dept: "Housekeeping", ackMin: 5, doneMin: 30, overflowTarget: "Front Office", priority: "MEDIUM" },
  dining: { category: "Food order", dept: "Food & Beverage", ackMin: 3, doneMin: 30, overflowTarget: "Front Office", priority: "MEDIUM" },
  bellboy: { category: "Bell service", dept: "Front Office", ackMin: 2, doneMin: 10, overflowTarget: "Front Office", priority: "MEDIUM" },
  billing_checkout: { category: "Late checkout", dept: "Front Office", ackMin: 2, doneMin: 15, overflowTarget: "Front Office", priority: "MEDIUM" },
  upsell: { category: "Service booking", dept: "Front Office", ackMin: 5, doneMin: 60, overflowTarget: "Front Office", priority: "LOW" },
  unclassified: { category: "General request", dept: "Front Office", ackMin: 2, doneMin: 20, overflowTarget: "Front Office", priority: "MEDIUM" },
};

export function slaConfigFor(category: string): SLAConfig {
  if (SLA_ROUTING_CONFIG[category]) return SLA_ROUTING_CONFIG[category];
  if (category.startsWith("upsell_")) return SLA_ROUTING_CONFIG.upsell;
  return SLA_ROUTING_CONFIG.unclassified;
}

/** Biaya late check-out per jam, dalam rupiah. 12:00 adalah jam check-out standar. */
export const LATE_CHECKOUT_OPTIONS: { hour: string; fee: number }[] = [
  { hour: "12:00", fee: 0 },
  { hour: "13:00", fee: 100000 },
  { hour: "14:00", fee: 150000 },
  { hour: "15:00", fee: 250000 },
];

export const STANDARD_CHECKOUT = "12:00";
