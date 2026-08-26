import React from "react";
import { motion } from "framer-motion";
import {
  FaPuzzlePiece,
  FaCubes,
  FaCode,
  FaStar,
  FaBookOpen,
  FaRocket,
  FaLightbulb,
  FaTrophy,
  FaPencilAlt,
} from "react-icons/fa";
import HeroVideoDialog from "./magicui/HeroVideoDialog";
import { Terminal, AnimatedSpan, TypingAnimation } from "./magicui/Terminal";
import { loadProgress } from "../services/api";

const GROUPS = [
  {
    id: "5-7",
    Icon: FaPuzzlePiece,
    title: "5 - 7 Tahun",
    subtitle: "Block Puzzle Ikon",
    desc: "Susun ikon-ikon lucu dan bantu teman-temanmu!",
    card: "bg-kk-coral hover:bg-kk-coraldeep",
    badge: "bg-kk-ink text-white",
  },
  {
    id: "8-10",
    Icon: FaCubes,
    title: "8 - 10 Tahun",
    subtitle: "Blockly Coding",
    desc: "Rakit blok-blok koding seperti LEGO!",
    card: "bg-kk-teal hover:bg-kk-tealdeep",
    badge: "bg-kk-ink text-white",
  },
  {
    id: "11-15",
    Icon: FaCode,
    title: "11 - 15 Tahun",
    subtitle: "Coding",
    desc: "Tulis kode beneran dan taklukkan tantangan!",
    card: "bg-kk-indigo hover:bg-kk-indigodeep",
    badge: "bg-kk-ink text-white",
  },
];

const FEATURES = [
  {
    Icon: FaBookOpen,
    title: "Materi Seru",
    desc: "Belajar step by step dengan bahasa yang gampang dipahami.",
    color: "bg-kk-indigo",
  },
  {
    Icon: FaRocket,
    title: "Challenge Level",
    desc: "5 level tantangan per umur. Naik level kalau jawabanmu benar!",
    color: "bg-kk-coral",
  },
  {
    Icon: FaLightbulb,
    title: "Petunjuk Cerdas",
    desc: "Kesulitan? AI memberi petunjuk kecil tanpa membocorkan jawaban.",
    color: "bg-kk-sun",
  },
  {
    Icon: FaTrophy,
    title: "Kumpulkan Poin",
    desc: "Tiap jawaban benar dapat bintang. Kumpulkan sebanyak-banyaknya!",
    color: "bg-kk-teal",
  },
];

function SectionHead({ title, sub }) {
  return (
    <div className="text-center mb-9">
      <h2 className="font-display font-semibold text-3xl md:text-4xl text-kk-ink">{title}</h2>
      <p className="text-kk-inksoft font-bold mt-2">{sub}</p>
    </div>
  );
}

export default function HomePage({ onSelect }) {
  const progress = loadProgress();
  const totalScore = Object.values(progress).reduce(
    (sum, p) => sum + (p?.totalScore || 0),
    0,
  );

  return (
    <div>
      {/* ===== Hero ===== */}
      <div className="max-w-6xl mx-auto px-4 pt-20 pb-12 text-center">
        <motion.div
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="inline-flex items-center gap-2 bg-kk-paper border-2 border-kk-ink rounded-full px-4 py-2 font-extrabold text-sm shadow-kk-sm"
        >
          <FaPencilAlt className="text-kk-coral" /> Belajar coding, rasanya kayak main
        </motion.div>

        <motion.h1
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="font-display font-bold leading-[0.95] text-7xl md:text-[8rem] mt-6"
        >
          <span className="text-kk-indigo">Kode</span>
          <span className="text-kk-coral">Kids</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-kk-inksoft font-semibold text-lg mt-5 max-w-xl mx-auto leading-relaxed"
        >
          Dari puzzle lucu sampai nulis kode beneran — semua ada di sini.
          Pilih kelompok usiamu dan mulai petualanganmu!
        </motion.p>

        {/* Statistik */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center gap-3.5 mt-9 flex-wrap"
        >
          <span className="flex items-center gap-2 bg-kk-paper border-[2.5px] border-kk-ink rounded-full px-5 py-2.5 text-sm font-extrabold shadow-kk-md">
            <span className="w-2.5 h-2.5 rounded-full bg-kk-indigo" /> 15 Materi
          </span>
          <span className="flex items-center gap-2 bg-kk-paper border-[2.5px] border-kk-ink rounded-full px-5 py-2.5 text-sm font-extrabold shadow-kk-md">
            <span className="w-2.5 h-2.5 rounded-full bg-kk-coral" /> 15 Level Challenge
          </span>
          <span className="flex items-center gap-2 bg-kk-paper border-[2.5px] border-kk-ink rounded-full px-5 py-2.5 text-sm font-extrabold shadow-kk-md">
            <span className="w-2.5 h-2.5 rounded-full bg-kk-sun" /> {totalScore} Poin Kamu
          </span>
        </motion.div>
      </div>

      {/* ===== Pilih Umur ===== */}
      <div id="pilih-umur" className="max-w-6xl mx-auto px-4 pb-14">
        <SectionHead title="Pilih Kelompok Usiamu" sub="Setiap umur punya petualangan berbeda" />

        <div className="grid gap-6 w-full max-w-4xl mx-auto md:grid-cols-3">
          {GROUPS.map((g, i) => {
            const p = progress[g.id];
            return (
              <motion.button
                key={g.id}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 * i, type: "spring", stiffness: 120 }}
                whileHover={{ x: -3, y: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelect(g.id)}
                className={`${g.card} rounded-3xl border-[3px] border-kk-ink p-7 text-left text-white shadow-kk-lg focus:outline-none transition-shadow`}
              >
                <div className="w-[52px] h-[52px] rounded-[14px] bg-white/20 border-2 border-white/60 flex items-center justify-center mb-4">
                  <g.Icon className="text-2xl" />
                </div>
                <div className="font-extrabold text-[13px] uppercase tracking-wide opacity-85">{g.title}</div>
                <div className="font-display font-semibold text-2xl mt-1">{g.subtitle}</div>
                <p className="text-sm font-semibold text-white/95 mt-2 leading-snug">{g.desc}</p>
                {p && (
                  <div className={`mt-4 inline-flex items-center gap-1.5 ${g.badge} rounded-full px-3.5 py-1.5 text-xs font-extrabold`}>
                    <FaStar className="text-kk-sun" /> {p.totalScore || 0} poin · Level{" "}
                    {p.level || 1}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ===== Fitur ===== */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <SectionHead title="Kenapa KodeKids Asyik?" sub="Belajar tanpa terasa belajar" />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i }}
              whileHover={{ y: -3 }}
              className="bg-kk-paper border-[2.5px] border-kk-ink rounded-2xl p-6 shadow-kk-md"
            >
              <div className={`${f.color} w-11 h-11 rounded-xl border-2 border-kk-ink flex items-center justify-center mb-4 text-white`}>
                <f.Icon className={f.color === "bg-kk-sun" ? "text-kk-ink text-lg" : "text-lg"} />
              </div>
              <div className="font-display font-semibold text-lg text-kk-ink mb-1.5">{f.title}</div>
              <p className="text-sm text-kk-inksoft font-semibold leading-snug">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ===== Video Tutorial ===== */}
      <div className="max-w-6xl mx-auto px-4 pb-14">
        <SectionHead title="Lihat Dulu Caranya" sub="Tonton video singkat ini sebelum mulai" />
        <HeroVideoDialog
          animationStyle="from-center"
          videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9qxxb"
          thumbnailSrc="https://startup-template-sage.vercel.app/hero-light.png"
          thumbnailAlt="Video tutorial KodeKids"
        />
      </div>

      {/* ===== Terminal animasi ===== */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="bg-kk-ink rounded-3xl border-[3px] border-kk-ink py-10 px-4 md:px-10">
          <SectionHead title="Rasa Programmer Asli" sub="Begini suasana layar kalau kamu sudah jadi programmer" />
          <div className="[&_h2]:!text-kk-cream [&_p]:!text-kk-cream/65 max-w-2xl mx-auto">
            <Terminal>
              <TypingAnimation delay={400}>&gt; mulai belajar koding...</TypingAnimation>

              <AnimatedSpan delay={1600} className="text-green-500">
                ✓ Memuat modul materi keren.
              </AnimatedSpan>

              <AnimatedSpan delay={2200} className="text-green-500">
                ✓ Menyiapkan tantangan level 1.
              </AnimatedSpan>

              <AnimatedSpan delay={2800} className="text-green-500">
                ✓ Menghubungkan KodeBot AI assistant.
              </AnimatedSpan>

              <AnimatedSpan delay={3400} className="text-blue-500">
                <span>ℹ Progres kamu tersimpan:</span>
                <span className="pl-2">120 poin • Level 3</span>
              </AnimatedSpan>

              <TypingAnimation delay={4200} className="text-emerald-300">
                Selamat! Kamu siap jadi programmer. 🚀
              </TypingAnimation>
            </Terminal>
          </div>
        </div>
      </div>

      {/* ===== Footer ===== */}
      <footer className="py-8 text-center text-kk-inksoft font-bold text-sm">
        KodeKids — belajar coding, satu langkah kecil setiap hari.
      </footer>
    </div>
  );
}
