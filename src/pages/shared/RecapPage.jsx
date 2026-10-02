import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  FileBarChart,
  Printer,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Select, Input } from "../../components/ui/Field";
import { TableWrap, Table, Th, Td, Tr } from "../../components/ui/Table";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/States";
import { ViolationStatusBadge } from "../../components/violations/StatusBadge";
import { AreaPerDay } from "../../components/dashboard/Charts";
import PrintOptionsModal, {
  IBADAH_SECTIONS,
  loadPrintOptions,
} from "../../components/recap/PrintOptionsModal";
import PrintReport from "../../components/recap/PrintReport";
import { violationService } from "../../services/violationService";
import { reportService } from "../../services/reportService";
import { ruleService } from "../../services/ruleService";
import { profileService } from "../../services/profileService";
import {
  byRule,
  seriesForRange,
  fmtNum,
  sumPoints,
  matchesSearch,
} from "../../lib/calc";
import { rangeForPreset, inRange, fmtDate } from "../../lib/date";
import { PRAYER_LABELS } from "../../lib/constants";

const PRESETS = [
  { key: "today", label: "Hari ini" },
  { key: "week", label: "Pekan ini (Jumat–Kamis)" },
  { key: "prev_week", label: "Pekan lalu" },
  { key: "month", label: "Bulan ini" },
  { key: "custom", label: "Rentang kustom" },
];

export default function RecapPage({ role }) {
  const isOsis = role === "qism_ibadah" || role === "super_admin";
  const [violations, setViolations] = useState(null);
  const [reports, setReports] = useState([]);
  const [rules, setRules] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [preset, setPreset] = useState("week");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [fRule, setFRule] = useState("");
  const [fClass, setFClass] = useState("");
  const [fSantri, setFSantri] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [printSections, setPrintSections] = useState(null); // null = belum dipilih → pakai preferensi tersimpan

  const load = useCallback(() => {
    setError(null);
    Promise.all([
      violationService.list(),
      isOsis ? reportService.listAll() : reportService.listMine(),
      ruleService.list(),
      isOsis ? profileService.listSantri() : Promise.resolve([]),
    ])
      .then(([v, r, ru, s]) => {
        setViolations(v);
        setReports(r);
        setRules(ru);
        setSantriList(s);
      })
      .catch((e) => setError(e.message));
  }, [isOsis]);
  useEffect(load, [load]);

  // Cetak: pakai preferensi tersimpan; kalau belum pernah atur → buka dialog dulu
  const [pendingPrint, setPendingPrint] = useState(false);
  useEffect(() => {
    if (!pendingPrint) return;
    const saved = loadPrintOptions("ibadah");
    if (saved) {
      // bagian baru (belum ada di preferensi lama) ikut tercetak
      setPrintSections(
        IBADAH_SECTIONS.filter((s) => saved[s.key] ?? true).map((s) => s.key),
      );
      const t = setTimeout(() => {
        window.print();
        setPendingPrint(false);
      }, 150);
      return () => clearTimeout(t);
    }
    setPendingPrint(false);
    setOptionsOpen(true);
  }, [pendingPrint]);

  const handlePrintWithSections = (sections) => {
    setPrintSections(sections);
    setTimeout(() => window.print(), 150);
  };

  const range = useMemo(
    () => rangeForPreset(preset, custom.from, custom.to),
    [preset, custom],
  );

  const fv = useMemo(
    () =>
      (violations ?? []).filter(
        (v) =>
          v.status !== "revoked" &&
          inRange(v.occurred_at, range) &&
          (!fRule || v.rule_id === fRule) &&
          (!fClass || v.santri?.class_name === fClass) &&
          (!fSantri || v.santri_id === fSantri) &&
          matchesSearch(v, q),
      ),
    [violations, range, fRule, fClass, fSantri, q],
  );

  const fr = useMemo(
    () => (reports ?? []).filter((r) => inRange(r.created_at, range)),
    [reports, range],
  );

  const filterLabel = useMemo(() => {
    const parts = [];
    parts.push(
      fRule
        ? `Aturan: ${rules.find((r) => r.id === fRule)?.name ?? "—"}`
        : "Aturan: Semua",
    );
    if (isOsis) {
      parts.push(fClass ? `Kelas: ${fClass}` : "Kelas: Semua");
      parts.push(
        fSantri
          ? `Santri: ${santriList.find((s) => s.id === fSantri)?.full_name ?? "—"}`
          : "Santri: Semua",
      );
    }
    if (q.trim()) parts.push(`Pencarian: "${q.trim()}"`);
    return parts.join(" · ");
  }, [fRule, fClass, fSantri, q, rules, santriList, isOsis]);

  // Rekap per santri (semua santri yang punya pelanggaran pada filter ini)
  const perSantri = useMemo(() => {
    const m = new Map();
    for (const v of fv) {
      const cur = m.get(v.santri_id) ?? {
        id: v.santri_id,
        nama: v.santri?.full_name ?? "—",
        kelas: v.santri?.class_name ?? "—",
        total: 0,
        poin: 0,
      };
      cur.total += 1;
      cur.poin += v.rule?.points ?? 0;
      m.set(v.santri_id, cur);
    }
    return [...m.values()].sort(
      (a, b) =>
        b.poin - a.poin || b.total - a.total || a.nama.localeCompare(b.nama),
    );
  }, [fv]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!violations) return <LoadingState rows={7} />;

  const classes = [
    ...new Set(violations.map((v) => v.santri?.class_name).filter(Boolean)),
  ].sort();
  const topRules = byRule(fv).slice(0, 5);
  const series = seriesForRange(fv, range[0], range[1]);
  const rangeLabel = `${fmtDate(range[0])} — ${fmtDate(range[1])}`;

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Rekap"
        description={`Ringkasan periode ${rangeLabel}${["week", "prev_week"].includes(preset) ? " · pekan Jumat–Kamis" : ""}. Pelanggaran yang dibatalkan tidak dihitung.`}
        actions={
          <>
            <Button
              variant="secondary"
              icon={SlidersHorizontal}
              onClick={() => setOptionsOpen(true)}>
              Atur Isi Laporan
            </Button>
            <Button
              variant="primary"
              icon={Printer}
              onClick={() => setPendingPrint(true)}>
              Cetak
            </Button>
          </>
        }
      />

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
              onChange={(e) =>
                setCustom((c) => ({ ...c, from: e.target.value }))
              }
              className="w-auto"
            />
            <span className="text-slate-500 text-xs">s.d.</span>
            <Input
              type="date"
              value={custom.to}
              onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
              className="w-auto"
            />
          </div>
        )}
      </div>

      <div className="relative">
        <Search
          size={15}
          className="top-1/2 left-3 absolute text-slate-500 -translate-y-1/2 pointer-events-none"
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={
            isOsis
              ? "Cari pelanggaran santri: nama, kelas, aturan, atau catatan…"
              : "Cari pelanggaran: aturan atau catatan…"
          }
          className="pr-9 pl-9"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="Hapus pencarian"
            className="top-1/2 right-2.5 absolute place-items-center grid size-6 text-slate-500 hover:text-slate-200 -translate-y-1/2">
            <X size={14} />
          </button>
        )}
      </div>

      <div className="gap-3 grid sm:grid-cols-2 lg:grid-cols-3">
        <Select
          value={fRule}
          onChange={(e) => setFRule(e.target.value)}
          placeholder="Semua aturan"
          options={rules.map((r) => ({ value: r.id, label: r.name }))}
        />
        {isOsis && (
          <>
            <Select
              value={fClass}
              onChange={(e) => setFClass(e.target.value)}
              placeholder="Semua kelas"
              options={classes.map((c) => ({ value: c, label: `Kelas ${c}` }))}
            />
            <Select
              value={fSantri}
              onChange={(e) => setFSantri(e.target.value)}
              placeholder="Semua santri"
              options={santriList.map((s) => ({
                value: s.id,
                label: s.full_name,
              }))}
            />
          </>
        )}
      </div>

      <div className="gap-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Pelanggaran"
          value={fmtNum(fv.length)}
          icon={FileBarChart}
          tone="amber"
        />
        <StatCard
          label="Total Poin"
          value={fmtNum(sumPoints(fv))}
          icon={FileBarChart}
          tone="rose"
        />
        {isOsis && (
          <StatCard
            label="Santri Terlibat"
            value={fmtNum(new Set(fv.map((v) => v.santri_id)).size)}
            icon={FileBarChart}
          />
        )}
        <StatCard
          label="Laporan Masuk"
          value={fmtNum(fr.length)}
          icon={FileBarChart}
          tone="sky"
        />
        <StatCard
          label="Laporan Diterima"
          value={fmtNum(fr.filter((r) => r.status === "accepted").length)}
          icon={FileBarChart}
          tone="emerald"
        />
        <StatCard
          label="Laporan Ditolak"
          value={fmtNum(fr.filter((r) => r.status === "rejected").length)}
          icon={FileBarChart}
          tone="default"
        />
      </div>

      <div className="gap-4 grid lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Pelanggaran per hari"
            description={`${rangeLabel} · tidak termasuk yang dibatalkan`}
          />
          <div className="p-4">
            {series.every((s) => s.total === 0) ? (
              <EmptyState
                icon={FileBarChart}
                title="Tidak ada pelanggaran"
                description="Periode ini bersih. Alhamdulillah."
              />
            ) : (
              <AreaPerDay data={series} />
            )}
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Aturan tersering"
            description="Diurutkan dari kejadian terbanyak"
          />
          {topRules.length === 0 ? (
            <EmptyState icon={FileBarChart} title="Belum ada data" />
          ) : (
            <ul className="divide-y divide-white/[0.04]">
              {topRules.map((r, i) => (
                <li
                  key={r.rule_id}
                  className="flex items-center gap-3 px-5 py-3">
                  <span className="font-mono text-slate-500 text-xs">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-sm truncate">{r.name}</p>
                    <p className="text-slate-500 text-xs">
                      {fmtNum(r.total)} kejadian · {fmtNum(r.poin)} poin
                    </p>
                  </div>
                  <Badge tone="rose">+{r.points}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {isOsis && (
        <Card>
          <CardHeader
            title="Rekap per santri"
            description={`${fmtNum(perSantri.length)} santri · diurutkan dari poin tertinggi`}
          />
          {perSantri.length === 0 ? (
            <EmptyState icon={FileBarChart} title="Belum ada data" />
          ) : (
            <div className="max-h-[480px] overflow-y-auto">
              <TableWrap>
                <Table>
                  <thead className="top-0 z-10 sticky bg-ink-900">
                    <tr>
                      <Th>No</Th>
                      <Th>Nama</Th>
                      <Th>Kelas</Th>
                      <Th className="text-right">Pelanggaran</Th>
                      <Th className="text-right">Total Poin</Th>
                      <Th className="text-right">Aksi</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {perSantri.map((s, i) => (
                      <Tr key={s.id}>
                        <Td className="font-mono text-slate-500 text-xs">
                          {i + 1}
                        </Td>
                        <Td className="font-medium text-slate-200">
                          {s.nama}
                        </Td>
                        <Td className="text-slate-400">{s.kelas}</Td>
                        <Td className="text-slate-300 text-right">
                          {fmtNum(s.total)}
                        </Td>
                        <Td className="text-right">
                          <Badge tone="rose">{fmtNum(s.poin)}</Badge>
                        </Td>
                        <Td className="text-right">
                          <button
                            type="button"
                            onClick={() => setQ(s.nama)}
                            className="text-brand-soft text-xs hover:underline">
                            Lihat rincian
                          </button>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            </div>
          )}
        </Card>
      )}

      <Card>
        <CardHeader
          title="Rincian pelanggaran"
          description={`${fmtNum(fv.length)} catatan pada periode & filter ini · semua ditampilkan`}
        />
        {fv.length === 0 ? (
          <EmptyState
            icon={FileBarChart}
            title="Tidak ada catatan"
            description="Sesuaikan filter, pencarian, atau periode."
          />
        ) : (
          <div className="max-h-[640px] overflow-y-auto">
            <TableWrap>
              <Table>
                <thead className="top-0 z-10 sticky bg-ink-900">
                  <tr>
                    <Th>No</Th>
                    <Th>Tanggal</Th>
                    <Th>Waktu Sholat</Th>
                    <Th>Santri</Th>
                    <Th>Aturan</Th>
                    <Th>Poin</Th>
                    <Th>Status</Th>
                    <Th>Catatan</Th>
                  </tr>
                </thead>
                <tbody>
                  {fv.map((v, i) => (
                    <Tr key={v.id}>
                      <Td className="font-mono text-slate-500 text-xs">
                        {i + 1}
                      </Td>
                      <Td className="text-slate-400 whitespace-nowrap">
                        {fmtDate(v.occurred_at)}
                      </Td>
                      <Td className="text-slate-300 whitespace-nowrap">
                        {v.prayer_time
                          ? PRAYER_LABELS[v.prayer_time] ?? v.prayer_time
                          : "—"}
                      </Td>
                      <Td className="text-slate-200">
                        {v.santri?.full_name}
                        <span className="ml-1.5 text-slate-500 text-xs">
                          {v.santri?.class_name}
                        </span>
                      </Td>
                      <Td className="text-slate-300">{v.rule?.name}</Td>
                      <Td>
                        <Badge tone="rose">+{v.rule?.points}</Badge>
                      </Td>
                      <Td>
                        <ViolationStatusBadge status={v.status} />
                      </Td>
                      <Td className="max-w-[220px] text-slate-500 text-xs">
                        {v.note || "—"}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          </div>
        )}
      </Card>

      {createPortal(
        <div className="print-only">
          <PrintReport
            preset={preset}
            range={range}
            filterLabel={filterLabel}
            violations={fv}
            reports={fr}
            isOsis={isOsis}
            sections={printSections}
          />
        </div>,
        document.body,
      )}

      <PrintOptionsModal
        open={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        module="ibadah"
        sections={IBADAH_SECTIONS}
        onPrint={handlePrintWithSections}
      />
    </div>
  );
}
