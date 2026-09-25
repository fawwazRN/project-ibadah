import { BrandMark } from "../ui/BrandMark";
import { fmtNum } from "../../lib/calc";
import { fmtDate } from "../../lib/date";

// Poster liga A4: jadwal pekan + klasemen + top skor + sanksi.
// Dirender via portal ke body; hanya tampil saat print (.print-only).
export default function PrintPoster({
  ctx,
  week,
  matches,
  standings,
  suspensions,
  scorers = [],
}) {
  const weekMatches = matches.filter((m) => m.week === week);
  const susp = suspensions.filter((s) => s.status === "active");
  const th =
    "border-b-2 border-white/20 px-2 py-1.5 text-left text-[10px] font-bold uppercase tracking-wider text-white/70";
  const td = "border-b border-slate-200 px-2 py-1.5 text-[11px] text-slate-900";

  return (
    <div className="bg-white mx-auto w-full font-sans text-slate-900">
      {/* Banner poster */}
      <div
        className="flex justify-between items-center bg-ink-900 px-6 py-5 rounded-t-2xl text-white"
        style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
        <div className="flex items-center gap-3">
          <span className="place-items-center grid bg-emerald-500/20 rounded-xl size-12 text-emerald-300">
            <BrandMark className="size-7" />
          </span>
          <div>
            <p className="font-display font-bold text-lg tracking-tight">
              LIGA RIYADHAH
            </p>
            <p className="font-semibold text-[10px] text-white/60 uppercase tracking-[0.25em]">
              {ctx?.phase_name} · {ctx?.season_name}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display font-bold text-emerald-300 text-5xl leading-none">
            P{week}
          </p>
          <p className="font-semibold text-[10px] text-white/60 uppercase tracking-[0.25em]">
            Pekan {week}
          </p>
        </div>
      </div>

      {/* Jadwal pekan */}
      <section className="mt-6 break-inside-avoid">
        <h2 className="mb-2 pb-1 border-ink-900 border-b-2 font-display font-bold text-sm uppercase tracking-wider">
          Jadwal Pertandingan — Pekan {week}
        </h2>
        {weekMatches.length === 0 ? (
          <p className="text-[11px] text-slate-500 italic">
            Belum ada laga terjadwal pada pekan ini.
          </p>
        ) : (
          <div className="gap-2 grid grid-cols-2">
            {weekMatches.map((m) => (
              <div
                key={m.id}
                className="flex justify-between items-center px-3 py-2.5 border-2 border-slate-900 rounded-lg">
                <p className="flex-1 min-w-0 font-display font-bold text-[13px] truncate">
                  {m.home_name}
                </p>
                <span
                  className="bg-ink-900 mx-2 px-2 py-0.5 rounded font-display font-bold text-[10px] text-emerald-300 shrink-0"
                  style={{
                    printColorAdjust: "exact",
                    WebkitPrintColorAdjust: "exact",
                  }}>
                  VS
                </span>
                <p className="flex-1 min-w-0 font-display font-bold text-[13px] text-right truncate">
                  {m.away_name}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Klasemen sementara */}
      <section className="mt-6 break-inside-avoid">
        <h2 className="mb-2 pb-1 border-ink-900 border-b-2 font-display font-bold text-sm uppercase tracking-wider">
          Klasemen Sementara
        </h2>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["#", "Tim", "Main", "W", "D", "L", "SG", "Poin"].map((h) => (
                <th key={h} className={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {standings.map((r) => (
              <tr
                key={r.team_id}
                className={r.rank <= 2 ? "bg-emerald-50" : ""}>
                <td className={`${td} w-8 font-bold`}>{r.rank}</td>
                <td className={`${td} font-semibold`}>{r.name}</td>
                <td className={td}>{r.played}</td>
                <td className={td}>{r.wins}</td>
                <td className={td}>{r.draws}</td>
                <td className={td}>{r.losses}</td>
                <td className={td}>{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                <td className={`${td} font-bold`}>{fmtNum(r.points)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Top skor (bila ada data) */}
      {scorers.length > 0 && (
        <section className="mt-6 break-inside-avoid">
          <h2 className="mb-2 pb-1 border-ink-900 border-b-2 font-display font-bold text-sm uppercase tracking-wider">
            Pencetak Gol Terbanyak
          </h2>
          <div className="gap-2 grid grid-cols-3">
            {scorers.slice(0, 3).map((s, i) => (
              <div
                key={s.student_id}
                className="px-3 py-2 border-2 border-slate-900 rounded-lg text-center">
                <p className="font-display font-bold text-emerald-700 text-xl">
                  {i + 1}
                </p>
                <p className="font-bold text-[12px] truncate">{s.full_name}</p>
                <p className="text-[10px] text-slate-600 truncate">
                  {s.team_name}
                </p>
                <p className="flex justify-center items-center gap-1.5 font-display font-bold text-[13px]">
                  <span className="bg-emerald-600 rounded-full size-1.5" />{" "}
                  {s.goals} gol
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sanksi liga */}
      <section className="mt-6 break-inside-avoid">
        <h2 className="mb-2 pb-1 border-rose-700 border-b-2 font-display font-bold text-rose-700 text-sm uppercase tracking-wider">
          Terkena Sanksi Liga (Tidak Boleh Bermain)
        </h2>
        {susp.length === 0 ? (
          <p className="text-[11px] text-slate-500 italic">
            Tidak ada pemain ter-suspensi. Pertandingan berjalan penuh.
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Pemain", "Kelas", "Alasan", "Sampai"].map((h) => (
                  <th
                    key={h}
                    className="px-2 py-1.5 border-rose-300 border-b-2 font-bold text-[10px] text-rose-700 text-left uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {susp.map((s) => (
                <tr key={s.id}>
                  <td className={`${td} font-semibold`}>{s.full_name}</td>
                  <td className={td}>{s.class_name}</td>
                  <td className={td}>{s.reason}</td>
                  <td className={td}>{fmtDate(s.end_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="flex justify-between mt-8 text-[9px] text-slate-500">
        <p>Dicetak: {new Date().toLocaleString("id-ID")}</p>
        <p>OSIS Management · Qism Riyadhah</p>
      </div>
    </div>
  );
}
