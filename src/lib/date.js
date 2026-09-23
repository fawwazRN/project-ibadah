export const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
export const endOfDay = (d = new Date()) => {
  const x = startOfDay(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

// 1 pekan = JUMAT s.d. KAMIS (sistem pekan madrasah).
// getDay(): 0=Minggu … 5=Jumat, 6=Sabtu → offset ke Jumat terakhir = (getDay()+2)%7
export const startOfWeek = (d = new Date()) => {
  const x = startOfDay(d);
  x.setDate(x.getDate() - ((x.getDay() + 2) % 7)); // Jumat 00:00
  return x;
};
// Akhir pekan = Kamis 23:59:59 (Jumat + 6 hari)
export const endOfWeek = (d = new Date()) => {
  const x = startOfWeek(d);
  x.setDate(x.getDate() + 6);
  return endOfDay(x);
};

export const startOfMonth = (d = new Date()) => {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
};
export const endOfMonth = (d = new Date()) => {
  const x = startOfMonth(d);
  x.setMonth(x.getMonth() + 1);
  x.setDate(0); // hari terakhir bulan berjalan
  return endOfDay(x);
};
export const daysAgo = (n) => {
  const x = startOfDay();
  x.setDate(x.getDate() - n);
  return x;
};

// "2026-09-24" dari input date → Date lokal (bukan UTC), supaya tidak geser hari
const parseLocalDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export function rangeForPreset(preset, from, to) {
  if (preset === "today") return [startOfDay(), new Date()];
  // Pekan & bulan dihitung PENUH sampai hari terakhirnya — penting untuk label
  // laporan cetak (REKAP MINGGUAN = Jumat s.d. Kamis), walau datanya baru
  // ada sampai hari ini. Tidak mempengaruhi kebenaran angka.
  if (preset === "week") return [startOfWeek(), endOfWeek()];
  if (preset === "month") return [startOfMonth(), endOfMonth()];
  return [
    from ? startOfDay(parseLocalDate(from)) : daysAgo(7),
    to ? endOfDay(parseLocalDate(to)) : new Date(), // "s.d." mencakup sehari penuh
  ];
}

export const inRange = (dateLike, [a, b]) => {
  const t = new Date(dateLike).getTime();
  return t >= a.getTime() && t <= b.getTime();
};

const ID = "id-ID";
export const fmtDate = (d) =>
  new Date(d).toLocaleDateString(ID, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
export const fmtDateShort = (d) =>
  new Date(d).toLocaleDateString(ID, { day: "numeric", month: "short" });
export const fmtTime = (d) =>
  new Date(d).toLocaleTimeString(ID, { hour: "2-digit", minute: "2-digit" });
export const fmtDateTime = (d) => `${fmtDate(d)} · ${fmtTime(d)}`;
export const fmtFullDate = (d) =>
  new Date(d).toLocaleDateString(ID, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

export function hijriToday() {
  try {
    return new Intl.DateTimeFormat("id-ID-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  } catch {
    return "";
  }
}

export const timeAgo = (d) => {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "baru saja";
  if (s < 3600) return `${Math.floor(s / 60)} mnt lalu`;
  if (s < 86400) return `${Math.floor(s / 86400)} jam lalu`;
  return `${Math.floor(s / 86400)} hari lalu`;
};
