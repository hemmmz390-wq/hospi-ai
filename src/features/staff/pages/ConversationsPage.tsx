import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowUp, Headset, Bot, MessagesSquare, Mic } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { useI18n, TranslationKey } from "../../../i18n";
import { ChatMessage } from "../../../types";
import { guestNameFor } from "../../../lib/privacy";
import { cn } from "../../../lib/cn";
import { Badge, Button, Card, EmptyState } from "../../../components/ui";

/**
 * Percakapan tamu. Saat tamu meminta manusia, AI berhenti membalas dan
 * percakapan muncul di sini sampai staf menutupnya. Percakapan yang ditangani
 * AI tetap bisa dibaca untuk konteks.
 */
export function ConversationsPage() {
  const { chatsByRoom, escalations, rooms, role, currentStaff, claimEscalation, sendAgentReply, resolveEscalation } = useApp();
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const selected = params.get("chat");
  const [reply, setReply] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const me = currentStaff?.name || "Front Office";

  const list = useMemo(() => {
    const roomsWithChat = new Set([...Object.keys(chatsByRoom).filter((r) => chatsByRoom[r].length > 0), ...escalations.filter((e) => e.status !== "selesai").map((e) => e.room)]);
    return Array.from(roomsWithChat)
      .map((room) => {
        const esc = escalations.find((e) => e.room === room && e.status !== "selesai");
        const msgs = chatsByRoom[room] || [];
        return { room, esc, last: msgs[msgs.length - 1], guest: rooms.find((r) => r.roomNumber === room)?.guestName || "" };
      })
      .sort((a, b) => (a.esc ? 0 : 1) - (b.esc ? 0 : 1) || a.room.localeCompare(b.room));
  }, [chatsByRoom, escalations, rooms]);

  useEffect(() => {
    if (!selected && list.length > 0 && window.matchMedia("(min-width: 1024px)").matches) {
      setParams({ chat: list[0].room }, { replace: true });
    }
  }, [selected, list, setParams]);

  const active = selected ? list.find((c) => c.room === selected) : undefined;
  const messages = selected ? chatsByRoom[selected] || [] : [];

  useLayoutEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, selected]);

  const preview = (m?: ChatMessage) => {
    if (!m) return t("conv.noMessages");
    if (m.isEscalationNotice) return t("conv.systemNotice");
    if (m.orderDraft) return t("conv.orderDraft");
    return m.text || t("conv.aiUnavailable");
  };

  const systemText = (m: ChatMessage) => {
    if (m.text.startsWith("escalation.started.")) return t("conv.startedBy", { reason: t(`esc.${m.text.split(".")[2]}` as TranslationKey) });
    if (m.text === "escalation.claimed") return t("conv.claimedBy", { name: m.agentName || "" });
    if (m.text === "escalation.resolved") return t("conv.resolvedBy", { name: m.agentName || "" });
    if (m.text === "late.approvedNotice") return t("conv.lateApproved", { hour: m.agentName || "" });
    if (m.text === "late.declinedNotice") return t("conv.lateDeclined");
    return m.text;
  };

  const send = () => {
    if (!reply.trim() || !selected) return;
    if (active?.esc?.status === "menunggu") claimEscalation(me, selected);
    sendAgentReply(reply.trim(), me, selected);
    setReply("");
  };

  return (
    <div className="grid gap-4 lg:h-[calc(100dvh-56px-48px)] lg:grid-cols-[320px_minmax(0,1fr)]">
      {/* Daftar */}
      <Card className={cn("overflow-hidden lg:flex lg:flex-col", selected && "hidden lg:flex")}>
        <div className="border-b border-line px-4 py-3">
          <p className="text-sm font-semibold">{t("nav.conversations")}</p>
          <p className="text-xs text-muted">{t("conv.hint")}</p>
        </div>
        {list.length === 0 ? (
          <EmptyState compact icon={<MessagesSquare className="h-5 w-5" />} title={t("fo.noConversations")} body={t("fo.noConversationsBody")} />
        ) : (
          <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto scroll-thin">
            {list.map((c) => (
              <li key={c.room}>
                <button
                  type="button"
                  onClick={() => setParams({ chat: c.room })}
                  aria-current={c.room === selected}
                  className={cn("flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-sunken/60", c.room === selected && "bg-sunken")}
                >
                  <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg bg-surface text-[0.8125rem] font-semibold tabular-nums ring-1 ring-line">{c.room}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[0.8125rem] font-medium">{guestNameFor(role, c.guest)}</span>
                      {c.esc ? (
                        <Badge tone={c.esc.status === "menunggu" ? "warn" : "neutral"} dot>
                          {c.esc.status === "menunggu" ? t("conv.waiting") : t("conv.live")}
                        </Badge>
                      ) : (
                        <Bot className="h-3.5 w-3.5 shrink-0 text-subtle" aria-label={t("conv.aiHandled")} />
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">{preview(c.last)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Transkrip */}
      <Card className={cn("flex min-h-[70dvh] flex-col overflow-hidden lg:min-h-0", !selected && "hidden lg:flex")}>
        {!selected ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState icon={<MessagesSquare className="h-5 w-5" />} title={t("conv.pick")} />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <button type="button" onClick={() => setParams({})} className="-ml-1 rounded-md p-1 hover:bg-sunken lg:hidden" aria-label={t("a.back")}>
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {t("search.room", { room: selected })} · {guestNameFor(role, active?.guest || "")}
                </p>
                <p className="text-xs text-muted">
                  {active?.esc
                    ? active.esc.status === "menunggu"
                      ? t("conv.aiPausedWaiting")
                      : t("conv.handling", { name: active.esc.agentName || "" })
                    : t("conv.aiHandledLong")}
                </p>
              </div>
              {active?.esc && active.esc.status === "menunggu" && (
                <Button size="sm" variant="primary" icon={<Headset className="h-4 w-4" />} onClick={() => claimEscalation(me, selected)}>
                  {t("conv.claim")}
                </Button>
              )}
              {active?.esc && active.esc.status === "ditangani" && (
                <Button size="sm" variant="secondary" onClick={() => resolveEscalation(me, selected)}>
                  {t("conv.resolve")}
                </Button>
              )}
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto scroll-thin px-4 py-4" role="log" aria-live="polite">
              {messages.map((m) => {
                if (m.isEscalationNotice || m.sender === "system") {
                  return (
                    <p key={m.id} className="text-center text-xs text-muted">
                      {systemText(m)} · {m.timestamp}
                    </p>
                  );
                }
                const guest = m.sender === "user";
                return (
                  <div key={m.id} className={cn("flex", guest ? "justify-start" : "justify-end")}>
                    <div className={cn("max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[0.8125rem]", guest ? "rounded-bl-md bg-sunken" : m.isHumanAgent ? "rounded-br-md bg-fg text-inverse" : "rounded-br-md border border-line")}>
                      <p className={cn("mb-1 flex items-center gap-1 text-[0.6875rem] font-medium", guest ? "text-muted" : m.isHumanAgent ? "opacity-70" : "text-muted")}>
                        {guest ? (m.isVoiceMessage ? <><Mic className="h-3 w-3" />{t("label.guest")}</> : t("label.guest")) : m.isHumanAgent ? m.agentName : "HOSPI AI"}
                        <span className="font-normal">· {m.timestamp}</span>
                      </p>
                      <p className="whitespace-pre-wrap break-words">{m.aiUnavailable ? t("conv.aiUnavailable") : m.text}</p>
                      {m.ticket && <p className="mt-1.5 text-[0.6875rem] opacity-70">→ {m.ticket.id} · {m.ticket.dept}</p>}
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            {active?.esc ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="flex items-end gap-2 border-t border-line p-3"
              >
                <label htmlFor="agent-reply" className="sr-only">
                  {t("conv.replyPlaceholder")}
                </label>
                <textarea
                  id="agent-reply"
                  rows={1}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder={t("conv.replyPlaceholder")}
                  className="max-h-32 min-h-10 min-w-0 flex-1 resize-none rounded-lg border border-line bg-surface px-3 py-2 text-sm placeholder:text-subtle focus:border-fg focus:outline-none"
                />
                <button type="submit" aria-label={t("a.send")} disabled={!reply.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-fg text-inverse disabled:opacity-30">
                  <ArrowUp className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <p className="border-t border-line px-4 py-3 text-xs text-muted">{t("conv.readOnly")}</p>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
