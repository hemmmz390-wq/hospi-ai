import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BedDouble, MonitorSmartphone, ChefHat, ClipboardList, Layers, ShieldCheck, Smartphone, Sparkles, Wrench, RotateCcw } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useI18n, TranslationKey } from "../../i18n";
import { LOCALE_META, Locale } from "../../i18n/types";
import { STAFF, DEFAULT_STAFF_FOR_ROLE } from "../../data/staff";
import { Role } from "../../types";
import { BrandMark, LanguageMenu } from "../../components/common/Shared";
import { Button, Card } from "../../components/ui";

type StaffRole = Exclude<Role, "tourist">;

const STAFF_ROLES: { role: StaffRole; icon: React.ComponentType<{ className?: string }>; desc: TranslationKey }[] = [
  { role: "front_office", icon: Layers, desc: "demo.role.fo" },
  { role: "housekeeping", icon: Sparkles, desc: "demo.role.hk" },
  { role: "maintenance", icon: Wrench, desc: "demo.role.mt" },
  { role: "duty_manager", icon: ShieldCheck, desc: "demo.role.dm" },
  { role: "food_beverage", icon: ChefHat, desc: "demo.role.fb" },
];

const DEMO_GUEST_ROOMS = ["508", "812", "501", "102"];

/**
 * Akses demo. Ini lingkungan prototipe: tidak ada autentikasi sungguhan,
 * dan halaman ini mengatakannya dengan jelas.
 */
export function DemoAccess() {
  const { checkInToRoom, signInAsStaff, rooms, resetSimulationData } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();

  const enterAsGuest = (room: string) => {
    if (checkInToRoom(room)) navigate("/guest");
  };
  const enterAsStaff = (role: StaffRole) => {
    signInAsStaff(role);
    navigate("/staff");
  };

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" aria-label="HOSPI AI">
          <BrandMark />
        </Link>
        <LanguageMenu compact />
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-1.5 rounded-md bg-warn-soft px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-warn">{t("demo.badge")}</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{t("demoAccess.title")}</h1>
          <p className="mt-2 text-sm text-muted sm:text-[0.9375rem]">{t("demoAccess.subtitle")}</p>
        </div>

        <Link
          to="/present"
          className="mt-8 flex flex-col gap-4 rounded-2xl bg-fg p-5 text-inverse transition-opacity hover:opacity-95 sm:flex-row sm:items-center sm:p-6"
        >
          <MonitorSmartphone className="h-8 w-8 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-semibold">{t("sw.present")}</span>
            <span className="mt-1 block text-[0.875rem] opacity-80">{t("demoAccess.presentBody")}</span>
          </span>
          <span className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-inverse px-4 text-[0.9375rem] font-medium text-fg">
            {t("demoAccess.presentCta")}
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <section aria-labelledby="demo-guest">
            <h2 id="demo-guest" className="flex items-center gap-2 text-[0.9375rem] font-semibold">
              <Smartphone className="h-4 w-4 text-muted" />
              {t("demoAccess.guest")}
            </h2>
            <p className="mt-1 text-[0.8125rem] text-muted">{t("demoAccess.guestHint")}</p>
            <div className="mt-4 space-y-2">
              {DEMO_GUEST_ROOMS.map((no, i) => {
                const room = rooms.find((r) => r.roomNumber === no);
                if (!room) return null;
                return (
                  <button
                    key={no}
                    type="button"
                    onClick={() => enterAsGuest(no)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-left transition-colors hover:border-line-strong hover:bg-sunken"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sunken text-sm font-semibold tabular-nums">{no}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{room.guestName}</span>
                      <span className="block text-[0.8125rem] text-muted">
                        {room.guestLocale ? LOCALE_META[room.guestLocale as Locale].nativeName : ""} · {room.roomType}
                      </span>
                    </span>
                    {i === 0 && <span className="hidden rounded-md bg-sunken px-2 py-0.5 text-[0.6875rem] font-medium text-muted sm:inline">{t("demoAccess.recommended")}</span>}
                    <ArrowRight className="h-4 w-4 text-subtle transition-transform group-hover:translate-x-0.5" />
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-[0.8125rem] text-muted">
              {t("demoAccess.orRoom")}{" "}
              <Link to="/stay" className="font-medium text-fg underline underline-offset-4">
                {t("demoAccess.enterRoom")}
              </Link>
            </p>
          </section>

          <section aria-labelledby="demo-staff">
            <h2 id="demo-staff" className="flex items-center gap-2 text-[0.9375rem] font-semibold">
              <ClipboardList className="h-4 w-4 text-muted" />
              {t("demoAccess.staff")}
            </h2>
            <p className="mt-1 text-[0.8125rem] text-muted">{t("demoAccess.staffHint")}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {STAFF_ROLES.map(({ role, icon: Icon, desc }) => {
                const person = STAFF.find((s) => s.id === DEFAULT_STAFF_FOR_ROLE[role]);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => enterAsStaff(role)}
                    className="group flex items-start gap-3 rounded-xl border border-line bg-surface p-4 text-left transition-colors hover:border-line-strong hover:bg-sunken"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sunken">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{t(`role.${role}` as TranslationKey)}</span>
                      <span className="mt-0.5 block text-[0.8125rem] leading-snug text-muted">{t(desc)}</span>
                      {person && <span className="mt-2 block text-xs text-subtle">{t("demoAccess.signedInAs", { name: person.name })}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <Card className="mt-10 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <BedDouble className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
            <div>
              <p className="text-sm font-medium">{t("demoAccess.tipTitle")}</p>
              <p className="mt-0.5 text-[0.8125rem] text-muted">{t("demoAccess.tipBody")}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={resetSimulationData}>
            {t("demoAccess.reset")}
          </Button>
        </Card>
      </main>
    </div>
  );
}
