/* Service worker HOSPI Staff: menampilkan notifikasi push dan membuka tiket
 * yang dimaksud saat notifikasi diketuk. Tidak menyimpan cache halaman, jadi
 * aplikasi selalu memuat versi terbaru. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// Penanda "bisa di-install" di beberapa browser: lewatkan semua permintaan ke jaringan.
self.addEventListener("fetch", () => {});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "HOSPI", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "HOSPI";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-96.png",
      tag: data.tag || undefined,
      renotify: Boolean(data.tag),
      requireInteraction: Boolean(data.urgent),
      vibrate: data.urgent ? [300, 120, 300, 120, 300] : [150],
      data: { url: data.url || "/staff" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/staff", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // Pakai jendela yang sudah terbuka di bagian yang sama (staf atau tamu) bila ada.
      const section = new URL(url).pathname.split("/")[1];
      const open = windows.find((w) => new URL(w.url).pathname.split("/")[1] === section);
      if (open) {
        await open.focus();
        return open.navigate(url);
      }
      return self.clients.openWindow(url);
    })()
  );
});
