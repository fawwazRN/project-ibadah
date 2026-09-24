import { useCallback, useEffect, useState } from "react";
import { Scale, Plus, Pencil } from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/States";
import { RuleFormModal } from "../../components/rules/RuleFormModal";
import { useToast } from "../../hooks/useToast";
import { useConfirm } from "../../context/ConfirmContext";
import { ruleService } from "../../services/ruleService";
import { RULE_CATEGORIES } from "../../lib/constants";

const SCOPE_LABELS = { ibadah: "Qism Ibadah", riyadhah: "Qism Riyadhah" };

function Switch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative h-5 w-9 rounded-full border transition-colors ${checked ? "border-brand/40 bg-brand/30" : "border-white/10 bg-white/[0.06]"}`}>
      <span
        className={`absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full transition-all ${checked ? "left-[18px] bg-brand-soft" : "left-[3px] bg-slate-400"}`}
      />
    </button>
  );
}

export default function RulesManagement({ scope = "ibadah" }) {
  const [rules, setRules] = useState(null);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { push } = useToast();
  const confirm = useConfirm();

  const load = useCallback(() => {
    setError(null);
    ruleService
      .list({ scope })
      .then(setRules)
      .catch((e) => setError(e.message));
  }, [scope]);
  useEffect(load, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!rules) return <LoadingState rows={6} />;

  const toggle = async (rule) => {
    const activating = !rule.is_active;
    const ok = await confirm({
      title: activating ? "Aktifkan aturan?" : "Nonaktifkan aturan?",
      message: activating
        ? `“${rule.name}” akan kembali tersedia saat pencatatan pelanggaran.`
        : `“${rule.name}” tidak akan muncul saat pencatatan pelanggaran baru. Riwayat lama tetap tersimpan.`,
      confirmText: activating ? "Ya, aktifkan" : "Ya, nonaktifkan",
      tone: activating ? "default" : "danger",
    });
    if (!ok) return;
    try {
      await ruleService.setActive(rule.id, activating, rule.name);
      push(
        "success",
        activating ? "Aturan diaktifkan" : "Aturan dinonaktifkan",
        rule.name,
      );
      load();
    } catch (e) {
      push("error", "Gagal mengubah status aturan", e.message);
    }
  };

  const categories = [
    ...RULE_CATEGORIES,
    ...new Set(
      rules.map((r) => r.category).filter((c) => !RULE_CATEGORIES.includes(c)),
    ),
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={`Aturan Poin — ${SCOPE_LABELS[scope]}`}
        description={`Aturan milik ${SCOPE_LABELS[scope]} saja. Aturan tidak dapat dihapus — gunakan nonaktifkan agar riwayat tetap utuh.`}
        actions={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}>
            Tambah Aturan
          </Button>
        }
      />

      {rules.length === 0 ? (
        <Card>
          <EmptyState
            icon={Scale}
            title="Belum ada aturan"
            description={`Buat aturan pertama untuk ${SCOPE_LABELS[scope]}.`}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => {
            const list = rules.filter((r) => r.category === cat);
            if (list.length === 0) return null;
            return (
              <Card key={cat}>
                <CardHeader
                  title={cat}
                  description={`${list.length} aturan · ${list.filter((r) => r.is_active).length} aktif`}
                />
                <ul className="divide-y divide-white/[0.04]">
                  {list.map((rule) => (
                    <li
                      key={rule.id}
                      className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-200 text-sm">
                          {rule.name}
                        </p>
                        <p className="text-slate-500 text-xs truncate">
                          {rule.description || "—"}
                        </p>
                      </div>
                      <Badge tone="rose">+{rule.points} poin</Badge>
                      {rule.creates_suspension && (
                        <Badge tone="violet">
                          Suspensi {rule.suspension_weeks} pekan
                        </Badge>
                      )}
                      <Switch
                        checked={rule.is_active}
                        onChange={() => toggle(rule)}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Pencil}
                        onClick={() => {
                          setEditing(rule);
                          setFormOpen(true);
                        }}>
                        Edit
                      </Button>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}

      <RuleFormModal
        open={formOpen}
        rule={editing}
        scope={scope}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
