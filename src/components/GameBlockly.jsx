import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Blockly from "blockly";
import { javascriptGenerator, Order as JsOrder } from "blockly/javascript";
import { pythonGenerator } from "blockly/python";
import { FaCubes, FaLightbulb, FaStar } from "react-icons/fa";
import { SiJavascript, SiPython } from "react-icons/si";
import { callGame, loadProgress, saveAgeProgress } from "../services/api";
import { Header, Centered, LanguagePicker } from "./Shared";

const AGE = "8-10";

const LANGUAGES = [
  { id: "javascript", name: "JavaScript", Icon: SiJavascript, gradient: "from-yellow-400 to-amber-500" },
  { id: "python", name: "Python", Icon: SiPython, gradient: "from-sky-500 to-blue-600" },
];

// Toolbox lengkap dengan semua kategori blok dasar
function makeToolbox() {
  return {
    kind: "categoryToolbox",
    contents: [
      {
        kind: "category",
        name: "Teks & Cetak",
        colour: "#5ba58c",
        contents: [
          { kind: "block", type: "text_print" },
          { kind: "block", type: "text" },
        ],
      },
      {
        kind: "category",
        name: "Perulangan",
        colour: "#5ba55b",
        contents: [
          {
            kind: "block",
            type: "controls_repeat_ext",
            inputs: { TIMES: { shadow: { type: "math_number", fields: { NUM: 3 } } } },
          },
          {
            kind: "block",
            type: "controls_whileUntil",
            fields: { MODE: "WHILE" },
          },
          { kind: "block", type: "controls_forEach" },
        ],
      },
      {
        kind: "category",
        name: "Logika",
        colour: "#5b80a5",
        contents: [
          {
            kind: "block",
            type: "controls_if",
            // shadow = placeholder yang bisa langsung diklik di socket kosong
            values: {
              IF0: { shadow: { type: "logic_boolean", fields: { BOOL: "TRUE" } } },
            },
          },
          {
            kind: "block",
            type: "logic_compare",
            fields: { OP: "EQ" },
            inputs: {
              A: { shadow: { type: "math_number", fields: { NUM: 1 } } },
              B: { shadow: { type: "math_number", fields: { NUM: 1 } } },
            },
          },
          { kind: "block", type: "logic_operation" },
          { kind: "block", type: "logic_negate" },
          { kind: "block", type: "logic_boolean" },
        ],
      },
      {
        kind: "category",
        name: "Matematika",
        colour: "#5b67a5",
        contents: [
          { kind: "block", type: "math_number", fields: { NUM: 1 } },
          { kind: "block", type: "math_arithmetic" },
          { kind: "block", type: "math_modulo" },
        ],
      },
      {
        kind: "category",
        name: "Variabel",
        colour: "#a55b80",
        custom: "VARIABLE",
      },
    ],
  };
}

export default function GameBlockly({ onHome }) {
  const saved = loadProgress()[AGE] || {};
  const [level, setLevel] = useState(saved.level || 1);
  const [totalScore, setTotalScore] = useState(saved.totalScore || 0);
  const [challenge, setChallenge] = useState(null);
  const [language, setLanguage] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [hint, setHint] = useState("");
  const [attemptCount, setAttemptCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);

  const wsRef = useRef(null);
  const containerRef = useRef(null);

  // Fungsi untuk memulai challenge baru
  async function fetchChallenge(lvl, lang) {
    setLoading(true);
    setFeedback(null);
    setHint("");
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
    } catch (e) {
      setFeedback({ ok: false, text: "Gagal memuat tantangan: " + e.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchChallenge(level, language || "javascript");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, level]);

  // Inisialisasi Blockly workspace saat challenge berubah + preview kode
  const [previewCode, setPreviewCode] = useState("");
  useEffect(() => {
    if (!challenge || !containerRef.current) return;

    // Label blok menyesuaikan bahasa yang dipilih:
    // JavaScript -> console.log & var x = ..., Python -> print & set x to ...
    const isJs = language !== "python";
    if (isJs) {
      Blockly.Msg.TEXT_PRINT_TITLE = "console.log %1";
      Blockly.Msg.VARIABLES_SET = "var %1 = %2";
      Blockly.Msg.VARIABLES_GET_CREATE_SET = "var";
      Blockly.Msg.CONTROLS_REPEAT_TITLE = "ulangi %1 kali";
    } else {
      Blockly.Msg.TEXT_PRINT_TITLE = "print %1";
      Blockly.Msg.VARIABLES_SET = "set %1 ke %2";
      Blockly.Msg.VARIABLES_GET_CREATE_SET = "buat";
      Blockly.Msg.CONTROLS_REPEAT_TITLE = "ulangi %1 kali";
    }

    // Generator JS: blok cetak memakai console.log (bukan window.alert)
    javascriptGenerator.forBlock["text_print"] = function (block, generator) {
      const msg =
        generator.valueToCode(block, "TEXT", JsOrder.NONE) || "''";
      return `console.log(${msg});\n`;
    };

    const workspace = Blockly.inject(containerRef.current, {
      toolbox: makeToolbox(),
      grid: { spacing: 25, length: 3, colour: "#ccc", snap: true },
      zoom: { controls: true, wheel: true, startScale: 0.9 },
      move: { scrollbars: true, drag: true, wheel: true },
      trashcan: true,
      renderer: "zelos",
      theme: Blockly.Themes.Default,
    });
    wsRef.current = workspace;
    const updateCode = () => {
      try {
        const generator = language === "python" ? pythonGenerator : javascriptGenerator;
        setPreviewCode(generator.workspaceToCode(workspace) || "");
      } catch {}
    };
    workspace.addChangeListener(updateCode);
    updateCode();
    return () => {
      workspace.dispose();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge, language]);

  async function submit() {
    if (!wsRef.current || !challenge) return;
    setLoading(true);
    try {
      const blocks = Blockly.serialization.workspaces.save(wsRef.current);
      const res = await callGame({
        action: "submit",
        ageGroup: AGE,
        language,
        level,
        score: totalScore,
        attemptCount,
        lastError: feedback?.text || "",
        challenge,
        submission: { blocks },
      });
      setFeedback({ ok: res.correct, text: res.feedback });
      setHint(res.hint || "");
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
    setLanguage(null);
  }

  if (finished) {
    return (
      <Centered>
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <h2 className="font-display font-semibold text-3xl text-kk-ink mb-2">Luar Biasa!</h2>
          <p className="text-kk-inksoft font-bold mb-4">Semua tantangan Blockly selesai!</p>
          <p className="text-5xl font-extrabold text-amber-500 mb-6 flex items-center justify-center gap-2">
            <FaStar /> {totalScore}
          </p>
          <button onClick={restart} className="btn-game">Main Lagi</button>
          <button onClick={onHome} className="btn-game-secondary ml-2">Beranda</button>
        </motion.div>
      </Centered>
    );
  }

  // ===== Layar pemilih bahasa =====
  if (!language) {
    return (
      <LanguagePicker
        title="Blockly Coding"
        icon={FaCubes}
        languages={LANGUAGES}
        onPick={setLanguage}
        onHome={onHome}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Header onHome={onHome} icon={FaCubes} title="Blockly Coding" level={level} score={totalScore} />

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
              <span className="text-kk-inksoft text-sm font-normal">Level {level}</span>
            </div>
            <div className="text-kk-inksoft italic text-sm mb-2">{challenge.story}</div>
            <div className="text-sm text-kk-ink">{challenge.desc}</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div
              ref={containerRef}
              className="w-full lg:col-span-2 rounded-xl overflow-hidden border-[2.5px] border-kk-ink shadow-kk-sm"
              style={{ height: "min(70vh, 650px)", background: "#f7f7f8" }}
            />
            <div
              className="rounded-xl overflow-hidden border border-white/10 bg-[#1e1e1e] p-3 flex flex-col"
              style={{ height: "min(70vh, 650px)" }}
            >
              <div className="text-xs font-bold text-white/40 mb-2 uppercase tracking-wide">
                Kode {language === "python" ? "Python" : "JavaScript"}
              </div>
              <pre className="text-sm font-mono text-emerald-200 whitespace-pre-wrap overflow-auto flex-1">
                {previewCode || "// susun blok di sebelah kiri,\n// kode akan muncul di sini"}
              </pre>
            </div>
          </div>

          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`rounded-2xl p-4 mt-4 font-bold border-2 ${
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
                className="rounded-2xl bg-kk-sun/30 border-2 border-kk-sun text-yellow-900 p-4 mt-3 flex gap-2"
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
            className="btn-game w-full mt-4 disabled:opacity-40"
          >
            <FaLightbulb className="mr-2" />
            <span>{loading ? "Memeriksa..." : "Kirim Program"}</span>
          </button>
        </>
      )}
    </div>
  );
}
