import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../layouts/DashboardLayout";
import { BrandMark } from "../components/ui/BrandMark";

// ---------- Auth ----------
import LoginPage from "../pages/auth/LoginPage";
import ClaimPage from "../pages/auth/ClaimPage";
import GuestLayout from "../pages/auth/GuestLayout";
import GuestDashboard from "../pages/auth/GuestDashboard";
import GuestIbadahPage from "../pages/auth/GuestIbadahPage";
import GuestLeaderboardPage from "../pages/auth/GuestLeaderboardPage";

// ---------- Santri ----------
import SantriDashboard from "../pages/santri/SantriDashboard";
import SantriViolations from "../pages/santri/SantriViolations";
import SantriReports from "../pages/santri/SantriReports";
import SantriTeamPage from "../pages/santri/SantriTeamPage";

// ---------- Shared ----------
import ZikirSchedulePage from "../pages/shared/ZikirSchedulePage";
import GuestZikirPage from "../pages/shared/GuestZikirPage";
import LeaderboardPage from "../pages/shared/LeaderboardPage";
import LeaderboardDetailPage from "../pages/shared/LeaderboardDetailPage";
import LeagueStandingsPage from "../pages/shared/LeagueStandingsPage";
import RecapPage from "../pages/shared/RecapPage";
import ProfilePage from "../pages/shared/ProfilePage";

// ---------- Qism Ibadah ----------
import IbadahDashboard from "../pages/ibadah/IbadahDashboard";
import SantriManagement from "../pages/ibadah/SantriManagement";
import ViolationsManagement from "../pages/ibadah/ViolationsManagement";
import ReportsReview from "../pages/ibadah/ReportsReview";
import RulesManagement from "../pages/ibadah/RulesManagement";
import AdminManagement from "../pages/admin/AdminManagement";
import AuditLog from "../pages/ibadah/AuditLog";
import RiyadhahSuspensionsPage from "../pages/riyadhah/RiyadhahSuspensionsPage";

// ---------- Qism Riyadhah ----------
import RiyadhahDashboard from "../pages/riyadhah/RiyadhahDashboard";
import RiyadhahViolationsPage from "../pages/riyadhah/RiyadhahViolationsPage";
import FixturesPage from "../pages/riyadhah/FixturesPage";
import MatchesPage from "../pages/riyadhah/MatchesPage";
import StandingsPage from "../pages/riyadhah/StandingsPage";
import TeamsPage from "../pages/riyadhah/TeamsPage";
import SeasonsPage from "../pages/riyadhah/SeasonsPage";
import RiyadhahRecapPage from "../pages/riyadhah/RiyadhahRecapPage";

// ---------- Super Admin ----------
import AdminHome from "../pages/admin/AdminHome";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import LeagueSettingsPage from "../pages/admin/LeagueSettingsPage";

// ============================================================
// Home per peran
// ============================================================
const HOME = {
  santri: "/santri",
  qism_ibadah: "/ibadah",
  qism_riyadhah: "/riyadhah",
  super_admin: "/admin",
};
export const homeFor = (role) => HOME[role] ?? "/santri";

// ============================================================
// Helper routes
// ============================================================
function FullPageLoader() {
  return (
    <div className="place-items-center grid bg-ink-950 min-h-screen">
      <div className="flex flex-col items-center gap-3 text-brand-soft">
        <BrandMark className="size-9" />
        <Loader2 size={16} className="animate-spin" />
      </div>
    </div>
  );
}

function ProtectedRoute() {
  const { session, booting, isGuest } = useAuth();
  if (booting) return <FullPageLoader />;
  if (!session && !isGuest) return <Navigate to="/auth/login" replace />;
  return <Outlet />;
}

function ClaimGate() {
  const { session, profile, booting, isGuest } = useAuth();
  if (booting) return <FullPageLoader />;
  if (isGuest) return <Navigate to="/guest" replace />;
  if (!session) return <Navigate to="/auth/login" replace />;
  if (profile === undefined) return <FullPageLoader />;
  if (profile) return <Navigate to={homeFor(profile.role)} replace />;
  return <Outlet />;
}

// Pelindung peran — super_admin boleh masuk SEMUA area.
function RoleRoute({ role }) {
  const { profile } = useAuth();
  if (profile === undefined) return <FullPageLoader />;
  if (!profile) return <Navigate to="/claim" replace />;
  if (profile.role !== role && profile.role !== "super_admin")
    return <Navigate to={homeFor(profile.role)} replace />;
  return <Outlet />;
}

function RootRedirect() {
  const { session, profile, booting, isGuest } = useAuth();
  if (booting) return <FullPageLoader />;
  if (isGuest) return <Navigate to="/guest" replace />;
  if (!session) return <Navigate to="/auth/login" replace />;
  if (profile === undefined) return <FullPageLoader />;
  if (!profile) return <Navigate to="/claim" replace />;
  return <Navigate to={homeFor(profile.role)} replace />;
}

// ============================================================
// Routes
// ============================================================
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth/login" element={<LoginPage />} />

      {/* ---------- MODE TAMU (tanpa login, read-only) ---------- */}
      <Route element={<GuestLayout />}>
        <Route path="/guest" element={<GuestDashboard />} />
        <Route path="/guest/ibadah" element={<GuestIbadahPage />} />
        <Route path="/guest/leaderboard" element={<GuestLeaderboardPage />} />
        <Route path="/guest/zikir" element={<GuestZikirPage />} />
      </Route>

      {/* Pilih kelas & nama — untuk sesi yang belum terhubung profil */}
      <Route element={<ClaimGate />}>
        <Route path="/claim" element={<ClaimPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* ---------------- SANTRI ---------------- */}
          <Route element={<RoleRoute role="santri" />}>
            <Route path="/santri" element={<SantriDashboard />} />
            <Route
              path="/santri/zikir"
              element={<ZikirSchedulePage role="santri" />}
            />
            <Route path="/santri/violations" element={<SantriViolations />} />
            <Route path="/santri/reports" element={<SantriReports />} />
            <Route path="/santri/team" element={<SantriTeamPage />} />
            <Route path="/santri/standings" element={<LeagueStandingsPage />} />
            <Route path="/santri/matches" element={<SantriTeamPage />} />
            <Route
              path="/santri/leaderboard"
              element={<LeaderboardPage role="santri" />}
            />
            <Route
              path="/santri/leaderboard/detail"
              element={<LeaderboardDetailPage role="santri" />}
            />
            <Route path="/santri/recap" element={<RecapPage role="santri" />} />
            <Route
              path="/santri/profile"
              element={<ProfilePage role="santri" />}
            />
          </Route>

          {/* ---------------- QISM IBADAH ---------------- */}
          <Route element={<RoleRoute role="qism_ibadah" />}>
            <Route path="/ibadah" element={<IbadahDashboard />} />
            <Route path="/ibadah/santri" element={<SantriManagement />} />
            <Route
              path="/ibadah/violations"
              element={<ViolationsManagement />}
            />
            <Route path="/ibadah/reports" element={<ReportsReview />} />
            <Route
              path="/ibadah/rules"
              element={<RulesManagement scope="ibadah" />}
            />
            <Route
              path="/ibadah/suspensions"
              element={<RiyadhahSuspensionsPage role="qism_ibadah" />}
            />
            <Route
              path="/ibadah/zikir"
              element={<ZikirSchedulePage role="qism_ibadah" />}
            />
            <Route
              path="/ibadah/leaderboard"
              element={<LeaderboardPage role="qism_ibadah" />}
            />
            <Route
              path="/ibadah/leaderboard/detail"
              element={<LeaderboardDetailPage role="qism_ibadah" />}
            />
            <Route
              path="/ibadah/recap"
              element={<RecapPage role="qism_ibadah" />}
            />
            <Route path="/ibadah/audit" element={<AuditLog />} />
            <Route
              path="/ibadah/profile"
              element={<ProfilePage role="qism_ibadah" />}
            />
          </Route>

          {/* ---------------- QISM RIYADHAH ---------------- */}
          <Route element={<RoleRoute role="qism_riyadhah" />}>
            <Route path="/riyadhah" element={<RiyadhahDashboard />} />
            <Route
              path="/riyadhah/violations"
              element={<RiyadhahViolationsPage />}
            />
            <Route
              path="/riyadhah/rules"
              element={<RulesManagement scope="riyadhah" />}
            />
            <Route path="/riyadhah/roster" element={<SantriManagement />} />
            <Route path="/riyadhah/fixtures" element={<FixturesPage />} />
            <Route path="/riyadhah/matches" element={<MatchesPage />} />
            <Route path="/riyadhah/standings" element={<StandingsPage />} />
            <Route path="/riyadhah/teams" element={<TeamsPage />} />
            <Route path="/riyadhah/seasons" element={<SeasonsPage />} />
            <Route
              path="/riyadhah/suspensions"
              element={<RiyadhahSuspensionsPage role="qism_riyadhah" />}
            />
            <Route path="/riyadhah/recap" element={<RiyadhahRecapPage />} />
            <Route
              path="/riyadhah/profile"
              element={<ProfilePage role="qism_riyadhah" />}
            />
          </Route>

          {/* ---------------- SUPER ADMIN ---------------- */}
          <Route element={<RoleRoute role="super_admin" />}>
            <Route path="/admin" element={<AdminHome />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/admins" element={<AdminManagement />} />
            <Route path="/admin/audit" element={<AuditLog />} />
            <Route path="/admin/settings" element={<LeagueSettingsPage />} />
            <Route
              path="/admin/profile"
              element={<ProfilePage role="super_admin" />}
            />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
