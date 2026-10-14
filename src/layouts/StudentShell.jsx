import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Flame, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "../context/ConfirmContext";
import {
  NAV,
  STUDENT_TABS,
  isTabActive,
  isStudentRoot,
  pageTitleFor,
} from "../routes/nav";
import { BrandMark } from "../components/ui/BrandMark";
import { Avatar } from "../components/ui/Avatar";
import InvitationCard from "../components/event/InvitationCard";
import { violationService } from "../services/violationService";
import { reportService } from "../services/reportService";
import { computeStudentStats } from "../lib/student";
import { useShell } from "../hooks/useShell";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import { PlayBrand, RailGroups, PlayTabBar } from "./parts/PlayParts";

// ------------------------------------------------------------------
// Data santri dimuat SEKALI di shell → chip di topbar & Beranda
// memakai sumber yang sama (tanpa fetch ganda).
// ------------------------------------------------------------------
const StudentCtx = createContext(null);
export const useStudentData = () => useContext(StudentCtx);

function StudentDataProvider({ children }) {
  const [state, setState] = useState({
    violations: null,
    reports: [],
    error: null,
  });

  const load = useCallback(async () => {
    try {
      const [v, r] = await Promise.all([
        violationService.list(),
        reportService.listMine(),
      ]);
      setState({ violations: v, reports: r, error: null });
    } catch (e) {
      setState((s) => ({ ...s, error: e.message ?? "Gagal memuat data" }));
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(
    () => computeStudentStats(state.violations),
    [state.violations],
  );

  return (
    <StudentCtx.Provider value={{ ...state, stats, reload: load }}>
      {children}
    </StudentCtx.Provider>
  );
}

// ------------------------------------------------------------------
function Topbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { stats, violations } = useStudentData();
  const root = isStudentRoot(pathname);
  const title = pageTitleFor(pathname, NAV.santri);
  const ready = violations !== null;

  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate("/santri");
  };

  return (
    <header className="top-0 z-30 sticky bg-card/95 backdrop-blur-md border-line border-b-2 safe-top">
      <div className="flex items-center gap-2 mx-auto px-3 lg:px-8 max-w-5xl h-14">
        {!root && (
          <button
            onClick={goBack}
            aria-label="Kembali"
            className="place-items-center grid hover:bg-soft-2 rounded-xl size-10 text-fg-2 active:scale-95 transition lg:hidden">
            <ArrowLeft size={22} strokeWidth={2.6} />
          </button>
        )}
        {root && (
          <Link to="/santri" className="lg:hidden flex items-center gap-2">
            <span
              className="place-items-center grid bg-brand rounded-xl size-9 text-on-brand"
              style={{ boxShadow: "0 3px 0 var(--color-edge)" }}>
              <BrandMark className="size-5" />
            </span>
          </Link>
        )}
        <h1
          className="flex-1 min-w-0 font-display text-fg text-lg truncate"
          style={{ fontWeight: 900 }}>
          {title}
        </h1>

        <Link
          to="/santri/violations"
          title="Hari bersih sejak catatan terakhir"
          className="bg-orange-50 text-orange-600 stat-chip pop-on-change"
          key={ready ? stats.cleanDays : "x"}>
          <Flame size={18} strokeWidth={2.6} />
          {ready ? (stats.cleanDays ?? 0) : "–"}
          <span className="hidden sm:inline opacity-80 font-bold text-[11px]">hari bersih</span>
        </Link>
      </div>
    </header>
  );
}

function Rail() {
  const { profile, signOut } = useAuth();
  const confirm = useConfirm();
  const { canInstall, install } = useInstallPrompt();

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
    <div className="flex flex-col h-full">
      <PlayBrand to="/santri" sub="Santri" />
      <RailGroups groups={NAV.santri} />
      <div className="space-y-2 p-4">
        {canInstall && (
          <button
            onClick={install}
            className="w-full btn btn-secondary btn-md">
            <Download size={16} strokeWidth={2.5} /> Pasang aplikasi
          </button>
        )}
        <div className="flex items-center gap-3 p-2.5 border-line border-2 rounded-2xl">
          <Avatar name={profile?.full_name ?? ""} size="md" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-fg text-sm truncate">
              {profile?.full_name}
            </p>
            <p className="font-medium text-fg-3 text-xs">
              Kelas {profile?.class_name ?? "—"}
            </p>
          </div>
          <button
            onClick={doSignOut}
            title="Keluar"
            aria-label="Keluar"
            className="place-items-center grid hover:bg-rose-50 rounded-xl size-9 text-fg-3 hover:text-rose-600 transition-colors">
            <LogOut size={17} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentShell() {
  useShell({ skin: "play", qism: "santri", themeColor: "#ffffff" });
  const { pathname } = useLocation();

  const tabs = STUDENT_TABS.map((t) => ({
    ...t,
    active: isTabActive(t, pathname),
  }));

  return (
    <StudentDataProvider>
      <div className="bg-page min-h-dvh print:hidden">
        <aside className="hidden lg:flex left-0 z-40 fixed inset-y-0 flex-col bg-card border-line border-r-2 w-[17rem]">
          <Rail />
        </aside>

        <div className="lg:pl-[17rem]">
          <Topbar />
          <main className="mx-auto px-4 lg:px-8 pt-5 pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+1.5rem)] lg:pb-12 max-w-5xl">
            <div key={pathname} className="page-in">
              <Outlet />
            </div>
          </main>
        </div>

        <PlayTabBar tabs={tabs} />
        <InvitationCard placement="tabbed" />
      </div>
    </StudentDataProvider>
  );
}
