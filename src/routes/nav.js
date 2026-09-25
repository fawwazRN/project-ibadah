import {
  LayoutDashboard,
  Users,
  Flag,
  MessageSquareWarning,
  Scale,
  ShieldCheck,
  Trophy,
  FileBarChart,
  History,
  UserRound,
  CalendarClock,
  Volleyball,
  Table2,
  CalendarDays,
  Gavel,
  Settings,
  ClipboardList,
  Ban,
  Printer,
} from "lucide-react";

export const NAV = {
  // ---------- SANTRI ----------
  santri: [
    {
      section: "Menu",
      items: [
        { to: "/santri", label: "Dashboard", icon: LayoutDashboard, end: true },
        { to: "/santri/zikir", label: "Jadwal Zikir", icon: CalendarClock },
        { to: "/santri/violations", label: "Pelanggaran Saya", icon: Flag },
        {
          to: "/santri/reports",
          label: "Laporan Saya",
          icon: MessageSquareWarning,
        },
        { to: "/santri/team", label: "Tim Saya", icon: Volleyball },
        { to: "/santri/matches", label: "Pertandingan", icon: CalendarDays },
        { to: "/santri/leaderboard", label: "Leaderboard", icon: Trophy },
        { to: "/santri/recap", label: "Rekap", icon: FileBarChart },
        { to: "/santri/profile", label: "Profil", icon: UserRound },
      ],
    },
  ],

  // ---------- QISM IBADAH (tanpa calon admin) ----------
  qism_ibadah: [
    {
      section: "Ikhtisar",
      items: [
        { to: "/ibadah", label: "Dashboard", icon: LayoutDashboard, end: true },
      ],
    },
    {
      section: "Manajemen",
      items: [
        { to: "/ibadah/santri", label: "Santri", icon: Users },
        { to: "/ibadah/violations", label: "Pelanggaran", icon: Flag },
        { to: "/ibadah/reports", label: "Laporan", icon: MessageSquareWarning },
        { to: "/ibadah/rules", label: "Aturan Poin", icon: Scale },
        { to: "/ibadah/suspensions", label: "Suspensi", icon: Ban },
        { to: "/ibadah/zikir", label: "Jadwal Zikir", icon: CalendarClock },
      ],
    },
    {
      section: "Analitik & Sistem",
      items: [
        { to: "/ibadah/leaderboard", label: "Leaderboard", icon: Trophy },
        { to: "/ibadah/recap", label: "Rekap", icon: FileBarChart },
        { to: "/ibadah/audit", label: "Log Audit", icon: History },
        { to: "/ibadah/profile", label: "Profil", icon: UserRound },
      ],
    },
  ],

  // ---------- QISM RIYADHAH (tanpa calon admin) ----------
  qism_riyadhah: [
    {
      section: "Pertandingan",
      items: [
        {
          to: "/riyadhah",
          label: "Match Center",
          icon: LayoutDashboard,
          end: true,
        },
        {
          to: "/riyadhah/fixtures",
          label: "Jadwal & Hasil",
          icon: CalendarDays,
        },
        { to: "/riyadhah/matches", label: "Kelola Pertandingan", icon: Gavel },
        { to: "/riyadhah/standings", label: "Klasemen", icon: Table2 },
      ],
    },
    {
      section: "Pelanggaran & Liga",
      items: [
        {
          to: "/riyadhah/violations",
          label: "Pelanggaran & Suspensi",
          icon: Flag,
        },
        { to: "/riyadhah/rules", label: "Aturan Pelanggaran", icon: Scale },
        { to: "/riyadhah/roster", label: "Data Santri", icon: Users },
        { to: "/riyadhah/teams", label: "Tim & Pemain", icon: Users },
        { to: "/riyadhah/seasons", label: "Fase & Musim", icon: ClipboardList },
        { to: "/riyadhah/suspensions", label: "Daftar Suspensi", icon: Ban },
        { to: "/riyadhah/recap", label: "Rekap Liga", icon: Printer },
      ],
    },
    {
      section: "Sistem",
      items: [{ to: "/riyadhah/profile", label: "Profil", icon: UserRound }],
    },
  ],

  // ---------- SUPER ADMIN ----------
  super_admin: [
    {
      section: "Super Admin",
      items: [
        { to: "/admin", label: "Ringkasan", icon: LayoutDashboard, end: true },
        { to: "/admin/users", label: "Pengguna & Peran", icon: Users },
        { to: "/admin/admins", label: "Calon Admin", icon: ShieldCheck },
        { to: "/admin/audit", label: "Log Audit", icon: History },
        { to: "/admin/settings", label: "Pengaturan Liga", icon: Settings },
      ],
    },

    {
      section: "Qism Ibadah",
      items: [
        { to: "/ibadah", label: "Dashboard Ibadah", icon: Flag, end: true },
        { to: "/ibadah/santri", label: "Santri", icon: Users },
        { to: "/ibadah/violations", label: "Pelanggaran", icon: Flag },
        { to: "/ibadah/reports", label: "Laporan", icon: MessageSquareWarning },
        { to: "/ibadah/rules", label: "Aturan Poin", icon: Scale },
        { to: "/ibadah/suspensions", label: "Suspensi", icon: Ban },
        { to: "/ibadah/zikir", label: "Jadwal Zikir", icon: CalendarClock },
        { to: "/ibadah/leaderboard", label: "Leaderboard", icon: Trophy },
        { to: "/ibadah/recap", label: "Rekap Ibadah", icon: FileBarChart },
      ],
    },

    {
      section: "Qism Riyadhah",
      items: [
        { to: "/riyadhah", label: "Match Center", icon: Volleyball, end: true },
        {
          to: "/riyadhah/violations",
          label: "Pelanggaran & Suspensi",
          icon: Flag,
        },
        { to: "/riyadhah/rules", label: "Aturan Pelanggaran", icon: Scale },
        { to: "/riyadhah/roster", label: "Data Santri", icon: Users },
        {
          to: "/riyadhah/fixtures",
          label: "Jadwal & Hasil",
          icon: CalendarDays,
        },
        { to: "/riyadhah/matches", label: "Kelola Pertandingan", icon: Gavel },
        { to: "/riyadhah/standings", label: "Klasemen", icon: Table2 },
        { to: "/riyadhah/teams", label: "Tim & Pemain", icon: Users },
        { to: "/riyadhah/seasons", label: "Fase & Musim", icon: ClipboardList },
        { to: "/riyadhah/suspensions", label: "Daftar Suspensi", icon: Ban },
        { to: "/riyadhah/recap", label: "Rekap Liga", icon: Printer },
      ],
    },

    {
      section: "Akun",
      items: [{ to: "/admin/profile", label: "Profil", icon: UserRound }],
    },
  ],
};

export const pageTitleFor = (pathname, nav) => {
  let best = null;
  for (const g of nav)
    for (const it of g.items) {
      if (
        pathname === it.to ||
        (pathname.startsWith(it.to + "/") &&
          (!best || it.to.length > best.to.length))
      )
        best = it;
    }
  return best?.label ?? "OSIS Management";
};
