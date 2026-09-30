import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowUp, Mic, X, Headset, UtensilsCrossed, AlertCircle, Phone, MapPin } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useI18n, TranslationKey } from "../../i18n";
import { ChatMessage, UpsellOffer } from "../../types";
import { FOOD_MENU } from "../../data/menu";
import { Button, IconButton } from "../../components/ui";
import { cn } from "../../lib/cn";
import { deptKey, RequestProgress } from "./components";
import { VoiceSheet } from "./sheets/VoiceSheet";
import { guestTitle } from "./guestUtils";

function TicketChip({ ticketId }: { ticketId: string }) {
  const { tickets } = useApp();
  const { t, formatCurrency } = useI18n();
  const ticket = tickets.find((x) => x.id === ticketId);
  if (!ticket) return null;
  return (
    <div className="mt-2 rounded-lg border border-line bg-surface p-3">
      <div className="mb-3 flex items-center justify-between gap-2 text-[0.8125rem]">
        <span className="font-medium">{guestTitle(t, ticket)}</span>
        <span className="tabular-nums text-muted">{ticket.order ? formatCurrency(ticket.order.total) : ticket.id}</span>
      </div>
      <RequestProgress ticket={ticket} compact />
      <p className="mt-2 text-xs text-muted">{t(deptKey(ticket.dept))}</p>
    </div>
  );
}

function OrderDraftCard({ message }: { message: ChatMessage }) {
  const { confirmOrderDraft } = useApp();
  const { t, formatCurrency } = useI18n();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const draft = message.orderDraft!;
  const lines = draft.items.map((i) => ({ ...i, item: FOOD_MENU.find((m) => m.id === i.menuId) })).filter((l) => l.item);
  const total = lines.reduce((n, l) => n + l.qty * l.item!.price, 0);

  if (draft.confirmedTicketId) return <TicketChip ticketId={draft.confirmedTicketId} />;

  return (
    <div className="mt-2 rounded-lg border border-line bg-surface">
      <ul className="divide-y divide-line">
        {lines.map((l) => (
          <li key={l.menuId} className="flex justify-between gap-3 px-3 py-2 text-[0.8125rem]">
            <span>
              <span className="tabular-nums text-muted">{l.qty}×</span> {l.item!.name}
            </span>
            <span className="tabular-nums">{formatCurrency(l.qty * l.item!.price)}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-line px-3 py-2 text-[0.8125rem] font-semibold">
        <span>{t("g.food.total")}</span>
        <span className="tabular-nums">{formatCurrency(total)}</span>
      </div>
      <div className="flex gap-2 border-t border-line p-2">
        <Button size="sm" variant="ghost" onClick={() => navigate("/guest/food")}>
          {t("g.chat.changeOrder")}
        </Button>
        <Button
          size="sm"
          variant="primary"
          className="ml-auto"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await confirmOrderDraft(message.id);
            setBusy(false);
          }}
        >
          {busy ? t("a.sending") : t("g.chat.confirmOrder")}
        </Button>
      </div>
    </div>
  );
}

function OfferCards({ message }: { message: ChatMessage }) {
  const { acceptOffer, declineOffer } = useApp();
  const { t, formatCurrency } = useI18n();
  const [booking, setBooking] = useState<string | null>(null);
  if (!message.offers || message.offers.length === 0) return null;
  const titleOf = (o: UpsellOffer) => t(`up.${o.id}.title` as TranslationKey);
  return (
    <div className="mt-2 space-y-2">
      {message.offers.map((o) => (
        <div key={o.id} className="rounded-lg border border-line bg-surface p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[0.8125rem] font-semibold">{titleOf(o)}</p>
              <p className="mt-0.5 text-xs text-muted">{t(`up.${o.id}.desc` as TranslationKey)}</p>
            </div>
            <span className="shrink-0 text-[0.8125rem] font-medium tabular-nums">{formatCurrency(o.price)}</span>
          </div>
          <div className="mt-2.5 flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => declineOffer(message.id, o.id)}>
              {t("g.chat.notNow")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={booking === o.id}
              onClick={async () => {
                setBooking(o.id);
                await acceptOffer(o);
                declineOffer(message.id, o.id);
                setBooking(null);
              }}
            >
              {booking === o.id ? t("a.sending") : t("g.chat.book")}
            </Button>
          </div>
        </div>
      ))}
      <p className="text-[0.6875rem] text-subtle">{t("g.chat.offerNote")}</p>
    </div>
  );
}

function systemText(t: (k: TranslationKey, v?: Record<string, string | number>) => string, m: ChatMessage) {
  if (m.text.startsWith("escalation.started.")) return t("g.chat.connecting");
  if (m.text === "escalation.claimed") return t("g.chat.claimed", { name: (m.agentName || "").split(" ")[0] });
  if (m.text === "escalation.resolved") return t("g.chat.resolved");
  if (m.text === "late.approvedNotice") return t("g.late.approvedNotice", { hour: m.agentName || "" });
  if (m.text === "late.declinedNotice") return t("g.late.declinedNotice");
  return m.text;
}

function Message({ m }: { m: ChatMessage }) {
  const { t } = useI18n();
  const navigate = useNavigate();

  if (m.isEscalationNotice || m.sender === "system") {
    return <p className="mx-auto max-w-[85%] py-1 text-center text-xs text-muted animate-enter">{systemText(t, m)}</p>;
  }
  if (m.sender === "user") {
    return (
      <div className="flex justify-end animate-enter">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-fg px-3.5 py-2.5 text-sm text-inverse">
          {m.isVoiceMessage && <span className="mb-1 flex items-center gap-1 text-[0.6875rem] opacity-70"><Mic className="h-3 w-3" />{t("g.chat.voiceMessage")}</span>}
          <p className="whitespace-pre-wrap break-words">{m.text}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-[92%] animate-enter">
      {m.isHumanAgent && (
        <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted">
          <Headset className="h-3.5 w-3.5" />
          {t("g.chat.agent", { name: (m.agentName || "").split(" ")[0] })}
        </p>
      )}
      {m.aiUnavailable ? (
        <p className="flex items-start gap-2 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
          {t("g.chat.aiUnavailable")}
        </p>
      ) : (
        <p className={cn("whitespace-pre-wrap break-words text-sm leading-relaxed", m.isEmergency && "font-medium text-crit")}>{m.text}</p>
      )}
      {m.isEmergency && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <a href="tel:0" className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-crit/40 text-[0.8125rem] font-medium text-crit hover:bg-crit-soft">
            <Phone className="h-4 w-4" />
            {t("g.em.callDesk")}
          </a>
          <a href="tel:112" className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-crit/40 text-[0.8125rem] font-medium text-crit hover:bg-crit-soft">
            <Phone className="h-4 w-4" />
            {t("g.em.call112")}
          </a>
        </div>
      )}
      {m.ticket && !m.orderDraft && <TicketChip ticketId={m.ticket.id} />}
      {m.orderDraft && <OrderDraftCard message={m} />}
      {m.action === "open_food_menu" && (
        <Button size="sm" variant="secondary" className="mt-2" icon={<UtensilsCrossed className="h-3.5 w-3.5" />} onClick={() => navigate("/guest/food")}>
          {t("g.chat.openMenu")}
        </Button>
      )}
      {m.action === "open_explore" && (
        <Button size="sm" variant="secondary" className="mt-2" icon={<MapPin className="h-3.5 w-3.5" />} onClick={() => navigate("/guest/explore")}>
          {t("g.chat.openExplore")}
        </Button>
      )}
      <OfferCards message={m} />
    </div>
  );
}

const SUGGESTIONS: TranslationKey[] = ["g.chat.s1", "g.chat.s2", "g.chat.s3", "g.chat.s4", "g.chat.s5"];

export function GuestChat() {
  const { chatMessages, sendChatMessage, isAiProcessing, escalation, escalateToHuman } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [text, setText] = useState("");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  // Diingat per navigasi (location.key), supaya pesan kedua dari mode presentasi
  // tetap diproses walau halaman chat sudah terbuka.
  const handled = useRef<string | null>(null);

  // Pesan atau perintah suara yang dibawa dari beranda.
  useEffect(() => {
    const state = location.state as { send?: string; voice?: boolean } | null;
    if (!state || handled.current === location.key) return;
    handled.current = location.key;
    if (state.send) sendChatMessage(state.send);
    if (state.voice) setVoiceOpen(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate, sendChatMessage]);

  useLayoutEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [chatMessages.length, isAiProcessing]);

  const send = (value: string) => {
    if (!value.trim() || isAiProcessing) return;
    sendChatMessage(value.trim());
    setText("");
  };

  const connected = escalation && escalation.status !== "selesai";
  const onlyWelcome = chatMessages.length <= 1;

  return (
    <div className="flex h-[calc(100dvh-56px-64px-env(safe-area-inset-bottom))] flex-col">
      <div className="flex items-center justify-between gap-3 py-3">
        <div className="min-w-0">
          <h1 className="text-[0.9375rem] font-semibold">{t("g.chat.title")}</h1>
          <p className="text-xs text-muted">{connected ? (escalation!.status === "ditangani" ? t("g.chat.withStaff", { name: (escalation!.agentName || "").split(" ")[0] }) : t("g.chat.waitingStaff")) : t("g.chat.subtitle")}</p>
        </div>
        <div className="flex items-center gap-1">
          {!connected && (
            <Button size="sm" variant="ghost" icon={<Headset className="h-4 w-4" />} onClick={() => escalateToHuman("permintaan_tamu", t("g.home.staff"))}>
              <span className="hidden min-[400px]:inline">{t("g.chat.talkToStaff")}</span>
            </Button>
          )}
          <IconButton label={t("a.close")} onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/guest"))}>
            <X className="h-5 w-5" />
          </IconButton>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto scroll-thin pb-4 pt-1" role="log" aria-live="polite" aria-label={t("g.chat.title")}>
        {chatMessages.map((m) => (
          <Message key={m.id} m={m} />
        ))}
        {isAiProcessing && (
          <p className="flex items-center gap-2 text-[0.8125rem] text-muted animate-fade">
            <span className="flex gap-1" aria-hidden>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted [animation-delay:300ms]" />
            </span>
            {t("g.voice.understanding")}
          </p>
        )}
        {onlyWelcome && (
          <div className="flex flex-wrap gap-2 pt-2">
            {SUGGESTIONS.map((k) => (
              <button key={k} type="button" onClick={() => send(t(k))} className="rounded-full border border-line bg-surface px-3 py-1.5 text-[0.8125rem] hover:bg-sunken">
                {t(k)}
              </button>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
        className="flex items-end gap-2 border-t border-line py-3"
      >
        <label htmlFor="chat-input" className="sr-only">
          {t("g.chat.placeholder")}
        </label>
        <textarea
          id="chat-input"
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(text);
            }
          }}
          placeholder={connected ? t("g.chat.placeholderStaff") : t("g.chat.placeholder")}
          className="max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-lg border border-line bg-surface px-3 py-2.5 text-sm placeholder:text-subtle focus:border-fg focus:outline-none"
        />
        <button type="button" aria-label={t("g.voice.open")} onClick={() => setVoiceOpen(true)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-line hover:bg-sunken">
          <Mic className="h-[18px] w-[18px]" />
        </button>
        <button type="submit" aria-label={t("a.send")} disabled={!text.trim() || isAiProcessing} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-fg text-inverse transition-opacity disabled:opacity-30">
          <ArrowUp className="h-[18px] w-[18px]" />
        </button>
      </form>

      <VoiceSheet open={voiceOpen} onClose={() => setVoiceOpen(false)} />
    </div>
  );
}
