import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Briefcase, CalendarClock, ChevronRight, Copy, Headset, LogOut, Receipt, ShieldCheck, Wifi, Coffee, Waves, Dumbbell, ScrollText, Phone, MapPin } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useI18n, TranslationKey } from "../../i18n";
import { Badge, Button, Card } from "../../components/ui";
import { DemoBadge, LanguageMenu, TextSizeSwitch, ThemeSwitch } from "../../components/common/Shared";
import { LateCheckoutSheet } from "./sheets/LateCheckoutSheet";
import { BellboySheet } from "./sheets/BellboySheet";

function Row({ icon: Icon, label, hint, right, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; hint?: React.ReactNode; right?: React.ReactNode; onClick?: () => void }) {
  const inner = (
    <>
      <Icon className="h-[18px] w-[18px] shrink-0 text-muted" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-[0.8125rem] text-muted">{hint}</span>}
      </span>
      {right}
      {onClick && <ChevronRight className="h-4 w-4 shrink-0 text-subtle" />}
    </>
  );
  return (
    <li>
      {onClick ? (
        <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-sunken/60">
          {inner}
        </button>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3.5">{inner}</div>
      )}
    </li>
  );
}

const INFO: { icon: React.ComponentType<{ className?: string }>; title: TranslationKey; lines: [TranslationKey, string | TranslationKey][] }[] = [
  { icon: Coffee, title: "g.info.dining", lines: [["g.info.breakfast", "06:30 – 10:30 · The Azure Pavilion, L1"], ["g.info.poolBar", "11:00 – 22:00"], ["g.info.inRoom", "g.info.inRoomValue"]] },
  { icon: Waves, title: "g.info.pool", lines: [["g.info.mainPool", "07:00 – 21:00"], ["g.info.spa", "09:00 – 21:00"]] },
  { icon: Dumbbell, title: "g.info.gym", lines: [["g.info.fitness", "g.info.fitnessValue"], ["g.info.yoga", "g.info.yogaValue"]] },
  { icon: ScrollText, title: "g.info.policies", lines: [["g.info.checkin", "15:00"], ["g.info.checkout", "12:00"], ["g.info.late", "g.info.lateValue"], ["g.info.luggage", "g.info.luggageValue"]] },
];

const PHONES: [TranslationKey, string][] = [
  ["g.info.frontDesk", "0"],
  ["g.info.housekeeping", "2"],
  ["g.info.kitchen", "3"],
  ["g.info.spaBooking", "5"],
];

export function GuestMore() {
  const { guest, lateCheckoutRequest, escalateToHuman, folioCharges, signOutRoom, showToast } = useApp();
  const { t, formatCurrency } = useI18n();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const [lateOpen, setLateOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  useEffect(() => {
    if (hash === "#info") document.getElementById("info")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash]);

  const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "—");
  const lateBadge = lateCheckoutRequest ? (
    <Badge tone={lateCheckoutRequest.status === "approved" ? "ok" : lateCheckoutRequest.status === "pending" ? "warn" : "muted"} dot>
      {t(lateCheckoutRequest.status === "approved" ? "g.late.approved" : lateCheckoutRequest.status === "pending" ? "g.late.pending" : "g.late.declined")}
    </Badge>
  ) : null;
  const folioTotal = folioCharges.reduce((n, c) => n + c.amount, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">{t("g.more.title")}</h1>

      {/* Menginap */}
      <Card className="p-4">
        <p className="text-xs font-medium text-muted">{t("g.more.stay")}</p>
        <p className="mt-1 text-base font-semibold">{guest.name}</p>
        <dl className="mt-3 grid grid-cols-3 gap-3 text-[0.8125rem]">
          <div>
            <dt className="text-muted">{t("label.room")}</dt>
            <dd className="font-medium tabular-nums">{guest.roomNumber}</dd>
          </div>
          <div>
            <dt className="text-muted">{t("g.more.checkIn")}</dt>
            <dd className="font-medium">{fmtDate(guest.checkInDate)}</dd>
          </div>
          <div>
            <dt className="text-muted">{t("g.more.checkOut")}</dt>
            <dd className="font-medium">
              {fmtDate(guest.checkOutDate)} · <span className="tabular-nums">{guest.checkOutTime}</span>
            </dd>
          </div>
        </dl>
      </Card>

      <Card as="ul" className="divide-y divide-line">
        <Row icon={CalendarClock} label={t("g.qa.late")} hint={lateCheckoutRequest ? t("g.late.until", { hour: lateCheckoutRequest.hour }) : t("g.more.lateHint")} right={lateBadge} onClick={() => setLateOpen(true)} />
        <Row icon={MapPin} label={t("ex.title")} hint={t("ex.home.hint")} onClick={() => navigate("/guest/explore")} />
        <Row icon={Briefcase} label={t("g.qa.bellboy")} hint={t("g.bell.subtitle")} onClick={() => setBellOpen(true)} />
        <Row
          icon={Headset}
          label={t("g.home.staff")}
          hint={t("g.home.staffHint")}
          onClick={() => {
            escalateToHuman("permintaan_tamu", t("g.home.staff"));
            navigate("/guest/chat");
          }}
        />
      </Card>

      {/* Info hotel */}
      <section id="info" aria-labelledby="info-title" className="scroll-mt-20">
        <h2 id="info-title" className="mb-3 text-[0.9375rem] font-semibold">
          {t("g.home.info")}
        </h2>
        <Card className="mb-2 p-4">
          <div className="flex items-start gap-3">
            <Wifi className="mt-0.5 h-[18px] w-[18px] shrink-0 text-muted" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t("g.info.wifi")}</p>
              <dl className="mt-1 space-y-0.5 text-[0.8125rem]">
                <div className="flex gap-2">
                  <dt className="text-muted">{t("g.info.network")}</dt>
                  <dd className="font-medium">Hospi_Resort</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted">{t("g.info.password")}</dt>
                  <dd className="font-mono font-medium">azure2026</dd>
                </div>
              </dl>
            </div>
            <Button
              size="sm"
              variant="secondary"
              icon={<Copy className="h-3.5 w-3.5" />}
              onClick={() => {
                navigator.clipboard?.writeText("azure2026").then(
                  () => showToast(t("g.info.copied"), "success"),
                  () => {}
                );
              }}
            >
              {t("a.copy")}
            </Button>
          </div>
        </Card>
        <Card as="ul" className="divide-y divide-line">
          {INFO.map((block) => (
            <li key={block.title} className="flex gap-3 px-4 py-3.5">
              <block.icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-muted" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t(block.title)}</p>
                <dl className="mt-1 space-y-0.5 text-[0.8125rem]">
                  {block.lines.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-muted">{t(k)}</dt>
                      <dd className="text-right">{v.startsWith("g.") ? t(v as TranslationKey) : v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </li>
          ))}
          <li className="flex gap-3 px-4 py-3.5">
            <Phone className="mt-0.5 h-[18px] w-[18px] shrink-0 text-muted" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t("g.info.phones")}</p>
              <dl className="mt-1 space-y-0.5 text-[0.8125rem]">
                {PHONES.map(([k, ext]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="text-muted">{t(k)}</dt>
                    <dd>
                      <a className="font-medium underline-offset-2 hover:underline" href={`tel:${ext}`}>
                        {t("g.info.ext", { n: ext })}
                      </a>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </li>
        </Card>
      </section>

      {/* Tagihan */}
      <section aria-labelledby="bill-title">
        <h2 id="bill-title" className="mb-3 text-[0.9375rem] font-semibold">
          {t("g.more.bill")}
        </h2>
        <Card className="p-4">
          {folioCharges.length === 0 ? (
            <p className="flex items-center gap-2 text-[0.8125rem] text-muted">
              <Receipt className="h-4 w-4" />
              {t("g.more.billEmpty")}
            </p>
          ) : (
            <>
              <ul className="divide-y divide-line">
                {folioCharges.slice(0, 8).map((c) => (
                  <li key={c.id} className="flex justify-between gap-3 py-2 text-[0.8125rem]">
                    <span className="min-w-0 truncate">{c.description}</span>
                    <span className="shrink-0 tabular-nums">{formatCurrency(c.amount)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex justify-between border-t border-line pt-2 text-sm font-semibold">
                <span>{t("g.food.total")}</span>
                <span className="tabular-nums">{formatCurrency(folioTotal)}</span>
              </div>
            </>
          )}
          <p className="mt-3 text-xs text-subtle">{t("g.food.billingSimulated")}</p>
        </Card>
      </section>

      {/* Pengaturan */}
      <section aria-labelledby="pref-title">
        <h2 id="pref-title" className="mb-3 text-[0.9375rem] font-semibold">
          {t("g.more.preferences")}
        </h2>
        <Card as="ul" className="divide-y divide-line">
          <li className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm font-medium">{t("a.language")}</span>
            <LanguageMenu />
          </li>
          <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm font-medium">{t("ts.label")}</span>
            <TextSizeSwitch />
          </li>
          <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm font-medium">{t("a.appearance")}</span>
            <ThemeSwitch />
          </li>
        </Card>
      </section>

      <Card className="flex items-start gap-3 p-4">
        <ShieldCheck className="mt-0.5 h-[18px] w-[18px] shrink-0 text-muted" />
        <div>
          <p className="text-sm font-medium">{t("g.more.privacy")}</p>
          <p className="mt-0.5 text-[0.8125rem] text-muted">{t("g.more.privacyBody")}</p>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <DemoBadge align="start" />
        <Button
          variant="ghost"
          icon={<LogOut className="h-4 w-4" />}
          onClick={() => {
            signOutRoom();
            navigate("/stay", { replace: true });
          }}
        >
          {t("g.more.leave")}
        </Button>
      </div>

      <LateCheckoutSheet open={lateOpen} onClose={() => setLateOpen(false)} />
      <BellboySheet open={bellOpen} onClose={() => setBellOpen(false)} />
    </div>
  );
}
