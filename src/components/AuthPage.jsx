// AuthPage — halaman login & register. Setelah login, data user disimpan
// di localStorage (kidcode-user) supaya sesi tetap ada saat refresh.
// Tampilan mengikuti tema KodeKids: paper, border ink, shadow offset.
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaArrowLeft,
  FaRocket,
  FaGamepad,
  FaFolderOpen,
} from "react-icons/fa";
import { callAuth } from "../services/api";

// Client ID Google bersifat publik (boleh tampil di browser).
// Secret TIDAK dipakai di frontend — tersimpan hanya di server (.env).
const GOOGLE_CLIENT_ID =
  process.env.REACT_APP_GOOGLE_CLIENT_ID ||
  "862174055865-2vr9mm3j2ec554o5qvjdccn2l9bv675i.apps.googleusercontent.com";

// Muat script Google Identity Services sekali
function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Gagal memuat Google Sign-In"));
    document.head.appendChild(s);
  });
}

const inputBase =
  "w-full bg-kk-cream border-2 rounded-xl pl-10 pr-4 py-3 text-sm text-kk-ink placeholder:text-kk-inksoft/50 focus:outline-none transition-colors";
const labelBase =
  "block text-xs font-extrabold text-kk-inksoft mb-1.5 uppercase tracking-wide";

export default function AuthPage({ onBack, onSuccess, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const googleBtnRef = React.useRef(null);

  async function handleGoogleCredential(response) {
    setError("");
    setBusy(true);
    try {
      // Lewat /api/* karena grup route ini terbukti bisa mengakses Turso
      const res = await callAuth("api-google", { credential: response.credential });
      onSuccess(res.data);
    } catch (err) {
      setError(err.message || "Login Google gagal");
      setBusy(false);
    }
  }

  // Render tombol Google (Google Identity Services)
  React.useEffect(() => {
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !googleBtnRef.current) return;
        // Lupakan akun yang terakhir dipilih supaya pemilih akun selalu muncul
        try {
          window.google.accounts.id.disableAutoSelect();
        } catch {}
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredential,
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "left",
          width: 320,
          locale: "id",
          prompt: "select_account",
        });
        setGoogleReady(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        const res = await callAuth("login", {
          email: form.email,
          password: form.password,
        });
        onSuccess(res.data);
      } else {
        await callAuth("register", {
          name: form.name,
          email: form.email,
          password: form.password,
        });
        // Setelah daftar sukses, langsung login otomatis
        const res = await callAuth("login", {
          email: form.email,
          password: form.password,
        });
        onSuccess(res.data);
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-kk-paper border-[3px] border-kk-ink rounded-3xl p-7 sm:p-8 shadow-kk-xl">
          {/* Baris atas: kembali + logo */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-kk-inksoft hover:text-kk-ink text-sm font-bold transition-colors"
            >
              <FaArrowLeft /> Beranda
            </button>
            <span className="bg-kk-indigo w-10 h-10 rounded-[11px] border-[2.5px] border-kk-ink flex items-center justify-center font-mono font-bold text-white text-sm">
              &lt;/&gt;
            </span>
          </div>

          <h1 className="font-display font-semibold text-3xl text-kk-ink leading-tight">
            {mode === "login" ? (
              <>
                Selamat Datang <span className="text-kk-coral">Kembali!</span>
              </>
            ) : (
              <>
                Ayo Gabung <span className="text-kk-indigo">KodeKids!</span>
              </>
            )}
          </h1>
          <p className="text-kk-inksoft font-semibold text-sm mt-1.5 mb-6 leading-relaxed">
            {mode === "login"
              ? "Masuk supaya kode di Playground kamu tersimpan otomatis."
              : "Buat akun baru untuk menyimpan kode Playground kamu."}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <label className={labelBase}>Nama</label>
                <div className="relative">
                  <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-kk-inksoft/60" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="Nama kamu"
                    required
                    className={`${inputBase} border-kk-ink/20 focus:border-kk-indigo`}
                  />
                </div>
              </motion.div>
            )}

            <div>
              <label className={labelBase}>Email</label>
              <div className="relative">
                <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-kk-inksoft/60" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="email@contoh.com"
                  required
                  className={`${inputBase} border-kk-ink/20 focus:border-kk-indigo`}
                />
              </div>
            </div>

            <div>
              <label className={labelBase}>Password</label>
              <div className="relative">
                <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-kk-inksoft/60" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder={mode === "register" ? "Minimal 6 karakter" : "Password kamu"}
                  required
                  minLength={6}
                  className={`${inputBase} border-kk-ink/20 focus:border-kk-indigo`}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border-2 border-red-400/60 text-red-700 text-sm font-semibold rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            <motion.button
              whileHover={{ scale: busy ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={busy}
              className={`w-full flex items-center justify-center gap-2 font-display font-semibold text-lg py-3 rounded-2xl border-[2.5px] border-kk-ink shadow-kk-md transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                busy
                  ? "bg-kk-inksoft cursor-wait opacity-70 text-white"
                  : mode === "login"
                    ? "bg-kk-teal hover:bg-kk-tealdeep text-white"
                    : "bg-kk-coral hover:bg-kk-coraldeep text-white"
              }`}
            >
              <FaRocket className={busy ? "animate-pulse" : ""} />
              {busy
                ? "Memproses..."
                : mode === "login"
                  ? "Masuk Sekarang"
                  : "Daftar Sekarang"}
            </motion.button>
          </form>

          {/* Login Google */}
          <div className="mt-5">
            <div
              ref={googleBtnRef}
              className={`flex justify-center ${googleReady ? "" : "hidden"}`}
            />
            {!googleReady && (
              <div className="flex items-center justify-center gap-2 text-kk-inksoft/60 font-bold text-sm py-2.5">
                <span className="w-4 h-4 rounded-full border-2 border-kk-inksoft/40 border-t-kk-indigo animate-spin" />
                Memuat tombol Google...
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 my-5">
            <hr className="flex-1 border-t-2 border-kk-ink/10" />
            <span className="text-xs font-bold text-kk-inksoft/70">atau pakai email</span>
            <hr className="flex-1 border-t-2 border-kk-ink/10" />
          </div>

          <p className="text-center text-sm font-semibold text-kk-inksoft">
            {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
              className={`font-extrabold underline decoration-2 underline-offset-2 hover:brightness-110 ${
                mode === "login" ? "text-kk-coraldeep" : "text-kk-tealdeep"
              }`}
            >
              {mode === "login" ? "Daftar di sini" : "Masuk di sini"}
            </button>
          </p>
        </div>

        {/* Chip manfaat di bawah kartu */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { Icon: FaFolderOpen, label: "Kode tersimpan", color: "bg-kk-indigo" },
            { Icon: FaGamepad, label: "25 Challenge", color: "bg-kk-coral" },
            { Icon: FaRocket, label: "Naik level", color: "bg-kk-teal" },
          ].map(({ Icon, label, color }) => (
            <div
              key={label}
              className="bg-kk-paper border-2 border-kk-ink rounded-2xl px-3 py-3 text-center shadow-kk-sm"
            >
              <div
                className={`${color} w-9 h-9 mx-auto rounded-lg border-2 border-kk-ink flex items-center justify-center text-white mb-1.5`}
              >
                <Icon className="text-sm" />
              </div>
              <div className="text-[11px] font-extrabold text-kk-ink leading-tight">{label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
