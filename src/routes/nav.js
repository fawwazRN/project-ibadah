import {
  HeartHandshake,
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
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Sparkles,
  Home,
  Medal,
  MessagesSquare,
  Newspaper,
  Heart,
  MonitorPlay,
} from "lucide-react";

export const NAV = {
  // ---------- SANTRI ----------
  // (dipakai rail desktop; di mobile navigasi utamanya = STUDENT_TABS)
  santri: [
    {
      section: "Utama",
      items: [
        { to: "/santri", label: "Beranda", icon: Home, end: true },
        { to: "/santri/file-osis", label: "File OSIS", icon: MonitorPlay },
        { to: "/santri/kalender", label: "Kalender OSIS", icon: CalendarDays },
        { to: "/santri/bk", label: "Kak Peci", icon: MessagesSquare },
        { to: "/santri/curhat", label: "Curhat ke OSIS", icon: HeartHandshake },
        { to: "/santri/artikel", label: "Artikel BK", icon: Newspaper },
        { to: "/santri/standings", label: "Klasemen Liga", icon: Trophy },
        { to: "/santri/leaderboard", label: "Papan Nakal", icon: Medal },
        { to: "/santri/violations", label: "Catatanku", icon: Flag },
        { to: "/santri/profile", label: "Profil", icon: UserRound },
      ],
    },
    {
      section: "Qism",
      items: [
        { to: "/santri/zikir", label: "Jadwal Zikir", icon: CalendarClock },
        { to: "/santri/nadzhofah", label: "Nadzhofah", icon: Footprints },
        { to: "/santri/lughah", label: "Lughah", icon: BookOpenCheck },
        { to: "/santri/team", label: "Tim & Laga", icon: Volleyball },
      ],
    },
    {
      section: "Lainnya",
      items: [
        {
          to: "/santri/reports",
          label: "Laporanku",
          icon: MessageSquareWarning,
        },
        { to: "/santri/recap", label: "Rekap", icon: FileBarChart },
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
        { to: "/ibadah/kalender", label: "Kalender OSIS", icon: CalendarDays },
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
        { to: "/riyadhah/kalender", label: "Kalender OSIS", icon: CalendarDays },
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
      items: [
        { to: "/nadzhofah/kalender", label: "Kalender OSIS", icon: CalendarDays },
        { to: "/nadzhofah/profile", label: "Profil", icon: UserRound },
      ],
    },
  ],

  // ---------- QISM LUGHAH ----------
  lughah: [
    {
      section: "Lughah",
      items: [
        { to: "/lughah", label: "Dashboard", icon: LayoutDashboard, end: true },
        { to: "/lughah/kelengkapan", label: "Kelengkapan", icon: CheckCircle2 },
        { to: "/lughah/nilai", label: "Nilai", icon: ClipboardCheck },
        { to: "/lughah/mufrodat", label: "Mufrodat", icon: BookOpenCheck },
        { to: "/lughah/rekap", label: "Rekap", icon: FileBarChart },
      ],
    },
    {
      section: "Akun",
      items: [
        { to: "/lughah/kalender", label: "Kalender OSIS", icon: CalendarDays },
        { to: "/lughah/profile", label: "Profil", icon: UserRound },
      ],
    },
  ],

  // ---------- SUPER ADMIN ----------
  super_admin: [
    {
      section: "Super Admin",
      items: [
        { to: "/admin", label: "Ringkasan", icon: LayoutDashboard, end: true },
        { to: "/admin/file-osis", label: "Kelola File OSIS", icon: MonitorPlay },
        { to: "/admin/users", label: "Pengguna & Peran", icon: Users },
        { to: "/admin/admins", label: "Calon Admin", icon: ShieldCheck },
        { to: "/admin/invitation", label: "Undangan", icon: Sparkles },
        { to: "/admin/audit", label: "Log Audit", icon: History },
        { to: "/admin/settings", label: "Pengaturan Liga", icon: Settings },
        { to: "/admin/curhat", label: "Curhat Santri", icon: HeartHandshake },
        { to: "/admin/bk", label: "Alur Kak Peci", icon: MessagesSquare },
        { to: "/admin/bk/artikel", label: "Artikel BK", icon: Newspaper },
        { to: "/admin/presentasi", label: "Presentasi", icon: MonitorPlay },
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
        { to: "/riyadhah/teams", label: "Tim & Pemain", icon: Users },
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
      section: "Qism Lughah",
      items: [
        {
          to: "/lughah",
          label: "Dashboard Lughah",
          icon: BookOpenCheck,
          end: true,
        },
        { to: "/lughah/kelengkapan", label: "Kelengkapan", icon: CheckCircle2 },
        { to: "/lughah/nilai", label: "Nilai", icon: ClipboardCheck },
        { to: "/lughah/mufrodat", label: "Mufrodat", icon: BookOpenCheck },
        { to: "/lughah/rekap", label: "Rekap Lughah", icon: FileBarChart },
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
      items: [
        { to: "/admin/kalender", label: "Kalender OSIS", icon: CalendarDays },
        { to: "/admin/profile", label: "Profil", icon: UserRound },
      ],
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

// Tab bawah (mobile) untuk santri — 5 tujuan utama, sisanya lewat Beranda.
// `match` = awalan rute yang menyalakan tab (halaman turunan tetap menyala).
export const STUDENT_TABS = [
  { to: "/santri", label: "Beranda", icon: Home, exact: true },
  {
    to: "/santri/standings",
    label: "Liga",
    icon: Trophy,
    match: ["/santri/standings", "/santri/team", "/santri/matches"],
  },
  {
    to: "/santri/leaderboard",
    label: "Peringkat",
    icon: Medal,
    match: ["/santri/leaderboard"],
  },
  {
    to: "/santri/violations",
    label: "Catatan",
    icon: ClipboardList,
    match: ["/santri/violations", "/santri/reports"],
  },
  {
    to: "/santri/profile",
    label: "Aku",
    icon: UserRound,
    match: ["/santri/profile"],
  },
];

export const isTabActive = (tab, pathname) =>
  tab.exact
    ? pathname === tab.to
    : (tab.match ?? [tab.to]).some(
        (p) => pathname === p || pathname.startsWith(p + "/"),
      );

// Halaman "akar" = halaman yang punya tab sendiri → tidak perlu tombol kembali.
export const isStudentRoot = (pathname) =>
  STUDENT_TABS.some((t) => t.to === pathname);

// Remah roti untuk admin: [nama grup, nama halaman]
export const crumbsFor = (pathname, nav) => {
  let best = null;
  const consider = (it, section) => {
    if (
      it.to &&
      (pathname === it.to ||
        (pathname.startsWith(it.to + "/") &&
          (!best || it.to.length > best.to.length)))
    )
      best = { to: it.to, label: it.label, section };
  };
  for (const g of nav)
    for (const it of g.items) {
      consider(it, g.section);
      if (it.children) for (const c of it.children) consider(c, g.section);
    }
  return best;
};

// Daftar datar semua tujuan (untuk command palette)
export const flattenNav = (nav) => {
  const out = [];
  for (const g of nav)
    for (const it of g.items) {
      if (it.to)
        out.push({ to: it.to, label: it.label, icon: it.icon, section: g.section });
      if (it.children)
        for (const c of it.children)
          out.push({ to: c.to, label: c.label, icon: it.icon, section: g.section });
    }
  const seen = new Set();
  return out.filter((x) => (seen.has(x.to) ? false : seen.add(x.to)));
};

// Aksi cepat per peran — muncul di command palette (Ctrl/⌘ + K)
export const QUICK_ACTIONS = {
  qism_ibadah: [
    { to: "/ibadah/violations?new=1", label: "Catat pelanggaran baru", icon: Flag },
  ],
  qism_riyadhah: [
    { to: "/riyadhah/matches", label: "Input hasil pertandingan", icon: Gavel },
  ],
  nadzhofah: [
    { to: "/nadzhofah/nyeker", label: "Catat nyeker", icon: Footprints },
  ],
  lughah: [{ to: "/lughah/nilai", label: "Input nilai", icon: ClipboardCheck }],
  super_admin: [
    { to: "/ibadah/violations?new=1", label: "Catat pelanggaran baru", icon: Flag },
    { to: "/nadzhofah/nyeker", label: "Catat nyeker", icon: Footprints },
    { to: "/lughah/nilai", label: "Input nilai", icon: ClipboardCheck },
    { to: "/riyadhah/matches", label: "Input hasil pertandingan", icon: Gavel },
  ],
};
