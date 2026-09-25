import React, { useMemo } from "react";
import { useApp } from "../../../context/AppContext";
import { useI18n } from "../../../i18n";
import { ALL_DEPARTMENTS, isTicketClosed } from "../../../types";
import { STAFF } from "../../../data/staff";
import { useNow } from "../../../lib/clock";
import { responseMinutes, slaView } from "../../../lib/ticketView";
import { Avatar, Card } from "../../../components/ui";
import { deptKey } from "../../guest/components";
import { PanelHeader } from "./widgets";
import { cn } from "../../../lib/cn";

export function DepartmentsPage() {
  const { tickets } = useApp();
  const { t } = useI18n();
  const now = useNow();
  const tick = Math.floor(now / 15000);

  const rows = useMemo(() => {
    const at = tick * 15000;
    return ALL_DEPARTMENTS.map((dept) => {
      const mine = tickets.filter((x) => x.dept === dept);
      const open = mine.filter((x) => !isTicketClosed(x.status));
      const breached = open.filter((x) => x.status !== "DITUNDA" && slaView(x, at).state === "breached").length;
      const atRisk = open.filter((x) => slaView(x, at).state === "at_risk").length;
      const closed = mine.filter((x) => ["SELESAI", "DIKONFIRMASI", "DITUTUP"].includes(x.status));
      const met = closed.filter((x) => slaView(x, at).state === "met").length;
      const responses = mine.map(responseMinutes).filter((n): n is number => n !== null);
      return {
        dept,
        open: open.length,
        breached,
        atRisk,
        compliance: closed.length ? Math.round((met / closed.length) * 100) : null,
        avgResponse: responses.length ? Math.round(responses.reduce((a, b) => a + b, 0) / responses.length) : null,
        staff: STAFF.filter((s) => s.dept === dept),
      };
    });
  }, [tickets, tick]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {rows.map((r) => (
        <Card key={r.dept} className="overflow-hidden">
          <PanelHeader title={t(deptKey(r.dept))} hint={t("dept.onDuty", { n: r.staff.filter((s) => s.onDuty).length, total: r.staff.length })} />
          <dl className="grid grid-cols-4 divide-x divide-line border-b border-line">
            {[
              { k: t("dept.open"), v: r.open },
              { k: t("sla.breached"), v: r.breached, crit: r.breached > 0 },
              { k: t("dept.compliance"), v: r.compliance === null ? "—" : `${r.compliance}%` },
              { k: t("dept.avgResponse"), v: r.avgResponse === null ? "—" : t("time.min", { n: r.avgResponse }) },
            ].map((c) => (
              <div key={c.k} className="px-3 py-3">
                <dt className="truncate text-xs text-muted">{c.k}</dt>
                <dd className={cn("mt-1 text-lg font-semibold tabular-nums", c.crit && "text-crit")}>{c.v}</dd>
              </div>
            ))}
          </dl>
          <ul className="divide-y divide-line">
            {r.staff.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                <Avatar name={s.name} size={28} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.8125rem] font-medium">{s.name}</span>
                  <span className="block truncate text-xs text-muted">{s.area}</span>
                </span>
                <span className={cn("flex items-center gap-1.5 text-xs", s.onDuty ? "text-ok" : "text-subtle")}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", s.onDuty ? "bg-ok" : "bg-subtle")} />
                  {s.onDuty ? t("dept.onShift") : t("dept.offDuty")}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
