import React, { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useI18n, TranslationKey } from "../../i18n";
import { HotelRoom, RoomStatus, isTicketClosed } from "../../types";
import { LOCALE_META, Locale } from "../../i18n/types";
import { guestNameFor, maskPhone } from "../../lib/privacy";
import { categoryKey } from "../../lib/ticketView";
import { staffDisplayName } from "../../data/staff";
import { Badge, Button, Overlay } from "../../components/ui";
import { SlaTimer, StatusBadge } from "../../components/domain";
import { seesEverything } from "./staffUtils";
import type { Tone } from "../../lib/ticketView";

export const ROOM_STATUS_META: Record<RoomStatus, { key: TranslationKey; tone: Tone }> = {
  Occupied: { key: "rs.occupied", tone: "neutral" },
  "Do Not Disturb": { key: "rs.dnd", tone: "neutral" },
  Vacant: { key: "rs.vacant", tone: "muted" },
  "Needs Cleaning": { key: "rs.needsCleaning", tone: "warn" },
  "In Progress": { key: "rs.cleaning", tone: "neutral" },
  Clean: { key: "rs.ready", tone: "ok" },
  Maintenance: { key: "rs.maintenance", tone: "crit" },
};

const SETTABLE: Record<string, RoomStatus[]> = {
  housekeeping: ["Needs Cleaning", "In Progress", "Clean"],
  front_office: ["Occupied", "Vacant", "Needs Cleaning", "In Progress", "Clean", "Maintenance", "Do Not Disturb"],
  duty_manager: ["Occupied", "Vacant", "Needs Cleaning", "Clean", "Maintenance"],
  maintenance: ["Maintenance", "Needs Cleaning"],
};

export function RoomDrawer({ roomNo, onClose, onOpenTicket }: { roomNo: string | null; onClose: () => void; onOpenTicket: (id: string) => void }) {
  const { rooms, tickets, role, updateRoomStatus, currentStaff, logContactReveal } = useApp();
  const { t, locale } = useI18n();
  const [revealed, setRevealed] = useState(false);
  const room: HotelRoom | undefined = rooms.find((r) => r.roomNumber === roomNo);

  const roomTickets = useMemo(
    () => (room ? tickets.filter((x) => x.room === room.roomNumber).sort((a, b) => b.sla.created_at.localeCompare(a.sla.created_at)) : []),
    [room, tickets]
  );
  const timeline = useMemo(() => {
    const events = roomTickets.flatMap((x) =>
      x.timeline
        .filter((e) => ["dibuat", "diterima", "selesai", "ditunda", "dibatalkan", "komplain"].includes(e.ev))
        .map((e) => ({ ...e, ticket: x }))
    );
    return events.sort((a, b) => (b.ts || "").localeCompare(a.ts || "")).slice(0, 14);
  }, [roomTickets]);

  if (!roomNo) return null;
  if (!room) {
    return (
      <Overlay open variant="drawer" onClose={onClose} title={t("search.room", { room: roomNo })}>
        <p className="text-sm text-muted">{t("rooms.notFound")}</p>
      </Overlay>
    );
  }

  const active = roomTickets.filter((x) => !isTicketClosed(x.status));
  const meta = ROOM_STATUS_META[room.status];
  const settable = SETTABLE[role] || [];

  const eventLabel = (ev: string, category: string) => {
    const cat = t(categoryKey(category));
    if (ev === "dibuat") return t("rt.requested", { what: cat });
    if (ev === "diterima") return t("rt.accepted", { what: cat });
    if (ev === "selesai") return t("rt.completed", { what: cat });
    if (ev === "ditunda") return t("rt.onHold", { what: cat });
    if (ev === "dibatalkan") return t("rt.cancelled", { what: cat });
    return t("rt.escalated", { what: cat });
  };

  return (
    <Overlay open variant="drawer" onClose={onClose} title={t("search.room", { room: room.roomNumber })} description={`${room.roomType} · ${t("rooms.floor", { n: room.floor })}`}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={meta.tone} dot>
            {t(meta.key)}
          </Badge>
          {active.length > 0 && <Badge tone="neutral">{t("rooms.activeCount", { n: active.length })}</Badge>}
        </div>

        {room.guestName ? (
          <section className="rounded-lg border border-line p-4">
            <p className="text-xs text-muted">{t("label.guest")}</p>
            <p className="mt-1 text-base font-semibold">{guestNameFor(role, room.guestName)}</p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-[0.8125rem]">
              <div>
                <dt className="text-muted">{t("a.language")}</dt>
                <dd>{room.guestLocale ? LOCALE_META[room.guestLocale as Locale].nativeName : room.guestLanguage}</dd>
              </div>
              <div>
                <dt className="text-muted">{t("guests.stay")}</dt>
                <dd>
                  {room.checkInDate ? new Date(room.checkInDate).toLocaleDateString(locale, { day: "numeric", month: "short" }) : "—"} –{" "}
                  {room.checkOutDate ? new Date(room.checkOutDate).toLocaleDateString(locale, { day: "numeric", month: "short" }) : "—"}
                </dd>
              </div>
              {seesEverything(role) && (
                <div className="col-span-2">
                  <dt className="text-muted">{t("tk.contact")}</dt>
                  <dd>
                    {revealed ? (
                      room.guestPhone
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <span className="tabular-nums">{maskPhone(room.guestPhone)}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setRevealed(true);
                            logContactReveal(room.roomNumber, currentStaff?.name || "Staff");
                          }}
                          className="text-xs font-medium underline underline-offset-2"
                        >
                          {t("tk.reveal")}
                        </button>
                      </span>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        ) : (
          <p className="rounded-lg bg-sunken p-4 text-[0.8125rem] text-muted">{t("rooms.noGuest")}</p>
        )}

        {settable.length > 0 && (
          <section>
            <h3 className="mb-2 text-xs font-medium text-muted">{t("rooms.setStatus")}</h3>
            <div className="flex flex-wrap gap-2">
              {settable.map((s) => (
                <Button key={s} size="sm" variant={room.status === s ? "primary" : "secondary"} aria-pressed={room.status === s} onClick={() => updateRoomStatus(room.roomNumber, s)}>
                  {t(ROOM_STATUS_META[s].key)}
                </Button>
              ))}
            </div>
          </section>
        )}

        <section>
          <h3 className="mb-2 text-xs font-medium text-muted">{t("rooms.currentTickets")}</h3>
          {active.length === 0 ? (
            <p className="text-[0.8125rem] text-muted">{t("rooms.noActive")}</p>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line">
              {active.map((x) => (
                <li key={x.id}>
                  <button type="button" onClick={() => onOpenTicket(x.id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-sunken">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{x.taskTitle}</span>
                      <span className="text-xs tabular-nums text-muted">{x.order?.id || x.id}</span>
                    </span>
                    <StatusBadge ticket={x} />
                    <SlaTimer ticket={x} variant="cell" />
                    <ChevronRight className="h-4 w-4 text-subtle" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-xs font-medium text-muted">{t("rooms.timeline")}</h3>
          <ol className="space-y-2.5 border-l border-line pl-4">
            {timeline.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-line-strong" />
                <button type="button" onClick={() => onOpenTicket(e.ticket.id)} className="flex w-full items-baseline justify-between gap-3 text-left">
                  <span className="text-[0.8125rem]">
                    {eventLabel(e.ev, e.ticket.category)}
                    {e.ev !== "dibuat" && e.by !== "tamu" && e.by !== "bot" && <span className="text-muted"> · {staffDisplayName(e.by)}</span>}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-subtle">{e.at}</span>
                </button>
              </li>
            ))}
            {room.checkInDate && (
              <li className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-fg" />
                <p className="text-[0.8125rem]">
                  {t("rt.checkedIn")} <span className="text-muted">· {new Date(room.checkInDate).toLocaleDateString(locale, { day: "numeric", month: "short" })}</span>
                </p>
              </li>
            )}
          </ol>
        </section>
      </div>
    </Overlay>
  );
}
