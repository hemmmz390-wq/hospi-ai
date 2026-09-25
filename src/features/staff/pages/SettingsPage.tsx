import React, { useState } from "react";
import { RefreshCw, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { useI18n, TranslationKey } from "../../../i18n";
import { LOCALES, LOCALE_META } from "../../../i18n/types";
import { SLA_ROUTING_CONFIG, LATE_CHECKOUT_OPTIONS } from "../../../data/sla";
import { ALL_DEPARTMENTS } from "../../../types";
import { STAFF } from "../../../data/staff";
import { categoryKey, priorityKey } from "../../../lib/ticketView";
import { cn } from "../../../lib/cn";
import { Badge, Button, Card, Select } from "../../../components/ui";
import { ThemeSwitch, LanguageMenu, TextSizeSwitch } from "../../../components/common/Shared";
import { deptKey } from "../../guest/components";
import { relativeTime } from "../NotificationCenter";

const SECTIONS: { id: string; label: TranslationKey }[] = [
  { id: "hotel", label: "set.hotel" },
  { id: "departments", label: "set.departments" },
  { id: "sla", label: "set.sla" },
  { id: "languages", label: "set.languages" },
  { id: "notifications", label: "set.notifications" },
  { id: "integrations", label: "set.integrations" },
  { id: "ai", label: "set.ai" },
  { id: "privacy", label: "set.privacy" },
  { id: "demo", label: "set.demo" },
];

function Section({ id, title, hint, children, action }: { id: string; title: string; hint?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20">
      <Card className="overflow-hidden">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 id={`${id}-title`} className="text-[0.9375rem] font-semibold">
              {title}
            </h2>
            {hint && <p className="mt-0.5 text-[0.8125rem] text-muted">{hint}</p>}
          </div>
          {action}
        </div>
        <div className="px-5 py-4">{children}</div>
      </Card>
    </section>
  );
}

function KV({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="divide-y divide-line">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-4 py-2.5 text-[0.8125rem]">
          <dt className="text-muted">{k}</dt>
          <dd className="text-right font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors", checked ? "bg-fg" : "bg-line-strong")}
    >
      <span className={cn("inline-block h-5 w-5 rounded-full bg-surface shadow transition-transform", checked ? "translate-x-[18px]" : "translate-x-0.5")} />
    </button>
  );
}

export function SettingsPage() {
  const app = useApp();
  const { t, locale, formatCurrency } = useI18n();
  const [anonRoom, setAnonRoom] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const aiLive = app.health?.aiProvider === "gemini";
  const supervisor = app.role === "front_office" || app.role === "duty_manager";

  return (
    <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
      <nav aria-label={t("nav.settings")} className="hidden lg:block">
        <ul className="sticky top-20 space-y-0.5">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="block rounded-lg px-2.5 py-1.5 text-[0.8125rem] text-muted hover:bg-sunken hover:text-fg">
                {t(s.label)}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0 space-y-6">
        <Section id="hotel" title={t("set.hotel")} hint={t("set.hotelHint")}>
          <KV
            rows={[
              [t("set.hotelName"), t("entry.hotel")],
              [t("set.location"), "Jimbaran, Bali"],
              [t("set.rooms"), String(app.rooms.length)],
              [t("set.timezone"), "Asia/Makassar (WITA)"],
              [t("set.currency"), "IDR"],
              [t("set.checkTimes"), "15:00 / 12:00"],
            ]}
          />
        </Section>

        <Section id="departments" title={t("set.departments")} hint={t("set.departmentsHint")}>
          <ul className="divide-y divide-line">
            {ALL_DEPARTMENTS.map((d) => (
              <li key={d} className="flex items-center justify-between gap-3 py-2.5 text-[0.8125rem]">
                <span className="font-medium">{t(deptKey(d))}</span>
                <span className="text-muted">{t("dept.onDuty", { n: STAFF.filter((s) => s.dept === d && s.onDuty).length, total: STAFF.filter((s) => s.dept === d).length })}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="sla" title={t("set.sla")} hint={t("set.slaHint")}>
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[0.8125rem]">
              <thead>
                <tr className="border-b border-line text-xs text-muted">
                  <th scope="col" className="py-2 pl-5 pr-3 font-medium">{t("tk.category")}</th>
                  <th scope="col" className="px-3 py-2 font-medium">{t("q.department")}</th>
                  <th scope="col" className="px-3 py-2 font-medium">{t("q.priority")}</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">{t("set.ack")}</th>
                  <th scope="col" className="py-2 pl-3 pr-5 text-right font-medium">{t("set.resolve")}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(SLA_ROUTING_CONFIG).map(([key, c]) => (
                  <tr key={key} className="border-b border-line last:border-0">
                    <td className="py-2.5 pl-5 pr-3">{t(categoryKey(key === "upsell" ? "upsell_x" : key))}</td>
                    <td className="px-3 py-2.5 text-muted">{t(deptKey(c.dept))}</td>
                    <td className="px-3 py-2.5">{c.priority ? t(priorityKey(c.priority)) : "—"}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{t("time.min", { n: c.ackMin })}</td>
                    <td className="py-2.5 pl-3 pr-5 text-right tabular-nums">{t("time.min", { n: c.doneMin })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">
            {t("set.lateFees")}: {LATE_CHECKOUT_OPTIONS.filter((o) => o.fee > 0).map((o) => `${o.hour} ${formatCurrency(o.fee)}`).join(" · ")}
          </p>
        </Section>

        <Section id="languages" title={t("set.languages")} hint={t("set.languagesHint")}>
          <div className="flex flex-wrap gap-2">
            {LOCALES.map((l) => (
              <Badge key={l} tone={l === locale ? "strong" : "neutral"}>
                <span lang={l}>{LOCALE_META[l].nativeName}</span>
              </Badge>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <span className="text-[0.8125rem] text-muted">{t("set.yourLanguage")}</span>
            <LanguageMenu />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[0.8125rem] text-muted">{t("ts.label")}</span>
            <TextSizeSwitch />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[0.8125rem] text-muted">{t("a.appearance")}</span>
            <ThemeSwitch />
          </div>
        </Section>

        <Section id="notifications" title={t("set.notifications")} hint={t("set.notificationsHint")}>
          <div className="flex items-center justify-between gap-4 py-1">
            <div>
              <p className="text-[0.8125rem] font-medium">{t("set.alarmSound")}</p>
              <p className="text-xs text-muted">{t("set.alarmSoundHint")}</p>
            </div>
            <Toggle checked={!app.isAlarmMuted} onChange={(v) => app.setIsAlarmMuted(!v)} label={t("set.alarmSound")} />
          </div>
          <div className="mt-4 border-t border-line pt-3">
            <KV
              rows={[
                [t("set.channel"), t("demo.inApp")],
                [t("set.routing"), t("set.routingValue")],
                [t("set.push"), <Badge key="p" tone="muted">{t("set.notConnected")}</Badge>],
              ]}
            />
          </div>
        </Section>

        <Section
          id="integrations"
          title={t("set.integrations")}
          hint={t("set.integrationsHint")}
          action={
            <Button size="sm" variant="ghost" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={app.refreshIntegrations}>
              {t("a.refresh")}
            </Button>
          }
        >
          <ul className="divide-y divide-line">
            {app.integrations.map((c) => (
              <li key={c.kind} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-[0.8125rem] font-medium">{c.kind} · {c.vendor}</p>
                  <p className="text-xs text-muted">{c.capabilities.join(", ")}</p>
                </div>
                <Badge tone={c.status === "connected" ? "ok" : c.status === "simulated" ? "warn" : "crit"} dot>
                  {t(`set.int.${c.status}` as TranslationKey)}
                </Badge>
              </li>
            ))}
            {app.integrations.length === 0 && <li className="py-3 text-[0.8125rem] text-muted">{t("set.intUnavailable")}</li>}
          </ul>
          <p className="mt-3 rounded-lg bg-sunken p-3 text-xs text-muted">{t("set.intNote")}</p>
        </Section>

        <Section id="ai" title={t("set.ai")} hint={t("set.aiHint")}>
          <KV
            rows={[
              [t("set.aiProvider"), aiLive ? "Google Gemini" : t("set.fallbackRules")],
              [t("set.aiStatus"), <Badge key="s" tone={app.health ? "ok" : "crit"} dot>{app.health ? t("set.operational") : t("set.unreachable")}</Badge>],
              ["Gemini API", <Badge key="g" tone={aiLive ? "ok" : "muted"}>{aiLive ? t("set.connected") : t("set.notConnected")}</Badge>],
              ["PMS", <Badge key="pms" tone="warn">{t("set.int.simulated")}</Badge>],
              ["POS", <Badge key="pos" tone="warn">{t("set.int.simulated")}</Badge>],
              [t("demo.voice"), t("demo.voiceBrowser")],
              [t("set.languageMirroring"), t("set.on")],
              [t("set.reviewThreshold"), "80%"],
            ]}
          />
          {!aiLive && <p className="mt-3 rounded-lg bg-sunken p-3 text-xs text-muted">{t("set.aiHowTo")}</p>}
        </Section>

        <Section id="privacy" title={t("set.privacy")} hint={t("set.privacyHint")}>
          <ul className="space-y-2 text-[0.8125rem]">
            {(["set.pv.mask", "set.pv.min", "set.pv.anon", "set.pv.log", "set.pv.rbac"] as TranslationKey[]).map((k) => (
              <li key={k} className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
                <span>{t(k)}</span>
              </li>
            ))}
          </ul>

          {supervisor && (
            <div className="mt-5 border-t border-line pt-4">
              <p className="text-[0.8125rem] font-medium">{t("set.anonTitle")}</p>
              <p className="text-xs text-muted">{t("set.anonHint")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Select aria-label={t("q.room")} value={anonRoom} onChange={(e) => setAnonRoom(e.target.value)} className="h-9 w-40">
                  <option value="">{t("set.pickRoom")}</option>
                  {app.rooms.filter((r) => r.guestName).map((r) => (
                    <option key={r.roomNumber} value={r.roomNumber}>
                      {r.roomNumber}
                    </option>
                  ))}
                </Select>
                <Button size="sm" variant="danger-outline" disabled={!anonRoom} icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => app.anonymizeGuestHistory(anonRoom).then(() => setAnonRoom(""))}>
                  {t("set.anonRun")}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-5 border-t border-line pt-4">
            <p className="mb-2 text-[0.8125rem] font-medium">{t("set.auditLog")}</p>
            {app.privacyLog.length === 0 ? (
              <p className="text-xs text-muted">{t("set.auditEmpty")}</p>
            ) : (
              <ul className="divide-y divide-line">
                {app.privacyLog.slice(0, 8).map((e) => (
                  <li key={e.id} className="flex items-start justify-between gap-3 py-2 text-[0.8125rem]">
                    <span className="min-w-0">
                      <span className="font-medium">{t(`pv.${e.action}` as TranslationKey)}</span>
                      <span className="block truncate text-xs text-muted">
                        {e.scope} · {e.detail}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-subtle">{relativeTime(e.at, locale)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>

        <Section id="demo" title={t("set.demo")} hint={t("set.demoHint")}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[0.8125rem] font-medium">{t("set.simulation")}</p>
              <p className="text-xs text-muted">{t("set.simulationHint")}</p>
            </div>
            <Toggle checked={app.simulationEnabled} onChange={app.setSimulationEnabled} label={t("set.simulation")} />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <div>
              <p className="text-[0.8125rem] font-medium">{t("demoAccess.reset")}</p>
              <p className="text-xs text-muted">{t("set.resetHint")}</p>
            </div>
            {confirmReset ? (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>
                  {t("a.cancel")}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    app.resetSimulationData();
                    setConfirmReset(false);
                  }}
                >
                  {t("a.confirm")}
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="secondary" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={() => setConfirmReset(true)}>
                {t("demoAccess.reset")}
              </Button>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}
