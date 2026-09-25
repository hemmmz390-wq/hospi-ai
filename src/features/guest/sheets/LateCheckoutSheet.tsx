import React, { useEffect, useState } from "react";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { useI18n } from "../../../i18n";
import { LATE_CHECKOUT_OPTIONS, STANDARD_CHECKOUT } from "../../../data/sla";
import { Badge, Button, Field, Overlay, Textarea } from "../../../components/ui";
import { cn } from "../../../lib/cn";

/**
 * Late check-out tidak pernah disetujui otomatis. Permintaan masuk ke Front
 * Office sebagai tiket, dan tamu melihat statusnya: menunggu, disetujui, atau
 * ditolak.
 */
export function LateCheckoutSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { requestLateCheckout, lateCheckoutRequest } = useApp();
  const { t, formatCurrency } = useI18n();
  const [hour, setHour] = useState("14:00");
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (open) {
      setEditing(false);
      setReason("");
    }
  }, [open]);

  if (!open) return null;
  const req = lateCheckoutRequest;
  const showStatus = req && !editing && req.status !== "declined";
  const fee = LATE_CHECKOUT_OPTIONS.find((o) => o.hour === hour)?.fee || 0;

  return (
    <Overlay
      open
      onClose={onClose}
      title={t("g.late.title")}
      description={t("g.late.standard", { hour: STANDARD_CHECKOUT })}
      footer={
        showStatus ? (
          <Button variant="primary" onClick={onClose}>
            {t("a.done")}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            block
            disabled={sending}
            onClick={async () => {
              setSending(true);
              await requestLateCheckout(hour, reason.trim() || undefined);
              setSending(false);
              setEditing(false);
            }}
          >
            {sending ? t("a.sending") : t("g.late.submit")}
          </Button>
        )
      }
    >
      {showStatus && req ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-line p-4">
            {req.status === "approved" ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-ok" /> : <Clock className="mt-0.5 h-5 w-5 text-warn" />}
            <div>
              <p className="text-sm font-semibold">{t("g.late.until", { hour: req.hour })}</p>
              <p className="mt-0.5 text-[0.8125rem] text-muted">
                {req.fee > 0 ? t("g.late.fee", { fee: formatCurrency(req.fee) }) : t("g.late.noFee")}
              </p>
              <div className="mt-2">
                <Badge tone={req.status === "approved" ? "ok" : "warn"} dot>
                  {req.status === "approved" ? t("g.late.approved") : t("g.late.pending")}
                </Badge>
              </div>
            </div>
          </div>
          <p className="text-[0.8125rem] text-muted">{req.status === "approved" ? t("g.late.approvedBody") : t("g.late.pendingBody")}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {req?.status === "declined" && (
            <div className="flex items-start gap-2 rounded-lg bg-sunken p-3 text-[0.8125rem]">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
              <span>{t("g.late.declinedBody", { hour: req.hour })}</span>
            </div>
          )}
          <fieldset>
            <legend className="mb-2 text-[0.8125rem] font-medium">{t("g.late.pick")}</legend>
            <div className="grid grid-cols-2 gap-2">
              {LATE_CHECKOUT_OPTIONS.map((o) => {
                const standard = o.fee === 0;
                const on = hour === o.hour;
                return (
                  <button
                    key={o.hour}
                    type="button"
                    disabled={standard}
                    aria-pressed={on}
                    onClick={() => setHour(o.hour)}
                    className={cn(
                      "rounded-lg border p-3 text-left transition-colors disabled:cursor-default",
                      on ? "border-fg bg-fg text-inverse" : "border-line bg-surface hover:border-line-strong",
                      standard && "bg-sunken text-muted"
                    )}
                  >
                    <span className="block text-base font-semibold tabular-nums">{o.hour}</span>
                    <span className={cn("block text-xs", on ? "text-inverse/80" : "text-muted")}>{standard ? t("g.late.standardLabel") : `+ ${formatCurrency(o.fee)}`}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="rounded-lg bg-sunken p-3 text-[0.8125rem]">
            <p className="font-medium">{t("g.late.until", { hour })}</p>
            <p className="mt-0.5 text-muted">{t("g.late.fee", { fee: formatCurrency(fee) })} · {t("g.late.approvalNote")}</p>
          </div>
          <Field label={t("g.late.reason")} htmlFor="late-reason">
            <Textarea id="late-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("g.late.reasonPlaceholder")} className="min-h-[64px]" />
          </Field>
        </div>
      )}
    </Overlay>
  );
}
