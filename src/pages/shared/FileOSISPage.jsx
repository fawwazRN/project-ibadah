import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeft, Check, Clapperboard, FileVideo2, FolderOpen,
  Headphones, LoaderCircle, Play, Plus, RefreshCw,
  Trash2, Video,
} from "lucide-react";
import { useConfirm } from "../../context/ConfirmContext";
import { supabase } from "../../lib/supabaseClient";
import OsisFolder, { toneFor } from "../../components/osis/OsisFolder";
import VideoThumb from "../../components/osis/VideoThumb";
import CinemaPlayer from "../../components/osis/CinemaPlayer";

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

// mode: "student" | "guest" (tanpa login, hanya menonton) | "admin" (kelola)
export default function FileOSISPage({ mode = "student" }) {
  const isAdmin = mode === "admin";
  const confirm = useConfirm();
  const [params, setParams] = useSearchParams();
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  // folder yang dibuka disimpan di URL (?folder=…) → tombol Back browser kembali ke daftar folder
  const activeFolder = params.get("folder") || "all";
  const setActiveFolder = (id) => setParams(id === "all" ? {} : { folder: id });
  const [selectedFile, setSelectedFile] = useState(null);
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
  // video yang boleh dilihat (santri hanya yang tayang di folder yang tayang), terbaru di atas
  const accessibleFiles = useMemo(() => {
    const allowedFolderIds = new Set(visibleFolders.map((folder) => folder.id));
    return files.filter((file) => isAdmin || (file.published && allowedFolderIds.has(file.folder_id)));
  }, [files, visibleFolders, isAdmin]);

  const filesByFolder = useMemo(() => {
    const map = {};
    for (const file of accessibleFiles) (map[file.folder_id] ||= []).push(file);
    return map;
  }, [accessibleFiles]);

  const selectedFolder = visibleFolders.find((folder) => folder.id === activeFolder) || null;
  const visibleFiles = selectedFolder ? (filesByFolder[selectedFolder.id] || []) : accessibleFiles;

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
    const ok = await confirm({
      title: "Hapus tautan video?",
      message: `“${file.title}” akan dihapus dari File OSIS. File aslinya di Google Drive tidak ikut terhapus.`,
      tone: "danger",
      confirmText: "Ya, hapus",
    });
    if (!ok) return;
    setBusy(true); setError(""); setNotice("");
    const { error: deleteError } = await supabase.from("file_osis_files").delete().eq("id", file.id);
    if (deleteError) setError(deleteError.message);
    else { setNotice("Tautan video dihapus."); if (selectedFile?.id === file.id) setSelectedFile(null); await load(); }
    setBusy(false);
  };

  const deleteFolder = async (folder) => {
    const count = files.filter((file) => file.folder_id === folder.id).length;
    const ok = await confirm({
      title: "Hapus folder?",
      message: count
        ? `Folder “${folder.name}” beserta ${count} tautan video di dalamnya akan dihapus. File aslinya di Google Drive tidak ikut terhapus.`
        : `Folder “${folder.name}” akan dihapus.`,
      tone: "danger",
      confirmText: "Ya, hapus folder",
    });
    if (!ok) return;
    setBusy(true); setError(""); setNotice("");
    // hapus isi dulu agar tidak terhalang relasi folder → video
    const { error: filesError } = await supabase.from("file_osis_files").delete().eq("folder_id", folder.id);
    const { error: folderError } = filesError ? { error: filesError } : await supabase.from("file_osis_folders").delete().eq("id", folder.id);
    if (folderError) setError(folderError.message);
    else {
      setNotice("Folder dihapus.");
      if (activeFolder === folder.id) setActiveFolder("all");
      setTargetFolder((current) => (current === folder.id ? "" : current));
      await load();
    }
    setBusy(false);
  };

  return (
    <div className={isAdmin ? "mx-auto max-w-6xl space-y-5" : "mx-auto max-w-5xl space-y-5"}>
      <section className="fo-hero p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-14 size-48 rounded-full bg-white/10" />
        <div className="relative flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-[#58a700] border-b-4 border-black/10">
            <Clapperboard size={25} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black tracking-[0.3em] text-white/80">ARSIP DIGITAL OSIS</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{isAdmin ? "Kelola File OSIS" : "File OSIS"}</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-white/90">
              {isAdmin
                ? "Tambahkan video dari Google Drive tanpa mengunggah ulang file ke Supabase. Pilih folder dan gaya pemutar."
                : "Dokumentasi kegiatan, video, dan kenangan OSIS dalam satu ruang."}
            </p>
          </div>
          <button onClick={load} title="Muat ulang" className="fo-hero-btn relative grid size-10 shrink-0 place-items-center text-white transition hover:bg-white/30">
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
        {!isAdmin && (
          <div className="relative mt-5 flex items-center gap-2 text-xs font-semibold text-white/90">
            <Headphones size={16} className="text-white" />
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

      <section className="space-y-5">
        {loading ? (
          <div className="grid min-h-48 place-items-center rounded-2xl border border-line bg-card text-fg-3"><LoaderCircle size={26} className="animate-spin" /></div>
        ) : selectedFolder ? (
          /* ------------------------- ISI SATU FOLDER ------------------------- */
          <div key={selectedFolder.id} className="animate-fade-up space-y-5">
            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <button onClick={() => setActiveFolder("all")} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 font-bold text-fg-2 transition hover:border-brand/50 hover:text-brand-dim">
                <ArrowLeft size={14} /> Semua folder
              </button>
              <span className="text-fg-4">/</span>
              <span className="font-extrabold text-fg">{selectedFolder.name}</span>
            </nav>

            <div className="osf-tone-head flex items-center gap-4 rounded-2xl border border-line bg-card p-4 sm:p-5" data-tone={toneFor(selectedFolder.id)}>
              <span className="osf-tone-chip grid size-14 shrink-0 place-items-center rounded-2xl text-white"><FolderOpen size={28} /></span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-black text-fg sm:text-2xl">{selectedFolder.name}</h2>
                <p className="mt-0.5 line-clamp-2 text-sm text-fg-3">{selectedFolder.description || "Arsip kegiatan OSIS"}</p>
              </div>
              <span className="hidden items-center gap-1.5 rounded-full bg-soft px-3 py-1.5 text-xs font-bold text-fg-2 sm:inline-flex"><FileVideo2 size={14} />{visibleFiles.length} video</span>
              {isAdmin && (
                <button onClick={() => deleteFolder(selectedFolder)} disabled={busy} aria-label="Hapus folder" title="Hapus folder" className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"><Trash2 size={14} /> <span className="hidden sm:inline">Hapus folder</span></button>
              )}
            </div>

            {visibleFiles.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {visibleFiles.map((file, i) => (
                  <article key={file.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}>
                    <button type="button" onClick={() => setSelectedFile(file)} className="osv group">
                      <div className="osv-thumb">
                        <VideoThumb file={file} width={640} />
                        <div className="osv-shade" />
                        <span className="osv-play"><Play size={22} fill="currentColor" /></span>
                        <span className="absolute left-3 top-3 rounded-md bg-black/55 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur">{file.player_style === "cinema" ? "Bioskop" : "Biasa"}</span>
                      </div>
                      <div className="p-4">
                        <h3 className="line-clamp-2 font-extrabold text-fg">{file.title}</h3>
                        <p className="mt-1 text-xs text-fg-3">Ditambahkan {humanDate(file.created_at)}</p>
                      </div>
                    </button>
                    {isAdmin && (
                      <div className="-mt-px flex items-center justify-between rounded-b-xl border border-t-0 border-line bg-card px-4 py-2.5">
                        <button onClick={() => togglePublished("file", file)} disabled={busy} className="text-xs font-bold text-brand-dim">{file.published ? "Tayang · sembunyikan" : "Draft · publikasikan"}</button>
                        <button onClick={() => deleteFile(file)} disabled={busy} title="Hapus video" className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"><Trash2 size={14} /> Hapus</button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-line bg-card px-5 py-14 text-center">
                <FolderOpen size={32} className="mx-auto text-fg-3" />
                <p className="mt-3 font-bold text-fg">Belum ada video di folder ini</p>
                <p className="mt-1 text-sm text-fg-3">{isAdmin ? "Tambahkan tautan Google Drive lewat form di atas." : "Video yang dipublikasikan akan muncul di sini."}</p>
              </div>
            )}
          </div>
        ) : (
          /* --------------------------- DAFTAR FOLDER ------------------------- */
          <>
            <div>
              <h2 className="text-lg font-black text-fg">{isAdmin ? "Folder & video" : "Jelajahi arsip"}</h2>
              <p className="text-sm text-fg-3">
                {visibleFolders.length} folder · {accessibleFiles.length} video {isAdmin ? "terdaftar" : "tersedia"}
                {visibleFolders.length > 0 && <span className="ml-1 hidden text-fg-4 [@media(hover:hover)]:inline">— arahkan kursor ke folder untuk mengintip isinya</span>}
              </p>
            </div>

            {visibleFolders.length ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3">
                {visibleFolders.map((folder) => {
                  const inFolder = filesByFolder[folder.id] || [];
                  return (
                    <div key={folder.id} className="min-w-0">
                      <OsisFolder
                        folder={folder}
                        files={inFolder}
                        count={inFolder.length}
                        onOpen={(f) => setActiveFolder(f.id)}
                        onPlay={setSelectedFile}
                      />
                      <div className="-mt-1 px-1 text-center">
                                                <p className="mt-0.5 line-clamp-1 text-xs text-fg-3">{folder.description || "Arsip kegiatan OSIS"}</p>
                        {isAdmin && (
                          <div className="mt-2 flex items-center justify-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${folder.published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{folder.published ? "Tayang" : "Draft"}</span>
                            <button onClick={() => togglePublished("folder", folder)} disabled={busy} className="text-xs font-bold text-brand-dim underline">{folder.published ? "Sembunyikan" : "Publikasikan"}</button>
                            <button onClick={() => deleteFolder(folder)} disabled={busy} title="Hapus folder" className="grid size-6 place-items-center rounded-md text-rose-600 hover:bg-rose-50 disabled:opacity-50"><Trash2 size={13} /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-line bg-card px-5 py-14 text-center">
                <FolderOpen size={32} className="mx-auto text-fg-3" />
                <p className="mt-3 font-bold text-fg">Belum ada folder yang tersedia</p>
                <p className="mt-1 text-sm text-fg-3">{isAdmin ? "Buat folder, lalu tambahkan tautan Google Drive." : "Video yang dipublikasikan akan muncul di sini."}</p>
              </div>
            )}
          </>
        )}
      </section>

      {selectedFile && <CinemaPlayer key={selectedFile.id} file={selectedFile} onClose={() => setSelectedFile(null)} />}
    </div>
  );
}
