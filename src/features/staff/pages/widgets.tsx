import React from "react";
import { cn } from "../../../lib/cn";
import { Card } from "../../../components/ui";

/** Angka operasional besar. Warna hanya dipakai bila angkanya menandakan masalah. */
export function Stat({ label, value, hint, tone, onClick }: { label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: "crit" | "warn" | "ok"; onClick?: () => void }) {
  const body = (
    <>
      <p className="text-[0.8125rem] text-muted">{label}</p>
      <p className={cn("mt-1 text-[1.75rem] font-semibold leading-none tracking-tight", tone === "crit" ? "text-crit" : tone === "warn" ? "text-warn" : tone === "ok" ? "text-ok" : "text-fg")}>{value}</p>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="rounded-xl border border-line bg-surface p-4 text-left transition-colors hover:border-line-strong">
        {body}
      </button>
    );
  }
  return <Card className="p-4">{body}</Card>;
}

export function PanelHeader({ title, action, hint }: { title: React.ReactNode; action?: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold">{title}</h2>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

/** Batang horizontal sederhana: label, jumlah, dan porsi dari total. */
export function BarRow({ label, value, total, tone, onClick }: { label: string; value: number; total: number; tone?: "crit" | "warn" | "ok"; onClick?: () => void }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const inner = (
    <>
      <div className="flex items-baseline justify-between gap-3 text-[0.8125rem]">
        <span>{label}</span>
        <span className="font-medium tabular-nums">{value}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sunken">
        <div className={cn("h-full rounded-full", tone === "crit" ? "bg-crit" : tone === "warn" ? "bg-warn" : tone === "ok" ? "bg-ok" : "bg-fg")} style={{ width: `${pct}%` }} />
      </div>
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className="block w-full rounded-md text-left hover:opacity-80">
      {inner}
    </button>
  ) : (
    <div>{inner}</div>
  );
}
