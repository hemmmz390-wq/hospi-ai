/**
 * Pemanggil HTTP bersama untuk semua service. Satu tempat untuk timeout dan
 * penanganan galat, supaya layar tidak perlu tahu detail jaringan.
 */
export class ServiceError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

export async function http<T>(path: string, init: RequestInit & { json?: unknown; timeoutMs?: number } = {}): Promise<T> {
  const { json, timeoutMs = 15000, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(path, {
      ...rest,
      signal: controller.signal,
      headers: json !== undefined ? { "Content-Type": "application/json", ...(rest.headers || {}) } : rest.headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
    if (!res.ok) throw new ServiceError(`${path} responded ${res.status}`, res.status);
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ServiceError) throw err;
    throw new ServiceError((err as Error)?.name === "AbortError" ? `${path} timed out` : `${path} unreachable`);
  } finally {
    clearTimeout(timer);
  }
}

/** Kirim tanpa menunggu hasil. Dipakai untuk sinkronisasi yang boleh gagal. */
export function fireAndForget(path: string, init: RequestInit & { json?: unknown } = {}) {
  http(path, init).catch(() => {
    /* sinkronisasi opsional; state lokal tetap sumber kebenaran */
  });
}
