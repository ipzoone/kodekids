// Leaderboard — papan peringkat tiap game, data dari EdgeOne Blob KV.
// Klik baris untuk mengunjungi profil publik pemain lain.
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaTrophy,
  FaCrown,
  FaMedal,
  FaStar,
  FaUserCircle,
  FaGem,
} from "react-icons/fa";
import { fetchLeaderboard } from "../services/api";

const GAMES = [
  { id: "5-7", label: "Block Puzzle", color: "bg-kk-coral" },
  { id: "8-10", label: "Blockly Coding", color: "bg-kk-teal" },
  { id: "11-15", label: "Coding", color: "bg-kk-indigo" },
];

const RANK_STYLE = [
  { icon: FaCrown, bg: "bg-kk-sun", text: "text-kk-ink" },
  { icon: FaMedal, bg: "bg-gray-300", text: "text-kk-ink" },
  { icon: FaMedal, bg: "bg-amber-700", text: "text-white" },
];

export default function Leaderboard({ onBack, onSelectUser }) {
  const [game, setGame] = useState("5-7");
  const [board, setBoard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setBoard(null);
    setError("");
    fetchLeaderboard(game)
      .then((data) => !cancelled && setBoard(data))
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [game]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-kk-inksoft hover:text-kk-ink text-sm font-bold mb-6 transition-colors"
      >
        <FaArrowLeft /> Beranda
      </button>

      <div className="text-center mb-8">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="font-display font-semibold text-4xl text-kk-ink inline-flex items-center gap-3"
        >
          <FaTrophy className="text-kk-sun" /> Papan Peringkat
        </motion.h1>
        <p className="text-kk-inksoft font-bold mt-1.5">
          Siap kolektor poin terhebat di KodeKids?
        </p>
      </div>

      {/* Tab pilih game */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {GAMES.map((g) => (
          <button
            key={g.id}
            onClick={() => setGame(g.id)}
            className={`py-2.5 rounded-2xl border-[2.5px] font-extrabold text-sm transition-all ${
              game === g.id
                ? `${g.color} text-white border-kk-ink shadow-kk-sm -translate-y-0.5`
                : "bg-kk-paper text-kk-inksoft border-kk-ink/20 hover:border-kk-ink"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Daftar peringkat */}
      {error && (
        <p className="text-center text-red-600 font-bold py-8">{error}</p>
      )}
      {!error && board == null && (
        <p className="text-center text-kk-inksoft font-bold animate-pulse py-8">
          Memuat peringkat...
        </p>
      )}
      {!error && Array.isArray(board) && board.length === 0 && (
        <div className="text-center py-10 bg-kk-paper border-[2.5px] border-dashed border-kk-ink/30 rounded-3xl">
          <FaTrophy className="text-5xl text-kk-inksoft/40 mx-auto mb-3" />
          <p className="font-bold text-kk-inksoft">Belum ada yang bertanding!</p>
          <p className="text-sm font-semibold text-kk-inksoft/70 mt-1">
            Jadilah yang pertama di papan peringkat!
          </p>
        </div>
      )}
      {Array.isArray(board) && board.length > 0 && (
        <div className="space-y-3">
          {board.map((entry, i) => {
            const RankIcon = i < 3 ? RANK_STYLE[i].icon : null;
            return (
              <motion.button
                key={entry.userId}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={i < 3 ? {} : { x: -3 }}
                onClick={() => onSelectUser(entry.userId)}
                className={`w-full flex items-center gap-4 rounded-2xl p-4 text-left border-[2.5px] transition-colors ${
                  i === 0
                    ? "bg-kk-sun/40 border-kk-ink shadow-kk-md"
                    : "bg-kk-paper border-kk-ink/15 hover:border-kk-ink"
                }`}
              >
                {/* Peringkat */}
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border-2 border-kk-ink ${
                    i < 3 ? RANK_STYLE[i].bg : "bg-kk-cream"
                  }`}
                >
                  {RankIcon ? (
                    <RankIcon className={`text-xl ${RANK_STYLE[i]?.text || ""}`} />
                  ) : (
                    <span className="font-display font-semibold text-kk-ink">{i + 1}</span>
                  )}
                </div>
                {/* Avatar */}
                {entry.avatarUrl ? (
                  <img
                    src={entry.avatarUrl}
                    alt=""
                    className="w-11 h-11 rounded-full border-2 border-kk-ink object-cover bg-kk-cream"
                    onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                  />
                ) : (
                  <FaUserCircle className="w-9 h-9 text-kk-inksoft/50 shrink-0" />
                )}
                {/* Nama */}
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-kk-ink truncate">{entry.name}</div>
                  <div className="text-xs font-bold text-kk-inksoft flex items-center gap-1 mt-0.5">
                    Lihat profil → {entry.badges > 0 && (
                      <>
                        · <FaGem className="text-kk-indigo" /> {entry.badges} badge
                      </>
                    )}
                  </div>
                </div>
                {/* Skor */}
                <div className="text-right shrink-0">
                  <div className="font-display font-semibold text-xl text-kk-ink flex items-center gap-1 justify-end">
                    <FaStar className="text-kk-sun text-sm" /> {entry.score}
                  </div>
                  <div className="text-[10px] font-extrabold text-kk-inksoft uppercase">poin</div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
