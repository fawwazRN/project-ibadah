// Lambang: lengkung mihrab dengan titik — sederhana & institusional
export function BrandMark({ className = "size-8" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true">
      <path
        d="M12 2.5c-4.2 3.1-6.3 6.4-6.3 9.8v9.2h12.6V12.3c0-3.4-2.1-6.7-6.3-9.8Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="12" cy="13.6" r="2.5" fill="currentColor" />
    </svg>
  );
}
