import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

// Pesan nasihat dari orang tua — hanya yang lolos saringan AI (status 'sent') yang terlihat (RLS).
export default function SantriPesanOrtu() {
  const [msgs, setMsgs] = useState(null);
  useEffect(() => {
    const load = () => supabase.from("parent_messages").select("id, body, created_at").order("created_at").then(({ data }) => setMsgs(data ?? []));
    load(); const t = setInterval(load, 15000); return () => clearInterval(t);
  }, []);
  return (
    <div className="mx-auto max-w-xl space-y-3">
      <h1 className="text-xl font-black">Pesan Orang Tua</h1>
      {msgs?.length === 0 && <p className="text-sm text-slate-500">Belum ada pesan.</p>}
      {msgs?.map((m) => (
        <div key={m.id} className="rounded-2xl bg-emerald-100 px-3 py-2 text-sm">
          <p>{m.body}</p>
          <p className="mt-1 text-[11px] text-slate-500">{new Date(m.created_at).toLocaleString("id-ID")}</p>
        </div>
      ))}
    </div>
  );
}
