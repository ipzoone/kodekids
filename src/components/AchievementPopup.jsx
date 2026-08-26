// AchievementPopup — popup "SELAMAT!" saat user mendapat badge baru.
// App.js yang mengontrol tampilannya lewat state; badge dikirim satu per satu.
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaMedal } from "react-icons/fa";
import { getBadge, BADGE_ICONS } from "../utils/badges";

export default function AchievementPopup({ badgeId, onClose }) {
  const badge = getBadge(badgeId);
  if (!badge) return null;
  const Icon = BADGE_ICONS[badge.icon] || FaMedal;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.4, y: 60, rotate: -6, opacity: 0 }}
          animate={{ scale: 1, y: 0, rotate: 0, opacity: 1 }}
          exit={{ scale: 0.7, y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm bg-kk-paper border-[3px] border-kk-ink rounded-3xl shadow-kk-xl overflow-hidden text-center"
        >
          {/* Pita atas */}
          <div className="bg-kk-sun border-b-[3px] border-kk-ink py-3 px-8">
            <div className="font-display font-semibold text-xl text-kk-ink tracking-wide">
              SELAMAT! 🎉
            </div>
            <div className="text-xs font-extrabold text-kk-inksoft uppercase tracking-widest">
              Badge Baru Terbuka
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-kk-ink"
            aria-label="Tutup"
          >
            <FaTimes />
          </button>

          {/* Medali */}
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.25, type: "spring", stiffness: 200, damping: 12 }}
            className="mx-auto mt-7 w-28 h-28 rounded-full flex items-center justify-center"
            style={{ backgroundColor: badge.color, border: "3px solid #262138" }}
          >
            <Icon className="text-5xl text-white drop-shadow" />
          </motion.div>

          <div className="px-6 pb-7 pt-4">
            <h3 className="font-display font-semibold text-2xl text-kk-ink mt-2">
              {badge.title}
            </h3>
            <p className="text-kk-inksoft font-bold text-sm mt-1.5 leading-relaxed">
              {badge.desc}
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onClose}
              className="mt-5 w-full py-3 rounded-2xl bg-kk-teal hover:bg-kk-tealdeep text-white border-[2.5px] border-kk-ink shadow-kk-md font-display font-semibold text-lg transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Keren!
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

