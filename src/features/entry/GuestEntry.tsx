import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, QrCode } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useI18n } from "../../i18n";
import { BrandMark, LanguageMenu } from "../../components/common/Shared";
import { Button, Input } from "../../components/ui";

/**
 * Pintu masuk tamu. Alur normalnya memindai QR di kamar (?room=508) sehingga
 * halaman ini langsung terlewati; formulir manual adalah cadangan saat QR tidak
 * terbaca. Tidak perlu akun.
 */
export function GuestEntry() {
  const { checkInToRoom, hasCheckedIn, sessionKind } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [room, setRoom] = useState(params.get("room") || "");
  const [error, setError] = useState<string | null>(null);
  const tried = useRef(false);

  // Jalur QR: ?room=508 langsung masuk.
  useEffect(() => {
    if (tried.current) return;
    tried.current = true;
    const fromQr = params.get("room");
    if (fromQr) {
      if (checkInToRoom(fromQr)) navigate("/guest", { replace: true });
      else setError(t("entry.errorUnknown", { room: fromQr }));
      return;
    }
    if (hasCheckedIn && sessionKind === "guest") navigate("/guest", { replace: true });
  }, [params, checkInToRoom, navigate, t, hasCheckedIn, sessionKind]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = room.trim();
    if (!value) return setError(t("entry.errorEmpty"));
    if (!checkInToRoom(value)) return setError(t("entry.errorUnknown", { room: value }));
    navigate("/guest", { replace: true });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" aria-label="HOSPI AI">
          <BrandMark />
        </Link>
        <LanguageMenu compact />
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-10 sm:items-center sm:pt-0">
        <div className="w-full max-w-sm">
          <p className="text-[0.8125rem] font-medium text-muted">{t("entry.hotel")}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{t("entry.title")}</h1>
          <p className="mt-2 text-sm text-muted">{t("entry.subtitle")}</p>

          <form onSubmit={submit} className="mt-8 space-y-3" noValidate>
            <label htmlFor="room" className="block text-[0.8125rem] font-medium">
              {t("entry.roomLabel")}
            </label>
            <Input
              id="room"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              value={room}
              onChange={(e) => {
                setRoom(e.target.value);
                if (error) setError(null);
              }}
              placeholder="508"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "room-error" : "room-hint"}
              className="h-14 text-center text-2xl font-semibold tabular-nums tracking-[0.2em]"
            />
            {error ? (
              <p id="room-error" role="alert" className="text-[0.8125rem] text-crit">
                {error}
              </p>
            ) : (
              <p id="room-hint" className="flex items-center gap-1.5 text-[0.8125rem] text-muted">
                <QrCode className="h-3.5 w-3.5" />
                {t("entry.qrHint")}
              </p>
            )}
            <Button type="submit" variant="primary" size="lg" block>
              {t("entry.continue")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-10 text-center text-[0.8125rem] text-muted">
            {t("entry.staffPrompt")}{" "}
            <Link to="/demo" className="font-medium text-fg underline underline-offset-4">
              {t("entry.demoLink")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
