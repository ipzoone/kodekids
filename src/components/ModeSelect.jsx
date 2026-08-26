import React from "react";
import { motion } from "framer-motion";
import { FaBook, FaGamepad, FaArrowLeft, FaStar } from "react-icons/fa";
import { loadProgress } from "../services/api";

const LABELS = {
  "5-7": { title: "5 - 7 Tahun", subtitle: "Block Puzzle Ikon" },
  "8-10": { title: "8 - 10 Tahun", subtitle: "Blockly Coding" },
  "11-15": { title: "11 - 15 Tahun", subtitle: "Coding" },
};

export default function ModeSelect({ ageGroup, onBack, onMode }) {
  const info = LABELS[ageGroup] || {};
  const progress = loadProgress()[ageGroup];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <button
        onClick={onBack}
        className="self-start max-w-3xl w-full flex items-center gap-2 text-kk-inksoft hover:text-kk-ink text-sm font-extrabold mb-8 transition-colors"
      >
        <FaArrowLeft /> Ganti Umur
      </button>

      <motion.h1
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="font-display font-semibold text-4xl md:text-5xl mb-1.5 text-kk-ink"
      >
        {info.title}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-kk-inksoft font-bold mb-10"
      >
        Mau belajar dulu atau langsung tantangan?
      </motion.p>

      <div className="grid gap-6 w-full max-w-2xl sm:grid-cols-2">
        <motion.button
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 120 }}
          whileHover={{ x: -3, y: -3 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onMode("materi")}
          className="bg-kk-teal hover:bg-kk-tealdeep rounded-3xl border-[3px] border-kk-ink p-8 text-left text-white shadow-kk-lg transition-shadow"
        >
          <div className="w-12 h-12 rounded-xl bg-white/20 border-2 border-white/60 flex items-center justify-center mb-4">
            <FaBook className="text-xl" />
          </div>
          <div className="font-display font-semibold text-2xl">Materi</div>
          <p className="text-sm font-semibold text-white/95 mt-2 leading-snug">
            Baca materi seru step by step, dari dasar sampai mahir.
          </p>
        </motion.button>

        <motion.button
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
          whileHover={{ x: -3, y: -3 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onMode("challenge")}
          className="bg-kk-coral hover:bg-kk-coraldeep rounded-3xl border-[3px] border-kk-ink p-8 text-left text-white shadow-kk-lg transition-shadow"
        >
          <div className="w-12 h-12 rounded-xl bg-white/20 border-2 border-white/60 flex items-center justify-center mb-4">
            <FaGamepad className="text-xl" />
          </div>
          <div className="font-display font-semibold text-2xl">Challenge</div>
          <p className="text-sm font-semibold text-white/95 mt-2 leading-snug">{info.subtitle} — kumpulkan poin sebanyak-banyaknya!</p>
          {progress && (
            <div className="mt-3 inline-flex items-center gap-1 bg-kk-ink rounded-full px-3.5 py-1.5 text-xs font-extrabold">
              <FaStar className="text-kk-sun" /> {progress.totalScore || 0} poin · Level {progress.level || 1}
            </div>
          )}
        </motion.button>
      </div>
    </div>
  );
}
