import React, { useState } from "react";
import { BellRing, CheckCircle2, Download, Smartphone } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useI18n, TranslationKey } from "../../i18n";
import { Badge, Button } from "../../components/ui";
import { useInstall, usePush } from "../../lib/staffPwa";

/** Pasang HOSPI Staff dan aktifkan notifikasi push untuk perangkat ini. */
export function StaffAppCard() {
  const { role, showToast } = useApp();
  const { t, locale } = useI18n();
  const { state: installState, install } = useInstall();
  const push = usePush(role, locale);
  const [testing, setTesting] = useState(false);
  const roleName = t(`role.${role}` as TranslationKey);

  return (
    <div className="divide-y divide-line">
      {/* Pasang aplikasi */}
      <div className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0">
        <div className="flex min-w-0 items-start gap-3">
          <Smartphone className="mt-0.5 h-[18px] w-[18px] shrink-0 text-muted" />
          <div className="min-w-0">
            <p className="text-sm font-medium">{t("pwa.title")}</p>
            <p className="max-w-md text-[0.8125rem] text-muted">
              {installState === "ios" ? t("pwa.ios") : installState === "unavailable" ? t("pwa.manual") : t("pwa.hint")}
            </p>
          </div>
        </div>
        {installState === "installed" ? (
          <Badge tone="ok" dot>
            {t("pwa.installed")}
          </Badge>
        ) : installState === "available" ? (
          <Button variant="primary" icon={<Download className="h-4 w-4" />} onClick={install}>
            {t("pwa.install")}
          </Button>
        ) : null}
      </div>

      {/* Notifikasi push */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-0 pt-3">
        <div className="flex min-w-0 items-start gap-3">
          <BellRing className="mt-0.5 h-[18px] w-[18px] shrink-0 text-muted" />
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
              {t("push.title")}
              {push.state === "on" ? (
                <Badge tone="ok" dot>
                  {t("push.on", { role: roleName })}
                </Badge>
              ) : push.state === "off" ? (
                <Badge tone="muted">{t("push.off")}</Badge>
              ) : null}
            </p>
            <p className="max-w-md text-[0.8125rem] text-muted">
              {push.state === "denied"
                ? t("push.denied")
                : push.state === "unsupported"
                  ? t("push.unsupported")
                  : push.state === "server-off"
                    ? t("push.serverOff")
                    : t("push.hint", { role: roleName })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {push.state === "off" && (
            <Button variant="primary" icon={<BellRing className="h-4 w-4" />} onClick={push.enable}>
              {t("push.enable")}
            </Button>
          )}
          {push.state === "on" && (
            <>
              <Button
                variant="secondary"
                icon={<CheckCircle2 className="h-4 w-4" />}
                disabled={testing}
                onClick={async () => {
                  setTesting(true);
                  const ok = await push.test();
                  setTesting(false);
                  showToast(t(ok ? "push.testSent" : "push.testFailed"), ok ? "success" : "error");
                }}
              >
                {t("push.test")}
              </Button>
              <Button variant="ghost" onClick={push.disable}>
                {t("push.disable")}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
