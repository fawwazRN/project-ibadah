export function Card({ className = "", children, ...rest }) {
  return (
    <div className={`card ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, description, actions }) {
  return (
    <div className="card-head">
      <div className="min-w-0">
        <h3
          className="font-display text-[15px] text-fg"
          style={{ fontWeight: "var(--head-weight)" }}>
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 text-fg-3 text-xs">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
