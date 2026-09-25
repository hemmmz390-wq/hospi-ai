import React, { useMemo, useState } from "react";
import { CheckCircle2, Search } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { useI18n, TranslationKey } from "../../../i18n";
import { ServiceTicket, isTicketClosed } from "../../../types";
import { useNow } from "../../../lib/clock";
import { categoryKey, slaView } from "../../../lib/ticketView";
import { staffDisplayName } from "../../../data/staff";
import { cn } from "../../../lib/cn";
import { Button, Card, EmptyState, Input, Segmented } from "../../../components/ui";
import { CategoryIcon, EscalatedBadge, PriorityBadge, SlaTimer, StatusBadge } from "../../../components/domain";
import { byUrgency, isFresh, isToday, useDetailParams, useRoleTickets } from "../staffUtils";

type Kind = "housekeeping" | "maintenance";

const TYPES: Record<Kind, { value: string; label: TranslationKey; match: (t: ServiceTicket) => boolean }[]> = {
  housekeeping: [
    { value: "all", label: "tb.allTypes", match: () => true },
    { value: "amenities", label: "cat.towel", match: (t) => t.category === "towel" },
    { value: "cleaning", label: "cat.cleaning", match: (t) => t.category === "cleaning" },
    { value: "linen", label: "cat.linen", match: (t) => t.category === "linen" },
    { value: "delivery", label: "tb.delivery", match: (t) => t.category === "dining" },
  ],
  maintenance: [
    { value: "all", label: "tb.allTypes", match: () => true },
    { value: "ac", label: "cat.ac", match: (t) => t.category === "ac" },
    { value: "plumbing", label: "cat.plumbing", match: (t) => t.category === "plumbing" },
    { value: "electricity", label: "cat.electricity", match: (t) => t.category === "electricity" },
    { value: "tv_wifi", label: "cat.tv_wifi", match: (t) => t.category === "tv_wifi" },
    { value: "other", label: "tb.other", match: (t) => !["ac", "plumbing", "electricity", "tv_wifi"].includes(t.category) },
  ],
};

type StatusFilter = "open" | "new" | "working" | "waiting" | "done";

function TaskCard({ ticket, kind, onOpen }: { ticket: ServiceTicket; kind: Kind; onOpen: () => void }) {
  const { acceptTicket, startTicket, completeTicket, resumeTicket, currentStaff } = useApp();
  const { t } = useI18n();
  const now = useNow();
  const me = currentStaff?.name || "Staff";
  const isDelivery = ticket.category === "dining";
  const closed = isTicketClosed(ticket.status);

  let action: React.ReactNode = null;
  if (!closed) {
    if (isDelivery && ticket.status === "SIAP") action = <Button size="sm" variant="primary" onClick={() => completeTicket(ticket.id, me)}>{t("tk.markDelivered")}</Button>;
    else if (ticket.status === "BARU") action = <Button size="sm" variant="primary" onClick={() => acceptTicket(ticket.id, me)}>{t("tk.accept")}</Button>;
    else if (ticket.status === "DITERIMA" || ticket.status === "DIALIHKAN") action = <Button size="sm" variant="primary" onClick={() => startTicket(ticket.id, me)}>{t("tk.start")}</Button>;
    else if (ticket.status === "DIKERJAKAN") action = <Button size="sm" variant="primary" onClick={() => completeTicket(ticket.id, me)}>{kind === "maintenance" ? t("tk.resolve") : t("tk.complete")}</Button>;
    else if (ticket.status === "DITUNDA") action = <Button size="sm" variant="secondary" onClick={() => resumeTicket(ticket.id, me)}>{t("tk.resume")}</Button>;
  }

  return (
    <Card as="li" className={cn("flex flex-col p-4", isFresh(ticket, now) && "animate-flash", ticket.status === "DITUNDA" && "border-warn/40")}>
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-sunken">
          <span className="text-[0.625rem] font-medium uppercase text-muted">{t("label.room")}</span>
          <span className="text-sm font-semibold leading-none tabular-nums">{ticket.room}</span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <CategoryIcon category={ticket.category} className="h-3.5 w-3.5 text-muted" />
            <span className="truncate">{isDelivery ? t("tb.deliverOrder", { id: ticket.order?.id || ticket.id }) : ticket.taskTitle}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {t(categoryKey(ticket.category))}
            {ticket.qty > 1 && !isDelivery ? ` · ×${ticket.qty}` : ""}
            {` · ${ticket.id}`}
          </p>
        </div>
        <SlaTimer ticket={ticket} variant="cell" />
      </div>

      {ticket.status === "DITUNDA" && ticket.defer?.reason && (
        <p className="mt-3 rounded-md bg-warn-soft px-2.5 py-1.5 text-xs text-warn">
          {t("tk.waitingFor", { reason: ticket.defer.reason })}
          {ticket.defer.promised_at && ticket.defer.promised_at !== "—" ? ` · ${t("tk.promisedAt", { time: ticket.defer.promised_at })}` : ""}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <StatusBadge ticket={ticket} />
        <PriorityBadge priority={ticket.priority} quietWhenNormal />
        <EscalatedBadge ticket={ticket} />
        {ticket.assignedStaff && <span className="text-xs text-muted">· {staffDisplayName(ticket.assignedStaff)}</span>}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
        <Button size="sm" variant="ghost" onClick={onOpen}>
          {kind === "maintenance" && ticket.status === "DIKERJAKAN" ? t("tb.detailsHold") : t("tb.details")}
        </Button>
        {action}
      </div>
    </Card>
  );
}

/** Papan tugas harian untuk Housekeeping dan Maintenance. */
export function TaskBoard({ kind }: { kind: Kind }) {
  const { t } = useI18n();
  const now = useNow();
  const scoped = useRoleTickets();
  const { openTicket } = useDetailParams();
  const [status, setStatus] = useState<StatusFilter>("open");
  const [type, setType] = useState("all");
  const [highOnly, setHighOnly] = useState(false);
  const [q, setQ] = useState("");

  const tick = Math.floor(now / 10000);
  const all = useMemo(() => scoped.filter((x) => !x.parent_ticket), [scoped]);
  const open = all.filter((x) => !isTicketClosed(x.status));
  const dueSoon = open.filter((x) => ["at_risk", "breached"].includes(slaView(x, now).state)).length;

  const list = useMemo(() => {
    const matchType = TYPES[kind].find((x) => x.value === type)?.match || (() => true);
    return all
      .filter((x) => {
        if (status === "open") return !isTicketClosed(x.status);
        if (status === "new") return x.status === "BARU";
        if (status === "working") return ["DITERIMA", "DIKERJAKAN", "DIALIHKAN", "SIAP"].includes(x.status);
        if (status === "waiting") return x.status === "DITUNDA";
        return ["SELESAI", "DIKONFIRMASI"].includes(x.status) && isToday(x.sla.created_at);
      })
      .filter(matchType)
      .filter((x) => !highOnly || x.priority === "HIGH" || x.priority === "EMERGENCY")
      .filter((x) => !q.trim() || x.room.includes(q.trim()) || x.taskTitle.toLowerCase().includes(q.trim().toLowerCase()))
      .sort(byUrgency(tick * 10000));
  }, [all, status, type, highOnly, q, kind, tick]);

  const statusOptions: { value: StatusFilter; label: string; count?: number }[] = [
    { value: "open", label: t("tb.open"), count: open.length },
    { value: "new", label: t("st.new"), count: open.filter((x) => x.status === "BARU").length },
    { value: "working", label: t("st.in_progress") },
    ...(kind === "maintenance" ? [{ value: "waiting" as StatusFilter, label: t("st.waiting"), count: open.filter((x) => x.status === "DITUNDA").length }] : []),
    { value: "done", label: t("tb.doneToday") },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{t("tb.summary", { open: open.length })}</p>
          <p className="mt-0.5 text-[0.8125rem] text-muted">{dueSoon > 0 ? t("tb.dueSoon", { n: dueSoon }) : t("m.allWithinTarget")}</p>
        </div>
        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("tb.searchRoom")} aria-label={t("tb.searchRoom")} className="h-9 pl-9" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Segmented label={t("q.status")} value={status} onChange={setStatus} size="sm" options={statusOptions} />
        <Segmented label={t("tb.type")} value={type} onChange={setType} size="sm" options={TYPES[kind].map((x) => ({ value: x.value, label: t(x.label) }))} />
        <button
          type="button"
          aria-pressed={highOnly}
          onClick={() => setHighOnly((v) => !v)}
          className={cn("h-8 rounded-lg border px-3 text-xs font-medium transition-colors", highOnly ? "border-fg bg-fg text-inverse" : "border-line bg-surface text-muted hover:text-fg")}
        >
          {t("tb.highOnly")}
        </button>
      </div>

      {list.length === 0 ? (
        <Card>
          <EmptyState icon={<CheckCircle2 className="h-5 w-5" />} title={status === "open" ? t("tb.emptyTitle") : t("tb.emptyFiltered")} body={status === "open" ? t("tb.emptyBody") : undefined} />
        </Card>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {list.map((x) => (
            <TaskCard key={x.id} ticket={x} kind={kind} onOpen={() => openTicket(x.id)} />
          ))}
        </ul>
      )}
    </div>
  );
}
