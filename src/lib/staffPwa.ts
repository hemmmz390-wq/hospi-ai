import { useCallback, useEffect, useState } from "react";

/**
 * HOSPI Staff sebagai aplikasi yang bisa di-install (PWA) dan menerima
 * notifikasi push. Tamu tetap memakai web biasa lewat QR; semua yang ada di
 * sini hanya dipasang oleh aplikasi staf.
 */

const ENDPOINT_KEY = "hospi_push_endpoint_v1";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
let deferredInstall: InstallEvent | null = null;
const installListeners = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstall = e as InstallEvent;
    installListeners.forEach((fn) => fn());
  });
  window.addEventListener("appinstalled", () => {
    deferredInstall = null;
    installListeners.forEach((fn) => fn());
  });
}

/** Pasang manifest "HOSPI Staff" dan daftarkan service worker. Dipanggil sekali oleh StaffApp. */
export function setupStaffApp() {
  if (typeof document === "undefined") return;
  if (!document.querySelector('link[rel="manifest"]')) {
    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = "/staff.webmanifest";
    document.head.appendChild(link);
    const apple = document.createElement("link");
    apple.rel = "apple-touch-icon";
    apple.href = "/icons/apple-touch-icon.png";
    document.head.appendChild(apple);
    const title = document.createElement("meta");
    title.name = "apple-mobile-web-app-title";
    title.content = "HOSPI Staff";
    document.head.appendChild(title);
    const capable = document.createElement("meta");
    capable.name = "apple-mobile-web-app-capable";
    capable.content = "yes";
    document.head.appendChild(capable);
  }
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
}

export const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

export const isIos = () => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

/** Status pemasangan: bisa dipasang lewat tombol, sudah terpasang, atau perlu langkah manual (iPhone). */
export function useInstall() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    installListeners.add(fn);
    return () => {
      installListeners.delete(fn);
    };
  }, []);
  const install = useCallback(async () => {
    if (!deferredInstall) return false;
    await deferredInstall.prompt();
    const choice = await deferredInstall.userChoice;
    deferredInstall = null;
    installListeners.forEach((fn) => fn());
    return choice.outcome === "accepted";
  }, []);
  const state: "installed" | "available" | "ios" | "unavailable" = isStandalone() ? "installed" : deferredInstall ? "available" : isIos() ? "ios" : "unavailable";
  return { state, install };
}

// ---------------- Notifikasi push ----------------

export type PushState = "unsupported" | "server-off" | "denied" | "off" | "on" | "loading";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

const pushSupported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

/**
 * Langganan notifikasi untuk perangkat ini. Peran dan bahasa staf ikut
 * dikirim, sehingga HP Housekeeping hanya berbunyi untuk tugas Housekeeping,
 * dalam bahasa yang diatur Front Office.
 */
export function usePush(role: string, locale: string) {
  const [state, setState] = useState<PushState>("loading");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!pushSupported()) return setState("unsupported");
    try {
      const key = await fetch("/api/push/key").then((r) => r.json());
      if (!key.enabled) return setState("server-off");
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    } catch {
      setState("off");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Peran atau bahasa berganti (mis. lewat Ganti tampilan): perbarui langganan di server.
  useEffect(() => {
    if (state !== "on") return;
    (async () => {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) await post("/api/push/subscribe", { subscription: sub.toJSON(), role, locale }).catch(() => {});
    })();
  }, [state, role, locale]);

  const enable = useCallback(async () => {
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setState(permission === "denied" ? "denied" : "off");
      const { publicKey } = await fetch("/api/push/key").then((r) => r.json());
      const reg = (await navigator.serviceWorker.getRegistration("/")) || (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));
      await post("/api/push/subscribe", { subscription: sub.toJSON(), role, locale });
      try {
        localStorage.setItem(ENDPOINT_KEY, sub.endpoint);
      } catch {
        /* abaikan */
      }
      setState("on");
    } catch (err) {
      setError((err as Error)?.message || "error");
      setState("off");
    }
  }, [role, locale]);

  const disable = useCallback(async () => {
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await post("/api/push/unsubscribe", { endpoint: sub.endpoint }).catch(() => {});
      await sub.unsubscribe().catch(() => {});
    }
    setState("off");
  }, []);

  const test = useCallback(async () => {
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return false;
    const res = await post("/api/push/test", { endpoint: sub.endpoint }).catch(() => ({ ok: false }));
    return Boolean(res.ok);
  }, []);

  return { state, error, enable, disable, test };
}
