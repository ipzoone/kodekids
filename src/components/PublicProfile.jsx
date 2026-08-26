// PublicProfile — melihat profil pemain lain: avatar, badge yang dipamerkan,
// dan skor per game. Data diambil dari EdgeOne Blob KV.
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaArrowLeft, FaStar, FaLock, FaGem, FaUserCircle } from "react-icons/fa";
import { fetchPublicUser } from "../services/api";
import { ALL_BADGES, BADGE_ICONS } from "../utils/badges";

const GAME_LABELS = {
  "5-7": "Block Puzzle",
  "8-10": "Blockly Coding",
  "11-15": "Coding",
};

export default function PublicProfile({ userId, onBack }) {
  const [record, setRecord] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setRecord(null);
    setError("");
    fetchPublicUser(userId)
      .then((data) => !cancelled && setRecord(data))
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 font-bold mb-4">{error}</p>
        <button onClick={onBack} className="btn-game-secondary">
          Kembali
        </button>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-kk-inksoft font-bold animate-pulse">Memuat profil...</p>
      </div>
    );
  }

  const badges = Array.isArray(record.badges) ? record.badges : [];
  const scores = record.scores || {};
  const totalScore = Object.values(scores).reduce((s, n) => s + (n || 0), 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-kk-inksoft hover:text-kk-ink text-sm font-bold mb-6 transition-colors"
      >
        <FaArrowLeft /> Papan Peringkat
      </button>

      {/* Kartu identitas */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-kk-paper border-[3px] border-kk-ink rounded-3xl p-6 sm:p-8 shadow-kk-xl text-center"
      >
        <div className="relative inline-block">
          {record.avatarUrl ? (
            <img
              src={record.avatarUrl}
              alt=""
              className="w-24 h-24 rounded-2xl border-[3px] border-kk-ink shadow-kk-md object-cover bg-kk-cream"
              onError={(e) => (e.currentTarget.style.visibility = "hidden")}
            />
          ) : (
            <FaUserCircle className="w-24 h-24 text-kk-inksoft/40" />
          )}
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-kk-indigo text-white border-2 border-kk-ink rounded-full px-3 py-0.5 text-xs font-extrabold whitespace-nowrap">
            <FaStar className="text-kk-sun" /> {totalScore} poin
          </span>
        </div>
        <h1 className="font-display font-semibold text-3xl text-kk-ink mt-5 break-words">
          {record.name}
        </h1>

        {/* Skor per game */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {Object.entries(GAME_LABELS).map(([g, label]) => (
            <div
              key={g}
              className="bg-kk-cream border-2 border-kk-ink/15 rounded-2xl p-3"
            >
              <div className="text-[10px] font-extrabold text-kk-inksoft uppercase tracking-wide leading-tight h-7 flex items-center justify-center">
                {label}
              </div>
              <div className="font-display font-semibold text-lg text-kk-ink flex items-center justify-center gap-1">
                <FaStar className="text-kk-sun text-xs" /> {scores[g] || 0}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Koleksi badge */}
      <h2 className="font-display font-semibold text-2xl text-kk-ink mt-10 mb-4 flex items-center gap-2">
        <FaGem className="text-kk-indigo" /> Koleksi Badge
        <span className="text-sm font-bold text-kk-inksoft ml-auto">
          {badges.length}/{ALL_BADGES.length}
        </span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        {ALL_BADGES.map((b, i) => {
          const earned = badges.includes(b.id);
          const Icon = BADGE_ICONS[b.icon] || FaGem;
          return (
            <motion.div
              key={b.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              title={earned ? b.desc : `${b.desc} — belum terbuka`}
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
                {earned ? (
                  <Icon className="text-xl" />
                ) : (
                  <FaLock className="text-sm" />
                )}
              </div>
              <div
                className={`mt-2 text-xs font-extrabold leading-tight ${
                  earned ? "text-kk-ink" : "text-kk-inksoft/50"
                }`}
              >
                {b.title}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
