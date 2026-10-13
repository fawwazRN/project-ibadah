import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { heartService } from "../../services/heartService";
import { useToast } from "../../hooks/useToast";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardHeader } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { HeartRow, Star } from "../../components/ui/HeartStar";
import { EmptyState, LoadingState } from "../../components/ui/States";

const fd = (d) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

export default function HukumanPage() {
  const { push } = useToast();
  const [board, setBoard] = useState(null);
  const [att, setAtt] = useState(new Map());
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    try {
      const b = await heartService.board();
      setBoard(b);
      if (b[0]) setAtt(new Map((await heartService.attendance(b[0].period_start)).map((a) => [a.student_id, a.attended])));
    } catch (e) {
      push("error", "Gagal memuat", e.message);
      setBoard([]);
    }
  }, [push]);
  useEffect(() => { load(); }, [load]);

  const toggle = async (r) => {
    const next = !att.get(r.student_id);
    setBusy(r.student_id);
    try {
      await heartService.setAttended(r.student_id, r.period_start, next);
      setAtt((m) => new Map(m).set(r.student_id, next));
    } catch (e) { push("error", "Gagal menyimpan", e.message); }
    finally { setBusy(null); }
  };

  if (!board) return <LoadingState rows={4} />;
  const p = board[0];
  const punish = board.filter((r) => r.in_punishment);

  return (
    <div className="space-y-5 mx-auto max-w-4xl">
      <PageHeader title="Absensi Penghukuman"
        description={p ? `Periode ${fd(p.period_start)} – ${fd(p.period_end)} · ${Math.max(0, p.days_left)} hari lagi` : "Belum ada data santri."} />

      <Card>
        <CardHeader title={`Wajib hadir (${punish.length})`} description="Santri yang hatinya habis pada periode ini." />
        {punish.length === 0 ? (
          <EmptyState title="Belum ada yang hatinya habis" description="Semua santri masih punya hati. Alhamdulillah." />
        ) : (
          <ul className="divide-y divide-line">
            {punish.map((r) => {
              const ok = !!att.get(r.student_id);
              return (
                <li key={r.student_id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-fg text-sm truncate">{r.full_name}</p>
                    <p className="text-fg-3 text-xs">{r.class_name}</p>
                  </div>
                  <Badge tone={ok ? "emerald" : "rose"}>{ok ? "Sudah hadir" : "Belum hadir"}</Badge>
                  <Button size="sm" variant={ok ? "secondary" : "primary"} loading={busy === r.student_id}
                    icon={ok ? CheckCircle2 : Circle} onClick={() => toggle(r)}>
                    {ok ? "Batalkan" : "Tandai hadir"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="Papan hati & bintang" description="Semua santri, urut bintang terbanyak." />
        <ul className="divide-y divide-line">
          {board.map((r, i) => (
            <li key={r.student_id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-6 font-bold text-fg-4 text-xs">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-fg text-sm truncate">{r.full_name}</p>
                <p className="text-fg-3 text-xs">{r.class_name} · {r.other_count} pelanggaran non-ibadah</p>
              </div>
              <HeartRow hearts={r.hearts} size={20} beat={false} />
              <span className="flex items-center justify-end gap-1 w-14 font-black text-amber-600 text-sm">{r.stars}<Star size={15} uid={`a${i}`} /></span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
