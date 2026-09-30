import React from "react";
import { Check, ChevronDown, Globe, Monitor, Moon, Sun, FlaskConical } from "lucide-react";
import { useI18n, Locale } from "../../i18n";
import { LOCALES, LOCALE_META } from "../../i18n/types";
import { useTheme, ThemeMode, TextSize } from "../../theme";
import { useApp } from "../../context/AppContext";
import { Popover, Segmented } from "../ui";
import { cn } from "../../lib/cn";

/** Logo HOSPI AI: huruf H di kotak hitam. Tanpa gradien, tanpa kilau. */
export function BrandMark({ size = 28, withName = true, className }: { size?: number; withName?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="shrink-0">
        <rect width="32" height="32" rx="8" className="fill-fg" />
        <path d="M10 9v14M22 9v14M10 16h12" className="stroke-inverse" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
      {withName && <span className="text-[0.9375rem] font-semibold tracking-tight">HOSPI AI</span>}
    </span>
  );
}

export function LanguageMenu({ compact, align = "end" }: { compact?: boolean; align?: "start" | "end" }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <Popover
      label={t("a.language")}
      align={align}
      width={220}
      trigger={({ toggle, ref, ...aria }) => (
        <button
          ref={ref}
          type="button"
          onClick={toggle}
          {...aria}
          aria-label={`${t("a.language")}: ${LOCALE_META[locale].nativeName}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[0.8125rem] font-medium text-fg hover:bg-sunken"
        >
          <Globe className="h-4 w-4 text-muted" />
          <span>{compact ? locale.toUpperCase() : LOCALE_META[locale].nativeName}</span>
          <ChevronDown className="h-3.5 w-3.5 text-subtle" />
        </button>
      )}
    >
      {(close) => (
        <ul className="p-1" role="listbox" aria-label={t("a.language")}>
          {LOCALES.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                lang={l}
                onClick={() => {
                  setLocale(l as Locale);
                  close();
                }}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-sunken"
              >
                <span>{LOCALE_META[l].nativeName}</span>
                {l === locale && <Check className="h-4 w-4" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Popover>
  );
}

export function ThemeSwitch() {
  const { mode, setMode } = useTheme();
  const { t } = useI18n();
  return (
    <Segmented<ThemeMode>
      label={t("a.appearance")}
      value={mode}
      onChange={setMode}
      size="sm"
      options={[
        { value: "light", label: <span className="inline-flex items-center gap-1.5"><Sun className="h-3.5 w-3.5" />{t("theme.light")}</span> },
        { value: "dark", label: <span className="inline-flex items-center gap-1.5"><Moon className="h-3.5 w-3.5" />{t("theme.dark")}</span> },
        { value: "system", label: <span className="inline-flex items-center gap-1.5"><Monitor className="h-3.5 w-3.5" />{t("theme.system")}</span> },
      ]}
    />
  );
}

/** Pilihan ukuran teks. Huruf "A" yang makin besar lebih mudah dipahami daripada kata. */
export function TextSizeSwitch() {
  const { textSize, setTextSize } = useTheme();
  const { t } = useI18n();
  const options: { value: TextSize; size: string; label: string }[] = [
    { value: "normal", size: "text-[0.8125rem]", label: t("ts.normal") },
    { value: "large", size: "text-[1rem]", label: t("ts.large") },
    { value: "xlarge", size: "text-[1.25rem]", label: t("ts.xlarge") },
  ];
  return (
    <div role="radiogroup" aria-label={t("ts.label")} className="inline-flex rounded-lg bg-sunken p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={textSize === o.value}
          aria-label={o.label}
          title={o.label}
          onClick={() => setTextSize(o.value)}
          className={cn(
            "flex h-10 min-w-12 items-center justify-center rounded-md px-3 font-semibold transition-colors",
            o.size,
            textSize === o.value ? "bg-surface text-fg shadow-[0_1px_2px_rgb(0_0_0/0.08)]" : "text-muted hover:text-fg"
          )}
        >
          A
        </button>
      ))}
    </div>
  );
}

/** Isi penjelasan mode demo: apa yang nyata dan apa yang disimulasikan. */
export function DemoInfo() {
  const { health, syncStatus } = useApp();
  const { t } = useI18n();
  const aiLive = health?.aiProvider === "gemini";
  const rows: { label: string; value: string; tone?: "ok" | "warn" | "crit" }[] = [
    {
      label: t("demo.sync"),
      value: syncStatus === "live" ? t("demo.syncLive") : syncStatus === "offline" ? t("demo.syncOffline") : t("demo.syncConnecting"),
      tone: syncStatus === "live" ? "ok" : syncStatus === "offline" ? "crit" : "warn",
    },
    { label: t("demo.ai"), value: aiLive ? t("demo.aiGemini") : t("demo.aiRules"), tone: aiLive ? "ok" : undefined },
    { label: t("demo.pms"), value: t("demo.simulated") },
    { label: t("demo.pos"), value: t("demo.simulated") },
    { label: t("demo.notifications"), value: t("demo.inApp") },
    { label: t("demo.voice"), value: t("demo.voiceBrowser") },
    { label: t("demo.auth"), value: t("demo.demoLogin") },
  ];
  return (
    <div>
      <p className="text-[0.8125rem] text-muted">{t("demo.body")}</p>
      <dl className="mt-3 divide-y divide-line rounded-lg border border-line">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 px-3 py-2">
            <dt className="text-[0.8125rem] text-muted">{r.label}</dt>
            <dd className={cn("text-right text-[0.8125rem] font-medium", r.tone === "ok" ? "text-ok" : r.tone === "warn" ? "text-warn" : r.tone === "crit" ? "text-crit" : "text-fg")}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Indikator DEMO MODE kecil (dipakai di halaman yang tidak punya tombol Ganti tampilan). */
export function DemoBadge({ align = "end" }: { align?: "start" | "end" }) {
  const { t } = useI18n();
  return (
    <Popover
      label={t("demo.title")}
      align={align}
      width={320}
      trigger={({ toggle, ref, ...aria }) => (
        <button
          ref={ref}
          type="button"
          onClick={toggle}
          {...aria}
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-warn/40 bg-warn-soft px-2 text-[0.6875rem] font-semibold uppercase tracking-wide text-warn"
        >
          <FlaskConical className="h-3.5 w-3.5" />
          {t("demo.badge")}
        </button>
      )}
    >
      {() => (
        <div className="p-4">
          <p className="mb-1 text-sm font-semibold">{t("demo.title")}</p>
          <DemoInfo />
        </div>
      )}
    </Popover>
  );
}
