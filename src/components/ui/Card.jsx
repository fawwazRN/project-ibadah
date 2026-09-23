export function Card({ className = "", children, ...rest }) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.06] bg-white/[0.025] shadow-card backdrop-blur-sm ${className}`}
      {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, description, actions }) {
  return (
    <div className="flex flex-wrap justify-between items-center gap-3 px-5 py-4 border-white/[0.06] border-b">
      <div>
        <h3 className="font-display font-semibold text-slate-100 text-sm">
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 text-slate-500 text-xs">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
