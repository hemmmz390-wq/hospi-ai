import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { aiService, normalizeLocale } from "./server/ai";
import { transcribeAudio } from "./server/ai/transcription";
import { handleSync, syncStore, syncInstance, syncStoreKind } from "./server/sync";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "25mb" }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    // Dibaca halaman Settings → AI configuration dan indikator Demo mode.
    aiProvider: aiService.provider(),
    integrations: { pms: "simulation", pos: "simulation", notifications: "in_app", voice: "browser_speech_api" },
    syncInstance: syncInstance(),
    // "redis" = semua perangkat berbagi satu database; "memory" = cadangan.
    syncStore: syncStoreKind(),
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// Sync hub: satu salinan data untuk semua perangkat (lihat server/sync.ts)
// ============================================================

app.post("/api/sync", async (req, res) => {
  try {
    res.json(await handleSync(req.body || {}));
  } catch (error: any) {
    console.warn("[sync] failed:", error?.message);
    res.status(500).json({ error: "sync_failed" });
  }
});

// ============================================================
// Tickets REST API — membaca dan menulis ke sync hub yang sama.
// ============================================================

const OPEN = (t: any) => !["SELESAI", "DIKONFIRMASI", "DITUTUP", "DIBATALKAN"].includes(t.status);

app.get("/api/tickets", async (_req, res) => {
  res.json({ success: true, data: await syncStore.tickets() });
});

app.post("/api/tickets", async (req, res) => {
  const ticket = req.body;
  if (!ticket || !ticket.id) {
    return res.status(400).json({ error: "Invalid ticket object" });
  }

  // Permintaan yang sama dari kamar yang sama dalam 10 menit digabung ke tiket
  // yang sudah ada. Pesanan makanan dikecualikan: makan siang lalu pencuci
  // mulut adalah dua pesanan berbeda.
  const now = new Date();
  const all: any[] = await syncStore.tickets();
  const duplicate =
    ticket.category === "dining"
      ? undefined
      : all.find(
          (t: any) =>
            t.room === ticket.room &&
            t.category === ticket.category &&
            (ticket.category !== "excursion" || t.excursion?.placeId === ticket.excursion?.placeId) &&
            OPEN(t) &&
            now.getTime() - new Date(t.sla?.created_at || now).getTime() < 600000
        );

  if (duplicate) {
    const count = (duplicate.duplicateCount || 1) + 1;
    const merged = {
      ...duplicate,
      isDuplicate: true,
      duplicateCount: count,
      raw_text: `${duplicate.raw_text} | [${count}x] ${ticket.raw_text}`,
      timeline: [
        ...(duplicate.timeline || []),
        {
          id: `h-dup-${Date.now()}`,
          at: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          ts: now.toISOString(),
          ev: "dibuat",
          by: "tamu",
          note: `Requested again (${count}x) within 10 minutes`,
        },
      ],
    };
    await syncStore.putTicket(merged);
    return res.json({ success: true, data: merged, merged: true });
  }

  // Dua perangkat bisa memberi nomor yang sama sebelum sempat sinkron.
  // Server yang memutuskan: bila bentrok, pakai nomor berikutnya.
  const next = (prefix: string, ids: (string | undefined)[]) =>
    `${prefix}${Math.max(0, ...ids.filter((x): x is string => Boolean(x && x.startsWith(prefix))).map((x) => Number(x.slice(prefix.length)) || 0)) + 1}`;
  let fresh = ticket;
  const clash = all.find((x) => x.id === fresh.id);
  if (clash && clash.sla?.created_at !== fresh.sla?.created_at) {
    fresh = { ...fresh, id: next("HOS-", all.map((x) => x.id)) };
  }
  if (fresh.order && all.some((x) => x.order?.id === fresh.order.id && x.id !== fresh.id)) {
    fresh = { ...fresh, order: { ...fresh.order, id: next("ORD-", all.map((x) => x.order?.id)) } };
  }
  await syncStore.putTicket(fresh);
  return res.json({ success: true, data: fresh, merged: false });
});

app.patch("/api/tickets/:id", async (req, res) => {
  const existing = await syncStore.getTicket(req.params.id);
  if (!existing) return res.status(404).json({ error: "Ticket not found" });
  const updated = { ...existing, ...req.body };
  await syncStore.putTicket(updated);
  return res.json({ success: true, data: updated });
});

app.delete("/api/tickets/:id", async (req, res) => {
  // Tiket tidak pernah dihapus permanen, hanya dibatalkan.
  const existing = await syncStore.getTicket(req.params.id);
  if (!existing) return res.status(404).json({ error: "Ticket not found" });
  const updated = { ...existing, status: "DIBATALKAN" };
  await syncStore.putTicket(updated);
  return res.json({ success: true, data: updated });
});

// ============================================================
// AI: klasifikasi permintaan & transkripsi suara
//
// Seluruh logika ada di server/ai. Route di bawah hanya meneruskan.
// ============================================================

app.post("/api/ai/process", async (req, res) => {
  const { message, guestLanguage = "auto", guestName = "Guest", roomNumber = "", locale } = req.body || {};
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required" });
  }
  try {
    const { source, data } = await aiService.classify({
      message,
      roomNumber: String(roomNumber),
      guestName: String(guestName),
      guestLocale: normalizeLocale(locale || guestLanguage),
      languageHint: String(guestLanguage),
    });
    res.json({ success: true, source, data });
  } catch (error: any) {
    console.warn("[ai] classification failed:", error?.message);
    res.status(500).json({ success: false, error: "classification_failed" });
  }
});

app.post("/api/ai/transcribe-audio", async (req, res) => {
  const { audioBase64, mimeType = "audio/webm", languageHint = "id-ID" } = req.body || {};
  if (!audioBase64 || typeof audioBase64 !== "string") {
    return res.status(400).json({ error: "audioBase64 is required" });
  }
  try {
    res.json(await transcribeAudio(audioBase64, mimeType, languageHint));
  } catch (error: any) {
    console.warn("[voice] transcription error:", error?.message);
    res.json({ success: false, text: null, reason: "transcription_error", message: "Voice transcription failed." });
  }
});

// ============================================================
// PMS / POS Integration Layer (API-first)
//
// Endpoint di bawah ini adalah ADAPTER, bukan integrasi ke PMS sungguhan.
// Semua state disimpan di memori dan menirukan bentuk respons vendor PMS/POS
// (Oracle OPERA, Cloudbeds, dsb). Untuk menyambung ke properti nyata, ganti isi
// fungsi di dalam `pmsAdapter` dengan panggilan HTTP ke vendor — bentuk request
// dan response yang dipakai aplikasi tidak perlu berubah sama sekali.
// ============================================================

type FolioChargeRecord = {
  id: string;
  room: string;
  description: string;
  itemCode: string;
  amount: number;
  formattedAmount: string;
  postedAt: string;
  source: "POS" | "PMS";
  ticketId?: string;
};

const folioCharges: FolioChargeRecord[] = [];

const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

const pmsAdapter = {
  connections: [
    {
      // Simulasi. Tidak ada PMS sungguhan yang tersambung; ganti isi adapter
      // ini dengan panggilan ke vendor (OPERA, Cloudbeds, dsb.) saat siap.
      vendor: "PMS adapter",
      kind: "PMS" as const,
      status: "simulated" as const,
      endpoint: "simulation://pms",
      capabilities: ["reservation.read", "folio.post", "guest.profile", "checkout.status"],
    },
    {
      vendor: "POS adapter",
      kind: "POS" as const,
      status: "simulated" as const,
      endpoint: "simulation://pos",
      capabilities: ["order.create", "item.catalogue", "folio.transfer"],
    },
  ],

  getReservation(room: string) {
    return {
      room,
      confirmationNo: `RSV-${room}-2417`,
      simulated: true,
      checkOutTime: "12:00",
      balance: folioCharges
        .filter((c) => c.room === room)
        .reduce((sum, c) => sum + c.amount, 0),
      loyaltyTier: "Gold",
    };
  },

  postCharge(input: {
    room: string;
    description: string;
    itemCode: string;
    amount: number;
    source?: "POS" | "PMS";
    ticketId?: string;
  }): FolioChargeRecord {
    const charge: FolioChargeRecord = {
      id: `chg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      room: input.room,
      description: input.description,
      itemCode: input.itemCode,
      amount: input.amount,
      formattedAmount: rupiah(input.amount),
      postedAt: new Date().toISOString(),
      source: input.source || "POS",
      ticketId: input.ticketId,
    };
    folioCharges.unshift(charge);
    return charge;
  },
};

app.get("/api/integrations/status", (_req, res) => {
  res.json({
    success: true,
    data: pmsAdapter.connections.map((c) => ({
      ...c,
      lastSyncAt: new Date().toISOString(),
    })),
    mode: "simulation",
    note: "PMS and POS are simulated. Replace pmsAdapter to connect a real property system.",
  });
});

app.get("/api/pms/reservation/:room", (req, res) => {
  res.json({ success: true, data: pmsAdapter.getReservation(req.params.room) });
});

app.get("/api/pms/folio/:room", (req, res) => {
  res.json({
    success: true,
    data: folioCharges.filter((c) => c.room === req.params.room),
  });
});

app.post("/api/pos/order", (req, res) => {
  const { room, description, itemCode, amount, ticketId } = req.body || {};
  if (!room || !description || typeof amount !== "number") {
    return res
      .status(400)
      .json({ success: false, error: "room, description, dan amount wajib diisi" });
  }
  const charge = pmsAdapter.postCharge({
    room,
    description,
    itemCode: itemCode || "MISC",
    amount,
    source: "POS",
    ticketId,
  });
  res.json({ success: true, data: charge });
});

// ============================================================
// Data Privacy & Compliance
//
// Catatan jujur: ini BUKAN end-to-end encryption. Server harus membaca teks tamu
// untuk mengklasifikasikannya, jadi enkripsi ujung-ke-ujung sejati tidak mungkin
// digabung dengan klasifikasi AI di sisi server. Yang dijalankan di sini adalah
// redaksi PII sebelum data disimpan, dan penganoniman riwayat pasca-checkout.
// ============================================================

const privacyLog: Array<{
  id: string;
  at: string;
  action: string;
  scope: string;
  detail: string;
}> = [];

/** Menyamarkan email, nomor telepon, dan nomor kartu dari teks bebas tamu. */
function redactPii(text: string): { text: string; redactedCount: number } {
  let count = 0;
  const out = text
    .replace(/\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, () => {
      count++;
      return "[email disamarkan]";
    })
    .replace(/\b(?:\+62|62|0)8[1-9][0-9]{6,10}\b/g, () => {
      count++;
      return "[no. telepon disamarkan]";
    })
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, () => {
      count++;
      return "[no. kartu disamarkan]";
    });
  return { text: out, redactedCount: count };
}

app.post("/api/privacy/redact", (req, res) => {
  const { text = "" } = req.body || {};
  const result = redactPii(String(text));
  if (result.redactedCount > 0) {
    privacyLog.unshift({
      id: `pl-${Date.now()}`,
      at: new Date().toISOString(),
      action: "pii_redacted",
      scope: "chat_message",
      detail: `${result.redactedCount} data pribadi disamarkan sebelum disimpan.`,
    });
  }
  res.json({ success: true, data: result });
});

app.post("/api/privacy/anonymize", async (req, res) => {
  const { room } = req.body || {};
  if (!room) return res.status(400).json({ success: false, error: "room wajib diisi" });

  let affected = 0;
  for (const t of (await syncStore.tickets()) as any[]) {
    if (t.room !== room) continue;
    affected++;
    await syncStore.putTicket({
      ...t,
      guestName: "Anonymised guest",
      raw_text: "[anonymised after checkout]",
      originalRequest: undefined,
      anonymizedAt: new Date().toISOString(),
    });
  }

  const entry = {
    id: `pl-${Date.now()}`,
    at: new Date().toISOString(),
    action: "chat_anonymized",
    scope: `kamar ${room}`,
    detail: `${affected} tiket dianonimkan setelah checkout: nama tamu dan transkrip asli dihapus permanen.`,
  };
  privacyLog.unshift(entry);

  res.json({ success: true, data: { affected, entry } });
});

app.get("/api/privacy/log", (_req, res) => {
  res.json({ success: true, data: privacyLog });
});

async function startServer() {
  // Mode ditentukan oleh ADA-TIDAKNYA hasil build, bukan oleh NODE_ENV.
  // Sebagian host (termasuk Cloud Run lewat AI Studio) menjalankan `npm start`
  // tanpa menyetel NODE_ENV; kalau kita percaya variabel itu, server akan mencoba
  // menyalakan Vite di dalam container produksi dan gagal.
  const candidates = [
    path.join(process.cwd(), "dist"), // dijalankan dari root projek
    process.cwd(), // dijalankan dari dalam folder dist
  ];
  const distPath = candidates.find((dir) => fs.existsSync(path.join(dir, "index.html")));

  // Keberadaan folder dist saja tidak cukup: setelah sekali build, `npm run dev`
  // juga akan melihatnya dan menyajikan berkas basi. Pembedanya adalah CARA server
  // dijalankan — dev memakai tsx atas server.ts (ESM, __filename tidak ada),
  // produksi memakai bundel dist/server.cjs (CJS, __filename ada).
  const runningFromSource =
    typeof __filename === "undefined" || __filename.endsWith(".ts");
  const useDev = process.env.NODE_ENV === "development" || runningFromSource;

  if (distPath && !useDev) {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log(`Mode produksi: menyajikan berkas statis dari ${distPath}`);
  } else {
    // Impor dinamis: hanya dimuat saat benar-benar menjalankan dev server,
    // sehingga Vite tidak ikut terbundel ke serverless function di produksi.
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Mode pengembangan: Vite middleware aktif");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`HOSPI AI server running on http://0.0.0.0:${PORT}`);
  });
}

// Di Vercel, berkas ini di-import sebagai handler: Express dipanggil per-request
// dan TIDAK boleh membuka port sendiri. Di luar itu (lokal, Cloud Run, VPS),
// server dijalankan seperti biasa.
if (!process.env.VERCEL) {
  startServer();
}

export default app;
