import { dayKey } from "./date";

export const fmtNum = (n) => new Intl.NumberFormat("id-ID").format(n ?? 0);
export const OPEN_STATUSES = ["active", "reported", "under_review"];
export const sumPoints = (list = []) =>
  list.reduce((s, v) => s + (v.rule?.points ?? 0), 0);
export const countBy = (arr, fn) =>
  arr.reduce((m, x) => {
    const k = fn(x);
    m[k] = (m[k] || 0) + 1;
    return m;
  }, {});

export const pointsInRange = (list, [a, b]) =>
  sumPoints(
    list.filter(
      (v) =>
        v.status !== "revoked" &&
        new Date(v.occurred_at) >= a &&
        new Date(v.occurred_at) <= b,
    ),
  );

export function byRule(list) {
  const m = new Map();
  for (const v of list) {
    const cur = m.get(v.rule_id) || {
      rule_id: v.rule_id,
      name: v.rule?.name ?? "—",
      points: v.rule?.points ?? 0,
      total: 0,
      poin: 0,
    };
    cur.total += 1;
    cur.poin += v.rule?.points ?? 0;
    m.set(v.rule_id, cur);
  }
  return [...m.values()].sort((a, b) => b.total - a.total);
}

export function seriesPerDay(list, n = 14) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const k = dayKey(d);
    out.push({
      label: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      total: list.filter((v) => dayKey(v.occurred_at) === k).length,
    });
  }
  return out;
}

// Tren mingguan — 1 pekan = Jumat s.d. Kamis.
// Label = tanggal Jumat pembuka pekan tsb.
export function seriesPerWeek(list, n = 8) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 2) % 7) - i * 7); // Jumat pekan tsb
    const end = new Date(d);
    end.setDate(end.getDate() + 7); // s.d. Kamis 24:00
    out.push({
      label: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      total: list.filter((v) => {
        const t = new Date(v.occurred_at);
        return t >= d && t < end;
      }).length,
    });
  }
  return out;
}

export function seriesPerMonth(list, n = 6) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() - i);
    const end = new Date(d);
    end.setMonth(end.getMonth() + 1);
    out.push({
      label: d.toLocaleDateString("id-ID", { month: "short" }),
      total: list.filter((v) => {
        const t = new Date(v.occurred_at);
        return t >= d && t < end;
      }).length,
    });
  }
  return out;
}

export function seriesForRange(list, from, to) {
  const out = [];
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  for (
    let d = new Date(start);
    d <= new Date(to) && out.length < 60;
    d.setDate(d.getDate() + 1)
  ) {
    const k = dayKey(d);
    out.push({
      label: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      total: list.filter((v) => dayKey(v.occurred_at) === k).length,
    });
  }
  return out;
}
