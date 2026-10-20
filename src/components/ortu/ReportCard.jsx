import { BrandMark } from "../ui/BrandMark";
import { GRADES, dayLabel, rupiah } from "../../lib/rapor";

// Lembar rekapan OSIS A4 portrait (lebar rancangan 794px ≈ 210mm).
// Dipakai dua kali: pratinjau di layar (diskalakan) & versi cetak (.print-doc).
const GREEN = "#168a57";
const INK = "#1f2937";
const MUTE = "#6b7280";
const LINE = "#d9e2dc";

const AREA_STYLE = {
  ibadah: { c: "#2f80f0", t: "#e8f1fe", title: "Ibadah" },
  riyadhah: { c: "#ef4d43", t: "#fdeceb", title: "Riyadhah" },
  nadzhofah: { c: "#ff9a1f", t: "#fff2df", title: "Nadzhofah" },
  lughah: { c: "#9b6cf2", t: "#f1eafe", title: "Lughah" },
};

function GradePill({ grade, score }) {
  if (!grade) return <span style={{ color: MUTE }}>—</span>;
  return (
    <span
      style={{
        display: "inline-block",
        background: grade.tint,
        color: grade.color,
        border: `1.5px solid ${grade.color}`,
        borderRadius: 999,
        padding: "1px 9px",
        fontWeight: 800,
        fontSize: 10.5,
        whiteSpace: "nowrap",
      }}>
      {grade.ar}
      {score != null ? ` · ${grade.letter}` : ""}
    </span>
  );
}

const Sec = ({ title, children }) => (
  <section style={{ marginTop: 18, breakInside: "avoid" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ width: 5, height: 16, background: GREEN, borderRadius: 3 }} />
      <h3 style={{ fontSize: 12, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", color: INK, margin: 0 }}>
        {title}
      </h3>
      <span style={{ flex: 1, height: 1, background: LINE }} />
    </div>
    {children}
  </section>
);

const Th = ({ children, w, center }) => (
  <th
    style={{
      background: "#eef7f1",
      color: GREEN,
      fontSize: 9.5,
      fontWeight: 900,
      textTransform: "uppercase",
      letterSpacing: ".05em",
      padding: "7px 8px",
      textAlign: center ? "center" : "left",
      width: w,
      border: `1px solid ${LINE}`,
    }}>
    {children}
  </th>
);
const Td = ({ children, center, bold }) => (
  <td
    style={{
      padding: "7px 8px",
      fontSize: 11,
      verticalAlign: "top",
      textAlign: center ? "center" : "left",
      fontWeight: bold ? 800 : 500,
      border: `1px solid ${LINE}`,
      color: INK,
    }}>
    {children}
  </td>
);

export default function ReportCard({ model, printedAt }) {
  const s = model.student;
  const { ibadah, riyadhah, nadzhofah, lughah, overall, areas } = model;
  const og = overall.grade;

  const rows = [
    {
      key: "ibadah",
      indikator: "Kedisiplinan ibadah (shalat, zikir, kegiatan)",
      capaian: ibadah.count ? `${ibadah.count} pelanggaran · ${ibadah.pts} poin` : "Tidak ada pelanggaran",
    },
    {
      key: "riyadhah",
      indikator: `Olahraga & kedisiplinan lapangan${riyadhah.team ? ` (Tim ${riyadhah.team})` : ""}`,
      capaian: riyadhah.count ? `${riyadhah.count} pelanggaran · ${riyadhah.pts} poin` : "Tidak ada pelanggaran",
    },
    {
      key: "nadzhofah",
      indikator: "Kebersihan & kerapian (nyeker, pakaian)",
      capaian:
        nadzhofah.nyeker || nadzhofah.clothing
          ? `Nyeker ${nadzhofah.nyeker}× · Pakaian disita ${nadzhofah.clothing} pcs`
          : "Catatan bersih",
    },
    {
      key: "lughah",
      indikator: `Bahasa Arab — nilai & kelengkapan ujian${lughah.periodName ? ` (${lughah.periodName})` : ""}`,
      capaian: lughah.has
        ? `${lughah.score != null ? `Nilai ${lughah.score}` : "Belum dinilai"} · ${lughah.complete ? "Lengkap" : "Belum lengkap"}`
        : "Data belum tersedia",
    },
  ];

  return (
    <div
      style={{
        width: 794,
        minHeight: 1118,
        boxSizing: "border-box",
        background: "#fff",
        color: INK,
        padding: 28,
        fontFamily: "var(--font-sans, 'Nunito', system-ui, sans-serif)",
      }}>
      <div style={{ border: `3px double ${GREEN}`, borderRadius: 14, padding: "26px 30px 22px", minHeight: 1062, position: "relative" }}>
        {/* ---------- Kop ---------- */}
        <header style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 14, borderBottom: `2px solid ${GREEN}` }}>
          <div
            style={{
              width: 62, height: 62, borderRadius: 18, background: GREEN, color: "#fff",
              display: "grid", placeItems: "center", boxShadow: "0 4px 0 #0f6b44", flexShrink: 0,
            }}>
            <BrandMark className="size-10" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 10.5, fontWeight: 800, letterSpacing: ".18em", color: MUTE }}>
              OSIS MANAGEMENT · MADRASAH
            </p>
            <h1 style={{ margin: "2px 0 0", fontSize: 25, fontWeight: 900, letterSpacing: "-.01em", color: GREEN, lineHeight: 1.1 }}>
              REKAPAN OSIS SANTRI
            </h1>
            <p style={{ margin: "3px 0 0", fontSize: 11, color: MUTE, fontWeight: 600 }}>
              Ibadah · Riyadhah · Nadzhofah · Lughah
            </p>
          </div>
          <div style={{ textAlign: "right", fontSize: 10, color: MUTE, fontWeight: 700 }}>
            <p style={{ margin: 0 }}>PERIODE</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, fontWeight: 900, color: INK }}>{model.periodLabel}</p>
          </div>
        </header>

        {/* ---------- Identitas ---------- */}
        <section style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px", fontSize: 12 }}>
          {[
            ["Nama Santri", s.full_name],
            ["Kelas", s.class_name],
            ["NIS", s.nis || "—"],
            ["Tanggal Cetak", printedAt],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: 8, borderBottom: `1px dashed ${LINE}`, paddingBottom: 4 }}>
              <span style={{ width: 100, color: MUTE, fontWeight: 700 }}>{k}</span>
              <span style={{ fontWeight: 900 }}>: {v}</span>
            </div>
          ))}
        </section>

        {/* ---------- Ringkasan ---------- */}
        <Sec title="Ringkasan Capaian">
          <div style={{ display: "grid", gridTemplateColumns: "210px 1fr", gap: 14 }}>
            <div
              style={{
                borderRadius: 16, padding: "14px 12px", textAlign: "center",
                background: og ? og.tint : "#f3f4f6", border: `2px solid ${og ? og.color : LINE}`,
                boxShadow: `0 4px 0 ${og ? og.color : LINE}`,
              }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 900, letterSpacing: ".12em", color: MUTE }}>NILAI AKHIR</p>
              <p style={{ margin: "2px 0", fontSize: 54, fontWeight: 900, lineHeight: 1, color: og ? og.color : MUTE }}>
                {overall.score ?? "—"}
              </p>
              {og && (
                <>
                  <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: og.color }}>{og.ar}</p>
                  <p style={{ margin: "1px 0 0", fontSize: 10.5, fontWeight: 700, color: MUTE }}>
                    {og.id} · Predikat {og.letter}
                  </p>
                </>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {areas.map((a) => {
                const st = AREA_STYLE[a.key];
                return (
                  <div
                    key={a.key}
                    style={{
                      borderRadius: 12, padding: "9px 12px", background: st.t,
                      borderTop: `4px solid ${st.c}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6,
                    }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 10, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", color: MUTE }}>
                        {st.title}
                      </p>
                      <div style={{ marginTop: 4 }}>
                        <GradePill grade={a.grade} score={a.score} />
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 30, fontWeight: 900, color: st.c, lineHeight: 1 }}>{a.score ?? "—"}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </Sec>

        {/* ---------- Rincian ---------- */}
        <Sec title="Rincian Penilaian">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <Th w={28} center>No</Th>
                <Th w={86}>Bidang</Th>
                <Th>Indikator</Th>
                <Th w={170}>Capaian</Th>
                <Th w={42} center>Nilai</Th>
                <Th w={112}>Predikat</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const a = areas.find((x) => x.key === r.key);
                return (
                  <tr key={r.key} style={{ breakInside: "avoid" }}>
                    <Td center>{i + 1}</Td>
                    <Td bold>
                      <span style={{ color: AREA_STYLE[r.key].c }}>{AREA_STYLE[r.key].title}</span>
                    </Td>
                    <Td>{r.indikator}</Td>
                    <Td>{r.capaian}</Td>
                    <Td center bold>{a.score ?? "—"}</Td>
                    <Td><GradePill grade={a.grade} score={a.score} /></Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Sec>

        {/* ---------- Catatan rinci ---------- */}
        <Sec title="Catatan Rinci">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 10.5 }}>
            <Box title="Pelanggaran Ibadah Terbanyak" c={AREA_STYLE.ibadah.c}>
              {ibadah.top.length
                ? ibadah.top.map((t) => <Li key={t.name} l={t.name} r={`${t.total}× · ${t.poin} poin`} />)
                : <Empty text="Tidak ada catatan." />}
              {ibadah.cleanDays != null && <Foot text={`Hari bersih sejak pelanggaran terakhir: ${ibadah.cleanDays} hari`} />}
            </Box>
            <Box title="Pelanggaran Riyadhah" c={AREA_STYLE.riyadhah.c}>
              {riyadhah.top.length
                ? riyadhah.top.map((t) => <Li key={t.name} l={t.name} r={`${t.total}× · ${t.poin} poin`} />)
                : <Empty text="Tidak ada catatan." />}
              <Foot text={riyadhah.team ? `Tim: ${riyadhah.team}` : "Belum tergabung dalam tim"} />
            </Box>
            <Box title="Nadzhofah" c={AREA_STYLE.nadzhofah.c}>
              <Li l="Jumlah nyeker" r={`${nadzhofah.nyeker}×`} />
              <Li l="Denda nyeker" r={rupiah(nadzhofah.fines)} />
              <Li l="Pakaian disita" r={`${nadzhofah.clothing} pcs`} />
              {nadzhofah.nyekerList.slice(0, 3).map((n) => (
                <Foot key={n.id} text={`Nyeker ${dayLabel(n.nyeker_date)}${n.note ? ` — ${n.note}` : ""}`} />
              ))}
            </Box>
            <Box title="Kelengkapan Lughah" c={AREA_STYLE.lughah.c}>
              {lughah.has ? (
                lughah.items.map((it) => (
                  <Li key={it.key} l={it.label} r={<b style={{ color: it.ok ? "#16a34a" : "#ef4d43" }}>{it.ok ? "✓ Sudah" : "✗ Belum"}</b>} />
                ))
              ) : (
                <Empty text="Data Lughah belum tersedia." />
              )}
            </Box>
          </div>
        </Sec>

        {/* ---------- Catatan pembina ---------- */}
        <Sec title="Catatan Pembina">
          <p
            style={{
              margin: 0, padding: "10px 14px", background: "#f6fbf8", border: `1px solid ${LINE}`,
              borderLeft: `5px solid ${GREEN}`, borderRadius: 10, fontSize: 11.5, lineHeight: 1.6, fontWeight: 600,
            }}>
            {model.note}
          </p>
        </Sec>

        {/* ---------- Keterangan ---------- */}
        <Sec title="Keterangan Predikat">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {GRADES.map((g, i) => (
              <span key={g.letter} style={{ fontSize: 9.5, fontWeight: 700, color: MUTE, background: "#f7f7f7", borderRadius: 8, padding: "3px 8px" }}>
                <b style={{ color: g.color }}>{g.ar}</b> ({g.letter}) {i === 0 ? "≥ 90" : i === GRADES.length - 1 ? `< ${GRADES[i - 1].min}` : `${g.min}–${GRADES[i - 1].min - 1}`}
              </span>
            ))}
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 9, color: MUTE, lineHeight: 1.5 }}>
            Nilai bidang dimulai dari 100 dan berkurang sesuai poin pelanggaran/catatan; nilai Lughah berasal dari hasil ujian. Nilai akhir adalah rata-rata bidang yang sudah memiliki nilai.
          </p>
        </Sec>

        {/* ---------- Tanda tangan ---------- */}
        <section style={{ marginTop: 22, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, textAlign: "center", fontSize: 11, breakInside: "avoid" }}>
          {["Orang Tua / Wali", "Musyrif / Wali Kelas", "Pengasuh / Kepala Madrasah"].map((r) => (
            <div key={r}>
              <p style={{ margin: 0, fontWeight: 700, color: MUTE }}>{r}</p>
              <div style={{ height: 62 }} />
              <p style={{ margin: 0, borderTop: `1.5px solid ${INK}`, paddingTop: 3, fontWeight: 800 }}>( ................................ )</p>
            </div>
          ))}
        </section>

        <p style={{ margin: "18px 0 0", textAlign: "center", fontSize: 8.5, color: MUTE, letterSpacing: ".04em" }}>
          Dokumen ini dibuat otomatis oleh sistem OSIS Management pada {printedAt}.
        </p>
      </div>
    </div>
  );
}

function Box({ title, c, children }) {
  return (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, overflow: "hidden", breakInside: "avoid" }}>
      <p style={{ margin: 0, padding: "5px 10px", background: c, color: "#fff", fontSize: 10, fontWeight: 900, letterSpacing: ".04em" }}>{title}</p>
      <div style={{ padding: "6px 10px 7px" }}>{children}</div>
    </div>
  );
}
const Li = ({ l, r }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "2.5px 0", borderBottom: `1px dotted ${LINE}`, fontWeight: 600 }}>
    <span>{l}</span>
    <span style={{ fontWeight: 800, whiteSpace: "nowrap" }}>{r}</span>
  </div>
);
const Empty = ({ text }) => <p style={{ margin: 0, color: MUTE, fontStyle: "italic" }}>{text}</p>;
const Foot = ({ text }) => <p style={{ margin: "4px 0 0", fontSize: 9.5, color: MUTE, fontWeight: 600 }}>{text}</p>;
