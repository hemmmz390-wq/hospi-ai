import { FolioCharge, PmsConnection, PrivacyLogEntry } from "../types";
import { http } from "./http";

/**
 * PMSService, POSService, PrivacyService, SystemService.
 *
 * Semua integrasi PMS/POS saat ini adalah SIMULASI di server (lihat
 * `pmsAdapter` di server.ts). Bentuk request/response sudah final, jadi saat
 * PMS sungguhan disambungkan, hanya adapter server yang berubah.
 */

export const pmsService = {
  async connections(): Promise<PmsConnection[]> {
    const res = await http<{ success: boolean; data: PmsConnection[] }>("/api/integrations/status");
    return res.data || [];
  },
  async folio(room: string): Promise<FolioCharge[]> {
    const res = await http<{ success: boolean; data: FolioCharge[] }>(`/api/pms/folio/${encodeURIComponent(room)}`);
    return res.data || [];
  },
};

export const posService = {
  /** Posting tagihan ke folio kamar. */
  async charge(input: { room: string; description: string; itemCode: string; amount: number; ticketId?: string }): Promise<FolioCharge> {
    const res = await http<{ success: boolean; data: FolioCharge }>("/api/pos/order", { method: "POST", json: input });
    if (!res.success) throw new Error("pos_charge_failed");
    return res.data;
  },
};

export const privacyService = {
  async log(): Promise<PrivacyLogEntry[]> {
    const res = await http<{ success: boolean; data: PrivacyLogEntry[] }>("/api/privacy/log");
    return res.data || [];
  },
  async anonymize(room: string): Promise<{ affected: number }> {
    const res = await http<{ success: boolean; data: { affected: number } }>("/api/privacy/anonymize", { method: "POST", json: { room } });
    if (!res.success) throw new Error("anonymize_failed");
    return res.data;
  },
};

export const ticketSync = {
  /**
   * Server memeriksa permintaan ganda (kamar & kategori sama dalam 10 menit)
   * dan langsung membagikan tiket baru ke perangkat lain.
   */
  async create<T>(ticket: T): Promise<{ merged: boolean; data: T } | null> {
    try {
      return await http<{ merged: boolean; data: T }>("/api/tickets", { method: "POST", json: ticket, timeoutMs: 6000 });
    } catch {
      return null;
    }
  },
};

export interface SystemHealth {
  status: string;
  hasApiKey: boolean;
  aiProvider: "gemini" | "rules";
  integrations: { pms: string; pos: string; notifications: string; voice: string };
}

export const systemService = {
  async health(): Promise<SystemHealth | null> {
    try {
      return await http<SystemHealth>("/api/health", { timeoutMs: 6000 });
    } catch {
      return null;
    }
  },
};
