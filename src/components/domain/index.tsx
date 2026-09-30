import React from "react";
import {
  AirVent,
  BedDouble,
  Briefcase,
  CalendarClock,
  CircleHelp,
  Droplets,
  KeyRound,
  MessageSquareWarning,
  Siren,
  Sparkles,
  Tv,
  Utensils,
  Zap,
  ShowerHead,
  ConciergeBell,
  Car,
} from "lucide-react";
import { ServiceTicket, Priority } from "../../types";
import { useI18n } from "../../i18n";
import { useNow } from "../../lib/clock";
import {
  formatCountdown,
  priorityKey,
  priorityTone,
  slaTone,
  slaView,
  staffStatusKey,
  statusTone,
  isEscalated,
} from "../../lib/ticketView";
import { Badge } from "../ui";
import { cn } from "../../lib/cn";

export function StatusBadge({ ticket }: { ticket: ServiceTicket }) {
  const { t } = useI18n();
  return (
    <Badge tone={statusTone(ticket.status)} dot>
      {t(staffStatusKey(ticket))}
    </Badge>
  );
}

export function PriorityBadge({ priority, quietWhenNormal }: { priority: Priority; quietWhenNormal?: boolean }) {
  const { t } = useI18n();
  if (quietWhenNormal && (priority === "MEDIUM" || priority === "LOW")) {
    return <span className="text-[0.8125rem] text-muted">{t(priorityKey(priority))}</span>;
  }
  return <Badge tone={priorityTone(priority)}>{t(priorityKey(priority))}</Badge>;
}

export function EscalatedBadge({ ticket }: { ticket: ServiceTicket }) {
  const { t } = useI18n();
  if (!isEscalated(ticket)) return null;
  return <Badge tone="warn">{t("tk.escalated")}</Badge>;
}

/**
 * Timer SLA yang berdetak. Merah hanya saat benar-benar lewat batas; kuning
 * saat tersisa kurang dari seperempat waktu. Selain itu netral.
 */
export function SlaTimer({ ticket, variant = "inline" }: { ticket: ServiceTicket; variant?: "inline" | "cell" | "block" }) {
  const { t } = useI18n();
  const now = useNow();
  const v = slaView(ticket, now);
  const tone = slaTone(v.state);
  const color = tone === "crit" ? "text-crit" : tone === "warn" ? "text-warn" : tone === "ok" ? "text-ok" : "text-fg";

  if (v.state === "none") return <span className="text-[0.8125rem] text-subtle">—</span>;

  if (v.state === "met" || v.state === "missed") {
    return <span className={cn("text-[0.8125rem]", v.state === "met" ? "text-ok" : "text-crit")}>{t(v.state === "met" ? "sla.met" : "sla.missed")}</span>;
  }

  if (variant === "block") {
    const pct = Math.min(100, Math.max(0, v.progress * 100));
    return (
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <span className={cn("text-xl font-semibold tabular-nums", color)}>{formatCountdown(v.remainingMs)}</span>
          <span className={cn("text-xs font-medium", color)}>{t(v.state === "breached" ? "sla.breached" : v.state === "at_risk" ? "sla.atRisk" : "sla.onTrack")}</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-sunken">
          <div className={cn("h-full rounded-full transition-[width] duration-1000", tone === "crit" ? "bg-crit" : tone === "warn" ? "bg-warn" : "bg-fg")} style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-muted">{t(v.state === "breached" ? "sla.overdueBy" : "sla.remaining", { time: formatCountdown(v.remainingMs) })}</p>
      </div>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap text-[0.8125rem] font-medium tabular-nums", color)} title={t(v.state === "breached" ? "sla.breached" : "sla.remaining", { time: formatCountdown(v.remainingMs) })}>
      {v.state === "breached" ? `−${formatCountdown(v.remainingMs)}` : formatCountdown(v.remainingMs)}
      {variant === "inline" && v.state === "breached" && <span className="font-semibold uppercase tracking-wide text-[0.6875rem]">{t("sla.breachedShort")}</span>}
    </span>
  );
}

const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  towel: Sparkles,
  cleaning: Sparkles,
  linen: BedDouble,
  ac: AirVent,
  electricity: Zap,
  plumbing: ShowerHead,
  tv_wifi: Tv,
  key_lock: KeyRound,
  billing_checkout: CalendarClock,
  complaint: MessageSquareWarning,
  emergency: Siren,
  dining: Utensils,
  bellboy: Briefcase,
  excursion: Car,
  unclassified: CircleHelp,
};

export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const Icon = category.startsWith("upsell_") ? ConciergeBell : category === "towel" ? Droplets : CATEGORY_ICON[category] || CircleHelp;
  return <Icon className={cn("h-4 w-4", className)} />;
}
