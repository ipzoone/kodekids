// Definisi & kalkulasi badge — didapat dari progres challenge tiap game.
import {
  FaSeedling,
  FaMedal,
  FaCrown,
  FaCompass,
  FaGem,
} from "react-icons/fa";

// Peta nama ikon -> komponen react-icons
export const BADGE_ICONS = {
  FaSeedling,
  FaMedal,
  FaCrown,
  FaCompass,
  FaGem,
};
export const GAME_LABELS = {
  "5-7": "Block Puzzle",
  "8-10": "Blockly Coding",
  "11-15": "Coding",
};

const GAME_META = [
  { game: "5-7", prefix: "puzzle", label: "Block Puzzle" },
  { game: "8-10", prefix: "blockly", label: "Blockly" },
  { game: "11-15", prefix: "coding", label: "Coding" },
];
const TIERS = [
  { min: 50, tier: "pemula", title: "Pemula", icon: "FaSeedling", color: "#0FA398" },
  { min: 250, tier: "ahli", title: "Ahli", icon: "FaMedal", color: "#5B52F0" },
  { min: 650, tier: "legenda", title: "Legenda", icon: "FaCrown", color: "#FFC145" },
];

export const ALL_BADGES = [];
for (const g of GAME_META) {
  for (const t of TIERS) {
    ALL_BADGES.push({
      id: `${g.prefix}-${t.tier}`,
      game: g.game,
      title: `${t.title} ${g.label}`,
      desc: `Kumpulkan ${t.min}+ poin di ${g.label}`,
      icon: t.icon,
      color: t.color,
    });
  }
}
ALL_BADGES.push({
  id: "penjelajah",
  game: null,
  title: "Penjelajah KodeKids",
  desc: "Main ketiga challenge minimal jadi Pemula",
  icon: "FaCompass",
  color: "#FF6B57",
});
ALL_BADGES.push({
  id: "master-kodekids",
  game: null,
  title: "Master KodeKids",
  desc: "Jadi Ahli di ketiga challenge!",
  icon: "FaGem",
  color: "#E14F3C",
});

export function getBadge(id) {
  return ALL_BADGES.find((b) => b.id === id) || null;
}

// Hitung daftar badge id dari objek progress { "5-7": {totalScore}, ... }
export function computeBadges(progress) {
  const earned = [];
  const scoreOf = (game) => progress?.[game]?.totalScore || 0;

  for (const g of GAME_META) {
    const s = scoreOf(g.game);
    for (const t of TIERS) {
      if (s >= t.min) earned.push(`${g.prefix}-${t.tier}`);
    }
  }

  const allPemula = GAME_META.every((g) => scoreOf(g.game) >= 50);
  if (allPemula) earned.push("penjelajah");
  const allAhli = GAME_META.every((g) => scoreOf(g.game) >= 250);
  if (allAhli) earned.push("master-kodekids");

  return earned;
}

// Badge baru yang belum pernah dilihat user (untuk popup achievement)
export function diffNewBadges(earned, knownIds) {
  return earned.filter((id) => !knownIds.includes(id));
}
