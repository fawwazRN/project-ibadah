// Klasemen dihitung HANYA dari pertandingan berstatus 'official'.
// Tie-break urutan bisa dikonfigurasi lewat league_settings.
const KEY_MAP = {
  points: (r) => r.points,
  goal_difference: (r) => r.gd,
  goals_for: (r) => r.gf,
};

export function computeStandings(
  teams,
  officialMatches,
  tiebreak = ["points", "goal_difference", "goals_for", "head_to_head"],
) {
  const rows = new Map(
    teams.map((t) => [
      t.id,
      {
        team_id: t.id,
        name: t.name,
        status: t.status,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        points: 0,
      },
    ]),
  );

  for (const m of officialMatches) {
    if (m.home_score == null || m.away_score == null) continue;
    const H = rows.get(m.home_team_id),
      A = rows.get(m.away_team_id);
    if (!H || !A) continue;
    H.played++;
    A.played++;
    H.gf += m.home_score;
    H.ga += m.away_score;
    A.gf += m.away_score;
    A.ga += m.home_score;
    if (m.home_score > m.away_score) {
      H.wins++;
      A.losses++;
      H.points += 3;
    } else if (m.home_score < m.away_score) {
      A.wins++;
      H.losses++;
      A.points += 3;
    } else {
      H.draws++;
      A.draws++;
      H.points++;
      A.points++;
    }
  }
  for (const r of rows.values()) r.gd = r.gf - r.ga;

  const list = [...rows.values()];
  list.sort((a, b) => {
    for (const key of tiebreak) {
      if (key === "head_to_head") continue; // ditangani per-grup di bawah
      const fn = KEY_MAP[key];
      if (fn) {
        const d = fn(b) - fn(a);
        if (d !== 0) return d;
      }
    }
    return a.name.localeCompare(b.name);
  });

  // Head-to-head untuk grup yang seri penuh
  if (tiebreak.includes("head_to_head")) {
    let i = 0;
    while (i < list.length) {
      let j = i;
      while (j + 1 < list.length && tied(list[i], list[j + 1], tiebreak)) j++;
      if (j > i) {
        const group = list.slice(i, j + 1);
        if (allPairsPlayed(group, officialMatches)) {
          const mini = new Map(group.map((r) => [r.team_id, { p: 0, gd: 0 }]));
          for (const m of officialMatches) {
            if (m.home_score == null) continue;
            if (!group.some((r) => r.team_id === m.home_team_id)) continue;
            const H = mini.get(m.home_team_id),
              A = mini.get(m.away_team_id);
            if (!H || !A) continue;
            if (m.home_score > m.away_score) H.p += 3;
            else if (m.home_score < m.away_score) A.p += 3;
            else {
              H.p++;
              A.p++;
            }
            H.gd += m.home_score - m.away_score;
            A.gd += m.away_score - m.home_score;
          }
          group.sort(
            (a, b) =>
              mini.get(b.team_id).p - mini.get(a.team_id).p ||
              mini.get(b.team_id).gd - mini.get(a.team_id).gd ||
              a.name.localeCompare(b.name),
          );
          group.forEach((r, idx) => {
            list[i + idx] = r;
          });
        }
      }
      i = j + 1;
    }
  }
  return list.map((r, i) => ({ ...r, rank: i + 1 }));
}

const tied = (a, b, keys) =>
  keys.filter((k) => KEY_MAP[k]).every((k) => KEY_MAP[k](a) === KEY_MAP[k](b));

const allPairsPlayed = (group, matches) => {
  const ids = group.map((g) => g.team_id);
  const played = new Set();
  for (const m of matches) {
    if (m.home_score == null) continue;
    if (ids.includes(m.home_team_id) && ids.includes(m.away_team_id))
      played.add([m.home_team_id, m.away_team_id].sort().join("-"));
  }
  return played.size >= (ids.length * (ids.length - 1)) / 2;
};
