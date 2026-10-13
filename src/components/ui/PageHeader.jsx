export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex sm:flex-row flex-col sm:justify-between sm:items-end gap-3 mb-5">
      <div className="min-w-0">
        <h1
          className="font-display text-[22px] text-fg sm:text-[26px] leading-tight"
          style={{ fontWeight: "var(--head-weight)" }}>
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-fg-3 text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
