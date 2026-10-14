import React, { useEffect, useRef } from "react";
import { BellRing, CheckCircle2 } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useI18n, TranslationKey } from "../../i18n";
import { Button, Card } from "../../components/ui";
import { usePush } from "../../lib/staffPwa";

/** Kartu "Kabari saya lewat notifikasi": HP tamu menerima kabar walau browser di latar belakang. */
export function GuestNotifyCard() {
  const { guest } = useApp();
  const { t, locale } = useI18n();
  const push = usePush("guest", locale, { room: guest.roomNumber, stay: guest.stayStartedAt || "" });
  // Browser tanpa dukungan push (mis. iPhone tanpa "Tambah ke Layar Utama"): kabar tetap ada di chat.
  if (push.state === "unsupported" || push.state === "server-off" || push.state === "loading") return null;
  return (
    <Card className="flex flex-wrap items-center gap-3 p-4">
      <BellRing className="h-5 w-5 shrink-0 text-muted" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{t("g.notify.title")}</p>
        <p className="text-[0.8125rem] text-muted">{push.state === "denied" ? t("g.notify.denied") : t("g.notify.hint")}</p>
      </div>
      {push.state === "off" && (
        <Button variant="primary" onClick={push.enable}>
          {t("g.notify.enable")}
        </Button>
      )}
      {push.state === "on" && (
        <span className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-ok">
          <CheckCircle2 className="h-4 w-4" />
          {t("g.notify.on")}
        </span>
      )}
    </Card>
  );
}

/**
 * Saat AI mengabari bahwa pekerjaan selesai (pesanan siap, kamar bersih,
 * perbaikan selesai), aplikasi tamu memunculkan pemberitahuan dan bergetar.
 * Bila tab sedang di latar belakang dan izin sudah diberikan, ditampilkan
 * sebagai notifikasi sistem.
 */
export function useGuestNoticeAlerts() {
  const { chatMessages, showToast } = useApp();
  const { t } = useI18n();
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    const notices = chatMessages.filter((m) => m.guestNotice);
    // Kabar yang sudah ada saat aplikasi dibuka tidak dimunculkan ulang.
    if (!seen.current) {
      seen.current = new Set(notices.map((m) => m.id));
      return;
    }
    for (const m of notices) {
      if (seen.current.has(m.id)) continue;
      seen.current.add(m.id);
      const text = t(`g.notice.${m.guestNotice!.kind}` as TranslationKey, m.guestNotice!.vars);
      showToast(text, "success");
      try {
        navigator.vibrate?.([120, 60, 120]);
      } catch {
        /* tidak didukung */
      }
      if (document.visibilityState === "hidden" && "Notification" in window && Notification.permission === "granted") {
        navigator.serviceWorker
          ?.getRegistration("/")
          .then((reg) => reg?.showNotification("Hospi Resort Bali", { body: text, icon: "/icons/icon-192.png", tag: m.id, data: { url: "/guest/chat" } }))
          .catch(() => {});
      }
    }
  }, [chatMessages, showToast, t]);
}
