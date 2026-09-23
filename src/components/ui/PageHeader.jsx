export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex sm:flex-row flex-col sm:justify-between sm:items-end gap-3 mb-6">
      <div>
        <h1 className="font-display font-semibold text-slate-50 text-xl sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-slate-500 text-sm">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
