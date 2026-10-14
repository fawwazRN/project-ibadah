import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useParams } from "react-router-dom";

const useBase = () => (useLocation().pathname.startsWith("/guest") ? "/guest" : "/santri");
import { ArrowLeft, CalendarDays, Clock, ArrowRight } from "lucide-react";
import { BkMascot } from "../../components/ui/BkMascot";
import { bkService } from "../../services/bkService";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { EmptyState, LoadingState } from "../../components/ui/States";
import { sanitizeArticleHtml } from "../../lib/articleContent";

function useReadProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? Math.min(1, h.scrollTop / max) : 0);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return p;
}

export function ArticleBlocks({ blocks = [] }) {
  return (
    <div className="article-content">
      {blocks.map((b, i) => {
        if (b.type === "h2")
          return (
            <h2 key={i}>
              {b.text}
            </h2>
          );
        if (b.type === "quote")
          return (
            <blockquote
              key={i}
              className="article-quote"
              dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(b.text) }}
            />
          );
        if (b.type === "image")
          return (
            <figure key={i}>
              <img
                src={b.url}
                alt={b.caption || ""}
                loading="lazy"
                className="w-full"
              />
              {b.caption && (
                <figcaption>{b.caption}</figcaption>
              )}
            </figure>
          );
        return <div key={i} dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(b.text) }} />;
      })}
    </div>
  );
}

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "");
const stripHtml = (h = "") => h.replace(/<[^>]*>/g, " ");
const readMinutes = (blocks = []) => {
  const words = blocks.map((b) => stripHtml(b.text)).join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

function ArticleCard({ a, base, featured = false }) {
  return (
    <Link to={`${base}/artikel/${a.id}`} className={`group block ${featured ? "sm:col-span-2" : ""}`}>
      <Card className={`overflow-hidden h-full lift ${featured ? "sm:flex" : ""}`}>
        <div className={`relative overflow-hidden bg-tint ${featured ? "sm:w-1/2 aspect-[16/10] sm:aspect-auto sm:min-h-64" : "aspect-[16/10]"}`}>
          {a.cover_url && (
            <img src={a.cover_url} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          )}
          <div className="top-3 left-3 absolute"><Badge tone="brand" className="!bg-white/90 backdrop-blur">{a.category}</Badge></div>
        </div>
        <div className={`flex flex-col p-5 ${featured ? "sm:w-1/2 sm:p-7 sm:justify-center" : ""}`}>
          <h3 className={`font-extrabold text-fg leading-snug tracking-tight group-hover:text-brand-dim transition-colors ${featured ? "text-xl sm:text-2xl" : "text-lg"}`}>{a.title}</h3>
          {a.excerpt && <p className={`mt-2 text-fg-3 leading-relaxed ${featured ? "line-clamp-4" : "line-clamp-3 text-sm"}`}>{a.excerpt}</p>}
          <div className="flex items-center justify-between mt-auto pt-4 text-fg-4 text-xs">
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} />{fmtDate(a.created_at)}</span>
            <span className="inline-flex items-center gap-1 font-bold text-brand-dim">Baca <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function ArticleList() {
  const base = useBase();
  const [items, setItems] = useState(null);
  useEffect(() => {
    bkService.listArticles({ publishedOnly: true }).then(setItems).catch(() => setItems([]));
  }, []);
  if (!items) return <LoadingState rows={3} />;
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Artikel BK" description="Bacaan ringan untuk hati dan harimu." />
      {items.length === 0 ? (
        <EmptyState title="Belum ada artikel" description="Nantikan bacaan dari guru BK." />
      ) : (
        <div className="gap-4 grid sm:grid-cols-2 stagger">
          {items.map((a, i) => <ArticleCard key={a.id} a={a} base={base} featured={i === 0 && items.length > 2} />)}
        </div>
      )}
    </div>
  );
}

export function ArticleDetail() {
  const base = useBase();
  const { id } = useParams();
  const [a, setA] = useState(undefined);
  const [more, setMore] = useState([]);
  const progress = useReadProgress();
  useEffect(() => {
    window.scrollTo({ top: 0 });
    bkService.getArticle(id).then(setA).catch(() => setA(null));
    bkService.listArticles({ publishedOnly: true }).then((l) => setMore(l.filter((x) => x.id !== id).slice(0, 2))).catch(() => {});
  }, [id]);
  if (a === undefined) return <LoadingState rows={4} />;
  if (!a) return <EmptyState title="Artikel tidak ditemukan" />;
  return (
    <article className="article-open mx-auto max-w-3xl">
      {/* Di-portal ke body: elemen fixed di dalam parent beranimasi (transform) jadi "nempel" di konten */}
      {progress > 0.01 && createPortal(<div className="read-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />, document.body)}

      <Link to={`${base}/artikel`} className="inline-flex items-center gap-1.5 bg-soft hover:bg-tint mb-4 px-3.5 py-2 rounded-full font-bold text-fg-2 text-sm transition-colors">
        <ArrowLeft size={16} /> Semua artikel
      </Link>

      {a.cover_url && (
        <img src={a.cover_url} alt="" className="border border-line rounded-3xl w-full aspect-[2/1] object-cover" />
      )}

      <div className={`article-sheet relative ${a.cover_url ? "-mt-8 sm:-mt-10" : ""}`}>
        <header className="mx-auto max-w-[38rem]">
          <Badge tone="brand">{a.category}</Badge>
          <h1 className="mt-3 font-extrabold text-fg text-[clamp(1.5rem,4.6vw,2rem)] tracking-tight leading-[1.25] text-balance">{a.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-4 text-fg-3 text-xs">
            <span className="inline-flex items-center gap-1.5 bg-soft px-2.5 py-1 rounded-full"><CalendarDays size={13} />{fmtDate(a.created_at)}</span>
            <span className="inline-flex items-center gap-1.5 bg-soft px-2.5 py-1 rounded-full"><Clock size={13} />{readMinutes(a.blocks)} menit baca</span>
          </div>
          {a.excerpt && <p className="bg-tint mt-5 px-4 py-3 rounded-2xl text-fg-2 text-[15px] leading-relaxed">{a.excerpt}</p>}
          <div className="my-7 text-brand/60 text-center text-xs tracking-[.6em]" aria-hidden="true">• • •</div>
        </header>

        <div className="mx-auto max-w-[38rem]">
          <ArticleBlocks blocks={a.blocks} />
        </div>

        <div className="flex items-center gap-3 bg-tint mx-auto mt-10 p-4 rounded-2xl max-w-[38rem]">
          <BkMascot mood="happy" size={52} />
          <div>
            <p className="font-extrabold text-brand-dim text-sm">Selesai dibaca 🌿</p>
            <p className="text-fg-2 text-[13px]">Tarik napas dulu ya. Kak Peci bangga sama kamu.</p>
          </div>
        </div>
      </div>

      {more.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 font-extrabold text-fg text-lg">Baca juga</h2>
          <div className="gap-4 grid sm:grid-cols-2">
            {more.map((m) => <ArticleCard key={m.id} a={m} base={base} />)}
          </div>
        </section>
      )}
    </article>
  );
}
