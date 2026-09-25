import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { Department, Role, ServiceTicket, isTicketClosed } from "../../types";
import { slaView } from "../../lib/ticketView";

export const ROLE_DEPT: Record<Exclude<Role, "tourist">, Department> = {
  front_office: "Front Office",
  housekeeping: "Housekeeping",
  maintenance: "Maintenance",
  duty_manager: "Duty Manager",
  food_beverage: "Food & Beverage",
};

/** FO dan DM melihat seluruh hotel. Departemen lain hanya pekerjaannya sendiri. */
export const seesEverything = (role: Role) => role === "front_office" || role === "duty_manager";

export function ticketsForRole(tickets: ServiceTicket[], role: Role): ServiceTicket[] {
  if (seesEverything(role)) return tickets;
  if (role === "food_beverage") return tickets.filter((t) => t.category === "dining" || t.dept === "Food & Beverage");
  const dept = ROLE_DEPT[role as Exclude<Role, "tourist">];
  return tickets.filter((t) => t.dept === dept);
}

/** Urutan antrean: darurat, lalu yang paling dekat/lewat batas SLA. */
export function byUrgency(now: number) {
  return (a: ServiceTicket, b: ServiceTicket) => {
    const ea = a.priority === "EMERGENCY" ? 0 : 1;
    const eb = b.priority === "EMERGENCY" ? 0 : 1;
    if (ea !== eb) return ea - eb;
    const ca = isTicketClosed(a.status) ? 1 : 0;
    const cb = isTicketClosed(b.status) ? 1 : 0;
    if (ca !== cb) return ca - cb;
    return slaView(a, now).remainingMs - slaView(b, now).remainingMs;
  };
}

export function useRoleTickets() {
  const { tickets, role } = useApp();
  return useMemo(() => ticketsForRole(tickets, role), [tickets, role]);
}

/** Panel detail tiket dan kamar dibuka lewat URL, jadi bisa dibagikan dan tombol Back bekerja. */
export function useDetailParams() {
  const [params, setParams] = useSearchParams();
  const ticketId = params.get("ticket");
  const roomNo = params.get("room");
  const open = useCallback(
    (key: "ticket" | "room", value: string | null) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("ticket");
          next.delete("room");
          if (value) next.set(key, value);
          return next;
        },
        { replace: false }
      );
    },
    [setParams]
  );
  return {
    ticketId,
    roomNo,
    openTicket: (id: string | null) => open("ticket", id),
    openRoom: (no: string | null) => open("room", no),
  };
}

export const isToday = (iso: string) => {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
};

/** Tiket dianggap "baru masuk" selama 12 detik: dipakai untuk sorotan halus di antrean. */
export const isFresh = (t: ServiceTicket, now: number) => now - new Date(t.sla.created_at).getTime() < 12000;
