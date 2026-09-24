import { useCallback, useEffect, useState } from "react";
import { Plus, ArrowRightLeft, Power } from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { LoadingState, ErrorState } from "../../components/ui/States";
import { useToast } from "../../hooks/useToast";
import { useConfirm } from "../../context/ConfirmContext";
import { leagueService } from "../../services/leagueService";

export default function SeasonsPage() {
  const { push } = useToast();
  const confirm = useConfirm();
  const [phases, setPhases] = useState(null);
  const [seasonMap, setSeasonMap] = useState({});
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // 'phase' | 'season'
  const [form, setForm] = useState({ name: "", phase_id: "" });

  const load = useCallback(async () => {
    const ps = await leagueService.listPhases();
    const map = {};
    await Promise.all(
      ps.map(async (p) => {
        map[p.id] = await leagueService.listSeasons(p.id);
      }),
    );
    setPhases(ps);
    setSeasonMap(map);
  }, []);
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  const completePhase = async (phase) => {
    const ok = await confirm({
      title: `Tutup ${phase.name}?`,
      message:
        "Klasemen akhir dihitung dari pertandingan resmi. Dua tim terbawah ditandai degradasi, sisanya masuk fase berikutnya. Tercatat di log audit.",
      confirmText: "Ya, tutup fase",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await leagueService.completePhase(phase.id);
      push(
        "success",
        "Fase ditutup",
        "Fase berikutnya & Musim 1 sudah dibuat.",
      );
      load();
    } catch (e) {
      push("error", "Gagal menutup fase", e.message);
    }
  };

  const create = async () => {
    try {
      if (modal === "phase") {
        await leagueService.createPhase(form.name);
        push("success", "Fase dibuat");
      } else {
        await leagueService.createSeason(form.phase_id, form.name);
        push("success", "Musim dibuat");
      }
      setModal(null);
      load();
    } catch (e) {
      push("error", "Gagal", e.message);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!phases) return <LoadingState rows={5} />;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Fase & Musim"
        description="Satu fase = beberapa musim. Transisi fase mencatat hasil akhir tanpa menghapus tim."
        actions={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setModal("phase");
              setForm({ name: "", phase_id: "" });
            }}>
            Tambah Fase
          </Button>
        }
      />

      <div className="space-y-4">
        {phases.map((p) => (
          <Card key={p.id}>
            <CardHeader
              title={p.name}
              description={`Status: ${p.status}`}
              actions={
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Plus}
                    onClick={() => {
                      setModal("season");
                      setForm({ name: "", phase_id: p.id });
                    }}>
                    Musim
                  </Button>
                  {p.status === "active" && (
                    <Button
                      size="sm"
                      variant="dangerSoft"
                      icon={ArrowRightLeft}
                      onClick={() => completePhase(p)}>
                      Tutup Fase & Degradasi
                    </Button>
                  )}
                </div>
              }
            />
            <ul className="divide-y divide-white/[0.04]">
              {(seasonMap[p.id] ?? []).map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <p className="flex-1 text-slate-200 text-sm">{s.name}</p>
                  {s.is_current && <Badge tone="emerald">Berjalan</Badge>}
                  <Badge tone={s.status === "completed" ? "neutral" : "sky"}>
                    {s.status}
                  </Badge>
                  {!s.is_current && s.status !== "completed" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={Power}
                      onClick={async () => {
                        await leagueService.setCurrentSeason(s.id, p.id);
                        push("success", "Musim diaktifkan");
                        load();
                      }}>
                      Aktifkan
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === "phase" ? "Tambah Fase" : "Tambah Musim"}
        size="sm">
        <div className="space-y-4">
          <Field
            label="Nama (opsional)"
            hint="Kosongkan → otomatis (Fase N / Musim N)">
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModal(null)}>
              Batal
            </Button>
            <Button variant="primary" onClick={create}>
              Simpan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
