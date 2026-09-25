import React from "react";
import { ChevronRight } from "lucide-react";
import { useI18n } from "../../i18n";
import { ServiceTicket } from "../../types";
import { useNow } from "../../lib/clock";
import { staffDisplayName } from "../../data/staff";
import { displayId } from "../../lib/ticketView";
import { cn } from "../../lib/cn";
import { PriorityBadge, SlaTimer, StatusBadge, EscalatedBadge } from "../../components/domain";
import { deptKey } from "../guest/components";
import { isFresh } from "./staffUtils";

/**
 * Antrean tiket. Kolomnya mengikuti spesifikasi: Tiket, Kamar, Permintaan,
 * Departemen, Prioritas, Status, SLA, Petugas. Di layar sempit tabel berubah
 * menjadi daftar, bukan tabel yang harus digeser ke samping.
 */
export function TicketTable({ tickets, onOpen, showDept = true, empty }: { tickets: ServiceTicket[]; onOpen: (id: string) => void; showDept?: boolean; empty?: React.ReactNode }) {
  const { t } = useI18n();
  const now = useNow();

  if (tickets.length === 0) return <>{empty}</>;

  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-[0.8125rem]">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th scope="col" className="py-2.5 pl-4 pr-3 font-medium">{t("q.ticket")}</th>
              <th scope="col" className="px-3 py-2.5 font-medium">{t("q.room")}</th>
              <th scope="col" className="px-3 py-2.5 font-medium">{t("q.request")}</th>
              {showDept && <th scope="col" className="px-3 py-2.5 font-medium">{t("q.department")}</th>}
              <th scope="col" className="px-3 py-2.5 font-medium">{t("q.priority")}</th>
              <th scope="col" className="px-3 py-2.5 font-medium">{t("q.status")}</th>
              <th scope="col" className="px-3 py-2.5 font-medium">{t("q.sla")}</th>
              <th scope="col" className="py-2.5 pl-3 pr-4 font-medium">{t("q.assigned")}</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((x) => (
              <tr
                key={x.id}
                tabIndex={0}
                onClick={() => onOpen(x.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen(x.id))}
                className={cn("cursor-pointer border-b border-line last:border-0 hover:bg-sunken/60 focus-visible:bg-sunken", isFresh(x, now) && "animate-flash", x.isEmergency && "bg-crit-soft/50")}
              >
                <td className="whitespace-nowrap py-3 pl-4 pr-3 font-medium tabular-nums">{displayId(x)}</td>
                <td className="px-3 py-3 font-medium tabular-nums">{x.room}</td>
                <td className="max-w-[280px] px-3 py-3">
                  <span className="flex items-center gap-2">
                    <span className="truncate">{x.taskTitle}</span>
                    <EscalatedBadge ticket={x} />
                  </span>
                </td>
                {showDept && <td className="whitespace-nowrap px-3 py-3 text-muted">{t(deptKey(x.dept))}</td>}
                <td className="px-3 py-3"><PriorityBadge priority={x.priority} quietWhenNormal /></td>
                <td className="px-3 py-3"><StatusBadge ticket={x} /></td>
                <td className="px-3 py-3"><SlaTimer ticket={x} variant="cell" /></td>
                <td className="whitespace-nowrap py-3 pl-3 pr-4 text-muted">{staffDisplayName(x.assignedStaff || x.assignee) || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ponsel */}
      <ul className="divide-y divide-line md:hidden">
        {tickets.map((x) => (
          <li key={x.id}>
            <button type="button" onClick={() => onOpen(x.id)} className={cn("flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-sunken/60", isFresh(x, now) && "animate-flash")}>
              <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg bg-sunken text-[0.8125rem] font-semibold tabular-nums">{x.room}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{x.taskTitle}</span>
                  <SlaTimer ticket={x} variant="cell" />
                </span>
                <span className="mt-0.5 block text-xs text-muted tabular-nums">
                  {displayId(x)}
                  {showDept ? ` · ${t(deptKey(x.dept))}` : ""}
                  {x.assignedStaff ? ` · ${staffDisplayName(x.assignedStaff)}` : ""}
                </span>
                <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <StatusBadge ticket={x} />
                  {(x.priority === "HIGH" || x.priority === "EMERGENCY") && <PriorityBadge priority={x.priority} />}
                  <EscalatedBadge ticket={x} />
                </span>
              </span>
              <ChevronRight className="mt-2.5 h-4 w-4 shrink-0 text-subtle" />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
