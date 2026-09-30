import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Star, Phone, AlertTriangle, Languages, PauseCircle, Gift, Car, MapPin } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useI18n, TranslationKey } from "../../i18n";
import { ALL_DEPARTMENTS, Department, Priority, ServiceTicket, isTicketClosed } from "../../types";
import { STAFF, staffDisplayName } from "../../data/staff";
import { guestNameFor, maskPhone } from "../../lib/privacy";
import { categoryKey, displayId, isOrder, responseMinutes, resolutionMinutes } from "../../lib/ticketView";
import { cn } from "../../lib/cn";
import { Badge, Button, Field, Input, Overlay, Select, Textarea } from "../../components/ui";
import { EscalatedBadge, PriorityBadge, SlaTimer, StatusBadge } from "../../components/domain";
import { deptKey } from "../guest/components";
import { ROLE_DEPT, seesEverything } from "./staffUtils";
import { pickupLabel } from "../guest/guestUtils";
import { ATTRACTIONS, mapsUrl } from "../../data/attractions";

type Mode = null | "defer" | "transfer" | "reassign" | "cancel" | "priority" | "merge" | "note" | "compensate" | "decline";

const TL_KEY: Record<string, TranslationKey> = {
  dibuat: "stl.created",
  diterima: "stl.accepted",
  dikerjakan: "stl.inProgress",
  siap: "stl.ready",
  selesai: "stl.completed",
  dikonfirmasi: "stl.rated",
  ditutup: "stl.closed",
  ditunda: "stl.onHold",
  dilanjutkan: "stl.resumed",
  dialihkan: "stl.transferred",
  dibatalkan: "stl.cancelled",
  eskalasi: "stl.updated",
  komplain: "stl.escalated",
};

const COMPENSATIONS: TranslationKey[] = ["comp.tea", "comp.breakfast", "comp.late", "comp.fruit", "comp.upgrade"];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="shrink-0 text-[0.8125rem] text-muted">{label}</dt>
      <dd className="min-w-0 text-right text-[0.8125rem]">{children}</dd>
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${n}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("h-3.5 w-3.5", i <= n ? (n <= 2 ? "text-crit" : "text-fg") : "text-line-strong")} fill={i <= n ? "currentColor" : "none"} />
      ))}
    </span>
  );
}

export function TicketDrawer({ ticketId, onClose, onOpenTicket }: { ticketId: string | null; onClose: () => void; onOpenTicket: (id: string) => void }) {
  const app = useApp();
  const { tickets, rooms, role, currentStaff } = app;
  const { t, formatCurrency } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(null);
  const [text, setText] = useState("");
  const [choice, setChoice] = useState("");
  const [promise, setPromise] = useState("");
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setMode(null);
    setRevealed(false);
  }, [ticketId]);

  // Nomor pesanan (ORD-) juga diterima, supaya tautan dari dapur atau pencarian berfungsi.
  const ticket = ticketId ? tickets.find((x) => x.id === ticketId || x.order?.id === ticketId) : undefined;
  if (!ticketId) return null;
  if (!ticket) {
    return (
      <Overlay open variant="drawer" onClose={onClose} title={ticketId}>
        <p className="text-sm text-muted">{t("tk.notFound")}</p>
      </Overlay>
    );
  }

  const me = currentStaff?.name || "Staff";
  const room = rooms.find((r) => r.roomNumber === ticket.room);
  const supervisor = seesEverything(role);
  const ownsDept = supervisor || ticket.dept === ROLE_DEPT[role as keyof typeof ROLE_DEPT] || (role === "food_beverage" && isOrder(ticket));
  const closed = isTicketClosed(ticket.status);
  const parent = ticket.parent_ticket ? tickets.find((x) => x.id === ticket.parent_ticket) : undefined;
  const duplicates = tickets.filter((x) => x.room === ticket.room && x.id !== ticket.id && !isTicketClosed(x.status));

  const openMode = (m: Mode, preset = "") => {
    setMode(m);
    setText("");
    setChoice(preset);
    setPromise("");
  };

  // ---------------- Aksi alur kerja ----------------
  const primary: React.ReactNode[] = [];
  if (!closed && ownsDept) {
    if (ticket.lateCheckout && supervisor) {
      primary.push(
        <Button key="decline" variant="secondary" onClick={() => openMode("decline")}>
          {t("tk.decline")}
        </Button>,
        <Button key="approve" variant="primary" onClick={() => app.approveLateCheckout(ticket.id, me)}>
          {t("tk.approveLate", { hour: ticket.lateCheckout.hour })}
        </Button>
      );
    } else if (isOrder(ticket)) {
      if (ticket.status === "BARU") primary.push(<Button key="a" variant="primary" onClick={() => app.acceptTicket(ticket.id, me)}>{t("tk.accept")}</Button>);
      if (ticket.status === "DITERIMA" || ticket.status === "DIALIHKAN") primary.push(<Button key="s" variant="primary" onClick={() => app.startTicket(ticket.id, me)}>{t("tk.startPreparing")}</Button>);
      if (ticket.status === "DIKERJAKAN") primary.push(<Button key="r" variant="primary" onClick={() => app.markOrderReady(ticket.id, me)}>{t("tk.markReady")}</Button>);
      if (ticket.status === "SIAP") primary.push(<Button key="d" variant="primary" onClick={() => app.completeTicket(ticket.id, me)}>{t("tk.markDelivered")}</Button>);
    } else {
      if (ticket.status === "BARU") primary.push(<Button key="a" variant="primary" onClick={() => app.acceptTicket(ticket.id, me)}>{t("tk.accept")}</Button>);
      if (ticket.status === "DITERIMA" || ticket.status === "DIALIHKAN") primary.push(<Button key="s" variant="primary" onClick={() => app.startTicket(ticket.id, me)}>{t("tk.start")}</Button>);
      if (ticket.status === "DIKERJAKAN") {
        if (role === "maintenance" || supervisor) primary.push(<Button key="h" variant="secondary" icon={<PauseCircle className="h-4 w-4" />} onClick={() => openMode("defer")}>{t("tk.putOnHold")}</Button>);
        primary.push(<Button key="c" variant="primary" onClick={() => app.completeTicket(ticket.id, me)}>{role === "maintenance" ? t("tk.resolve") : t("tk.complete")}</Button>);
      }
      if (ticket.status === "DITUNDA") primary.push(<Button key="r" variant="primary" onClick={() => app.resumeTicket(ticket.id, me)}>{t("tk.resume")}</Button>);
    }
  }

  // ---------------- Aksi pengelolaan ----------------
  const manage: { m: Mode; label: TranslationKey; show: boolean }[] = [
    { m: "reassign", label: "tk.reassign", show: !closed && (supervisor || role === "housekeeping" || role === "maintenance") },
    { m: "transfer", label: "tk.transfer", show: !closed && supervisor },
    { m: "priority", label: "tk.priority", show: !closed && supervisor },
    { m: "merge", label: "tk.merge", show: !closed && supervisor && duplicates.length > 0 },
    { m: "compensate", label: "tk.compensate", show: role === "duty_manager" || (supervisor && Boolean(ticket.parent_ticket || ticket.isAngryComplaint)) },
    { m: "note", label: "tk.addNote", show: true },
    { m: "cancel", label: "tk.cancel", show: !closed && supervisor },
  ];

  const submitMode = () => {
    switch (mode) {
      case "defer":
        if (!text.trim()) return;
        app.deferTicket(ticket.id, text.trim(), promise || "—", me);
        break;
      case "transfer":
        if (!choice || !text.trim()) return;
        app.transferTicket(ticket.id, choice as Department, text.trim(), me);
        break;
      case "reassign":
        if (!choice) return;
        app.changeTicketAssignee(ticket.id, choice);
        break;
      case "cancel":
        if (!text.trim()) return;
        app.cancelTicket(ticket.id, text.trim(), me);
        break;
      case "priority":
        if (!choice) return;
        app.changeTicketPriority(ticket.id, choice as Priority);
        break;
      case "merge":
        if (!choice) return;
        app.mergeDuplicateTickets(ticket.id, choice);
        break;
      case "note":
        if (!text.trim()) return;
        app.addTicketNote(ticket.id, text.trim(), me);
        break;
      case "compensate":
        if (!choice) return;
        app.addTicketNote(ticket.id, `[Service recovery] ${t(choice as TranslationKey)}${text.trim() ? ` — ${text.trim()}` : ""}`, me);
        break;
      case "decline":
        if (!text.trim()) return;
        app.declineLateCheckout(ticket.id, me, text.trim());
        break;
    }
    setMode(null);
  };

  const modeTitle: Record<Exclude<Mode, null>, TranslationKey> = {
    defer: "tk.putOnHold",
    transfer: "tk.transfer",
    reassign: "tk.reassign",
    cancel: "tk.cancel",
    priority: "tk.priority",
    merge: "tk.merge",
    note: "tk.addNote",
    compensate: "tk.compensate",
    decline: "tk.decline",
  };

  const needsText = mode === "defer" || mode === "transfer" || mode === "cancel" || mode === "note" || mode === "decline";
  const staffOptions = STAFF.filter((s) => s.dept === ticket.dept);

  return (
    <Overlay
      open
      variant="drawer"
      onClose={onClose}
      title={
        <span className="flex flex-wrap items-center gap-2">
          <span className="tabular-nums">{displayId(ticket)}</span>
          {ticket.order && <span className="text-sm font-normal text-muted">{ticket.id}</span>}
        </span>
      }
      description={`${t("search.room", { room: ticket.room })} · ${ticket.taskTitle}`}
      footer={
        mode ? (
          <div className="w-full space-y-3">
            <p className="text-sm font-semibold">{t(modeTitle[mode])}</p>
            {mode === "transfer" && (
              <Select aria-label={t("tk.department")} value={choice} onChange={(e) => setChoice(e.target.value)}>
                <option value="">{t("tk.pickDept")}</option>
                {ALL_DEPARTMENTS.filter((d) => d !== ticket.dept).map((d) => (
                  <option key={d} value={d}>
                    {t(deptKey(d))}
                  </option>
                ))}
              </Select>
            )}
            {mode === "reassign" && (
              <Select aria-label={t("tk.assigned")} value={choice} onChange={(e) => setChoice(e.target.value)}>
                <option value="">{t("tk.pickStaff")}</option>
                {staffOptions.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} · {s.area}
                    {s.onDuty ? "" : ` (${t("dept.offDuty")})`}
                  </option>
                ))}
              </Select>
            )}
            {mode === "priority" && (
              <Select aria-label={t("tk.priority")} value={choice} onChange={(e) => setChoice(e.target.value)}>
                <option value="">{t("tk.pickPriority")}</option>
                {(["EMERGENCY", "HIGH", "MEDIUM", "LOW"] as Priority[]).map((p) => (
                  <option key={p} value={p}>
                    {t(`pri.${p}` as TranslationKey)}
                  </option>
                ))}
              </Select>
            )}
            {mode === "merge" && (
              <Select aria-label={t("tk.merge")} value={choice} onChange={(e) => setChoice(e.target.value)}>
                <option value="">{t("tk.pickDuplicate")}</option>
                {duplicates.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.id} · {d.taskTitle}
                  </option>
                ))}
              </Select>
            )}
            {mode === "compensate" && (
              <Select aria-label={t("tk.compensate")} value={choice} onChange={(e) => setChoice(e.target.value)}>
                <option value="">{t("tk.pickCompensation")}</option>
                {COMPENSATIONS.map((c) => (
                  <option key={c} value={c}>
                    {t(c)}
                  </option>
                ))}
              </Select>
            )}
            {mode === "defer" && (
              <Field label={t("tk.promisedBy")} htmlFor="promise">
                <Input id="promise" type="time" value={promise} onChange={(e) => setPromise(e.target.value)} />
              </Field>
            )}
            {(needsText || mode === "compensate") && (
              <Textarea
                aria-label={t(modeTitle[mode])}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t(mode === "defer" ? "tk.holdReasonPh" : mode === "note" || mode === "compensate" ? "tk.notePh" : "tk.reasonPh")}
                className="min-h-[64px]"
                data-autofocus
              />
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setMode(null)}>
                {t("a.cancel")}
              </Button>
              <Button
                variant={mode === "cancel" || mode === "decline" ? "danger" : "primary"}
                onClick={submitMode}
                disabled={(needsText && !text.trim()) || ((mode === "transfer" || mode === "reassign" || mode === "priority" || mode === "merge" || mode === "compensate") && !choice)}
              >
                {t("a.confirm")}
              </Button>
            </div>
          </div>
        ) : primary.length > 0 ? (
          <div className="flex w-full flex-wrap justify-end gap-2">{primary}</div>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge ticket={ticket} />
          <PriorityBadge priority={ticket.priority} />
          <EscalatedBadge ticket={ticket} />
          {ticket.needsFoReview && <Badge tone="warn">{t("tk.needsReview")}</Badge>}
          {ticket.isDuplicate && <Badge tone="muted">{t("tk.requestedTimes", { n: ticket.duplicateCount || 2 })}</Badge>}
        </div>

        {ticket.isEmergency && (
          <div className="flex items-start gap-3 rounded-lg bg-crit-soft p-3 text-[0.8125rem] text-crit">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t("tk.emergencyNote")}</span>
          </div>
        )}

        {!closed && ticket.status !== "DIBATALKAN" && (
          <div className="rounded-lg border border-line p-4">
            <p className="mb-2 text-xs font-medium text-muted">{t("tk.sla", { min: ticket.sla.done_min })}</p>
            <SlaTimer ticket={ticket} variant="block" />
          </div>
        )}

        {ticket.status === "DITUNDA" && ticket.defer && (
          <div className="rounded-lg bg-warn-soft p-3 text-[0.8125rem] text-warn">
            <p className="font-medium">{t("tk.waitingFor", { reason: ticket.defer.reason || "—" })}</p>
            {ticket.defer.promised_at && ticket.defer.promised_at !== "—" && <p className="mt-0.5">{t("tk.promisedAt", { time: ticket.defer.promised_at })}</p>}
          </div>
        )}

        {/* Permintaan */}
        <section>
          <h3 className="mb-2 text-xs font-medium text-muted">{t("tk.request")}</h3>
          <div className="space-y-3 rounded-lg border border-line p-4">
            <div>
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <Languages className="h-3.5 w-3.5" />
                {t("tk.original", { lang: ticket.originalLanguage })}
              </p>
              <p className="mt-1 text-sm" lang={room?.guestLocale}>
                “{ticket.raw_text}”
              </p>
            </div>
            <div className="border-t border-line pt-3">
              <p className="text-xs text-muted">{t("tk.operational")}</p>
              <p className="mt-1 text-sm">{ticket.translatedRequest}</p>
            </div>
          </div>
        </section>

        {ticket.order && (
          <section>
            <h3 className="mb-2 text-xs font-medium text-muted">{t("tk.order", { id: ticket.order.id })}</h3>
            <div className="rounded-lg border border-line">
              <ul className="divide-y divide-line">
                {ticket.order.items.map((l) => (
                  <li key={l.menuId} className="flex justify-between gap-3 px-3 py-2 text-sm">
                    <span>
                      <span className="font-semibold tabular-nums">{l.qty}×</span> {l.name}
                    </span>
                    <span className="tabular-nums text-muted">{formatCurrency(l.qty * l.unitPrice)}</span>
                  </li>
                ))}
              </ul>
              {ticket.order.notes && <p className="border-t border-line px-3 py-2 text-[0.8125rem]">{t("tk.kitchenNote")}: “{ticket.order.notes}”</p>}
              <div className="flex justify-between border-t border-line px-3 py-2 text-sm font-semibold">
                <span>{ticket.diningDestination === "table" ? t("tk.table", { n: ticket.tableNumber || "—" }) : t("tk.roomFolio")}</span>
                <span className="tabular-nums">{formatCurrency(ticket.order.total)}</span>
              </div>
            </div>
          </section>
        )}

        {ticket.lateCheckout && (
          <section className="rounded-lg border border-line p-4 text-[0.8125rem]">
            <p className="font-medium">{t("tk.lateRequest", { hour: ticket.lateCheckout.hour })}</p>
            <p className="mt-0.5 text-muted">{t("tk.lateFee", { fee: formatCurrency(ticket.lateCheckout.fee) })}</p>
          </section>
        )}

        {ticket.excursion && (
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted">
              <Car className="h-3.5 w-3.5" />
              {t("tk.ex.title")}
            </h3>
            <div className="rounded-lg border border-line px-4 py-1">
              <dl className="divide-y divide-line">
                <Row label={t("tk.ex.dest")}>
                  {(() => {
                    const place = ATTRACTIONS.find((a) => a.id === ticket.excursion!.placeId);
                    return place ? (
                      <a href={mapsUrl(place)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline">
                        {ticket.excursion!.place}
                        <MapPin className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      ticket.excursion!.place
                    );
                  })()}
                </Row>
                <Row label={t("tk.ex.pickup")}>
                  {ticket.excursion.asap
                    ? t("tk.ex.asap", { time: new Date(ticket.excursion.pickupAt).toTimeString().slice(0, 5) })
                    : pickupLabel(t, ticket.excursion)}
                </Row>
                <Row label={t("tk.ex.people")}>{ticket.excursion.people}</Row>
              </dl>
            </div>
            {ticket.excursion.assist && <p className="mt-2 rounded-md bg-warn-soft px-3 py-2 text-[0.8125rem] text-warn">{t("tk.ex.assist")}</p>}
            {ticket.excursion.note && <p className="mt-2 text-[0.8125rem]">“{ticket.excursion.note}”</p>}
            <p className="mt-2 text-xs text-muted">{t("tk.ex.confirmPrice")}</p>
          </section>
        )}

        {/* Eskalasi: konteks tiket asal */}
        {parent && (
          <section>
            <h3 className="mb-2 text-xs font-medium text-muted">{t("tk.escalationContext")}</h3>
            <div className="rounded-lg border border-warn/40 bg-warn-soft/40 p-4">
              <dl className="divide-y divide-line/60">
                <Row label={t("tk.originalTicket")}>
                  <button type="button" onClick={() => onOpenTicket(parent.id)} className="inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline">
                    {parent.id}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </Row>
                <Row label={t("tk.department")}>{t(deptKey(parent.dept))}</Row>
                <Row label={t("tk.staffMember")}>{staffDisplayName(parent.assignedStaff || parent.assignee) || "—"}</Row>
                <Row label={t("tk.responseTime")}>{responseMinutes(parent) !== null ? t("time.min", { n: responseMinutes(parent)! }) : "—"}</Row>
                <Row label={t("tk.resolutionTime")}>{resolutionMinutes(parent) !== null ? t("time.min", { n: resolutionMinutes(parent)! }) : "—"}</Row>
                <Row label={t("tk.guestRating")}>{ticket.guest_score ? <Stars n={ticket.guest_score} /> : "—"}</Row>
              </dl>
              {ticket.rating_comment && <p className="mt-3 text-[0.8125rem]">“{ticket.rating_comment}”</p>}
            </div>
          </section>
        )}

        {!parent && (ticket.guest_score || ticket.guest_rating) && (
          <section className="flex items-start justify-between gap-3 rounded-lg border border-line p-4">
            <div>
              <p className="text-xs text-muted">{t("tk.guestRating")}</p>
              {ticket.rating_comment && <p className="mt-1 text-[0.8125rem]">“{ticket.rating_comment}”</p>}
            </div>
            <Stars n={ticket.guest_score || (ticket.guest_rating === "thumbs_up" ? 5 : 1)} />
          </section>
        )}

        {/* Detail */}
        <section>
          <h3 className="mb-1 text-xs font-medium text-muted">{t("tk.details")}</h3>
          <dl className="divide-y divide-line">
            <Row label={t("label.guest")}>
              <span className="font-medium">{guestNameFor(role, ticket.guestName)}</span>
            </Row>
            {supervisor && room?.guestPhone && (
              <Row label={t("tk.contact")}>
                {revealed ? (
                  <a href={`tel:${room.guestPhone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1 font-medium">
                    <Phone className="h-3.5 w-3.5" />
                    {room.guestPhone}
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <span className="tabular-nums">{maskPhone(room.guestPhone)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setRevealed(true);
                        app.logContactReveal(ticket.room, me);
                      }}
                      className="text-xs font-medium underline underline-offset-2"
                    >
                      {t("tk.reveal")}
                    </button>
                  </span>
                )}
              </Row>
            )}
            <Row label={t("tk.department")}>{t(deptKey(ticket.dept))}</Row>
            <Row label={t("tk.category")}>{t(categoryKey(ticket.category))}</Row>
            <Row label={t("tk.assigned")}>{staffDisplayName(ticket.assignedStaff || ticket.assignee) || <span className="text-muted">{t("tk.unassigned")}</span>}</Row>
            <Row label={t("tk.created")}>
              <span className="tabular-nums">{ticket.createdAtTime}</span>
            </Row>
            <Row label={t("tk.channel")}>{t(`ch.${ticket.channel}` as TranslationKey)}</Row>
            {ticket.channel === "chat_ai" && (
              <Row label={t("tk.aiConfidence")}>
                <span className={cn("tabular-nums", ticket.confidence < 0.8 && "text-warn")}>{Math.round(ticket.confidence * 100)}%</span>
              </Row>
            )}
          </dl>
          {supervisor && (
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" onClick={() => navigate(`/staff/conversations?chat=${ticket.room}`)}>
                {t("tk.openConversation")}
              </Button>
            </div>
          )}
        </section>

        {/* Kelola */}
        {manage.some((a) => a.show) && (
          <section>
            <h3 className="mb-2 text-xs font-medium text-muted">{t("tk.manage")}</h3>
            <div className="flex flex-wrap gap-2">
              {manage
                .filter((a) => a.show)
                .map((a) => (
                  <Button
                    key={a.m}
                    size="sm"
                    variant={a.m === "cancel" ? "danger-outline" : "secondary"}
                    icon={a.m === "compensate" ? <Gift className="h-3.5 w-3.5" /> : undefined}
                    onClick={() => openMode(a.m, a.m === "priority" ? ticket.priority : "")}
                  >
                    {t(a.label)}
                  </Button>
                ))}
            </div>
          </section>
        )}

        {/* Riwayat */}
        <section>
          <h3 className="mb-2 text-xs font-medium text-muted">{t("tk.timeline")}</h3>
          <ol className="space-y-3 border-l border-line pl-4">
            {ticket.timeline.map((e) => (
              <li key={e.id} className="relative">
                <span className={cn("absolute -left-[21px] top-1.5 h-2 w-2 rounded-full", e.ev === "komplain" ? "bg-warn" : e.ev === "dibatalkan" ? "bg-subtle" : "bg-line-strong")} />
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[0.8125rem] font-medium">
                    {t(TL_KEY[e.ev] || "stl.updated")}
                    <span className="font-normal text-muted"> · {e.by === "bot" ? "HOSPI AI" : e.by === "tamu" ? t("label.guest") : staffDisplayName(e.by)}</span>
                  </p>
                  <span className="shrink-0 text-xs tabular-nums text-subtle">{e.at}</span>
                </div>
                {e.note && <p className="mt-0.5 text-[0.8125rem] text-muted">{e.note}</p>}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </Overlay>
  );
}
