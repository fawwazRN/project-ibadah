export const RULE_CATEGORIES = [
  "Shalat",
  "Zikir & Doa",
  "Pakaian",
  "Kegiatan",
  "Umum",
];

export const REPORT_REASONS = [
  "Saya sudah melaksanakan ibadah tersebut",
  "Pelanggaran tidak sesuai fakta",
  "Ada kesalahan pencatatan dari petugas",
  "Izin / kondisi khusus (sakit, dsb.)",
  "Lainnya",
];

export const OPEN_VIOLATION_STATUSES = ["active", "reported", "under_review"];

export const VIOLATION_STATUS_LABELS = {
  active: "Aktif",
  reported: "Dilaporkan",
  under_review: "Ditinjau",
  confirmed: "Terbukti",
  revoked: "Dibatalkan",
};

export const REPORT_STATUS_LABELS = {
  pending: "Menunggu",
  reviewing: "Ditinjau",
  accepted: "Diterima",
  rejected: "Ditolak",
};

// ---------- Peran ----------
export const ROLE_LABELS = {
  santri: "Santri",
  qism_ibadah: "Qism Ibadah",
  qism_riyadhah: "Qism Riyadhah",
  nadzhofah: "Qism Nadzhofah",
  lughah: "Qism Lughah",
  super_admin: "Super Admin",
};

// ---------- Waktu shalat ----------
export const PRAYER_TIMES = ["subuh", "zuhur", "ashar", "maghrib", "isya"];

export const PRAYER_LABELS = {
  subuh: "Subuh",
  zuhur: "Zuhur",
  ashar: "Ashar",
  maghrib: "Maghrib",
  isya: "Isya",
};

export const PRAYER_CLOCK = {
  subuh: "05:00",
  zuhur: "12:15",
  ashar: "15:30",
  maghrib: "18:05",
  isya: "19:30",
};

const PRAYER_KEYWORDS = {
  subuh: ["subuh", "fajar", "fajr"],
  zuhur: ["zuhur", "dzuhur", "zuhor", "lohor", "luhur"],
  ashar: ["ashar", "asar"],
  maghrib: ["maghrib", "magrib"],
  isya: ["isya", "isyak"],
};

export function detectPrayer(text) {
  const t = (text ?? "").toLowerCase();
  let best = null;
  let bestIdx = -1;
  for (const [prayer, words] of Object.entries(PRAYER_KEYWORDS)) {
    for (const w of words) {
      const i = t.indexOf(w);
      if (i !== -1 && i > bestIdx) {
        best = prayer;
        bestIdx = i;
      }
    }
  }
  return best;
}

// ---------- Liga ----------
export const MATCH_STATUS_LABELS = {
  scheduled: "Terjadwal",
  draft: "Draf",
  submitted: "Menunggu Verifikasi",
  verified: "Terverifikasi",
  official: "Resmi",
  postponed: "Ditunda",
  cancelled: "Dibatalkan",
};

export const MATCH_STATUS_TONES = {
  scheduled: "sky",
  draft: "neutral",
  submitted: "amber",
  verified: "violet",
  official: "emerald",
  postponed: "neutral",
  cancelled: "rose",
};

export const SUSPENSION_LABELS = {
  active: "Aktif",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const MATCH_EVENTS = [
  { value: "goal", label: "Gol" },
  { value: "own_goal", label: "Gol Bunuh Diri" },
  { value: "yellow", label: "Kartu Kuning" },
  { value: "red", label: "Kartu Merah" },
  { value: "substitution", label: "Pergantian" },
];
