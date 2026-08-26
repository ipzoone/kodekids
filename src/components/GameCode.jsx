import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";
import { FaCode, FaLightbulb, FaPlay, FaStar } from "react-icons/fa";
import { SiJavascript, SiPython } from "react-icons/si";
import { callGame, callRunner, loadProgress, saveAgeProgress } from "../services/api";
import { Header, Centered, LanguagePicker } from "./Shared";

const AGE = "11-15";

const LANGUAGES = [
  {
    id: "python",
    name: "Python",
    Icon: SiPython,
    gradient: "from-sky-500 to-blue-600",
    monaco: "python",
  },
  {
    id: "javascript",
    name: "JavaScript",
    Icon: SiJavascript,
    gradient: "from-yellow-400 to-amber-500",
    monaco: "javascript",
  },
];

export default function GameCode({ onHome }) {
  const saved = loadProgress()[AGE] || {};
  const [language, setLanguage] = useState(null);
  const [level, setLevel] = useState(saved.level || 1);
  const [totalScore, setTotalScore] = useState(saved.totalScore || 0);
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [hint, setHint] = useState("");
  const [sandboxOutput, setSandboxOutput] = useState("");
  const [attemptCount, setAttemptCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);

  const langConfig = LANGUAGES.find((l) => l.id === language);

  // Output realtime: jalankan kode di sandbox (mode "run") dengan debounce
  // setiap kali user berhenti mengetik.
  useEffect(() => {
    if (!code || !code.trim()) {
      setSandboxOutput("");
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const run = await callRunner({ language, code, mode: "run" });
        setSandboxOutput(run.output || "(kode berjalan tanpa output)");
      } catch {
        // diamkan, jangan ganggu user yang masih mengetik
      }
    }, 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, language]);

  async function fetchChallenge(lvl, lang) {
    setLoading(true);
    setFeedback(null);
    setHint("");
    setSandboxOutput("");
    try {
      const res = await callGame({
        action: "start",
        ageGroup: AGE,
        language: lang,
        level: lvl,
        score: 0,
        attemptCount: 0,
      });
      setChallenge(res.challenge);
      setCode(res.challenge.starterCode || "");
    } catch (e) {
      setFeedback({ ok: false, text: "Gagal memuat tantangan: " + e.message });
    } finally {
      setLoading(false);
    }
  }

  function pickLanguage(lang) {
    setLanguage(lang);
    fetchChallenge(level, lang);
  }

  useEffect(() => {
    // fetchChallenge dipanggil dari pickLanguage / naik level
    if (language && level > 1) fetchChallenge(level, language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  async function submit() {
    if (!challenge) return;
    setLoading(true);
    try {
      // 1. Jalankan kode di Sandbox via agent /runner
      const run = await callRunner({
        language,
        code,
        tests: challenge.tests || [],
      });
      setSandboxOutput(run.output || run.error || "");
      if (!run.ok) throw new Error(run.error || "Sandbox gagal menjalankan kode");

      // 2. Kirim verdict ke cloud function untuk penilaian & state
      const res = await callGame({
        action: "submit",
        ageGroup: AGE,
        language,
        level,
        score: totalScore,
        attemptCount,
        lastError: (sandboxOutput || feedback?.text || "").slice(0, 200),
        challenge,
        submission: { code, verdict: run.verdict, output: run.output },
      });
      setFeedback({ ok: res.correct, text: res.feedback });
      setHint(res.hint || "");
      setSandboxOutput(res.sandboxOutput || "");
      if (res.correct) {
        const newTotal = totalScore + 10 * level;
        setTotalScore(newTotal);
        saveAgeProgress(AGE, { level: res.finished ? 1 : res.level, totalScore: newTotal });
        setTimeout(() => {
          if (res.finished) setFinished(true);
          else setLevel(res.level);
        }, 1800);
      } else {
        setAttemptCount((a) => a + 1);
        saveAgeProgress(AGE, { level, totalScore });
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
    setLevel(1);
    saveAgeProgress(AGE, { level: 1, totalScore: 0 });
    setLanguage(null); // kembali ke pemilih bahasa
  }

  // ===== Layar pemilih bahasa =====
  if (!language) {
    return (
      <LanguagePicker
        title="Coding"
        icon={FaCode}
        languages={LANGUAGES}
        onPick={pickLanguage}
        onHome={onHome}
      />
    );
  }

  if (finished) {
    return (
      <Centered>
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <h2 className="font-display font-semibold text-3xl text-kk-ink mb-2">Coding Master!</h2>
          <p className="text-kk-inksoft font-bold mb-4">
            Semua tantangan {langConfig?.name} berhasil kamu taklukkan!
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Header onHome={onHome} icon={FaCode} title={`Coding`} level={level} score={totalScore} />

      {loading && !challenge && (
        <p className="text-center text-kk-inksoft mt-10">Menyiapkan tantangan...</p>
      )}

      {!loading && !challenge && feedback && (
        <p className="text-center text-red-600 font-bold mt-10">{feedback.text}</p>
      )}

      {challenge && (
        <>
          <div className="bg-kk-paper border-[2.5px] border-kk-ink shadow-kk-sm rounded-2xl p-4 mb-4">
            <div className="font-bold text-lg mb-1 text-kk-ink">
              {challenge.title}{" "}
              <span className="text-kk-inksoft text-sm font-normal">
                Level {level} • {langConfig?.name}
              </span>
            </div>
            <pre className="text-sm whitespace-pre-wrap font-sans text-kk-ink">
              {challenge.description}
            </pre>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <div className="lg:col-span-2 rounded-xl overflow-hidden border-[2.5px] border-kk-ink shadow-kk-sm">
              <Editor
                height="min(70vh, 650px)"
                language={langConfig?.monaco || "python"}
                theme="vs-dark"
                value={code}
                onChange={(v) => setCode(v ?? "")}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  tabSize: 4,
                  automaticLayout: true,
                }}
                loading={
                  <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-white/60">
                    Memuat editor...
                  </div>
                }
              />
            </div>

            <div
              className="rounded-xl overflow-hidden border-[2.5px] border-kk-ink bg-kk-ink p-3 flex flex-col"
              style={{ height: "min(70vh, 650px)" }}
            >
              <div className="text-xs font-bold text-white/40 mb-2 uppercase tracking-wide">
                Output (realtime)
              </div>
              <pre className="text-sm font-mono text-green-200 whitespace-pre-wrap overflow-auto flex-1">
                {sandboxOutput || "# jalankan kode untuk melihat output"}
              </pre>
            </div>
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
            disabled={loading}
            className="btn-game w-full disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <FaPlay />
            {loading ? "Menjalankan di Sandbox..." : "Jalankan & Periksa"}
          </button>
        </>
      )}
    </div>
  );
}
