import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FileBarChart, Printer, SlidersHorizontal } from "lucide-react";
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
import { byRule, seriesForRange, fmtNum, sumPoints } from "../../lib/calc";
import { rangeForPreset, inRange, fmtDate } from "../../lib/date";

const PRESETS = [
  { key: "today", label: "Hari ini" },
  { key: "week", label: "Pekan ini (Jumat–Kamis)" },
  { key: "prev_week", label: "Pekan lalu" },
  { key: "month", label: "Bulan ini" },
  { key: "custom", label: "Rentang kustom" },
];

export default function RecapPage({ role }) {
  const isOsis = role === "osis_ibadah";
  const [violations, setViolations] = useState(null);
  const [reports, setReports] = useState([]);
  const [rules, setRules] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [preset, setPreset] = useState("week");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [fRule, setFRule] = useState("");
  const [fClass, setFClass] = useState("");
  const [fSantri, setFSantri] = useState("");
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
      setPrintSections(Object.keys(saved).filter((k) => saved[k]));
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
          (!fSantri || v.santri_id === fSantri),
      ),
    [violations, range, fRule, fClass, fSantri],
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
    return parts.join(" · ");
  }, [fRule, fClass, fSantri, rules, santriList, isOsis]);

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

      <Card>
        <CardHeader
          title="Rincian pelanggaran"
          description={`${fv.length} catatan pada periode & filter ini (maks. 25 ditampilkan)`}
        />
        {fv.length === 0 ? (
          <EmptyState
            icon={FileBarChart}
            title="Tidak ada catatan"
            description="Sesuaikan filter atau periode."
          />
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Waktu</Th>
                  <Th>Santri</Th>
                  <Th>Aturan</Th>
                  <Th>Poin</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {fv.slice(0, 25).map((v) => (
                  <Tr key={v.id}>
                    <Td className="text-slate-400 whitespace-nowrap">
                      {fmtDate(v.occurred_at)}
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
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
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
