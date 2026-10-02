import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Menu, LogOut, X, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";
import { NAV, pageTitleFor } from "../routes/nav";
import { BrandMark } from "../components/ui/BrandMark";
import { Avatar } from "../components/ui/Avatar";
import { eventService } from "../services/eventService";
import InvitationCard from "../components/event/InvitationCard";
import { fmtFullDate, hijriToday } from "../lib/date";

const ROLE_LABELS = {
  santri: "Santri",
  qism_ibadah: "Qism Ibadah",
  qism_riyadhah: "Qism Riyadhah",
  nadzhofah: "Qism Nadzhofah",
  lughah: "Qism Lughah",
  super_admin: "Super Admin",
};

const ROLE_SUBTITLES = {
  santri: (p) => `Santri · ${p?.class_name ?? ""}`,
  qism_ibadah: () => "Qism Ibadah",
  qism_riyadhah: () => "Qism Riyadhah",
  nadzhofah: () => "Qism Nadzhofah",
  lughah: () => "Qism Lughah",
  super_admin: () => "Super Admin · Akses Penuh",
};

// Warna ikon menu — bergilir supaya sidebar berwarna-warni (solid)
const ICON_TINTS = [
  "text-sky-300 bg-sky-400/10",
  "text-violet-300 bg-violet-400/10",
  "text-pink-300 bg-pink-400/10",
  "text-orange-300 bg-orange-400/10",
  "text-cyan-300 bg-cyan-400/10",
  "text-indigo-300 bg-indigo-400/10",
  "text-amber-300 bg-amber-400/10",
  "text-emerald-300 bg-emerald-400/10",
];

function IconBox({ icon: Icon, idx = 0, active }) {
  return (
    <span
      className={`grid size-7 shrink-0 place-items-center rounded-md ${
        active ? "bg-brand text-ink-950" : ICON_TINTS[idx % ICON_TINTS.length]
      }`}>
      <Icon size={14} />
    </span>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-5 py-5">
      <span className="place-items-center grid bg-brand/15 shadow-card border border-brand/25 rounded-2xl size-11 text-brand-soft">
        <BrandMark className="size-6" />
      </span>
      <div>
        <p className="font-display font-bold text-[15px] text-slate-50 tracking-tight">
          OSIS Management
        </p>
        <p className="font-semibold text-[9px] text-slate-500 uppercase tracking-[0.22em]">
          Ibadah · Riyadhah · Nadzhofah · Lughah
        </p>
      </div>
    </div>
  );
}

function NavItem({ to, end, icon: Icon, label, onNavigate, idx }) {
  return (
    <NavLink
      to={to}
      end={end}
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
            <span className="top-1/2 -left-3 absolute bg-brand rounded-r-full w-1 h-5 -translate-y-1/2" />
          )}
          <IconBox icon={Icon} idx={idx} active={isActive} />
          {label}
        </>
      )}
    </NavLink>
  );
}

function NavParentItem({ item, onNavigate, idx }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 hover:bg-white/[0.03] px-2.5 py-2 rounded-lg w-full text-slate-400 hover:text-slate-200 text-sm transition-colors">
        <IconBox icon={item.icon} idx={idx} />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="space-y-0.5 mt-0.5 ml-4 pl-2 border-white/10 border-l">
          {item.children.map((c) => (
            <NavLink
              key={c.to}
              to={c.to}
              end
              onClick={onNavigate}
              className={({ isActive }) =>
                `relative flex items-center rounded-lg px-2.5 py-1.5 text-[13px] transition-colors ${
                  isActive
                    ? "bg-white/[0.05] font-medium text-slate-100"
                    : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200"
                }`
              }>
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="top-1/2 -left-2 absolute bg-brand rounded-r-full w-0.5 h-4 -translate-y-1/2" />
                  )}
                  {c.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function NavList({ groups, onNavigate, invVisible }) {
  // Filter item Undangan saat undangan disembunyikan
  const filterItems = (items) =>
    items
      .filter((it) => invVisible || !it.invitationItem)
      .map((it) =>
        it.children
          ? {
              ...it,
              children: it.children.filter(
                (c) => invVisible || c.to !== "/undangan",
              ),
            }
          : it,
      );

  return (
    <nav className="flex-1 space-y-5 px-3 py-2 overflow-y-auto">
      {groups.map((g, gi) => (
        <div key={g.section}>
          <p className="mb-1.5 px-2 font-semibold text-[10px] text-brand-soft/70 uppercase tracking-[0.16em]">
            {g.section}
          </p>
          <div className="space-y-0.5">
            {filterItems(g.items).map((it, idx) =>
              it.children ? (
                <NavParentItem
                  key={`${g.section}-${idx}`}
                  idx={idx + gi}
                  item={it}
                  onNavigate={onNavigate}
                />
              ) : (
                <NavItem
                  idx={idx + gi}
                  key={it.to ?? `${g.section}-${idx}`}
                  to={it.to}
                  end={it.end}
                  icon={it.icon}
                  label={it.label}
                  onNavigate={onNavigate}
                />
              ),
            )}
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

  // Tema warna per qism — dipasang di <html> supaya modal/toast (portal) ikut.
  useEffect(() => {
    if (!profile?.role) return;
    document.documentElement.dataset.qism = profile.role;
    return () => {
      delete document.documentElement.dataset.qism;
    };
  }, [profile?.role]);

  // Visibilitas undangan — menu ikut hilang saat hidden
  const [invVisible, setInvVisible] = useState(true);
  useEffect(() => {
    eventService
      .getSettings()
      .then((s) => setInvVisible(s.invitation_visible))
      .catch(() => {});
  }, []);

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
        invVisible={invVisible}
      />
      <div className="p-3 border-white/[0.06] border-t">
        <div className="flex items-center gap-2.5 bg-white/[0.02] px-2 py-2 border border-white/[0.05] rounded-xl">
          <Avatar name={profile?.full_name ?? ""} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-200 text-sm truncate">
              {profile?.full_name}
            </p>
            <p className="text-[11px] text-slate-500">
              {ROLE_SUBTITLES[profile?.role]?.(profile) ?? "—"}
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
          <span className="bg-brand/15 px-2.5 py-1 border border-brand/30 rounded-full font-semibold text-[11px] text-brand-soft">
            {ROLE_LABELS[profile?.role] ?? ""}
          </span>
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

      {/* Kartu undangan — fixed, ikut di semua halaman */}
      <InvitationCard sidebarClass="lg:left-64" />
    </div>
  );
}
