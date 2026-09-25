import { HotelRoom, ServiceTicket } from "../types";
import { STAFF } from "../data/staff";

/**
 * Simulasi operasional hotel untuk demo.
 *
 * Tiap detak: kadang permintaan baru masuk dari kamar berpenghuni, kadang
 * petugas lain menerima/mengerjakan/menyelesaikan tiket. Kamar 508 dan 812
 * tidak pernah disentuh — keduanya kamar yang dipakai presenter saat demo,
 * dan tiket yang dibuat presenter tidak pernah dimajukan otomatis.
 */

const DEMO_ROOMS = new Set(["508", "812"]);

type Template = { category: string; title: string; text: string; op: string; lang: string };

const TEMPLATES: Template[] = [
  { category: "towel", title: "Extra towels", text: "Could we have two more bath towels?", op: "Tambahan 2 handuk mandi.", lang: "English" },
  { category: "linen", title: "Extra pillow", text: "枕をもう一つお願いします。", op: "Tambahan 1 bantal.", lang: "Japanese" },
  { category: "cleaning", title: "Room cleaning", text: "Tolong bersihkan kamar ya, saya ke kolam renang.", op: "Make up room, tamu di kolam renang.", lang: "Bahasa Indonesia" },
  { category: "towel", title: "Extra water", text: "생수 두 병 더 주세요.", op: "Tambahan 2 botol air mineral.", lang: "Korean" },
  { category: "tv_wifi", title: "TV not working", text: "Der Fernseher geht nicht an.", op: "TV tidak menyala.", lang: "German" },
  { category: "towel", title: "Toiletries", text: "Pourrais-je avoir du shampooing ?", op: "Tambahan sampo.", lang: "French" },
  { category: "ac", title: "AC not cooling", text: "Кондиционер плохо охлаждает.", op: "AC kurang dingin.", lang: "Russian" },
  { category: "linen", title: "Extra blanket", text: "请再给我一条毯子。", op: "Tambahan 1 selimut.", lang: "Chinese" },
];

let templateIndex = 0;

export function runSimulationTick(ctx: {
  tickets: ServiceTicket[];
  rooms: HotelRoom[];
  createTicket: (data: any) => Promise<ServiceTicket>;
  acceptTicket: (id: string, staffName: string) => void;
  startTicket: (id: string, staffName: string) => void;
  completeTicket: (id: string, staffName: string) => void;
}) {
  const movable = ctx.tickets.filter(
    (t) =>
      !DEMO_ROOMS.has(t.room) &&
      (t.idempotency_key.startsWith("seed-") || t.idempotency_key.startsWith("sim-")) &&
      ["BARU", "DITERIMA", "DIKERJAKAN"].includes(t.status) &&
      t.category !== "dining" &&
      !t.isEmergency &&
      t.dept !== "Duty Manager"
  );

  if (Math.random() < 0.5 || movable.length === 0) {
    const occupied = ctx.rooms.filter((r) => r.guestName && !DEMO_ROOMS.has(r.roomNumber));
    if (occupied.length === 0) return;
    const room = occupied[Math.floor(Math.random() * occupied.length)];
    const tpl = TEMPLATES[templateIndex++ % TEMPLATES.length];
    ctx
      .createTicket({
        room: room.roomNumber,
        guestName: room.guestName,
        channel: "chat_ai",
        raw_text: tpl.text,
        category: tpl.category,
        taskTitle: tpl.title,
        originalLanguage: tpl.lang,
        translatedRequest: `${tpl.op} Kamar ${room.roomNumber}.`,
        // Tandai sebagai tiket simulasi supaya bisa dimajukan di detak berikutnya.
        idempotencyKey: `sim-${Date.now()}`,
      })
      .catch(() => {});
    return;
  }

  const ticket = movable.sort((a, b) => a.sla.created_at.localeCompare(b.sla.created_at))[0];
  const staff = STAFF.find((s) => s.dept === ticket.dept && s.onDuty);
  const name = ticket.assignedStaff || staff?.name || "Staff";
  if (ticket.status === "BARU") ctx.acceptTicket(ticket.id, name);
  else if (ticket.status === "DITERIMA") ctx.startTicket(ticket.id, name);
  else ctx.completeTicket(ticket.id, name);
}
