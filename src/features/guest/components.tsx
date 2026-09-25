import React, { useState } from "react";
import { ChevronRight, Star, Clock, PauseCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useI18n, TranslationKey } from "../../i18n";
import { ServiceTicket, isTicketClosed } from "../../types";
import { useNow } from "../../lib/clock";
import { guestStep, isOrder, minutesLeft, orderStep, slaView } from "../../lib/ticketView";
import { staffDisplayName } from "../../data/staff";
import { cn } from "../../lib/cn";
import { Badge, Button, Card, Overlay, Stepper, Textarea } from "../../components/ui";
import { CategoryIcon } from "../../components/domain";
import { guestTitle } from "./guestUtils";

export const deptKey = (dept: string) => `dp.${dept.replace(/[^A-Za-z]/g, "")}` as TranslationKey;

/** "Estimasi 8 menit", "Sebentar lagi", atau alasan menunggu. */
export function EtaLine({ ticket }: { ticket: ServiceTicket }) {
  const { t } = useI18n();
  const now = useNow();
  if (isTicketClosed(ticket.status)) return null;
  if (ticket.status === "DITUNDA") {
    return (
      <p className="flex items-center gap-1.5 text-[0.8125rem] text-warn">
        <PauseCircle className="h-3.5 w-3.5 shrink-0" />
        {ticket.defer?.promised_at && ticket.defer.promised_at !== "—"
          ? t("g.waitingReason", { reason: ticket.defer?.reason || "—", time: ticket.defer.promised_at })
          : ticket.defer?.reason || t("g.step.waiting")}
      </p>
    );
  }
  if (ticket.lateCheckout) {
    return <p className="text-[0.8125rem] text-muted">{t("g.pendingApproval")}</p>;
  }
  const v = slaView(ticket, now);
  return (
    <p className="flex items-center gap-1.5 text-[0.8125rem] text-muted">
      <Clock className="h-3.5 w-3.5 shrink-0" />
      {v.remainingMs > 60000 ? t("g.eta", { min: minutesLeft(v.remainingMs) }) : t("g.etaSoon")}
    </p>
  );
}

export function RequestProgress({ ticket, compact }: { ticket: ServiceTicket; compact?: boolean }) {
  const { t } = useI18n();
  if (ticket.status === "DIBATALKAN") return <Badge tone="muted">{t("st.cancelled")}</Badge>;
  if (isOrder(ticket)) {
    return (
      <Stepper
        compact={compact}
        current={orderStep(ticket)}
        tone={orderStep(ticket) === 3 ? "ok" : "neutral"}
        steps={[t("g.step.received"), t("g.step.preparing"), t("g.step.ready"), t("g.step.delivered")]}
      />
    );
  }
  const step = guestStep(ticket);
  return (
    <Stepper
      compact={compact}
      current={step}
      tone={ticket.status === "DITUNDA" ? "warn" : step === 2 ? "ok" : "neutral"}
      steps={[t("g.step.received"), ticket.status === "DITUNDA" ? t("g.step.waiting") : t("g.step.inProgress"), t("g.step.completed")]}
    />
  );
}

export function RequestCard({ ticket, onOpen }: { ticket: ServiceTicket; onOpen: () => void }) {
  const { t } = useI18n();
  return (
    <Card className="animate-enter">
      <button type="button" onClick={onOpen} className="block w-full rounded-xl p-4 text-left transition-colors hover:bg-sunken/60">
        <div className="flex items-start gap-3">
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", ticket.isEmergency ? "bg-crit-soft text-crit" : "bg-sunken text-fg")}>
            <CategoryIcon category={ticket.category} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-sm font-semibold">{guestTitle(t, ticket)}</p>
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
            </div>
            <p className="mt-0.5 text-[0.8125rem] text-muted">
              {t(deptKey(ticket.dept))} · {ticket.order?.id || ticket.id}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <RequestProgress ticket={ticket} compact />
        </div>
        <div className="mt-3">
          <EtaLine ticket={ticket} />
        </div>
      </button>
    </Card>
  );
}

export function StarRating({ value, onChange, size = "md" }: { value: number; onChange: (n: number) => void; size?: "md" | "lg" }) {
  const { t } = useI18n();
  return (
    <div role="radiogroup" aria-label={t("g.rate.label")} className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={t("g.rate.nOf5", { n })}
          onClick={() => onChange(n)}
          className={cn("flex items-center justify-center rounded-lg border transition-colors", size === "lg" ? "h-12 w-12" : "h-10 w-10", n <= value ? "border-fg bg-fg text-inverse" : "border-line bg-surface text-subtle hover:border-line-strong")}
        >
          <Star className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} fill={n <= value ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}

/** "Apakah permintaan Anda ditangani dengan baik?" — muncul setelah tiket selesai. */
export function RatingPanel({ ticket, onDone }: { ticket: ServiceTicket; onDone?: () => void }) {
  const { rateAndConfirmTicket } = useApp();
  const { t } = useI18n();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState<number | null>(null);

  if (sent !== null) {
    return (
      <div className="animate-enter">
        <p className="text-sm font-semibold">{t("g.rate.thanks")}</p>
        <p className="mt-1 text-[0.8125rem] text-muted">{sent <= 2 ? t("g.rate.lowFollowUp") : t("g.rate.thanksBody")}</p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-sm font-semibold">{t("g.rate.question")}</p>
      <p className="mt-0.5 text-[0.8125rem] text-muted">
        {ticket.completedAtTime ? t("g.rate.doneAt", { what: guestTitle(t, ticket), time: ticket.completedAtTime }) : guestTitle(t, ticket)}
      </p>
      <div className="mt-3">
        <StarRating value={score} onChange={setScore} />
      </div>
      {score > 0 && (
        <div className="mt-3 space-y-3 animate-enter">
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t("g.rate.commentPlaceholder")} aria-label={t("g.rate.comment")} className="min-h-[64px]" />
          <Button
            variant="primary"
            onClick={() => {
              rateAndConfirmTicket(ticket.id, score, comment.trim() || undefined);
              setSent(score);
              onDone?.();
            }}
          >
            {t("g.rate.submit")}
          </Button>
        </div>
      )}
    </div>
  );
}

const TIMELINE_KEYS: Record<string, TranslationKey> = {
  dibuat: "tl.dibuat",
  diterima: "tl.diterima",
  dikerjakan: "tl.dikerjakan",
  siap: "tl.siap",
  selesai: "tl.selesai",
  dikonfirmasi: "tl.dikonfirmasi",
  ditutup: "tl.ditutup",
  ditunda: "tl.ditunda",
  dilanjutkan: "tl.dilanjutkan",
  dialihkan: "tl.dialihkan",
  dibatalkan: "tl.dibatalkan",
  eskalasi: "tl.eskalasi",
  komplain: "tl.komplain",
};

/** Menerima id, bukan salinan tiket, supaya status di lembar ini selalu terkini. */
export function RequestDetailSheet({ ticketId, onClose }: { ticketId: string | null; onClose: () => void }) {
  const { cancelTicket, guest, tickets } = useApp();
  const ticket = ticketId ? tickets.find((x) => x.id === ticketId) || null : null;
  const { t, formatCurrency } = useI18n();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [ratedHere, setRatedHere] = useState<string | null>(null);
  if (!ticket) return null;

  const canCancel = ticket.status === "BARU" && !ticket.isEmergency;
  const awaitingRating = (ticket.status === "SELESAI" && !ticket.guest_score && !ticket.guest_rating) || ratedHere === ticket.id;

  return (
    <Overlay
      open
      onClose={() => {
        setConfirmCancel(false);
        onClose();
      }}
      title={guestTitle(t, ticket)}
      description={`${t(deptKey(ticket.dept))} · ${ticket.order?.id || ticket.id}`}
      footer={
        canCancel ? (
          confirmCancel ? (
            <>
              <span className="mr-auto text-[0.8125rem] text-muted">{t("g.cancelConfirm")}</span>
              <Button variant="ghost" size="sm" onClick={() => setConfirmCancel(false)}>
                {t("a.keep")}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  cancelTicket(ticket.id, "Cancelled by guest", guest.name);
                  setConfirmCancel(false);
                }}
              >
                {t("g.cancelRequest")}
              </Button>
            </>
          ) : (
            <Button variant="danger-outline" size="sm" onClick={() => setConfirmCancel(true)}>
              {t("g.cancelRequest")}
            </Button>
          )
        ) : undefined
      }
    >
      <div className="space-y-5">
        <RequestProgress ticket={ticket} />
        <EtaLine ticket={ticket} />

        {ticket.order ? (
          <div className="rounded-lg border border-line">
            <ul className="divide-y divide-line">
              {ticket.order.items.map((l) => (
                <li key={l.menuId} className="flex justify-between gap-3 px-3 py-2 text-sm">
                  <span>
                    <span className="tabular-nums text-muted">{l.qty}×</span> {l.name}
                  </span>
                  <span className="tabular-nums">{formatCurrency(l.qty * l.unitPrice)}</span>
                </li>
              ))}
            </ul>
            {ticket.order.notes && <p className="border-t border-line px-3 py-2 text-[0.8125rem] text-muted">“{ticket.order.notes}”</p>}
            <div className="flex justify-between border-t border-line px-3 py-2 text-sm font-semibold">
              <span>{t("g.food.total")}</span>
              <span className="tabular-nums">{formatCurrency(ticket.order.total)}</span>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs font-medium text-muted">{t("g.yourMessage")}</p>
            <p className="mt-1 text-sm">“{ticket.raw_text}”</p>
          </div>
        )}

        {awaitingRating && (
          <div className="rounded-lg border border-line p-4">
            <RatingPanel key={ticket.id} ticket={ticket} onDone={() => setRatedHere(ticket.id)} />
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-muted">{t("g.activity")}</p>
          <ol className="mt-2 space-y-3 border-l border-line pl-4">
            {ticket.timeline
              .filter((e) => e.ev !== "komplain" && e.ev !== "eskalasi")
              .map((e) => {
                const who = staffDisplayName(e.by);
                const isPerson = who && !["bot", "tamu", "Front Office", "Staff"].includes(e.by);
                return (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-line-strong" />
                    <p className="text-sm">
                      {t(TIMELINE_KEYS[e.ev] || "tl.dibuat")}
                      {isPerson && e.ev !== "dibuat" ? <span className="text-muted"> · {who.split(" ")[0]}</span> : null}
                    </p>
                    <p className="text-xs text-muted tabular-nums">{e.at}</p>
                  </li>
                );
              })}
          </ol>
        </div>
      </div>
    </Overlay>
  );
}
