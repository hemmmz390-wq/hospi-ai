import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Minus, Plus } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { useI18n, TranslationKey } from "../../../i18n";
import { slaConfigFor } from "../../../data/sla";
import { ServiceTicket } from "../../../types";
import { Button, Field, Overlay, Textarea } from "../../../components/ui";
import { cn } from "../../../lib/cn";
import { deptKey } from "../components";

export type QuickKind = "pillow" | "amenities" | "cleaning" | "ac" | "water";

type Option = { id: string; label: TranslationKey; staff: string; op: string };

/**
 * Permintaan cepat dari tombol di beranda. Tidak lewat AI: kategorinya sudah
 * jelas, jadi langsung menjadi tiket terstruktur untuk departemen yang tepat.
 */
const CONFIG: Record<QuickKind, { category: string; title: TranslationKey; quantity?: { unit: TranslationKey; max: number; start: number }; options?: Option[]; multi?: boolean; staffTitle: string }> = {
  pillow: { category: "linen", title: "g.qa.pillow", staffTitle: "Extra pillow", quantity: { unit: "g.unit.pillows", max: 4, start: 1 } },
  amenities: {
    category: "towel",
    title: "g.qa.amenities",
    staffTitle: "Amenities",
    multi: true,
    options: [
      { id: "towels", label: "g.am.towels", staff: "towels", op: "handuk" },
      { id: "toiletries", label: "g.am.toiletries", staff: "toiletries", op: "perlengkapan mandi" },
      { id: "tissues", label: "g.am.tissues", staff: "tissues", op: "tisu" },
      { id: "slippers", label: "g.am.slippers", staff: "slippers", op: "sandal kamar" },
      { id: "dental", label: "g.am.dental", staff: "dental kit", op: "sikat & pasta gigi" },
    ],
  },
  cleaning: {
    category: "cleaning",
    title: "g.qa.cleaning",
    staffTitle: "Room cleaning",
    options: [
      { id: "now", label: "g.clean.now", staff: "now", op: "sekarang" },
      { id: "out", label: "g.clean.whileOut", staff: "while guest is out", op: "saat tamu keluar" },
    ],
  },
  ac: {
    category: "ac",
    title: "g.qa.ac",
    staffTitle: "AC issue",
    options: [
      { id: "cooling", label: "g.ac.notCooling", staff: "AC not cooling", op: "AC tidak dingin" },
      { id: "leaking", label: "g.ac.leaking", staff: "AC leaking", op: "AC bocor" },
      { id: "noisy", label: "g.ac.noisy", staff: "AC making noise", op: "AC berisik" },
      { id: "other", label: "g.ac.other", staff: "AC issue", op: "masalah AC" },
    ],
  },
  water: { category: "towel", title: "g.qa.water", staffTitle: "Bottled water", quantity: { unit: "g.unit.bottles", max: 6, start: 2 } },
};

export function QuickRequestSheet({ kind, onClose }: { kind: QuickKind | null; onClose: () => void }) {
  const { createTicket, guest, suggestOffersAfterOrder } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<ServiceTicket | null>(null);

  useEffect(() => {
    if (!kind) return;
    const c = CONFIG[kind];
    setQty(c.quantity?.start || 1);
    setSelected(c.options && !c.multi ? [c.options[0].id] : c.multi ? ["towels"] : []);
    setNote("");
    setSent(null);
    setSending(false);
  }, [kind]);

  if (!kind) return null;
  const c = CONFIG[kind];
  const sla = slaConfigFor(c.category);
  const chosen = (c.options || []).filter((o) => selected.includes(o.id));
  const canSend = !c.options || chosen.length > 0;

  const submit = async () => {
    setSending(true);
    const qtyText = c.quantity ? ` ×${qty}` : "";
    const staffTitle = kind === "ac" ? chosen[0]?.staff || c.staffTitle : kind === "amenities" ? `Extra ${chosen.map((o) => o.staff).join(", ")}` : `${c.staffTitle}${qtyText}`;
    const guestText = [t(c.title), chosen.map((o) => t(o.label)).join(", "), c.quantity ? `${qty} ${t(c.quantity.unit)}` : "", note].filter(Boolean).join(" · ");
    const op = [
      kind === "water" ? `${qty} botol air mineral` : kind === "pillow" ? `${qty} bantal tambahan` : kind === "cleaning" ? `Make up room ${chosen[0]?.op || ""}` : kind === "ac" ? chosen[0]?.op : `Tambahan ${chosen.map((o) => o.op).join(", ")}`,
      `untuk Kamar ${guest.roomNumber}.`,
      note ? `Catatan tamu: "${note}"` : "",
    ].filter(Boolean).join(" ");
    const ticket = await createTicket({
      room: guest.roomNumber,
      guestName: guest.name,
      channel: "qr_web",
      raw_text: guestText,
      category: c.category,
      taskTitle: staffTitle,
      qty: c.quantity ? qty : 1,
      translatedRequest: op,
    });
    setSending(false);
    setSent(ticket);
    suggestOffersAfterOrder(ticket);
  };

  return (
    <Overlay
      open
      onClose={onClose}
      title={t(c.title)}
      description={sent ? undefined : t("g.qr.eta", { dept: t(deptKey(sla.dept)), min: sla.doneMin })}
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
          <Button variant="primary" size="lg" block onClick={submit} disabled={!canSend || sending}>
            {sending ? t("a.sending") : t("g.sendRequest")}
          </Button>
        )
      }
    >
      {sent ? (
        <div className="flex flex-col items-center py-4 text-center animate-enter">
          <CheckCircle2 className="h-10 w-10 text-ok" />
          <p className="mt-3 text-base font-semibold">{t("g.qr.sentTitle", { dept: t(deptKey(sent.dept)) })}</p>
          <p className="mt-1 text-[0.8125rem] text-muted">{t("g.qr.sentBody", { id: sent.id, min: sent.sla.done_min })}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {c.options && (
            <fieldset>
              <legend className="mb-2 text-[0.8125rem] font-medium">{c.multi ? t("g.qr.pickMany") : t("g.qr.pickOne")}</legend>
              <div className="flex flex-wrap gap-2">
                {c.options.map((o) => {
                  const on = selected.includes(o.id);
                  return (
                    <button
                      key={o.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setSelected((prev) => (c.multi ? (on ? prev.filter((x) => x !== o.id) : [...prev, o.id]) : [o.id]))}
                      className={cn("h-10 rounded-lg border px-3.5 text-sm transition-colors", on ? "border-fg bg-fg text-inverse" : "border-line bg-surface hover:border-line-strong")}
                    >
                      {t(o.label)}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {c.quantity && (
            <div className="flex items-center justify-between">
              <span className="text-[0.8125rem] font-medium">{t("g.qr.quantity")}</span>
              <div className="flex items-center gap-3">
                <Button variant="secondary" size="md" className="w-10 px-0" aria-label={t("a.decrease")} onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-16 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                  {qty} {t(c.quantity.unit)}
                </span>
                <Button variant="secondary" size="md" className="w-10 px-0" aria-label={t("a.increase")} onClick={() => setQty((q) => Math.min(c.quantity!.max, q + 1))} disabled={qty >= c.quantity.max}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <Field label={t("g.qr.note")} htmlFor="qr-note">
            <Textarea id="qr-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("g.qr.notePlaceholder")} className="min-h-[72px]" />
          </Field>
        </div>
      )}
    </Overlay>
  );
}
