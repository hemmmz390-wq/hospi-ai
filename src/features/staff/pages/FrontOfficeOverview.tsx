import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MessagesSquare, CheckCircle2 } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { useI18n, TranslationKey } from "../../../i18n";
import { Department, isTicketClosed } from "../../../types";
import { useNow } from "../../../lib/clock";
import { slaView } from "../../../lib/ticketView";
import { guestNameFor } from "../../../lib/privacy";
import { Badge, Card, EmptyState, Segmented, buttonClasses } from "../../../components/ui";
import { TicketTable } from "../TicketTable";
import { byUrgency, isToday, useDetailParams } from "../staffUtils";
import { BarRow, PanelHeader, Stat } from "./widgets";

type DeptFilter = "all" | Department;

export function FrontOfficeOverview() {
  const { tickets, rooms, escalations, chatsByRoom, role } = useApp();
  const { t } = useI18n();
  const now = useNow();
  const { openTicket, openRoom } = useDetailParams();
  const [dept, setDept] = useState<DeptFilter>("all");

  // Metrik dihitung ulang tiap 15 detik, bukan tiap detik: angka besar yang
  // berkedip setiap detik lebih mengganggu daripada membantu.
  const tick = Math.floor(now / 15000);
  const m = useMemo(() => {
    const active = tickets.filter((x) => !isTicketClosed(x.status));
    const views = active.map((x) => slaView(x, tick * 15000));
    const breached = views.filter((v) => v.state === "breached").length;
    const atRisk = views.filter((v) => v.state === "at_risk").length;
    const completedToday = tickets.filter((x) => ["SELESAI", "DIKONFIRMASI", "DITUTUP"].includes(x.status) && isToday(x.sla.created_at)).length;
    const rated = tickets.filter((x) => x.guest_score && !x.parent_ticket);
    const satisfaction = rated.length ? rated.reduce((n, x) => n + (x.guest_score || 0), 0) / rated.length : null;
    return { active, breached, atRisk, onTrack: active.length - breached - atRisk, completedToday, satisfaction, ratedCount: rated.length };
  }, [tickets, tick]);

  const queue = useMemo(
    () => m.active.filter((x) => dept === "all" || x.dept === dept).sort(byUrgency(tick * 15000)).slice(0, 12),
    [m.active, dept, tick]
  );

  const conversations = useMemo(() => {
    const live = escalations.filter((e) => e.status !== "selesai");
    const recentRooms = Object.entries(chatsByRoom)
      .filter(([, msgs]) => msgs.length > 0)
      .map(([room, msgs]) => ({ room, last: msgs[msgs.length - 1] }))
      .filter((c) => !live.some((e) => e.room === c.room))
      .slice(-4)
      .reverse();
    return { live, recentRooms };
  }, [escalations, chatsByRoom]);

  const roomCounts = useMemo(() => {
    const c = { occupied: 0, vacant: 0, cleaning: 0, maintenance: 0, ready: 0 };
    for (const r of rooms) {
      if (r.status === "Occupied" || r.status === "Do Not Disturb") c.occupied++;
      else if (r.status === "Vacant") c.vacant++;
      else if (r.status === "Needs Cleaning" || r.status === "In Progress") c.cleaning++;
      else if (r.status === "Maintenance") c.maintenance++;
      else if (r.status === "Clean") c.ready++;
    }
    return c;
  }, [rooms]);

  const deptOptions: { value: DeptFilter; label: string }[] = [
    { value: "all", label: t("fo.allDepts") },
    { value: "Housekeeping", label: t("dp.Housekeeping") },
    { value: "Maintenance", label: t("dp.Maintenance") },
    { value: "Front Office", label: t("dp.FrontOffice") },
    { value: "Food & Beverage", label: t("dp.FoodBeverage") },
    { value: "Duty Manager", label: t("dp.DutyManager") },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Stat label={t("m.activeTickets")} value={m.active.length} />
        <Stat label={t("m.atRisk")} value={m.atRisk} tone={m.atRisk > 0 ? "warn" : undefined} />
        <Stat label={t("m.breached")} value={m.breached} tone={m.breached > 0 ? "crit" : undefined} hint={m.breached > 0 ? t("m.breachedHint") : t("m.allWithinTarget")} />
        <Stat label={t("m.completedToday")} value={m.completedToday} />
        <Stat
          label={t("m.satisfaction")}
          value={m.satisfaction ? m.satisfaction.toFixed(1) : "—"}
          hint={t("m.fromRatings", { n: m.ratedCount })}
        />
      </div>

      {/* Antrean selalu selebar mungkin: kolom SLA tidak boleh terpotong. Panel
          samping baru pindah ke kanan di layar yang benar-benar lebar. */}
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="min-w-0 overflow-hidden">
          <PanelHeader
            title={t("fo.liveQueue")}
            hint={t("fo.liveQueueHint")}
            action={
              <Link to="/staff/tickets" className={buttonClasses("ghost", "sm")}>
                {t("a.viewAll")}
              </Link>
            }
          />
          <div className="border-b border-line px-4 py-2.5">
            <Segmented label={t("q.department")} value={dept} onChange={setDept} size="sm" options={deptOptions} />
          </div>
          <TicketTable
            tickets={queue}
            onOpen={openTicket}
            empty={<EmptyState compact icon={<CheckCircle2 className="h-5 w-5" />} title={t("fo.queueEmpty")} body={t("fo.queueEmptyBody")} />}
          />
        </Card>

        <div className="grid content-start gap-6 lg:grid-cols-3 2xl:grid-cols-1">
          <Card>
            <PanelHeader title={t("fo.slaMonitor")} />
            <div className="space-y-3 p-4">
              <BarRow label={t("sla.breached")} value={m.breached} total={m.active.length} tone="crit" />
              <BarRow label={t("sla.atRisk")} value={m.atRisk} total={m.active.length} tone="warn" />
              <BarRow label={t("sla.onTrack")} value={m.onTrack} total={m.active.length} />
            </div>
          </Card>

          <Card>
            <PanelHeader
              title={t("fo.conversations")}
              action={
                <Link to="/staff/conversations" className={buttonClasses("ghost", "sm")}>
                  {t("a.open")}
                </Link>
              }
            />
            {conversations.live.length === 0 && conversations.recentRooms.length === 0 ? (
              <EmptyState compact icon={<MessagesSquare className="h-5 w-5" />} title={t("fo.noConversations")} body={t("fo.noConversationsBody")} />
            ) : (
              <ul className="divide-y divide-line">
                {conversations.live.map((e) => (
                  <li key={e.id}>
                    <Link to={`/staff/conversations?chat=${e.room}`} className="flex items-center gap-3 px-4 py-3 hover:bg-sunken/60">
                      <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg bg-sunken text-[0.8125rem] font-semibold tabular-nums">{e.room}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.8125rem] font-medium">{guestNameFor(role, e.guestName)}</span>
                        <span className="block truncate text-xs text-muted">{t(`esc.${e.reason}` as TranslationKey)}</span>
                      </span>
                      <Badge tone={e.status === "menunggu" ? "warn" : "neutral"} dot>
                        {e.status === "menunggu" ? t("conv.waiting") : t("conv.handling", { name: (e.agentName || "").split(" ")[0] })}
                      </Badge>
                    </Link>
                  </li>
                ))}
                {conversations.recentRooms.map(({ room, last }) => (
                  <li key={room}>
                    <Link to={`/staff/conversations?chat=${room}`} className="flex items-center gap-3 px-4 py-3 hover:bg-sunken/60">
                      <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg bg-sunken text-[0.8125rem] font-semibold tabular-nums">{room}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.8125rem]">{last.isEscalationNotice ? t("conv.systemNotice") : last.text || t("conv.aiHandled")}</span>
                        <span className="block text-xs text-muted">{t("conv.aiHandled")}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <PanelHeader
              title={t("fo.roomOverview")}
              hint={t("fo.roomsTotal", { n: rooms.length })}
              action={
                <Link to="/staff/rooms" className={buttonClasses("ghost", "sm")}>
                  {t("a.open")}
                </Link>
              }
            />
            <div className="space-y-3 p-4">
              <BarRow label={t("rs.occupied")} value={roomCounts.occupied} total={rooms.length} />
              <BarRow label={t("rs.ready")} value={roomCounts.ready} total={rooms.length} tone="ok" />
              <BarRow label={t("rs.cleaningGroup")} value={roomCounts.cleaning} total={rooms.length} tone="warn" />
              <BarRow label={t("rs.maintenance")} value={roomCounts.maintenance} total={rooms.length} tone="crit" onClick={() => {
                const r = rooms.find((x) => x.status === "Maintenance");
                if (r) openRoom(r.roomNumber);
              }} />
              <BarRow label={t("rs.vacant")} value={roomCounts.vacant} total={rooms.length} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
