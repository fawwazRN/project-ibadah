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
} from "lucide-react";

export const NAV = {
  santri: [
    {
      section: "Menu",
      items: [
        { to: "/santri", label: "Dashboard", icon: LayoutDashboard, end: true },
        { to: "/santri/violations", label: "Pelanggaran Saya", icon: Flag },
        {
          to: "/santri/reports",
          label: "Laporan Saya",
          icon: MessageSquareWarning,
        },
        { to: "/santri/leaderboard", label: "Leaderboard", icon: Trophy },
        { to: "/santri/recap", label: "Rekap", icon: FileBarChart },
        { to: "/santri/profile", label: "Profil", icon: UserRound },
      ],
    },
  ],
  osis_ibadah: [
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
        { to: "/ibadah/admins", label: "Admin", icon: ShieldCheck },
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
  return best?.label ?? "Ibadah OSIS";
};
