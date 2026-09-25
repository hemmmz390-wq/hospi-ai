import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { useI18n, TranslationKey } from "../../../i18n";
import { ServiceTicket } from "../../../types";
import { Button, Field, Overlay, Textarea } from "../../../components/ui";
import { cn } from "../../../lib/cn";

type Service = NonNullable<ServiceTicket["bellboy"]>["service"];
const OPTIONS: { id: Service; label: TranslationKey; hint: TranslationKey }[] = [
  { id: "luggage_help", label: "g.bell.help", hint: "g.bell.helpHint" },
  { id: "luggage_pickup", label: "g.bell.pickup", hint: "g.bell.pickupHint" },
  { id: "escort", label: "g.bell.escort", hint: "g.bell.escortHint" },
  { id: "other", label: "g.bell.other", hint: "g.bell.otherHint" },
];

export function BellboySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { requestBellboy } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [service, setService] = useState<Service>("luggage_help");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<ServiceTicket | null>(null);

  useEffect(() => {
    if (open) {
      setService("luggage_help");
      setNote("");
      setSent(null);
    }
  }, [open]);

  if (!open) return null;
  return (
    <Overlay
      open
      onClose={onClose}
      title={t("g.bell.title")}
      description={sent ? undefined : t("g.bell.subtitle")}
      footer={
        sent ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              {t("a.done")}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                navigate("/guest/requests");
              }}
            >
              {t("g.trackRequest")}
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            size="lg"
            block
            disabled={sending}
            onClick={async () => {
              setSending(true);
              setSent(await requestBellboy(service, note.trim() || undefined));
              setSending(false);
            }}
          >
            {sending ? t("a.sending") : t("g.bell.submit")}
          </Button>
        )
      }
    >
      {sent ? (
        <div className="flex flex-col items-center py-4 text-center animate-enter">
          <CheckCircle2 className="h-10 w-10 text-ok" />
          <p className="mt-3 text-base font-semibold">{t("g.bell.sent")}</p>
          <p className="mt-1 text-[0.8125rem] text-muted">{t("g.qr.sentBody", { id: sent.id, min: sent.sla.done_min })}</p>
        </div>
      ) : (
        <div className="space-y-5">
          <fieldset className="space-y-2">
            <legend className="sr-only">{t("g.bell.title")}</legend>
            {OPTIONS.map((o) => (
              <label key={o.id} className={cn("flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors", service === o.id ? "border-fg" : "border-line hover:border-line-strong")}>
                <input type="radio" name="bell" value={o.id} checked={service === o.id} onChange={() => setService(o.id)} className="mt-1 accent-[var(--fg)]" />
                <span>
                  <span className="block text-sm font-medium">{t(o.label)}</span>
                  <span className="block text-[0.8125rem] text-muted">{t(o.hint)}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <Field label={t("g.qr.note")} htmlFor="bell-note">
            <Textarea id="bell-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("g.bell.notePlaceholder")} className="min-h-[64px]" />
          </Field>
        </div>
      )}
    </Overlay>
  );
}
