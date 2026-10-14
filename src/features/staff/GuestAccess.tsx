import React, { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Copy, Printer } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useI18n } from "../../i18n";
import { dictionary } from "../../i18n/dictionary";
import { LOCALES, LOCALE_META, Locale } from "../../i18n/types";
import { Button, Field, Input, Overlay, Select } from "../../components/ui";

/** Alamat yang dibuka tamu: memindai QR langsung masuk ke kamarnya. */
export const guestLink = (room: string, code: string) => `${window.location.origin}/stay?room=${encodeURIComponent(room)}&code=${encodeURIComponent(code)}`;

function useQrSvg(text: string) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    let live = true;
    QRCode.toString(text, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#111111", light: "#ffffff" } }).then((s) => live && setSvg(s));
    return () => {
      live = false;
    };
  }, [text]);
  return svg;
}

/** Kartu akses: QR, kode, dan alamat. Bisa dicetak untuk diberikan ke tamu. */
export function AccessCard({ room, code, guestName, guestLocale, onClose }: { room: string; code: string; guestName: string; guestLocale?: string; onClose: () => void }) {
  const { showToast } = useApp();
  const { t } = useI18n();
  const link = guestLink(room, code);
  const svg = useQrSvg(link);
  const gl = (LOCALES as readonly string[]).includes(guestLocale || "") ? (guestLocale as Locale) : "en";

  const print = () => {
    const w = window.open("", "_blank", "width=480,height=640");
    if (!w) return;
    const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
    w.document.write(`<!doctype html><html lang="${gl}"><head><meta charset="utf-8"><title>${esc(t("acc.title", { room }))}</title>
<style>body{font-family:Inter,system-ui,sans-serif;margin:0;padding:32px;color:#111;text-align:center}
.card{border:1px solid #ddd;border-radius:16px;padding:28px;max-width:340px;margin:0 auto}
h1{font-size:20px;margin:0 0 4px}p{margin:4px 0;color:#555;font-size:14px}.qr svg{width:220px;height:220px;margin:16px auto}
.code{font-size:30px;font-weight:700;letter-spacing:.3em;margin:8px 0;color:#111}.small{font-size:11px;word-break:break-all;color:#888}</style></head>
<body><div class="card"><p>Hospi Resort Bali</p><h1>${esc(guestName)}</h1><p>${esc(t("ci.room"))} ${esc(room)}</p>
<div class="qr">${svg}</div><p>${esc(dictionary["acc.welcome"][gl])}</p>
<p style="margin-top:14px">${esc(dictionary["acc.code"][gl])}</p><div class="code">${esc(code)}</div>
<p class="small">${esc(link)}</p></div><script>window.onload=()=>{window.print()}</script></body></html>`);
    w.document.close();
  };

  return (
    <Overlay
      open
      onClose={onClose}
      title={t("acc.title", { room })}
      description={t("acc.sub")}
      footer={
        <>
          <Button
            variant="ghost"
            icon={<Copy className="h-4 w-4" />}
            onClick={() => navigator.clipboard?.writeText(link).then(() => showToast(t("acc.copied"), "success"), () => {})}
          >
            {t("acc.copy")}
          </Button>
          <Button variant="primary" icon={<Printer className="h-4 w-4" />} onClick={print}>
            {t("acc.print")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center">
        <p className="text-base font-semibold">{guestName}</p>
        <div className="mt-3 h-52 w-52 rounded-xl border border-line bg-white p-2 [&_svg]:h-full [&_svg]:w-full" aria-label="QR" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="mt-4 text-xs text-muted">{t("acc.code")}</p>
        <p className="mt-1 font-mono text-3xl font-bold tracking-[0.3em]" data-testid="access-code">
          {code}
        </p>
        <p className="mt-3 break-all text-xs text-subtle">{link}</p>
        <p className="mt-4 rounded-lg bg-warn-soft px-3 py-2 text-[0.8125rem] text-warn">{t("acc.once")}</p>
      </div>
    </Overlay>
  );
}

/** Front Office: check-in tamu sungguhan, lalu tampilkan kartu aksesnya. */
export function CheckInSheet({ open, defaultRoom, onClose }: { open: boolean; defaultRoom?: string; onClose: () => void }) {
  const { rooms, registerGuest } = useApp();
  const { t, locale } = useI18n();
  const vacant = useMemo(
    () => rooms.filter((r) => !r.guestName).sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true })),
    [rooms]
  );
  const [room, setRoom] = useState("");
  const [name, setName] = useState("");
  const [guestLocale, setGuestLocale] = useState<Locale>("en");
  const [nights, setNights] = useState(2);
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<{ room: string; code: string; name: string; locale: Locale } | null>(null);

  useEffect(() => {
    if (!open) return;
    setRoom(defaultRoom || vacant[0]?.roomNumber || "");
    setName("");
    setGuestLocale("en");
    setNights(2);
    setPhone("");
    setNationality("");
    setError(null);
    setIssued(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultRoom]);

  if (!open) return null;
  if (issued) return <AccessCard room={issued.room} code={issued.code} guestName={issued.name} guestLocale={issued.locale} onClose={onClose} />;

  const submit = async () => {
    if (!name.trim()) return setError(t("ci.nameRequired"));
    if (!room) return;
    setBusy(true);
    const res = await registerGuest({ room, name, locale: guestLocale, nights, phone, nationality });
    setBusy(false);
    if (res) setIssued({ room, code: res.code, name: name.trim(), locale: guestLocale });
  };

  return (
    <Overlay
      open
      onClose={onClose}
      title={t("ci.title")}
      description={t("ci.sub")}
      footer={
        <Button variant="primary" size="lg" block disabled={busy || !room} onClick={submit}>
          {busy ? t("a.sending") : t("ci.submit")}
        </Button>
      }
    >
      {vacant.length === 0 && !defaultRoom ? (
        <p className="py-6 text-center text-sm text-muted">{t("ci.noVacant")}</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("ci.room")} htmlFor="ci-room">
              <Select id="ci-room" value={room} onChange={(e) => setRoom(e.target.value)}>
                {(defaultRoom && !vacant.some((v) => v.roomNumber === defaultRoom) ? [{ roomNumber: defaultRoom, roomType: "" }, ...vacant] : vacant).map((r) => (
                  <option key={r.roomNumber} value={r.roomNumber}>
                    {r.roomNumber}
                    {r.roomType ? ` · ${r.roomType}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("ci.nights")} htmlFor="ci-nights">
              <Input id="ci-nights" type="number" min={1} max={30} value={nights} onChange={(e) => setNights(Math.max(1, Math.min(30, Number(e.target.value) || 1)))} />
            </Field>
          </div>
          <Field label={t("ci.name")} htmlFor="ci-name" error={error || undefined}>
            <Input
              id="ci-name"
              value={name}
              autoFocus
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Maria Lopez"
            />
          </Field>
          <Field label={t("ci.language")} htmlFor="ci-lang">
            <Select id="ci-lang" value={guestLocale} onChange={(e) => setGuestLocale(e.target.value as Locale)}>
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_META[l].nativeName}
                  {l !== locale ? ` · ${new Intl.DisplayNames([LOCALE_META[locale].intl], { type: "language" }).of(l)}` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("ci.phone")} htmlFor="ci-phone">
              <Input id="ci-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label={t("ci.nationality")} htmlFor="ci-nat">
              <Input id="ci-nat" value={nationality} onChange={(e) => setNationality(e.target.value)} />
            </Field>
          </div>
        </div>
      )}
    </Overlay>
  );
}
