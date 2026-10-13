import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Download,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";
import { NAV, QUICK_ACTIONS, crumbsFor, flattenNav } from "../routes/nav";
import { ROLE_LABELS } from "../lib/constants";
import { BrandMark } from "../components/ui/BrandMark";
import { Avatar } from "../components/ui/Avatar";
import InvitationCard from "../components/event/InvitationCard";
import CommandPalette from "../components/admin/CommandPalette";
import { fmtFullDate, hijriToday } from "../lib/date";
import { useShell } from "../hooks/useShell";
import { useInstallPrompt } from "../hooks/useInstallPrompt";

const HOME = {
  qism_ibadah: "/ibadah",
  qism_riyadhah: "/riyadhah",
  nadzhofah: "/nadzhofah",
  lughah: "/lughah",
  super_admin: "/admin",
};

const linkCls = ({ isActive }) =>
  `group flex items-center gap-2.5 rounded-lg px-2.5 h-9 text-[13px] font-semibold transition-colors ${
    isActive
      ? "bg-tint text-brand-dim"
      : "text-fg-2 hover:bg-soft-2 hover:text-fg"
  }`;

function RailNav({ groups, collapsed, onNavigate }) {
  const { pathname } = useLocation();
  const [openMap, setOpenMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("admin.groups") || "{}");
    } catch {
      return {};
    }
  });

  if (collapsed) {
    return (
      <nav className="flex-1 space-y-1 px-2 py-3 overflow-y-auto" aria-label="Menu">
        {flattenNav(groups).map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            title={it.label}
            end
            onClick={onNavigate}
            className={({ isActive }) =>
              `grid h-9 place-items-center rounded-lg transition-colors ${
                isActive ? "bg-tint text-brand" : "text-fg-3 hover:bg-soft-2 hover:text-fg"
              }`
            }>
            <it.icon size={17} strokeWidth={2.2} />
          </NavLink>
        ))}
      </nav>
    );
  }

  const contains = (g) =>
    g.items.some(
      (it) =>
        (it.to && (pathname === it.to || pathname.startsWith(it.to + "/"))) ||
        it.children?.some(
          (c) => pathname === c.to || pathname.startsWith(c.to + "/"),
        ),
    );
  const isOpen = (g, i) =>
    openMap[g.section] ?? (groups.length <= 3 || i === 0 || contains(g));
  const toggle = (g, i) => {
    const next = { ...openMap, [g.section]: !isOpen(g, i) };
    setOpenMap(next);
    localStorage.setItem("admin.groups", JSON.stringify(next));
  };

  return (
    <nav className="flex-1 space-y-3 px-3 py-3 overflow-y-auto" aria-label="Menu">
      {groups.map((g, gi) => (
        <div key={g.section}>
          <button
            type="button"
            onClick={() => toggle(g, gi)}
            aria-expanded={isOpen(g, gi)}
            className="flex items-center gap-1 px-2.5 mb-1 w-full font-bold text-[11px] text-fg-3 hover:text-fg-2 uppercase tracking-wider">
            <span className="flex-1 text-left">{g.section}</span>
            <ChevronDown
              size={13}
              className={`transition-transform ${isOpen(g, gi) ? "" : "-rotate-90"}`}
            />
          </button>
          {isOpen(g, gi) && (
            <div className="space-y-0.5">
              {g.items.map((it, i) =>
                it.children ? (
                  <div key={`${g.section}-${i}`}>
                    <p className="flex items-center gap-2.5 px-2.5 h-8 font-semibold text-[12px] text-fg-3">
                      <it.icon size={15} strokeWidth={2.2} /> {it.label}
                    </p>
                    <div className="ml-[1.15rem] pl-2 border-line border-l">
                      {it.children.map((c) => (
                        <NavLink
                          key={c.to}
                          to={c.to}
                          end
                          onClick={onNavigate}
                          className={linkCls}>
                          <span className="truncate">{c.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                ) : (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    end={it.end}
                    onClick={onNavigate}
                    className={linkCls}>
                    {({ isActive }) => (
                      <>
                        <it.icon
                          size={16}
                          strokeWidth={2.2}
                          className={
                            isActive ? "text-brand" : "text-fg-3 group-hover:text-fg-2"
                          }
                        />
                        <span className="truncate">{it.label}</span>
                      </>
                    )}
                  </NavLink>
                ),
              )}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}

function UserMenu({ profile, groups, onSignOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { canInstall, install } = useInstallPrompt();
  const profilePath = useMemo(
    () =>
      groups.flatMap((g) => g.items).find((it) => it.label === "Profil")?.to ??
      "/",
    [groups],
  );

  useEffect(() => {
    if (!open) return;
    const h = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 hover:bg-soft-2 p-1 md:pr-2 rounded-lg transition-colors">
        <Avatar name={profile?.full_name ?? ""} size="sm" />
        <span className="hidden md:block max-w-[140px] font-semibold text-[13px] text-fg truncate">
          {profile?.full_name}
        </span>
        <ChevronDown size={14} className="hidden md:block text-fg-3" />
      </button>
      {open && (
        <div
          role="menu"
          className="top-full right-0 z-50 absolute bg-card shadow-xl mt-2 border border-line rounded-xl w-64 overflow-hidden animate-pop">
          <div className="px-4 py-3 border-line border-b">
            <p className="font-bold text-fg text-sm truncate">
              {profile?.full_name}
            </p>
            <p className="text-fg-3 text-xs">{ROLE_LABELS[profile?.role]}</p>
          </div>
          <div className="p-1.5">
            <Link
              to={profilePath}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 hover:bg-soft-2 px-2.5 py-2 rounded-lg text-fg-2 text-[13px]">
              <UserRound size={15} /> Profil saya
            </Link>
            {canInstall && (
              <button
                onClick={() => {
                  install();
                  setOpen(false);
                }}
                className="flex items-center gap-2.5 hover:bg-soft-2 px-2.5 py-2 rounded-lg w-full text-fg-2 text-[13px]">
                <Download size={15} /> Pasang aplikasi
              </button>
            )}
            <button
              onClick={onSignOut}
              className="flex items-center gap-2.5 hover:bg-rose-50 px-2.5 py-2 rounded-lg w-full text-[13px] text-rose-600">
              <LogOut size={15} /> Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminShell() {
  const { profile, signOut } = useAuth();
  const confirm = useConfirm();
  const { pathname } = useLocation();
  const role = profile?.role;
  const groups = NAV[role] ?? [];

  useShell({ skin: "work", qism: role, themeColor: "#ffffff" });

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("admin.rail") === "1",
  );
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);

  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const toggleRail = () => {
    setCollapsed((c) => {
      localStorage.setItem("admin.rail", c ? "0" : "1");
      return !c;
    });
  };

  const paletteItems = useMemo(
    () => [
      ...(QUICK_ACTIONS[role] ?? []).map((a) => ({ ...a, section: "Aksi cepat" })),
      ...flattenNav(groups),
    ],
    [role, groups],
  );
  const crumb = crumbsFor(pathname, groups);

  const doSignOut = async () => {
    if (
      await confirm({
        title: "Keluar dari aplikasi?",
        message: "Sesi kamu akan diakhiri.",
        confirmText: "Keluar",
        tone: "danger",
      })
    )
      await signOut();
  };

  return (
    <div className="bg-page min-h-dvh print:hidden">
      <header className="top-0 z-40 sticky bg-card border-line border-b safe-top">
        <div className="bg-brand h-[3px]" />
        <div className="flex items-center gap-2 px-3 lg:px-4 h-14">
          <button
            onClick={() => setDrawer(true)}
            aria-label="Buka menu"
            className="lg:hidden place-items-center grid hover:bg-soft-2 rounded-lg size-9 text-fg-2">
            <Menu size={19} />
          </button>
          <button
            onClick={toggleRail}
            aria-label={collapsed ? "Lebarkan menu" : "Ciutkan menu"}
            className="hidden lg:grid place-items-center hover:bg-soft-2 rounded-lg size-9 text-fg-3">
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
          <Link to={HOME[role] ?? "/"} className="flex items-center gap-2.5">
            <span className="place-items-center grid bg-brand rounded-lg size-8 text-on-brand">
              <BrandMark className="size-[18px]" />
            </span>
            <span className="hidden sm:block font-bold text-[15px] text-fg">
              OSIS Management
            </span>
          </Link>
          <span className="hidden md:inline-flex bg-brand/10 border-brand/30 text-brand-dim badge">
            {ROLE_LABELS[role]}
          </span>

          <button
            onClick={() => setPalette(true)}
            className="flex flex-1 items-center gap-2 bg-soft hover:border-line-2 mx-auto px-3 border border-line rounded-lg max-w-md h-9 text-[13px] text-fg-3 text-left transition-colors">
            <Search size={15} />
            <span className="flex-1 truncate">Cari halaman atau aksi…</span>
            <kbd className="hidden sm:inline bg-card px-1.5 py-0.5 border border-line rounded font-bold text-[10px]">
              Ctrl K
            </kbd>
          </button>

          <p className="hidden xl:block text-fg-3 text-xs text-right">
            {hijriToday() && <>{hijriToday()} · </>}
            {fmtFullDate(new Date())}
          </p>
          <UserMenu profile={profile} groups={groups} onSignOut={doSignOut} />
        </div>
      </header>

      <aside
        className={`hidden lg:flex fixed top-[59px] bottom-0 left-0 z-30 flex-col border-r border-line bg-card transition-[width] duration-200 ${
          collapsed ? "w-[4.25rem]" : "w-[15.5rem]"
        }`}>
        <RailNav groups={groups} collapsed={collapsed} />
      </aside>

      {drawer && (
        <div className="lg:hidden z-50 fixed inset-0">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setDrawer(false)}
          />
          <aside className="top-0 bottom-0 left-0 absolute flex flex-col bg-card shadow-2xl w-[17rem] drawer-in">
            <div className="flex justify-between items-center px-4 border-line border-b h-14">
              <span className="font-bold text-fg text-sm">Menu</span>
              <button
                onClick={() => setDrawer(false)}
                aria-label="Tutup menu"
                className="place-items-center grid hover:bg-soft-2 rounded-lg size-8 text-fg-3">
                <X size={17} />
              </button>
            </div>
            <RailNav groups={groups} collapsed={false} onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div
        className={`transition-[padding] duration-200 ${
          collapsed ? "lg:pl-[4.25rem]" : "lg:pl-[15.5rem]"
        }`}>
        <main className="mx-auto px-4 lg:px-7 py-5 lg:py-6 max-w-[1360px]">
          {crumb && (
            <nav
              aria-label="Remah roti"
              className="flex items-center gap-1.5 mb-3 text-fg-3 text-xs">
              <span>{crumb.section}</span>
              {crumb.section !== crumb.label && (
                <>
                  <ChevronRight size={12} />
                  <span className="font-semibold text-fg-2">{crumb.label}</span>
                </>
              )}
            </nav>
          )}
          <div key={pathname} className="page-in">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette
        open={palette}
        onClose={() => setPalette(false)}
        items={paletteItems}
      />
      <InvitationCard placement="floating" />
    </div>
  );
}
