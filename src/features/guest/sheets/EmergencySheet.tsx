import React, { useEffect, useState } from "react";
import { Flame, HeartPulse, ShieldAlert, Siren, Phone, CheckCircle2 } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { useI18n, TranslationKey } from "../../../i18n";
import { ServiceTicket } from "../../../types";
import { Button, Field, Overlay, Textarea } from "../../../components/ui";
import { cn } from "../../../lib/cn";

type Kind = NonNullable<ServiceTicket["emergencyType"]>;
const KINDS: { id: Kind; icon: React.ComponentType<{ className?: string }>; label: TranslationKey }[] = [
  { id: "fire", icon: Flame, label: "g.em.fire" },
  { id: "medical", icon: HeartPulse, label: "g.em.medical" },
  { id: "security", icon: ShieldAlert, label: "g.em.security" },
  { id: "other", icon: Siren, label: "g.em.other" },
];

/**
 * Darurat. Prioritas tertinggi, dikirim ke Front Office dan Duty Manager.
 * Aplikasi tidak mencoba mendiagnosis; ia memberi instruksi keselamatan dan
 * nomor yang bisa langsung ditelepon.
 */
export function EmergencySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { reportEmergency } = useApp();
  const { t } = useI18n();
  const [kind, setKind] = useState<Kind | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<ServiceTicket | null>(null);

  useEffect(() => {
    if (open) {
      setKind(null);
      setNote("");
      setSent(null);
    }
  }, [open]);

  if (!open) return null;

  const callRow = (
    <div className="grid grid-cols-2 gap-2">
      <a href="tel:0" className="flex h-11 items-center justify-center gap-2 rounded-lg border border-line text-sm font-medium hover:bg-sunken">
        <Phone className="h-4 w-4" />
        {t("g.em.callDesk")}
      </a>
      <a href="tel:112" className="flex h-11 items-center justify-center gap-2 rounded-lg border border-line text-sm font-medium hover:bg-sunken">
        <Phone className="h-4 w-4" />
        {t("g.em.call112")}
      </a>
    </div>
  );

  return (
    <Overlay
      open
      tone="crit"
      onClose={onClose}
      title={sent ? t("g.em.sentTitle") : t("g.em.title")}
      description={sent ? undefined : t("g.em.subtitle")}
      footer={
        sent ? (
          <Button variant="primary" onClick={onClose}>
            {t("a.close")}
          </Button>
        ) : (
          <Button
            variant="danger"
            size="lg"
            block
            disabled={!kind || sending}
            onClick={async () => {
              if (!kind) return;
              setSending(true);
              setSent(await reportEmergency(kind, note.trim() || undefined));
              setSending(false);
            }}
          >
            {sending ? t("a.sending") : t("g.em.submit")}
          </Button>
        )
      }
    >
      {sent ? (
        <div className="space-y-4 animate-enter">
          <div className="flex items-start gap-3 rounded-lg bg-crit-soft p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-crit" />
            <div>
              <p className="text-sm font-semibold">{t("g.em.alerted")}</p>
              <p className="mt-0.5 text-[0.8125rem]">{t("g.em.ref", { id: sent.id })}</p>
            </div>
          </div>
          <div>
            <p className="text-[0.8125rem] font-medium">{t("g.em.whatNow")}</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[0.8125rem] text-muted">
              <li>{t("g.em.step1")}</li>
              {sent.emergencyType === "fire" && <li>{t("g.em.stepFire")}</li>}
              <li>{t("g.em.step2")}</li>
              <li>{t("g.em.step3")}</li>
            </ul>
          </div>
          {callRow}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("g.em.title")}>
            {KINDS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={kind === id}
                onClick={() => setKind(id)}
                className={cn(
                  "flex h-20 flex-col items-center justify-center gap-1.5 rounded-lg border text-sm font-medium transition-colors",
                  kind === id ? "border-crit bg-crit-soft text-crit" : "border-line hover:border-line-strong"
                )}
              >
                <Icon className="h-5 w-5" />
                {t(label)}
              </button>
            ))}
          </div>
          <Field label={t("g.em.detail")} htmlFor="em-note">
            <Textarea id="em-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("g.em.detailPlaceholder")} className="min-h-[64px]" />
          </Field>
          <div>
            <p className="mb-2 text-[0.8125rem] text-muted">{t("g.em.orCall")}</p>
            {callRow}
          </div>
        </div>
      )}
    </Overlay>
  );
}
