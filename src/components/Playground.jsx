// Playground — editor kode ala VSCode: file tree di kiri, Monaco di tengah,
// output panel di bawah. Kode dijalankan beneran via EdgeOne Sandbox (/runner).
// Kalau user sudah login, semua file otomatis disimpan ke server
// (EdgeOne Pages Blob via /api/workspace), jadi tidak hilang saat refresh.
// File & folder berbasis path ("kodeku/main.py") — bisa buat/hapus/rename.
import React, { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaPlay,
  FaFolderOpen,
  FaCloudUploadAlt,
  FaFileMedical,
  FaFolderPlus,
  FaPen,
  FaTrash,
  FaPlus,
  FaFileImport,
  FaDownload,
} from "react-icons/fa";
import { Tree, ContextMenu } from "./magicui/FileTree";
import Modal from "./magicui/Modal";
import { callRunner, loadWorkspace, saveWorkspace } from "../services/api";

// Dialog input (pengganti window.prompt) — tampil di tengah, tema app
function PromptDialog({ config, onClose }) {
  const [value, setValue] = useState(config.defaultValue || "");
  const [error, setError] = useState("");
  const inputRef = React.useRef(null);

  useEffect(() => {
    const t = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
    return () => clearTimeout(t);
  }, []);

  function submit(e) {
    e.preventDefault();
    const err = config.onSubmit(value);
    if (err) setError(err);
    else onClose();
  }

  return (
    <Modal open title={config.title} subtitle={config.description} onClose={onClose}>
      <form onSubmit={submit}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          placeholder={config.placeholder}
          className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors ${
            error
              ? "border-red-500/60 focus:border-red-400"
              : "border-white/10 focus:border-sky-500"
          }`}
        />
        {error && (
          <p className="mt-2 text-red-300 text-sm flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-red-500/20 text-red-300 flex items-center justify-center text-[10px] font-bold">!</span>
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-sky-500 hover:bg-sky-400 shadow-lg transition-colors"
          >
            {config.submitLabel || "Buat"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Dialog konfirmasi (pengganti window.confirm) — dipakai untuk hapus dll.
function ConfirmDialog({ config, onClose }) {
  return (
    <Modal open title={config.title} onClose={onClose}>
      <p className="text-white/70 text-sm leading-relaxed">{config.message}</p>
      <div className="flex justify-end gap-2 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl text-sm font-bold text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          Batal
        </button>
        <button
          onClick={() => {
            config.onConfirm();
            onClose();
          }}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-colors ${
            config.danger
              ? "bg-red-500 hover:bg-red-400"
              : "bg-sky-500 hover:bg-sky-400"
          }`}
        >
          {config.confirmLabel || "Ya, Lanjutkan"}
        </button>
      </div>
    </Modal>
  );
}
const LANG_BY_EXT = {
  py: "python",
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  html: "html",
  css: "css",
  json: "json",
  md: "markdown",
};

function langOf(path) {
  const ext = path.split(".").pop().toLowerCase();
  return LANG_BY_EXT[ext] || "plaintext";
}

// Struktur awal (kalau user belum pernah nyimpan apa pun)
const DEFAULT_ENTRIES = {
  "kodeku/main.py": {
    language: "python",
    content:
      '# Selamat datang di Playground KodeKids!\n# Tekan tombol JALANKAN untuk melihat hasilnya.\n\nprint("Halo dari KodeKids!")\n\nfor i in range(1, 6):\n    print("Angka:", i)\n',
  },
  "kodeku/belajar.js": {
    language: "javascript",
    content:
      '// Selamat datang di Playground KodeKids!\n// Ubah kodenya lalu tekan JALANKAN.\n\nconsole.log("Halo dari KodeKids!");\n\nconst teman = ["Ani", "Budi", "Citra"];\nfor (const n of teman) {\n  console.log("Hai,", n);\n}\n',
  },
  "kodeku/kuis/__folder__": true,
  "kodeku/kuis/kuis-genap.py": {
    language: "python",
    content:
      "# Latihan: lengkapi fungsi genap(n)!\n# Jalankan untuk melihat hasilnya.\n\ndef genap(n):\n    # tulis kodemu di sini\n    pass\n\nprint(genap(4))  # seharusnya True\nprint(genap(7))  # seharusnya False\n",
  },
  "kodeku/kuis/kuis-genap.js": {
    language: "javascript",
    content:
      "// Latihan: lengkapi function genap(n)!\n// Jalankan untuk melihat hasilnya.\n\nfunction genap(n) {\n  // tulis kodemu di sini\n}\n\nconsole.log(genap(4)); // seharusnya true\nconsole.log(genap(7)); // seharusnya false\n",
  },
  "kodeku/catatan.md": {
    language: "markdown",
    content:
      "# Catatan KodeKids\n\n- print() dipakai di Python\n- console.log() dipakai di JavaScript\n- File .py dan .js bisa langsung dijalankan!\n",
  },
};

// Bangun struktur pohon dari map entries berbasis path
function buildTree(entries) {
  const dirs = {};
  const root = [];
  dirs[""] = root;

  function ensureDir(dirPath) {
    if (!dirPath || dirs[dirPath]) return dirs[dirPath];
    const idx = dirPath.lastIndexOf("/");
    const parent = ensureDir(idx === -1 ? "" : dirPath.slice(0, idx));
    const node = {
      id: dirPath,
      type: "folder",
      name: dirPath.slice(idx + 1),
      children: [],
    };
    parent.push(node);
    dirs[dirPath] = node.children;
    return node.children;
  }

  const paths = Object.keys(entries).filter((p) => !entries[p]?.__folder__);
  const folderPaths = Object.keys(entries).filter((p) => entries[p]?.__folder__);

  folderPaths.sort().forEach((p) => ensureDir(p));

  paths.sort().forEach((p) => {
    const idx = p.lastIndexOf("/");
    const children = ensureDir(idx === -1 ? "" : p.slice(0, idx));
    children.push({
      id: p,
      type: "file",
      name: idx === -1 ? p : p.slice(idx + 1),
    });
  });

  // Folder dulu, lalu file (urut abjad)
  function sortChildren(list) {
    list.sort((a, b) =>
      a.type === b.type
        ? a.name.localeCompare(b.name)
        : a.type === "folder"
          ? -1
          : 1,
    );
    list.forEach((el) => el.type === "folder" && sortChildren(el.children));
  }
  sortChildren(root);
  return root;
}

const LOCAL_KEY = "kidcode-playground-v2";

export default function Playground({ onHome, user }) {
  const [entries, setEntries] = useState(DEFAULT_ENTRIES);
  const [activeId, setActiveId] = useState("kodeku/main.py");
  const [projectName, setProjectName] = useState("kodekids-project");
  const [output, setOutput] = useState("# output akan muncul di sini");
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error | guest
  const [notice, setNotice] = useState(""); // pesan singkat untuk aksi ekspor/impor
  const importInputRef = useRef(null);

  const loadedRef = useRef(false);
  const timerRef = useRef(null);
  const [ctxMenu, setCtxMenu] = useState(null); // { id, x, y } untuk klik kanan
  const [dialog, setDialog] = useState(null); // { kind: "prompt"|"confirm", ... }

  const treeElements = useMemo(() => buildTree(entries), [entries]);
  const active = entries[activeId];
  const isCode = active && !active.__folder__ && active.language !== "markdown";

  // Muat workspace yang tersimpan saat halaman dibuka / user berubah
  useEffect(() => {
    loadedRef.current = false;
    async function load() {
      try {
        if (user) {
          const data = await loadWorkspace(user.id);
          if (data?.files && Object.keys(data.files).length > 0) {
            setEntries(data.files);
            if (data.activeId && data.files[data.activeId]) setActiveId(data.activeId);
            if (data.name) setProjectName(data.name);
          }
        } else {
          const local = JSON.parse(localStorage.getItem(LOCAL_KEY));
          if (local?.files && Object.keys(local.files).length > 0) {
            setEntries(local.files);
            if (local.activeId && local.files[local.activeId]) setActiveId(local.activeId);
            if (local.name) setProjectName(local.name);
          }
        }
      } catch (e) {
        console.warn("Gagal memuat workspace:", e.message);
      } finally {
        setTimeout(() => {
          loadedRef.current = true;
        }, 0);
      }
    }
    load();
  }, [user]);

  // ===== Simpan (debounce otomatis + bisa dipicu manual) =====
  async function persist() {
    try {
      if (user) {
        await saveWorkspace(user.id, entries, activeId, projectName);
        setSaveState("saved");
      } else {
        localStorage.setItem(
          LOCAL_KEY,
          JSON.stringify({ files: entries, activeId, name: projectName }),
        );
        setSaveState("guest");
      }
    } catch (e) {
      console.warn("Gagal menyimpan workspace:", e.message);
      setSaveState("error");
    }
  }

  // Autosave (debounce 1 detik) setiap kali file/nama berubah
  useEffect(() => {
    if (!loadedRef.current) return;
    setSaveState(user ? "saving" : "guest");
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(persist, 1000);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, activeId, projectName, user]);

  // Simpan sekarang tanpa menunggu debounce
  function saveNow() {
    if (!loadedRef.current) return;
    setSaveState(user ? "saving" : "guest");
    clearTimeout(timerRef.current);
    persist();
  }

  function updateContent(value) {
    setEntries((e) => ({ ...e, [activeId]: { ...e[activeId], content: value } }));
  }

  // ===== Operasi file & folder =====
  function dirOf(id) {
    const idx = id.lastIndexOf("/");
    return idx === -1 ? "" : id.slice(0, idx);
  }

  function uniquePath(base) {
    if (!entries[base]) return base;
    const dot = base.lastIndexOf(".");
    const stem = dot > base.lastIndexOf("/") ? base.slice(0, dot) : base;
    const ext = dot > base.lastIndexOf("/") ? base.slice(dot) : "";
    let i = 1;
    while (entries[`${stem}-${i}${ext}`]) i++;
    return `${stem}-${i}${ext}`;
  }

  function askNewFile() {
    const selectedIsFolder = entries[activeId]?.__folder__;
    const dir = selectedIsFolder ? activeId : dirOf(activeId);
    setDialog({
      kind: "prompt",
      title: "File Baru",
      description: dir ? `Dibuat di dalam folder "${dir}"` : "Dibuat di root",
      placeholder: "contoh: latihan.py atau kode.js",
      defaultValue: "",
      submitLabel: "Buat File",
      onSubmit: (name) => {
        const clean = String(name || "").trim().replace(/^\/+|\/+$/g, "");
        if (!clean) return "Nama file tidak boleh kosong.";
        if (!clean.includes(".")) {
          return "Nama file harus pakai ekstensi, contoh: latihan.py atau kode.js";
        }
        const path = uniquePath(dir ? `${dir}/${clean}` : clean);
        const lang = langOf(path);
        const template =
          lang === "python"
            ? `# ${clean}\n\n`
            : lang === "javascript"
              ? `// ${clean}\n\n`
              : lang === "cpp"
                ? `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Halo dari KodeKids!" << endl;\n    return 0;\n}\n`
                : "";
        setEntries((e) => ({ ...e, [path]: { language: lang, content: template } }));
        setActiveId(path);
        return null;
      },
    });
  }

  function askNewFolder() {
    const selectedIsFolder = entries[activeId]?.__folder__;
    const dir = selectedIsFolder ? activeId : dirOf(activeId);
    setDialog({
      kind: "prompt",
      title: "Folder Baru",
      description: dir ? `Dibuat di dalam folder "${dir}"` : "Dibuat di root",
      placeholder: "contoh: materi",
      defaultValue: "",
      submitLabel: "Buat Folder",
      onSubmit: (name) => {
        const clean = String(name || "").trim().replace(/^\/+|\/+$/g, "");
        if (!clean) return "Nama folder tidak boleh kosong.";
        let path = dir ? `${dir}/${clean}` : clean;
        while (entries[path]) path += "-baru";
        setEntries((e) => ({ ...e, [path]: { __folder__: true } }));
        setActiveId(path);
        return null;
      },
    });
  }

  function askRename(id = activeId) {
    if (!id || !entries[id]) return;
    const isFolder = !!entries[id]?.__folder__;
    const oldName = id.split("/").pop();
    const parent = dirOf(id);
    setDialog({
      kind: "prompt",
      title: "Ganti Nama",
      description: isFolder
        ? `Folder "${oldName}" — semua isinya ikut berpindah.`
        : `Mengganti nama "${id}"`,
      placeholder: oldName,
      defaultValue: oldName,
      submitLabel: "Simpan",
      onSubmit: (newName) => {
        const clean = String(newName || "").trim();
        if (!clean) return "Nama tidak boleh kosong.";
        if (clean === oldName) return null; // tidak ada perubahan
        if (!isFolder && !clean.includes(".")) {
          return "Nama file harus tetap punya ekstensi, contoh: latihan.py";
        }
        const newId = parent ? `${parent}/${clean}` : clean;
        setEntries((e) => {
          const next = {};
          const oldPrefix = `${id}/`;
          for (const [key, val] of Object.entries(e)) {
            if (key === id) {
              next[newId] = val;
            } else if (key.startsWith(oldPrefix)) {
              next[`${newId}/${key.slice(oldPrefix.length)}`] = val;
            } else {
              next[key] = val;
            }
          }
          return next;
        });
        setActiveId((prev) =>
          prev === id || prev.startsWith(`${id}/`)
            ? `${newId}${prev === id ? "" : prev.slice(id.length)}`
            : prev,
        );
        return null;
      },
    });
  }

  function askDelete(id = activeId) {
    if (!id || !entries[id]) return;
    const isFolder = !!entries[id]?.__folder__;
    setDialog({
      kind: "confirm",
      title: "Hapus",
      danger: true,
      confirmLabel: "Ya, Hapus",
      message: isFolder
        ? `Folder "${id}" dan SEMUA isinya akan dihapus permanen. Lanjutkan?`
        : `"${id}" akan dihapus permanen. Lanjutkan?`,
      onConfirm: () => {
        setEntries((e) => {
          const next = {};
          const prefix = `${id}/`;
          for (const [key, val] of Object.entries(e)) {
            if (key === id || key.startsWith(prefix)) continue;
            next[key] = val;
          }
          return next;
        });
        if (activeId === id || activeId.startsWith(`${id}/`)) {
          const rest = Object.keys(entries).find(
            (k) => k !== id && !k.startsWith(`${id}/`) && !entries[k].__folder__,
          );
          setActiveId(rest || "kodeku/main.py");
        }
      },
    });
  }

  // Pindah file/folder ke folder lain atau root (drag & drop ala VSCode)
  function moveEntry(src, targetDir) {
    if (!entries[src]) return;
    // Cegah folder pindah ke dalam dirinya sendiri / turunannya
    if (targetDir === src || targetDir.startsWith(`${src}/`)) return;
    const parent = dirOf(src);
    if ((parent || "") === (targetDir || "")) return; // tidak ada perubahan

    const name = src.split("/").pop();
    let dest = targetDir ? `${targetDir}/${name}` : name;
    if (entries[dest]) {
      let i = 1;
      while (entries[`${dest}-${i}`]) i++;
      dest = `${dest}-${i}`;
    }

    setEntries((e) => {
      const next = {};
      const prefix = `${src}/`;
      for (const [key, val] of Object.entries(e)) {
        if (key === src) next[dest] = val;
        else if (key.startsWith(prefix)) next[`${dest}/${key.slice(prefix.length)}`] = val;
        else next[key] = val;
      }
      return next;
    });

    setActiveId((prev) => {
      if (prev === src) return dest;
      if (prev.startsWith(`${src}/`)) return `${dest}/${prev.slice(src.length + 1)}`;
      return prev;
    });
  }

  async function run() {
    if (!isCode || busy) return;
    setBusy(true);
    setOutput("Menjalankan...");
    try {
      const run = await callRunner({
        language: active.language,
        code: active.content,
        mode: "run",
      });
      setOutput(run.output || "(selesai, tanpa output)");
    } catch (e) {
      setOutput("Error: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  // ===== Ekspor / Impor / Project Baru =====
  function flashNotice(text) {
    setNotice(text);
    setTimeout(() => setNotice(""), 3500);
  }

  function safeZipName() {
    return (
      projectName.trim().replace(/[^\w\- ]+/g, "").replace(/\s+/g, "-") ||
      "kodekids-project"
    );
  }

  function downloadBlob(blob, filename) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  // Unduh seluruh project sebagai file .zip
  async function exportZip() {
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (const [path, entry] of Object.entries(entries)) {
        if (entry.__folder__) zip.folder(path);
        else zip.file(path, entry.content ?? "");
      }
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `${safeZipName()}.zip`);
      flashNotice("Project berhasil diunduh sebagai .zip ✓");
    } catch (e) {
      flashNotice("Gagal mengunduh ZIP: " + e.message);
    }
  }

  // Impor project dari file .zip di komputer
  async function importZip(file) {
    try {
      const { default: JSZip } = await import("jszip");
      const zip = await JSZip.loadAsync(file);
      const next = {};
      let firstFile = null;

      for (const f of Object.values(zip.files)) {
        const clean = f.name.replace(/^\.\//, "");
        if (!clean || clean.startsWith("__MACOSX") || clean.includes("/__MACOSX") || clean.includes(".git/")) continue;
        if (f.dir) {
          next[clean] = { __folder__: true };
          continue;
        }
        // Lewati file biner yang tidak berguna untuk editor kode
        if (/\.(png|jpe?g|gif|webp|ico|pdf|zip|rar|7z|exe|dll|so|dylib|woff2?|ttf|otf|eot|mp[34]|wav|ogg|avi|mov)$/i.test(clean)) continue;
        const content = await f.async("string");
        next[clean] = { language: langOf(clean), content };
        if (!firstFile) firstFile = clean;
      }

      if (!firstFile && !Object.keys(next).length) {
        flashNotice("ZIP kosong atau tidak berisi file teks yang didukung.");
        return;
      }
      setEntries(next);
      setActiveId(firstFile || "main.py");
      setProjectName(file.name.replace(/\.zip$/i, "") || "project-impor");
      loadedRef.current = true;
      flashNotice("Project berhasil diimpor ✓");
    } catch (e) {
      flashNotice("Gagal mengimpor ZIP: " + e.message);
    }
  }

  function askImport() {
    setDialog({
      kind: "confirm",
      title: "Impor Project (.zip)",
      message:
        "File di editor saat ini akan DIGANTI dengan isi ZIP yang kamu pilih. Lanjutkan?",
      confirmLabel: "Pilih File ZIP",
      onConfirm: () => importInputRef.current?.click(),
    });
  }

  // Mulai project baru yang kosong
  function newProject() {
    setDialog({
      kind: "confirm",
      title: "Buat Project Baru",
      message:
        "Editor akan dikosongkan menjadi project baru. Pastikan project lama sudah diekspor/terekspor jika ingin disimpan. Lanjutkan?",
      confirmLabel: "Ya, Buat Baru",
      onConfirm: () => {
        setEntries({
          "main.py": {
            language: "python",
            content: '# Project baru KodeKids!\n# Tekan JALANKAN untuk melihat hasilnya.\n\nprint("Halo, dunia!")\n',
          },
        });
        setActiveId("main.py");
        setProjectName("kodekids-project");
        flashNotice("Project baru siap ✓");
      },
    });
  }

  const SAVE_LABELS = {
    saving: "Menyimpan...",
    saved: "Tersimpan otomatis",
    error: "Gagal menyimpan",
    guest: "Login supaya kode tersimpan permanen",
    idle: "",
  };

  const toolBtn =
    "flex items-center justify-center w-7 h-7 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <button
          onClick={onHome}
          className="flex items-center gap-2 text-kk-inksoft hover:text-kk-ink text-sm font-bold transition-colors"
        >
          <FaArrowLeft /> Beranda
        </button>
        <h1 className="text-2xl font-extrabold flex items-center gap-3">
          <FaFolderOpen className="text-amber-400" /> Playground
        </h1>
        <motion.button
          whileHover={{ scale: isCode ? 1.05 : 1 }}
          whileTap={{ scale: 0.95 }}
          onClick={run}
          disabled={!isCode || busy}
          className={`flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl shadow-lg ${
            isCode
              ? "bg-emerald-500 hover:bg-emerald-400"
              : "bg-slate-600 cursor-not-allowed opacity-60"
          }`}
        >
          <FaPlay className={busy ? "animate-pulse" : ""} />
          {busy ? "Menjalankan..." : "Jalankan"}
        </motion.button>
      </div>

      {!user && (
        <div className="mb-4 bg-amber-100 border-2 border-amber-400/60 text-amber-800 text-sm rounded-xl px-4 py-2.5 font-semibold">
          Kamu belum login — kode hanya tersimpan di browser ini.{" "}
          <b>Login</b> dulu supaya kode kamu aman & bisa diakses dari perangkat mana pun.
        </div>
      )}

      {/* ===== Toolbar project: nama, baru, impor, unduh, simpan web ===== */}
      <div className="mb-4 flex items-center gap-2 flex-wrap bg-kk-paper border-[2.5px] border-kk-ink rounded-2xl p-2.5 shadow-kk-sm">
        <FaFolderOpen className="text-kk-indigo ml-1 shrink-0" />
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          maxLength={60}
          placeholder="nama-project"
          title="Nama project (ikut tersimpan & jadi nama file ZIP)"
          className="flex-1 min-w-[150px] bg-kk-cream border-2 border-kk-ink/20 focus:border-kk-indigo rounded-xl px-3 py-2 text-sm font-bold text-kk-ink placeholder:text-kk-inksoft/50 focus:outline-none transition-colors"
        />
        <button
          onClick={newProject}
          title="Buat project baru"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold border-2 border-kk-ink bg-kk-sun text-kk-ink shadow-kk-sm hover:brightness-105 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
        >
          <FaPlus /> Baru
        </button>
        <button
          onClick={askImport}
          title="Impor project dari file .zip di komputer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold border-2 border-kk-ink bg-kk-teal text-white shadow-kk-sm hover:brightness-110 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
        >
          <FaFileImport /> Impor ZIP
        </button>
        <button
          onClick={exportZip}
          title="Unduh seluruh project sebagai .zip"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold border-2 border-kk-ink bg-kk-coral text-white shadow-kk-sm hover:brightness-110 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
        >
          <FaDownload /> Unduh .zip
        </button>
        <button
          onClick={saveNow}
          title="Simpan sekarang ke web (kalau belum login: ke browser ini)"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold border-2 border-kk-indigodeep bg-kk-indigo text-white shadow-kk-sm hover:brightness-110 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
        >
          <FaCloudUploadAlt /> Simpan Web
        </button>
        {notice && (
          <span className="w-full sm:w-auto sm:ml-auto text-xs font-extrabold text-emerald-700 px-2">
            {notice}
          </span>
        )}
      </div>

      {/* Input tersembunyi untuk pemilihan file ZIP saat impor */}
      <input
        ref={importInputRef}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importZip(f);
          e.target.value = "";
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Sidebar file tree */}
        <aside className="lg:col-span-3 bg-slate-800/90 border border-white/10 rounded-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-white/10 text-xs font-bold text-white/50 uppercase tracking-wide flex items-center justify-between">
            <span>Explorer</span>
            <span className="flex items-center gap-1 normal-case tracking-normal text-[10px] font-bold text-white/40">
              <FaCloudUploadAlt
                className={
                  saveState === "saving"
                    ? "animate-bounce text-sky-400"
                    : saveState === "saved"
                      ? "text-emerald-400"
                      : saveState === "error"
                        ? "text-red-400"
                        : "text-white/30"
                }
              />
              {SAVE_LABELS[saveState]}
            </span>
          </div>
          <div className="px-3 py-1.5 border-b border-white/10 flex items-center gap-1">
            <button onClick={askNewFile} title="File baru" className={toolBtn}>
              <FaFileMedical className="text-sky-300" />
            </button>
            <button onClick={askNewFolder} title="Folder baru" className={toolBtn}>
              <FaFolderPlus className="text-amber-300" />
            </button>
            <button
              onClick={() => askRename()}
              title="Ganti nama"
              disabled={!activeId || !entries[activeId]}
              className={toolBtn}
            >
              <FaPen />
            </button>
            <button
              onClick={() => askDelete()}
              title="Hapus"
              disabled={!activeId || !entries[activeId]}
              className={`${toolBtn} hover:!text-red-300`}
            >
              <FaTrash />
            </button>
          </div>
          <div className="max-h-[50vh] overflow-auto">
            <Tree
              elements={treeElements}
              initialExpandedItems={["kodeku", "kodeku/kuis"]}
              selectedId={activeId}
              onSelect={(id) => entries[id] && setActiveId(id)}
              onMove={moveEntry}
              onContext={(id, x, y) => setCtxMenu({ id, x, y })}
            />
          </div>
        </aside>

        {/* Editor */}
        <section className="lg:col-span-9 rounded-xl overflow-hidden border border-white/10">
          <Editor
            height="55vh"
            language={active?.language}
            theme="vs-dark"
            value={active?.content ?? ""}
            onChange={(v) => updateContent(v ?? "")}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              tabSize: 4,
              automaticLayout: true,
              readOnly: !active || !!active.__folder__,
            }}
            loading={
              <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-white/60">
                Memuat editor...
              </div>
            }
          />
        </section>
      </div>

      {/* Output panel */}
      <div className="mt-4 rounded-xl overflow-hidden border border-white/10 bg-[#0a0e14]">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="ml-2 text-xs text-white/40">Output</span>
          {activeId && (
            <span className="ml-auto text-xs text-white/40">{activeId}</span>
          )}
        </div>
        <pre className="p-4 font-mono text-sm text-green-200 whitespace-pre-wrap min-h-[120px] max-h-56 overflow-auto">
          {output}
        </pre>
      </div>

      {/* Menu klik kanan file tree */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          isFolder={!!entries[ctxMenu.id]?.__folder__}
          onClose={() => setCtxMenu(null)}
          onRename={() => askRename(ctxMenu.id)}
          onDelete={() => askDelete(ctxMenu.id)}
        />
      )}

      {/* Dialog tengah layar: file/folder baru, rename, hapus */}
      {dialog?.kind === "prompt" && (
        <PromptDialog config={dialog} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === "confirm" && (
        <ConfirmDialog config={dialog} onClose={() => setDialog(null)} />
      )}
    </div>
  );
}
