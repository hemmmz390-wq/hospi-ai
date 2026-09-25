/**
 * Klien minimal untuk Upstash Redis lewat REST API (tanpa SDK).
 *
 * Aktif otomatis bila salah satu pasangan variabel ini terpasang di server:
 * - KV_REST_API_URL + KV_REST_API_TOKEN          (integrasi Upstash di Vercel)
 * - UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 *
 * Format REST Upstash: POST ke URL dengan body array perintah, mis.
 * ["HSET","key","field","value"], hasil {result}. Beberapa perintah sekaligus
 * lewat {URL}/pipeline dengan body array-of-array, hasil array of {result}.
 */
type Command = (string | number)[];

export interface RedisLike {
  command<T = unknown>(cmd: Command): Promise<T>;
  pipeline(cmds: Command[]): Promise<unknown[]>;
}

export function redisFromEnv(env = process.env): RedisLike | null {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return upstashRest(url.replace(/\/$/, ""), token);
}

export function upstashRest(url: string, token: string, fetchImpl: typeof fetch = fetch): RedisLike {
  const post = async (path: string, body: unknown) => {
    const res = await fetchImpl(`${url}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`redis ${res.status}`);
    return res.json();
  };
  return {
    async command<T>(cmd: Command) {
      const json = (await post("", cmd)) as { result?: T; error?: string };
      if (json.error) throw new Error(json.error);
      return json.result as T;
    },
    async pipeline(cmds: Command[]) {
      if (cmds.length === 0) return [];
      const json = (await post("/pipeline", cmds)) as { result?: unknown; error?: string }[];
      return json.map((r) => {
        if (r.error) throw new Error(r.error);
        return r.result;
      });
    },
  };
}
