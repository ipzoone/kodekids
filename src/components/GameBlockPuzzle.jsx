import React, { useEffect, useState, useRef } from "react";
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
  FaVolumeUp,
  FaStopwatch,
} from "react-icons/fa";
import { callGame, loadProgress, saveAgeProgress } from "../services/api";
import { Header, Centered } from "./Shared";

const AGE = "5-7";
const STEPS_PER_LEVEL = 5;
const TIME_ATTACK_LIMIT = 30;

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

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}s`;
}

export default function GameBlockPuzzle({ onHome, initialLevel, practice = false }) {
  const saved = loadProgress()[AGE] || {};
  const [level, setLevel] = useState((initialLevel ?? saved.level) || 1);
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

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const timerIntervalRef = useRef(null);

  // Best time per level
  const savedBestTime = (saved.bestTime || {})[level] || null;
  const [bestTime, setBestTime] = useState(savedBestTime);

  const [isSpeaking, setIsSpeaking] = useState(false);

  const isTimeAttack = level === 5;
  const timeRemaining = isTimeAttack ? Math.max(0, TIME_ATTACK_LIMIT - elapsed) : null;
  const isTimeLow = isTimeAttack && timeRemaining !== null && timeRemaining <= 8;
  const isTimeCritical = isTimeAttack && timeRemaining !== null && timeRemaining <= 3;
  const timePercent = isTimeAttack ? (timeRemaining / TIME_ATTACK_LIMIT) * 100 : null;

  // Preload speech synthesis voices (Chrome perlu event onvoiceschanged)
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    function loadVoices() {
      if (window.speechSynthesis.getVoices) {
        window.speechSynthesis.getVoices();
      }
    }
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Timer: reset/setiap challenge baru
  useEffect(() => {
    if (!challenge) return;
    setTimeUp(false);
    setFeedback(null);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const start = Date.now();
    setElapsed(0);
    timerIntervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [challenge]);

  // Time-up detection (level 5 time attack)
  useEffect(() => {
    if (isTimeAttack && timeRemaining === 0 && !timeUp && challenge) {
      setTimeUp(true);
      setFeedback({ ok: false, text: "Waktu Habis! Coba lagi ya!" });
      setAttemptCount((prev) => prev + 1);
      if (!practice) saveAgeProgress(AGE, { level, step, totalScore });
    }
  }, [timeRemaining, isTimeAttack, timeUp, challenge, practice, level, step, totalScore]);

  // Narasi suara (Web Speech API) - suara wanita santai & natural
  function speakNarration(text) {
    if (!text || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
    // Cari voice wanita Indonesia yang paling natural (prefer Google female)
    let idVoice =
      voices.find((v) => v.lang.startsWith("id") && v.name.toLowerCase().includes("female")) ||
      voices.find((v) => v.lang.startsWith("id") && v.name.toLowerCase().includes("google")) ||
      voices.find((v) => v.lang.startsWith("id") || v.lang.startsWith("in"));
    if (idVoice) utterance.voice = idVoice;
    else utterance.lang = "id-ID";
    utterance.rate = 1;
    utterance.pitch = 1.15;
    utterance.volume = 1;
    setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      const fallback = new SpeechSynthesisUtterance(text);
      fallback.lang = "id-ID";
      fallback.rate = 1;
      fallback.pitch = 1.15;
      window.speechSynthesis.speak(fallback);
    };
    window.speechSynthesis.speak(utterance);
  }

  // Auto narasi saat challenge baru / ganti level
  useEffect(() => {
    if (challenge?.narration) {
      const t = setTimeout(() => speakNarration(challenge.narration), 700);
      return () => clearTimeout(t);
    }
  }, [challenge]);

  // Reset timeUp saat user mulai ketuk ikon lagi
  function handleAddIcon(icon) {
    if (!challenge || sequence.length >= challenge.target.length) return;
    if (timeUp) {
      setTimeUp(false);
      setFeedback(null);
    }
    setSequence((s) => [...s, icon]);
  }

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
      if (res.bestTime) {
        setBestTime(res.bestTime);
      }
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

  function removeAt(index) {
    setSequence((s) => s.filter((_, i) => i !== index));
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const icon = e.dataTransfer.getData("text/plain");
    if (icon) handleAddIcon(icon);
  }

  async function submit() {
    if (!challenge || timeUp) return;
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
        bestTime: elapsed,
      });
      setFeedback({ ok: res.correct, text: res.feedback });
      setHint(res.hint || "");
      if (res.correct) {
        const newTotal = res.score ?? totalScore + 10 * level;
        const newLevel = res.level ?? level;
        const newStep = res.step ?? step;
        setTotalScore(newTotal);

        // Simpan best time
        const currentBest = (saved.bestTime || {})[level];
        if (!currentBest || elapsed < currentBest) {
          const updated = { ...(saved.bestTime || {}), [level]: elapsed };
          setBestTime(elapsed);
          if (!practice) {
            saveAgeProgress(AGE, {
              level: newLevel,
              step: newStep,
              totalScore: newTotal,
              bestTime: updated,
            });
          }
        } else {
          if (!practice) {
            saveAgeProgress(AGE, {
              level: newLevel,
              step: newStep,
              totalScore: newTotal,
            });
          }
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

      {/* Timer & Best Time */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {isTimeAttack && (
            <span
              className={`text-sm font-bold px-3 py-1 rounded-full border-2 flex items-center gap-1.5 ${
                isTimeCritical
                  ? "bg-red-500 text-white border-red-700 animate-pulse"
                  : isTimeLow
                    ? "bg-red-100 text-red-700 border-red-400 animate-pulse"
                    : "bg-kk-sun/30 text-kk-ink border-kk-ink/30"
              }`}
            >
              <FaStopwatch className="text-xs" /> {formatTime(timeRemaining)}
            </span>
          )}
          {!isTimeAttack && (
            <span className="text-sm font-bold text-kk-inksoft bg-kk-paper border-2 border-kk-ink/25 rounded-full px-3 py-1 flex items-center gap-1.5">
              <FaStopwatch className="text-xs" /> {formatTime(elapsed)}
            </span>
          )}
          {bestTime && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-300 rounded-full px-2 py-1">
              Best: {formatTime(bestTime)}
            </span>
          )}
        </div>
        {isTimeAttack && (
          <div className="w-24 h-2.5 bg-kk-paper border-2 border-kk-ink/20 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                isTimeCritical
                  ? "bg-red-500"
                  : isTimeLow
                    ? "bg-red-400"
                    : "bg-emerald-500"
              }`}
              style={{ width: `${timePercent}%` }}
            />
          </div>
        )}
      </div>

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
              <span className="flex items-center gap-2">
                <span>
                  {challenge.story}{" "}
                  <span className="text-kk-inksoft text-sm font-semibold">({challenge.goalDesc})</span>
                </span>
                {challenge.narration && (
                  <button
                    onClick={() => speakNarration(challenge.narration)}
                    disabled={isSpeaking}
                    className={`flex items-center gap-1 text-xs font-bold transition-colors ${
                      isSpeaking
                        ? "text-emerald-600 cursor-default"
                        : "text-kk-indigo hover:text-kk-indigo/80"
                    }`}
                    title={isSpeaking ? "Sedang berbicara..." : "Dengar narasi"}
                    aria-label="Dengar narasi"
                  >
                    {isSpeaking ? (
                      <span className="flex items-center gap-0.5">
                        <span className="inline-block w-1 h-3 bg-emerald-600 rounded-full animate-pulse" />
                        <span className="inline-block w-1 h-4 bg-emerald-600 rounded-full animate-pulse [animation-delay:0.15s]" />
                        <span className="inline-block w-1 h-5 bg-emerald-600 rounded-full animate-pulse [animation-delay:0.3s]" />
                        Berbicara
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <FaVolumeUp /> Dengar
                      </span>
                    )}
                  </button>
                )}
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
                <span className="text-kk-inksoft/60 self-center">{timeUp ? "Ketuk ikon di bawah untuk coba lagi" : "kosong..."}</span>
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
                onClick={() => handleAddIcon(iconId)}
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

          {/* Tombol aksi */}
          <div className="flex gap-2 justify-center">
            {timeUp ? (
              <button onClick={() => fetchChallenge(level, step)} className="btn-game">
                Coba Lagi!
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={loading || sequence.length === 0}
                className="btn-game w-full disabled:opacity-40"
              >
                {loading ? "Memeriksa..." : "Periksa Jawaban"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}