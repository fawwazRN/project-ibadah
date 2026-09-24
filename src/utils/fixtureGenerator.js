// Round-robin tunggal: setiap pasangan bertemu TEPAT sekali,
// setiap tim main tepat 1x per pekan. Input N genap (8 tim → 7 pekan).
export function generateRoundRobin(teamIds, startWeek = 1) {
  const ids = [...teamIds];
  if (ids.length % 2 !== 0)
    throw new Error("Jumlah tim harus genap untuk round-robin penuh.");
  const n = ids.length;
  let arr = [...ids];
  const weeks = [];

  for (let r = 0; r < n - 1; r++) {
    const matches = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i],
        b = arr[n - 1 - i];
      if (a == null || b == null) continue;
      const flip = r % 2 === 1; // seimbangkan home/away antar pekan
      matches.push({
        week: startWeek + r,
        home_team_id: flip ? b : a,
        away_team_id: flip ? a : b,
      });
    }
    weeks.push(matches);
    arr = [arr[0], arr[n - 1], ...arr.slice(1, n - 1)]; // rotasi, elemen pertama tetap
  }
  return weeks;
}
