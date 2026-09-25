import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, ShieldCheck } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { useI18n } from "../../../i18n";
import { LOCALE_META, Locale } from "../../../i18n/types";
import { isTicketClosed } from "../../../types";
import { guestNameFor, maskEmail, maskPhone } from "../../../lib/privacy";
import { Card, Input } from "../../../components/ui";
import { useDetailParams } from "../staffUtils";

/**
 * Tamu yang sedang menginap. Kontak selalu tersamar di daftar; membukanya
 * hanya lewat panel kamar, dan tindakan itu tercatat di log privasi.
 */
export function GuestsPage() {
  const { rooms, tickets, role } = useApp();
  const { t, locale } = useI18n();
  const [params] = useSearchParams();
  const { openRoom } = useDetailParams();
  const [q, setQ] = useState(params.get("q") || "");

  const guests = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rooms
      .filter((r) => r.guestName)
      .filter((r) => !query || r.guestName.toLowerCase().includes(query) || r.roomNumber.includes(query) || (r.nationality || "").toLowerCase().includes(query))
      .map((r) => {
        const mine = tickets.filter((x) => x.room === r.roomNumber && !x.parent_ticket);
        const scores = mine.map((x) => x.guest_score).filter(Boolean) as number[];
        return {
          room: r,
          open: mine.filter((x) => !isTicketClosed(x.status)).length,
          total: mine.length,
          score: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
        };
      })
      .sort((a, b) => a.room.roomNumber.localeCompare(b.room.roomNumber, undefined, { numeric: true }));
  }, [rooms, tickets, q]);

  const date = (iso?: string) => (iso ? new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short" }) : "—");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[0.8125rem] text-muted">
          <ShieldCheck className="h-4 w-4" />
          {t("guests.privacyNote")}
        </p>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("guests.search")} aria-label={t("guests.search")} className="h-9 pl-9" />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[0.8125rem]">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th scope="col" className="py-2.5 pl-4 pr-3 font-medium">{t("label.guest")}</th>
                <th scope="col" className="px-3 py-2.5 font-medium">{t("q.room")}</th>
                <th scope="col" className="px-3 py-2.5 font-medium">{t("a.language")}</th>
                <th scope="col" className="px-3 py-2.5 font-medium">{t("guests.stay")}</th>
                <th scope="col" className="px-3 py-2.5 font-medium">{t("tk.contact")}</th>
                <th scope="col" className="px-3 py-2.5 text-right font-medium">{t("guests.open")}</th>
                <th scope="col" className="py-2.5 pl-3 pr-4 text-right font-medium">{t("guests.rating")}</th>
              </tr>
            </thead>
            <tbody>
              {guests.map(({ room: r, open, score }) => (
                <tr key={r.roomNumber} tabIndex={0} onClick={() => openRoom(r.roomNumber)} onKeyDown={(e) => e.key === "Enter" && openRoom(r.roomNumber)} className="cursor-pointer border-b border-line last:border-0 hover:bg-sunken/60">
                  <td className="py-3 pl-4 pr-3">
                    <p className="font-medium">{guestNameFor(role, r.guestName)}</p>
                    <p className="text-xs text-muted">{r.nationality}</p>
                  </td>
                  <td className="px-3 py-3 font-medium tabular-nums">{r.roomNumber}</td>
                  <td className="px-3 py-3">{r.guestLocale ? LOCALE_META[r.guestLocale as Locale].nativeName : r.guestLanguage}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-muted">
                    {date(r.checkInDate)} – {date(r.checkOutDate)}
                  </td>
                  <td className="px-3 py-3 text-muted">
                    <span className="block tabular-nums">{maskPhone(r.guestPhone)}</span>
                    <span className="block text-xs">{maskEmail(r.guestEmail)}</span>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{open || <span className="text-subtle">0</span>}</td>
                  <td className="py-3 pl-3 pr-4 text-right tabular-nums">{score ? score.toFixed(1) : <span className="text-subtle">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="text-xs text-muted">{t("guests.count", { n: guests.length })}</p>
    </div>
  );
}
