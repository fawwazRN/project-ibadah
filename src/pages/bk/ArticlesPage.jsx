import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

const useBase = () => (useLocation().pathname.startsWith("/guest") ? "/guest" : "/santri");
import { ArrowLeft } from "lucide-react";
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
            <h2 key={i} className="font-extrabold text-fg">
              {b.text}
            </h2>
          );
        if (b.type === "quote")
          return (
            <blockquote
              key={i}
              className="article-quote bg-tint px-4 py-3 border-brand border-l-4 rounded-r-2xl font-bold text-brand-dim leading-relaxed"
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
                className="border-2 border-line rounded-2xl w-full"
              />
              {b.caption && (
                <figcaption className="mt-1.5 text-fg-3 text-xs text-center">{b.caption}</figcaption>
              )}
            </figure>
          );
        return <div key={i} dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(b.text) }} />;
      })}
    </div>
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
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Artikel BK" description="Bacaan ringan untuk hati dan harimu." />
      {items.length === 0 ? (
        <EmptyState title="Belum ada artikel" description="Nantikan bacaan dari guru BK." />
      ) : (
        <div className="gap-3 grid sm:grid-cols-2 stagger">
          {items.map((a) => (
            <Link key={a.id} to={`${base}/artikel/${a.id}`}>
              <Card className="group overflow-hidden h-full lift">
                {a.cover_url ? (
                  <img src={a.cover_url} alt="" loading="lazy" className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="bg-tint w-full h-36" />
                )}
                <div className="p-4">
                  <Badge tone="brand">{a.category}</Badge>
                  <h3 className="mt-2 font-extrabold text-fg leading-snug">{a.title}</h3>
                  {a.excerpt && <p className="mt-1 text-fg-3 text-sm line-clamp-2">{a.excerpt}</p>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ArticleDetail() {
  const base = useBase();
  const { id } = useParams();
  const [a, setA] = useState(undefined);
  const progress = useReadProgress();
  useEffect(() => {
    window.scrollTo({ top: 0 });
    bkService.getArticle(id).then(setA).catch(() => setA(null));
  }, [id]);
  if (a === undefined) return <LoadingState rows={4} />;
  if (!a) return <EmptyState title="Artikel tidak ditemukan" />;
  return (
    <article className="article-open mx-auto max-w-4xl">
      <div className="read-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      <Link to={`${base}/artikel`} className="inline-flex items-center gap-1.5 mb-5 font-bold text-fg-3 text-sm">
        <ArrowLeft size={16} /> Semua artikel
      </Link>
      {a.cover_url && (
        <img src={a.cover_url} alt="" className="mb-8 border-2 border-line rounded-3xl w-full max-h-96 object-cover" />
      )}
      <div className="mx-auto max-w-[68ch]">
        <Badge tone="brand">{a.category}</Badge>
        <h1 className="mt-3 mb-9 font-extrabold text-fg text-[clamp(1.8rem,5vw,2.5rem)] leading-[1.15]">{a.title}</h1>
        <ArticleBlocks blocks={a.blocks} />
      </div>
      <div className="flex items-center gap-3 bg-tint mx-auto mt-12 p-4 border-2 border-tint-line rounded-2xl max-w-[68ch]">
        <BkMascot mood="happy" size={56} />
        <p className="font-bold text-brand-dim text-sm">Selesai dibaca! Kak Peci bangga sama kamu.</p>
      </div>
    </article>
  );
}
