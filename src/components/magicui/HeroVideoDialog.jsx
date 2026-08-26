// Dialog video hero ala Magic UI: thumbnail dengan tombol play,
// klik untuk membuka modal berisi video YouTube.
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlay, FaTimes } from "react-icons/fa";

export default function HeroVideoDialog({
  videoSrc,
  thumbnailSrc,
  thumbnailAlt = "Video tutorial",
}) {
  const [open, setOpen] = useState(false);

  // Tutup dengan tombol Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const autoplaySrc = videoSrc + (videoSrc.includes("?") ? "&" : "?") + "autoplay=1";

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setOpen(true)}
        className="group relative mx-auto max-w-3xl cursor-pointer"
      >
        <img
          src={thumbnailSrc}
          alt={thumbnailAlt}
          className="w-full rounded-2xl border border-white/10 shadow-2xl shadow-black/50"
        />
        {/* Overlay gelap */}
        <div className="absolute inset-0 rounded-2xl bg-black/20 group-hover:bg-black/10 transition-colors" />
        {/* Tombol play */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-sky-500 group-hover:bg-sky-400 transition-colors w-20 h-20 rounded-full flex items-center justify-center shadow-xl shadow-black/40 group-hover:scale-110 transition-transform">
            <FaPlay className="text-2xl ml-1" />
          </div>
        </div>
        {/* Label */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur rounded-full px-5 py-2 text-sm font-bold whitespace-nowrap">
          ▶ Tonton cara kerja KodeKids
        </div>
      </motion.div>

      {/* Modal video */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 30 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute -top-11 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                <FaTimes />
              </button>
              <div className="aspect-video rounded-2xl overflow-hidden border border-white/15 shadow-2xl">
                <iframe
                  src={autoplaySrc}
                  title="Tutorial KodeKids"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
