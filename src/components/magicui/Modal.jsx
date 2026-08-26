// Modal tengah layar bergaya sama dengan tema app (dark, rounded, backdrop blur).
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";

export default function Modal({ open, title, subtitle, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ scale: 0.94, y: 14, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="relative w-full max-w-md bg-slate-800 border border-white/15 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-start justify-between gap-4 px-5 pt-5">
              <div>
                <h3 className="font-extrabold text-lg">{title}</h3>
                {subtitle && (
                  <p className="text-white/50 text-sm mt-0.5">{subtitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            <div className="px-5 pb-5 pt-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
