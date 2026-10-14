import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, BookOpen, ChevronRight, MessagesSquare, RotateCcw } from "lucide-react";
import { TopicIcon } from "../../components/ui/TopicIcon";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { useAuth } from "../../context/AuthContext";
import { bkService } from "../../services/bkService";
import { BkMascot } from "../../components/ui/BkMascot";
import { Button } from "../../components/ui/Button";
import { EmptyState, LoadingState } from "../../components/ui/States";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function SantriBkChat() {
  const { profile } = useAuth();
  const location = useLocation();
  const base = location.pathname.startsWith("/guest") ? "/guest" : "/santri";
  const [flow, setFlow] = useState(null);
  const [error, setError] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [typing, setTyping] = useState(false);
  const [mood, setMood] = useState("talk");
  const [node, setNode] = useState(null); // node aktif → pilihan tampil bila selesai mengetik
  const [ready, setReady] = useState(false);
  const [article, setArticle] = useState(null);
  const [topic, setTopic] = useState(null); // node pembuka terpilih
  const endRef = useRef(null);
  const run = useRef(0); // token pembatalan
  const sess = useRef({ id: null, path: [] });

  const scroll = () =>
    requestAnimationFrame(() =>
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }),
    );

  const play = useCallback(async (n, token) => {
    setReady(false);
    setNode(n);
    setMood(n.mood || "talk");
    const parts = n.message.split(/\n\s*\n/).filter(Boolean);
    for (const p of parts) {
      setTyping(true);
      scroll();
      await wait(Math.min(1500, 450 + p.length * 14));
      if (run.current !== token) return;
      setTyping(false);
      setMsgs((m) => [...m, { from: "bk", text: p, k: crypto.randomUUID() }]);
      scroll();
      await wait(250);
      if (run.current !== token) return;
    }
    if (!n.choices.length) {
      if (n.article_id) {
        try {
          setArticle(await bkService.getArticle(n.article_id));
        } catch {
          /* rekomendasi bersifat opsional */
        }
      }
      if (sess.current.id) bkService.saveSession(sess.current.id, sess.current.path, true);
    }
    setReady(true);
    scroll();
  }, []);

  const begin = useCallback(
    async (f, start) => {
      const token = ++run.current;
      setMsgs([]);
      setArticle(null);
      setNode(null);
      if (!start) return;
      sess.current = { id: null, path: [] };
      if (profile?.id) // tamu tidak menyimpan riwayat
        bkService
          .startSession(profile.id)
          .then((s) => (sess.current.id = s.id))
          .catch(() => {});
      await play(start, token);
    },
    [play, profile?.id],
  );

  useEffect(() => {
    let alive = true;
    bkService
      .loadFlow()
      .then((f) => {
        if (!alive) return;
        setFlow(f);
        if (f.starts.length === 1 && !location.pathname.startsWith("/santri")) {
          setTopic(f.starts[0]);
          begin(f, f.starts[0]);
        }
      })
      .catch((e) => alive && setError(e));
    return () => {
      alive = false;
      run.current++; // hentikan animasi yang sedang berjalan
    };
  }, [begin]);

  const choose = async (c) => {
    if (!ready) return;
    const token = run.current;
    setReady(false);
    setMsgs((m) => [...m, { from: "me", text: c.label, k: crypto.randomUUID() }]);
    sess.current.path.push({ node: node.id, choice: c.id });
    const next = c.next_node_id ? flow.byId.get(c.next_node_id) : null;
    if (sess.current.id) bkService.saveSession(sess.current.id, sess.current.path, !next);
    scroll();
    if (!next) {
      setNode({ ...node, choices: [] });
      setMood("cheer");
      setReady(true);
      return;
    }
    await wait(350);
    if (run.current === token) play(next, token);
  };

  if (error)
    return (
      <EmptyState
        title="Obrolan belum bisa dimuat"
        description="Coba muat ulang halaman sebentar lagi."
      />
    );
  if (!flow) return <LoadingState rows={3} />;
  if (!flow.starts.length && base !== "/santri")
    return (
      <EmptyState
        title="Kak Peci belum siap ngobrol"
        description="Super admin perlu menandai minimal satu percakapan sebagai topik."
      />
    );

  const ended = ready && node && node.choices.length === 0;

  const pick = (t) => {
    setTopic(t);
    begin(flow, t);
  };
  const backToTopics = () => {
    run.current++;
    setTopic(null);
    setMsgs([]);
    setNode(null);
    setMood("talk");
  };

  // ---------- Pemilih topik: kartu persis seperti daftar artikel ----------
  if (!topic)
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader icon={MessagesSquare} title="Ngobrol sama Kak Peci" description="Pilih topik, lalu ngobrol langsung — Kak Peci siap menyimak." />
        <div className="gap-3 grid sm:grid-cols-2 stagger">
          {base === "/santri" && (
            <Link to="/santri/curhat" className="text-left">
              <Card className="q-riyadhah group overflow-hidden h-full lift">
                <div className="place-items-center grid w-full h-36" style={{ background: "var(--q-tint)" }}>
                  <span className="place-items-center grid bg-white shadow-md rounded-3xl size-20 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300" style={{ color: "var(--q)" }}><TopicIcon name="heart" size={38} /></span>
                </div>
                <div className="p-4">
                  <Badge tone="rose">Privat</Badge>
                  <h3 className="mt-2 font-extrabold text-fg leading-snug">Curhat bersama OSIS</h3>
                  <p className="mt-1 text-fg-3 text-sm line-clamp-2">Ngobrol langsung dengan Super Admin. Tenang, tidak dibaca orang lain.</p>
                  <span className="inline-flex items-center gap-1 mt-3 font-bold text-xs" style={{ color: "var(--q-dim)" }}>
                    <MessagesSquare size={13} /> Mulai curhat <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Card>
            </Link>
          )}
          {flow.starts.map((t) => (
            <button key={t.id} onClick={() => pick(t)} className="text-left">
              <Card className={`q-${t.topic_tone ?? "brand"} group overflow-hidden h-full lift`}>
                {t.topic_cover ? (
                  <img src={t.topic_cover} alt="" loading="lazy" className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="relative place-items-center grid w-full h-36 overflow-hidden" style={{ background: "var(--q-tint)" }}>
                    <span className="place-items-center grid bg-white shadow-md rounded-3xl size-20 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300" style={{ color: "var(--q)" }}><TopicIcon name={t.topic_emoji} size={38} /></span>
                  </div>
                )}
                <div className="p-4">
                  <Badge tone="brand">{t.topic_category || "Obrolan"}</Badge>
                  <h3 className="mt-2 font-extrabold text-fg leading-snug">{t.title}</h3>
                  {t.topic_summary && <p className="mt-1 text-fg-3 text-sm line-clamp-2">{t.topic_summary}</p>}
                  <span className="inline-flex items-center gap-1 mt-3 font-bold text-xs" style={{ color: "var(--q-dim)" }}>
                    <MessagesSquare size={13} /> Ngobrol sekarang <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Card>
            </button>
          ))}
        </div>
      </div>
    );

  return (
    <div className="flex flex-col mx-auto max-w-2xl h-[calc(100dvh-var(--tabbar-h,4rem)-5.5rem)] lg:h-[calc(100dvh-6rem)]">
      {/* Kepala */}
      <div className="flex items-center gap-3 pb-3 border-line border-b-2">
        {(flow.starts.length > 1 || base === "/santri") && (
          <button onClick={backToTopics} aria-label="Ganti topik" className="place-items-center grid hover:bg-soft-2 rounded-xl size-10 text-fg-2 active:scale-90 transition shrink-0">
            <ArrowLeft size={20} strokeWidth={2.6} />
          </button>
        )}
        <div className="bg-tint rounded-2xl shrink-0">
          <BkMascot mood={typing ? "think" : mood} size={56} />
        </div>
        <div className="min-w-0">
          <h1 className="font-extrabold text-fg text-lg leading-tight truncate">{topic.title}</h1>
          <p className="text-fg-3 text-xs">
            {typing ? "sedang mengetik…" : "Teman ngobrol & konseling santri"}
          </p>
        </div>
        <button
          onClick={() => begin(flow, topic)}
          title="Mulai ulang"
          aria-label="Mulai ulang obrolan"
          className="place-items-center grid ml-auto rounded-xl size-10 text-fg-3 hover:bg-soft-2">
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Obrolan */}
      <div className="flex-1 space-y-2.5 py-4 overflow-y-auto" aria-live="polite">
        {msgs.map((m) =>
          m.from === "bk" ? (
            <div key={m.k} className="flex justify-start animate-fade-up">
              <p className="bg-soft px-4 py-2.5 border-2 border-line rounded-2xl rounded-bl-md max-w-[85%] text-fg text-[15px] leading-relaxed whitespace-pre-wrap">
                {m.text}
              </p>
            </div>
          ) : (
            <div key={m.k} className="flex justify-end animate-fade-up">
              <p className="bg-brand px-4 py-2.5 border-2 border-edge rounded-2xl rounded-br-md max-w-[85%] font-bold text-on-brand text-[15px] leading-relaxed">
                {m.text}
              </p>
            </div>
          ),
        )}
        {typing && (
          <div className="flex justify-start">
            <span className="inline-flex items-center gap-1 bg-soft px-4 py-3.5 border-2 border-line rounded-2xl rounded-bl-md">
              {[0, 1, 2].map((i) => (
                <i
                  key={i}
                  className="bg-fg-4 rounded-full size-2 animate-pulse"
                  style={{ animationDelay: `${i * 0.18}s` }}
                />
              ))}
            </span>
          </div>
        )}

        {ended && article && (
          <Link
            to={`${base}/artikel/${article.id}`}
            className="flex items-center gap-3 bg-tint p-3 border-2 border-tint-line rounded-2xl animate-pop">
            <span className="place-items-center grid bg-brand rounded-xl size-10 text-on-brand shrink-0">
              <BookOpen size={18} />
            </span>
            <span className="min-w-0">
              <span className="block font-bold text-brand-dim text-xs">Bacaan untukmu</span>
              <span className="block font-extrabold text-fg text-sm truncate">{article.title}</span>
            </span>
          </Link>
        )}
        <div ref={endRef} />
      </div>

      {/* Pilihan jawaban */}
      <div className="pt-3 border-line border-t-2">
        {ready && node?.choices.length > 0 && (
          <div className="flex flex-col gap-2">
            {node.choices.map((c) => (
              <button
                key={c.id}
                onClick={() => choose(c)}
                className="bg-card hover:bg-tint active:translate-y-0.5 px-4 py-3 border-2 border-line hover:border-brand rounded-2xl font-bold text-fg text-left text-[15px] transition-colors animate-fade-up">
                {c.label}
              </button>
            ))}
          </div>
        )}
        {ended && (
          <div className="flex gap-2">
            <Button variant="primary" className="flex-1" icon={RotateCcw} onClick={() => begin(flow, topic)}>
              Ngobrol lagi
            </Button>
            {(flow.starts.length > 1 || base === "/santri") ? (
              <Button className="flex-1" onClick={backToTopics}>Topik lain</Button>
            ) : (
              <Link to={`${base}/artikel`} className="flex-1">
                <Button className="w-full" icon={BookOpen}>Artikel</Button>
              </Link>
            )}
          </div>
        )}
        {!ready && !ended && (
          <p className="py-3 text-fg-4 text-xs text-center">Kak Peci sedang menyimak…</p>
        )}
      </div>
    </div>
  );
}
