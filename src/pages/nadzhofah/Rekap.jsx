import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Footprints,
  FileBarChart,
  CalendarDays,
  Users,
  ArrowDownUp,
  Printer,
  Shirt,
} from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { Button } from "../../components/ui/Button";
import { Select, Input } from "../../components/ui/Field";
import { TableWrap, Table, Th, Td, Tr } from "../../components/ui/Table";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/States";
import {
  NyekerPerDayChart,
  TopStudentsChart,
} from "../../components/recap/NyekerChart";
import { nyekerService } from "../../services/nyekerService";
import { fmtNum } from "../../lib/calc";
import { fmtDate, rangeForPreset, inRange, dayKey } from "../../lib/date";

const PRESETS = [
  { key: "today", label: "Hari ini" },
  { key: "week", label: "Minggu ini" },
  { key: "month", label: "Bulan ini" },
  { key: "all", label: "Semua" },
  { key: "custom", label: "Kustom" },
];

export default function NadzhofahRekapPage() {
  const [all, setAll] = useState(null);
  const [clothing, setClothing] = useState([]);
  const [error, setError] = useState(null);
  const [preset, setPreset] = useState("month");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [fClass, setFClass] = useState("");
  const [sortAsc, setSortAsc] = useState(false);
  const [pendingPrint, setPendingPrint] = useState(false);

  const load = useCallback(() => {
    setError(null);
    Promise.all([nyekerService.list(), nyekerService.listClothing()])
      .then(([n, c]) => {
        setAll(n);
        setClothing(c);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  // Print — langsung window.print setelah render dokumen
  useEffect(() => {
    if (!pendingPrint) return;
    const t = setTimeout(() => {
      window.print();
      setPendingPrint(false);
    }, 150);
    return () => clearTimeout(t);
  }, [pendingPrint]);

  // ================= SEMUA HOOKS DULU =================

  // Rentang waktu — null = semua
  const range = useMemo(
    () =>
      preset === "all" ? null : rangeForPreset(preset, custom.from, custom.to),
    [preset, custom],
  );

  // Data ter-scope: waktu + kelas — SUMBER TUNGGAL utk kartu, chart, tabel
  const scoped = useMemo(() => {
    let list = all ?? [];
    if (range) {
      list = list.filter((r) => {
        const t = new Date(`${r.nyeker_date}T12:00:00`).getTime();
        return t >= range[0].getTime() && t <= range[1].getTime();
      });
    }
    if (fClass) list = list.filter((r) => r.class_name === fClass);
    return list;
  }, [all, range, fClass]);

  // Rekap per santri dari data ter-scope
  const recap = useMemo(() => {
    const m = new Map();
    for (const r of scoped) {
      const cur = m.get(r.student_id) ?? {
        student_id: r.student_id,
        full_name: r.full_name,
        class_name: r.class_name,
        jumlah: 0,
        terakhir: r.nyeker_date,
      };
      cur.jumlah += 1;
      if (r.nyeker_date > cur.terakhir) cur.terakhir = r.nyeker_date;
      m.set(r.student_id, cur);
    }
    return [...m.values()].sort((a, b) =>
      sortAsc
        ? a.jumlah - b.jumlah || a.full_name.localeCompare(b.full_name)
        : b.jumlah - a.jumlah || a.full_name.localeCompare(b.full_name),
    );
  }, [scoped, sortAsc]);

  // Nyeker per hari
  const perDay = useMemo(() => {
    const m = new Map();
    for (const r of scoped) {
      const k = dayKey(r.nyeker_date);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, total]) => ({
        label: new Date(`${k}T00:00:00`).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        }),
        total,
      }));
  }, [scoped]);

  // ← RESTORED: Top 8 santri (nama depan saja biar muat di chart)
  const topStudents = useMemo(
    () =>
      recap
        .slice(0, 8)
        .map((r) => ({ label: r.full_name.split(" ")[0], total: r.jumlah })),
    [recap],
  );

  const classes = useMemo(
    () =>
      [...new Set((all ?? []).map((r) => r.class_name).filter(Boolean))].sort(),
    [all],
  );

  // ===== EARLY RETURN SETELAH HOOKS =====
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!all) return <LoadingState rows={7} />;

  // ===== TAMPILAN =====
  const rangeLabel = range
    ? `${fmtDate(range[0])} — ${fmtDate(range[1])}`
    : "Semua waktu";

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Rekap Nyeker"
        description={`Periode: ${rangeLabel}`}
        actions={
          <Button
            variant="primary"
            icon={Printer}
            onClick={() => setPendingPrint(true)}>
            Cetak Rekap
          </Button>
        }
      />

      {/* ===== Filter periode & kelas ===== */}
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              preset === p.key
                ? "border-brand/40 bg-brand/10 text-brand-soft"
                : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200"
            }`}>
            {p.label}
          </button>
        ))}
        {preset === "custom" && (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={custom.from}
              className="w-auto [color-scheme:dark]"
              onChange={(e) =>
                setCustom((c) => ({ ...c, from: e.target.value }))
              }
            />
            <span className="text-slate-500 text-xs">s.d.</span>
            <Input
              type="date"
              value={custom.to}
              className="w-auto [color-scheme:dark]"
              onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
            />
          </div>
        )}
        <Select
          value={fClass}
          onChange={(e) => setFClass(e.target.value)}
          placeholder="Semua kelas"
          className="w-44"
          options={classes.map((c) => ({ value: c, label: `Kelas ${c}` }))}
        />
        {fClass && (
          <button
            type="button"
            onClick={() => setFClass("")}
            className="text-slate-500 text-xs underline">
            hapus filter kelas
          </button>
        )}
      </div>

      {/* ===== Kartu ringkasan ===== */}
      <div className="gap-4 grid grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Catatan"
          value={fmtNum(scoped.length)}
          icon={Footprints}
          tone="rose"
        />
        <StatCard
          label="Santri Terlibat"
          value={fmtNum(recap.length)}
          icon={Users}
        />
        <StatCard
          label="Rata-rata per Santri"
          value={
            recap.length ? `${(scoped.length / recap.length).toFixed(1)}×` : "0"
          }
          icon={FileBarChart}
        />
        <StatCard
          label="Terbanyak"
          value={recap[0] ? `${recap[0].jumlah}×` : "0"}
          icon={Footprints}
          tone="amber"
          sub={recap[0]?.full_name}
        />
      </div>

      {/* ===== Dua chart ===== */}
      <div className="gap-4 grid lg:grid-cols-2">
        <Card>
          <CardHeader title="Nyeker per Hari" description={rangeLabel} />
          <div className="p-4">
            {perDay.length === 0 || scoped.length === 0 ? (
              <EmptyState
                icon={Footprints}
                title="Belum ada data"
                description="Belum ada catatan pada periode & filter ini."
              />
            ) : (
              <NyekerPerDayChart data={perDay} />
            )}
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Santri dengan Catatan Terbanyak"
            description="8 teratas sesuai filter"
          />
          <div className="p-4">
            {topStudents.length === 0 ? (
              <EmptyState
                icon={Footprints}
                title="Belum ada data"
                description="Belum ada catatan pada periode & filter ini."
              />
            ) : (
              <TopStudentsChart data={topStudents} />
            )}
          </div>
        </Card>
      </div>

      {/* ===== Tabel rekap per santri ===== */}
      <Card>
        <CardHeader
          title="Rekap per Santri"
          description={`${recap.length} santri · urut ${sortAsc ? "paling sedikit" : "terbanyak"}`}
          actions={
            <Button
              variant="ghost"
              icon={ArrowDownUp}
              size="sm"
              onClick={() => setSortAsc((s) => !s)}>
              Balik Urutan
            </Button>
          }
        />
        {recap.length === 0 ? (
          <EmptyState
            icon={Footprints}
            title="Belum ada data"
            description="Sesuaikan filter atau periode."
          />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>No</Th>
                  <Th>Santri</Th>
                  <Th>Kelas</Th>
                  <Th>Jumlah Nyeker</Th>
                  <Th>Terakhir</Th>
                </tr>
              </thead>
              <tbody>
                {recap.map((r, i) => (
                  <Tr key={r.student_id}>
                    <Td className="font-mono text-slate-500 text-xs">
                      {i + 1}
                    </Td>
                    <Td className="font-medium text-slate-200">
                      {r.full_name}
                    </Td>
                    <Td className="text-slate-300">{r.class_name}</Td>
                    <Td>
                      <span
                        className={`font-mono font-bold ${r.jumlah >= 3 ? "text-rose-300" : "text-slate-200"}`}>
                        {fmtNum(r.jumlah)}
                      </span>
                    </Td>
                    <Td className="text-slate-400">{fmtDate(r.terakhir)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Card>

      {/* ===== Dokumen cetak ===== */}
      {createPortal(
        <div className="print-only">
          <div className="bg-white mx-auto w-full font-sans text-slate-900">
            <header className="flex justify-between items-start pb-3 border-slate-900 border-b-[3px]">
              <div className="flex items-center gap-3">
                <Shirt className="size-9 text-slate-900" />
                <div>
                  <p className="font-display font-bold text-[15px] text-slate-900">
                    QISM NADZHOFah
                  </p>
                  <p className="font-semibold text-[9.5px] text-slate-600 uppercase tracking-[0.2em]">
                    Monitoring Kebersihan &amp; Ketertiban
                  </p>
                </div>
              </div>
              <div className="text-[9.5px] text-slate-600 text-right">
                <p>Dicetak: {new Date().toLocaleString("id-ID")}</p>
                <p>Dokumen internal madrasah</p>
              </div>
            </header>

            <h1 className="mt-5 font-display font-bold text-lg text-center tracking-wide">
              LAPORAN NYEKER &amp; PENYITAAN BAJU
            </h1>
            <p className="mt-1 font-medium text-[11px] text-slate-700 text-center">
              Periode:{" "}
              {range
                ? `${fmtDate(range[0])} s.d. ${fmtDate(range[1])}`
                : "Semua waktu"}
            </p>

            {/* A. Rekap per santri */}
            <section className="mt-6 break-inside-avoid">
              <h2 className="mb-2 pb-1 border-slate-800 border-b-2 font-display font-bold text-sm uppercase tracking-wider">
                A. Rekap Nyeker per Santri ({recap.length})
              </h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {["No", "Nama", "Kelas", "Jumlah Nyeker", "Terakhir"].map(
                      (h) => (
                        <th
                          key={h}
                          className="bg-slate-100 px-2 py-1.5 border border-slate-400 font-bold text-[10px] text-slate-800 text-left uppercase">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {recap.map((r, i) => (
                    <tr key={r.student_id}>
                      <td className="px-2 py-1.5 border border-slate-300 text-[11px]">
                        {i + 1}
                      </td>
                      <td className="px-2 py-1.5 border border-slate-300 font-medium text-[11px]">
                        {r.full_name}
                      </td>
                      <td className="px-2 py-1.5 border border-slate-300 text-[11px]">
                        {r.class_name}
                      </td>
                      <td className="px-2 py-1.5 border border-slate-300 font-bold text-[11px]">
                        {r.jumlah}
                      </td>
                      <td className="px-2 py-1.5 border border-slate-300 text-[11px]">
                        {fmtDate(r.terakhir)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* B. Penyitaan baju */}
            <section className="mt-6 break-inside-avoid">
              <h2 className="mb-2 pb-1 border-slate-800 border-b-2 font-display font-bold text-sm uppercase tracking-wider">
                B. Penyitaan Baju ({clothing.length})
              </h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {["No", "Nama", "Kelas", "Baju", "Nilai", "Lelang"].map(
                      (h) => (
                        <th
                          key={h}
                          className="bg-slate-100 px-2 py-1.5 border border-slate-400 font-bold text-[10px] text-slate-800 text-left uppercase">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {clothing.map((c, i) => (
                    <tr key={c.id}>
                      <td className="px-2 py-1.5 border border-slate-300 text-[11px]">
                        {i + 1}
                      </td>
                      <td className="px-2 py-1.5 border border-slate-300 font-medium text-[11px]">
                        {c.full_name}
                      </td>
                      <td className="px-2 py-1.5 border border-slate-300 text-[11px]">
                        {c.class_name}
                      </td>
                      <td className="px-2 py-1.5 border border-slate-300 text-[11px]">
                        {c.quantity}
                      </td>
                      <td className="px-2 py-1.5 border border-slate-300 font-bold text-[11px]">
                        Rp {fmtNum(c.current_value)}
                      </td>
                      <td className="px-2 py-1.5 border border-slate-300 text-[11px]">
                        {c.auction_price != null
                          ? fmtDate(c.auction_date)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                  {clothing.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-2 py-2 border border-slate-300 text-[11px] text-slate-500 text-center italic">
                        Tidak ada penyitaan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            {/* Tanda tangan */}
            <div className="flex justify-between mt-10 text-[11px] text-slate-900 break-inside-avoid">
              <div className="text-center">
                <p>Mengetahui,</p>
                <p>Pembina OSIS</p>
                <div className="h-16" />
                <p className="px-8 pt-1 border-slate-500 border-t">
                  (……………………………………)
                </p>
              </div>
              <div className="text-center">
                <p>…………………, {fmtDate(new Date())}</p>
                <p>Qism Nadzhofah</p>
                <div className="h-16" />
                <p className="px-8 pt-1 border-slate-500 border-t">
                  (……………………………………)
                </p>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
