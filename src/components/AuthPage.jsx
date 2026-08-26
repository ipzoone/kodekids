// AuthPage — halaman login & register. Setelah login, data user disimpan
// di localStorage (kidcode-user) supaya sesi tetap ada saat refresh.
import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaCode, FaUser, FaEnvelope, FaLock, FaArrowLeft } from "react-icons/fa";
import { callAuth } from "../services/api";

export default function AuthPage({ onBack, onSuccess, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-800/90 border border-white/10 rounded-2xl p-8 shadow-2xl"
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/60 hover:text-white text-sm font-bold mb-6"
        >
          <FaArrowLeft /> Beranda
        </button>

        <div className="flex items-center gap-3 mb-2">
          <span className="bg-sky-500 w-10 h-10 rounded-xl flex items-center justify-center text-lg">
            <FaCode />
          </span>
          <h1 className="text-2xl font-extrabold">
            {mode === "login" ? "Masuk" : "Daftar"}
          </h1>
        </div>
        <p className="text-white/50 text-sm mb-6">
          {mode === "login"
            ? "Masuk supaya kode di Playground kamu tersimpan otomatis."
            : "Buat akun baru untuk menyimpan kode Playground kamu."}
        </p>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-bold text-white/60 mb-1.5 uppercase tracking-wide">Nama</label>
              <div className="relative">
                <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Nama kamu"
                  required
                  className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-white/60 mb-1.5 uppercase tracking-wide">Email</label>
            <div className="relative">
              <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="email@contoh.com"
                required
                className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/60 mb-1.5 uppercase tracking-wide">Password</label>
            <div className="relative">
              <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder={mode === "register" ? "Minimal 6 karakter" : "Password kamu"}
                required
                minLength={6}
                className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-300 text-sm rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}

          <motion.button
            whileHover={{ scale: busy ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={busy}
            className={`w-full font-bold py-3 rounded-xl shadow-lg transition-colors ${
              busy
                ? "bg-sky-700 cursor-wait opacity-70"
                : "bg-sky-500 hover:bg-sky-400"
            }`}
          >
            {busy
              ? "Memproses..."
              : mode === "login"
                ? "Masuk"
                : "Daftar"}
          </motion.button>
        </form>

        <p className="text-center text-sm text-white/50 mt-6">
          {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
            className="text-sky-400 hover:text-sky-300 font-bold"
          >
            {mode === "login" ? "Daftar di sini" : "Masuk di sini"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
