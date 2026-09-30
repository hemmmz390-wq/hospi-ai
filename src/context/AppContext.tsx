import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  AppNotification,
  ChatMessage,
  Department,
  DiningDestination,
  EscalationReason,
  EscalationSession,
  FoodMenuItem,
  FolioCharge,
  GuestInfo,
  HotelRoom,
  Language,
  PmsConnection,
  Priority,
  PrivacyLogEntry,
  Role,
  ServiceTicket,
  StaffMember,
  TicketStatus,
  TimelineEntry,
  UpsellOffer,
  isTicketClosed,
  Attraction,
} from "../types";
import { SUPPORTED_LANGUAGES } from "../data/mockData";
import { FOOD_MENU } from "../data/menu";
import { LATE_CHECKOUT_OPTIONS, STANDARD_CHECKOUT, slaConfigFor } from "../data/sla";
import { DEFAULT_STAFF_FOR_ROLE, STAFF } from "../data/staff";
import { UPSELL_OFFERS, pickContextualOffers } from "../data/upsellOffers";
import { useI18n, Locale } from "../i18n";
import { LOCALES } from "../i18n/types";
import { aiService } from "../services/aiService";
import { pmsService, posService, privacyService, systemService, SystemHealth, ticketSync } from "../services/integrationServices";
import { Session, sessionService } from "../services/sessionService";
import { KEYS, freshDemoData, loadDemoData, nextNumber, readJson, writeJson } from "./persistence";
import { SyncStatus, useServerSync, writeEpoch } from "./syncEngine";
import { runSimulationTick } from "./simulation";

export interface Toast {
  id: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
}

type StaffRole = Exclude<Role, "tourist">;

export type LateCheckoutRequest = {
  ticket: ServiceTicket;
  hour: string;
  fee: number;
  status: "pending" | "approved" | "declined";
};

export type ExcursionRequest = {
  place: Attraction;
  pickupAt: Date;
  asap: boolean;
  people: number;
  assist: boolean;
  note?: string;
};

type CreateTicketInput = {
  room: string;
  guestName: string;
  channel: ServiceTicket["channel"];
  raw_text: string;
  category: string;
  taskTitle: string;
  qty?: number;
  confidence?: number;
  dept?: Department;
  priority?: Priority;
  severity?: "Ringan" | "Sedang" | "Berat";
  originalLanguage?: string;
  translatedRequest?: string;
  isEmergency?: boolean;
  isAngryComplaint?: boolean;
  diningDestination?: DiningDestination;
  tableNumber?: string;
  order?: ServiceTicket["order"];
  lateCheckout?: ServiceTicket["lateCheckout"];
  bellboy?: ServiceTicket["bellboy"];
  excursion?: ServiceTicket["excursion"];
  emergencyType?: ServiceTicket["emergencyType"];
  /** Dipakai simulasi untuk menandai tiketnya sendiri. */
  idempotencyKey?: string;
};

interface AppContextType {
  // ---------- Sesi ----------
  role: Role;
  setRole: (r: Role) => void;
  guest: GuestInfo;
  setGuestRoom: (roomNumber: string) => void;
  hasCheckedIn: boolean;
  sessionKind: "guest" | "staff";
  currentStaff: StaffMember | null;
  signInAsStaff: (role?: StaffRole, staffId?: string) => void;
  checkInToRoom: (roomNumber: string) => boolean;
  signOutRoom: () => void;
  setGuestLanguage: (lang: Language) => void;

  // ---------- Data ----------
  tickets: ServiceTicket[];
  rooms: HotelRoom[];
  notifications: AppNotification[];
  foodMenu: FoodMenuItem[];
  chatMessages: ChatMessage[];
  chatsByRoom: Record<string, ChatMessage[]>;
  selectedTicket: ServiceTicket | null;
  setSelectedTicket: (t: ServiceTicket | null) => void;
  isAiProcessing: boolean;
  health: SystemHealth | null;

  // ---------- Umpan balik ----------
  toasts: Toast[];
  showToast: (msg: string, type?: Toast["type"]) => void;
  dismissToast: (id: string) => void;
  isAlarmMuted: boolean;
  setIsAlarmMuted: (muted: boolean) => void;
  playAlertSound: () => void;
  markNotificationsRead: (ids?: string[]) => void;

  // ---------- Siklus tiket ----------
  createTicket: (data: CreateTicketInput) => Promise<ServiceTicket>;
  acceptTicket: (ticketId: string, staffName: string) => void;
  startTicket: (ticketId: string, staffName: string, photoBefore?: string) => void;
  completeTicket: (ticketId: string, staffName: string, proof?: { photo_after?: string; note?: string; spareparts?: string[] }) => void;
  /** Rating 1–5 (atau jempol, untuk kompatibilitas). Nilai ≤2 memicu eskalasi ke Duty Manager. */
  rateAndConfirmTicket: (ticketId: string, rating: "thumbs_up" | "thumbs_down" | number, comment?: string) => void;
  deferTicket: (ticketId: string, reason: string, promisedAt: string, staffName: string) => void;
  resumeTicket: (ticketId: string, staffName: string) => void;
  transferTicket: (ticketId: string, newDept: Department, reason: string, transferredBy: string) => void;
  cancelTicket: (ticketId: string, reason: string, cancelledBy: string) => void;
  changeTicketPriority: (ticketId: string, priority: Priority) => void;
  changeTicketAssignee: (ticketId: string, assignee: string) => void;
  mergeDuplicateTickets: (primaryId: string, duplicateId: string) => void;
  updateRoomStatus: (roomNumber: string, status: HotelRoom["status"]) => void;
  addTicketNote: (ticketId: string, note: string, author: string) => void;
  getBreachedCount: () => number;
  getApproachingSlaCount: () => number;

  // ---------- Layanan tamu ----------
  sendChatMessage: (text: string, voiceMeta?: { isVoiceMessage?: boolean; audioDurationSec?: number; audioUrl?: string }) => Promise<ChatMessage | null>;
  quickOrderFood: (
    cart: Array<{ item: FoodMenuItem; quantity: number }>,
    specialNotes?: string,
    destination?: DiningDestination,
    tableNumber?: string
  ) => Promise<ServiceTicket | undefined>;
  confirmOrderDraft: (messageId: string, notes?: string) => Promise<ServiceTicket | undefined>;
  assignTableNumber: () => string;
  markOrderReady: (ticketId: string, readyBy: string) => void;
  requestLateCheckout: (requestedHour: string, reason?: string) => Promise<void>;
  lateCheckoutRequest: LateCheckoutRequest | null;
  approveLateCheckout: (ticketId: string, staffName: string) => void;
  declineLateCheckout: (ticketId: string, staffName: string, reason: string) => void;
  requestExcursion: (req: ExcursionRequest) => Promise<ServiceTicket>;
  requestBellboy: (service: NonNullable<ServiceTicket["bellboy"]>["service"], note?: string) => Promise<ServiceTicket>;
  reportEmergency: (type: NonNullable<ServiceTicket["emergencyType"]>, note?: string) => Promise<ServiceTicket>;

  // ---------- Upselling ----------
  upsellCatalogue: UpsellOffer[];
  suggestOffersAfterOrder: (ticket: ServiceTicket) => void;
  acceptOffer: (offer: UpsellOffer) => Promise<void>;
  declineOffer: (messageId: string, offerId: string) => void;

  // ---------- Eskalasi ke manusia ----------
  escalation: EscalationSession | null;
  escalations: EscalationSession[];
  escalateToHuman: (reason: EscalationReason, note: string) => void;
  claimEscalation: (agentName: string, room?: string) => void;
  sendAgentReply: (text: string, agentName: string, room?: string) => void;
  resolveEscalation: (agentName: string, room?: string) => void;

  // ---------- PMS / POS ----------
  integrations: PmsConnection[];
  folioCharges: FolioCharge[];
  refreshIntegrations: () => Promise<void>;
  chargeToFolio: (input: { description: string; itemCode: string; amount: number; ticketId?: string; room?: string }) => Promise<FolioCharge | null>;

  // ---------- Privasi ----------
  privacyLog: PrivacyLogEntry[];
  anonymizeGuestHistory: (room: string) => Promise<void>;
  refreshPrivacyLog: () => Promise<void>;
  logContactReveal: (room: string, staffName: string) => void;

  /** Berapa tawaran pernah ditampilkan ke tamu dan berapa yang dipesan. */
  offerStats: { shown: number; accepted: number };

  // ---------- Demo ----------
  /** Status koneksi ke sync hub: live, menyambung, atau offline. */
  syncStatus: SyncStatus;
  simulationEnabled: boolean;
  setSimulationEnabled: (on: boolean) => void;
  resetSimulationData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const clock = () => new Date();
const hhmm = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function entry(ev: TimelineEntry["ev"], by: string, note?: string): TimelineEntry {
  const d = clock();
  return { id: `tl-${d.getTime()}-${Math.random().toString(36).slice(2, 6)}`, at: hhmm(d), ts: d.toISOString(), ev, by, note };
}

const ROLE_FOR_DEPT: Record<Department, AppNotification["targetRole"]> = {
  Housekeeping: "housekeeping",
  Maintenance: "maintenance",
  "Front Office": "front_office",
  "Duty Manager": "duty_manager",
  "Food & Beverage": "food_beverage",
};

const languageFor = (code: string): Language =>
  SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[1];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { locale, setLocale, t, formatCurrency } = useI18n();

  // ============================================================
  // Data & persistensi
  // ============================================================
  const [boot] = useState(loadDemoData);
  const [tickets, setTickets] = useState<ServiceTicket[]>(boot.tickets);
  const [rooms, setRooms] = useState<HotelRoom[]>(boot.rooms);
  const [notifications, setNotifications] = useState<AppNotification[]>(boot.notifications);
  const [chatsByRoom, setChatsByRoom] = useState<Record<string, ChatMessage[]>>(boot.chats);
  const [escalations, setEscalations] = useState<EscalationSession[]>(boot.escalations);

  useEffect(() => writeJson(KEYS.tickets, tickets), [tickets]);
  useEffect(() => writeJson(KEYS.rooms, rooms), [rooms]);
  useEffect(() => writeJson(KEYS.notifications, notifications), [notifications]);
  useEffect(() => writeJson(KEYS.chats, chatsByRoom), [chatsByRoom]);
  useEffect(() => writeJson(KEYS.escalations, escalations), [escalations]);

  // Sinkronisasi antar-perangkat (dan antar-tab) lewat server. Tamu di HP,
  // Front Office di laptop: laporan tamu muncul di dashboard dalam 1–2 detik.
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("connecting");
  const { pushReset } = useServerSync(
    {
      tickets,
      rooms,
      notifications,
      escalations,
      chats: chatsByRoom,
      setTickets,
      setRooms,
      setNotifications,
      setEscalations,
      setChats: setChatsByRoom,
    },
    setSyncStatus
  );

  // Nomor tiket/pesanan berikutnya. Ref menjaga dua permintaan beruntun tidak
  // mendapat nomor yang sama sebelum state sempat diperbarui.
  const lastTicketNo = useRef(0);
  const lastOrderNo = useRef(0);
  const allocateTicketId = () => {
    const n = Math.max(lastTicketNo.current + 1, nextNumber(tickets.map((x) => x.id), "HOS-", 1048));
    lastTicketNo.current = n;
    return `HOS-${n}`;
  };
  const allocateOrderId = () => {
    const n = Math.max(lastOrderNo.current + 1, nextNumber(tickets.map((x) => x.order?.id), "ORD-", 2048));
    lastOrderNo.current = n;
    return `ORD-${n}`;
  };

  // ============================================================
  // Sesi
  // ============================================================
  const [session, setSession] = useState<Session | null>(() => sessionService.load());
  const [staffRoleOverride, setStaffRoleOverride] = useState<StaffRole | null>(null);
  const [guestRoom, setGuestRoomState] = useState<string>(() => {
    const s = sessionService.load();
    return s?.kind === "guest" ? s.room : "812";
  });

  const hasCheckedIn = session !== null;
  const sessionKind: "guest" | "staff" = session?.kind === "staff" ? "staff" : "guest";
  const role: Role = session?.kind === "staff" ? staffRoleOverride || session.role : "tourist";
  const currentStaff = useMemo<StaffMember | null>(() => {
    if (session?.kind !== "staff") return null;
    const effectiveRole = staffRoleOverride || session.role;
    const byId = STAFF.find((s) => s.id === session.staffId && s.role === effectiveRole);
    return byId || STAFF.find((s) => s.id === DEFAULT_STAFF_FOR_ROLE[effectiveRole]) || null;
  }, [session, staffRoleOverride]);

  const setRole = useCallback(
    (r: Role) => {
      if (r === "tourist" || session?.kind !== "staff") return;
      const staffId = DEFAULT_STAFF_FOR_ROLE[r];
      const next: Session = { kind: "staff", role: r, staffId };
      setStaffRoleOverride(null);
      setSession(next);
      sessionService.save(next);
    },
    [session]
  );

  const signInAsStaff = useCallback((r: StaffRole = "front_office", staffId?: string) => {
    const next: Session = { kind: "staff", role: r, staffId: staffId || DEFAULT_STAFF_FOR_ROLE[r] };
    setStaffRoleOverride(null);
    setSession(next);
    sessionService.save(next);
  }, []);

  /**
   * Nomor kamar divalidasi ke daftar kamar. Nomor yang salah akan membuat
   * seluruh permintaan tamu ini mendarat di kamar orang lain.
   */
  const checkInToRoom = useCallback(
    (roomNumber: string) => {
      const trimmed = roomNumber.trim();
      const room = rooms.find((r) => r.roomNumber === trimmed);
      if (!room || !room.guestName) return false;
      setGuestRoomState(trimmed);
      const next: Session = { kind: "guest", room: trimmed };
      setSession(next);
      sessionService.save(next);
      // Bahasa profil tamu dipakai hanya bila tamu belum memilih bahasa sendiri.
      let chosen: string | null = null;
      try {
        chosen = localStorage.getItem("hospi_locale_v1");
      } catch {
        /* abaikan */
      }
      if (!chosen && room.guestLocale && (LOCALES as readonly string[]).includes(room.guestLocale)) {
        setLocale(room.guestLocale as Locale);
      }
      return true;
    },
    [rooms, setLocale]
  );

  const signOutRoom = useCallback(() => {
    setSession(null);
    setStaffRoleOverride(null);
    sessionService.clear();
  }, []);

  /** Hanya untuk staf/demo: melihat aplikasi dari sudut pandang kamar lain. */
  const setGuestRoom = useCallback((roomNumber: string) => setGuestRoomState(roomNumber), []);

  const setGuestLanguage = useCallback((lang: Language) => setLocale(lang.code as Locale), [setLocale]);

  // ============================================================
  // Toast, alarm, notifikasi
  // ============================================================
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4500);
  }, []);
  const dismissToast = useCallback((id: string) => setToasts((prev) => prev.filter((x) => x.id !== id)), []);

  const [isAlarmMuted, setIsAlarmMutedState] = useState<boolean>(() => readJson(KEYS.alarmMuted, false));
  const setIsAlarmMuted = useCallback((m: boolean) => {
    setIsAlarmMutedState(m);
    writeJson(KEYS.alarmMuted, m);
  }, []);

  const playAlertSound = useCallback(() => {
    if (isAlarmMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      /* browser menolak audio sebelum ada interaksi */
    }
  }, [isAlarmMuted]);

  const notify = useCallback((n: Omit<AppNotification, "id" | "timestamp" | "read"> & { id?: string }) => {
    setNotifications((prev) => {
      if (n.id && prev.some((x) => x.id === n.id)) return prev;
      return [{ ...n, id: n.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: new Date().toISOString(), read: false }, ...prev].slice(0, 200);
    });
  }, []);

  const markNotificationsRead = useCallback((ids?: string[]) => {
    setNotifications((prev) => prev.map((n) => (!ids || ids.includes(n.id) ? { ...n, read: true } : n)));
  }, []);

  // ============================================================
  // Tamu yang sedang aktif
  // ============================================================
  const guestRoomData = rooms.find((r) => r.roomNumber === guestRoom);

  const lateCheckoutRequest = useMemo<LateCheckoutRequest | null>(() => {
    const latest = tickets
      .filter((x) => x.room === guestRoom && x.lateCheckout)
      .sort((a, b) => b.sla.created_at.localeCompare(a.sla.created_at))[0];
    if (!latest || !latest.lateCheckout) return null;
    const status: LateCheckoutRequest["status"] =
      latest.status === "DIBATALKAN" ? "declined" : isTicketClosed(latest.status) ? "approved" : "pending";
    return { ticket: latest, hour: latest.lateCheckout.hour, fee: latest.lateCheckout.fee, status };
  }, [tickets, guestRoom]);

  const guest = useMemo<GuestInfo>(() => {
    const approved = lateCheckoutRequest?.status === "approved";
    return {
      roomNumber: guestRoom,
      name: guestRoomData?.guestName || `Room ${guestRoom}`,
      language: languageFor(locale),
      token: `tok_room_${guestRoom}`,
      roomType: guestRoomData?.roomType,
      checkInDate: guestRoomData?.checkInDate,
      checkOutDate: guestRoomData?.checkOutDate,
      checkOutTime: approved ? lateCheckoutRequest!.hour : STANDARD_CHECKOUT,
      lateCheckoutGranted: approved,
      lateCheckoutTime: approved ? lateCheckoutRequest!.hour : undefined,
      phone: guestRoomData?.guestPhone,
      email: guestRoomData?.guestEmail,
      nationality: guestRoomData?.nationality,
    };
  }, [guestRoom, guestRoomData, locale, lateCheckoutRequest]);

  // ============================================================
  // Chat per kamar
  // ============================================================
  const welcome: ChatMessage = useMemo(
    () => ({
      id: "msg-welcome",
      sender: "ai",
      text: t("chat.welcome", { guest: guest.name.split(" ")[0], room: guest.roomNumber }),
      timestamp: "",
    }),
    [t, guest.name, guest.roomNumber]
  );
  const chatMessages = useMemo(() => [welcome, ...(chatsByRoom[guestRoom] || [])], [welcome, chatsByRoom, guestRoom]);

  const appendChat = useCallback((room: string, ...msgs: ChatMessage[]) => {
    setChatsByRoom((prev) => ({ ...prev, [room]: [...(prev[room] || []), ...msgs] }));
  }, []);
  const updateChat = useCallback((room: string, fn: (m: ChatMessage) => ChatMessage) => {
    setChatsByRoom((prev) => ({ ...prev, [room]: (prev[room] || []).map(fn) }));
  }, []);

  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);
  // Panel detail memegang salinan tiket; tanpa sinkronisasi ini panel membeku
  // setelah aksi dan tombolnya terasa "tidak bisa dipencet".
  useEffect(() => {
    if (!selectedTicket) return;
    const fresh = tickets.find((x) => x.id === selectedTicket.id);
    if (!fresh) setSelectedTicket(null);
    else if (fresh !== selectedTicket) setSelectedTicket(fresh);
  }, [tickets, selectedTicket]);

  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // ============================================================
  // Integrasi & privasi
  // ============================================================
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [integrations, setIntegrations] = useState<PmsConnection[]>([]);
  const [folioCharges, setFolioCharges] = useState<FolioCharge[]>([]);
  const [serverPrivacyLog, setServerPrivacyLog] = useState<PrivacyLogEntry[]>([]);
  const [localPrivacyLog, setLocalPrivacyLog] = useState<PrivacyLogEntry[]>(() => readJson(KEYS.privacyLocal, []));
  useEffect(() => writeJson(KEYS.privacyLocal, localPrivacyLog), [localPrivacyLog]);
  const privacyLog = useMemo(
    () => [...localPrivacyLog, ...serverPrivacyLog].sort((a, b) => b.at.localeCompare(a.at)),
    [localPrivacyLog, serverPrivacyLog]
  );

  useEffect(() => {
    systemService.health().then(setHealth);
  }, []);

  const refreshIntegrations = useCallback(async () => {
    try {
      setIntegrations(await pmsService.connections());
    } catch {
      setIntegrations((prev) => prev.map((c) => ({ ...c, status: "disconnected" as const })));
    }
  }, []);

  useEffect(() => {
    refreshIntegrations();
  }, [refreshIntegrations]);

  useEffect(() => {
    pmsService.folio(guestRoom).then(setFolioCharges).catch(() => {});
  }, [guestRoom]);

  const chargeToFolio = useCallback(
    async (input: { description: string; itemCode: string; amount: number; ticketId?: string; room?: string }) => {
      try {
        const charge = await posService.charge({ ...input, room: input.room || guestRoom });
        if ((input.room || guestRoom) === guestRoom) setFolioCharges((prev) => [charge, ...prev]);
        return charge;
      } catch {
        showToast(t("toast.posFailed"), "error");
        return null;
      }
    },
    [guestRoom, showToast, t]
  );

  const refreshPrivacyLog = useCallback(async () => {
    try {
      setServerPrivacyLog(await privacyService.log());
    } catch {
      /* biarkan data lama */
    }
  }, []);
  useEffect(() => {
    refreshPrivacyLog();
  }, [refreshPrivacyLog]);

  const logContactReveal = useCallback((room: string, staffName: string) => {
    setLocalPrivacyLog((prev) => [
      { id: `pl-local-${Date.now()}`, at: new Date().toISOString(), action: "pii_viewed" as const, scope: `room ${room}`, detail: `Contact details revealed by ${staffName}` },
      ...prev,
    ].slice(0, 100));
  }, []);

  // ============================================================
  // Upselling
  // ============================================================
  const OFFER_COOLDOWN_MS = 5 * 60 * 1000;
  const lastOfferAtRef = useRef(0);
  // Angka awal adalah bagian dari data demo, supaya konversi tidak kosong saat demo dimulai.
  const [offerStats, setOfferStats] = useState<{ shown: number; accepted: number }>(() => readJson(KEYS.offerStats, { shown: 18, accepted: 4 }));
  useEffect(() => writeJson(KEYS.offerStats, offerStats), [offerStats]);
  const countShown = useCallback((n: number) => n > 0 && setOfferStats((s) => ({ ...s, shown: s.shown + n })), []);

  const escalationFor = useCallback(
    (room: string) => escalations.find((e) => e.room === room && e.status !== "selesai") || null,
    [escalations]
  );
  const escalation = useMemo(
    () => escalationFor(guestRoom) || [...escalations].reverse().find((e) => e.room === guestRoom) || null,
    [escalationFor, escalations, guestRoom]
  );

  /**
   * Menawarkan 1–2 layanan relevan setelah tamu memesan. Semua pengaman ada di
   * sini: tidak saat percakapan dipegang staf, tidak untuk darurat/komplain,
   * tidak kategori yang baru dipesan, dan tidak lebih dari sekali per 5 menit.
   */
  const suggestOffersAfterOrder = useCallback(
    (ticket: ServiceTicket) => {
      if (escalationFor(ticket.room)) return;
      if (ticket.isEmergency || ticket.isAngryComplaint) return;
      if (Date.now() - lastOfferAtRef.current < OFFER_COOLDOWN_MS) return;

      // Pesanan makanan tanpa pencuci mulut: tawaran paling wajar adalah
      // pencuci mulut, bukan tur atau spa. Ditampilkan sebagai draf pesanan
      // yang harus dikonfirmasi tamu sendiri.
      if (ticket.order) {
        const hasDessert = ticket.order.items.some((l) => FOOD_MENU.find((m) => m.id === l.menuId)?.category === "dessert");
        const hasMeal = ticket.order.items.some((l) => ["breakfast", "main", "snacks"].includes(FOOD_MENU.find((m) => m.id === l.menuId)?.category || ""));
        if (!hasDessert && hasMeal) {
          lastOfferAtRef.current = Date.now();
          countShown(1);
          appendChat(ticket.room, {
            id: `msg-dessert-${Date.now()}`,
            sender: "ai",
            text: t("g.food.dessertPrompt"),
            timestamp: hhmm(clock()),
            orderDraft: { items: [{ menuId: "fm-7", qty: 1 }] },
          });
        }
        return;
      }

      const offers = pickContextualOffers({
        category: ticket.category,
        message: ticket.raw_text,
        isEmergency: ticket.isEmergency,
        isAngryComplaint: ticket.isAngryComplaint,
        limit: 2,
        fallbackWhenNoMatch: true,
      });
      if (offers.length === 0) return;
      lastOfferAtRef.current = Date.now();
      countShown(offers.length);
      appendChat(ticket.room, {
        id: `msg-upsell-${Date.now()}`,
        sender: "ai",
        text: t("offer.afterOrder"),
        timestamp: hhmm(clock()),
        offers,
      });
    },
    [escalationFor, appendChat, t, countShown]
  );

  // ============================================================
  // Siklus tiket
  // ============================================================
  const patchTicket = useCallback((ticketId: string, fn: (x: ServiceTicket) => ServiceTicket) => {
    setTickets((prev) =>
      prev.map((x) => {
        if (x.id !== ticketId) return x;
        return fn(x);
      })
    );
  }, []);

  const createTicket = useCallback(
    async (data: CreateTicketInput): Promise<ServiceTicket> => {
      const config = slaConfigFor(data.category);
      const confidence = data.confidence ?? 0.95;
      const needsFoReview = confidence < 0.8;
      const dept = needsFoReview ? "Front Office" : data.dept || config.dept;
      const priority: Priority = data.isEmergency
        ? "EMERGENCY"
        : data.isAngryComplaint
          ? "HIGH"
          : data.priority || config.priority || "MEDIUM";
      const now = clock();
      const id = allocateTicketId();

      let ticket: ServiceTicket = {
        id,
        room: data.room,
        roomNumber: data.room,
        guestName: data.guestName,
        channel: data.channel,
        raw_text: data.raw_text,
        originalRequest: data.raw_text,
        category: data.category,
        taskTitle: data.taskTitle,
        qty: data.qty || 1,
        confidence,
        needsFoReview,
        dept,
        assignedDepartment: dept,
        priority,
        status: "BARU",
        severity: data.severity,
        isEmergency: data.isEmergency,
        isAngryComplaint: data.isAngryComplaint,
        diningDestination: data.diningDestination,
        tableNumber: data.tableNumber,
        order: data.order,
        lateCheckout: data.lateCheckout,
        bellboy: data.bellboy,
        excursion: data.excursion,
        emergencyType: data.emergencyType,
        sla: {
          ack_min: config.ackMin,
          done_min: config.doneMin,
          created_at: now.toISOString(),
          ack_due_at: new Date(now.getTime() + config.ackMin * 60000).toISOString(),
          due_at: new Date(now.getTime() + config.doneMin * 60000).toISOString(),
        },
        timeline: [entry("dibuat", data.channel === "chat_ai" ? "bot" : "tamu", data.channel === "chat_ai" ? `AI confidence ${Math.round(confidence * 100)}%` : undefined)],
        idempotency_key: data.idempotencyKey || `${data.room}-${data.category}-${now.getHours()}${now.getMinutes()}`,
        translatedRequest: data.translatedRequest || `${data.taskTitle} — Kamar ${data.room}: "${data.raw_text}"`,
        originalLanguage: data.originalLanguage || languageFor(locale).name,
        createdAtTime: hhmm(now),
      };

      // Server memeriksa permintaan ganda (kamar & kategori sama dalam 10 menit).
      const synced = await ticketSync.create(ticket);
      if (synced?.merged && synced.data) {
        const merged = synced.data;
        setTickets((prev) => prev.map((x) => (x.id === merged.id ? merged : x)));
        showToast(t("toast.merged", { id: merged.id }), "info");
        return merged;
      }

      // Server bisa memberi nomor lain bila nomor ini sudah dipakai perangkat lain.
      if (synced?.data && (synced.data.id !== ticket.id || synced.data.order?.id !== ticket.order?.id)) {
        ticket = synced.data;
        lastTicketNo.current = Math.max(lastTicketNo.current, Number(ticket.id.replace("HOS-", "")) || 0);
      }
      setTickets((prev) => [ticket, ...prev.filter((x) => x.id !== ticket.id)]);

      const title = ticket.order ? ticket.order.id : ticket.id;
      if (ticket.isEmergency) {
        notify({ title: "Emergency", message: `${title} · ${ticket.room}`, priority: "EMERGENCY", targetRole: "front_office", ticketId: ticket.id, roomNumber: ticket.room, type: "emergency" });
        notify({ title: "Emergency", message: `${title} · ${ticket.room}`, priority: "EMERGENCY", targetRole: "duty_manager", ticketId: ticket.id, roomNumber: ticket.room, type: "emergency" });
      } else {
        notify({ title: "New request", message: `${title} · ${ticket.room} · ${ticket.taskTitle}`, priority: ticket.priority, targetRole: ROLE_FOR_DEPT[ticket.dept], ticketId: ticket.id, roomNumber: ticket.room, type: "new_ticket" });
      }
      return ticket;
    },
    // allocateTicketId membaca `tickets`
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tickets, locale, notify, showToast, t]
  );

  const acceptTicket = useCallback(
    (ticketId: string, staffName: string) => {
      patchTicket(ticketId, (x) => ({ ...x, status: "DITERIMA", assignee: staffName, assignedStaff: staffName, timeline: [...x.timeline, entry("diterima", staffName)] }));
      showToast(t("toast.accepted", { id: ticketId }), "info");
    },
    [patchTicket, showToast, t]
  );

  const startTicket = useCallback(
    (ticketId: string, staffName: string, photoBefore?: string) => {
      patchTicket(ticketId, (x) => ({
        ...x,
        status: "DIKERJAKAN",
        assignee: x.assignee || staffName,
        assignedStaff: x.assignedStaff || staffName,
        proof: { ...x.proof, photo_before: photoBefore || x.proof?.photo_before || null },
        timeline: [...x.timeline, entry("dikerjakan", staffName)],
      }));
      showToast(t("toast.started", { id: ticketId }), "info");
    },
    [patchTicket, showToast, t]
  );

  const completeTicket = useCallback(
    (ticketId: string, staffName: string, proof?: { photo_after?: string; note?: string; spareparts?: string[] }) => {
      const now = clock();
      patchTicket(ticketId, (x) => {
        const duration = Math.max(1, Math.round((now.getTime() - new Date(x.sla.created_at).getTime()) / 60000));
        return {
          ...x,
          status: "SELESAI",
          completedAtTime: hhmm(now),
          totalDurationMin: duration,
          proof: {
            ...x.proof,
            photo_after: proof?.photo_after || x.proof?.photo_after || null,
            note: proof?.note || x.proof?.note || null,
            spareparts: proof?.spareparts || x.proof?.spareparts || null,
          },
          timeline: [...x.timeline, entry("selesai", staffName, proof?.note)],
        };
      });
      showToast(t("toast.completed", { id: ticketId }), "success");
    },
    [patchTicket, showToast, t]
  );

  const rateAndConfirmTicket = useCallback(
    (ticketId: string, rating: "thumbs_up" | "thumbs_down" | number, comment?: string) => {
      const target = tickets.find((x) => x.id === ticketId);
      if (!target) return;
      const score = typeof rating === "number" ? Math.min(5, Math.max(1, Math.round(rating))) : rating === "thumbs_up" ? 5 : 1;
      const thumbs: "thumbs_up" | "thumbs_down" = score <= 2 ? "thumbs_down" : "thumbs_up";

      if (thumbs === "thumbs_down") {
        // Rating buruk: tiket dibuka kembali sebagai eskalasi ke Duty Manager,
        // lengkap dengan seluruh riwayat tiket aslinya.
        const reopenedId = allocateTicketId();
        const now = clock();
        const complaintSla = slaConfigFor("complaint");
        const reopened: ServiceTicket = {
          ...target,
          id: reopenedId,
          parent_ticket: target.id,
          taskTitle: `Escalation: ${target.taskTitle}`,
          priority: "HIGH",
          dept: "Duty Manager",
          assignedDepartment: "Duty Manager",
          status: "BARU",
          assignee: undefined,
          assignedStaff: undefined,
          guest_rating: "thumbs_down",
          guest_score: score,
          rating_comment: comment,
          sla: {
            ack_min: complaintSla.ackMin,
            done_min: complaintSla.doneMin,
            created_at: now.toISOString(),
            ack_due_at: new Date(now.getTime() + complaintSla.ackMin * 60000).toISOString(),
            due_at: new Date(now.getTime() + complaintSla.doneMin * 60000).toISOString(),
          },
          timeline: [...target.timeline, entry("komplain", "tamu", `Rating ${score}/5 · automatic escalation to Duty Manager${comment ? ` · “${comment}”` : ""}`)],
          idempotency_key: `${target.room}-escalation-${now.getTime()}`,
          createdAtTime: hhmm(now),
          completedAtTime: undefined,
          totalDurationMin: undefined,
          order: undefined,
        };
        setTickets((prev) => [
          reopened,
          ...prev.map((x) =>
            x.id === ticketId
              ? { ...x, guest_rating: thumbs, guest_score: score, rating_comment: comment, status: "DIKONFIRMASI" as TicketStatus, timeline: [...x.timeline, entry("dikonfirmasi", "tamu", `Rating ${score}/5`)] }
              : x
          ),
        ]);
        notify({ title: "Low rating", message: `${target.id} · ${target.room} · ${score}/5`, priority: "HIGH", targetRole: "duty_manager", ticketId: reopenedId, roomNumber: target.room, type: "rating" });
        notify({ title: "Low rating", message: `${target.id} · ${target.room} · ${score}/5`, priority: "HIGH", targetRole: "front_office", ticketId: reopenedId, roomNumber: target.room, type: "rating" });
      } else {
        patchTicket(ticketId, (x) => ({
          ...x,
          status: "DIKONFIRMASI",
          guest_rating: thumbs,
          guest_score: score,
          rating_comment: comment,
          timeline: [...x.timeline, entry("dikonfirmasi", "tamu", `Rating ${score}/5`)],
        }));
      }
      showToast(t("toast.ratingThanks"), "success");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tickets, notify, patchTicket, showToast, t]
  );

  const deferTicket = useCallback(
    (ticketId: string, reason: string, promisedAt: string, staffName: string) => {
      const target = tickets.find((x) => x.id === ticketId);
      patchTicket(ticketId, (x) => ({
        ...x,
        status: "DITUNDA",
        defer: { reason, promised_at: promisedAt, deferred_by: staffName },
        timeline: [...x.timeline, entry("ditunda", staffName, promisedAt && promisedAt !== "—" ? `${reason} · ${promisedAt}` : reason)],
      }));
      if (target) {
        notify({ title: "On hold", message: `${target.id} · ${target.room} · ${reason}`, priority: "MEDIUM", targetRole: "front_office", ticketId, roomNumber: target.room, type: "defer" });
        notify({ title: "On hold", message: `${target.id} · ${target.room} · ${reason}`, priority: "MEDIUM", targetRole: "duty_manager", ticketId, roomNumber: target.room, type: "defer" });
      }
      showToast(t("toast.deferred", { id: ticketId }), "warning");
    },
    [tickets, patchTicket, notify, showToast, t]
  );

  /** Penundaan dicabut: tiket kembali diterima dengan timer SLA baru. */
  const resumeTicket = useCallback(
    (ticketId: string, staffName: string) => {
      const now = clock();
      patchTicket(ticketId, (x) => ({
        ...x,
        status: "DITERIMA",
        assignee: staffName,
        assignedStaff: staffName,
        defer: undefined,
        sla: {
          ...x.sla,
          ack_due_at: new Date(now.getTime() + x.sla.ack_min * 60000).toISOString(),
          due_at: new Date(now.getTime() + x.sla.done_min * 60000).toISOString(),
        },
        timeline: [...x.timeline, entry("dilanjutkan", staffName)],
      }));
      showToast(t("toast.resumed", { id: ticketId }), "info");
    },
    [patchTicket, showToast, t]
  );

  const transferTicket = useCallback(
    (ticketId: string, newDept: Department, reason: string, transferredBy: string) => {
      const target = tickets.find((x) => x.id === ticketId);
      patchTicket(ticketId, (x) => ({
        ...x,
        dept: newDept,
        assignedDepartment: newDept,
        status: "DIALIHKAN",
        assignee: undefined,
        assignedStaff: undefined,
        needsFoReview: false,
        timeline: [...x.timeline, entry("dialihkan", transferredBy, `${x.dept} → ${newDept}: ${reason}`)],
      }));
      if (target) notify({ title: "Transferred", message: `${target.id} · ${target.room} · ${target.taskTitle}`, priority: target.priority, targetRole: ROLE_FOR_DEPT[newDept], ticketId, roomNumber: target.room, type: "new_ticket" });
      showToast(t("toast.transferred", { id: ticketId, dept: newDept }), "info");
    },
    [tickets, patchTicket, notify, showToast, t]
  );

  const cancelTicket = useCallback(
    (ticketId: string, reason: string, cancelledBy: string) => {
      patchTicket(ticketId, (x) => ({ ...x, status: "DIBATALKAN", timeline: [...x.timeline, entry("dibatalkan", cancelledBy, reason)] }));
      showToast(t("toast.cancelled", { id: ticketId }), "info");
    },
    [patchTicket, showToast, t]
  );

  const changeTicketPriority = useCallback(
    (ticketId: string, priority: Priority) => {
      patchTicket(ticketId, (x) => ({ ...x, priority, timeline: [...x.timeline, entry("eskalasi", currentStaff?.name || "Front Office", `Priority → ${priority}`)] }));
      showToast(t("toast.priority", { id: ticketId }), "info");
    },
    [patchTicket, currentStaff, showToast, t]
  );

  const changeTicketAssignee = useCallback(
    (ticketId: string, assignee: string) => {
      patchTicket(ticketId, (x) => ({ ...x, assignee, assignedStaff: assignee, timeline: [...x.timeline, entry("diterima", currentStaff?.name || "Front Office", `Assigned to ${assignee}`)] }));
      showToast(t("toast.assigned", { id: ticketId, name: assignee }), "info");
    },
    [patchTicket, currentStaff, showToast, t]
  );

  const mergeDuplicateTickets = useCallback(
    (primaryId: string, duplicateId: string) => {
      const dup = tickets.find((x) => x.id === duplicateId);
      if (!dup) return;
      const by = currentStaff?.name || "Front Office";
      setTickets((prev) =>
        prev.map((x) => {
          if (x.id === primaryId)
            return { ...x, isDuplicate: true, duplicateCount: (x.duplicateCount || 1) + 1, raw_text: `${x.raw_text} | [${duplicateId}] ${dup.raw_text}`, timeline: [...x.timeline, entry("dibuat", by, `Merged ${duplicateId}`)] };
          if (x.id === duplicateId) return { ...x, status: "DIBATALKAN" as TicketStatus, timeline: [...x.timeline, entry("dibatalkan", by, `Merged into ${primaryId}`)] };
          return x;
        })
      );
      showToast(t("toast.mergedManual", { dup: duplicateId, id: primaryId }), "success");
    },
    [tickets, currentStaff, showToast, t]
  );

  const updateRoomStatus = useCallback(
    (roomNumber: string, status: HotelRoom["status"]) => {
      setRooms((prev) => prev.map((r) => (r.roomNumber === roomNumber ? { ...r, status, lastCleaned: status === "Clean" ? new Date().toISOString() : r.lastCleaned } : r)));
      showToast(t("toast.roomStatus", { room: roomNumber }), "info");
    },
    [showToast, t]
  );

  const addTicketNote = useCallback(
    (ticketId: string, note: string, author: string) => {
      patchTicket(ticketId, (x) => ({ ...x, proof: { ...x.proof, note: x.proof?.note ? `${x.proof.note} | ${note}` : note }, timeline: [...x.timeline, entry("dikerjakan", author, note)] }));
      showToast(t("toast.noteAdded", { id: ticketId }), "success");
    },
    [patchTicket, showToast, t]
  );

  const getBreachedCount = useCallback(() => {
    const now = Date.now();
    return tickets.filter((x) => !isTicketClosed(x.status) && x.status !== "DITUNDA" && now > new Date(x.sla.due_at).getTime()).length;
  }, [tickets]);

  const getApproachingSlaCount = useCallback(() => {
    const now = Date.now();
    return tickets.filter((x) => {
      if (isTicketClosed(x.status)) return false;
      const created = new Date(x.sla.created_at).getTime();
      const due = new Date(x.sla.due_at).getTime();
      const p = (now - created) / (due - created || 1);
      return p >= 0.75 && p < 1;
    }).length;
  }, [tickets]);

  // ============================================================
  // Eskalasi ke manusia
  // ============================================================
  const escalateToHuman = useCallback(
    (reason: EscalationReason, note: string) => {
      if (escalationFor(guestRoom)) return;
      const targetRole: EscalationSession["targetRole"] = reason === "darurat" || reason === "sentimen_komplain" ? "duty_manager" : "front_office";
      const session: EscalationSession = {
        id: `esc-${Date.now()}`,
        room: guestRoom,
        guestName: guest.name,
        reason,
        reasonNote: note,
        status: "menunggu",
        startedAt: new Date().toISOString(),
        aiPaused: true,
        targetRole,
      };
      setEscalations((prev) => [...prev.filter((e) => !(e.room === guestRoom && e.status === "selesai")), session]);
      appendChat(guestRoom, { id: `msg-esc-${Date.now()}`, sender: "system", text: `escalation.started.${reason}`, timestamp: hhmm(clock()), isEscalationNotice: true });
      notify({ title: "Guest wants a person", message: `${guestRoom} · ${note}`, priority: reason === "darurat" ? "EMERGENCY" : "HIGH", targetRole, roomNumber: guestRoom, type: "new_ticket" });
    },
    [escalationFor, guestRoom, guest.name, appendChat, notify]
  );

  const resolveRoom = (room?: string) => room || escalations.find((e) => e.status !== "selesai")?.room || guestRoom;

  const claimEscalation = useCallback(
    (agentName: string, room?: string) => {
      const r = resolveRoom(room);
      setEscalations((prev) => prev.map((e) => (e.room === r && e.status !== "selesai" ? { ...e, status: "ditangani", agentName } : e)));
      appendChat(r, { id: `msg-esc-claim-${Date.now()}`, sender: "system", text: "escalation.claimed", agentName, timestamp: hhmm(clock()), isEscalationNotice: true });
      showToast(t("toast.escalationClaimed", { room: r }), "info");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [escalations, guestRoom, appendChat, showToast, t]
  );

  const sendAgentReply = useCallback(
    (text: string, agentName: string, room?: string) => {
      if (!text.trim()) return;
      const r = resolveRoom(room);
      appendChat(r, { id: `msg-agent-${Date.now()}`, sender: "ai", text, timestamp: hhmm(clock()), isHumanAgent: true, agentName });
      setEscalations((prev) => prev.map((e) => (e.room === r && e.status === "menunggu" ? { ...e, status: "ditangani", agentName } : e)));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [escalations, guestRoom, appendChat]
  );

  const resolveEscalation = useCallback(
    (agentName: string, room?: string) => {
      const r = resolveRoom(room);
      setEscalations((prev) => prev.map((e) => (e.room === r && e.status !== "selesai" ? { ...e, status: "selesai", aiPaused: false, agentName: e.agentName || agentName } : e)));
      appendChat(r, { id: `msg-esc-done-${Date.now()}`, sender: "system", text: "escalation.resolved", agentName, timestamp: hhmm(clock()), isEscalationNotice: true });
      showToast(t("toast.escalationResolved", { room: r }), "success");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [escalations, guestRoom, appendChat, showToast, t]
  );

  // ============================================================
  // Pesanan makanan
  // ============================================================
  const foodMenu = FOOD_MENU;

  const assignTableNumber = useCallback((): string => {
    const used = new Set(tickets.filter((x) => x.tableNumber && !isTicketClosed(x.status)).map((x) => x.tableNumber as string));
    for (let n = 1; n <= 20; n++) if (!used.has(String(n))) return String(n);
    return String(Math.floor(Math.random() * 20) + 1);
  }, [tickets]);

  const quickOrderFood = useCallback(
    async (
      cart: Array<{ item: FoodMenuItem; quantity: number }>,
      specialNotes?: string,
      destination: DiningDestination = "room",
      tableNumber?: string
    ) => {
      if (cart.length === 0) return undefined;
      const items = cart.map((c) => ({ menuId: c.item.id, name: c.item.name, qty: c.quantity, unitPrice: c.item.price }));
      const total = items.reduce((n, i) => n + i.qty * i.unitPrice, 0);
      const count = items.reduce((n, i) => n + i.qty, 0);
      const summary = items.map((i) => `${i.qty}x ${i.name}`).join(", ");
      const where = destination === "table" ? `Meja ${tableNumber}` : `Kamar ${guestRoom}`;
      const orderId = allocateOrderId();

      const ticket = await createTicket({
        room: guestRoom,
        guestName: guest.name,
        channel: "qr_web",
        raw_text: `${summary}${specialNotes ? ` — ${specialNotes}` : ""}`,
        category: "dining",
        taskTitle: destination === "table" ? `Table ${tableNumber} order (${count} items)` : `In-room dining (${count} items)`,
        qty: count,
        dept: "Food & Beverage",
        priority: "MEDIUM",
        diningDestination: destination,
        tableNumber: destination === "table" ? tableNumber : undefined,
        order: { id: orderId, items, notes: specialNotes || undefined, total, payment: "room_folio" },
        translatedRequest: `Pesanan ${where}: ${summary}.${specialNotes ? ` Catatan dapur: ${specialNotes}.` : ""} Total Rp ${total.toLocaleString("id-ID")}, dibebankan ke folio kamar.`,
      });

      await chargeToFolio({ description: `${orderId} · ${summary}`, itemCode: "FNB-IRD", amount: total, ticketId: ticket.id, room: guestRoom });
      showToast(t("toast.orderPlaced", { id: orderId }), "success");
      suggestOffersAfterOrder(ticket);
      return ticket;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [guestRoom, guest.name, createTicket, chargeToFolio, showToast, t, suggestOffersAfterOrder]
  );

  const confirmOrderDraft = useCallback(
    async (messageId: string, notes?: string) => {
      const msg = (chatsByRoom[guestRoom] || []).find((m) => m.id === messageId);
      if (!msg?.orderDraft || msg.orderDraft.confirmedTicketId) return undefined;
      const cart = msg.orderDraft.items
        .map((i) => ({ item: FOOD_MENU.find((m) => m.id === i.menuId)!, quantity: i.qty }))
        .filter((c) => c.item && c.quantity > 0);
      const ticket = await quickOrderFood(cart, notes, "room");
      if (ticket) updateChat(guestRoom, (m) => (m.id === messageId ? { ...m, orderDraft: { ...m.orderDraft!, confirmedTicketId: ticket.id }, ticket } : m));
      return ticket;
    },
    [chatsByRoom, guestRoom, quickOrderFood, updateChat]
  );

  /**
   * Dapur menandai pesanan siap. Pesanan ke kamar berpindah ke Housekeeping
   * untuk diantar; pesanan di restoran tetap di F&B. Sengaja bukan "SELESAI":
   * status itu yang meminta tamu memberi rating, padahal makanan belum sampai.
   */
  const markOrderReady = useCallback(
    (ticketId: string, readyBy: string) => {
      const target = tickets.find((x) => x.id === ticketId);
      patchTicket(ticketId, (x) => {
        const toRoom = x.diningDestination !== "table";
        return {
          ...x,
          status: "SIAP",
          dept: toRoom ? "Housekeeping" : x.dept,
          assignedDepartment: toRoom ? "Housekeeping" : x.assignedDepartment,
          timeline: [...x.timeline, entry("siap", readyBy)],
        };
      });
      if (target) notify({ title: "Order ready", message: `${target.order?.id || target.id} · ${target.room}`, priority: "MEDIUM", targetRole: target.diningDestination === "table" ? "food_beverage" : "housekeeping", ticketId, roomNumber: target.room, type: "order_ready" });
      showToast(t("toast.orderReady", { id: target?.order?.id || ticketId }), "success");
    },
    [tickets, patchTicket, notify, showToast, t]
  );

  // ============================================================
  // Late check-out, bellboy, darurat
  // ============================================================
  const requestLateCheckout = useCallback(
    async (requestedHour: string, reason?: string) => {
      const fee = LATE_CHECKOUT_OPTIONS.find((o) => o.hour === requestedHour)?.fee || 0;
      const ticket = await createTicket({
        room: guestRoom,
        guestName: guest.name,
        channel: "qr_web",
        raw_text: `Late checkout until ${requestedHour}${reason ? ` — ${reason}` : ""}`,
        category: "billing_checkout",
        taskTitle: `Late checkout until ${requestedHour}`,
        dept: "Front Office",
        priority: "MEDIUM",
        lateCheckout: { hour: requestedHour, fee },
        translatedRequest: `Tamu Kamar ${guestRoom} meminta late check-out sampai ${requestedHour} (biaya Rp ${fee.toLocaleString("id-ID")}). Perlu persetujuan FO.${reason ? ` Alasan: ${reason}` : ""}`,
      });
      showToast(t("toast.lateRequested", { hour: requestedHour }), "success");
      suggestOffersAfterOrder(ticket);
    },
    [guestRoom, guest.name, createTicket, showToast, t, suggestOffersAfterOrder]
  );

  const approveLateCheckout = useCallback(
    (ticketId: string, staffName: string) => {
      const target = tickets.find((x) => x.id === ticketId);
      if (!target?.lateCheckout) return;
      completeTicket(ticketId, staffName, { note: `Late checkout approved until ${target.lateCheckout.hour}` });
      if (target.lateCheckout.fee > 0) {
        chargeToFolio({ description: `Late checkout until ${target.lateCheckout.hour}`, itemCode: "ROOM-LATE", amount: target.lateCheckout.fee, ticketId, room: target.room });
      }
      appendChat(target.room, { id: `msg-late-${Date.now()}`, sender: "system", text: "late.approvedNotice", timestamp: hhmm(clock()), isEscalationNotice: true, agentName: target.lateCheckout.hour });
    },
    [tickets, completeTicket, chargeToFolio, appendChat]
  );

  const declineLateCheckout = useCallback(
    (ticketId: string, staffName: string, reason: string) => {
      const target = tickets.find((x) => x.id === ticketId);
      cancelTicket(ticketId, reason, staffName);
      if (target) appendChat(target.room, { id: `msg-late-${Date.now()}`, sender: "system", text: "late.declinedNotice", timestamp: hhmm(clock()), isEscalationNotice: true });
    },
    [tickets, cancelTicket, appendChat]
  );

  const requestBellboy = useCallback(
    async (service: NonNullable<ServiceTicket["bellboy"]>["service"], note?: string) => {
      const label = { luggage_help: "Help with luggage", luggage_pickup: "Luggage pick-up", escort: "Escort", other: "Bell service" }[service];
      const ticket = await createTicket({
        room: guestRoom,
        guestName: guest.name,
        channel: "qr_web",
        raw_text: note ? `${label} — ${note}` : label,
        category: "bellboy",
        taskTitle: label,
        dept: "Front Office",
        bellboy: { service, note },
        translatedRequest: `Bellboy ke Kamar ${guestRoom}: ${label}.${note ? ` Catatan: ${note}` : ""}`,
      });
      showToast(t("toast.requestSent", { id: ticket.id }), "success");
      return ticket;
    },
    [guestRoom, guest.name, createTicket, showToast, t]
  );

  const requestExcursion = useCallback(
    async ({ place, pickupAt, asap, people, assist, note }: ExcursionRequest) => {
      const day = pickupAt.toDateString() === clock().toDateString() ? "hari ini" : "besok";
      const at = `${String(pickupAt.getHours()).padStart(2, "0")}:${String(pickupAt.getMinutes()).padStart(2, "0")}`;
      const when = asap ? `secepatnya (±${at})` : `${day} ${at}`;
      const ticket = await createTicket({
        room: guestRoom,
        guestName: guest.name,
        channel: "qr_web",
        raw_text: `Car to ${place.name}, ${people} ${people === 1 ? "person" : "people"}${note ? ` — ${note}` : ""}`,
        category: "excursion",
        taskTitle: `Car to ${place.name}`,
        qty: people,
        dept: "Front Office",
        excursion: { placeId: place.id, place: place.name, pickupAt: pickupAt.toISOString(), asap, people, assist, note },
        translatedRequest:
          `Siapkan mobil + sopir untuk Kamar ${guestRoom} ke ${place.name} (${place.driveMin} menit). Jemput di lobi ${when}, ${people} orang.` +
          (assist ? " Tamu butuh bantuan khusus (lansia/kursi roda/anak kecil)." : "") +
          (note ? ` Catatan tamu: ${note}.` : "") +
          " Konfirmasi harga ke tamu sebelum berangkat.",
      });
      showToast(t("toast.requestSent", { id: ticket.id }), "success");
      return ticket;
    },
    [guestRoom, guest.name, createTicket, showToast, t]
  );

  const reportEmergency = useCallback(
    async (type: NonNullable<ServiceTicket["emergencyType"]>, note?: string) => {
      const label = { fire: "Fire or smoke", medical: "Medical emergency", security: "Security", other: "Emergency" }[type];
      const ticket = await createTicket({
        room: guestRoom,
        guestName: guest.name,
        channel: "qr_web",
        raw_text: note ? `${label} — ${note}` : label,
        category: "emergency",
        taskTitle: label,
        dept: "Front Office",
        isEmergency: true,
        emergencyType: type,
        confidence: 1,
        translatedRequest: `[DARURAT] ${label} di Kamar ${guestRoom}.${note ? ` Keterangan tamu: ${note}.` : ""} Security, FO, dan Duty Manager segera ke lokasi.`,
      });
      escalateToHuman("darurat", label);
      playAlertSound();
      return ticket;
    },
    [guestRoom, guest.name, createTicket, escalateToHuman, playAlertSound]
  );

  // ============================================================
  // Chat AI
  // ============================================================
  const sendChatMessage = useCallback(
    async (text: string, voiceMeta?: { isVoiceMessage?: boolean; audioDurationSec?: number; audioUrl?: string }) => {
      if (!text.trim()) return null;
      const room = guestRoom;
      appendChat(room, {
        id: `msg-${Date.now()}`,
        sender: "user",
        text,
        timestamp: hhmm(clock()),
        isVoiceMessage: voiceMeta?.isVoiceMessage,
        audioDurationSec: voiceMeta?.audioDurationSec,
        audioUrl: voiceMeta?.audioUrl,
      });

      // Selama percakapan dipegang staf, AI tidak membalas sama sekali.
      const active = escalationFor(room);
      if (active?.aiPaused) {
        notify({ title: "Guest message", message: `${room} · ${text}`, priority: "HIGH", targetRole: active.targetRole, roomNumber: room, type: "new_ticket" });
        return null;
      }

      setIsAiProcessing(true);
      try {
        const { data } = await aiService.classify({ message: text, roomNumber: room, guestName: guest.name, guestLanguage: languageFor(locale).name, locale });
        let reply: ChatMessage;

        if (data.orderItems && data.orderItems.length > 0) {
          reply = { id: `msg-${Date.now() + 1}`, sender: "ai", text: data.guestReply, timestamp: hhmm(clock()), orderDraft: { items: data.orderItems } };
        } else if (data.isDirectAnswer) {
          reply = {
            id: `msg-${Date.now() + 1}`,
            sender: "ai",
            text: data.guestReply,
            timestamp: hhmm(clock()),
            isDirectAnswer: true,
            confidence: data.confidence,
            offers: data.offers || [],
            action: data.suggestFoodMenu ? "open_food_menu" : data.suggestExplore ? "open_explore" : undefined,
          };
        } else {
          const created = await createTicket({
            room,
            guestName: guest.name,
            channel: "chat_ai",
            raw_text: text,
            category: data.category,
            taskTitle: data.taskTitle,
            qty: data.quantity || 1,
            confidence: data.confidence,
            dept: data.assignedDepartment,
            priority: data.priority,
            originalLanguage: languageFor(data.detectedLanguage || locale).name,
            translatedRequest: data.translatedRequest,
            isEmergency: data.isEmergency,
            isAngryComplaint: data.isAngryComplaint,
            lateCheckout: data.lateCheckoutHour ? { hour: data.lateCheckoutHour, fee: data.lateCheckoutFee || 0 } : undefined,
            bellboy: data.bellboyService ? { service: data.bellboyService } : undefined,
            emergencyType: data.isEmergency ? "other" : undefined,
          });
          reply = {
            id: `msg-${Date.now() + 1}`,
            sender: "ai",
            text: data.guestReply,
            timestamp: hhmm(clock()),
            ticket: created,
            confidence: data.confidence,
            isEmergency: data.isEmergency,
            isAngryComplaint: data.isAngryComplaint,
            needsFoReview: data.needsFoReview,
            offers: data.offers || [],
          };
          if (data.isEmergency) playAlertSound();
        }

        if (reply.offers && reply.offers.length > 0) {
          // Jeda antar-penawaran berlaku juga untuk tawaran dari chat.
          if (Date.now() - lastOfferAtRef.current < OFFER_COOLDOWN_MS) reply.offers = [];
          else {
            lastOfferAtRef.current = Date.now();
            countShown(reply.offers.length);
          }
        }
        appendChat(room, reply);

        if (data.needsHumanAgent) escalateToHuman(data.escalationReason || "kompleksitas_tinggi", text);
        return reply;
      } catch {
        // AI tidak tersedia. Pesan tamu tidak boleh hilang: tetap diteruskan
        // ke Front Office sebagai tiket, dan tamu diberi tahu dengan jujur.
        const created = await createTicket({
          room,
          guestName: guest.name,
          channel: "chat_ai",
          raw_text: text,
          category: "unclassified",
          taskTitle: "Guest message (AI unavailable)",
          confidence: 0.5,
          dept: "Front Office",
          translatedRequest: `[AI TIDAK TERSEDIA] Pesan tamu Kamar ${room}: "${text}"`,
        });
        const reply: ChatMessage = { id: `msg-${Date.now() + 1}`, sender: "ai", text: "", timestamp: hhmm(clock()), aiUnavailable: true, ticket: created };
        appendChat(room, reply);
        return reply;
      } finally {
        setIsAiProcessing(false);
      }
    },
    [guestRoom, guest.name, locale, appendChat, escalationFor, notify, createTicket, escalateToHuman, playAlertSound, countShown]
  );

  // ============================================================
  // Upselling: terima/tolak
  // ============================================================
  const acceptOffer = useCallback(
    async (offer: UpsellOffer) => {
      const ticket = await createTicket({
        room: guestRoom,
        guestName: guest.name,
        channel: "chat_ai",
        raw_text: `Booked: ${offer.title}`,
        category: `upsell_${offer.category}`,
        taskTitle: offer.title,
        confidence: 1,
        dept: offer.dept,
        priority: "LOW",
        translatedRequest: `Siapkan "${offer.title}" untuk Kamar ${guestRoom}. Tagihan ${offer.formattedPrice} sudah diposting ke folio.`,
      });
      await chargeToFolio({ description: offer.title, itemCode: offer.posItemCode, amount: offer.price, ticketId: ticket.id });
      appendChat(guestRoom, { id: `msg-offer-${Date.now()}`, sender: "ai", text: t("offer.booked", { price: formatCurrency(offer.price) }), timestamp: hhmm(clock()), ticket });
      setOfferStats((s) => ({ ...s, accepted: s.accepted + 1 }));
      showToast(t("toast.offerBooked"), "success");
    },
    [guestRoom, guest.name, createTicket, chargeToFolio, appendChat, showToast, t, formatCurrency]
  );

  const declineOffer = useCallback(
    (messageId: string, offerId: string) => updateChat(guestRoom, (m) => (m.id === messageId ? { ...m, offers: (m.offers || []).filter((o) => o.id !== offerId) } : m)),
    [guestRoom, updateChat]
  );

  // ============================================================
  // Privasi
  // ============================================================
  const anonymizeGuestHistory = useCallback(
    async (room: string) => {
      try {
        const res = await privacyService.anonymize(room);
        setTickets((prev) => prev.map((x) => (x.room === room ? { ...x, guestName: "Anonymised guest", raw_text: "[anonymised after checkout]", originalRequest: undefined } : x)));
        setChatsByRoom((prev) => ({ ...prev, [room]: [] }));
        await refreshPrivacyLog();
        showToast(t("toast.anonymized", { room, n: res.affected }), "success");
      } catch {
        showToast(t("toast.anonymizeFailed"), "error");
      }
    },
    [refreshPrivacyLog, showToast, t]
  );

  // ============================================================
  // Demo: simulasi hotel yang hidup & pemantau SLA
  // ============================================================
  const [simulationEnabled, setSimulationEnabledState] = useState<boolean>(() => readJson(KEYS.simulation, true));
  const setSimulationEnabled = useCallback((on: boolean) => {
    setSimulationEnabledState(on);
    writeJson(KEYS.simulation, on);
  }, []);

  // Pemantau SLA: satu notifikasi per tiket yang lewat batas. Id notifikasi
  // deterministik, jadi tab lain yang ikut memantau tidak membuat duplikat.
  useEffect(() => {
    if (sessionKind !== "staff") return;
    const check = () => {
      const now = Date.now();
      for (const x of tickets) {
        if (isTicketClosed(x.status) || x.status === "DITUNDA") continue;
        if (now <= new Date(x.sla.due_at).getTime()) continue;
        notify({ id: `sla-${x.id}-${x.sla.due_at}`, title: "SLA breached", message: `${x.order?.id || x.id} · ${x.room} · ${x.taskTitle}`, priority: "HIGH", targetRole: ROLE_FOR_DEPT[x.dept], ticketId: x.id, roomNumber: x.room, type: "sla_breach" });
      }
    };
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, [tickets, sessionKind, notify]);

  // Simulasi: sesekali permintaan baru masuk dan petugas lain bergerak, supaya
  // dashboard terasa seperti hotel yang sedang beroperasi. Hanya di tab staf
  // yang sedang terlihat, dan bisa dimatikan di Settings.
  const ticketsRef = useRef(tickets);
  ticketsRef.current = tickets;
  useEffect(() => {
    if (sessionKind !== "staff" || !simulationEnabled) return;
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      runSimulationTick({
        tickets: ticketsRef.current,
        rooms,
        createTicket,
        acceptTicket: (tid, name) => patchTicket(tid, (x) => ({ ...x, status: "DITERIMA", assignee: name, assignedStaff: name, timeline: [...x.timeline, entry("diterima", name)] })),
        startTicket: (tid, name) => patchTicket(tid, (x) => ({ ...x, status: "DIKERJAKAN", timeline: [...x.timeline, entry("dikerjakan", name)] })),
        completeTicket: (tid, name) =>
          patchTicket(tid, (x) => ({
            ...x,
            status: "SELESAI",
            completedAtTime: hhmm(clock()),
            totalDurationMin: Math.max(1, Math.round((Date.now() - new Date(x.sla.created_at).getTime()) / 60000)),
            timeline: [...x.timeline, entry("selesai", name)],
          })),
      });
    }, 70000);
    return () => clearInterval(id);
  }, [sessionKind, simulationEnabled, rooms, createTicket, patchTicket]);

  const resetSimulationData = useCallback(() => {
    const fresh = freshDemoData();
    writeJson(KEYS.seededAt, new Date().toISOString());
    // Epoch baru yang disengaja: semua perangkat lain ikut data yang baru ini.
    writeEpoch({ id: new Date().toISOString(), provisional: false });
    lastTicketNo.current = 0;
    lastOrderNo.current = 0;
    setTickets(fresh.tickets);
    setRooms(fresh.rooms);
    setNotifications(fresh.notifications);
    setChatsByRoom({});
    setEscalations([]);
    setLocalPrivacyLog([]);
    setOfferStats({ shown: 18, accepted: 4 });
    pushReset();
    showToast(t("toast.reset"), "info");
  }, [showToast, t, pushReset]);

  const value: AppContextType = {
    syncStatus,
    role,
    setRole,
    guest,
    setGuestRoom,
    hasCheckedIn,
    sessionKind,
    currentStaff,
    signInAsStaff,
    checkInToRoom,
    signOutRoom,
    setGuestLanguage,
    tickets,
    rooms,
    notifications,
    foodMenu,
    chatMessages,
    chatsByRoom,
    selectedTicket,
    setSelectedTicket,
    isAiProcessing,
    health,
    toasts,
    showToast,
    dismissToast,
    isAlarmMuted,
    setIsAlarmMuted,
    playAlertSound,
    markNotificationsRead,
    createTicket,
    acceptTicket,
    startTicket,
    completeTicket,
    rateAndConfirmTicket,
    deferTicket,
    resumeTicket,
    transferTicket,
    cancelTicket,
    changeTicketPriority,
    changeTicketAssignee,
    mergeDuplicateTickets,
    updateRoomStatus,
    addTicketNote,
    getBreachedCount,
    getApproachingSlaCount,
    sendChatMessage,
    quickOrderFood,
    confirmOrderDraft,
    assignTableNumber,
    markOrderReady,
    requestLateCheckout,
    lateCheckoutRequest,
    approveLateCheckout,
    declineLateCheckout,
    requestExcursion,
    requestBellboy,
    reportEmergency,
    upsellCatalogue: UPSELL_OFFERS,
    suggestOffersAfterOrder,
    acceptOffer,
    declineOffer,
    escalation,
    escalations,
    escalateToHuman,
    claimEscalation,
    sendAgentReply,
    resolveEscalation,
    integrations,
    folioCharges,
    refreshIntegrations,
    chargeToFolio,
    privacyLog,
    anonymizeGuestHistory,
    refreshPrivacyLog,
    logContactReveal,
    offerStats,
    simulationEnabled,
    setSimulationEnabled,
    resetSimulationData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};
