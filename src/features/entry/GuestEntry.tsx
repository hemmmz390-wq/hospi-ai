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
  const { checkInToRoom, checkInWithCode, hasCheckedIn, sessionKind } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [room, setRoom] = useState(params.get("room") || "");
  const [code, setCode] = useState(params.get("code") || "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ended] = useState(() => {
    let flag = params.get("ended") === "1";
    try {
      flag = flag || sessionStorage.getItem("hospi_stay_ended") === "1";
    } catch {
      /* abaikan */
    }
    return flag;
  });
  // Catatan dihapus setelah dibaca (di effect, bukan di initializer: StrictMode memanggilnya dua kali).
  useEffect(() => {
    try {
      sessionStorage.removeItem("hospi_stay_ended");
    } catch {
      /* abaikan */
    }
  }, []);
  const tried = useRef(false);

  /**
   * Masuk: dengan kode → diperiksa server (tamu sungguhan). Tanpa kode → kamar
   * demo; bila ternyata kamar tamu sungguhan, tamu diminta memasukkan kode.
   */
  const enter = async (roomNo: string, accessCode: string) => {
    const r = roomNo.trim();
    if (!r) return setError(t("entry.errorEmpty"));
    setBusy(true);
    setError(null);
    try {
      if (!accessCode.trim() && checkInToRoom(r)) return navigate("/guest", { replace: true });
      const result = await checkInWithCode(r, accessCode);
      if (result === "ok") return navigate("/guest", { replace: true });
      if (result === "wrong_code") setError(accessCode.trim() ? t("entry.errorCode") : t("entry.errorNeedCode"));
      else if (result === "not_checked_in") setError(t("entry.errorNotIn", { room: r }));
      else if (result === "too_many_attempts") setError(t("entry.errorLimit"));
      else setError(t("entry.errorOffline"));
    } finally {
      setBusy(false);
    }
  };

  // Jalur QR: ?room=508 (demo) atau ?room=305&code=AB12CD (tamu sungguhan) langsung masuk.
  useEffect(() => {
    if (tried.current) return;
    tried.current = true;
    const fromQr = params.get("room");
    if (fromQr) {
      enter(fromQr, params.get("code") || "");
      return;
    }
    if (hasCheckedIn && sessionKind === "guest" && !ended) navigate("/guest", { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    enter(room, code);
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
          {ended && <p className="mt-4 rounded-lg bg-ok-soft px-3 py-2.5 text-sm text-ok">{t("entry.ended")}</p>}

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
            <p id="room-hint" className="flex items-center gap-1.5 text-[0.8125rem] text-muted">
              <QrCode className="h-3.5 w-3.5" />
              {t("entry.qrHint")}
            </p>
            <label htmlFor="code" className="block pt-2 text-[0.8125rem] font-medium">
              {t("entry.code")}
            </label>
            <Input
              id="code"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
                if (error) setError(null);
              }}
              placeholder="AB12CD"
              aria-describedby="code-hint"
              className="h-12 text-center text-xl font-semibold uppercase tracking-[0.3em]"
            />
            <p id="code-hint" className="text-[0.8125rem] text-muted">
              {t("entry.codeHint")}
            </p>
            {error && (
              <p id="room-error" role="alert" className="text-[0.8125rem] text-crit">
                {error}
              </p>
            )}
            <Button type="submit" variant="primary" size="lg" block disabled={busy}>
              {busy ? t("entry.checking") : t("entry.continue")}
              {!busy && <ArrowRight className="h-4 w-4" />}
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
