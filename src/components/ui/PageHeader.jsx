// Header halaman: kartu hero modern dengan aksen lembut dan detail dekoratif.
export function PageHeader({ title, description, actions, icon: Icon }) {
  return (
    <header className="page-hero relative mb-6 overflow-hidden rounded-3xl border py-4 pl-6 pr-5 sm:py-5 sm:pl-8 sm:pr-7" style={{ borderWidth: "var(--bw)" }}>
      <span aria-hidden="true" className="page-hero-blob" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand text-on-brand shadow-md" style={{ boxShadow: "0 3px 0 var(--color-edge)" }}>
              <Icon size={21} strokeWidth={2.5} />
            </span>
          )}

          <div className="min-w-0">
            <h1 className="font-display text-[24px] leading-tight tracking-tight text-fg sm:text-[30px] [overflow-wrap:anywhere]" style={{ fontWeight: "var(--head-weight)" }}>
              {title}
            </h1>
            {description && <p className="mt-1.5 max-w-xl text-[15px] leading-relaxed text-fg-3">{description}</p>}
          </div>
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2 max-sm:[&>*]:flex-1 max-sm:[&_.btn]:justify-center">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
