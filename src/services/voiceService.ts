import { http } from "./http";

/**
 * Voice transcription service.
 *
 * 1. Pengenalan suara bawaan browser (Web Speech API) — nyata, tanpa API key,
 *    tersedia di Chrome/Edge/Safari.
 * 2. Transkripsi server (Gemini) — hanya bila GEMINI_API_KEY terpasang.
 *
 * Bila keduanya tidak tersedia, layanan ini jujur melapor tidak tersedia dan
 * tamu diminta mengetik. Tidak ada transkrip yang dikarang.
 */
export type TranscriptionOutcome =
  | { ok: true; text: string; source: "browser" | "server" }
  | { ok: false; reason: "no_api_key" | "model_unavailable" | "transcription_error" | "network" };

export const voiceService = {
  browserRecognitionSupported(): boolean {
    return typeof window !== "undefined" && Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  },

  microphoneSupported(): boolean {
    return typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== "undefined";
  },

  createRecognition(lang: string): any | null {
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) return null;
    const r = new Ctor();
    r.continuous = true;
    r.interimResults = true;
    r.lang = lang;
    return r;
  },

  async transcribeOnServer(blob: Blob, languageHint: string): Promise<TranscriptionOutcome> {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    try {
      const res = await http<{ success: boolean; text: string | null; reason?: string }>("/api/ai/transcribe-audio", {
        method: "POST",
        json: { audioBase64: base64, mimeType: blob.type || "audio/webm", languageHint },
        timeoutMs: 30000,
      });
      if (res.success && res.text) return { ok: true, text: res.text, source: "server" };
      return { ok: false, reason: (res.reason as any) || "transcription_error" };
    } catch {
      return { ok: false, reason: "network" };
    }
  },
};

/** Kode bahasa pengenalan suara untuk tiap locale aplikasi. */
export const SPEECH_LANG: Record<string, string> = {
  id: "id-ID", en: "en-US", ja: "ja-JP", ko: "ko-KR", zh: "zh-CN", ru: "ru-RU", fr: "fr-FR", de: "de-DE",
};
