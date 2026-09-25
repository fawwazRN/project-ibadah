import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Volleyball,
  CalendarClock,
  LogIn,
  X,
  Eye,
  Flag,
  Trophy,
  Menu,
} from "lucide-react";
import { BrandMark } from "../../components/ui/BrandMark";
import { useAuth } from "../../context/AuthContext";

const NAV = [
  { to: "/guest", label: "Match Center", icon: Volleyball, end: true },
  { to: "/guest/ibadah", label: "Qism Ibadah", icon: Flag },
  { to: "/guest/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/guest/zikir", label: "Jadwal Zikir", icon: CalendarClock },
];

export default function GuestLayout() {
  const { exitGuest } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarInner = (mobile = false) => (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="place-items-center grid bg-brand/10 border border-brand/25 rounded-xl size-10 text-brand-soft">
            <BrandMark className="size-5.5" />
          </span>
          <div>
            <p className="font-display font-bold text-[15px] text-slate-50 tracking-tight">
              OSIS Management
            </p>
            <p className="font-medium text-[10px] text-slate-500 uppercase tracking-[0.18em]">
              Mode Tamu
            </p>
          </div>
        </div>
        {mobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="place-items-center grid hover:bg-white/5 mr-3 rounded-lg size-8 text-slate-500 hover:text-slate-300">
            <X size={16} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            onClick={mobile ? () => setMobileOpen(false) : undefined}
            className={({ isActive }) =>
              `relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-white/[0.05] font-medium text-slate-100"
                  : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
              }`
            }>
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="top-1/2 -left-3 absolute bg-brand rounded-r-full w-1 h-5 -translate-y-1/2" />
                )}
                <it.icon
                  size={15}
                  className={isActive ? "text-brand-soft" : "text-slate-500"}
                />
                {it.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-2 p-3 border-white/[0.06] border-t">
        <button
          onClick={() => navigate("/auth/login")}
          className="flex justify-center items-center gap-2 bg-brand/10 hover:bg-brand/20 px-3 py-2 border border-brand/30 rounded-lg w-full font-medium text-brand-soft text-sm transition-colors">
          <LogIn size={14} /> Masuk / Daftar
        </button>
        <button
          onClick={() => {
            exitGuest();
            navigate("/auth/login");
          }}
          className="flex justify-center items-center gap-2 hover:bg-white/5 px-3 py-2 rounded-lg w-full text-slate-500 hover:text-slate-300 text-sm transition-colors">
          <X size={14} /> Keluar Mode Tamu
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-ink-950 min-h-screen">
      {/* Banner full-width */}
      <div
        className="flex flex-wrap justify-center items-center gap-2 bg-brand/15 px-4 py-2 text-brand-soft text-xs text-center"
        style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
        <Eye size={13} />
        <span className="font-medium">
          Mode Tamu — kamu melihat tampilan publik saja. Data pribadi tidak
          ditampilkan.
        </span>
        <button
          onClick={() => navigate("/auth/login")}
          className="hover:bg-brand/10 px-2 py-0.5 border border-brand/40 rounded-md font-semibold">
          Masuk / Daftar
        </button>
      </div>

      {/* [FIX] Sidebar FIXED di tepi kiri layar — TIDAK dibungkus max-w/mx-auto */}
      <aside className="hidden lg:block left-0 z-40 fixed inset-y-0 bg-ink-900/70 backdrop-blur-sm border-white/[0.06] border-r w-60">
        {sidebarInner(false)}
      </aside>

      {mobileOpen && (
        <>
          <div
            className="lg:hidden z-40 fixed inset-0 bg-ink-950/70 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden left-0 z-50 fixed inset-y-0 bg-ink-900 border-white/10 border-r w-72 animate-fade-up">
            {sidebarInner(true)}
          </aside>
        </>
      )}

      {/* Konten — geser karena sidebar, lebar konten dibatasi di dalam */}
      <div className="lg:pl-60">
        <header className="lg:hidden top-0 z-30 sticky flex items-center gap-3 bg-ink-950/85 backdrop-blur-sm px-4 border-white/[0.06] border-b h-14">
          <button
            onClick={() => setMobileOpen(true)}
            className="place-items-center grid hover:bg-white/5 rounded-lg size-9 text-slate-400 hover:text-slate-200">
            <Menu size={18} />
          </button>
          <p className="font-display font-bold text-slate-200 text-sm">
            OSIS Management · Tamu
          </p>
        </header>

        <main className="mx-auto px-4 lg:px-8 py-6 max-w-7xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
