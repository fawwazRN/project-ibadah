import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { curhatService } from "../../services/curhatService";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState, LoadingState } from "../../components/ui/States";
import ChatThread from "../../components/ui/ChatThread";

export default function AdminCurhat() {
  const { push } = useToast();
  const [threads, setThreads] = useState(null);
  const [active, setActive] = useState(null);
  const [msgs, setMsgs] = useState([]);

  const loadInbox = useCallback(() => curhatService.inbox().then(setThreads).catch(() => setThreads([])), []);
  useEffect(() => {
    loadInbox();
    const t = setInterval(() => document.visibilityState === "visible" && loadInbox(), 10000);
    return () => clearInterval(t);
  }, [loadInbox]);

  useEffect(() => {
    if (!active) return undefined;
    let alive = true;
    const pull = () => curhatService.messages(active.id).then((m) => alive && setMsgs((o) => (o.length === m.length ? o : m))).catch(() => {});
    pull();
    curhatService.markRead(active.id, "admin").then(loadInbox);
    const t = setInterval(() => document.visibilityState === "visible" && pull(), 6000);
    return () => { alive = false; clearInterval(t); };
  }, [active?.id, loadInbox]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async (body) => {
    try {
      const m = await curhatService.send(active.id, "admin", body);
      setMsgs((x) => [...x, m]);
      loadInbox();
    } catch (e) {
      push("error", "Pesan gagal terkirim", e.message);
      throw e;
    }
  };

  if (!threads) return <LoadingState rows={3} />;
  const name = (t) => t.student?.full_name ?? "Santri";

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader icon={Lock} title="Curhat Santri" description="Obrolan privat — hanya Super Admin dan santri yang bersangkutan yang bisa membacanya." />
      {threads.length === 0 ? (
        <EmptyState title="Belum ada curhat" description="Pesan dari santri akan muncul di sini." />
      ) : (
        <div className="gap-4 grid lg:grid-cols-[18rem_1fr]">
          <ul className={`space-y-2 ${active ? "hidden lg:block" : ""} stagger`}>
            {threads.map((t) => (
              <li key={t.id}>
                <button onClick={() => { setActive(t); setMsgs([]); }} className={`flex items-center gap-3 w-full p-3 border-2 rounded-2xl text-left transition lift ${active?.id === t.id ? "bg-tint border-brand" : "bg-card border-line"}`}>
                  <span className="place-items-center grid bg-tint rounded-full size-10 font-extrabold text-brand-dim shrink-0">{name(t)[0]}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-bold text-fg text-sm truncate">{name(t)}</span>
                    <span className="block text-fg-3 text-xs">{new Date(t.last_message_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  </span>
                  {t.unread_admin && <span className="bg-rose-500 rounded-full size-2.5 pop-on-change" aria-label="Belum dibaca" />}
                </button>
              </li>
            ))}
          </ul>
          {active ? (
            <div className="flex flex-col bg-card p-4 border-2 border-line rounded-3xl h-[calc(100dvh-14rem)] min-h-[24rem]">
              <div className="flex items-center gap-2 pb-3 border-line border-b-2">
                <button className="lg:hidden place-items-center grid hover:bg-soft-2 rounded-xl size-9" onClick={() => setActive(null)} aria-label="Kembali"><ArrowLeft size={18} /></button>
                <h2 className="flex-1 font-extrabold text-fg truncate">{name(active)}</h2>
                <Lock size={14} className="text-fg-3" />
              </div>
              <div className="flex-1 min-h-0"><ChatThread messages={msgs} me="admin" onSend={send} placeholder="Balas dengan lembut…" /></div>
            </div>
          ) : (
            <p className="hidden lg:grid place-items-center text-fg-3 text-sm">Pilih satu obrolan untuk membalas.</p>
          )}
        </div>
      )}
    </div>
  );
}
