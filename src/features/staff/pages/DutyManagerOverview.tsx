import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ChevronRight, Star } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { useI18n, TranslationKey } from "../../../i18n";
import { ServiceTicket, isTicketClosed } from "../../../types";
import { useNow } from "../../../lib/clock";
import { isEscalated, slaView } from "../../../lib/ticketView";
import { guestNameFor } from "../../../lib/privacy";
import { Badge, Card, EmptyState, buttonClasses } from "../../../components/ui";
import { SlaTimer, StatusBadge } from "../../../components/domain";
import { byUrgency, useDetailParams } from "../staffUtils";
import { PanelHeader, Stat } from "./widgets";
import { deptKey } from "../../guest/components";

function Rows({ tickets, onOpen, right }: { tickets: ServiceTicket[]; onOpen: (id: string) => void; right?: (t: ServiceTicket) => React.ReactNode }) {
  const { t } = useI18n();
  return (
    <ul className="divide-y divide-line">
      {tickets.map((x) => (
        <li key={x.id}>
          <button type="button" onClick={() => onOpen(x.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-sunken/60">
            <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg bg-sunken text-[0.8125rem] font-semibold tabular-nums">{x.room}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.8125rem] font-medium">{x.taskTitle}</span>
              <span className="block truncate text-xs text-muted tabular-nums">
                {x.order?.id || x.id} · {t(deptKey(x.dept))}
              </span>
            </span>
            {right ? right(x) : <SlaTimer ticket={x} variant="cell" />}
            <ChevronRight className="h-4 w-4 shrink-0 text-subtle" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function Section({ title, hint, count, children, emptyTitle, emptyBody, tone }: { title: string; hint?: string; count: number; children: React.ReactNode; emptyTitle: string; emptyBody: string; tone?: "crit" | "warn" }) {
  return (
    <Card className="overflow-hidden">
      <PanelHeader
        title={
          <span className="flex items-center gap-2">
            {title}
            <Badge tone={count === 0 ? "muted" : tone || "neutral"}>{count}</Badge>
          </span>
        }
        hint={hint}
      />
      {count === 0 ? <EmptyState compact icon={<CheckCircle2 className="h-5 w-5" />} title={emptyTitle} body={emptyBody} /> : children}
    </Card>
  );
}

export function DutyManagerOverview() {
  const { tickets, escalations, role } = useApp();
  const { t } = useI18n();
  const now = useNow();
  const { openTicket } = useDetailParams();
  const tick = Math.floor(now / 10000);

  const d = useMemo(() => {
    const at = tick * 10000;
    const active = tickets.filter((x) => !isTicketClosed(x.status));
    const critical = active.filter((x) => x.priority === "EMERGENCY").sort(byUrgency(at));
    const escalated = active.filter((x) => isEscalated(x) || x.dept === "Duty Manager").sort(byUrgency(at));
    const breaches = active.filter((x) => x.status !== "DITUNDA" && slaView(x, at).state === "breached").sort(byUrgency(at));
    const lowRatings = tickets.filter((x) => !x.parent_ticket && (x.guest_score ? x.guest_score <= 2 : x.guest_rating === "thumbs_down")).sort((a, b) => b.sla.created_at.localeCompare(a.sla.created_at)).slice(0, 6);
    const delayed = active.filter((x) => x.status === "DITUNDA");
    const complaints = active.filter((x) => x.isAngryComplaint);
    const liveChats = escalations.filter((e) => e.status !== "selesai");
    return { critical, escalated, breaches, lowRatings, delayed, complaints, liveChats };
  }, [tickets, escalations, tick]);

  const parts: string[] = [];
  parts.push(t("dm.sum.escalations", { n: d.escalated.length }));
  if (d.critical.length) parts.push(t("dm.sum.critical", { n: d.critical.length }));
  parts.push(t("dm.sum.breaches", { n: d.breaches.length }));
  parts.push(t("dm.sum.ratings", { n: d.lowRatings.length }));

  const calm = d.escalated.length + d.critical.length + d.breaches.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[0.8125rem] text-muted">{t("dm.question")}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">{calm ? t("dm.calm") : parts.join(" · ")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat label={t("dm.escalations")} value={d.escalated.length} tone={d.escalated.length ? "warn" : undefined} />
        <Stat label={t("dm.critical")} value={d.critical.length} tone={d.critical.length ? "crit" : undefined} />
        <Stat label={t("m.breached")} value={d.breaches.length} tone={d.breaches.length ? "crit" : undefined} />
        <Stat label={t("dm.lowRatings")} value={d.lowRatings.length} />
        <Stat label={t("dm.delayed")} value={d.delayed.length} />
      </div>

      {d.critical.length > 0 && (
        <Section title={t("dm.criticalRequests")} count={d.critical.length} tone="crit" emptyTitle="" emptyBody="">
          <Rows tickets={d.critical} onOpen={openTicket} />
        </Section>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title={t("dm.escalationsComplaints")} hint={t("dm.escalationsHint")} count={d.escalated.length} tone="warn" emptyTitle={t("dm.noEscalations")} emptyBody={t("dm.noEscalationsBody")}>
          <Rows tickets={d.escalated} onOpen={openTicket} right={(x) => (x.guest_score ? <Badge tone="crit">{x.guest_score}/5</Badge> : <SlaTimer ticket={x} variant="cell" />)} />
        </Section>

        <Section title={t("dm.slaBreaches")} count={d.breaches.length} tone="crit" emptyTitle={t("dm.noBreaches")} emptyBody={t("dm.noBreachesBody")}>
          <Rows tickets={d.breaches.slice(0, 8)} onOpen={openTicket} />
        </Section>

        <Section title={t("dm.lowRatingsTitle")} hint={t("dm.lowRatingsHint")} count={d.lowRatings.length} emptyTitle={t("dm.noLowRatings")} emptyBody={t("dm.noLowRatingsBody")}>
          <ul className="divide-y divide-line">
            {d.lowRatings.map((x) => {
              const escalation = tickets.find((e) => e.parent_ticket === x.id);
              return (
                <li key={x.id}>
                  <button type="button" onClick={() => openTicket(escalation?.id || x.id)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-sunken/60">
                    <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg bg-sunken text-[0.8125rem] font-semibold tabular-nums">{x.room}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[0.8125rem] font-medium">{x.taskTitle}</span>
                        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-crit">
                          <Star className="h-3 w-3" fill="currentColor" />
                          {x.guest_score || 1}/5
                        </span>
                      </span>
                      {x.rating_comment && <span className="mt-0.5 block text-xs text-muted">“{x.rating_comment}”</span>}
                      <span className="mt-0.5 block text-xs text-subtle">{guestNameFor(role, x.guestName)}</span>
                    </span>
                    {escalation && <StatusBadge ticket={escalation} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section title={t("dm.delayedTitle")} count={d.delayed.length} emptyTitle={t("dm.noDelayed")} emptyBody={t("dm.noDelayedBody")}>
          <Rows tickets={d.delayed} onOpen={openTicket} right={(x) => <span className="max-w-[140px] truncate text-xs text-warn">{x.defer?.reason}</span>} />
        </Section>
      </div>

      {d.liveChats.length > 0 && (
        <Card className="overflow-hidden">
          <PanelHeader
            title={t("dm.guestsWaiting")}
            action={
              <Link to="/staff/conversations" className={buttonClasses("ghost", "sm")}>
                {t("a.open")}
              </Link>
            }
          />
          <ul className="divide-y divide-line">
            {d.liveChats.map((e) => (
              <li key={e.id}>
                <Link to={`/staff/conversations?chat=${e.room}`} className="flex items-center gap-3 px-4 py-3 hover:bg-sunken/60">
                  <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg bg-sunken text-[0.8125rem] font-semibold tabular-nums">{e.room}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8125rem] font-medium">{guestNameFor(role, e.guestName)}</span>
                    <span className="block truncate text-xs text-muted">{t(`esc.${e.reason}` as TranslationKey)}</span>
                  </span>
                  <Badge tone={e.status === "menunggu" ? "warn" : "neutral"} dot>
                    {e.status === "menunggu" ? t("conv.waiting") : t("conv.handling", { name: (e.agentName || "").split(" ")[0] })}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
