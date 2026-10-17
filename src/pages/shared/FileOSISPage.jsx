import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Check, Clapperboard, ExternalLink, FileVideo2, FolderOpen,
  Headphones, LoaderCircle, LockKeyhole, Maximize, Play, Plus, RefreshCw,
  Trash2, Video, X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";

function parseDriveId(value) {
  try {
    const url = new URL(value);
    if (url.hostname !== "drive.google.com") return null;
    const pathMatch = url.pathname.match(/\/file\/d\/([\w-]+)/);
    const id = pathMatch?.[1] || url.searchParams.get("id");
    return id && /^[\w-]+$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

function humanDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-bold text-fg-2">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "w-full rounded-xl border border-line bg-card px-3 py-2.5 text-sm text-fg outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10";
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-on-brand transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50";

export default function FileOSISPage({ mode = "student" }) {
  const isAdmin = mode === "admin";
  const { profile } = useAuth();
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeFolder, setActiveFolder] = useState("all");
  const [selectedFile, setSelectedFile] = useState(null);
  const [cinemaReady, setCinemaReady] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderDescription, setFolderDescription] = useState("");
  const [newFolderPublished, setNewFolderPublished] = useState(true);
  const [fileTitle, setFileTitle] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [targetFolder, setTargetFolder] = useState("");
  const [playerStyle, setPlayerStyle] = useState("cinema");
  const [filePublished, setFilePublished] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [folderResult, fileResult] = await Promise.all([
      supabase.from("file_osis_folders").select("*").order("created_at", { ascending: false }),
      supabase.from("file_osis_files").select("*").order("created_at", { ascending: false }),
    ]);
    if (folderResult.error || fileResult.error) {
      setError(folderResult.error?.message || fileResult.error?.message || "Gagal memuat File OSIS.");
    } else {
      setFolders(folderResult.data || []);
      setFiles(fileResult.data || []);
      setTargetFolder((current) => current || folderResult.data?.[0]?.id || "");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const visibleFolders = useMemo(
    () => isAdmin ? folders : folders.filter((folder) => folder.published),
    [folders, isAdmin],
  );
  const visibleFiles = useMemo(() => {
    const allowedFolderIds = new Set(visibleFolders.map((folder) => folder.id));
    return files.filter((file) => {
      const allowed = isAdmin || (file.published && allowedFolderIds.has(file.folder_id));
      return allowed && (activeFolder === "all" || file.folder_id === activeFolder);
    });
  }, [files, visibleFolders, isAdmin, activeFolder]);

  const folderCounts = useMemo(() => {
    const counts = {};
    for (const file of files) counts[file.folder_id] = (counts[file.folder_id] || 0) + 1;
    return counts;
  }, [files]);

  const addFolder = async (event) => {
    event.preventDefault();
    if (!folderName.trim()) return;
    setBusy(true); setError(""); setNotice("");
    const { error: insertError } = await supabase.from("file_osis_folders").insert({
      name: folderName.trim(),
      description: folderDescription.trim(),
      published: newFolderPublished,
    });
    if (insertError) setError(insertError.message);
    else {
      setFolderName(""); setFolderDescription("");
      setNotice("Folder berhasil dibuat.");
      await load();
    }
    setBusy(false);
  };

  const addDriveVideo = async (event) => {
    event.preventDefault();
    const id = parseDriveId(driveUrl.trim());
    if (!id) {
      setError("Link tidak valid. Gunakan tautan file dari drive.google.com, misalnya drive.google.com/file/d/ID/view.");
      return;
    }
    if (!targetFolder) {
      setError("Buat atau pilih folder terlebih dahulu.");
      return;
    }
    if (!fileTitle.trim()) {
      setError("Isi judul video terlebih dahulu.");
      return;
    }
    setBusy(true); setError(""); setNotice("");
    const { error: insertError } = await supabase.from("file_osis_files").insert({
      folder_id: targetFolder,
      title: fileTitle.trim(),
      file_name: fileTitle.trim(),
      storage_path: null,
      mime_type: "video/google-drive",
      size_bytes: 0,
      player_style: playerStyle,
      published: filePublished,
      source_type: "google_drive",
      external_url: driveUrl.trim(),
      drive_file_id: id,
    });
    if (insertError) setError(insertError.message);
    else {
      setFileTitle(""); setDriveUrl("");
      setNotice("Video Google Drive berhasil ditambahkan.");
      await load();
    }
    setBusy(false);
  };

  const togglePublished = async (kind, item) => {
    setBusy(true); setError(""); setNotice("");
    const table = kind === "folder" ? "file_osis_folders" : "file_osis_files";
    const { error: updateError } = await supabase.from(table).update({ published: !item.published }).eq("id", item.id);
    if (updateError) setError(updateError.message);
    else { setNotice(item.published ? "Publikasi dinonaktifkan." : "Konten berhasil dipublikasikan."); await load(); }
    setBusy(false);
  };

  const deleteFile = async (file) => {
    if (!window.confirm(`Hapus tautan “${file.title}” dari File OSIS?`)) return;
    setBusy(true); setError(""); setNotice("");
    const { error: deleteError } = await supabase.from("file_osis_files").delete().eq("id", file.id);
    if (deleteError) setError(deleteError.message);
    else { setNotice("Tautan video dihapus."); if (selectedFile?.id === file.id) setSelectedFile(null); await load(); }
    setBusy(false);
  };

  const startWatching = async () => {
    const frame = document.getElementById("file-osis-drive-player");
    setCinemaReady(true);
    if (selectedFile?.player_style === "cinema" && frame?.requestFullscreen) {
      try {
        await frame.requestFullscreen();
      } catch {
        try { await document.documentElement.requestFullscreen(); } catch { /* fullscreen can be blocked by browser */ }
      }
    } else if (selectedFile?.player_style === "cinema" && document.documentElement.requestFullscreen) {
      try { await document.documentElement.requestFullscreen(); } catch { /* fullscreen can be blocked by browser */ }
    }
  };

  const embedUrl = selectedFile?.drive_file_id
    ? `https://drive.google.com/file/d/${selectedFile.drive_file_id}/preview?autoplay=1`
    : null;
  const selectedFolder = folders.find((folder) => folder.id === activeFolder);

  return (
    <div className={isAdmin ? "mx-auto max-w-6xl space-y-5" : "mx-auto max-w-5xl space-y-5"}>
      <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-[#101522] via-[#151b2b] to-[#263029] p-5 text-white sm:p-7">
        <div className="pointer-events-none absolute -right-8 -top-12 size-48 rounded-full bg-amber-300/10 blur-2xl" />
        <div className="relative flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-amber-200/20 bg-amber-200/10 text-amber-200">
            <Clapperboard size={25} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.3em] text-amber-200">ARSIP DIGITAL OSIS</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{isAdmin ? "Kelola File OSIS" : "File OSIS"}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
              {isAdmin
                ? "Tambahkan video dari Google Drive tanpa mengunggah ulang file ke Supabase. Pilih folder dan gaya pemutar."
                : "Dokumentasi kegiatan, video, dan kenangan OSIS dalam satu ruang."}
            </p>
          </div>
          <button onClick={load} title="Muat ulang" className="relative grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10">
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
        {!isAdmin && (
          <div className="relative mt-5 flex items-center gap-2 text-xs text-white/65">
            <Headphones size={16} className="text-amber-200" />
            <span>Gunakan headset untuk pengalaman menonton yang lebih fokus.</span>
          </div>
        )}
      </section>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><Check size={16} />{notice}</div>}

      {isAdmin && (
        <section className="grid gap-4 lg:grid-cols-2">
          <form onSubmit={addFolder} className="space-y-4 rounded-2xl border border-line bg-card p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-brand/10 text-brand-dim"><FolderOpen size={19} /></span>
              <div><h2 className="font-extrabold text-fg">Buat folder</h2><p className="text-xs text-fg-3">Contoh: Munfest 1, Dokumentasi 2026</p></div>
            </div>
            <Field label="Nama folder">
              <input className={inputClass} value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="Nama folder" maxLength={100} required />
            </Field>
            <Field label="Deskripsi (opsional)">
              <input className={inputClass} value={folderDescription} onChange={(e) => setFolderDescription(e.target.value)} placeholder="Isi singkat folder" maxLength={240} />
            </Field>
            <label className="flex items-center gap-2 text-sm text-fg-2"><input type="checkbox" checked={newFolderPublished} onChange={(e) => setNewFolderPublished(e.target.checked)} /> Langsung tampil untuk santri</label>
            <button className={buttonClass} disabled={busy}><Plus size={16} /> Buat folder</button>
          </form>

          <form onSubmit={addDriveVideo} className="space-y-4 rounded-2xl border border-line bg-card p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-800"><Video size={19} /></span>
              <div><h2 className="font-extrabold text-fg">Hubungkan video Drive</h2><p className="text-xs text-fg-3">File tetap berada di Google Drive.</p></div>
            </div>
            <Field label="Judul video">
              <input className={inputClass} value={fileTitle} onChange={(e) => setFileTitle(e.target.value)} placeholder="Dokumentasi Munfest 1" maxLength={160} required />
            </Field>
            <Field label="Link berbagi Google Drive">
              <input className={inputClass} type="url" value={driveUrl} onChange={(e) => setDriveUrl(e.target.value)} placeholder="https://drive.google.com/file/d/..." required />
            </Field>
            <Field label="Simpan ke folder">
              <select className={inputClass} value={targetFolder} onChange={(e) => setTargetFolder(e.target.value)} required>
                <option value="">Pilih folder</option>
                {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
              </select>
            </Field>
            <Field label="Gaya pemutar">
              <select className={inputClass} value={playerStyle} onChange={(e) => setPlayerStyle(e.target.value)}>
                <option value="cinema">Bioskop (layar lebar)</option>
                <option value="normal">Pemutar biasa</option>
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm text-fg-2"><input type="checkbox" checked={filePublished} onChange={(e) => setFilePublished(e.target.checked)} /> Langsung tampil untuk santri</label>
            <button className={buttonClass} disabled={busy || !folders.length}><Plus size={16} /> Hubungkan video</button>
            {!folders.length && <p className="text-xs text-amber-700">Buat folder terlebih dahulu agar video bisa disimpan.</p>}
            <p className="text-xs leading-relaxed text-fg-3">Pastikan akses Drive diatur sesuai kebutuhan. Jika santri tidak memiliki izin melihat file, pemutar akan meminta akses Google.</p>
          </form>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-fg">{isAdmin ? "Folder & video" : "Jelajahi arsip"}</h2>
            <p className="text-sm text-fg-3">{visibleFolders.length} folder · {visibleFiles.length} video yang {isAdmin ? "terdaftar" : "tersedia"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveFolder("all")} className={`rounded-xl px-3 py-2 text-xs font-bold transition ${activeFolder === "all" ? "bg-brand text-on-brand" : "border border-line bg-card text-fg-2"}`}>Semua folder</button>
            {visibleFolders.map((folder) => (
              <button key={folder.id} onClick={() => setActiveFolder(folder.id)} className={`rounded-xl px-3 py-2 text-xs font-bold transition ${activeFolder === folder.id ? "bg-brand text-on-brand" : "border border-line bg-card text-fg-2"}`}>{folder.name}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid min-h-32 place-items-center rounded-2xl border border-line bg-card text-fg-3"><LoaderCircle size={24} className="animate-spin" /></div>
        ) : (
          <>
            {activeFolder === "all" && visibleFolders.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {visibleFolders.map((folder) => (
                  <button key={folder.id} onClick={() => setActiveFolder(folder.id)} className="group relative overflow-hidden rounded-2xl border border-line bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-lg">
                    <div className="absolute -right-5 -top-5 size-24 rounded-full bg-amber-300/10 transition group-hover:scale-150" />
                    <div className="relative flex items-start gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800"><FolderOpen size={22} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-extrabold text-fg">{folder.name}</span>
                        <span className="mt-1 block line-clamp-2 text-xs text-fg-3">{folder.description || "Arsip kegiatan OSIS"}</span>
                        <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-brand-dim"><FileVideo2 size={14} />{folderCounts[folder.id] || 0} video</span>
                      </span>
                    </div>
                    {isAdmin && <span className={`mt-3 inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${folder.published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{folder.published ? "Tayang" : "Draft"}</span>}
                    {isAdmin && <span className="mt-2 block"><span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); togglePublished("folder", folder); }} className="text-xs font-bold text-brand-dim underline">{folder.published ? "Sembunyikan folder" : "Publikasikan folder"}</span></span>}
                  </button>
                ))}
              </div>
            )}

            {activeFolder !== "all" && (
              <button onClick={() => setActiveFolder("all")} className="inline-flex items-center gap-1 text-sm font-bold text-brand-dim"><ArrowLeft size={15} /> Kembali ke semua folder</button>
            )}

            {visibleFiles.length ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {visibleFiles.map((file) => {
                  const folder = folders.find((item) => item.id === file.folder_id);
                  return (
                    <article key={file.id} className="overflow-hidden rounded-2xl border border-line bg-card transition hover:shadow-lg">
                      <button onClick={() => { setSelectedFile(file); setCinemaReady(false); }} className="group block w-full text-left">
                        <div className="relative grid aspect-video place-items-center overflow-hidden bg-[#0c1019] text-amber-200">
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-200/10 via-transparent to-emerald-200/10 transition group-hover:scale-110" />
                          <span className="relative grid size-14 place-items-center rounded-full border border-white/15 bg-white/10 backdrop-blur transition group-hover:scale-110"><Play size={24} fill="currentColor" /></span>
                          <span className="absolute bottom-3 left-3 rounded-md bg-black/55 px-2 py-1 text-[10px] font-black uppercase tracking-wider">{file.player_style === "cinema" ? "Cinema" : "Normal"}</span>
                          <span className="absolute bottom-3 right-3 rounded-md bg-black/55 px-2 py-1 text-[10px] text-white/80">{folder?.name || "File OSIS"}</span>
                        </div>
                        <div className="p-4">
                          <h3 className="line-clamp-2 font-extrabold text-fg">{file.title}</h3>
                          <p className="mt-1 text-xs text-fg-3">Ditambahkan {humanDate(file.created_at)}</p>
                        </div>
                      </button>
                      {isAdmin && (
                        <div className="flex items-center justify-between border-t border-line px-4 py-3">
                          <button onClick={() => togglePublished("file", file)} disabled={busy} className="text-xs font-bold text-brand-dim">{file.published ? "Tayang · sembunyikan" : "Draft · publikasikan"}</button>
                          <button onClick={() => deleteFile(file)} disabled={busy} title="Hapus tautan" className="grid size-8 place-items-center rounded-lg text-rose-600 hover:bg-rose-50"><Trash2 size={15} /></button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-line bg-card px-5 py-12 text-center">
                <FolderOpen size={30} className="mx-auto text-fg-3" />
                <p className="mt-3 font-bold text-fg">{visibleFolders.length ? "Belum ada video di folder ini" : "Belum ada folder yang tersedia"}</p>
                <p className="mt-1 text-sm text-fg-3">{isAdmin ? "Buat folder, lalu tambahkan tautan Google Drive." : "Video yang dipublikasikan akan muncul di sini."}</p>
              </div>
            )}
          </>
        )}
      </section>

      {selectedFile && (
        <div className="fixed inset-0 z-[100] h-dvh w-screen overflow-hidden bg-black text-white">
          {embedUrl && (
            <iframe
              id="file-osis-drive-player"
              src={embedUrl}
              title={selectedFile.title}
              className={`absolute inset-0 h-dvh w-screen border-0 bg-black ${cinemaReady ? "opacity-100" : "pointer-events-none opacity-0"}`}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          )}
          {!cinemaReady ? (
            <div className="relative z-10 flex h-dvh w-full flex-col bg-[#070910]">
              <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-7">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-200/10 text-amber-200"><Clapperboard size={20} /></span>
                  <div className="min-w-0"><p className="text-[9px] font-black tracking-[0.3em] text-amber-200">FILE OSIS CINEMA</p><h2 className="truncate font-extrabold">{selectedFile.title}</h2></div>
                </div>
                <button onClick={() => { setSelectedFile(null); setCinemaReady(false); }} aria-label="Tutup pemutar" className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 text-white/80 hover:bg-white/10"><X size={20} /></button>
              </header>
              <div className="grid flex-1 place-items-center px-5 py-12">
                <div className="max-w-xl text-center">
                  <div className="mx-auto grid size-20 place-items-center rounded-full border border-amber-200/20 bg-amber-200/10 text-amber-200"><Headphones size={34} /></div>
                  <p className="mt-6 text-[10px] font-black tracking-[0.35em] text-amber-200">FILE OSIS CINEMA</p>
                  <h3 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Layar siap dibuka.</h3>
                  <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/60">Mulai menonton untuk meminta layar video Google Drive masuk ke fullscreen, bukan hanya halaman web.</p>
                  <button onClick={startWatching} className="mt-7 inline-flex items-center gap-2 rounded-full bg-amber-200 px-6 py-3 font-black text-[#17120a] transition hover:bg-amber-100"><Play size={17} fill="currentColor" /> Mulai menonton <Maximize size={16} /></button>
                  <button onClick={() => { setSelectedFile(null); setCinemaReady(false); }} className="mx-auto mt-4 flex items-center gap-1 text-sm text-white/55 hover:text-white"><ArrowLeft size={14} /> Kembali ke arsip</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="pointer-events-none absolute inset-0 z-10">
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/65 to-transparent" />
              <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-3 sm:left-6 sm:right-6 sm:top-5">
                <div className="rounded-lg bg-black/45 px-3 py-2 backdrop-blur-sm">
                  <p className="text-[9px] font-black tracking-[0.3em] text-amber-200">FILE OSIS CINEMA</p>
                  <h2 className="max-w-[65vw] truncate text-sm font-semibold text-white sm:text-base">{selectedFile.title}</h2>
                </div>
                <button onClick={async () => { setSelectedFile(null); setCinemaReady(false); if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch {} } }} aria-label="Keluar dari layar penuh" className="pointer-events-auto inline-flex shrink-0 items-center gap-2 rounded-full border border-white/20 bg-black/60 px-3 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-white/15 sm:px-4 sm:text-sm">
                  <X size={16} /> <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
