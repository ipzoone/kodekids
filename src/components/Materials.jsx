import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import * as Blockly from "blockly";
import {
  FaBook,
  FaLightbulb,
  FaSortNumericDown,
  FaShapes,
  FaBalanceScale,
  FaSearch,
  FaTerminal,
  FaBoxOpen,
  FaSyncAlt,
  FaCodeBranch,
  FaGlobe,
  FaCalculator,
  FaArrowLeft,
  FaArrowRight,
  FaCheckCircle,
  FaStar,
} from "react-icons/fa";
import MaterialBlockPuzzle from "./MaterialBlockPuzzle";

const ICONS = {
  FaBook,
  FaLightbulb,
  FaSortNumericDown,
  FaShapes,
  FaBalanceScale,
  FaSearch,
  FaTerminal,
  FaBoxOpen,
  FaSyncAlt,
  FaCodeBranch,
  FaGlobe,
  FaCalculator,
};

const COLORS = {
  amber: { bg: "bg-amber-400", text: "text-amber-300", solid: "bg-amber-500" },
  emerald: { bg: "bg-emerald-500", text: "text-emerald-300", solid: "bg-emerald-600" },
  sky: { bg: "bg-sky-500", text: "text-sky-300", solid: "bg-sky-600" },
  rose: { bg: "bg-rose-500", text: "text-rose-300", solid: "bg-rose-600" },
  violet: { bg: "bg-violet-500", text: "text-violet-300", solid: "bg-violet-600" },
};

const AGE_LABELS = {
  "5-7": "5 - 7 Tahun",
  "8-10": "8 - 10 Tahun",
  "11-15": "11 - 15 Tahun",
};
const ALL_GROUPS = ["5-7", "8-10", "11-15"];

// Render workspace Blockly read-only dari JSON serialisasi (untuk materi 8-10)
function BlockDemo({ json }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !json) return;
    let ws;
    try {
      ws = Blockly.inject(ref.current, {
        readOnly: true,
        renderer: "zelos",
        scrollbars: false,
        sounds: false,
        grid: { spacing: 20, length: 2, colour: "#e8e8e8", snap: false },
        zoom: { startScale: 0.85, controls: false, wheel: false, pinch: false },
        move: { scrollbars: false, drag: false, wheel: false },
      });
      Blockly.serialization.workspaces.load(json, ws);
      const t = setTimeout(() => {
        try {
          Blockly.svgResize(ws);
        } catch {}
      }, 50);
      return () => {
        clearTimeout(t);
        try {
          ws.dispose();
        } catch {}
      };
    } catch {
      return undefined;
    }
  }, [json]);

  return (
    <div
      ref={ref}
      className="rounded-xl bg-white border-2 border-kk-ink/15 my-3 overflow-hidden"
      style={{ height: json?.blocks?.blocks?.length > 1 ? 190 : 110 }}
    />
  );
}

function CodeBlock({ code }) {
  const isPy = code.language === "python";
  return (
    <div className="rounded-xl overflow-hidden border-[2.5px] border-kk-ink shadow-kk-sm my-3">
      <div
        className={`px-4 py-1.5 text-xs font-bold ${
          isPy ? "bg-sky-600" : "bg-yellow-500 text-slate-900"
        }`}
      >
        {isPy ? "Python" : "JavaScript"}
      </div>
      <pre className="bg-[#16181d] p-4 text-sm font-mono text-emerald-200 whitespace-pre-wrap overflow-x-auto">
        {code.snippet}
      </pre>
    </div>
  );
}

export default function Materials({ ageGroup, onHome }) {
  // ageGroup = null berarti tampilkan semua kelompok umur
  const [items, setItems] = useState([]); // tiap item punya .ageGroup
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [readMap, setReadMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("materi-read")) || {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const groups = ageGroup ? [ageGroup] : ALL_GROUPS;
    setLoading(true);
    setError("");
    (async () => {
      try {
        const results = await Promise.all(
          groups.map((g) =>
            fetch(`/api/materials?ageGroup=${encodeURIComponent(g)}`).then((r) => r.json()),
          ),
        );
        const all = results.flatMap((data, i) =>
          data.ok ? data.materials.map((m) => ({ ...m, ageGroup: groups[i] })) : [],
        );
        setItems(all);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [ageGroup]);

  function markDone(item) {
    const ag = item.ageGroup;
    const list = readMap[ag] || [];
    const next = { ...readMap, [ag]: list.includes(item.order) ? list : [...list, item.order] };
    setReadMap(next);
    localStorage.setItem("materi-read", JSON.stringify(next));
  }

  function isRead(item) {
    return (readMap[item.ageGroup] || []).includes(item.order);
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <p className="text-kk-inksoft animate-pulse">Memuat materi...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-600 font-bold">{error}</p>
        <button onClick={onHome} className="btn-game">Kembali</button>
      </div>
    );
  }

  // ===== Tampilan baca satu materi =====
  if (current) {
    const c = COLORS[current.color] || COLORS.emerald;
    const Icon = ICONS[current.icon] || FaBook;
    const siblings = items.filter((m) => m.ageGroup === current.ageGroup);
    const idx = siblings.findIndex((m) => m.order === current.order);
    const prev = siblings[idx - 1];
    const next = siblings[idx + 1];
    const done = isRead(current);

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => setCurrent(null)}
          className="flex items-center gap-2 text-kk-inksoft hover:text-kk-ink text-sm font-bold mb-6 transition-colors"
        >
          <FaArrowLeft /> Daftar Materi
        </button>

        <motion.div
          key={current.ageGroup + current.order}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className={`${c.solid} rounded-3xl p-8 shadow-xl shadow-black/30`}
        >
          <Icon className="text-5xl mb-4" />
          <span className="inline-block bg-black/25 rounded-full px-3 py-1 text-xs font-bold mb-3">
            Untuk umur {AGE_LABELS[current.ageGroup]}
          </span>
          <h1 className="text-3xl font-extrabold">{current.title}</h1>
          <p className="font-semibold text-white/90 mt-1">{current.subtitle}</p>
        </motion.div>

        <div className="mt-6 space-y-6">
          <p className="text-lg text-kk-ink leading-relaxed border-l-4 border-kk-indigo/40 pl-4 italic">
            {current.content.intro}
          </p>

          {current.content.sections?.map((s, i) => (
            <div key={i}>
              <h2 className="text-xl font-extrabold mb-2 flex items-center gap-2">
                <span className={`w-7 h-7 rounded-full ${c.bg} inline-flex items-center justify-center text-sm`}>
                  {i + 1}
                </span>
                {s.heading}
              </h2>
              {s.body && <p className="text-kk-inksoft leading-relaxed ml-9">{s.body}</p>}
              {s.blocks && (
                <div className="ml-9">
                  <BlockDemo json={s.blocks} />
                </div>
              )}
              {s.code && (
                <div className="ml-9">
                  <CodeBlock code={s.code} />
                </div>
              )}
            </div>
          ))}

          {current.content.blocks && (
            <MaterialBlockPuzzle blocks={current.content.blocks} />
          )}

          {current.content.tip && (
            <div className="flex gap-3 bg-kk-sun/25 border-2 border-kk-sun rounded-2xl p-4">
              <FaStar className="mt-1 shrink-0 text-amber-500" />
              <p className="text-sm"><b>Tips:</b> {current.content.tip}</p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center gap-3 mt-10">
          {prev ? (
            <button onClick={() => setCurrent(prev)} className="btn-game-secondary flex items-center gap-2">
              <FaArrowLeft /> Sebelumnya
            </button>
          ) : <span />}

          {!done ? (
            <button onClick={() => markDone(current)} className="btn-game flex items-center gap-2">
              <FaCheckCircle /> Tandai Sudah Dibaca
            </button>
          ) : (
            <span className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
              <FaCheckCircle /> Sudah dibaca
            </span>
          )}

          {next ? (
            <button onClick={() => setCurrent(next)} className="btn-game flex items-center gap-2">
              Lanjut <FaArrowRight />
            </button>
          ) : <span />}
        </div>
      </div>
    );
  }

  // ===== Daftar semua materi (dikelompokkan per umur bila tanpa filter) =====
  const groups = ageGroup ? [ageGroup] : ALL_GROUPS;
  const totalDone = items.filter(isRead).length;

  function MaterialCard({ m }) {
    const c = COLORS[m.color] || COLORS.emerald;
    const Icon = ICONS[m.icon] || FaBook;
    const done = isRead(m);
    return (
      <motion.button
        key={m.ageGroup + m.order}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setCurrent(m)}
        className="text-left rounded-3xl p-6 bg-kk-paper border-[2.5px] border-kk-ink shadow-kk-md hover:-translate-y-0.5 transition-transform"
      >
        <div className="flex items-start gap-4">
          <div className={`${c.bg} w-14 h-14 rounded-xl border-2 border-kk-ink flex items-center justify-center shrink-0`}>
            <Icon className="text-2xl" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-kk-inksoft">Materi {m.order}</span>
              {done && <FaCheckCircle className="text-emerald-500 text-xs" />}
            </div>
            <div className="font-extrabold text-lg leading-tight mt-0.5 text-kk-ink">{m.title}</div>
            <p className="text-sm text-kk-inksoft mt-1">{m.subtitle}</p>
          </div>
        </div>
      </motion.button>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button
        onClick={onHome}
        className="flex items-center gap-2 text-kk-inksoft hover:text-kk-ink text-sm font-bold mb-6 transition-colors"
      >
        <FaArrowLeft /> Beranda
      </button>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-2">
        <div>
          <h1 className="font-display font-semibold text-3xl flex items-center gap-3 text-kk-ink">
            <FaBook className="text-kk-sun" />
            {ageGroup ? "Materi Belajar" : "Semua Materi"}
          </h1>
          <p className="text-kk-inksoft font-bold text-sm mt-1">Baca dulu, biar makin jago waktu challenge!</p>
        </div>
        <span className="bg-kk-paper border-2 border-kk-ink/25 rounded-full px-4 py-1.5 text-xs font-bold text-kk-ink">
          {totalDone}/{items.length} selesai dibaca
        </span>
      </div>

      {groups.map((g) => {
        const groupItems = items.filter((m) => m.ageGroup === g);
        if (!groupItems.length) return null;
        return (
          <div key={g} className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-display font-semibold text-xl text-kk-ink">{AGE_LABELS[g]}</h2>
              <span className="bg-kk-indigo/10 text-kk-indigodeep rounded-full px-3 py-1 text-xs font-bold">
                untuk umur {AGE_LABELS[g]}
              </span>
              <span className="text-xs text-kk-inksoft font-semibold">
                {groupItems.filter(isRead).length}/{groupItems.length} dibaca
              </span>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {groupItems.map((m) => (
                <MaterialCard key={m.ageGroup + m.order} m={m} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
