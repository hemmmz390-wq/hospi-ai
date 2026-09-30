import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChefHat, Layers, RotateCcw, ShieldCheck, Sparkles, Wrench, X, Play, Wifi, WifiOff } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useI18n, TranslationKey } from "../../i18n";
import { Role } from "../../types";
import { cn } from "../../lib/cn";
import { BrandMark, LanguageMenu } from "../../components/common/Shared";
import { Button, Select } from "../../components/ui";

type StaffRole = Exclude<Role, "tourist">;

const ROLES: { role: StaffRole; icon: React.ComponentType<{ className?: string }> }[] = [
  { role: "front_office", icon: Layers },
  { role: "housekeeping", icon: Sparkles },
  { role: "maintenance", icon: Wrench },
  { role: "duty_manager", icon: ShieldCheck },
  { role: "food_beverage", icon: ChefHat },
];

/** Skenario siap klik: pesan dikirim ke tamu, lalu peran staf yang tepat ditampilkan. */
const SCENARIOS: { label: TranslationKey; text: TranslationKey; role: StaffRole }[] = [
  { label: "pm.sc.ac", text: "pm.sc.acText", role: "maintenance" },
  { label: "pm.sc.towels", text: "pm.sc.towelsText", role: "housekeeping" },
  { label: "pm.sc.food", text: "pm.sc.foodText", role: "food_beverage" },
  { label: "pm.sc.late", text: "pm.sc.lateText", role: "front_office" },
  { label: "pm.sc.explore", text: "pm.sc.exploreText", role: "front_office" },
  { label: "pm.sc.smoke", text: "pm.sc.smokeText", role: "duty_manager" },
];

const ROOMS = ["508", "812", "501", "102"];

/**
 * Mode presentasi: aplikasi tamu (bingkai ponsel) dan dashboard staf
 * berdampingan dalam satu layar. Keduanya aplikasi sungguhan di iframe,
 * masing-masing dengan sesinya sendiri, dan terhubung lewat sync hub —
 * persis seperti dua perangkat berbeda.
 */
export default function PresentMode() {
  const { resetSimulationData, syncStatus, rooms } = useApp();
  const { t } = useI18n();
  const [role, setRole] = useState<StaffRole>("front_office");
  const [room, setRoom] = useState("508");
  const [guestKey, setGuestKey] = useState(0);
  const [staffKey, setStaffKey] = useState(0);
  const guestFrame = useRef<HTMLIFrameElement>(null);

  const runScenario = (s: (typeof SCENARIOS)[number]) => {
    guestFrame.current?.contentWindow?.postMessage({ type: "hospi:send", text: t(s.text) }, window.location.origin);
    if (s.role !== role) {
      setRole(s.role);
      setStaffKey((k) => k + 1);
    }
  };

  const guestName = rooms.find((r) => r.roomNumber === room)?.guestName || "";

  return (
    <div className="flex h-dvh flex-col bg-canvas">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-surface px-4 py-2.5">
        <div className="flex items-center gap-3">
          <BrandMark />
          <span className="rounded-md bg-warn-soft px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-warn">{t("pm.title")}</span>
          <span className={cn("hidden items-center gap-1.5 text-[0.8125rem] sm:flex", syncStatus === "live" ? "text-ok" : syncStatus === "offline" ? "text-crit" : "text-warn")}>
            {syncStatus === "offline" ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
            {syncStatus === "live" ? t("demo.syncLive") : syncStatus === "offline" ? t("demo.syncOffline") : t("demo.syncConnecting")}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <LanguageMenu compact />
          <Button
            size="sm"
            variant="ghost"
            icon={<RotateCcw className="h-4 w-4" />}
            onClick={() => {
              resetSimulationData();
              setTimeout(() => {
                setGuestKey((k) => k + 1);
                setStaffKey((k) => k + 1);
              }, 400);
            }}
          >
            {t("demoAccess.reset")}
          </Button>
          <Link to="/demo" className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-sunken" aria-label={t("a.close")}>
            <X className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Skenario siap klik */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2">
        <span className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-muted">
          <Play className="h-3.5 w-3.5" />
          {t("pm.try")}
        </span>
        {SCENARIOS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => runScenario(s)}
            className="h-8 rounded-full border border-line bg-surface px-3 text-[0.8125rem] hover:border-line-strong hover:bg-sunken"
            title={t(s.text)}
          >
            {t(s.label)}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-[400px_minmax(0,1fr)]">
        {/* Tamu */}
        <section aria-label={t("pm.guestSide")} className="flex min-h-0 flex-col items-center">
          <div className="mb-2 flex w-full max-w-[380px] items-center justify-between gap-2">
            <p className="text-[0.8125rem] font-semibold">{t("pm.guestSide")}</p>
            <Select
              aria-label={t("sw.guest")}
              value={room}
              onChange={(e) => {
                setRoom(e.target.value);
                setGuestKey((k) => k + 1);
              }}
              className="h-8 w-40 text-[0.8125rem]"
            >
              {ROOMS.map((r) => (
                <option key={r} value={r}>
                  {t("g.roomShort", { room: r })} · {rooms.find((x) => x.roomNumber === r)?.guestName.split(" ")[0]}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-h-[560px] w-full max-w-[380px] flex-1 overflow-hidden rounded-[32px] border-[10px] border-fg bg-fg shadow-pop">
            <iframe
              key={`g-${guestKey}-${room}`}
              ref={guestFrame}
              src={`/enter?as=guest&room=${room}`}
              title={`${t("pm.guestSide")} · ${guestName}`}
              className="h-full w-full rounded-[22px] bg-canvas"
            />
          </div>
        </section>

        {/* Staf */}
        <section aria-label={t("pm.staffSide")} className="flex min-h-[600px] min-w-0 flex-col lg:min-h-0">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[0.8125rem] font-semibold">{t("pm.staffSide")}</p>
            <div role="tablist" aria-label={t("sw.staff")} className="flex flex-wrap gap-1 rounded-lg bg-sunken p-0.5">
              {ROLES.map(({ role: r, icon: Icon }) => (
                <button
                  key={r}
                  type="button"
                  role="tab"
                  aria-selected={role === r}
                  onClick={() => {
                    setRole(r);
                    setStaffKey((k) => k + 1);
                  }}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[0.8125rem] font-medium transition-colors",
                    role === r ? "bg-surface text-fg shadow-[0_1px_2px_rgb(0_0_0/0.08)]" : "text-muted hover:text-fg"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t(`role.${r}` as TranslationKey)}
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-line bg-surface shadow-pop">
            <iframe key={`s-${staffKey}-${role}`} src={`/enter?as=${role}`} title={`${t("pm.staffSide")} · ${t(`role.${role}` as TranslationKey)}`} className="h-full w-full" />
          </div>
        </section>
      </div>
    </div>
  );
}
