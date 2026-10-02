// Ambil SEMUA baris dari Supabase.
// PostgREST membatasi satu respons (default 1000 baris), jadi .limit(500)
// atau satu kali select akan memotong data. Helper ini memanggil query
// berulang per halaman sampai habis.
//
// buildQuery: fungsi yang mengembalikan query BARU tiap dipanggil
// (builder Supabase sekali pakai), sudah berisi .order() yang stabil.
const PAGE = 1000;

export async function fetchAll(buildQuery) {
  const rows = [];
  let from = 0;
  let total = null;
  // batas pengaman supaya tidak loop tak hingga
  for (let i = 0; i < 200; i++) {
    const { data, error, count } = await buildQuery().range(
      from,
      from + PAGE - 1,
    );
    if (error) throw error;
    if (total === null && typeof count === "number") total = count;
    if (!data || data.length === 0) break;
    rows.push(...data);
    from += data.length; // maju sesuai yang benar-benar diterima
    if (total !== null && rows.length >= total) break;
    if (total === null && data.length < PAGE) break;
  }
  return rows;
}
