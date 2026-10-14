import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Volleyball,
  CalendarClock,
  LogIn,
  Flag,
  Trophy,
  Footprints,
  Home,
  LogOut,
  MessagesSquare,
  Newspaper,
} from "lucide-react";
import { BrandMark } from "../../components/ui/BrandMark";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import InvitationCard from "../../components/event/InvitationCard";
import { useShell } from "../../hooks/useShell";
import { PlayBrand, PlayTabBar } from "../../layouts/parts/PlayParts";

const TABS = [
  { to: "/guest", label: "Beranda", icon: Home, exact: true },
  { to: "/guest/bk", label: "Kak Peci", icon: MessagesSquare },
  { to: "/guest/artikel", label: "Artikel", icon: Newspaper },
  { to: "/guest/ibadah", label: "Ibadah", icon: Flag },
  { to: "/guest/leaderboard", label: "Peringkat", icon: Trophy },
];

const RAIL = [
  { to: "/guest", label: "Match Center", icon: Volleyball, end: true },
  { to: "/guest/ibadah", label: "Qism Ibadah", icon: Flag },
  { to: "/guest/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/guest/nadzhofah", label: "Santri Nakal", icon: Footprints },
  { to: "/guest/zikir", label: "Jadwal Zikir", icon: CalendarClock },
  { to: "/guest/kalender", label: "Kalender OSIS", icon: CalendarClock },
  { to: "/guest/bk", label: "Kak Peci", icon: MessagesSquare },
  { to: "/guest/artikel", label: "Artikel BK", icon: Newspaper },
];

const active = (t, p) =>
  t.exact ? p === t.to : p === t.to || p.startsWith(t.to + "/");

export default function GuestLayout() {
  useShell({ skin: "play", qism: null, themeColor: "#ffffff" });
  const { exitGuest } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const tabs = TABS.map((t) => ({ ...t, active: active(t, pathname) }));

  return (
    <div className="bg-page min-h-dvh print:hidden">
      <aside className="hidden lg:flex left-0 z-40 fixed inset-y-0 flex-col bg-card border-line border-r-2 w-[17rem]">
        <PlayBrand to="/guest" sub="Mode tamu" />
        <nav className="flex-1 space-y-1 px-4 py-2" aria-label="Menu">
          {RAIL.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end} className="rail-item">
              <it.icon size={20} strokeWidth={2} />
              <span className="truncate">{it.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="space-y-2 p-4">
          <Button
            variant="primary"
            icon={LogIn}
            className="w-full"
            onClick={() => navigate("/auth/login")}>
            Masuk / Daftar
          </Button>
          <button
            onClick={() => {
              exitGuest();
              navigate("/auth/login");
            }}
            className="flex justify-center items-center gap-2 hover:bg-soft py-2 rounded-xl w-full font-semibold text-fg-3 text-sm">
            <LogOut size={14} /> Keluar mode tamu
          </button>
        </div>
      </aside>

      <div className="lg:pl-[17rem]">
        <header className="top-0 z-30 sticky bg-card/95 backdrop-blur-md border-line border-b-2 safe-top">
          <div className="flex items-center gap-2 mx-auto px-3 lg:px-8 max-w-5xl h-14">
            <Link to="/guest" className="lg:hidden flex items-center gap-2">
              <span
                className="place-items-center grid bg-brand rounded-xl size-9 text-on-brand"
                style={{ boxShadow: "0 3px 0 var(--color-edge)" }}>
                <BrandMark className="size-5" />
              </span>
              <span
                className="font-display text-brand-dim text-xl"
                style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>
                osis
              </span>
            </Link>
            <span className="bg-soft-2 px-2.5 py-1 rounded-full font-extrabold text-[11px] text-fg-3 uppercase tracking-wider">
              Tamu
            </span>
            <div className="ml-auto">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/auth/login")}>
                Masuk
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto px-4 lg:px-8 pt-5 pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+1.5rem)] lg:pb-12 max-w-5xl">
          <div key={pathname} className="page-in">
            <Outlet />
          </div>
        </main>
      </div>

      <PlayTabBar tabs={tabs} />
      <InvitationCard placement="tabbed" />
    </div>
  );
}
