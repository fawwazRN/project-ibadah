import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import { curhatService } from "../../services/curhatService";
import { BkMascot } from "../../components/ui/BkMascot";
import { LoadingState } from "../../components/ui/States";
import ChatThread from "../../components/ui/ChatThread";

export default function SantriCurhat() {
  const { profile } = useAuth();
  const { push } = useToast();
  const [thread, setThread] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [error, setError] = useState(false);

  const refresh = useCallback(async (t) => {
    const m = await curhatService.messages(t.id);
    setMsgs((old) => (old.length === m.length ? old : m));
    return m;
  }, []);

  useEffect(() => {
    if (!profile?.id) return undefined;
    let alive = true;
    let timer;
    curhatService.myThread(profile.id).then(async (t) => {
      if (!alive) return;
      setThread(t);
      await refresh(t);
      curhatService.markRead(t.id, "student").catch(() => {});
      timer = setInterval(() => {
        if (document.visibilityState === "visible") refresh(t).then(() => curhatService.markRead(t.id, "student")).catch(() => {});
      }, 6000);
    }).catch(() => alive && setError(true));
    return () => { alive = false; clearInterval(timer); };
  }, [profile?.id, refresh]);

  const send = async (body) => {
    try {
      const m = await curhatService.send(thread.id, "student", body);
      setMsgs((x) => [...x, m]);
    } catch (e) {
      push("error", "Pesan gagal terkirim", e.message);
      throw e;
    }
  };

  if (error) return <p className="py-10 text-fg-3 text-center">Curhat belum bisa dibuka. Coba lagi nanti.</p>;
  if (!thread) return <LoadingState rows={3} />;

  return (
    <div className="flex flex-col mx-auto max-w-2xl h-[calc(100dvh-var(--tabbar-h,4rem)-5.5rem)] lg:h-[calc(100dvh-6rem)]">
      <div className="flex items-center gap-3 pb-3 border-line border-b-2">
        <Link to="/santri/bk" aria-label="Kembali" className="place-items-center grid hover:bg-soft-2 rounded-xl size-10 text-fg-2 shrink-0"><ArrowLeft size={20} strokeWidth={2.6} /></Link>
        <div className="bg-tint rounded-2xl shrink-0"><BkMascot mood="care" size={52} /></div>
        <div className="min-w-0">
          <h1 className="font-extrabold text-fg text-lg leading-tight">Curhat bersama OSIS</h1>
          <p className="inline-flex items-center gap-1 font-semibold text-brand-dim text-xs"><Lock size={11} /> Privat — hanya kamu dan Super Admin</p>
        </div>
      </div>
      {msgs.length === 0 && (
        <p className="bg-tint mt-3 px-4 py-3 border-2 border-tint-line rounded-2xl font-semibold text-brand-dim text-sm leading-relaxed">
          Tenang, obrolan ini tidak bisa dibaca santri lain maupun qism lain. Ceritakan apa saja; Super Admin akan membalas secepatnya.
        </p>
      )}
      <div className="flex-1 min-h-0">
        <ChatThread messages={msgs} me="student" onSend={send} placeholder="Tulis curhatanmu…" />
      </div>
    </div>
  );
}
