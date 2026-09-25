import React, { useMemo, useState } from "react";
import { Table2, BarChart3, ShieldCheck } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { useI18n } from "../../../i18n";
import { ALL_DEPARTMENTS, ServiceTicket } from "../../../types";
import { categoryKey, isEscalated, responseMinutes, resolutionMinutes, slaView } from "../../../lib/ticketView";
import { cn } from "../../../lib/cn";
import { Card, Segmented } from "../../../components/ui";
import { deptKey } from "../../guest/components";
import { Stat } from "./widgets";
import { isToday } from "../staffUtils";

type Datum = { label: string; value: number; display?: string; tone?: "warn" | "crit"; emphasis?: boolean };

/**
 * Grafik batang satu seri. Warna tidak membawa identitas — label yang
 * membawanya — jadi cukup satu tinta. Batang tertinggi (atau yang disorot)
 * memakai tinta penuh, sisanya abu-abu: bentuk "emphasis".
 */
function BarChart({ title, subtitle, data, orientation = "horizontal", unit, emphasizeMax, empty }: { title: string; subtitle?: string; data: Datum[]; orientation?: "horizontal" | "vertical"; unit?: string; emphasizeMax?: boolean; empty: string }) {
  const { t } = useI18n();
  const [asTable, setAsTable] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const maxIndex = data.findIndex((d) => d.value === max);
  const fill = (d: Datum, i: number) =>
    d.tone === "crit" ? "bg-crit" : d.tone === "warn" ? "bg-warn" : d.emphasis || (emphasizeMax && i === maxIndex) || !emphasizeMax ? "bg-fg" : "bg-line-strong";
  const allZero = data.every((d) => d.value === 0);

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          aria-pressed={asTable}
          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-muted hover:bg-sunken hover:text-fg"
        >
          {asTable ? <BarChart3 className="h-3.5 w-3.5" /> : <Table2 className="h-3.5 w-3.5" />}
          {asTable ? t("an.chart") : t("an.table")}
        </button>
      </div>

      <div className="flex-1 px-5 pb-5 pt-4">
        {allZero ? (
          <p className="py-8 text-center text-[0.8125rem] text-muted">{empty}</p>
        ) : asTable ? (
          <table className="w-full text-[0.8125rem]">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th scope="col" className="py-1.5 text-left font-medium">{t("an.item")}</th>
                <th scope="col" className="py-1.5 text-right font-medium">{t("an.value")}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.label} className="border-b border-line last:border-0">
                  <td className="py-1.5">{d.label}</td>
                  <td className="py-1.5 text-right tabular-nums">{d.display ?? `${d.value}${unit || ""}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : orientation === "horizontal" ? (
          <ul className="space-y-2.5" aria-label={title}>
            {data.map((d, i) => (
              <li key={d.label} className="relative" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                <div className="mb-1 flex items-baseline justify-between gap-3 text-[0.8125rem]">
                  <span className="truncate">{d.label}</span>
                  <span className="shrink-0 font-medium tabular-nums">{d.display ?? `${d.value}${unit || ""}`}</span>
                </div>
                <div className="h-3 w-full">
                  <div className={cn("h-full rounded-r-[4px] transition-[width] duration-500", fill(d, i), hover !== null && hover !== i && "opacity-60")} style={{ width: `${Math.max(d.value > 0 ? 2 : 0, (d.value / max) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div>
            <div className="relative flex h-40 items-end gap-[2px] border-b border-line" role="img" aria-label={`${title}: ${data.map((d) => `${d.label} ${d.display ?? d.value}`).join(", ")}`}>
              {data.map((d, i) => (
                <div
                  key={d.label}
                  className="group relative flex h-full flex-1 items-end justify-center"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                >
                  <div className={cn("w-full max-w-6 rounded-t-[4px] transition-[height] duration-500", fill(d, i), hover !== null && hover !== i && "opacity-60")} style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 2 : 0 }} />
                  {hover === i && (
                    <div className="pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-md border border-line bg-surface px-2 py-1 text-xs shadow-pop">
                      <span className="text-muted">{d.label}</span> · <span className="font-semibold tabular-nums">{d.display ?? d.value}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex gap-[2px]" aria-hidden>
              {data.map((d, i) => (
                <span key={d.label} className="flex-1 text-center text-[0.625rem] tabular-nums text-subtle">
                  {data.length > 12 ? (i % 3 === 0 ? d.label : "") : d.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

type Range = "today" | "all";

export function AnalyticsPage() {
  const { tickets, offerStats } = useApp();
  const { t } = useI18n();
  const [range, setRange] = useState<Range>("today");

  const a = useMemo(() => {
    const now = Date.now();
    // Tiket eskalasi adalah salinan tiket asal; tidak dihitung sebagai permintaan baru.
    const base: ServiceTicket[] = tickets.filter((x) => !x.parent_ticket && (range === "all" || isToday(x.sla.created_at)));
    const closed = base.filter((x) => ["SELESAI", "DIKONFIRMASI", "DITUTUP"].includes(x.status));
    const avg = (ns: number[]) => (ns.length ? Math.round(ns.reduce((p, n) => p + n, 0) / ns.length) : null);
    const responses = base.map(responseMinutes).filter((n): n is number => n !== null);
    const resolutions = closed.map(resolutionMinutes).filter((n): n is number => n !== null);
    const met = closed.filter((x) => slaView(x, now).state === "met").length;
    const scores = base.map((x) => x.guest_score).filter((n): n is number => Boolean(n));
    const escalations = tickets.filter((x) => (range === "all" || isToday(x.sla.created_at)) && isEscalated(x)).length;

    const byDept = ALL_DEPARTMENTS.map((d) => ({ label: t(deptKey(d)), value: base.filter((x) => x.dept === d || (d === "Food & Beverage" && x.category === "dining")).length })).sort((p, q) => q.value - p.value);

    const catCounts = new Map<string, number>();
    base.forEach((x) => {
      const k = x.category.startsWith("upsell_") ? "upsell_x" : x.category;
      catCounts.set(k, (catCounts.get(k) || 0) + 1);
    });
    const byCategory = Array.from(catCounts.entries())
      .map(([k, v]) => ({ label: t(categoryKey(k)), value: v }))
      .sort((p, q) => q.value - p.value);

    const hours = Array.from({ length: 24 }, (_, h) => ({ label: String(h).padStart(2, "0"), value: 0 }));
    base.forEach((x) => hours[new Date(x.sla.created_at).getHours()].value++);
    const firstHour = Math.max(0, hours.findIndex((h) => h.value > 0) - 1);
    const lastHour = Math.min(23, 23 - [...hours].reverse().findIndex((h) => h.value > 0) + 1);
    const peak = hours.slice(firstHour, Math.max(firstHour + 8, lastHour + 1));

    const complianceByDept = ALL_DEPARTMENTS.map((d) => {
      const c = closed.filter((x) => x.dept === d || (d === "Food & Beverage" && x.category === "dining"));
      const pct = c.length ? Math.round((c.filter((x) => slaView(x, now).state === "met").length / c.length) * 100) : 0;
      return { label: t(deptKey(d)), value: pct, display: c.length ? `${pct}%` : "—", tone: c.length && pct < 80 ? ("warn" as const) : undefined };
    });

    const ratingDist = [1, 2, 3, 4, 5].map((n) => ({ label: `${n}★`, value: scores.filter((s) => s === n).length, tone: n <= 2 ? ("crit" as const) : undefined }));

    return {
      total: base.length,
      avgResponse: avg(responses),
      avgResolution: avg(resolutions),
      compliance: closed.length ? Math.round((met / closed.length) * 100) : null,
      satisfaction: scores.length ? scores.reduce((p, n) => p + n, 0) / scores.length : null,
      ratings: scores.length,
      escalationRate: base.length ? Math.round((escalations / base.length) * 100) : 0,
      conversion: offerStats.shown ? Math.round((offerStats.accepted / offerStats.shown) * 100) : 0,
      byDept,
      byCategory: byCategory.slice(0, 6),
      peak,
      complianceByDept,
      ratingDist,
    };
  }, [tickets, range, offerStats, t]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label={t("an.range")}
          value={range}
          onChange={setRange}
          size="sm"
          options={[
            { value: "today", label: t("an.today") },
            { value: "all", label: t("an.allData") },
          ]}
        />
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <ShieldCheck className="h-3.5 w-3.5" />
          {t("an.anonymized")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t("an.total")} value={a.total} />
        <Stat label={t("an.avgResponse")} value={a.avgResponse === null ? "—" : t("time.min", { n: a.avgResponse })} />
        <Stat label={t("an.avgResolution")} value={a.avgResolution === null ? "—" : t("time.min", { n: a.avgResolution })} />
        <Stat label={t("an.compliance")} value={a.compliance === null ? "—" : `${a.compliance}%`} tone={a.compliance !== null && a.compliance < 80 ? "warn" : undefined} hint={t("an.target", { n: 80 })} />
        <Stat label={t("m.satisfaction")} value={a.satisfaction ? a.satisfaction.toFixed(1) : "—"} hint={t("m.fromRatings", { n: a.ratings })} />
        <Stat label={t("an.escalationRate")} value={`${a.escalationRate}%`} />
        <Stat label={t("an.upsell")} value={`${a.conversion}%`} hint={t("an.upsellHint", { a: offerStats.accepted, s: offerStats.shown })} />
        <Stat label={t("an.languages")} value={new Set(tickets.map((x) => x.originalLanguage)).size} hint={t("an.languagesHint")} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarChart title={t("an.byDept")} subtitle={t("an.byDeptHint")} data={a.byDept} empty={t("an.noData")} />
        <BarChart title={t("an.peakHours")} subtitle={t("an.peakHoursHint")} data={a.peak} orientation="vertical" emphasizeMax empty={t("an.noData")} />
        <BarChart title={t("an.topServices")} subtitle={t("an.topServicesHint")} data={a.byCategory} empty={t("an.noData")} />
        <BarChart title={t("an.complianceByDept")} subtitle={t("an.complianceHint")} data={a.complianceByDept} unit="%" empty={t("an.noData")} />
        <BarChart title={t("an.ratings")} subtitle={t("an.ratingsHint")} data={a.ratingDist} orientation="vertical" empty={t("an.noRatings")} />
      </div>
    </div>
  );
}
