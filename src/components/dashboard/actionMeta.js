import {
  Flag,
  Pencil,
  CheckCheck,
  Ban,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Power,
  MessageSquarePlus,
} from "lucide-react";

export const ACTION_META = {
  violation_created: { label: "Catat pelanggaran", icon: Flag, tone: "amber" },
  violation_updated: {
    label: "Perbarui pelanggaran",
    icon: Pencil,
    tone: "neutral",
  },
  violation_confirmed: {
    label: "Konfirmasi pelanggaran",
    icon: CheckCheck,
    tone: "rose",
  },
  violation_revoked: {
    label: "Batalkan pelanggaran",
    icon: Ban,
    tone: "emerald",
  },
  report_submitted: {
    label: "Klarifikasi diajukan",
    icon: MessageSquarePlus,
    tone: "sky",
  },
  report_reviewing: { label: "Laporan ditinjau", icon: Eye, tone: "sky" },
  report_accepted: {
    label: "Laporan diterima",
    icon: ThumbsUp,
    tone: "emerald",
  },
  report_rejected: { label: "Laporan ditolak", icon: ThumbsDown, tone: "rose" },
  rule_created: { label: "Buat aturan", icon: Plus, tone: "violet" },
  rule_updated: { label: "Perbarui aturan", icon: Pencil, tone: "neutral" },
  rule_activated: { label: "Aktifkan aturan", icon: Power, tone: "emerald" },
  rule_deactivated: {
    label: "Nonaktifkan aturan",
    icon: Power,
    tone: "neutral",
  },
};
