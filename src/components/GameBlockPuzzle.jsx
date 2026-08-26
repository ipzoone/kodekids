import React, { useEffect, useState } from "react";
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
  FaLightbulb,
  FaPuzzlePiece,
} from "react-icons/fa";
import { callGame, loadProgress, saveAgeProgress } from "../services/api";
import { Header, Centered } from "./Shared";

const AGE = "5-7";
const STEPS_PER_LEVEL = 5;

// Peta ikon game — backend mengirim identifier, frontend yang merender
export const GAME_ICONS = {
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

export default function GameBlockPuzzle({ onHome, initialLevel, practice = false }) {
  const saved = loadProgress()[AGE] || {};
  const [level, setLevel] = useState((initialLevel ?? saved.level) || 1);
  // Latihan level lama selalu mulai dari soal pertama; melanjutkan level terbuka lanjut dari soal tersimpan
  const [step, setStep] = useState(
    initialLevel != null && initialLevel !== saved.level ? 1 : saved.step || 1,
  );
  const [totalScore, setTotalScore] = useState(saved.totalScore || 0);
  const [challenge, setChallenge] = useState(null);
  const [sequence, setSequence] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [hint, setHint] = useState("");
  const [attemptCount, setAttemptCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function fetchChallenge(lvl, stp) {
    setLoading(true);
    setFeedback(null);
    setHint("");
    setSequence([]);
    try {
      const res = await callGame({
        action: "start",
        ageGroup: AGE,
        level: lvl,
        step: stp,
        score: 0,
        attemptCount: 0,
      });
      setChallenge(res.challenge);
    } catch (e) {
      setFeedback({ ok: false, text: "Gagal memuat soal: " + e.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchChallenge(level, step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, step]);

  function addIcon(icon) {
    if (!challenge || sequence.length >= challenge.target.length) return;
    setSequence((s) => [...s, icon]);
  }

  function removeAt(index) {
    setSequence((s) => s.filter((_, i) => i !== index));
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const icon = e.dataTransfer.getData("text/plain");
    if (icon) addIcon(icon);
  }

  async function submit() {
    if (!challenge) return;
    setLoading(true);
    try {
      const res = await callGame({
        action: "submit",
        ageGroup: AGE,
        level,
        step,
        score: totalScore,
        attemptCount,
        lastError: feedback?.text || "",
        challenge,
        submission: { sequence },
      });
      setFeedback({ ok: res.correct, text: res.feedback });
      setHint(res.hint || "");
      if (res.correct) {
        const newTotal = res.score ?? totalScore + 10 * level;
        const newLevel = res.level ?? level;
        const newStep = res.step ?? step;
        setTotalScore(newTotal);
        if (!practice) {
          saveAgeProgress(AGE, {
            level: newLevel,
            step: newStep,
            totalScore: newTotal,
          });
        }
        setTimeout(() => {
          if (res.finished) {
            setFinished(true);
          } else {
            setLevel(newLevel);
            setStep(newStep);
          }
        }, 1600);
      } else {
        const nextAttempt = attemptCount + 1;
        setAttemptCount(nextAttempt);
        if (!practice) saveAgeProgress(AGE, { level, step, totalScore });
      }
    } catch (e) {
      setFeedback({ ok: false, text: "Gagal mengirim: " + e.message });
    } finally {
      setLoading(false);
    }
  }

  function restart() {
    setFinished(false);
    setTotalScore(0);
    if (practice) {
      // Mode latihan: ulangi level yang sama tanpa menyentuh progres tersimpan
      setStep(1);
    } else {
      setLevel(1);
      setStep(1);
      saveAgeProgress(AGE, { level: 1, step: 1, totalScore: 0 });
    }
  }

  if (finished) {
    return (
      <Centered>
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <h2 className="font-display font-semibold text-3xl text-kk-ink mb-2">
            {practice ? "Latihan Selesai!" : "Selamat!"}
          </h2>
          <p className="text-kk-inksoft font-bold mb-4">
            {practice
              ? `Level ${level} selesai kamu mainkan lagi. Progres utamamu tetap aman!`
              : "Kamu menyelesaikan semua puzzle!"}
          </p>
          <p className="text-5xl font-extrabold text-amber-500 mb-6 flex items-center justify-center gap-2">
            <FaStar /> {totalScore}
          </p>
          <button onClick={restart} className="btn-game">Main Lagi</button>
          <button onClick={onHome} className="btn-game-secondary ml-2">Beranda</button>
        </motion.div>
      </Centered>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Header onHome={onHome} icon={FaPuzzlePiece} title="Block Puzzle" level={level} score={totalScore} />

      {loading && !challenge && <p className="text-center text-kk-inksoft mt-10">Memuat puzzle...</p>}

      {challenge && (
        <>
          <motion.div
            key={challenge.story}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-kk-paper border-[2.5px] border-kk-ink shadow-kk-sm rounded-2xl p-4 mb-4 text-lg text-kk-ink"
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span>
                {challenge.story}{" "}
                <span className="text-kk-inksoft text-sm font-semibold">({challenge.goalDesc})</span>
              </span>
              {/* Progres soal dalam level ini */}
              <div className="flex items-center gap-1.5 shrink-0">
                {Array.from({ length: STEPS_PER_LEVEL }, (_, i) => i + 1).map((n) => (
                  <span
                    key={n}
                    title={n < step ? "Selesai" : n === step ? "Sedang dikerjakan" : "Terisi setelah soal ini benar"}
                    className={`w-3 h-3 rounded-full border-2 border-kk-ink ${
                      n < step ? "bg-emerald-500" : n === step ? "bg-kk-sun" : "bg-white"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="text-kk-inksoft text-xs font-bold mt-1.5 uppercase tracking-wide">
              Level {level} · Soal {step}/{STEPS_PER_LEVEL}
            </div>
          </motion.div>

          {/* Pola target */}
          <div className="bg-kk-paper border-2 border-kk-ink/20 rounded-2xl p-4 mb-4">
            <div className="text-sm text-kk-inksoft font-bold mb-2">Susun sesuai pola ini:</div>
            <div className="flex gap-2 justify-center flex-wrap">
              {challenge.target.map((iconId, i) => (
                <div
                  key={i}
                  className="w-14 h-14 rounded-xl bg-kk-sun/30 border-2 border-dashed border-amber-500 flex items-center justify-center"
                >
                  <GameIcon name={iconId} className="text-3xl text-amber-600" />
                </div>
              ))}
            </div>
          </div>

          {/* Slot jawaban (drop zone) */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`rounded-2xl p-4 mb-4 border-2 transition-colors ${
              dragOver ? "bg-kk-indigo/15 border-kk-indigo" : "bg-kk-paper border-kk-ink/20"
            }`}
          >
            <div className="text-sm text-kk-inksoft font-bold mb-2">
              Jawabanmu (tarik ikon ke sini atau klik):
            </div>
            <div className="flex gap-2 justify-center flex-wrap min-h-[56px] items-center">
              {sequence.length === 0 && (
                <span className="text-kk-inksoft/60 self-center">kosong...</span>
              )}
              {sequence.map((iconId, i) => (
                <motion.button
                  key={i}
                  layout
                  whileTap={{ scale: 0.85 }}
                  onClick={() => removeAt(i)}
                  className="w-14 h-14 rounded-xl bg-kk-indigo/80 border-2 border-kk-ink flex items-center justify-center"
                  title="Klik untuk hapus"
                >
                  <GameIcon name={iconId} className="text-3xl text-white" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Palet ikon */}
          <div className="flex gap-3 justify-center mb-4">
            {challenge.availableIcons.map((iconId) => (
              <motion.button
                key={iconId}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", iconId)}
                whileHover={{ scale: 1.15, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => addIcon(iconId)}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-kk-coral to-kk-coraldeep border-[2.5px] border-kk-ink shadow-kk-sm cursor-grab active:cursor-grabbing flex items-center justify-center"
              >
                <GameIcon name={iconId} className="text-3xl text-white" />
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`rounded-2xl p-4 mb-3 font-bold border-2 ${
                  feedback.ok
                    ? "bg-emerald-100 border-emerald-500/50 text-emerald-800"
                    : "bg-red-100 border-red-400/60 text-red-700"
                }`}
              >
                {feedback.text}
              </motion.div>
            )}
            {hint && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="rounded-2xl bg-kk-sun/30 border-2 border-kk-sun text-yellow-900 p-4 mb-3 flex gap-2"
              >
                <FaLightbulb className="mt-1 shrink-0" />
                <span>
                  <b>Petunjuk:</b> {hint}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={submit}
            disabled={loading || sequence.length === 0}
            className="btn-game w-full disabled:opacity-40"
          >
            {loading ? "Memeriksa..." : "Periksa Jawaban"}
          </button>
        </>
      )}
    </div>
  );
}
