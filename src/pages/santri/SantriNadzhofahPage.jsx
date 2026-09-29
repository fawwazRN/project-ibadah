import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Footprints,
  CalendarDays,
  Medal,
  Shirt,
  Trophy,
  Wallet,
  CircleCheck,
  CircleDashed,
} from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { Modal } from "../../components/ui/Modal";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/States";
import { nyekerService } from "../../services/nyekerService";
import { fmtDate, startOfMonth } from "../../lib/date";
import { fmtNum } from "../../lib/calc";

const rp = (n) => `Rp ${fmtNum(n)}`;

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

export default function SantriNadzhofahPage() {
  // ================= SEMUA HOOKS DULU =================
  const [myRecords, setMyRecords] = useState(null);
  const [clothing, setClothing] = useState(null);
  const [board, setBoard] = useState(null);
  const [error, setError] = useState(null);

  const [detail, setDetail] = useState(null);

  const load = useCallback(() => {
    setError(null);
    (async () => {
      const [mine, cl, board] = await Promise.all([
        nyekerService.list(),
        nyekerService.listClothing(), // RLS: santri hanya menerima miliknya
        nyekerService.naughtyLeaderboard(),
      ]);
      setMyRecords(mine ?? []);
      setClothing(cl ?? []);
      setBoard(board ?? []);
    })().catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  // Statistik nyeker pribadi
  const stats = useMemo(() => {
    const list = myRecords ?? [];
    const monthStart = startOfMonth();
    return {
      total: list.length,
      month: list.filter(
        (r) => new Date(`${r.nyeker_date}T12:00:00`) >= monthStart,
      ).length,
      terakhir: list[0]?.nyeker_date ?? null,
    };
  }, [myRecords]);

  // ===== TAGIHAN DENDA (dari riwayat nyeker pribadi) =====
  const fines = useMemo(() => {
    const list = myRecords ?? [];
    const unpaid = list
      .filter((r) => !r.fine_paid)
      .reduce((s, r) => s + (r.fine_amount ?? 5000), 0);
    const paid = list
      .filter((r) => r.fine_paid)
      .reduce((s, r) => s + (r.fine_amount ?? 5000), 0);
    return { unpaid, paid, total: unpaid + paid };
  }, [myRecords]);

  // ===== BAJU DISITA (pribadi) =====
  const clothingStats = useMemo(() => {
    const list = clothing ?? [];
    return {
      items: list.reduce((s, r) => s + (r.quantity ?? 0), 0),
      records: list.length,
      value: list.reduce(
        (s, r) => s + (r.current_value ?? r.quantity * 5000),
        0,
      ),
      auctioned: list.filter((r) => r.auction_price != null).length,
    };
  }, [clothing]);

  // Peringkat saya di leaderboard
  const myRank = useMemo(() => {
    if (!board || !myRecords) return null;
    const idx = board.findIndex(
      (e) => e.student_id === myRecords[0]?.student_id,
    );
    return idx >= 0 ? { rank: idx + 1, ...board[idx] } : null;
  }, [board, myRecords]);

  // ================= EARLY RETURN SETELAH HOOKS =================
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (myRecords === null || board === null || clothing === null)
    return <LoadingState rows={6} />;

  const top3 = board.slice(0, 3);
  const top3Filled = top3.length >= 3;
  const rest = board.slice(3);

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Qism Nadzhofah"
        description="Riwayat nyeker, tagihan denda, baju disita, dan papan peringkat nakal."
      />

      {/* ===== NYEKER ===== */}
      <div className="gap-4 grid grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Nyeker Total"
          value={`${fmtNum(stats.total)} kali`}
          icon={Footprints}
          tone={stats.total > 0 ? "rose" : "emerald"}
        />
        <StatCard
          label="Bulan Ini"
          value={`${fmtNum(stats.month)} kali`}
          icon={CalendarDays}
          tone="amber"
        />
        <StatCard
          label="Terakhir"
          value={stats.terakhir ? fmtDate(stats.terakhir) : "—"}
          icon={CalendarDays}
          tone="sky"
        />
      </div>

      {/* ===== TAGIHAN DENDA ===== */}
      <Card>
        <CardHeader
          title="Tagihan Denda Nyeker"
          description="Denda 5.000 per catatan — status pembayaran diatur oleh Qism Nadzhofah"
          actions={<Wallet size={15} className="text-brand-soft" />}
        />
        <div className="gap-4 grid grid-cols-1 sm:grid-cols-3 p-5">
          <div className="bg-rose-500/[0.06] p-4 border border-rose-400/25 rounded-xl text-center">
            <p className="flex justify-center items-center gap-1.5 text-[10px] text-rose-300 uppercase tracking-wider">
              <CircleDashed size={12} /> Belum Lunas
            </p>
            <p className="mt-1 font-display font-bold text-rose-300 text-2xl">
              {rp(fines.unpaid)}
            </p>
            <p className="text-[11px] text-slate-500">
              {fmtNum((myRecords ?? []).filter((r) => !r.fine_paid).length)}{" "}
              catatan
            </p>
          </div>
          <div className="bg-emerald-500/[0.06] p-4 border border-emerald-400/25 rounded-xl text-center">
            <p className="flex justify-center items-center gap-1.5 text-[10px] text-emerald-300 uppercase tracking-wider">
              <CircleCheck size={12} /> Sudah Lunas
            </p>
            <p className="mt-1 font-display font-bold text-emerald-300 text-2xl">
              {rp(fines.paid)}
            </p>
            <p className="text-[11px] text-slate-500">
              {fmtNum((myRecords ?? []).filter((r) => r.fine_paid).length)}{" "}
              catatan
            </p>
          </div>
          <div className="bg-white/[0.02] p-4 border border-white/[0.06] rounded-xl text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
              Total Tagihan
            </p>
            <p className="mt-1 font-display font-bold text-slate-100 text-2xl">
              {rp(fines.total)}
            </p>
            <p className="text-[11px] text-slate-500">sepanjang masa</p>
          </div>
        </div>

        {/* Rincian tagihan per catatan */}
        {(myRecords ?? []).length > 0 && (
          <ul className="border-white/[0.06] border-t divide-y divide-white/[0.04]">
            {(myRecords ?? []).slice(0, 10).map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-3 px-5 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-sm">
                    {fmtDate(r.nyeker_date)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {String(r.nyeker_time).slice(0, 5)}
                    {r.note ? ` · ${r.note}` : ""}
                  </p>
                </div>
                <span
                  className={`font-mono text-sm font-semibold ${r.fine_paid ? "text-emerald-300" : "text-rose-300"}`}>
                  {rp(r.fine_amount ?? 5000)}
                </span>
                {r.fine_paid ? (
                  <Badge tone="emerald">
                    <CircleCheck size={11} /> Lunas
                  </Badge>
                ) : (
                  <Badge tone="amber">
                    <CircleDashed size={11} /> Belum Lunas
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* ===== BAJU DISITA ===== */}
      <Card>
        <CardHeader
          title="Baju Disita"
          description="Riwayat penyitaan baju atas namamu"
          actions={<Shirt size={15} className="text-sky-300" />}
        />
        {clothing.length === 0 ? (
          <EmptyState
            icon={Shirt}
            title="Tidak ada penyitaan"
            description="Belum ada baju yang disita atas namamu."
          />
        ) : (
          <>
            <div className="gap-4 grid grid-cols-2 lg:grid-cols-3 p-5">
              <StatCard
                label="Total Baju"
                value={`${fmtNum(clothingStats.items)} baju`}
                icon={Shirt}
                tone="sky"
              />
              <StatCard
                label="Nilai"
                value={rp(clothingStats.value)}
                icon={Wallet}
                tone="amber"
              />
              <StatCard
                label="Dilelang"
                value={`${fmtNum(clothingStats.auctioned)} catatan`}
                icon={Gavel}
              />
            </div>
            <ul className="border-white/[0.06] border-t divide-y divide-white/[0.04]">
              {clothing.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-sm">
                      {c.quantity} baju{c.note ? ` · ${c.note}` : ""}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {fmtDate(c.created_at)}
                      {c.auction_price != null
                        ? ` · dilelang ${fmtDate(c.auction_date)}`
                        : ""}
                    </p>
                  </div>
                  <span className="font-mono font-semibold text-slate-200 text-sm">
                    {rp(c.current_value)}
                  </span>
                  {c.auction_price != null ? (
                    <Badge tone="emerald">Terjual Lelang</Badge>
                  ) : (
                    <Badge tone="neutral">Standar 5rb</Badge>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      {/* ===== Peringkat saya ===== */}
      {myRank && (
        <Card className="p-5 border-rose-400/25">
          <div className="flex items-center gap-4">
            <span className="place-items-center grid bg-rose-400/10 border border-rose-400/25 rounded-xl size-12 font-display font-bold text-rose-300 text-base">
              #{myRank.rank}
            </span>
            <div>
              <p className="font-medium text-slate-200 text-sm">
                Peringkat nakal kamu
              </p>
              <p className="text-slate-500 text-xs">
                Nyeker {fmtNum(myRank.nyeker_count)}× · Baju{" "}
                {fmtNum(myRank.clothing_count)}× · Skor{" "}
                {fmtNum(myRank.naughty_score)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ===== Leaderboard: PODIUM ===== */}
      <Card>
        <CardHeader
          title="Papan Peringkat Nakal"
          description="Gabungan nyeker + baju disita — klik nama untuk ringkasan"
          actions={<Trophy size={15} className="text-rose-300" />}
        />
        {!top3Filled ? (
          <EmptyState
            icon={Trophy}
            title="Data belum cukup"
            description="Podium tampil setelah ada minimal 3 santri dengan catatan."
          />
        ) : (
          <div className="items-end gap-3 grid sm:grid-cols-3 p-5">
            {PODIUM_ORDER.map((i) => {
              const e = top3[i];
              const m = PODIUM[i];
              return (
                <button
                  type="button"
                  key={e.student_id}
                  onClick={() => setDetail(e)}
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
                        <p className="text-slate-500 text-xs">{e.class_name}</p>
                      </div>
                    </div>
                    <div className="relative flex items-center gap-2 mt-4 pt-3 border-white/[0.06] border-t">
                      <Footprints size={13} className="text-slate-500" />
                      <span className="font-mono text-slate-200 text-sm">
                        {fmtNum(e.nyeker_count)}
                      </span>
                      <Shirt size={13} className="ml-1 text-slate-500" />
                      <span className="font-mono text-slate-200 text-sm">
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
      </Card>

      {/* ===== Leaderboard: DAFTAR 4+ ===== */}
      {board.length > 3 && (
        <Card>
          <CardHeader
            title="Peringkat 4+"
            description={`${board.length - 3} santri · klik untuk ringkasan`}
          />
          <ul className="divide-y divide-white/[0.04]">
            {rest.map((e, i) => (
              <li key={e.student_id}>
                <button
                  type="button"
                  onClick={() => setDetail(e)}
                  className="flex items-center gap-3 hover:bg-white/[0.02] px-5 py-3 w-full text-left transition-colors">
                  <span className="w-7 font-mono text-slate-500 text-sm shrink-0">
                    {String(i + 4).padStart(2, "0")}
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
                    <Badge tone="rose">Skor {fmtNum(e.naughty_score)}</Badge>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* ===== Modal detail (ringkasan angka — RLS-safe) ===== */}
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

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Ringkasan peringkat sesuai catatan resmi Qism Nadzhofah. Detail
              riwayat harian hanya dapat dilihat oleh pengurus Qism Nadzhofah.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
