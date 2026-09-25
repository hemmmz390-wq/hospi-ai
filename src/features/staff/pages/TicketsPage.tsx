import React, { useMemo, useState } from "react";
import { Search, Inbox } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { useI18n } from "../../../i18n";
import { ALL_DEPARTMENTS, Priority, isTicketClosed } from "../../../types";
import { useNow } from "../../../lib/clock";
import { slaView } from "../../../lib/ticketView";
import { Card, EmptyState, Input, Segmented, Select } from "../../../components/ui";
import { TicketTable } from "../TicketTable";
import { byUrgency, seesEverything, useDetailParams, useRoleTickets } from "../staffUtils";
import { deptKey } from "../../guest/components";

type View = "active" | "breached" | "waiting" | "closed" | "all";

export function TicketsPage() {
  const { role } = useApp();
  const { t } = useI18n();
  const now = useNow();
  const scoped = useRoleTickets();
  const { openTicket } = useDetailParams();
  const [view, setView] = useState<View>(role === "front_office" || role === "duty_manager" ? "active" : "closed");
  const [dept, setDept] = useState("all");
  const [priority, setPriority] = useState<"all" | Priority>("all");
  const [q, setQ] = useState("");
  const tick = Math.floor(now / 10000);

  const list = useMemo(() => {
    const at = tick * 10000;
    const query = q.trim().toLowerCase();
    return scoped
      .filter((x) => {
        if (view === "active") return !isTicketClosed(x.status);
        if (view === "breached") return !isTicketClosed(x.status) && x.status !== "DITUNDA" && slaView(x, at).state === "breached";
        if (view === "waiting") return x.status === "DITUNDA";
        if (view === "closed") return isTicketClosed(x.status);
        return true;
      })
      .filter((x) => dept === "all" || x.dept === dept)
      .filter((x) => priority === "all" || x.priority === priority)
      .filter(
        (x) =>
          !query ||
          x.id.toLowerCase().includes(query) ||
          x.room.includes(query) ||
          x.taskTitle.toLowerCase().includes(query) ||
          (x.order?.id.toLowerCase().includes(query) ?? false)
      )
      .sort(view === "closed" ? (a, b) => b.sla.created_at.localeCompare(a.sla.created_at) : byUrgency(at));
  }, [scoped, view, dept, priority, q, tick]);

  const counts = useMemo(() => {
    const at = tick * 10000;
    return {
      active: scoped.filter((x) => !isTicketClosed(x.status)).length,
      breached: scoped.filter((x) => !isTicketClosed(x.status) && x.status !== "DITUNDA" && slaView(x, at).state === "breached").length,
      waiting: scoped.filter((x) => x.status === "DITUNDA").length,
      closed: scoped.filter((x) => isTicketClosed(x.status)).length,
    };
  }, [scoped, tick]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          label={t("q.status")}
          value={view}
          onChange={setView}
          size="sm"
          options={[
            { value: "active", label: t("tl2.active"), count: counts.active },
            { value: "breached", label: t("sla.breached"), count: counts.breached },
            { value: "waiting", label: t("st.waiting"), count: counts.waiting },
            { value: "closed", label: t("tl2.closed"), count: counts.closed },
            { value: "all", label: t("a.all") },
          ]}
        />
        <div className="ml-auto flex w-full flex-wrap gap-2 sm:w-auto">
          {seesEverything(role) && (
            <Select aria-label={t("q.department")} value={dept} onChange={(e) => setDept(e.target.value)} className="h-9 w-full sm:w-44">
              <option value="all">{t("fo.allDepts")}</option>
              {ALL_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {t(deptKey(d))}
                </option>
              ))}
            </Select>
          )}
          <Select aria-label={t("q.priority")} value={priority} onChange={(e) => setPriority(e.target.value as any)} className="h-9 w-full sm:w-36">
            <option value="all">{t("tl2.anyPriority")}</option>
            {(["EMERGENCY", "HIGH", "MEDIUM", "LOW"] as Priority[]).map((p) => (
              <option key={p} value={p}>
                {t(`pri.${p}` as any)}
              </option>
            ))}
          </Select>
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("tl2.search")} aria-label={t("tl2.search")} className="h-9 pl-9" />
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <TicketTable
          tickets={list}
          onOpen={openTicket}
          showDept={seesEverything(role)}
          empty={<EmptyState icon={<Inbox className="h-5 w-5" />} title={view === "breached" ? t("dm.noBreaches") : t("tl2.empty")} body={view === "breached" ? t("dm.noBreachesBody") : t("tl2.emptyBody")} />}
        />
      </Card>
      <p className="text-xs text-muted">{t("tl2.showing", { n: list.length })}</p>
    </div>
  );
}
