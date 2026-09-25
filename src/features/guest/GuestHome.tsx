import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUp,
  BedDouble,
  Briefcase,
  CalendarClock,
  ChevronRight,
  Droplets,
  Headset,
  Info,
  Mic,
  Siren,
  Sparkles,
  AirVent,
  SprayCan,
  UtensilsCrossed,
  CheckCircle2,
  Phone,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useI18n, TranslationKey } from "../../i18n";
import { Button, Card, EmptyState } from "../../components/ui";
import { TextSizeSwitch } from "../../components/common/Shared";
import { cn } from "../../lib/cn";
import { firstName, greetingKey, useGuestTickets } from "./guestUtils";
import { RatingPanel, RequestCard, RequestDetailSheet } from "./components";
import { QuickKind, QuickRequestSheet } from "./sheets/QuickRequestSheet";
import { LateCheckoutSheet } from "./sheets/LateCheckoutSheet";
import { BellboySheet } from "./sheets/BellboySheet";
import { useGuestSheets } from "./GuestApp";

type Action = { id: string; label: TranslationKey; icon: React.ComponentType<{ className?: string }> };

const ACTIONS: Action[] = [
  { id: "pillow", label: "g.qa.pillow", icon: BedDouble },
  { id: "amenities", label: "g.qa.amenities", icon: SprayCan },
  { id: "cleaning", label: "g.qa.cleaning", icon: Sparkles },
  { id: "ac", label: "g.qa.ac", icon: AirVent },
  { id: "water", label: "g.qa.water", icon: Droplets },
  { id: "bellboy", label: "g.qa.bellboy", icon: Briefcase },
  { id: "food", label: "g.qa.food", icon: UtensilsCrossed },
  { id: "late", label: "g.qa.late", icon: CalendarClock },
];

export function GuestHome() {
  const { guest, escalateToHuman, lateCheckoutRequest } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { openEmergency } = useGuestSheets();
  const { active, awaitingRating, mine } = useGuestTickets();
  const [message, setMessage] = useState("");
  const [quick, setQuick] = useState<QuickKind | null>(null);
  const [lateOpen, setLateOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [ratedIds, setRatedIds] = useState<string[]>([]);
  const [guideSeen, setGuideSeen] = useState(() => {
    try {
      return localStorage.getItem("hospi_guide_seen_v1") === "1";
    } catch {
      return true;
    }
  });
  const dismissGuide = () => {
    setGuideSeen(true);
    try {
      localStorage.setItem("hospi_guide_seen_v1", "1");
    } catch {
      /* abaikan */
    }
  };
  // Tiket yang baru dinilai tetap ditampilkan sebentar, supaya ucapan terima
  // kasih (dan kabar bahwa Duty Manager sudah diberi tahu) sempat terbaca.
  const [justRated, setJustRated] = useState<string | null>(null);

  const toRate =
    (justRated && mine.find((x) => x.id === justRated)) || awaitingRating.find((x) => !ratedIds.includes(x.id)) || null;

  const runAction = (id: string) => {
    if (id === "food") return navigate("/guest/food");
    if (id === "late") return setLateOpen(true);
    if (id === "bellboy") return setBellOpen(true);
    setQuick(id as QuickKind);
  };

  const ask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    navigate("/guest/chat", { state: { send: message.trim() } });
  };

  return (
    <div className="space-y-8">
      {/* Sapaan */}
      <section>
        <h1 className="text-[1.625rem] font-semibold leading-tight tracking-tight">
          {guest.name ? t("g.greetName", { greeting: t(greetingKey()), name: firstName(guest.name) }) : t(greetingKey())}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {t("g.roomShort", { room: guest.roomNumber })}
          {guest.roomType ? ` · ${guest.roomType}` : ""}
          {lateCheckoutRequest?.status === "approved" ? ` · ${t("g.checkoutAt", { hour: guest.checkOutTime || "" })}` : ""}
        </p>
      </section>

      {/* Panduan singkat: hanya sampai tamu menekan "Mengerti". */}
      {!guideSeen && (
        <section aria-labelledby="guide-title" className="animate-enter">
          <Card className="p-4">
            <h2 id="guide-title" className="text-[0.9375rem] font-semibold">
              {t("g.guide.title")}
            </h2>
            <ol className="mt-3 space-y-2.5">
              {(["g.guide.step1", "g.guide.step2", "g.guide.step3"] as TranslationKey[]).map((k, i) => (
                <li key={k} className="flex gap-3 text-[0.9375rem] leading-snug">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fg text-[0.8125rem] font-semibold text-inverse">{i + 1}</span>
                  <span className="pt-0.5">{t(k)}</span>
                </li>
              ))}
            </ol>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <div className="flex items-center gap-3">
                <span className="text-[0.8125rem] text-muted">{t("g.guide.bigger")}</span>
                <TextSizeSwitch />
              </div>
              <Button variant="primary" onClick={dismissGuide}>
                {t("g.guide.ok")}
              </Button>
            </div>
          </Card>
        </section>
      )}

      {/* Asisten */}
      <section aria-labelledby="ask-title">
        <Card className="p-4">
          <h2 id="ask-title" className="text-[0.9375rem] font-semibold">
            {t("g.home.ask")}
          </h2>
          <p className="mt-0.5 text-[0.8125rem] text-muted">{t("g.home.askHint")}</p>
          <form onSubmit={ask} className="mt-3 flex items-center gap-2">
            <label htmlFor="ask" className="sr-only">
              {t("g.home.ask")}
            </label>
            <input
              id="ask"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("g.home.askPlaceholder")}
              className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 text-sm placeholder:text-subtle focus:border-fg focus:outline-none"
            />
            <button
              type="button"
              aria-label={t("g.voice.open")}
              onClick={() => navigate("/guest/chat", { state: { voice: true } })}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line hover:bg-sunken"
            >
              <Mic className="h-[18px] w-[18px]" />
            </button>
            <button
              type="submit"
              aria-label={t("a.send")}
              disabled={!message.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-fg text-inverse transition-opacity disabled:opacity-30"
            >
              <ArrowUp className="h-[18px] w-[18px]" />
            </button>
          </form>
        </Card>
      </section>

      {/* Aksi cepat */}
      <section aria-labelledby="qa-title">
        <h2 id="qa-title" className="mb-3 text-[0.9375rem] font-semibold">
          {t("g.home.quick")}
        </h2>
        <ul className="grid grid-cols-4 gap-2">
          {ACTIONS.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => runAction(id)}
                className="flex h-full min-h-[84px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-line bg-surface px-1.5 py-3 text-center transition-colors hover:border-line-strong hover:bg-sunken active:bg-hover"
              >
                <Icon className="h-6 w-6" />
                <span className="text-[0.8125rem] font-medium leading-tight">{t(label)}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Rating */}
      {toRate && (
        <section>
          <Card className="p-4 animate-enter">
            <RatingPanel
              key={toRate.id}
              ticket={toRate}
              onDone={() => {
                const id = toRate.id;
                setJustRated(id);
                setTimeout(() => {
                  setJustRated(null);
                  setRatedIds((p) => [...p, id]);
                }, 6000);
              }}
            />
          </Card>
        </section>
      )}

      {/* Permintaan aktif */}
      <section aria-labelledby="active-title">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="active-title" className="text-[0.9375rem] font-semibold">
            {t("g.home.current")}
          </h2>
          {active.length > 0 && (
            <button type="button" onClick={() => navigate("/guest/requests")} className="text-[0.8125rem] font-medium text-muted hover:text-fg">
              {t("a.viewAll")}
            </button>
          )}
        </div>
        {active.length === 0 ? (
          <Card>
            <EmptyState compact icon={<CheckCircle2 className="h-5 w-5" />} title={t("g.empty.activeTitle")} body={t("g.empty.activeBody")} />
          </Card>
        ) : (
          <div className="space-y-2">
            {active.slice(0, 3).map((x) => (
              <RequestCard key={x.id} ticket={x} onOpen={() => setDetail(x.id)} />
            ))}
          </div>
        )}
      </section>

      {/* Layanan lain */}
      <section aria-labelledby="other-title">
        <h2 id="other-title" className="mb-3 text-[0.9375rem] font-semibold">
          {t("g.home.other")}
        </h2>
        <Card as="ul" className="divide-y divide-line">
          <li>
            <a href="tel:0" className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-sunken/60">
              <Phone className="h-[18px] w-[18px] shrink-0 text-muted" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{t("g.call.reception")}</span>
                <span className="block text-[0.8125rem] text-muted">{t("g.call.receptionHint")}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-subtle" />
            </a>
          </li>
          {[
            { icon: Info, label: t("g.home.info"), hint: t("g.home.infoHint"), onClick: () => navigate("/guest/more#info") },
            {
              icon: Headset,
              label: t("g.home.staff"),
              hint: t("g.home.staffHint"),
              onClick: () => {
                escalateToHuman("permintaan_tamu", t("g.home.staff"));
                navigate("/guest/chat");
              },
            },
            { icon: Siren, label: t("g.emergency"), hint: t("g.home.emergencyHint"), onClick: openEmergency, crit: true },
          ].map((row) => (
            <li key={row.label}>
              <button type="button" onClick={row.onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-sunken/60">
                <row.icon className={cn("h-[18px] w-[18px] shrink-0", row.crit ? "text-crit" : "text-muted")} />
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-sm font-medium", row.crit && "text-crit")}>{row.label}</span>
                  <span className="block text-[0.8125rem] text-muted">{row.hint}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-subtle" />
              </button>
            </li>
          ))}
        </Card>
      </section>

      <QuickRequestSheet kind={quick} onClose={() => setQuick(null)} />
      <LateCheckoutSheet open={lateOpen} onClose={() => setLateOpen(false)} />
      <BellboySheet open={bellOpen} onClose={() => setBellOpen(false)} />
      <RequestDetailSheet ticketId={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
