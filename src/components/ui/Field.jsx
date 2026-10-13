import { ChevronDown } from "lucide-react";

export function Field({ label, error, hint, required, children }) {
  return (
    <label className="block">
      {label && (
        <span className="flex items-center gap-1 mb-1.5 font-bold text-fg-2 text-xs">
          {label}
          {required && <span className="text-rose-600">*</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="block mt-1 font-semibold text-rose-600 text-xs">
          {error}
        </span>
      ) : hint ? (
        <span className="block mt-1 text-fg-3 text-xs">{hint}</span>
      ) : null}
    </label>
  );
}

export const Input = ({ className = "", ...p }) => (
  <input {...p} className={`field ${className}`} />
);
export const Textarea = ({ rows = 3, className = "", ...p }) => (
  <textarea rows={rows} {...p} className={`field resize-none ${className}`} />
);

export function Select({ options = [], placeholder, className = "", ...rest }) {
  return (
    <div className="relative">
      <select {...rest} className={`field appearance-none pr-9 ${className}`}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        strokeWidth={2.4}
        className="top-1/2 right-3 absolute text-fg-3 -translate-y-1/2 pointer-events-none"
      />
    </div>
  );
}
