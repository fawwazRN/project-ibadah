export const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

// 1 pekan = JUMAT s.d. KAMIS (sistem pekan madrasah).
// getDay(): 0=Minggu … 5=Jumat, 6=Sabtu → offset ke Jumat terakhir = (getDay()+2)%7
export const startOfWeek = (d = new Date()) => {
  const x = startOfDay(d);
  x.setDate(x.getDate() - ((x.getDay() + 2) % 7)); // Jumat pukul 00:00
  return x;
};
export const startOfMonth = (d = new Date()) => {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
};
export const daysAgo = (n) => {
  const x = startOfDay();
  x.setDate(x.getDate() - n);
  return x;
};

export function rangeForPreset(preset, from, to) {
  if (preset === "today") return [startOfDay(), new Date()];
  if (preset === "week") return [startOfWeek(), new Date()];
  if (preset === "month") return [startOfMonth(), new Date()];
  return [from ? new Date(from) : daysAgo(7), to ? new Date(to) : new Date()];
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
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  return `${Math.floor(s / 86400)} hari lalu`;
};
