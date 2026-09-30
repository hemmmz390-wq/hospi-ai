import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ListChecks,
  BedDouble,
  Users,
  Building2,
  BarChart3,
  Settings,
  MessagesSquare,
  Menu,
  Search,
  LogOut,
  ChevronsUpDown,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useI18n, TranslationKey } from "../../i18n";
import { Role } from "../../types";
import { cn } from "../../lib/cn";
import { Avatar, IconButton, Kbd, Popover } from "../../components/ui";
import { BrandMark } from "../../components/common/Shared";
import { ViewSwitcher } from "../../components/common/ViewSwitcher";
import { NotificationCenter } from "./NotificationCenter";
import { GlobalSearch } from "./GlobalSearch";
import { TicketDrawer } from "./TicketDrawer";
import { RoomDrawer } from "./RoomDrawer";
import { useDetailParams } from "./staffUtils";
import { Overview } from "./pages/Overview";
import { TicketsPage } from "./pages/TicketsPage";
import { RoomsPage } from "./pages/RoomsPage";
import { GuestsPage } from "./pages/GuestsPage";
import { DepartmentsPage } from "./pages/DepartmentsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ConversationsPage } from "./pages/ConversationsPage";

type NavItem = { to: string; label: TranslationKey; icon: React.ComponentType<{ className?: string }>; end?: boolean; badge?: number };

const OVERVIEW_LABEL: Record<Exclude<Role, "tourist">, TranslationKey> = {
  front_office: "nav.overview",
  duty_manager: "nav.attention",
  housekeeping: "nav.tasks",
  maintenance: "nav.workOrders",
  food_beverage: "nav.orders",
};

function useNavItems(): NavItem[] {
  const { role, escalations } = useApp();
  const activeChats = escalations.filter((e) => e.status !== "selesai").length;
  const r = role as Exclude<Role, "tourist">;
  const overview: NavItem = { to: "/staff", end: true, label: OVERVIEW_LABEL[r], icon: LayoutDashboard };
  switch (r) {
    case "front_office":
      return [
        overview,
        { to: "/staff/tickets", label: "nav.tickets", icon: ListChecks },
        { to: "/staff/conversations", label: "nav.conversations", icon: MessagesSquare, badge: activeChats },
        { to: "/staff/rooms", label: "nav.rooms", icon: BedDouble },
        { to: "/staff/guests", label: "nav.guests", icon: Users },
        { to: "/staff/departments", label: "nav.departments", icon: Building2 },
        { to: "/staff/analytics", label: "nav.analytics", icon: BarChart3 },
      ];
    case "duty_manager":
      return [
        overview,
        { to: "/staff/tickets", label: "nav.tickets", icon: ListChecks },
        { to: "/staff/conversations", label: "nav.conversations", icon: MessagesSquare, badge: activeChats },
        { to: "/staff/guests", label: "nav.guests", icon: Users },
        { to: "/staff/departments", label: "nav.departments", icon: Building2 },
        { to: "/staff/analytics", label: "nav.analytics", icon: BarChart3 },
      ];
    case "housekeeping":
      return [overview, { to: "/staff/rooms", label: "nav.rooms", icon: BedDouble }];
    case "maintenance":
      return [overview, { to: "/staff/tickets", label: "nav.history", icon: ListChecks }];
    case "food_beverage":
      return [overview, { to: "/staff/tickets", label: "nav.history", icon: ListChecks }];
  }
}

function ProfileMenu() {
  const { currentStaff, role, setRole, signOutRoom, isAlarmMuted, setIsAlarmMuted } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();
  if (!currentStaff) return null;
  const roles: Exclude<Role, "tourist">[] = ["front_office", "housekeeping", "maintenance", "duty_manager", "food_beverage"];
  return (
    <Popover
      label={t("nav.profile")}
      align="start"
      width={260}
      trigger={({ toggle, ref, ...aria }) => (
        <button ref={ref} type="button" onClick={toggle} {...aria} className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left hover:bg-sunken">
          <Avatar name={currentStaff.name} size={32} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.8125rem] font-semibold">{currentStaff.name}</span>
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-ok" aria-hidden />
              {t(`role.${role}` as TranslationKey)} · {t("nav.online")}
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-subtle" />
        </button>
      )}
    >
      {(close) => (
        <div className="p-1">
          <p className="px-3 pb-1 pt-2 text-xs font-medium text-muted">{t("nav.switchRole")}</p>
          {roles.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRole(r);
                close();
                navigate("/staff");
              }}
              className={cn("flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-sunken", r === role && "font-semibold")}
            >
              {t(`role.${r}` as TranslationKey)}
              {r === role && <span className="text-xs text-muted">{t("nav.current")}</span>}
            </button>
          ))}
          <div className="my-1 h-px bg-line" />
          <button type="button" onClick={() => setIsAlarmMuted(!isAlarmMuted)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-sunken">
            {isAlarmMuted ? <VolumeX className="h-4 w-4 text-muted" /> : <Volume2 className="h-4 w-4 text-muted" />}
            {isAlarmMuted ? t("nav.alarmOff") : t("nav.alarmOn")}
          </button>
          <button
            type="button"
            onClick={() => {
              signOutRoom();
              navigate("/demo", { replace: true });
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-sunken"
          >
            <LogOut className="h-4 w-4 text-muted" />
            {t("nav.signOut")}
          </button>
        </div>
      )}
    </Popover>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  const items = useNavItems();
  const link = (item: NavItem) => (
    <li key={item.to}>
      <NavLink
        to={item.to}
        end={item.end}
        onClick={onNavigate}
        className={({ isActive }) =>
          cn("flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[0.8125rem] font-medium transition-colors", isActive ? "bg-sunken text-fg" : "text-muted hover:bg-sunken/70 hover:text-fg")
        }
      >
        <item.icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">{t(item.label)}</span>
        {item.badge ? <span className="rounded-md bg-fg px-1.5 text-[0.6875rem] font-semibold tabular-nums text-inverse">{item.badge}</span> : null}
      </NavLink>
    </li>
  );
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-4">
        <BrandMark />
      </div>
      <nav aria-label={t("nav.main")} className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-0.5">{items.map(link)}</ul>
        <div className="my-3 h-px bg-line" />
        <ul>{link({ to: "/staff/settings", label: "nav.settings", icon: Settings })}</ul>
      </nav>
      <div className="border-t border-line p-2">
        <ProfileMenu />
      </div>
    </div>
  );
}

const TITLES: Record<string, TranslationKey> = {
  tickets: "nav.tickets",
  rooms: "nav.rooms",
  guests: "nav.guests",
  departments: "nav.departments",
  analytics: "nav.analytics",
  settings: "nav.settings",
  conversations: "nav.conversations",
};

export default function StaffApp() {
  const { role } = useApp();
  const { t } = useI18n();
  const { pathname } = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { ticketId, roomNo, openTicket, openRoom } = useDetailParams();

  const section = pathname.split("/")[2] || "";
  const title = TITLES[section] ? t(TITLES[section]) : t(OVERVIEW_LABEL[role as Exclude<Role, "tourist">]);

  useEffect(() => setNavOpen(false), [pathname]);

  // ⌘K / Ctrl+K membuka pencarian global.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isMac = useMemo(() => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform), []);

  return (
    <div className="min-h-dvh bg-canvas lg:pl-60">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-line bg-surface lg:block">
        <SidebarContent />
      </aside>

      {/* Sidebar ponsel */}
      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 animate-fade" onClick={() => setNavOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-surface shadow-pop animate-enter" aria-label={t("nav.main")}>
            <div className="absolute right-2 top-2.5">
              <IconButton label={t("a.close")} size="sm" onClick={() => setNavOpen(false)}>
                <X className="h-4 w-4" />
              </IconButton>
            </div>
            <SidebarContent onNavigate={() => setNavOpen(false)} />
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-20 border-b border-line bg-canvas/95 backdrop-blur">
        <div className="flex h-14 items-center gap-2 px-4 sm:px-6">
          <IconButton label={t("nav.openMenu")} className="-ml-2 lg:hidden" onClick={() => setNavOpen(true)}>
            <Menu className="h-5 w-5" />
          </IconButton>
          <h1 className="min-w-0 flex-1 truncate text-[0.9375rem] font-semibold">{title}</h1>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden h-9 w-64 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-[0.8125rem] text-subtle hover:border-line-strong md:flex"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">{t("search.placeholder")}</span>
            <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
            <Kbd>K</Kbd>
          </button>
          <IconButton label={t("search.open")} className="md:hidden" onClick={() => setSearchOpen(true)}>
            <Search className="h-5 w-5" />
          </IconButton>
          <ViewSwitcher compact />
          <NotificationCenter onOpenTicket={openTicket} />
        </div>
      </header>

      <main className="px-4 py-5 sm:px-6 sm:py-6">
        <Routes>
          <Route index element={<Overview />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="guests" element={<GuestsPage />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="conversations" element={<ConversationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Overview />} />
        </Routes>
      </main>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} onOpenTicket={openTicket} onOpenRoom={openRoom} />
      <TicketDrawer ticketId={ticketId} onClose={() => openTicket(null)} onOpenTicket={openTicket} />
      <RoomDrawer roomNo={roomNo} onClose={() => openRoom(null)} onOpenTicket={openTicket} />
    </div>
  );
}
