/**
 * Entry point serverless untuk Vercel.
 *
 * Satu function menangani seluruh /api/*. Rewrite di vercel.json mengarahkan
 * setiap /api/... ke sini, dan Vercel mempertahankan URL asli pada request,
 * sehingga routing Express (/api/health, /api/ai/process, /api/pms/folio/:room)
 * tetap bekerja apa adanya.
 *
 * Mengimpor `_server.js` — bundel mandiri hasil esbuild dari server.ts — bukan
 * server.ts langsung, karena Vercel tidak menyertakan berkas di luar folder api/
 * ke dalam function (ERR_MODULE_NOT_FOUND). Awalan garis bawah membuat berkas
 * bundel itu sendiri tidak dianggap sebagai function.
 */
import app from "./_server.js";

export default app;
