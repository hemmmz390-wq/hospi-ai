import React from "react";
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useI18n } from "../../i18n";
import { cn } from "../../lib/cn";

const ICON = { success: CheckCircle2, info: Info, warning: AlertTriangle, error: XCircle } as const;
const COLOR = { success: "text-ok", info: "text-muted", warning: "text-warn", error: "text-crit" } as const;

export function Toaster() {
  const { toasts, dismissToast } = useApp();
  const { t } = useI18n();
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-[80] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6"
    >
      {toasts.map((toast) => {
        const type = toast.type || "info";
        const Icon = ICON[type];
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-3 text-sm shadow-pop animate-enter"
          >
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", COLOR[type])} />
            <p className="min-w-0 flex-1 leading-snug">{toast.message}</p>
            <button type="button" onClick={() => dismissToast(toast.id)} aria-label={t("a.dismiss")} className="-m-1 rounded p-1 text-subtle hover:text-fg">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
