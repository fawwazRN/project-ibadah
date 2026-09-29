import { useCallback, useEffect, useState } from "react";
import { Search, Shirt, Gavel, Plus, Trash2 } from "lucide-react";
import { Card, CardHeader } from "../../components/ui/Card";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Field, Input, Textarea } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { TableWrap, Table, Th, Td, Tr } from "../../components/ui/Table";
import {
  LoadingState,
  ErrorState,
  EmptyState,
} from "../../components/ui/States";
import { useToast } from "../../hooks/useToast";
import { useConfirm } from "../../context/ConfirmContext";
import { nyekerService } from "../../services/nyekerService";
import { profileService } from "../../services/profileService";
import { fmtNum } from "../../lib/calc";
import { fmtDate } from "../../lib/date";

const rp = (n) => `Rp ${fmtNum(n)}`;

export default function NadzhofahPakaianPage() {
  const { push } = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState(null);
  const [finance, setFinance] = useState(null);
  const [error, setError] = useState(null);

  // Form penyitaan
  const [santri, setSantri] = useState([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Form lelang
  const [auctionFor, setAuctionFor] = useState(null);
  const [auctionPrice, setAuctionPrice] = useState("");
  const [auctionDate, setAuctionDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [savingAuction, setSavingAuction] = useState(false);

  const load = useCallback(() => {
    setError(null);
    Promise.all([
      nyekerService.listClothing(),
      nyekerService.clothingFinance(),
      profileService.listSantri(),
    ])
      .then(([r, f, s]) => {
        setRows(r);
        setFinance(f);
        setSantri(s);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const filtered = santri
    .filter((s) => s.full_name.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 8);

  const submitConfiscate = async () => {
    if (!selected) return push("error", "Pilih santri dulu");
    setSaving(true);
    try {
      await nyekerService.createClothing({
        student_id: selected.id,
        quantity: qty,
        note: note.trim() || null,
      });
      push(
        "success",
        "Penyitaan tercatat",
        `${qty} baju — ${selected.full_name} · nilai standar ${rp(5000 * qty)}`,
      );
      setSelected(null);
      setQ("");
      setQty(1);
      setNote("");
      load();
    } catch (e) {
      push("error", "Gagal menyimpan", e.message);
    } finally {
      setSaving(false);
    }
  };

  const submitAuction = async () => {
    const price = Number(auctionPrice);
    if (!Number.isInteger(price) || price < 0)
      return push("error", "Harga tidak valid", "Gunakan bilangan bulat ≥ 0.");
    setSavingAuction(true);
    try {
      await nyekerService.setAuction(auctionFor.id, price, auctionDate);
      push("success", "Hasil lelang dicatat", rp(price));
      setAuctionFor(null);
      load();
    } catch (e) {
      push("error", "Gagal", e.message);
    } finally {
      setSavingAuction(false);
    }
  };

  // Hapus penyitaan salah
  const removeRow = async (c) => {
    const ok = await confirm({
      title: "Hapus catatan penyitaan?",
      message: `${c.quantity} baju atas nama ${c.full_name} (${rp(c.current_value)}) akan dihapus permanen. Lakukan hanya bila pencatatan keliru.`,
      confirmText: "Ya, hapus",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await nyekerService.removeClothing(c.id);
      push("success", "Catatan penyitaan dihapus", c.full_name);
      load();
    } catch (e) {
      push("error", "Gagal menghapus", e.message);
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!rows || !finance) return <LoadingState rows={7} />;

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Penyitaan Baju & Lelang"
        description="Baju disita dengan nilai standar 5.000/baju. Bila dilelang, nilai akhirnya mengikuti hasil lelang. Catatan yang keliru dapat dihapus."
      />

      {/* Ringkasan keuangan */}
      <div className="gap-4 grid grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Baju Disita"
          value={fmtNum(finance.total_items)}
          icon={Shirt}
        />
        <StatCard
          label="Nilai Standar"
          value={rp(finance.total_standard)}
          icon={Shirt}
          tone="sky"
        />
        <StatCard
          label="Hasil Lelang"
          value={rp(finance.total_auctioned)}
          icon={Gavel}
          tone="amber"
        />
        <StatCard
          label="Total Nilai Saat Ini"
          value={rp(finance.total_income)}
          icon={Gavel}
          tone="emerald"
        />
      </div>

      <div className="gap-5 grid lg:grid-cols-2">
        {/* Form penyitaan */}
        <Card>
          <CardHeader
            title="Catat Penyitaan"
            description="Standar: 5.000 per baju"
            actions={<Shirt size={15} className="text-brand-soft" />}
          />
          <div className="space-y-3 p-5">
            <Field label="Cari santri">
              <div className="relative">
                <Search
                  size={14}
                  className="top-1/2 left-3 absolute text-slate-500 -translate-y-1/2"
                />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Ketik nama…"
                  className="pl-9"
                />
              </div>
            </Field>
            {!selected && q !== "" && (
              <div className="bg-ink-800 border border-white/10 rounded-lg max-h-40 overflow-y-auto">
                {filtered.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => {
                      setSelected(s);
                      setQ("");
                    }}
                    className="block hover:bg-white/5 px-3 py-2 w-full text-slate-300 text-sm text-left">
                    {s.full_name}{" "}
                    <span className="text-slate-500 text-xs">
                      {s.class_name}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {selected && (
              <div className="space-y-3 bg-brand/[0.05] p-4 border border-brand/25 rounded-xl">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-slate-100 text-sm">
                    {selected.full_name}
                    <span className="ml-2 text-slate-500 text-xs">
                      {selected.class_name}
                    </span>
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelected(null)}>
                    Ganti
                  </Button>
                </div>
                <Field label="Jumlah baju">
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                  />
                </Field>
                <Field
                  label="Catatan (opsional)"
                  hint={`Nilai standar: ${rp(5000 * qty)}`}>
                  <Textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Mis. kondisi baju, lokasi…"
                  />
                </Field>
                <Button
                  variant="primary"
                  icon={Plus}
                  loading={saving}
                  onClick={submitConfiscate}
                  className="w-full">
                  Catat Penyitaan
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Daftar + lelang + hapus */}
        <Card>
          <CardHeader
            title="Daftar Penyitaan"
            description={`${rows.length} catatan`}
            actions={<Gavel size={15} className="text-amber-300" />}
          />
          {rows.length === 0 ? (
            <EmptyState icon={Shirt} title="Belum ada penyitaan" />
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Santri</Th>
                    <Th>Baju</Th>
                    <Th>Nilai</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Aksi</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <Tr key={c.id}>
                      <Td>
                        <p className="font-medium text-slate-200">
                          {c.full_name}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {c.class_name}
                          {c.note ? ` · ${c.note}` : ""}
                        </p>
                      </Td>
                      <Td className="text-slate-300">{c.quantity}</Td>
                      <Td>
                        <p
                          className={`font-mono font-semibold ${c.auction_price != null ? "text-amber-300" : "text-slate-200"}`}>
                          {rp(c.current_value)}
                        </p>
                        {c.auction_price != null && (
                          <p className="text-[10px] text-slate-500">
                            lelang {fmtDate(c.auction_date)}
                          </p>
                        )}
                      </Td>
                      <Td>
                        {c.auction_price != null ? (
                          <Badge tone="emerald">Terjual Lelang</Badge>
                        ) : (
                          <Badge tone="neutral">Standar 5rb</Badge>
                        )}
                      </Td>
                      <Td className="text-right">
                        <div className="flex justify-end gap-1.5">
                          {c.auction_price == null && (
                            <Button
                              size="sm"
                              variant="secondary"
                              icon={Gavel}
                              onClick={() => {
                                setAuctionFor(c);
                                setAuctionPrice("");
                              }}>
                              Lelang
                            </Button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeRow(c)}
                            title="Hapus catatan"
                            className="place-items-center grid hover:bg-rose-500/10 rounded-md size-7 text-slate-500 hover:text-rose-300 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </Card>
      </div>

      {/* Modal lelang */}
      <Modal
        open={!!auctionFor}
        onClose={() => setAuctionFor(null)}
        title="Hasil Lelang"
        size="sm">
        {auctionFor && (
          <div className="space-y-4">
            <div className="bg-white/[0.02] p-3 border border-white/[0.06] rounded-xl">
              <p className="font-semibold text-slate-100 text-sm">
                {auctionFor.full_name}
              </p>
              <p className="text-slate-500 text-xs">
                {auctionFor.quantity} baju · nilai standar{" "}
                {rp(auctionFor.standard_fee * auctionFor.quantity)}
              </p>
            </div>
            <Field
              label="Harga akhir lelang (Rp)"
              required
              hint="Harga ini akan MENGGANTIKAN nilai standar untuk catatan ini.">
              <Input
                type="number"
                min="0"
                value={auctionPrice}
                onChange={(e) => setAuctionPrice(e.target.value)}
                placeholder="Mis. 15000"
                autoFocus
              />
            </Field>
            <Field label="Tanggal lelang">
              <Input
                type="date"
                className="[color-scheme:dark]"
                value={auctionDate}
                onChange={(e) => setAuctionDate(e.target.value)}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setAuctionFor(null)}>
                Batal
              </Button>
              <Button
                variant="primary"
                icon={Gavel}
                loading={savingAuction}
                onClick={submitAuction}>
                Simpan Hasil Lelang
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
