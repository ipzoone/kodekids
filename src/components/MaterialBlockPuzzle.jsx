import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaArrowUp,
  FaArrowDown,
  FaArrowLeft,
  FaArrowRight,
  FaCat,
  FaFish,
  FaRobot,
  FaStar,
  FaCarrot,
  FaPuzzlePiece,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

const GAME_ICONS = {
  up: FaArrowUp,
  down: FaArrowDown,
  left: FaArrowLeft,
  right: FaArrowRight,
  cat: FaCat,
  fish: FaFish,
  robot: FaRobot,
  star: FaStar,
  carrot: FaCarrot,
};

function GameIcon({ name, className }) {
  const Icon = GAME_ICONS[name] || FaPuzzlePiece;
  return <Icon className={className} />;
}

export default function MaterialBlockPuzzle({ blocks }) {
  const [sequence, setSequence] = useState([]);
  const [feedback, setFeedback] = useState(null);

  if (!blocks || !blocks.moves || !blocks.goalIcon) return null;

  const target = blocks.moves;
  const goalIcon = blocks.goalIcon;
  const availableIcons = [...new Set(blocks.moves)];
  const isComplete = sequence.length === target.length;
  const isCorrect = isComplete && sequence.every((v, i) => v === target[i]);

  function addIcon(icon) {
    if (sequence.length >= target.length) return;
    setFeedback(null);
    setSequence((s) => [...s, icon]);
  }

  function removeAt(index) {
    setSequence((s) => s.filter((_, i) => i !== index));
  }

  function checkAnswer() {
    if (sequence.length !== target.length) {
      setFeedback({ ok: false, text: "Masih kurang langkah ya, coba lagi!" });
      return;
    }
    if (isCorrect) {
      setFeedback({ ok: true, text: "Pas sekali! Bloknya benar!" });
    } else {
      setFeedback({ ok: false, text: "Belum cocok ya, perhatikan urutannya!" });
    }
  }

  function resetPuzzle() {
    setSequence([]);
    setFeedback(null);
  }

  return (
    <div className="ml-9 mt-3 bg-kk-sun/15 border-2 border-kk-sun/40 rounded-2xl p-4">
      <div className="text-xs font-bold text-amber-700 mb-2 uppercase tracking-wide">
        Block Puzzle — Coba Susun!
      </div>

      {/* Target pattern */}
      <div className="mb-3">
        <div className="text-xs text-kk-inksoft font-bold mb-1.5">Target:</div>
        <div className="flex gap-2 justify-center flex-wrap items-center">
          {target.map((iconId, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-kk-inksoft text-sm">→</span>}
              <div className="w-11 h-11 rounded-lg bg-kk-indigo/80 border-2 border-kk-ink flex items-center justify-center">
                <GameIcon name={iconId} className="text-white text-xl" />
              </div>
            </React.Fragment>
          ))}
          <span className="text-kk-inksoft text-sm">→</span>
          <div className="w-11 h-11 rounded-lg bg-kk-sun/30 border-2 border-dashed border-amber-500 flex items-center justify-center">
            <GameIcon name={goalIcon} className="text-amber-600 text-xl" />
          </div>
        </div>
      </div>

      {/* User's arrangement */}
      <div className="mb-3">
        <div className="text-xs text-kk-inksoft font-bold mb-1.5">Susun di sini:</div>
        <div className="flex gap-2 justify-center flex-wrap min-h-[48px] items-center">
          {sequence.length === 0 && (
            <span className="text-kk-inksoft/50 self-center text-sm">ketuk ikon di bawah</span>
          )}
          {sequence.map((iconId, i) => (
            <motion.button
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => removeAt(i)}
              className="w-11 h-11 rounded-lg bg-kk-indigo/80 border-2 border-kk-ink flex items-center justify-center cursor-pointer"
            >
              <GameIcon name={iconId} className="text-white text-xl" />
            </motion.button>
          ))}
          {sequence.length < target.length && (
            <div className="w-11 h-11 rounded-lg border-2 border-dashed border-kk-ink/20 flex items-center justify-center" />
          )}
        </div>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`rounded-xl p-3 mb-3 text-sm font-bold border-2 ${
              feedback.ok
                ? "bg-emerald-100 border-emerald-500/50 text-emerald-800"
                : "bg-red-100 border-red-400/60 text-red-700"
            }`}
          >
            {feedback.ok ? <FaCheckCircle className="inline mr-1" /> : <FaTimesCircle className="inline mr-1" />}
            {feedback.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Palette */}
      <div className="flex gap-2 justify-center mb-3 flex-wrap">
        {availableIcons.map((iconId) => {
          const Icon = GAME_ICONS[iconId] || FaPuzzlePiece;
          return (
            <motion.button
              key={iconId}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => addIcon(iconId)}
              disabled={sequence.length >= target.length}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-kk-coral to-kk-coraldeep border-[2.5px] border-kk-ink shadow-kk-sm cursor-pointer flex items-center justify-center disabled:opacity-40"
            >
              <Icon className="text-white text-xl" />
            </motion.button>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={checkAnswer}
          disabled={sequence.length === 0}
          className="px-5 py-2 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 disabled:opacity-40 transition-colors"
        >
          Cek Jawaban
        </button>
        <button
          onClick={resetPuzzle}
          className="px-5 py-2 rounded-xl bg-kk-ink/10 text-kk-ink font-bold text-sm hover:bg-kk-ink/20 transition-colors"
        >
          Ulangi
        </button>
      </div>
    </div>
  );
}