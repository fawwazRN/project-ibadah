import { OPEN_STATUSES, sumPoints } from "./calc";

// Statistik ringkas santri — dihitung dari data pelanggaran miliknya sendiri.
// • score     : 100 − (poin aktif × 5), dibatasi 0–100 (rumus lama dipertahankan)
// • cleanDays : jumlah hari sejak pelanggaran terakhir yang tidak dibatalkan
//               (null bila belum pernah ada pelanggaran)
export function computeStudentStats(violations) {
  const list = violations ?? [];
  const open = list.filter((v) => OPEN_STATUSES.includes(v.status));
  const activePts = sumPoints(open);
  const score = Math.max(0, Math.min(100, 100 - activePts * 5));
  const real = list.filter((v) => v.status !== "revoked");
  let cleanDays = null;
  if (real.length) {
    const last = Math.max(...real.map((v) => new Date(v.occurred_at).getTime()));
    cleanDays = Math.max(0, Math.floor((Date.now() - last) / 86400000));
  }
  return { activePts, score, cleanDays, openCount: open.length };
}
