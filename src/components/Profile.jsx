// Profile — dashboard akun: ganti nama, pilih avatar, koleksi badge & statistik.
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaEnvelope,
  FaStar,
  FaCheckCircle,
  FaSave,
  FaGamepad,
  FaTrophy,
  FaLock,
  FaGem,
} from "react-icons/fa";
import { saveProfile, loadProgress, syncRankProfile } from "../services/api";
import { ALL_BADGES, BADGE_ICONS, computeBadges } from "../utils/badges";

const STEPS_PER_LEVEL = 5;
const GAME_LABELS = {
  "5-7": "Block Puzzle",
  "8-10": "Blockly Coding",
  "11-15": "Coding",
};

// Avatar preset dari DiceBear — beragam gaya untuk semua selera
const AVATAR_PRESETS = [
  { url: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=robot-keren", label: "Robot" },
  { url: "https://api.dicebear.com/9.x/bottts/svg?seed=mekanik-biru", label: "Mekanik" },
  { url: "https://api.dicebear.com/9.x/fun-emoji/svg?seed=kucing-oren", label: "Lucu" },
  { url: "https://api.dicebear.com/9.x/adventurer/svg?seed=pahlawan-perisai", label: "Petualang" },
  { url: "https://api.dicebear.com/9.x/big-smile/svg?seed=ceria-selalu", label: "Ceria" },
  { url: "https://api.dicebear.com/9.x/thumbs/svg?seed=jempol-atas", label: "Jempol" },
  { url: "https://api.dicebear.com/9.x/lorelei/svg?seed=pintar", label: "Pintar" },
  { url: "https://api.dicebear.com/9.x/micah/svg?seed=coder", label: "Coder" },
  { url: "https://api.dicebear.com/9.x/pixel-art/svg?seed=piksel", label: "Piksel" },
  { url: "https://api.dicebear.com/9.x/dylan/svg?seed=rambut-jeli", label: "Rapi" },
  { url: "https://api.dicebear.com/9.x/notionists/svg?seed=tenang", label: "Tenang" },
  { url: "https://api.dicebear.com/9.x/open-peeps/svg?seed=senyum-lebar", label: "Senyum" },
];

function defaultAvatar(user) {
  const seed = encodeURIComponent(user?.email || user?.name || "kodekids");
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${seed}`;
}

export default function Profile({ user, onUpdateUser, onBack }) {
  const [name, setName] = useState(user?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  if (!user) return null;

  const progress = loadProgress();
  const earnedBadges = computeBadges(progress);
  const totalScore = Object.values(progress).reduce(
    (sum, p) => sum + (p?.totalScore || 0),
    0,
  );
  const totalLevelsDone = Object.values(progress).reduce(
    (sum, p) => sum + Math.max(0, (p?.level || 1) - 1),
    0,
  );

  function pickPreset(url) {
    setAvatarUrl(url);
    setMsg(null);
  }

  async function handleSave(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await saveProfile(user.id, name, avatarUrl);
      const merged = { ...user, ...res.data };
      onUpdateUser(merged);
      // Perbarui juga nama/avatar di papan peringkat
      syncRankProfile(merged);
      setMsg({ ok: true, text: "Profil berhasil disimpan!" });
    } catch (err) {
      setMsg({ ok: false, text: err.message || "Gagal menyimpan profil" });
    } finally {
      setBusy(false);
    }
  }

  const previewSrc = avatarUrl || defaultAvatar(user);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-kk-inksoft hover:text-kk-ink text-sm font-bold mb-6 transition-colors"
      >
        <FaArrowLeft /> Kembali
      </button>

      {/* Kartu identitas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-kk-paper border-[3px] border-kk-ink rounded-3xl p-6 sm:p-8 shadow-kk-xl"
      >
        <div className="flex items-center gap-5 mb-8">
          <img
            src={previewSrc}
            alt="Avatar"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-[3px] border-kk-ink shadow-kk-md bg-kk-cream object-cover"
            onError={(e) => {
              e.currentTarget.src = defaultAvatar(user);
            }}
          />
          <div>
            <h1 className="font-display font-semibold text-2xl sm:text-3xl text-kk-ink leading-tight">
              Profil Kamu
            </h1>
            <p className="text-kk-inksoft font-semibold text-sm flex items-center gap-1.5 mt-1">
              <FaEnvelope className="text-kk-indigo" /> {user.email}
            </p>
            <span className="mt-2 inline-flex items-center gap-1 bg-kk-sun border-2 border-kk-ink rounded-full px-3 py-0.5 text-xs font-extrabold text-kk-ink">
              <FaStar /> {totalScore} poin
            </span>
          </div>
        </div>

        {/* Statistik */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-kk-cream border-2 border-kk-ink/15 rounded-2xl p-4 flex items-center gap-3">
            <div className="bg-kk-coral w-10 h-10 rounded-xl border-2 border-kk-ink flex items-center justify-center text-white shrink-0">
              <FaTrophy />
            </div>
            <div>
              <div className="font-display font-semibold text-xl text-kk-ink">{totalScore}</div>
              <div className="text-xs font-bold text-kk-inksoft">Total Poin</div>
            </div>
          </div>
          <div className="bg-kk-cream border-2 border-kk-ink/15 rounded-2xl p-4 flex items-center gap-3">
            <div className="bg-kk-teal w-10 h-10 rounded-xl border-2 border-kk-ink flex items-center justify-center text-white shrink-0">
              <FaGamepad />
            </div>
            <div>
              <div className="font-display font-semibold text-xl text-kk-ink">{totalLevelsDone}</div>
              <div className="text-xs font-bold text-kk-inksoft">Level Ditaklukkan</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-extrabold text-kk-inksoft mb-1.5 uppercase tracking-wide">
              Nama Panggilan
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              required
              placeholder="Nama kamu"
              className="w-full bg-kk-cream border-2 border-kk-ink/20 focus:border-kk-indigo rounded-xl px-4 py-3 text-sm text-kk-ink placeholder:text-kk-inksoft/50 focus:outline-none transition-colors"
            />
          </div>

          {/* Pilih avatar preset */}
          <div>
            <label className="block text-xs font-extrabold text-kk-inksoft mb-2 uppercase tracking-wide">
              Pilih Avatarmu ({AVATAR_PRESETS.length} pilihan)
            </label>
            <div className="flex gap-3 flex-wrap">
              {AVATAR_PRESETS.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => pickPreset(preset.url)}
                  title={`${preset.label}`}
                  className={`relative w-14 h-14 rounded-xl overflow-hidden transition-transform hover:-translate-y-0.5 ${
                    avatarUrl === preset.url
                      ? "border-[3px] border-kk-indigo shadow-kk-sm"
                      : "border-2 border-kk-ink/25 hover:border-kk-ink"
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-full bg-kk-cream" />
                  {avatarUrl === preset.url && (
                    <FaCheckCircle className="absolute bottom-0.5 right-0.5 text-kk-indigo bg-kk-paper rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {msg && (
            <div
              className={`rounded-xl px-4 py-2.5 text-sm font-bold border-2 ${
                msg.ok
                  ? "bg-emerald-100 border-emerald-500/50 text-emerald-800"
                  : "bg-red-100 border-red-400/60 text-red-700"
              }`}
            >
              {msg.text}
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
                : "bg-kk-indigo hover:bg-kk-indigodeep text-white"
            }`}
          >
            <FaSave />
            {busy ? "Menyimpan..." : "Simpan Perubahan"}
          </motion.button>
        </form>
      </motion.div>

      {/* Koleksi badge */}
      <h2 className="font-display font-semibold text-2xl text-kk-ink mt-10 mb-4 flex items-center gap-2">
        <FaGem className="text-kk-indigo" /> Koleksi Badge
        <span className="text-sm font-bold text-kk-inksoft ml-auto">
          {earnedBadges.length}/{ALL_BADGES.length}
        </span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {ALL_BADGES.map((b, i) => {
          const earned = earnedBadges.includes(b.id);
          const Icon = BADGE_ICONS[b.icon];
          return (
            <motion.div
              key={b.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              title={earned ? b.desc : `${b.desc} — selesaikan tantangannya!`}
              className={`rounded-2xl p-4 text-center border-[2.5px] ${
                earned
                  ? "bg-kk-paper border-kk-ink shadow-kk-sm"
                  : "bg-kk-paper/60 border-dashed border-kk-ink/25"
              }`}
            >
              <div
                className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
                  earned ? "text-white" : "bg-kk-cream text-kk-inksoft/40"
                }`}
                style={
                  earned
                    ? { backgroundColor: b.color, border: "2px solid #262138" }
                    : undefined
                }
              >
                {earned ? <Icon className="text-xl" /> : <FaLock className="text-sm" />}
              </div>
              <div
                className={`mt-2 text-xs font-extrabold leading-tight ${
                  earned ? "text-kk-ink" : "text-kk-inksoft/50"
                }`}
              >
                {b.title}
              </div>
              <div className="text-[10px] font-bold text-kk-inksoft/60 mt-0.5">
                {GAME_LABELS[b.game] || "Semua Game"}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info progres per kelompok umur */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {["5-7", "8-10", "11-15"].map((g) => {
          const p = progress[g];
          return (
            <div
              key={g}
              className="bg-kk-paper border-2 border-kk-ink rounded-2xl p-4 shadow-kk-sm"
            >
              <div className="text-xs font-extrabold text-kk-inksoft uppercase tracking-wide">
                Umur {g.replace("-", "–")} tahun
              </div>
              {p ? (
                <>
                  <div className="font-display font-semibold text-lg text-kk-ink mt-1">
                    Level {p.level || 1} · Soal {p.step || 1}/{STEPS_PER_LEVEL}
                  </div>
                  <div className="text-sm font-bold text-kk-inksoft flex items-center gap-1 mt-0.5">
                    <FaStar className="text-kk-sun" /> {p.totalScore || 0} poin
                  </div>
                </>
              ) : (
                <div className="text-sm font-bold text-kk-inksoft mt-1">Belum dimainkan</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
