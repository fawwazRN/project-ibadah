import { Link, NavLink } from "react-router-dom";
import { BrandMark } from "../../components/ui/BrandMark";

// Potongan UI bersama untuk skin "play" (santri + tamu).

export function PlayBrand({ to, sub }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-6 pt-6 pb-4">
      <span
        className="place-items-center grid bg-brand rounded-2xl size-11 text-on-brand"
        style={{ boxShadow: "0 4px 0 var(--color-edge)" }}>
        <BrandMark className="size-6" />
      </span>
      <span>
        <span
          className="block font-display text-[26px] text-brand-dim leading-none"
          style={{ fontWeight: 900, letterSpacing: "-0.02em" }}>
          osis
        </span>
        {sub && (
          <span className="block mt-1 font-extrabold text-[10px] text-fg-3 uppercase tracking-[0.18em]">
            {sub}
          </span>
        )}
      </span>
    </Link>
  );
}

export function RailGroups({ groups }) {
  return (
    <nav className="flex-1 space-y-5 px-4 py-2 overflow-y-auto" aria-label="Menu">
      {groups.map((g) => (
        <div key={g.section}>
          <p className="mb-1.5 px-3 font-extrabold text-[10px] text-fg-4 uppercase tracking-[0.2em]">
            {g.section}
          </p>
          <div className="space-y-1">
            {g.items.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.end} className="rail-item">
                <it.icon size={21} strokeWidth={2.3} />
                <span className="truncate">{it.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

// tabs: [{ to, label, icon, active }]
export function PlayTabBar({ tabs }) {
  return (
    <nav
      aria-label="Navigasi utama"
      className="lg:hidden bottom-0 z-40 fixed inset-x-0 bg-card pb-[env(safe-area-inset-bottom)] border-line border-t-2 print:hidden">
      <div className="flex h-[var(--tabbar-h)]">
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            data-active={t.active}
            aria-current={t.active ? "page" : undefined}
            className="tab-item">
            <span className="tab-ico">
              <t.icon size={22} strokeWidth={t.active ? 2.6 : 2.2} />
            </span>
            <span>{t.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
