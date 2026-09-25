// Chip statistik tanpa emoji: dot gol + mini-card kuning/merah
export function GoalChip({ n, short = false }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-emerald-400/10 px-1.5 py-0.5 border border-emerald-400/25 rounded-md font-semibold text-[11px] text-emerald-300">
      <span className="bg-emerald-400 rounded-full size-1.5" />
      {n}
      {short ? "" : " gol"}
    </span>
  );
}

export function CardChips({ yellow = 0, red = 0 }) {
  return (
    <span className="inline-flex items-center gap-2">
      {yellow > 0 && (
        <span className="inline-flex items-center gap-1 font-medium text-[11px] text-amber-300">
          <span className="bg-amber-400 rounded-[2px] w-2 h-3" /> {yellow}
        </span>
      )}
      {red > 0 && (
        <span className="inline-flex items-center gap-1 font-medium text-[11px] text-rose-300">
          <span className="bg-rose-500 rounded-[2px] w-2 h-3" /> {red}
        </span>
      )}
    </span>
  );
}

// Tombol aksi cepat (bentuk kartu, bukan emoji)
export function GoalButton({ onClick, disabled, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="place-items-center grid bg-emerald-400/10 hover:bg-emerald-400/20 disabled:opacity-40 border border-emerald-400/25 rounded-md size-7 transition-colors">
      <span className="bg-emerald-400 rounded-full size-1.5" />
    </button>
  );
}
export function YellowButton({ onClick, disabled, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="place-items-center grid bg-amber-400/10 hover:bg-amber-400/20 disabled:opacity-40 border border-amber-400/25 rounded-md size-7 transition-colors">
      <span className="bg-amber-400 rounded-[2px] w-2 h-3" />
    </button>
  );
}
export function RedButton({ onClick, disabled, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="place-items-center grid bg-rose-400/10 hover:bg-rose-400/20 disabled:opacity-40 border border-rose-400/25 rounded-md size-7 transition-colors">
      <span className="bg-rose-500 rounded-[2px] w-2 h-3" />
    </button>
  );
}
