import { useMemo } from "react";
import { useApp } from "../../context/AppContext";
import { ServiceTicket, isTicketClosed } from "../../types";
import { categoryKey } from "../../lib/ticketView";
import type { TranslationKey } from "../../i18n";

/**
 * Tiket milik kamar tamu yang sedang masuk. Tiket eskalasi internal (dibuat
 * otomatis untuk Duty Manager setelah rating buruk) bukan permintaan tamu,
 * jadi tidak ditampilkan di sini.
 */
export function useGuestTickets() {
  const { tickets, guest } = useApp();
  return useMemo(() => {
    const mine = tickets
      .filter((t) => t.room === guest.roomNumber && !t.parent_ticket)
      .sort((a, b) => b.sla.created_at.localeCompare(a.sla.created_at));
    const active = mine.filter((t) => !isTicketClosed(t.status));
    const history = mine.filter((t) => isTicketClosed(t.status));
    const awaitingRating = history.filter((t) => t.status === "SELESAI" && !t.guest_score && !t.guest_rating);
    return { mine, active, history, awaitingRating };
  }, [tickets, guest.roomNumber]);
}

/** Judul permintaan dalam bahasa tamu: pesanan memakai nomor pesanan, lainnya kategori. */
export function guestTitle(t: (k: TranslationKey, v?: Record<string, string | number>) => string, ticket: ServiceTicket) {
  if (ticket.order) return t("g.orderTitle", { id: ticket.order.id });
  if (ticket.lateCheckout) return t("g.lateTitle", { hour: ticket.lateCheckout.hour });
  if (ticket.excursion) return t("g.exTitle", { place: ticket.excursion.place });
  return t(categoryKey(ticket.category));
}

/** Jam jemput mobil wisata dalam bahasa tamu: "Secepatnya", "Hari ini 14:00", "Besok 08:00". */
export function pickupLabel(t: (k: TranslationKey, v?: Record<string, string | number>) => string, ex: NonNullable<ServiceTicket["excursion"]>, now = new Date()) {
  if (ex.asap) return t("ex.sheet.asap");
  const at = new Date(ex.pickupAt);
  const time = `${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}`;
  return t(at.toDateString() === now.toDateString() ? "ex.sheet.today" : "ex.sheet.tomorrow", { time });
}

export function greetingKey(date = new Date()): TranslationKey {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "g.greeting.morning";
  if (h >= 12 && h < 18) return "g.greeting.afternoon";
  return "g.greeting.evening";
}

export const firstName = (name: string) => name.split(/\s+/)[0] || name;
