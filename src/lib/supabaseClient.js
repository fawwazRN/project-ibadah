import { createClient } from "@supabase/supabase-js";

const rawUrl = import.meta.env.VITE_SUPABASE_URL ?? "";

// Auto-koreksi: buang spasi, trailing slash, dan akhiran path yang sering ikut ke-copy
const SUPABASE_URL = rawUrl
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/(rest|auth)\/v1$/, "");
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();

if (SUPABASE_URL !== rawUrl.trim()) {
  console.warn(
    "VITE_SUPABASE_URL diperbaiki otomatis dari:",
    rawUrl,
    "→",
    SUPABASE_URL,
  );
}
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    ".env belum lengkap! Isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY, lalu restart dev server.",
  );
}

export const supabase = createClient(
  SUPABASE_URL || "http://placeholder.invalid",
  SUPABASE_ANON_KEY || "placeholder",
);
