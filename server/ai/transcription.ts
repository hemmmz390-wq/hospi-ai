import { getGeminiClient } from "./geminiClassifier";

/**
 * Transkripsi suara di server (Gemini multimodal).
 *
 * Aplikasi tamu lebih dulu memakai pengenalan suara bawaan browser. Jalur ini
 * hanya dipakai bila browser tidak menangkap teks apa pun. Tanpa API key,
 * jalur ini jujur gagal: transkrip karangan akan dikirim ke petugas sebagai
 * tugas nyata, jadi lebih baik tamu diminta mengetik.
 */
export type TranscriptionResult =
  | { success: true; text: string; source: "gemini_multimodal"; modelUsed: string }
  | { success: false; text: null; reason: "no_api_key" | "model_unavailable" | "transcription_error"; message: string };

const MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite"];

export async function transcribeAudio(audioBase64: string, mimeType: string, languageHint: string): Promise<TranscriptionResult> {
  const ai = getGeminiClient();
  if (!ai) {
    return { success: false, text: null, reason: "no_api_key", message: "Server-side voice transcription needs GEMINI_API_KEY." };
  }

  const prompt = `Transcribe the hotel guest's spoken request verbatim. Language context: ${languageHint}. Output only the spoken text, with no quotes or notes.`;
  for (const model of MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType, data: audioBase64.replace(/^data:[^;]+;base64,/, "") } },
              { text: prompt },
            ],
          },
        ],
      });
      const text = (res.text || "").trim();
      if (text) return { success: true, text, source: "gemini_multimodal", modelUsed: model };
    } catch {
      console.warn(`[voice] ${model} unavailable, trying next model`);
    }
  }
  return { success: false, text: null, reason: "model_unavailable", message: "Voice transcription is temporarily unavailable." };
}
