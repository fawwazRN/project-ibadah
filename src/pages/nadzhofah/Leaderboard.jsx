import { useCallback, useEffect, useMemo, useState } from "react";
import { Medal, Footprints, Shirt, CalendarDays } from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/States";
import { Modal } from "../../components/ui/Modal";
import { nyekerService } from "../../services/nyekerService";
import { fmtNum } from "../../lib/calc";
import { fmtDate } from "../../lib/date";

const PODIUM = {
  0: {
    tag: "Ter-nakal 1",
    ring: "ring-1 ring-rose-400/40",
    tagCls: "bg-rose-400/10 text-rose-300 border-rose-400/30",
    num: "text-rose-300/15",
    lift: "sm:-translate-y-3 sm:shadow-card",
  },
  1: {
    tag: "Ke-2",
    ring: "ring-1 ring-amber-400/30",
    tagCls: "bg-amber-400/10 text-amber-300 border-amber-400/25",
    num: "text-amber-300/15",
    lift: "",
  },
  2: {
    tag: "Ke-3",
    ring: "ring-1 ring-slate-400/20",
    tagCls: "bg-white/5 text-slate-300 border-white/15",
    num: "text-slate-400/15",
    lift: "",
  },
};
const PODIUM_ORDER = [1, 0, 2];

export default function NadzhofahLeaderboardPage({ readOnly = false }) {
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("all");

  const [detail, setDetail] = useState(null);
  const [detailRecords, setDetailRecords] = useState(null);

  const load = useCallback(() => {
    setError(null);
    nyekerService
      .naughtyLeaderboard()
      .then(setEntries)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  // Hooks dulu — filter setelahnya
  const scoped = useMemo(() => {
    const list = entries ?? [];
    if (tab === "nyeker")
      return list.filter((e) => e.nyeker_count > 0 && e.clothing_count === 0);
    if (tab === "baju")
      return list.filter((e) => e.clothing_count > 0 && e.nyeker_count === 0);
    return list;
  }, [entries, tab]);

  const openDetail = async (e) => {
    setDetail(e);
    setDetailRecords(null);
    try {
      const [ny, cl] = await Promise.all([
        nyekerService.list(),
        nyekerService.listClothing(),
      ]);
      setDetailRecords({
        nyeker: (ny ?? []).filter((r) => r.student_id === e.student_id),
        clothing: (cl ?? []).filter((r) => r.student_id === e.student_id),
      });
    } catch {
      setDetailRecords({ nyeker: [], clothing: [] });
    }
  };

  const hasTop3 = scoped.length >= 3;

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Santri Nakal Nadzhofah"
        description="Peringkat gabungan nyeker + baju disita. Lelang tidak dihitung. Klik nama untuk melihat riwayat lengkapnya."
      />

      {/* Tab filter hanya untuk kelola (non-readonly) */}
      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          {[
            ["all", "Gabungan"],
            ["nyeker", "Nyeker Saja"],
            ["baju", "Baju Saja"],
          ].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === k
                  ? "border-brand/40 bg-brand/10 text-brand-soft"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200"
              }`}>
              {l}
            </button>
          ))}
        </div>
      )}

      {error && <ErrorState message={error} onRetry={load} />}
      {!entries && !error && <LoadingState rows={7} />}

      {entries && entries.length === 0 && (
        <Card>
          <EmptyState
            icon={Footprints}
            title="Belum ada data"
            description="Belum ada santri dengan catatan nyeker maupun baju disita."
          />
        </Card>
      )}

      {entries && scoped.length > 0 && (
        <>
          {/* ===== PODIUM ===== */}
          {hasTop3 && (
            <div className="items-end gap-3 grid sm:grid-cols-3">
              {PODIUM_ORDER.filter((i) => scoped[i]).map((i) => {
                const e = scoped[i];
                const m = PODIUM[i];
                return (
                  <button
                    type="button"
                    key={e.student_id}
                    onClick={() => openDetail(e)}
                    className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.025] text-left transition-transform hover:scale-[1.02] ${m.ring} ${m.lift}`}>
                    <span
                      className={`pointer-events-none absolute bottom-1 right-3 select-none font-display text-6xl font-bold leading-none ${m.num}`}>
                      {i + 1}
                    </span>
                    <div className="relative p-5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${m.tagCls}`}>
                        <Medal size={12} /> {m.tag}
                      </span>
                      <div className="flex items-center gap-3 mt-3.5">
                        <Avatar name={e.full_name} size="md" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-100 text-sm truncate">
                            {e.full_name}
                          </p>
                          <p className="text-slate-500 text-xs">
                            {e.class_name}
                          </p>
                        </div>
                      </div>
                      <div className="relative flex items-center gap-2 mt-4 pt-3 border-white/[0.06] border-t">
                        <Footprints size={13} className="text-slate-500" />
                        <span className="font-mono font-semibold text-slate-200 text-sm">
                          {fmtNum(e.nyeker_count)}
                        </span>
                        <Shirt size={13} className="ml-1 text-slate-500" />
                        <span className="font-mono font-semibold text-slate-200 text-sm">
                          {fmtNum(e.clothing_count)}
                        </span>
                        <span className="ml-auto font-mono font-bold text-rose-300 text-lg">
                          {fmtNum(e.naughty_score)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ===== DAFTAR ===== */}
          <Card>
            <CardHeader
              title={hasTop3 ? "Peringkat 4+" : "Daftar Lengkap"}
              description={`${hasTop3 ? scoped.length - 3 : scoped.length} santri · klik untuk detail`}
            />
            {(hasTop3 ? scoped.slice(3) : scoped).length === 0 ? (
              <EmptyState icon={Footprints} title="Hanya 3 santri teratas" />
            ) : (
              <ul className="divide-y divide-white/[0.04]">
                {(hasTop3 ? scoped.slice(3) : scoped).map((e, i) => (
                  <li key={e.student_id}>
                    <button
                      type="button"
                      onClick={() => openDetail(e)}
                      className="flex items-center gap-3 hover:bg-white/[0.02] px-5 py-3 w-full text-left transition-colors">
                      <span className="w-7 font-mono text-slate-500 text-sm shrink-0">
                        {String((hasTop3 ? 3 : 0) + i + 1).padStart(2, "0")}
                      </span>
                      <Avatar name={e.full_name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-200 text-sm truncate">
                          {e.full_name}
                        </p>
                        <p className="text-slate-500 text-xs">{e.class_name}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge tone="neutral">
                          <Footprints size={11} /> {fmtNum(e.nyeker_count)}
                        </Badge>
                        <Badge tone="neutral">
                          <Shirt size={11} /> {fmtNum(e.clothing_count)}
                        </Badge>
                        <Badge tone="rose">
                          Skor {fmtNum(e.naughty_score)}
                        </Badge>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}

      {/* ===== MODAL DETAIL ===== */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? detail.full_name : ""}
        size="sm">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-white/[0.02] p-3.5 border border-white/[0.06] rounded-xl">
              <Avatar name={detail.full_name} size="md" />
              <div>
                <p className="font-semibold text-slate-100 text-sm">
                  {detail.full_name}
                </p>
                <p className="text-slate-500 text-xs">{detail.class_name}</p>
              </div>
            </div>

            <div className="gap-2 grid grid-cols-3 text-center">
              <div className="bg-white/[0.02] p-3 border border-white/[0.06] rounded-xl">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Nyeker
                </p>
                <p className="mt-1 font-display font-bold text-amber-300 text-xl">
                  {fmtNum(detail.nyeker_count)}
                </p>
              </div>
              <div className="bg-white/[0.02] p-3 border border-white/[0.06] rounded-xl">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Baju Disita
                </p>
                <p className="mt-1 font-display font-bold text-sky-300 text-xl">
                  {fmtNum(detail.clothing_count)}
                </p>
              </div>
              <div className="bg-white/[0.02] p-3 border border-white/[0.06] rounded-xl">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Skor
                </p>
                <p className="mt-1 font-display font-bold text-rose-300 text-xl">
                  {fmtNum(detail.naughty_score)}
                </p>
              </div>
            </div>

            {!detailRecords ? (
              <p className="text-slate-500 text-xs text-center">
                Memuat riwayat…
              </p>
            ) : (
              <>
                <div>
                  <p className="flex items-center gap-1.5 mb-2 font-semibold text-[11px] text-slate-500 uppercase tracking-wider">
                    <Footprints size={12} /> Riwayat Nyeker
                  </p>
                  {detailRecords.nyeker.length === 0 ? (
                    <p className="text-slate-600 text-xs italic">Tidak ada.</p>
                  ) : (
                    <ul className="border border-white/[0.06] rounded-xl divide-y divide-white/[0.04]">
                      {detailRecords.nyeker.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center gap-3 px-4 py-2">
                          <CalendarDays
                            size={12}
                            className="text-slate-600 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-200 text-xs">
                              {fmtDate(r.nyeker_date)}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {String(r.nyeker_time).slice(0, 5)}
                              {r.note ? ` · ${r.note}` : ""}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <p className="flex items-center gap-1.5 mb-2 font-semibold text-[11px] text-slate-500 uppercase tracking-wider">
                    <Shirt size={12} /> Baju Disita
                  </p>
                  {detailRecords.clothing.length === 0 ? (
                    <p className="text-slate-600 text-xs italic">Tidak ada.</p>
                  ) : (
                    <ul className="border border-white/[0.06] rounded-xl divide-y divide-white/[0.04]">
                      {detailRecords.clothing.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center gap-3 px-4 py-2">
                          <CalendarDays
                            size={12}
                            className="text-slate-600 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-200 text-xs">
                              {r.quantity} baju
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {fmtDate(r.created_at)}
                              {r.auction_price != null ? " · dilelang" : ""}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
