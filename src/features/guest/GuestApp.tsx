import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Home, ClipboardList, UtensilsCrossed, MessageCircle, Menu as MenuIcon, Siren } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useI18n } from "../../i18n";
import { cn } from "../../lib/cn";
import { LanguageMenu } from "../../components/common/Shared";
import { ViewSwitcher } from "../../components/common/ViewSwitcher";
import { useGuestTickets } from "./guestUtils";
import { GuestHome } from "./GuestHome";
import { GuestRequests } from "./GuestRequests";
import { GuestFood } from "./GuestFood";
import { GuestChat } from "./GuestChat";
import { GuestMore } from "./GuestMore";
import { GuestExplore } from "./GuestExplore";
import { EmergencySheet } from "./sheets/EmergencySheet";
import { CartProvider, useCart } from "./cart";

/**
 * Lembar (sheet) yang bisa dibuka dari mana saja di aplikasi tamu. Satu tempat,
 * supaya tombol darurat di bar atas dan di halaman lain membuka hal yang sama.
 */
type GuestSheets = { openEmergency: () => void };
const SheetsContext = createContext<GuestSheets>({ openEmergency: () => {} });
export const useGuestSheets = () => useContext(SheetsContext);

function TopBar({ onEmergency }: { onEmergency: () => void }) {
  const { guest } = useApp();
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/95 backdrop-blur supports-[backdrop-filter]:bg-canvas/85">
      <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between gap-2 px-4">
        <div className="min-w-0">
          <p className="truncate text-[0.8125rem] font-semibold leading-tight">{t("entry.hotel")}</p>
          <p className="text-xs text-muted">{t("g.roomShort", { room: guest.roomNumber })}</p>
        </div>
        <div className="flex items-center gap-1">
          <ViewSwitcher compact />
          <LanguageMenu compact />
          <button
            type="button"
            onClick={onEmergency}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-crit/35 px-2.5 text-[0.8125rem] font-medium text-crit hover:bg-crit-soft"
          >
            <Siren className="h-4 w-4" />
            <span className="hidden min-[400px]:inline">{t("g.emergency")}</span>
            <span className="sr-only min-[400px]:hidden">{t("g.emergency")}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function BottomNav() {
  const { t } = useI18n();
  const { active } = useGuestTickets();
  const { count } = useCart();
  const items = [
    { to: "/guest", end: true, icon: Home, label: t("g.nav.home") },
    { to: "/guest/requests", icon: ClipboardList, label: t("g.nav.requests"), badge: active.length },
    { to: "/guest/food", icon: UtensilsCrossed, label: t("g.nav.food"), badge: count },
    { to: "/guest/chat", icon: MessageCircle, label: t("g.nav.chat") },
    { to: "/guest/more", icon: MenuIcon, label: t("g.nav.more") },
  ];
  return (
    <nav aria-label={t("g.nav.label")} className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto grid h-16 max-w-2xl grid-cols-5">
        {items.map(({ to, end, icon: Icon, label, badge }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn("relative flex h-full flex-col items-center justify-center gap-1 px-0.5 text-[min(0.75rem,14px)] font-medium leading-tight transition-colors", isActive ? "text-fg" : "text-muted hover:text-fg")
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span aria-hidden className="absolute inset-x-1/4 top-0 h-0.5 rounded-full bg-accent" />}
                  <span className="relative">
                    <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.2 : 1.8} />
                    {badge ? (
                      <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-fg px-1 text-[0.625rem] font-semibold tabular-nums text-inverse">
                        {badge}
                      </span>
                    ) : null}
                  </span>
                  {/* Batas 14px: di ukuran teks terbesar lima label tetap muat di layar HP. */}
                  <span className="max-w-full truncate">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Shell() {
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const { pathname } = useLocation();
  const sheets = useMemo(() => ({ openEmergency: () => setEmergencyOpen(true) }), []);
  const isChat = pathname.startsWith("/guest/chat");
  const navigate = useNavigate();

  // Mode presentasi mengirim pesan skenario ke aplikasi tamu di iframe.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== "hospi:send" || typeof e.data.text !== "string") return;
      navigate("/guest/chat", { state: { send: e.data.text } });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [navigate]);

  return (
    <SheetsContext.Provider value={sheets}>
      <div className="min-h-dvh bg-canvas">
        <TopBar onEmergency={() => setEmergencyOpen(true)} />
        <main className={cn("mx-auto w-full max-w-2xl px-4", isChat ? "pb-0" : "pb-28 pt-5")}>
          <Routes>
            <Route index element={<GuestHome />} />
            <Route path="requests" element={<GuestRequests />} />
            <Route path="food" element={<GuestFood />} />
            <Route path="chat" element={<GuestChat />} />
            <Route path="more" element={<GuestMore />} />
            <Route path="explore" element={<GuestExplore />} />
            <Route path="*" element={<GuestHome />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
      <EmergencySheet open={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
    </SheetsContext.Provider>
  );
}

export default function GuestApp() {
  return (
    <CartProvider>
      <Shell />
    </CartProvider>
  );
}
