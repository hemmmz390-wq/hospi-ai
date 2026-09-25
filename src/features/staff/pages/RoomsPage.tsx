import React, { useMemo, useState } from "react";
import { useApp } from "../../../context/AppContext";
import { useI18n } from "../../../i18n";
import { RoomStatus, isTicketClosed } from "../../../types";
import { guestNameFor } from "../../../lib/privacy";
import { cn } from "../../../lib/cn";
import { Segmented } from "../../../components/ui";
import { ROOM_STATUS_META } from "../RoomDrawer";
import { useDetailParams } from "../staffUtils";

type Filter = "all" | "occupied" | "vacant" | "cleaning" | "maintenance" | "ready";

const GROUP: Record<RoomStatus, Filter> = {
  Occupied: "occupied",
  "Do Not Disturb": "occupied",
  Vacant: "vacant",
  "Needs Cleaning": "cleaning",
  "In Progress": "cleaning",
  Maintenance: "maintenance",
  Clean: "ready",
};

const STRIPE: Record<string, string> = {
  warn: "before:bg-warn",
  crit: "before:bg-crit",
  ok: "before:bg-ok",
  neutral: "before:bg-transparent",
  muted: "before:bg-transparent",
  strong: "before:bg-fg",
};

export function RoomsPage() {
  const { rooms, tickets, role } = useApp();
  const { t } = useI18n();
  const { openRoom } = useDetailParams();
  const [filter, setFilter] = useState<Filter>(role === "housekeeping" ? "cleaning" : "all");

  const openByRoom = useMemo(() => {
    const m = new Map<string, number>();
    for (const x of tickets) if (!isTicketClosed(x.status)) m.set(x.room, (m.get(x.room) || 0) + 1);
    return m;
  }, [tickets]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: rooms.length, occupied: 0, vacant: 0, cleaning: 0, maintenance: 0, ready: 0 };
    rooms.forEach((r) => c[GROUP[r.status]]++);
    return c;
  }, [rooms]);

  const floors = useMemo(() => {
    const visible = rooms.filter((r) => filter === "all" || GROUP[r.status] === filter);
    const map = new Map<number, typeof visible>();
    visible.forEach((r) => map.set(r.floor, [...(map.get(r.floor) || []), r]));
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [rooms, filter]);

  return (
    <div className="space-y-5">
      <Segmented
        label={t("nav.rooms")}
        value={filter}
        onChange={setFilter}
        size="sm"
        options={[
          { value: "all", label: t("a.all"), count: counts.all },
          { value: "occupied", label: t("rs.occupied"), count: counts.occupied },
          { value: "vacant", label: t("rs.vacant"), count: counts.vacant },
          { value: "cleaning", label: t("rs.cleaningGroup"), count: counts.cleaning },
          { value: "maintenance", label: t("rs.maintenance"), count: counts.maintenance },
          { value: "ready", label: t("rs.ready"), count: counts.ready },
        ]}
      />

      {floors.length === 0 && <p className="py-10 text-center text-sm text-muted">{t("rooms.noneInFilter")}</p>}

      {floors.map(([floor, list]) => (
        <section key={floor} aria-labelledby={`floor-${floor}`}>
          <h2 id={`floor-${floor}`} className="mb-2 text-xs font-medium text-muted">
            {t("rooms.floor", { n: floor })}
          </h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
            {list.map((r) => {
              const meta = ROOM_STATUS_META[r.status];
              const open = openByRoom.get(r.roomNumber) || 0;
              return (
                <li key={r.roomNumber}>
                  <button
                    type="button"
                    onClick={() => openRoom(r.roomNumber)}
                    className={cn(
                      "relative w-full overflow-hidden rounded-xl border border-line bg-surface p-3 text-left transition-colors hover:border-line-strong",
                      "before:absolute before:inset-y-0 before:left-0 before:w-1",
                      STRIPE[meta.tone]
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-base font-semibold tabular-nums">{r.roomNumber}</span>
                      {open > 0 && <span className="rounded-md bg-fg px-1.5 text-[0.6875rem] font-semibold tabular-nums text-inverse">{open}</span>}
                    </div>
                    <p className={cn("mt-1 text-xs font-medium", meta.tone === "crit" ? "text-crit" : meta.tone === "warn" ? "text-warn" : meta.tone === "ok" ? "text-ok" : "text-muted")}>{t(meta.key)}</p>
                    <p className="mt-0.5 truncate text-xs text-subtle">{r.guestName ? guestNameFor(role, r.guestName) : "—"}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
