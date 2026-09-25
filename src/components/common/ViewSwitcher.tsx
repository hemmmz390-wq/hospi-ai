import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftRight, Check, ChefHat, Layers, MonitorSmartphone, ShieldCheck, Smartphone, Sparkles, Wrench } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useI18n, TranslationKey } from "../../i18n";
import { Role } from "../../types";
import { cn } from "../../lib/cn";
import { Overlay } from "../ui";
import { DemoInfo } from "./Shared";
import { isEmbedded } from "../../features/entry/EnterAs";

const STAFF: { role: Exclude<Role, "tourist">; icon: React.ComponentType<{ className?: string }>; desc: TranslationKey }[] = [
  { role: "front_office", icon: Layers, desc: "demo.role.fo" },
  { role: "housekeeping", icon: Sparkles, desc: "demo.role.hk" },
  { role: "maintenance", icon: Wrench, desc: "demo.role.mt" },
  { role: "duty_manager", icon: ShieldCheck, desc: "demo.role.dm" },
  { role: "food_beverage", icon: ChefHat, desc: "demo.role.fb" },
];

const GUEST_ROOMS = ["508", "812", "501", "102"];

/**
 * Tombol "Ganti tampilan" untuk demo. Satu ketukan, lalu pilih: tamu atau
 * salah satu peran staf. Tidak perlu keluar dan masuk ulang.
 */
export function ViewSwitcher({ compact }: { compact?: boolean }) {
  const { role, sessionKind, guest, rooms } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Di dalam mode presentasi, perpindahan dilakukan dari bar presentasi.
  if (isEmbedded()) return null;

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-warn/40 bg-warn-soft px-2.5 text-[0.8125rem] font-semibold text-warn hover:brightness-95"
        aria-label={t("sw.button")}
      >
        <ArrowLeftRight className="h-4 w-4" />
        <span className={cn(compact && "hidden min-[420px]:inline")}>{t("sw.button")}</span>
      </button>

      <Overlay open={open} onClose={() => setOpen(false)} title={t("sw.title")} description={t("sw.subtitle")} size="lg">
        <div className="space-y-6">
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-[0.8125rem] font-semibold">
              <Smartphone className="h-4 w-4 text-muted" />
              {t("sw.guest")}
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GUEST_ROOMS.map((no) => {
                const current = sessionKind === "guest" && guest.roomNumber === no;
                const name = rooms.find((r) => r.roomNumber === no)?.guestName.split(" ")[0] || "";
                return (
                  <button
                    key={no}
                    type="button"
                    onClick={() => go(`/enter?as=guest&room=${no}`)}
                    className={cn(
                      "flex min-h-16 flex-col items-start justify-center rounded-xl border px-3 py-2.5 text-left transition-colors",
                      current ? "border-fg bg-fg text-inverse" : "border-line bg-surface hover:border-line-strong hover:bg-sunken"
                    )}
                  >
                    <span className="text-base font-semibold">{t("g.roomShort", { room: no })}</span>
                    <span className={cn("text-[0.8125rem]", current ? "text-inverse/80" : "text-muted")}>{name}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="mb-2 flex items-center gap-2 text-[0.8125rem] font-semibold">
              <Layers className="h-4 w-4 text-muted" />
              {t("sw.staff")}
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {STAFF.map(({ role: r, icon: Icon, desc }) => {
                const current = sessionKind === "staff" && role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => go(`/enter?as=${r}`)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                      current ? "border-fg bg-fg text-inverse" : "border-line bg-surface hover:border-line-strong hover:bg-sunken"
                    )}
                  >
                    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", current ? "bg-inverse/15" : "bg-sunken")}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.9375rem] font-semibold">{t(`role.${r}` as TranslationKey)}</span>
                      <span className={cn("block text-[0.8125rem] leading-snug", current ? "text-inverse/80" : "text-muted")}>{t(desc)}</span>
                    </span>
                    {current && <Check className="h-5 w-5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </section>

          <button
            type="button"
            onClick={() => go("/present")}
            className="flex w-full items-center gap-3 rounded-xl border border-line bg-sunken p-4 text-left hover:border-line-strong"
          >
            <MonitorSmartphone className="h-6 w-6 shrink-0" />
            <span>
              <span className="block text-[0.9375rem] font-semibold">{t("sw.present")}</span>
              <span className="block text-[0.8125rem] text-muted">{t("sw.presentHint")}</span>
            </span>
          </button>

          <details className="rounded-xl border border-line">
            <summary className="cursor-pointer px-4 py-3 text-[0.8125rem] font-medium">{t("demo.title")}</summary>
            <div className="border-t border-line p-4">
              <DemoInfo />
            </div>
          </details>
        </div>
      </Overlay>
    </>
  );
}
