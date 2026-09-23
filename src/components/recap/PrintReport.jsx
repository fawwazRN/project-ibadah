import { BrandMark } from "../ui/BrandMark";
import { byRule, fmtNum, sumPoints } from "../../lib/calc";
import { fmtDate, fmtDateTime } from "../../lib/date";
import {
  VIOLATION_STATUS_LABELS,
  REPORT_STATUS_LABELS,
} from "../../lib/constants";

const TH =
  "border border-slate-400 bg-slate-100 px-2 py-1.5 text-left text-[10px] font-bold uppercase tracking-wide text-slate-800";
const TD =
  "border border-slate-300 px-2 py-1.5 align-top text-[11px] text-slate-900";

function Section({ no, title, children }) {
  return (
    <section className="mt-6 break-inside-avoid">
      <h2 className="mb-2 pb-1 border-slate-800 border-b-2 font-bold text-[12px] text-slate-900 uppercase tracking-wider">
        {no}. {title}
      </h2>
      {children}
    </section>
  );
}

function SummaryCell({ label, value }) {
  return (
    <div className="px-3 py-2 border border-slate-300">
      <p className="font-semibold text-[9.5px] text-slate-600 uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-0.5 font-display font-bold text-slate-900 text-lg">
        {value}
      </p>
    </div>
  );
}

export default function PrintReport({
  preset,
  range,
  filterLabel,
  violations,
  reports,
  isOsis,
}) {
  const TITLES = {
    today: "REKAP HARIAN",
    week: "REKAP MINGGUAN",
    month: "REKAP BULANAN",
    custom: "REKAP PELANGGARAN",
  };
  const title = TITLES[preset] ?? "REKAP PELANGGARAN";
  const period = `${fmtDate(range[0])} s.d. ${fmtDate(range[1])}`;
  const printedAt = fmtDateTime(new Date());

  const perClass = new Map();
  for (const v of violations) {
    const k = v.santri?.class_name ?? "—";
    const cur = perClass.get(k) ?? { total: 0, poin: 0 };
    cur.total += 1;
    cur.poin += v.rule?.points ?? 0;
    perClass.set(k, cur);
  }
  const classRows = [...perClass.entries()].sort(
    (a, b) => b[1].poin - a[1].poin,
  );
  const ruleRows = byRule(violations);
  const detail = violations.slice(0, 200);
  const reportRows = reports.slice(0, 100);

  return (
    <div className="bg-white mx-auto w-full font-sans text-slate-900 print-doc">
      {/* Kop laporan */}
      <header className="flex justify-between items-start pb-3 border-slate-900 border-b-[3px]">
        <div className="flex items-center gap-3">
          <BrandMark className="size-10 text-slate-900" />
          <div>
            <p className="font-display font-bold text-[15px] text-slate-900 tracking-tight">
              IBADAH OSIS
            </p>
            <p className="font-semibold text-[9.5px] text-slate-600 uppercase tracking-[0.2em]">
              Qism Ibadah · OSIS
            </p>
          </div>
        </div>
        <div className="text-[9.5px] text-slate-600 text-right leading-relaxed">
          <p>Dicetak: {printedAt}</p>
          <p>Dokumen internal madrasah</p>
        </div>
      </header>

      <h1 className="mt-5 font-display font-bold text-slate-900 text-lg text-center tracking-wide">
        {title}
      </h1>
      <p className="mt-1 font-medium text-[11px] text-slate-700 text-center">
        Periode: {period}
      </p>
      <p className="mt-0.5 text-[10px] text-slate-500 text-center">
        Filter: {filterLabel}
      </p>

      {/* A. Ringkasan */}
      <Section no="A" title="Ringkasan">
        <div className="gap-2 grid grid-cols-3">
          <SummaryCell
            label="Jumlah Pelanggaran"
            value={fmtNum(violations.length)}
          />
          <SummaryCell
            label="Total Poin"
            value={fmtNum(sumPoints(violations))}
          />
          {isOsis && (
            <SummaryCell
              label="Santri Terlibat"
              value={fmtNum(new Set(violations.map((v) => v.santri_id)).size)}
            />
          )}
          <SummaryCell
            label="Klarifikasi Masuk"
            value={fmtNum(reports.length)}
          />
          <SummaryCell
            label="Klarifikasi Diterima"
            value={fmtNum(
              reports.filter((r) => r.status === "accepted").length,
            )}
          />
          <SummaryCell
            label="Klarifikasi Ditolak"
            value={fmtNum(
              reports.filter((r) => r.status === "rejected").length,
            )}
          />
        </div>
      </Section>

      {/* B. Rekap per kelas (khusus OSIS) */}
      {isOsis && classRows.length > 0 && (
        <Section no="B" title="Rekap per Kelas">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={`${TH} w-10`}>No</th>
                <th className={TH}>Kelas</th>
                <th className={TH}>Jumlah Pelanggaran</th>
                <th className={TH}>Total Poin</th>
              </tr>
            </thead>
            <tbody>
              {classRows.map(([kelas, d], i) => (
                <tr key={kelas}>
                  <td className={TD}>{i + 1}</td>
                  <td className={`${TD} font-medium`}>{kelas}</td>
                  <td className={TD}>{fmtNum(d.total)}</td>
                  <td className={`${TD} font-semibold`}>{fmtNum(d.poin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* C. Rekap per aturan */}
      <Section no={isOsis ? "C" : "B"} title="Rekap per Aturan">
        {ruleRows.length === 0 ? (
          <p className="text-[11px] text-slate-500 italic">
            Tidak ada data pada periode ini.
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={`${TH} w-10`}>No</th>
                <th className={TH}>Aturan</th>
                <th className={TH}>Kategori</th>
                <th className={TH}>Kejadian</th>
                <th className={TH}>Poin per Kejadian</th>
                <th className={TH}>Total Poin</th>
              </tr>
            </thead>
            <tbody>
              {ruleRows.map((r, i) => (
                <tr key={r.rule_id}>
                  <td className={TD}>{i + 1}</td>
                  <td className={`${TD} font-medium`}>{r.name}</td>
                  <td className={TD}>{r.category ?? "—"}</td>
                  <td className={TD}>{fmtNum(r.total)}</td>
                  <td className={TD}>+{r.points}</td>
                  <td className={`${TD} font-semibold`}>{fmtNum(r.poin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* D. Detail pelanggaran */}
      <Section no={isOsis ? "D" : "C"} title="Detail Pelanggaran">
        {detail.length === 0 ? (
          <p className="text-[11px] text-slate-500 italic">
            Tidak ada data pada periode ini.
          </p>
        ) : (
          <>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={`${TH} w-10`}>No</th>
                  <th className={TH}>Tanggal</th>
                  <th className={TH}>Nama</th>
                  <th className={TH}>Kelas</th>
                  <th className={TH}>Pelanggaran</th>
                  <th className={TH}>Poin</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {detail.map((v, i) => (
                  <tr key={v.id}>
                    <td className={TD}>{i + 1}</td>
                    <td className={`${TD} whitespace-nowrap`}>
                      {fmtDate(v.occurred_at)}
                    </td>
                    <td className={`${TD} font-medium`}>
                      {v.santri?.full_name}
                    </td>
                    <td className={TD}>{v.santri?.class_name}</td>
                    <td className={TD}>{v.rule?.name}</td>
                    <td className={`${TD} font-semibold`}>+{v.rule?.points}</td>
                    <td className={TD}>
                      {VIOLATION_STATUS_LABELS[v.status] ?? v.status}
                    </td>
                    <td className={`${TD} text-[10px] text-slate-600`}>
                      {v.note || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {violations.length > 200 && (
              <p className="mt-1 text-[9.5px] text-slate-500 italic">
                Menampilkan 200 dari {violations.length} catatan. Sisanya dapat
                dilihat pada aplikasi.
              </p>
            )}
          </>
        )}
      </Section>

      {/* E. Klarifikasi */}
      <Section no={isOsis ? "E" : "D"} title="Klarifikasi Santri">
        {reportRows.length === 0 ? (
          <p className="text-[11px] text-slate-500 italic">
            Tidak ada klarifikasi pada periode ini.
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={`${TH} w-10`}>No</th>
                <th className={TH}>Diajukan</th>
                <th className={TH}>Nama</th>
                <th className={TH}>Pelanggaran</th>
                <th className={TH}>Alasan</th>
                <th className={TH}>Status</th>
              </tr>
            </thead>
            <tbody>
              {reportRows.map((r, i) => (
                <tr key={r.id}>
                  <td className={TD}>{i + 1}</td>
                  <td className={`${TD} whitespace-nowrap`}>
                    {fmtDate(r.created_at)}
                  </td>
                  <td className={`${TD} font-medium`}>
                    {r.violation?.santri?.full_name ?? r.santri?.full_name}
                  </td>
                  <td className={TD}>{r.violation?.rule?.name ?? "—"}</td>
                  <td className={`${TD} text-[10px]`}>{r.reason}</td>
                  <td className={TD}>
                    {REPORT_STATUS_LABELS[r.status] ?? r.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Tanda tangan */}
      <div className="flex justify-between mt-10 text-[11px] text-slate-900 break-inside-avoid">
        <div className="text-center">
          <p>Mengetahui,</p>
          <p>Pembina OSIS Qism Ibadah</p>
          <div className="h-16" />
          <p className="px-8 pt-1 border-slate-500 border-t">
            (……………………………………)
          </p>
        </div>
        <div className="text-center">
          <p>…………………, {fmtDate(new Date())}</p>
          <p>OSIS Qism Ibadah</p>
          <div className="h-16" />
          <p className="px-8 pt-1 border-slate-500 border-t">
            (……………………………………)
          </p>
        </div>
      </div>
    </div>
  );
}
