import React from "react";
import { motion } from "framer-motion";
import { FaArrowLeft, FaStar } from "react-icons/fa";

export function Header({ onHome, icon: Icon, title, level, score }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <button
        onClick={onHome}
        className="flex items-center gap-1 text-kk-inksoft hover:text-kk-ink text-sm font-bold transition-colors"
      >
        <FaArrowLeft /> Beranda
      </button>
      <div className="flex items-center gap-2 font-display font-semibold text-lg text-kk-ink">
        {Icon && <Icon />}
        {title}
      </div>
      <div className="flex gap-2 text-xs font-bold items-center">
        <span className="bg-kk-paper border-2 border-kk-ink/25 rounded-full px-3 py-1 text-kk-ink">
          Lv {level}
        </span>
        <span className="bg-kk-sun/40 border-2 border-kk-ink/25 text-yellow-900 rounded-full px-3 py-1 flex items-center gap-1">
          <FaStar /> {score}
        </span>
      </div>
    </div>
  );
}

export function Centered({ children }) {
  return <div className="min-h-screen flex items-center justify-center px-4">{children}</div>;
}

// Pemilih bahasa pemrograman sebelum mulai kuis
export function LanguagePicker({ title, icon: Icon, languages, onPick, onHome }) {
  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Header onHome={onHome} icon={Icon} title={title} level="-" score={0} />
      <h2 className="font-display font-semibold text-3xl text-kk-ink text-center mb-2">
        Pilih Bahasa Pemrograman
      </h2>
      <p className="text-center text-kk-inksoft font-bold mb-8 text-sm">
        Mau ngoding pakai bahasa apa hari ini?
      </p>
      <div className="grid grid-cols-2 gap-4">
        {languages.map((l, i) => (
          <motion.button
            key={l.id}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 * i, type: "spring", stiffness: 120 }}
            whileHover={{ scale: 1.05, x: -3, y: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPick(l.id)}
            className={`bg-gradient-to-br ${l.gradient} rounded-3xl p-6 border-[3px] border-kk-ink shadow-kk-lg focus:outline-none`}
          >
            <l.Icon className="text-5xl mx-auto mb-3" />
            <div className="font-bold text-center">{l.name}</div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
