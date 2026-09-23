import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../layouts/DashboardLayout";
import { BrandMark } from "../components/ui/BrandMark";
import LoginPage from "../pages/auth/LoginPage";
import ClaimPage from "../pages/auth/ClaimPage";
import SantriDashboard from "../pages/santri/SantriDashboard";
import SantriViolations from "../pages/santri/SantriViolations";
import SantriReports from "../pages/santri/SantriReports";
import ZikirSchedulePage from "../pages/shared/ZikirSchedulePage";
import IbadahDashboard from "../pages/ibadah/IbadahDashboard";
import SantriManagement from "../pages/ibadah/SantriManagement";
import ViolationsManagement from "../pages/ibadah/ViolationsManagement";
import ReportsReview from "../pages/ibadah/ReportsReview";
import RulesManagement from "../pages/ibadah/RulesManagement";
import AdminManagement from "../pages/ibadah/AdminManagement";
import AuditLog from "../pages/ibadah/AuditLog";
import LeaderboardPage from "../pages/shared/LeaderboardPage";
import LeaderboardDetailPage from "../pages/shared/LeaderboardDetailPage";
import RecapPage from "../pages/shared/RecapPage";
import ProfilePage from "../pages/shared/ProfilePage";

export const homeFor = (role) =>
  role === "osis_ibadah" ? "/ibadah" : "/santri";

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
  const { session, booting } = useAuth();
  if (booting) return <FullPageLoader />;
  if (!session) return <Navigate to="/auth/login" replace />;
  return <Outlet />;
}

// Sesi yang belum punya profil → wajib lewat halaman pilih nama dulu.
function ClaimGate() {
  const { session, profile, booting } = useAuth();
  if (booting) return <FullPageLoader />;
  if (!session) return <Navigate to="/auth/login" replace />;
  if (profile === undefined) return <FullPageLoader />;
  if (profile) return <Navigate to={homeFor(profile.role)} replace />;
  return <Outlet />;
}

function RoleRoute({ role }) {
  const { profile } = useAuth();
  if (profile === undefined) return <FullPageLoader />;
  if (!profile) return <Navigate to="/claim" replace />;
  if (profile.role !== role)
    return <Navigate to={homeFor(profile.role)} replace />;
  return <Outlet />;
}

function RootRedirect() {
  const { session, profile, booting } = useAuth();
  if (booting) return <FullPageLoader />;
  if (!session) return <Navigate to="/auth/login" replace />;
  if (profile === undefined) return <FullPageLoader />;
  if (!profile) return <Navigate to="/claim" replace />;
  return <Navigate to={homeFor(profile.role)} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth/login" element={<LoginPage />} />

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

          {/* ---------------- OSIS IBADAH (ADMIN) ---------------- */}
          <Route element={<RoleRoute role="osis_ibadah" />}>
            <Route path="/ibadah" element={<IbadahDashboard />} />
            <Route path="/ibadah/santri" element={<SantriManagement />} />
            <Route
              path="/ibadah/violations"
              element={<ViolationsManagement />}
            />
            <Route path="/ibadah/reports" element={<ReportsReview />} />
            <Route path="/ibadah/rules" element={<RulesManagement />} />
            <Route
              path="/ibadah/zikir"
              element={<ZikirSchedulePage role="osis_ibadah" />}
            />
            <Route path="/ibadah/admins" element={<AdminManagement />} />
            <Route
              path="/ibadah/leaderboard"
              element={<LeaderboardPage role="osis_ibadah" />}
            />
            <Route
              path="/ibadah/leaderboard/detail"
              element={<LeaderboardDetailPage role="osis_ibadah" />}
            />
            <Route
              path="/ibadah/recap"
              element={<RecapPage role="osis_ibadah" />}
            />
            <Route path="/ibadah/audit" element={<AuditLog />} />
            <Route
              path="/ibadah/profile"
              element={<ProfilePage role="osis_ibadah" />}
            />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
