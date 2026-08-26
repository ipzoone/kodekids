// LevelSelect — layar pemilihan level sebelum masuk game challenge.
// Level terbuka bertahap: hanya level <= progres tersimpan yang bisa dimainkan.
// Level lama boleh dimainkan ulang untuk belajar, tapi tidak bisa meloncat.
import React from "react";
import { motion } from "framer-motion";
import { FaArrowLeft, FaLock, FaCheckCircle, FaPlay, FaStar } from "react-icons/fa";
import { loadProgress } from "../services/api";

const LABELS = {
  "5-7": { title: "Block Puzzle Ikon" },
  "8-10": { title: "Blockly Coding" },
  "11-15": { title: "Coding" },
};
const STEPS_PER_LEVEL = 5;

export default function LevelSelect({ ageGroup, onBack, onSelect }) {
  const saved = loadProgress()[ageGroup] || {};
  const unlocked = saved.level || 1; // level tertinggi yang sudah terbuka
  const stepNow = saved.step || 1;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <button
        onClick={onBack}
        className="self-start max-w-3xl w-full flex items-center gap-2 text-kk-inksoft hover:text-kk-ink text-sm font-extrabold mb-8 transition-colors"
      >
        <FaArrowLeft /> Ganti Mode
      </button>

      <motion.h1
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="font-display font-semibold text-4xl md:text-5xl mb-1.5 text-kk-ink text-center"
      >
        Pilih Level
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-kk-inksoft font-bold mb-2 text-center"
      >
        {LABELS[ageGroup]?.title || "Challenge"} · selesaikan levelnya untuk membuka level berikutnya!
      </motion.p>

      <div className="grid gap-5 w-full max-w-3xl sm:grid-cols-2 mt-8">
        {[1, 2, 3, 4, 5].map((n) => {
          const locked = n > unlocked;
          const done = n < unlocked;
          const current = n === unlocked;
          return (
            <motion.button
              key={n}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.08 * (n - 1), type: "spring", stiffness: 120 }}
              whileHover={locked ? {} : { x: -3, y: -3 }}
              whileTap={locked ? {} : { scale: 0.97 }}
              disabled={locked}
              onClick={() => !locked && onSelect(n)}
              className={`rounded-3xl border-[3px] p-6 text-left shadow-kk-lg flex items-center gap-4 ${
                locked
                  ? "bg-kk-paper/70 border-kk-ink/30 border-dashed text-kk-inksoft/50 cursor-not-allowed shadow-none"
                  : current
                    ? "bg-kk-indigo border-kk-ink text-white hover:bg-kk-indigodeep"
                    : "bg-kk-teal border-kk-ink text-white hover:bg-kk-tealdeep"
              }`}
            >
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-2xl font-display font-bold ${
                  locked ? "bg-kk-cream border-2 border-kk-ink/20 text-kk-inksoft/50" : "bg-white/20 border-2 border-white/60"
                }`}
              >
                {locked ? <FaLock /> : n}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold text-xl">Level {n}</div>
                {locked ? (
                  <div className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                    <FaLock className="text-xs" /> Selesaikan level {n - 1} dulu
                  </div>
                ) : done ? (
                  <div className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                    <FaCheckCircle className="text-emerald-200" /> Selesai — main lagi buat latihan
                  </div>
                ) : (
                  <div className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                    <FaPlay className="text-xs" /> Lanjut dari soal {stepNow}/{STEPS_PER_LEVEL}
                  </div>
                )}
                {done && (
                  <span className="mt-2 inline-flex items-center gap-1 bg-kk-ink rounded-full px-3 py-1 text-[11px] font-extrabold">
                    <FaStar className="text-kk-sun" /> Sudah kamu taklukkan
                  </span>
                )}
                {current && saved.totalScore > 0 && (
                  <span className="mt-2 inline-flex items-center gap-1 bg-kk-ink rounded-full px-3 py-1 text-[11px] font-extrabold ml-2">
                    <FaStar className="text-kk-sun" /> {saved.totalScore} poin
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
