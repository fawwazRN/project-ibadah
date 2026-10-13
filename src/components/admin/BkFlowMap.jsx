import { useMemo, useRef, useState } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";

// Bagan alur (kiri → kanan), murni SVG tanpa library.
const W = 230, H = 78, GX = 190, GY = 30, PAD = 28, HEAD = 34;
const BRANCH = ["#16a870", "#f59e0b", "#8b5cf6"]; // warna garis menurut urutan jawaban 1/2/3
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

function layout(nodes) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const kids = (n) => n.choices.map((c) => c.next_node_id).filter((t) => t && byId.has(t));

  // 1) DFS dari pembuka → tandai garis "kembali" (siklus) & urutan topologis
  const state = new Map(), back = new Set(), post = [];
  const dfs = (u) => {
    state.set(u, 1);
    for (const t of kids(byId.get(u))) {
      if (state.get(t) === 1) back.add(u + ">" + t);
      else if (!state.has(t)) dfs(t);
    }
    state.set(u, 2);
    post.push(u);
  };
  nodes.filter((n) => n.is_start).forEach((r) => !state.has(r.id) && dfs(r.id));

  // 2) Kolom = jalur terpanjang dari pembuka (tujuan selalu di kanan induknya)
  const level = new Map();
  const order = [...post].reverse();
  order.forEach((u) => level.has(u) || level.set(u, 0));
  order.forEach((u) => {
    for (const t of kids(byId.get(u)))
      if (!back.has(u + ">" + t)) level.set(t, Math.max(level.get(t) ?? 0, level.get(u) + 1));
  });
  const reached = nodes.filter((n) => level.has(n.id));
  const orphans = nodes.filter((n) => !level.has(n.id));
  const maxLv = reached.reduce((m, n) => Math.max(m, level.get(n.id)), -1);

  const cols = [];
  reached.forEach((n) => (cols[level.get(n.id)] ??= []).push(n));
  if (orphans.length) cols[maxLv + 1] = orphans;

  // 3) Posisi vertikal: sejajar dengan rata-rata induknya, lalu rapikan tabrakan
  const pos = new Map();
  const parentsOf = (id) => nodes.filter((p) => pos.has(p.id) && kids(p).includes(id) && !back.has(p.id + ">" + id));
  cols.forEach((col, ci) => {
    if (!col) return;
    const want = new Map(col.map((n, i) => {
      const ps = parentsOf(n.id);
      return [n.id, ps.length ? ps.reduce((a, p) => a + pos.get(p.id).y, 0) / ps.length : i * (H + GY)];
    }));
    col.sort((a, b) => want.get(a.id) - want.get(b.id));
    let prev = -Infinity;
    col.forEach((n) => {
      const y = Math.max(want.get(n.id), prev + H + GY);
      pos.set(n.id, { x: PAD + ci * (W + GX), y, col: ci });
      prev = y;
    });
  });
  const minY = Math.min(...[...pos.values()].map((p) => p.y), 0);
  pos.forEach((p) => (p.y = p.y - minY + PAD + HEAD));
  const maxY = Math.max(...[...pos.values()].map((p) => p.y), 0);

  return {
    pos, back, nCols: cols.length, hasOrphans: orphans.length > 0,
    width: PAD * 2 + cols.length * W + Math.max(0, cols.length - 1) * GX,
    height: maxY + H + PAD,
  };
}

export default function BkFlowMap({ nodes, onEdit }) {
  const [scale, setScale] = useState(1);
  const [hover, setHover] = useState(null);
  const box = useRef(null);
  const L = useMemo(() => layout(nodes), [nodes]);

  const fit = () => {
    const w = box.current?.clientWidth ?? L.width;
    setScale(Math.max(0.35, Math.min(1, (w - 8) / L.width)));
  };
  const zoom = (d) => setScale((s) => Math.min(1.6, Math.max(0.35, +(s + d).toFixed(2))));

  // Satu garis per pasangan (asal → tujuan); beberapa jawaban ke tujuan sama digabung dalam satu label.
  const edges = useMemo(() => {
    const out = [];
    nodes.forEach((n) => {
      const a = L.pos.get(n.id);
      if (!a) return;
      const groups = [];
      n.choices.forEach((c, i) => {
        const t = c.next_node_id;
        if (!t || !L.pos.has(t)) return;
        let g = groups.find((x) => x.to === t);
        if (!g) groups.push((g = { to: t, labels: [], color: BRANCH[i % 3] }));
        g.labels.push(c.label);
      });
      groups.forEach((g, gi) => {
        const b = L.pos.get(g.to);
        const sy = a.y + H / 2 + (gi - (groups.length - 1) / 2) * 14;
        const x1 = a.x + W, x2 = b.x, y2 = b.y + H / 2;
        const isBack = L.back.has(n.id + ">" + g.to);
        let d, mx, my;
        if (isBack) {
          // loop ke atas: keluar dari kanan, melengkung di atas, masuk ke kiri tujuan
          const top = Math.min(a.y, b.y) - 20;
          d = `M${x1},${sy} C${x1 + 60},${top} ${x2 - 60},${top} ${x2},${y2}`;
          mx = (x1 + x2) / 2; my = top + (sy + y2) / 2 * 0.0 + 10;
        } else {
          const dx = (x2 - x1) * 0.5;
          d = `M${x1},${sy} C${x1 + dx},${sy} ${x2 - dx},${y2} ${x2},${y2}`;
          mx = (x1 + x2) / 2; my = (sy + y2) / 2;
        }
        out.push({ key: n.id + g.to, from: n.id, to: g.to, d, mx, my, labels: g.labels, color: g.color, isBack });
      });
    });
    return out;
  }, [nodes, L]);

  const linked = (id) =>
    hover && (id === hover || edges.some((e) => (e.from === hover && e.to === id) || (e.to === hover && e.from === id)));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="flex items-center bg-soft p-1 rounded-xl">
          <button onClick={() => zoom(-0.1)} aria-label="Perkecil" className="place-items-center grid rounded-lg size-8 hover:bg-soft-2"><Minus size={15} /></button>
          <span className="w-12 font-bold text-fg-2 text-xs text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => zoom(0.1)} aria-label="Perbesar" className="place-items-center grid rounded-lg size-8 hover:bg-soft-2"><Plus size={15} /></button>
          <button onClick={fit} aria-label="Pas layar" className="place-items-center grid rounded-lg size-8 hover:bg-soft-2"><Maximize2 size={14} /></button>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-semibold text-fg-3 text-xs">
          <Legend c="var(--color-brand)" t="Pembuka" />
          <Legend c="#38bdf8" t="Akhir obrolan" />
          <Legend c="#f59e0b" t="Belum terhubung" dashed />
          <span className="inline-flex items-center gap-1.5">
            {BRANCH.map((c) => <i key={c} className="rounded-full w-3 h-1.5" style={{ background: c }} />)} Jawaban 1 · 2 · 3
          </span>
        </div>
        <span className="ml-auto text-fg-4 text-xs">Klik kotak untuk mengubah · arahkan kursor untuk menyorot jalur</span>
      </div>

      <div ref={box} className="bg-soft border-2 border-line rounded-2xl max-h-[72vh] overflow-auto">
        <svg width={L.width * scale} height={L.height * scale} viewBox={`0 0 ${L.width} ${L.height}`} role="img" aria-label="Bagan alur percakapan">
          <defs>
            {BRANCH.map((c, i) => (
              <marker key={c} id={`bk-arr-${i}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6.5" markerHeight="6.5" orient="auto">
                <path d="M0,0 L8,4 L0,8z" fill={c} />
              </marker>
            ))}
            <filter id="bk-sh" x="-10%" y="-10%" width="120%" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0f172a" floodOpacity=".10" />
            </filter>
          </defs>

          {Array.from({ length: L.nCols }, (_, i) => {
            const orphanCol = L.hasOrphans && i === L.nCols - 1;
            return (
              <text key={i} x={PAD + i * (W + GX)} y={PAD + 6} fontSize="12" fontWeight="800" letterSpacing=".06em" fill={orphanCol ? "#b45309" : "var(--color-fg-3)"}>
                {orphanCol ? "BELUM TERHUBUNG" : i === 0 ? "PEMBUKA" : `LANGKAH ${i + 1}`}
              </text>
            );
          })}

          {/* garis (lapis bawah) */}
          {edges.map((e) => {
            const on = hover && (e.from === hover || e.to === hover);
            const bi = Math.max(0, BRANCH.indexOf(e.color));
            return (
              <path key={e.key} d={e.d} fill="none" stroke={e.color} strokeWidth={on ? 3 : 2.2} strokeLinecap="round"
                strokeDasharray={e.isBack ? "6 5" : undefined} markerEnd={`url(#bk-arr-${bi})`}
                opacity={hover && !on ? 0.12 : 0.9} />
            );
          })}

          {/* kotak percakapan */}
          {nodes.map((n) => {
            const p = L.pos.get(n.id);
            if (!p) return null;
            const orphan = L.hasOrphans && p.col === L.nCols - 1;
            const end = n.choices.length === 0;
            const accent = n.is_start ? "var(--color-brand)" : orphan ? "#f59e0b" : end ? "#38bdf8" : "var(--color-line-2)";
            return (
              <g key={n.id} transform={`translate(${p.x},${p.y})`} style={{ cursor: "pointer" }}
                opacity={hover && !linked(n.id) ? 0.28 : n.is_active ? 1 : 0.55}
                onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)}
                onClick={() => onEdit(n)} tabIndex={0} role="button" aria-label={`Ubah ${n.title}`}
                onKeyDown={(e) => e.key === "Enter" && onEdit(n)}>
                <title>{n.title}{"\n"}{n.message}</title>
                <rect width={W} height={H} rx="16" fill="var(--color-card)" filter="url(#bk-sh)"
                  stroke={accent} strokeWidth={n.is_start || end || orphan ? 2.5 : 1.5} strokeDasharray={orphan ? "6 4" : undefined} />
                <rect x="0" y="14" width="5" height={H - 28} rx="2.5" fill={accent} />
                <text x="20" y="28" fontSize="14.5" fontWeight="800" fill="var(--color-fg)">{clip(n.title, 24)}</text>
                <text x="20" y="48" fontSize="11.5" fill="var(--color-fg-3)">{clip(n.message.replace(/\s+/g, " "), 34)}</text>
                <text x="20" y="66" fontSize="11" fontWeight="700" fill="var(--color-fg-4)">
                  {end ? "Akhir obrolan" : `${n.choices.length} pilihan`}{n.article_id ? " · ada artikel" : ""}{!n.is_active ? " · nonaktif" : ""}
                </text>
              </g>
            );
          })}

          {/* label jawaban (lapis atas, di tengah garis → tidak menimpa kotak) */}
          {edges.map((e) => {
            const on = hover && (e.from === hover || e.to === hover);
            const lines = e.labels.slice(0, 3).map((t) => clip(t, 22));
            const w = Math.max(...lines.map((t) => t.length)) * 6.4 + 16;
            const h = lines.length * 15 + 8;
            return (
              <g key={"l" + e.key} opacity={hover && !on ? 0.1 : 1} pointerEvents="none">
                <rect x={e.mx - w / 2} y={e.my - h / 2} width={w} height={h} rx="9" fill="var(--color-card)" stroke={e.color} strokeWidth="1.5" />
                {lines.map((t, i) => (
                  <text key={i} x={e.mx} y={e.my - h / 2 + 18 + i * 15 - 4} fontSize="10.5" fontWeight="700" textAnchor="middle" fill="var(--color-fg-2)">{t}</text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function Legend({ c, t, dashed }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <i className="rounded-sm size-3" style={{ border: `2px ${dashed ? "dashed" : "solid"} ${c}` }} />
      {t}
    </span>
  );
}
