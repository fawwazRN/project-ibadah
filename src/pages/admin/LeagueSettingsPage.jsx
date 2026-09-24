import { useCallback, useEffect, useState } from "react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { LoadingState, ErrorState } from "../../components/ui/States";
import { useToast } from "../../hooks/useToast";
import { leagueService } from "../../services/leagueService";

const OPTIONS = [
  { key: "points", label: "Poin (3/1/0)" },
  { key: "goal_difference", label: "Selisih Gol" },
  { key: "goals_for", label: "Gol Masuk" },
  { key: "head_to_head", label: "Head-to-Head" },
];

export default function LeagueSettingsPage() {
  const { push } = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setError(null);
    leagueService
      .getSettings()
      .then((s) => setOrder(s.tiebreak_order))
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const move = (i, dir) => {
    const next = [...order];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  };

  const save = async () => {
    setSaving(true);
    try {
      await leagueService.updateSettings(order);
      push("success", "Pengaturan disimpan");
    } catch (e) {
      push("error", "Gagal menyimpan", e.message);
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!order) return <LoadingState rows={3} />;

  return (
    <div className="max-w-2xl animate-fade-up">
      <PageHeader
        title="Pengaturan Liga"
        description="Urutan tie-break klasemen — hanya Super Admin yang dapat mengubah."
      />
      <Card>
        <CardHeader
          title="Aturan Tie-Break"
          description="Panah untuk mengubah prioritas"
        />
        <ul className="divide-y divide-white/[0.04]">
          {order.map((k, i) => (
            <li key={k} className="flex items-center gap-3 px-5 py-3">
              <span className="font-mono text-slate-500 text-xs">{i + 1}</span>
              <p className="flex-1 text-slate-200 text-sm">
                {OPTIONS.find((o) => o.key === k)?.label ?? k}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => move(i, -1)}
                disabled={i === 0}>
                ↑
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => move(i, 1)}
                disabled={i === order.length - 1}>
                ↓
              </Button>
            </li>
          ))}
        </ul>
        <div className="px-5 py-4 border-white/[0.06] border-t">
          <Button variant="primary" loading={saving} onClick={save}>
            Simpan Pengaturan
          </Button>
        </div>
      </Card>
    </div>
  );
}
