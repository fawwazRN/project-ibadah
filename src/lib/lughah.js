export const PRESENTATION_VOCAB_KEY = "lughah_presentation_vocab";

const todayKey = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};

export function pickRandomPresentationVocab(rows, current = []) {
  return ["pemula", "menengah", "sulit"].flatMap((level) => {
    const options = rows.filter((row) => row.is_active !== false && (row.level ?? "pemula") === level);
    const alternatives = options.filter((row) => !current.some((item) => item.id === row.id));
    const pool = alternatives.length ? alternatives : options;
    return pool.length ? [pool[Math.floor(Math.random() * pool.length)]] : [];
  });
}

export function savePresentationVocabOverride(rows) {
  localStorage.setItem(PRESENTATION_VOCAB_KEY, JSON.stringify({ date: todayKey(), rows }));
}

export function readPresentationVocabOverride() {
  try {
    const value = localStorage.getItem(PRESENTATION_VOCAB_KEY);
    if (!value) return null;
    const saved = JSON.parse(value);
    if (saved?.date === todayKey() && Array.isArray(saved.rows) &&
      saved.rows.every((row) => row && typeof row.arabic === "string")) return saved.rows;
    if (saved?.date && saved.date !== todayKey()) {
      localStorage.removeItem(PRESENTATION_VOCAB_KEY);
      return null;
    }
    console.warn("Pilihan mufrodat presentasi tersimpan dalam format yang tidak valid.");
  } catch (error) {
    console.error("Gagal membaca pilihan mufrodat presentasi.", error);
  }
  return null;
}
