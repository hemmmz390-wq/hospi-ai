import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BedDouble, Ticket, Utensils, User } from "lucide-react";
import { createPortal } from "react-dom";
import { useApp } from "../../context/AppContext";
import { useI18n } from "../../i18n";
import { guestNameFor } from "../../lib/privacy";
import { cn } from "../../lib/cn";
import { Kbd } from "../../components/ui";
import { ticketsForRole } from "./staffUtils";

type Result = { key: string; group: "rooms" | "tickets" | "orders" | "guests"; label: string; sub: string; run: () => void };

/**
 * Pencarian global: nomor tiket, kamar, nama tamu, isi permintaan, dan nomor
 * pesanan. "508" menemukan Kamar 508, tiket-tiketnya, dan pesanannya sekaligus.
 */
export function GlobalSearch({ open, onClose, onOpenTicket, onOpenRoom }: { open: boolean; onClose: () => void; onOpenTicket: (id: string) => void; onOpenRoom: (no: string) => void }) {
  const { tickets, rooms, role } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    const scoped = ticketsForRole(tickets, role);
    const out: Result[] = [];

    rooms
      .filter((r) => r.roomNumber.includes(query) || (role !== "housekeeping" && role !== "maintenance" && role !== "food_beverage" && r.guestName.toLowerCase().includes(query)))
      .slice(0, 5)
      .forEach((r) =>
        out.push({
          key: `room-${r.roomNumber}`,
          group: "rooms",
          label: t("search.room", { room: r.roomNumber }),
          sub: r.guestName ? guestNameFor(role, r.guestName) : t("rooms.vacant"),
          run: () => onOpenRoom(r.roomNumber),
        })
      );

    scoped
      .filter(
        (x) =>
          x.id.toLowerCase().includes(query) ||
          x.room.includes(query) ||
          x.taskTitle.toLowerCase().includes(query) ||
          x.raw_text.toLowerCase().includes(query) ||
          (x.order?.id.toLowerCase().includes(query) ?? false) ||
          ((role === "front_office" || role === "duty_manager") && x.guestName.toLowerCase().includes(query))
      )
      .slice(0, 8)
      .forEach((x) =>
        out.push({
          key: `t-${x.id}`,
          group: x.order ? "orders" : "tickets",
          label: x.order ? `${x.order.id} · ${x.id}` : x.id,
          sub: `${t("search.room", { room: x.room })} · ${x.taskTitle}`,
          run: () => onOpenTicket(x.id),
        })
      );

    if (role === "front_office" || role === "duty_manager") {
      rooms
        .filter((r) => r.guestName && r.guestName.toLowerCase().includes(query))
        .slice(0, 4)
        .forEach((r) =>
          out.push({
            key: `g-${r.roomNumber}`,
            group: "guests",
            label: r.guestName,
            sub: t("search.room", { room: r.roomNumber }),
            run: () => navigate(`/staff/guests?q=${encodeURIComponent(r.guestName)}`),
          })
        );
    }
    return out;
  }, [q, tickets, rooms, role, t, onOpenRoom, onOpenTicket, navigate]);

  useEffect(() => setCursor(0), [q]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const pick = (r: Result) => {
    r.run();
    onClose();
  };

  const groups: { id: Result["group"]; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "rooms", label: t("search.rooms"), icon: BedDouble },
    { id: "tickets", label: t("search.tickets"), icon: Ticket },
    { id: "orders", label: t("search.orders"), icon: Utensils },
    { id: "guests", label: t("search.guests"), icon: User },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[65] flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 bg-black/40 animate-fade" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label={t("search.open")} className="relative w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface shadow-pop animate-enter">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => Math.min(results.length - 1, c + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => Math.max(0, c - 1));
              } else if (e.key === "Enter" && results[cursor]) {
                pick(results[cursor]);
              }
            }}
            placeholder={t("search.hint")}
            aria-label={t("search.placeholder")}
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="search-results"
            className="h-12 min-w-0 flex-1 bg-transparent text-sm placeholder:text-subtle focus:outline-none"
          />
          <Kbd>Esc</Kbd>
        </div>
        <div id="search-results" role="listbox" className="max-h-[50dvh] overflow-y-auto scroll-thin p-2">
          {!q.trim() ? (
            <p className="px-3 py-6 text-center text-[0.8125rem] text-muted">{t("search.empty")}</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-6 text-center text-[0.8125rem] text-muted">{t("search.noResults", { q })}</p>
          ) : (
            groups.map((g) => {
              const items = results.filter((r) => r.group === g.id);
              if (items.length === 0) return null;
              return (
                <div key={g.id} className="mb-1">
                  <p className="px-3 pb-1 pt-2 text-xs font-medium text-muted">{g.label}</p>
                  {items.map((r) => {
                    const i = results.indexOf(r);
                    return (
                      <button
                        key={r.key}
                        type="button"
                        role="option"
                        aria-selected={i === cursor}
                        onMouseEnter={() => setCursor(i)}
                        onClick={() => pick(r)}
                        className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left", i === cursor ? "bg-sunken" : "")}
                      >
                        <g.icon className="h-4 w-4 shrink-0 text-muted" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium tabular-nums">{r.label}</span>
                          <span className="block truncate text-[0.8125rem] text-muted">{r.sub}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
