import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

const useBase = () => (useLocation().pathname.startsWith("/guest") ? "/guest" : "/santri");
import { ArrowLeft } from "lucide-react";
import { bkService } from "../../services/bkService";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { EmptyState, LoadingState } from "../../components/ui/States";

export function ArticleBlocks({ blocks = [] }) {
  return (
    <div className="space-y-4">
      {blocks.map((b, i) => {
        if (b.type === "h2")
          return (
            <h2 key={i} className="mt-6 font-extrabold text-fg text-xl leading-snug">
              {b.text}
            </h2>
          );
        if (b.type === "quote")
          return (
            <blockquote
              key={i}
              className="bg-tint px-4 py-3 border-brand border-l-4 rounded-r-2xl font-bold text-brand-dim leading-relaxed">
              {b.text}
            </blockquote>
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
        return (
          <p key={i} className="text-fg-2 text-[16px] leading-[1.8] whitespace-pre-wrap">
            {b.text}
          </p>
        );
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
        <div className="gap-3 grid sm:grid-cols-2">
          {items.map((a) => (
            <Link key={a.id} to={`${base}/artikel/${a.id}`}>
              <Card className="overflow-hidden h-full active:translate-y-0.5 transition-transform">
                {a.cover_url ? (
                  <img src={a.cover_url} alt="" loading="lazy" className="w-full h-36 object-cover" />
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
  useEffect(() => {
    bkService.getArticle(id).then(setA).catch(() => setA(null));
  }, [id]);
  if (a === undefined) return <LoadingState rows={4} />;
  if (!a) return <EmptyState title="Artikel tidak ditemukan" />;
  return (
    <article className="mx-auto max-w-2xl">
      <Link to={`${base}/artikel`} className="inline-flex items-center gap-1.5 mb-3 font-bold text-fg-3 text-sm">
        <ArrowLeft size={16} /> Semua artikel
      </Link>
      {a.cover_url && (
        <img src={a.cover_url} alt="" className="mb-5 border-2 border-line rounded-3xl w-full max-h-72 object-cover" />
      )}
      <Badge tone="brand">{a.category}</Badge>
      <h1 className="mt-2 mb-5 font-extrabold text-fg text-[26px] leading-tight">{a.title}</h1>
      <ArticleBlocks blocks={a.blocks} />
    </article>
  );
}
