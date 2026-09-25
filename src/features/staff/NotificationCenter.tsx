import React, { useMemo } from "react";
import { Bell, AlertTriangle, Siren, Star, Utensils, PauseCircle, Inbox, CircleDot } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useI18n, TranslationKey } from "../../i18n";
import { AppNotification } from "../../types";
import { cn } from "../../lib/cn";
import { EmptyState, Popover } from "../../components/ui";

const ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  sla_breach: AlertTriangle,
  emergency: Siren,
  rating: Star,
  order_ready: Utensils,
  defer: PauseCircle,
  new_ticket: CircleDot,
  reopened: Star,
};

const TITLE: Record<string, TranslationKey> = {
  sla_breach: "notif.slaBreach",
  emergency: "notif.emergency",
  rating: "notif.lowRating",
  order_ready: "notif.orderReady",
  defer: "notif.onHold",
  new_ticket: "notif.newRequest",
  reopened: "notif.lowRating",
};

export function relativeTime(iso: string, locale: string): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return iso;
  const diff = Math.round((time - Date.now()) / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (Math.abs(diff) < 60) return rtf.format(diff, "minute");
  return rtf.format(Math.round(diff / 60), "hour");
}

/** Notifikasi per peran: tiap departemen hanya melihat yang menyangkut dirinya. */
export function useRoleNotifications() {
  const { notifications, role } = useApp();
  return useMemo(() => notifications.filter((n) => n.targetRole === role || n.targetRole === "all"), [notifications, role]);
}

export function NotificationCenter({ onOpenTicket }: { onOpenTicket: (id: string) => void }) {
  const { markNotificationsRead } = useApp();
  const { t, locale } = useI18n();
  const list = useRoleNotifications();
  const unread = list.filter((n) => !n.read);

  const titleOf = (n: AppNotification) => (n.type && TITLE[n.type] ? t(TITLE[n.type]) : n.title);

  return (
    <Popover
      label={t("notif.title")}
      width={360}
      trigger={({ toggle, ref, ...aria }) => (
        <button ref={ref} type="button" onClick={toggle} {...aria} aria-label={t("notif.openWithCount", { n: unread.length })} className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-sunken">
          <Bell className="h-5 w-5" />
          {unread.length > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-crit px-1 text-[0.625rem] font-semibold tabular-nums text-white">{unread.length > 9 ? "9+" : unread.length}</span>
          )}
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold">{t("notif.title")}</p>
            {unread.length > 0 && (
              <button type="button" onClick={() => markNotificationsRead(list.map((n) => n.id))} className="text-[0.8125rem] font-medium text-muted hover:text-fg">
                {t("notif.markAll")}
              </button>
            )}
          </div>
          {list.length === 0 ? (
            <EmptyState compact icon={<Inbox className="h-5 w-5" />} title={t("notif.emptyTitle")} body={t("notif.emptyBody")} />
          ) : (
            <ul className="divide-y divide-line">
              {list.slice(0, 30).map((n) => {
                const Icon = (n.type && ICON[n.type]) || CircleDot;
                const critical = n.type === "emergency" || n.type === "sla_breach";
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => {
                        markNotificationsRead([n.id]);
                        if (n.ticketId) onOpenTicket(n.ticketId);
                        close();
                      }}
                      className={cn("flex w-full gap-3 px-4 py-3 text-left hover:bg-sunken", !n.read && "bg-sunken/50")}
                    >
                      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", critical ? "text-crit" : n.type === "rating" || n.type === "defer" ? "text-warn" : "text-muted")} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className={cn("truncate text-[0.8125rem]", !n.read ? "font-semibold" : "font-medium")}>{titleOf(n)}</span>
                          <span className="shrink-0 text-xs text-subtle">{relativeTime(n.timestamp, locale)}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-[0.8125rem] text-muted">{n.message}</span>
                      </span>
                      {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-fg" aria-label={t("notif.unread")} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </Popover>
  );
}
