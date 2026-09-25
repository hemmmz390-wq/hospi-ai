import React, { useMemo, useState } from "react";
import { useApp } from "../../../context/AppContext";
import { useI18n } from "../../../i18n";
import { ServiceTicket } from "../../../types";
import { useNow } from "../../../lib/clock";
import { cn } from "../../../lib/cn";
import { Button, Card, Segmented } from "../../../components/ui";
import { SlaTimer } from "../../../components/domain";
import { isFresh, isToday, useDetailParams, useRoleTickets } from "../staffUtils";

type Column = "new" | "preparing" | "ready" | "delivered";

function columnOf(t: ServiceTicket): Column | null {
  if (t.status === "BARU" || t.status === "DITERIMA" || t.status === "DIALIHKAN") return "new";
  if (t.status === "DIKERJAKAN") return "preparing";
  if (t.status === "SIAP") return "ready";
  if ((t.status === "SELESAI" || t.status === "DIKONFIRMASI") && isToday(t.sla.created_at)) return "delivered";
  return null;
}

function OrderCard({ ticket, onOpen }: { ticket: ServiceTicket; onOpen: () => void }) {
  const { acceptTicket, startTicket, markOrderReady, completeTicket, currentStaff } = useApp();
  const { t, formatCurrency } = useI18n();
  const now = useNow();
  const me = currentStaff?.name || "Kitchen";
  const minutes = Math.max(0, Math.floor((now - new Date(ticket.sla.created_at).getTime()) / 60000));

  let action: React.ReactNode = null;
  if (ticket.status === "BARU") action = <Button size="sm" variant="primary" block onClick={() => acceptTicket(ticket.id, me)}>{t("tk.accept")}</Button>;
  else if (ticket.status === "DITERIMA" || ticket.status === "DIALIHKAN") action = <Button size="sm" variant="primary" block onClick={() => startTicket(ticket.id, me)}>{t("tk.startPreparing")}</Button>;
  else if (ticket.status === "DIKERJAKAN") action = <Button size="sm" variant="primary" block onClick={() => markOrderReady(ticket.id, me)}>{t("tk.markReady")}</Button>;
  else if (ticket.status === "SIAP") action = <Button size="sm" variant="secondary" block onClick={() => completeTicket(ticket.id, me)}>{t("tk.markDelivered")}</Button>;

  return (
    <Card as="li" className={cn("p-3.5", isFresh(ticket, now) && "animate-flash")}>
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold tabular-nums">{ticket.order?.id || ticket.id}</p>
            <p className="text-xs text-muted">
              {ticket.diningDestination === "table" ? t("tk.table", { n: ticket.tableNumber || "—" }) : t("search.room", { room: ticket.room })} · {t("kb.ago", { n: minutes })}
            </p>
          </div>
          {columnOf(ticket) !== "delivered" && <SlaTimer ticket={ticket} variant="cell" />}
        </div>
        <ul className="mt-3 space-y-1 text-[0.8125rem]">
          {ticket.order?.items.map((l) => (
            <li key={l.menuId} className="flex gap-2">
              <span className="w-6 shrink-0 font-semibold tabular-nums">{l.qty}×</span>
              <span className="min-w-0">{l.name}</span>
            </li>
          ))}
        </ul>
        {ticket.order?.notes && <p className="mt-2 rounded-md bg-warn-soft px-2 py-1 text-xs text-warn">{t("tk.kitchenNote")}: {ticket.order.notes}</p>}
        <div className="mt-3 flex items-center justify-between border-t border-line pt-2 text-xs">
          <span className="text-muted">{ticket.status === "DITERIMA" ? t("st.accepted") : t("kb.total")}</span>
          <span className="font-medium tabular-nums">{ticket.order ? formatCurrency(ticket.order.total) : "—"}</span>
        </div>
      </button>
      {action && <div className="mt-3">{action}</div>}
    </Card>
  );
}

/** Papan dapur: Baru → Disiapkan → Siap → Diantar. */
export function KitchenBoard() {
  const { t } = useI18n();
  const scoped = useRoleTickets();
  const { openTicket } = useDetailParams();
  const [mobileCol, setMobileCol] = useState<Column>("new");

  const cols = useMemo(() => {
    const out: Record<Column, ServiceTicket[]> = { new: [], preparing: [], ready: [], delivered: [] };
    for (const x of scoped.filter((x) => x.category === "dining")) {
      const c = columnOf(x);
      if (c) out[c].push(x);
    }
    (Object.keys(out) as Column[]).forEach((k) => out[k].sort((a, b) => (k === "delivered" ? b.sla.created_at.localeCompare(a.sla.created_at) : a.sla.created_at.localeCompare(b.sla.created_at))));
    out.delivered = out.delivered.slice(0, 8);
    return out;
  }, [scoped]);

  const labels: Record<Column, string> = { new: t("kb.new"), preparing: t("kb.preparing"), ready: t("kb.ready"), delivered: t("kb.delivered") };
  const hints: Record<Column, string> = { new: t("kb.newHint"), preparing: t("kb.preparingHint"), ready: t("kb.readyHint"), delivered: t("kb.deliveredHint") };

  const column = (c: Column) => (
    <section key={c} aria-labelledby={`col-${c}`} className="flex min-w-0 flex-col rounded-xl bg-sunken/60 p-2">
      <div className="flex items-baseline justify-between px-2 pb-2 pt-1">
        <h2 id={`col-${c}`} className="text-[0.8125rem] font-semibold">
          {labels[c]} <span className="font-normal tabular-nums text-muted">{cols[c].length}</span>
        </h2>
      </div>
      {cols[c].length === 0 ? (
        <p className="px-2 pb-4 pt-2 text-center text-xs text-subtle">{hints[c]}</p>
      ) : (
        <ul className="space-y-2">
          {cols[c].map((x) => (
            <OrderCard key={x.id} ticket={x} onOpen={() => openTicket(x.id)} />
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div className="space-y-4">
      <p className="text-[0.8125rem] text-muted">{t("kb.subtitle")}</p>
      <div className="md:hidden">
        <Segmented
          label={t("nav.orders")}
          value={mobileCol}
          onChange={setMobileCol}
          className="w-full"
          options={(Object.keys(labels) as Column[]).map((c) => ({ value: c, label: labels[c], count: cols[c].length }))}
        />
        <div className="mt-3">{column(mobileCol)}</div>
      </div>
      <div className="hidden gap-3 md:grid md:grid-cols-2 xl:grid-cols-4">{(Object.keys(labels) as Column[]).map(column)}</div>
    </div>
  );
}
