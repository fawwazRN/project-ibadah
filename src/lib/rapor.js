// Model rapor santri untuk portal orang tua.
// Semua bobot & ambang predikat ada di sini — ubah sesuai kebijakan madrasah.

// Pengurangan nilai (dari 100) per kejadian
export const WEIGHTS = {
  ibadahPerPoint: 5, // sama dengan rumus lama (lib/student.js)
  riyadhahPerPoint: 5,
  nyeker: 8, // per kali nyeker
  clothingPerPcs: 4, // per potong pakaian disita
};

export const GRADES = [
  { min: 90, ar: "Mumtaz", id: "Istimewa", letter: "A", color: "#16a34a", tint: "#e6f7ee" },
  { min: 80, ar: "Jayyid Jiddan", id: "Sangat Baik", letter: "B+", color: "#2f80f0", tint: "#e8f1fe" },
  { min: 70, ar: "Jayyid", id: "Baik", letter: "B", color: "#0d9488", tint: "#dcf7f4" },
  { min: 60, ar: "Maqbul", id: "Cukup", letter: "C", color: "#e08a00", tint: "#fff2df" },
  { min: 0, ar: "Rasib", id: "Perlu Pembinaan", letter: "D", color: "#ef4d43", tint: "#fdeceb" },
];

export const clamp = (n, a = 0, b = 100) => Math.max(a, Math.min(b, n));
export const gradeOf = (score) =>
  score == null ? null : (GRADES.find((g) => score >= g.min) ?? GRADES[GRADES.length - 1]);

export const PERIODS = [
  { key: "all", label: "Semua" },
  { key: "month", label: "Bulan ini" },
  { key: "30", label: "30 hari" },
  { key: "90", label: "90 hari" },
];

const fmtD = (d) => d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

export function rangeFor(key, now = new Date()) {
  if (key === "month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from, label: now.toLocaleDateString("id-ID", { month: "long", year: "numeric" }) };
  }
  if (key === "30" || key === "90") {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    from.setDate(from.getDate() - Number(key));
    return { from, label: `${fmtD(from)} – ${fmtD(now)}` };
  }
  return { from: null, label: "Seluruh periode" };
}

const inRange = (d, from) => {
  if (!from || !d) return true;
  const t = new Date(d);
  return Number.isNaN(t.getTime()) || t >= from;
};

const sumPts = (l) => l.reduce((a, v) => a + (v.rule?.points ?? 0), 0);

function topRules(list, n = 5) {
  const m = new Map();
  for (const v of list) {
    const k = v.rule?.name ?? "Pelanggaran";
    const cur = m.get(k) ?? { name: k, total: 0, poin: 0 };
    cur.total += 1;
    cur.poin += v.rule?.points ?? 0;
    m.set(k, cur);
  }
  return [...m.values()].sort((a, b) => b.total - a.total || b.poin - a.poin).slice(0, n);
}

const AREA_LABEL = { ibadah: "Ibadah", riyadhah: "Riyadhah", nadzhofah: "Nadzhofah", lughah: "Lughah" };

function buildNote(m) {
  const g = m.overall.grade;
  const open = !g
    ? "Data penilaian ananda belum cukup untuk disimpulkan."
    : m.overall.score >= 90
      ? "Alhamdulillah, ananda menunjukkan kedisiplinan dan perkembangan yang istimewa. Semoga istiqamah."
      : m.overall.score >= 80
        ? "Ananda menunjukkan perkembangan yang sangat baik. Pertahankan dan tingkatkan terus."
        : m.overall.score >= 70
          ? "Ananda berada pada jalur yang baik, namun masih ada hal yang bisa ditingkatkan."
          : m.overall.score >= 60
            ? "Ananda memerlukan perhatian dan dorongan lebih agar disiplinnya semakin baik."
            : "Ananda memerlukan pembinaan intensif. Kami mengajak Bapak/Ibu bekerja sama dengan pihak madrasah.";
  const parts = [open];
  const scored = m.areas.filter((a) => a.score != null).sort((a, b) => a.score - b.score);
  if (scored.length > 1 && scored[0].score < 80)
    parts.push(`Bidang yang paling perlu didukung: ${scored[0].label}.`);
  if (m.lughah.has && !m.lughah.complete)
    parts.push("Kelengkapan ujian Lughah belum lengkap — mohon diingatkan agar segera dilengkapi.");
  if (m.ibadah.count === 0 && m.riyadhah.count === 0 && m.nadzhofah.nyeker === 0)
    parts.push("Tidak ada catatan pelanggaran pada periode ini. Barakallahu fiik.");
  return parts.join(" ");
}

export function buildReport({ data, lughah, periodKey = "all" }) {
  const { from, label } = rangeFor(periodKey);
  const student = data?.student ?? {};

  const allVio = (data?.violations ?? []).filter((v) => v.status !== "revoked");
  const vio = allVio.filter((v) => inRange(v.occurred_at ?? v.created_at, from));
  const scoped = (list, scope) => list.filter((v) => (v.rule?.scope ?? "ibadah") === scope);

  // ---- Ibadah
  const ib = scoped(vio, "ibadah");
  const ibPts = sumPts(ib);
  const ibAll = scoped(allVio, "ibadah");
  let cleanDays = null;
  if (ibAll.length) {
    const last = Math.max(...ibAll.map((v) => new Date(v.occurred_at ?? v.created_at).getTime()));
    cleanDays = Math.max(0, Math.floor((Date.now() - last) / 86400000));
  }
  const byPrayer = {};
  for (const v of ib) if (v.prayer_time) byPrayer[v.prayer_time] = (byPrayer[v.prayer_time] ?? 0) + 1;
  const ibScore = clamp(100 - ibPts * WEIGHTS.ibadahPerPoint);

  // ---- Riyadhah
  const ry = scoped(vio, "riyadhah");
  const ryPts = sumPts(ry);
  const ryScore = clamp(100 - ryPts * WEIGHTS.riyadhahPerPoint);

  // ---- Nadzhofah
  const nyeker = (data?.nyeker ?? []).filter((n) => inRange(n.nyeker_date, from));
  const clothing = (data?.clothing ?? []).filter((c) => inRange(c.created_at, from));
  const clothingQty = clothing.reduce((a, c) => a + (c.quantity ?? 1), 0);
  const fines = nyeker.reduce((a, n) => a + Number(n.fine_amount || 0), 0);
  const nzScore = clamp(100 - nyeker.length * WEIGHTS.nyeker - clothingQty * WEIGHTS.clothingPerPcs);

  // ---- Lughah
  const lg = Array.isArray(lughah) ? lughah[0] : lughah;
  const lgScore = lg?.score ?? null;
  const lgItems = [
    { key: "sudah_setor", label: "Setoran", ok: !!lg?.sudah_setor },
    { key: "sudah_tanda_tangan", label: "Tanda tangan", ok: !!lg?.sudah_tanda_tangan },
    { key: "sudah_bawa_buku", label: "Membawa buku", ok: !!lg?.sudah_bawa_buku },
    { key: "sudah_lengkap_tulisan", label: "Kelengkapan tulisan", ok: !!lg?.sudah_lengkap_tulisan },
  ];

  const areas = [
    { key: "ibadah", label: AREA_LABEL.ibadah, score: ibScore, grade: gradeOf(ibScore) },
    { key: "riyadhah", label: AREA_LABEL.riyadhah, score: ryScore, grade: gradeOf(ryScore) },
    { key: "nadzhofah", label: AREA_LABEL.nadzhofah, score: nzScore, grade: gradeOf(nzScore) },
    { key: "lughah", label: AREA_LABEL.lughah, score: lgScore, grade: gradeOf(lgScore) },
  ];
  const nums = areas.filter((a) => a.score != null).map((a) => a.score);
  const overallScore = nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;

  const model = {
    student,
    periodKey,
    periodLabel: label,
    ibadah: { count: ib.length, pts: ibPts, score: ibScore, grade: gradeOf(ibScore), top: topRules(ib), cleanDays, byPrayer, list: ib },
    riyadhah: { team: data?.team?.name ?? null, count: ry.length, pts: ryPts, score: ryScore, grade: gradeOf(ryScore), top: topRules(ry), list: ry },
    nadzhofah: { nyeker: nyeker.length, fines, clothing: clothingQty, score: nzScore, grade: gradeOf(nzScore), nyekerList: nyeker, clothingList: clothing },
    lughah: {
      has: !!lg,
      periodName: lg?.period_name ?? null,
      items: lgItems,
      complete: !!lg?.is_complete,
      score: lgScore,
      grade: gradeOf(lgScore),
    },
    areas,
    overall: { score: overallScore, grade: gradeOf(overallScore) },
  };
  model.note = buildNote(model);
  return model;
}

export const rupiah = (n) => `Rp${Number(n || 0).toLocaleString("id-ID")}`;
export const dayLabel = (d) =>
  d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "";
