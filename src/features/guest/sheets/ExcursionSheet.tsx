import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Minus, Plus } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { useI18n } from "../../../i18n";
import { Attraction, ServiceTicket } from "../../../types";
import { Button, Field, Overlay, Textarea } from "../../../components/ui";
import { cn } from "../../../lib/cn";

type Slot = { id: string; at: Date; asap: boolean; tomorrow: boolean };

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

/**
 * Pilihan jam jemput yang sederhana: secepatnya, beberapa jam bulat berikutnya
 * hari ini (sampai 17:00), dan dua pilihan besok pagi. Tamu cukup menekan satu
 * tombol, tanpa pemilih jam.
 */
function pickupSlots(now = new Date()): Slot[] {
  const slots: Slot[] = [{ id: "asap", at: new Date(now.getTime() + 15 * 60000), asap: true, tomorrow: false }];
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 2);
  for (let i = 0; i < 3 && next.getHours() <= 17 && next.getDate() === now.getDate(); i++) {
    slots.push({ id: `today-${next.getHours()}`, at: new Date(next), asap: false, tomorrow: false });
    next.setHours(next.getHours() + 2);
  }
  for (const h of [8, 10]) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(h, 0, 0, 0);
    slots.push({ id: `tomorrow-${h}`, at: d, asap: false, tomorrow: true });
  }
  return slots;
}

export function ExcursionSheet({ place, onClose }: { place: Attraction | null; onClose: () => void }) {
  const { requestExcursion } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();
  const slots = useMemo(() => (place ? pickupSlots() : []), [place]);
  const [slotId, setSlotId] = useState("asap");
  const [people, setPeople] = useState(2);
  const [assist, setAssist] = useState(false);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<ServiceTicket | null>(null);

  useEffect(() => {
    if (place) {
      setSlotId("asap");
      setPeople(2);
      setAssist(false);
      setNote("");
      setSent(null);
    }
  }, [place]);

  if (!place) return null;
  const slot = slots.find((s) => s.id === slotId) || slots[0];
  const slotLabel = (s: Slot) => (s.asap ? t("ex.sheet.asap") : t(s.tomorrow ? "ex.sheet.tomorrow" : "ex.sheet.today", { time: hhmm(s.at) }));

  const send = async () => {
    setSending(true);
    try {
      setSent(await requestExcursion({ place, pickupAt: slot.at, asap: slot.asap, people, assist, note: note.trim() || undefined }));
    } finally {
      setSending(false);
    }
  };

  return (
    <Overlay
      open
      onClose={onClose}
      title={t("ex.sheet.title", { place: place.name })}
      description={sent ? undefined : t("ex.sheet.sub")}
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
          <Button variant="primary" size="lg" block disabled={sending} onClick={send}>
            {sending ? t("a.sending") : t("ex.sheet.send")}
          </Button>
        )
      }
    >
      {sent ? (
        <div className="flex flex-col items-center py-4 text-center animate-enter">
          <CheckCircle2 className="h-10 w-10 text-ok" />
          <p className="mt-3 text-base font-semibold">{t("ex.sheet.sent")}</p>
          <p className="mt-1 text-[0.8125rem] text-muted">{t("ex.sheet.sentBody", { id: sent.id })}</p>
        </div>
      ) : (
        <div className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-sm font-medium">{t("ex.sheet.when")}</legend>
            <div className="grid grid-cols-2 gap-2">
              {slots.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={slotId === s.id}
                  onClick={() => setSlotId(s.id)}
                  className={cn(
                    "min-h-12 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors",
                    slotId === s.id ? "border-fg bg-fg text-inverse" : "border-line hover:border-line-strong"
                  )}
                >
                  {slotLabel(s)}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <p id="ex-people" className="mb-2 text-sm font-medium">
              {t("ex.sheet.people")}
            </p>
            <div role="group" aria-labelledby="ex-people" className="flex items-center gap-3">
              <button
                type="button"
                aria-label={t("ex.sheet.fewer")}
                disabled={people <= 1}
                onClick={() => setPeople((n) => Math.max(1, n - 1))}
                className="flex h-12 w-12 items-center justify-center rounded-lg border border-line hover:bg-sunken disabled:opacity-30"
              >
                <Minus className="h-5 w-5" />
              </button>
              <output aria-live="polite" className="w-10 text-center text-xl font-semibold tabular-nums">
                {people}
              </output>
              <button
                type="button"
                aria-label={t("ex.sheet.more")}
                disabled={people >= 7}
                onClick={() => setPeople((n) => Math.min(7, n + 1))}
                className="flex h-12 w-12 items-center justify-center rounded-lg border border-line hover:bg-sunken disabled:opacity-30"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>

          <label className={cn("flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors", assist ? "border-fg" : "border-line hover:border-line-strong")}>
            <input type="checkbox" checked={assist} onChange={(e) => setAssist(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--fg)]" />
            <span className="text-sm">{t("ex.sheet.assist")}</span>
          </label>

          <Field label={t("ex.sheet.note")} htmlFor="ex-note">
            <Textarea id="ex-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("ex.sheet.notePh")} className="min-h-[64px]" />
          </Field>
        </div>
      )}
    </Overlay>
  );
}
