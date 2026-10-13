import { useEffect, useState } from "react";
import { BkMascot } from "../ui/BkMascot";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { useStudentData } from "../../layouts/StudentShell";

function apologyProblems(text) {
  const problems = [];
  const normalized = text.trim();
  const words = normalized.toLowerCase().match(/[a-zA-ZÀ-ÿ]+/g) ?? [];
  const uniqueWords = new Set(words);

  if (normalized.length < 120) {
    problems.push(`Permintaan maafmu masih ${normalized.length}/120 karakter. Coba ceritakan lebih dalam.`);
  }
  if (uniqueWords.size < 10) {
    problems.push("Gunakan kata-katamu sendiri dan ceritakan dengan kalimat yang lebih beragam.");
  }
  const describesMistake =
    /\b(salah|kesalahan\w*|pelanggaran\w*|melanggar|lalai|terlambat|mengabaikan)\b/i.test(normalized) ||
    /\b(tidak|belum)\b.{0,40}\b(shalat|salat|berjamaah|ibadah|zikir|tadarus)\b/i.test(normalized);
  const acknowledgesRegret =
    /\b(maaf\w*|menyesal\w*|ampun\w*|mohon maaf)\b/i.test(normalized);

  if (!describesMistake || !acknowledgesRegret) {
    problems.push("Ceritakan kesalahan atau pelanggaran yang ingin kamu perbaiki.");
  }
  if (!/\b(tidak akan mengulang\w*|tidak mengulang\w*|berjanji|komitmen|akan memperbaiki|berusaha memperbaiki)\b/i.test(normalized)) {
    problems.push("Tulis juga komitmenmu untuk tidak mengulangi atau memperbaikinya.");
  }

  return problems;
}

export function HeartApologyGate({ children }) {
  const { me } = useStudentData();
  const [text, setText] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [checkedKey, setCheckedKey] = useState(null);
  const [completedNow, setCompletedNow] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [problems, setProblems] = useState([]);
  const [storageError, setStorageError] = useState("");

  const periodKey = me
    ? `heart-apology:${me.student_id}:${me.period_start ?? "current"}`
    : null;

  useEffect(() => {
    if (!periodKey) return;

    setAccepted(false);
    try {
      setAccepted(window.localStorage.getItem(periodKey) === "accepted");
      setStorageError("");
    } catch {
      setStorageError("Browser tidak bisa menyimpan status maaf. Aktifkan penyimpanan situs lalu coba lagi.");
    } finally {
      setCheckedKey(periodKey);
    }
  }, [periodKey]);

  if (!me || Number(me.hearts) > 0) return children;
  if (checkedKey !== periodKey) {
    return <p className="mx-auto max-w-xl py-12 text-center text-fg-3 text-sm">Memeriksa status hati…</p>;
  }
  if (accepted && !completedNow) return children;

  const submit = (event) => {
    event.preventDefault();
    const issues = apologyProblems(text);
    setProblems(issues);
    if (issues.length) {
      setFailedAttempts((attempts) => attempts + 1);
      return;
    }

    try {
      window.localStorage.setItem(periodKey, "accepted");
      setAccepted(true);
      setCompletedNow(true);
      setProblems([]);
      setStorageError("");
    } catch {
      setStorageError("Permintaan maaf belum tersimpan. Periksa pengaturan penyimpanan browser lalu coba lagi.");
    }
  };

  if (completedNow) {
    return (
      <div className="mx-auto max-w-xl">
        <Card className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-5 text-center sm:p-7">
          <BkMascot mood="happy" size={104} className="mx-auto" />
          <h1 className="mt-2 font-display text-fg text-xl" style={{ fontWeight: 800 }}>
            Aku maafin, ya!
          </h1>
          <p className="mx-auto mt-2 max-w-md text-fg-2 text-sm">
            Terima kasih sudah berani mengakui kesalahan. Yuk, jaga hati dan buktikan lewat kebiasaan baik—jangan sampai terulang lagi. Aku percaya kamu bisa!
          </p>
          <Button className="mt-5" variant="primary" onClick={() => setCompletedNow(false)}>
            Oke, aku lanjut
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <Card className="overflow-hidden border-rose-200 bg-gradient-to-br from-rose-50 via-white to-amber-50 p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <BkMascot mood={failedAttempts > 0 ? "upset" : "angry"} size={82} className="shrink-0" />
          <div>
            <p className="font-bold text-rose-700 text-xs uppercase tracking-wide">Hati periode ini habis</p>
            <h1 className="mt-1 font-display text-fg text-xl" style={{ fontWeight: 800 }}>
              {failedAttempts > 0 ? "Kak Peci masih ngambek" : "Kak Peci lagi marah"}
            </h1>
            <p className="mt-1 text-fg-2 text-sm">
              {failedAttempts > 0
                ? "Tolong minta maaf lebih dalam, ya. Ceritakan kesalahanmu dan bagaimana kamu akan memperbaikinya."
                : "Tulis permintaan maaf yang sungguh-sungguh supaya Kak Peci tahu kamu paham dan mau memperbaiki diri."}
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-5">
          <label htmlFor="heart-apology" className="block mb-2 font-bold text-fg text-sm">
            Permintaan maafmu
          </label>
          <textarea
            id="heart-apology"
            className="field min-h-36 w-full resize-y"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              if (problems.length) setProblems([]);
            }}
            placeholder="Ceritakan kesalahanmu, kenapa kamu menyesal, dan apa yang akan kamu lakukan agar tidak terulang…"
            maxLength={1000}
            required
          />
          <div className="mt-1 flex justify-between gap-3 text-xs">
            <span className="text-fg-3">120 karakter, 10 kata berbeda, kesalahan dan penyesalan, serta komitmen memperbaiki.</span>
            <span className={`shrink-0 font-semibold ${text.trim().length >= 120 ? "text-emerald-700" : "text-fg-3"}`}>
              {text.trim().length}/120
            </span>
          </div>

          {(problems.length > 0 || storageError) && (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800 text-sm" role="alert">
              {storageError ? (
                storageError
              ) : (
                <ul className="list-disc space-y-1 pl-5">
                  {problems.map((problem) => <li key={problem}>{problem}</li>)}
                </ul>
              )}
            </div>
          )}

          <Button type="submit" variant="primary" className="mt-4 w-full">
            Minta maaf ke Kak Peci
          </Button>
          <p className="mt-3 text-center text-fg-3 text-xs">
            Kak Peci tetap bisa diajak ngobrol. Klasemen dan Tim & Laga akan terbuka setelah kamu menyelesaikan permintaan maaf. Status tersimpan di perangkat ini; teksnya tidak disimpan.
          </p>
        </form>
      </Card>
    </div>
  );
}
