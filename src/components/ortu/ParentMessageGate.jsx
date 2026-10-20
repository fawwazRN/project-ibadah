import { useCallback, useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { Mascot } from "../ui/Mascot";

// Pesan nasihat dari orang tua yang BELUM dibaca tampil layar penuh saat santri membuka web.
// Santri harus membaca sampai bawah dulu, baru tombol "Sudah saya baca" aktif dan web terbuka.
// Hanya pesan lolos saringan AI (status 'sent') yang pernah sampai ke sini (RLS).
export default function ParentMessageGate() {
  const [msgs, setMsgs] = useState([]);
  const [readAll, setReadAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const box = useRef(null);
  const busy = useRef(false);

  const check = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    const { data, error } = await supabase
      .from("parent_messages")
      .select("id, body, created_at")
      .eq("status", "sent")
      .is("read_at", null)
      .order("created_at", { ascending: true })
      .limit(50);
    busy.current = false;
    if (!error && data?.length) {
      setMsgs((prev) => (prev.length ? prev : data));
    }
  }, []);

  // saat web dibuka + saat kembali ke tab/aplikasi
  useEffect(() => {
    check();
    const onVis = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [check]);

  // kunci scroll halaman di belakang selama pesan tampil
  useEffect(() => {
    if (!msgs.length) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [msgs.length]);

  const measure = useCallback(() => {
    const el = box.current;
    if (!el) return;
    setReadAll(el.scrollHeight - el.scrollTop - el.clientHeight <= 6);
  }, []);
  useEffect(() => {
    if (!msgs.length) return;
    setReadAll(false);
    const t = setTimeout(measure, 50);
    window.addEventListener("resize", measure);
    return () => { clearTimeout(t); window.removeEventListener("resize", measure); };
  }, [msgs, measure]);

  if (!msgs.length) return null;

  const done = async () => {
    if (!readAll || saving) return;
    setSaving(true);
    await supabase
      .from("parent_messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", msgs.map((m) => m.id))
      .is("read_at", null);
    setSaving(false);
    setMsgs([]);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pesan dari orang tua"
      className="z-[500] fixed inset-0 flex flex-col bg-page safe-top safe-bottom">
      <div className="flex flex-col flex-1 mx-auto p-5 w-full max-w-xl min-h-0">
        <div className="flex flex-col items-center text-center shrink-0">
          <Mascot mood="care" size={96} className="animate-float" />
          <h1 className="mt-2 font-display text-fg text-2xl" style={{ fontWeight: 900 }}>
            Pesan dari Orang Tua
          </h1>
          <p className="mt-1 font-semibold text-fg-3 text-sm">
            Baca dulu ya, sebelum membuka aplikasi.
          </p>
        </div>

        <div
          ref={box}
          onScroll={measure}
          className="flex-1 space-y-3 my-4 pr-1 min-h-0 overflow-y-auto">
          {msgs.map((m) => (
            <div key={m.id} className="bg-brand/10 p-4 border-2 border-brand/30 rounded-2xl">
              <p className="flex items-center gap-1.5 mb-1.5 font-extrabold text-brand-dim text-xs">
                <Heart size={14} fill="currentColor" /> Ayah / Bunda
              </p>
              <p className="font-semibold text-fg text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                {m.body}
              </p>
              <p className="mt-2 font-semibold text-[11px] text-fg-4">
                {new Date(m.created_at).toLocaleString("id-ID", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-2 shrink-0">
          {!readAll && (
            <p className="font-bold text-fg-3 text-xs text-center">Gulir sampai bawah untuk membaca semuanya ↓</p>
          )}
          <button
            onClick={done}
            disabled={!readAll || saving}
            className="bg-brand disabled:opacity-40 py-3.5 rounded-2xl w-full font-extrabold text-on-brand text-base transition-opacity">
            {saving ? "Menyimpan…" : "Sudah saya baca"}
          </button>
        </div>
      </div>
    </div>
  );
}
