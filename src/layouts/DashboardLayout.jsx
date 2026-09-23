import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, LogOut, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";
import { NAV, pageTitleFor } from "../routes/nav";
import { BrandMark } from "../components/ui/BrandMark";
import { Avatar } from "../components/ui/Avatar";
import { fmtFullDate, hijriToday } from "../lib/date";

function Brand() {
  return (
    <div className="flex items-center gap-3 px-5 py-5">
      <span className="place-items-center grid bg-brand/10 border border-brand/25 rounded-xl size-10 text-brand-soft">
        <BrandMark className="size-5.5" />
      </span>
      <div>
        <p className="font-display font-bold text-[15px] text-slate-50 tracking-tight">
          Ibadah OSIS
        </p>
        <p className="font-medium text-[10px] text-slate-500 uppercase tracking-[0.18em]">
          Qism Ibadah · OSIS
        </p>
      </div>
    </div>
  );
}

function NavList({ groups, onNavigate }) {
  return (
    <nav className="flex-1 space-y-5 px-3 py-2 overflow-y-auto">
      {groups.map((g) => (
        <div key={g.section}>
          <p className="mb-1.5 px-2 font-semibold text-[10px] text-slate-600 uppercase tracking-[0.16em]">
            {g.section}
          </p>
          <div className="space-y-0.5">
            {g.items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={it.end}
                onClick={onNavigate}
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
                      <span className="top-1/2 left-0 absolute bg-brand rounded-full w-0.5 h-4 -translate-y-1/2" />
                    )}
                    <it.icon
                      size={15}
                      className={
                        isActive ? "text-brand-soft" : "text-slate-500"
                      }
                    />
                    {it.label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function DashboardLayout() {
  const { profile, signOut } = useAuth();
  const confirm = useConfirm();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const groups = NAV[profile?.role] ?? [];

  const doSignOut = async () => {
    if (
      await confirm({
        title: "Keluar dari aplikasi?",
        message: "Sesi kamu akan diakhiri.",
        confirmText: "Keluar",
        tone: "danger",
      })
    ) {
      await signOut();
    }
  };

  const sidebarInner = (mobile = false) => (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center">
        <Brand />
        {mobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="place-items-center grid hover:bg-white/5 mr-3 rounded-lg size-8 text-slate-500 hover:text-slate-300">
            <X size={16} />
          </button>
        )}
      </div>
      <NavList
        groups={groups}
        onNavigate={mobile ? () => setMobileOpen(false) : undefined}
      />
      <div className="p-3 border-white/[0.06] border-t">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl">
          <Avatar name={profile?.full_name ?? ""} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-200 text-sm truncate">
              {profile?.full_name}
            </p>
            <p className="text-[11px] text-slate-500">
              {profile?.role === "osis_ibadah"
                ? "OSIS Qism Ibadah"
                : `Santri · ${profile?.class_name ?? ""}`}
            </p>
          </div>
          <button
            onClick={doSignOut}
            title="Keluar"
            className="place-items-center grid hover:bg-rose-500/10 rounded-lg size-8 text-slate-500 hover:text-rose-300 transition-colors shrink-0">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="print:hidden bg-ink-950 min-h-screen">
      <aside className="hidden lg:block left-0 z-40 fixed inset-y-0 bg-ink-900/70 backdrop-blur-sm border-white/[0.06] border-r w-64">
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

      <div className="lg:pl-64">
        <header className="top-0 z-30 sticky flex items-center gap-3 bg-ink-950/85 backdrop-blur-sm px-4 lg:px-8 border-white/[0.06] border-b h-14">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden place-items-center grid hover:bg-white/5 rounded-lg size-9 text-slate-400 hover:text-slate-200">
            <Menu size={18} />
          </button>
          <p className="font-medium text-slate-300 text-sm">
            {pageTitleFor(pathname, groups)}
          </p>
          <div className="flex items-center gap-3 ml-auto">
            <p className="hidden md:block text-slate-500 text-xs">
              {hijriToday() && <>{hijriToday()} · </>}
              {fmtFullDate(new Date())}
            </p>
          </div>
        </header>
        <main className="mx-auto px-4 lg:px-8 py-6 lg:py-8 max-w-7xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
