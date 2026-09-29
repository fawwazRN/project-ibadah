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
  Footprints,
  Shirt,
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
        {
          label: "Nadzhofah",
          icon: Footprints,
          children: [
            { to: "/santri/nadzhofah", label: "Riwayat Nyeker Saya" },
            { to: "/santri/nadzhofah/leaderboard", label: "Santri Nakal" },
          ],
        },
        {
          label: "Leaderboard",
          icon: Trophy,
          children: [
            { to: "/santri/leaderboard", label: "Papan Nakal Ibadah" },
            { to: "/santri/standings", label: "Klasemen Liga" },
          ],
        },
        { to: "/santri/recap", label: "Rekap", icon: FileBarChart },
        { to: "/santri/profile", label: "Profil", icon: UserRound },
      ],
    },
  ],

  // ---------- QISM IBADAH ----------
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
        {
          label: "Leaderboard",
          icon: Trophy,
          children: [{ to: "/ibadah/leaderboard", label: "Papan Nakal" }],
        },
        { to: "/ibadah/recap", label: "Rekap", icon: FileBarChart },
        { to: "/ibadah/audit", label: "Log Audit", icon: History },
        { to: "/ibadah/profile", label: "Profil", icon: UserRound },
      ],
    },
  ],

  // ---------- QISM RIYADHAH ----------
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
      section: "Analitik & Sistem",
      items: [
        {
          label: "Leaderboard",
          icon: Trophy,
          children: [{ to: "/riyadhah/standings", label: "Klasemen Liga" }],
        },
        { to: "/riyadhah/profile", label: "Profil", icon: UserRound },
      ],
    },
  ],

  // ---------- QISM NADZHOFah ----------
  nadzhofah: [
    {
      section: "Nadzhofah",
      items: [
        {
          to: "/nadzhofah",
          label: "Dashboard",
          icon: LayoutDashboard,
          end: true,
        },
        { to: "/nadzhofah/nyeker", label: "Catat Nyeker", icon: Footprints },
        { to: "/nadzhofah/rekap", label: "Rekap", icon: FileBarChart },
        { to: "/nadzhofah/pakaian", label: "Penyitaan & Lelang", icon: Shirt },
        {
          label: "Leaderboard",
          icon: Trophy,
          children: [{ to: "/nadzhofah/leaderboard", label: "Santri Nakal" }],
        },
      ],
    },
    {
      section: "Akun",
      items: [{ to: "/nadzhofah/profile", label: "Profil", icon: UserRound }],
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
        { to: "/riyadhah/seasons", label: "Fase & Musim", icon: ClipboardList },
        { to: "/riyadhah/suspensions", label: "Daftar Suspensi", icon: Ban },
        { to: "/riyadhah/recap", label: "Rekap Liga", icon: Printer },
      ],
    },

    {
      section: "Qism Nadzhofah",
      items: [
        {
          to: "/nadzhofah",
          label: "Dashboard Nadzhofah",
          icon: Footprints,
          end: true,
        },
        { to: "/nadzhofah/nyeker", label: "Catat Nyeker", icon: Footprints },
        { to: "/nadzhofah/rekap", label: "Rekap Nyeker", icon: FileBarChart },
        { to: "/nadzhofah/pakaian", label: "Penyitaan & Lelang", icon: Shirt },
        {
          to: "/nadzhofah/leaderboard",
          label: "Santri Nakal",
          icon: Footprints,
        },
      ],
    },

    {
      section: "Leaderboard",
      items: [
        {
          label: "Leaderboard",
          icon: Trophy,
          children: [
            { to: "/ibadah/leaderboard", label: "Qism Ibadah — Papan Nakal" },
            {
              to: "/riyadhah/standings",
              label: "Qism Riyadhah — Klasemen Liga",
            },
            {
              to: "/nadzhofah/leaderboard",
              label: "Qism Nadzhofah — Santri Nakal",
            },
          ],
        },
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
  const consider = (it) => {
    if (
      pathname === it.to ||
      (pathname.startsWith(it.to + "/") &&
        (!best || it.to.length > best.to.length))
    )
      best = it;
  };
  for (const g of nav)
    for (const it of g.items) {
      if (it.to) consider(it);
      if (it.children) for (const c of it.children) consider(c);
    }
  return best?.label ?? "OSIS Management";
};
