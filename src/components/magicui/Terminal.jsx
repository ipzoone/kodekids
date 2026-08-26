// Komponen gaya Magic UI: Terminal dengan efek ketik & animasi berurutan.
// Tidak butuh dependensi shadcn/radix — cukup React + framer-motion.
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function Terminal({ children }) {
  return (
    <div className="w-full rounded-xl border border-white/10 bg-[#0a0e14] shadow-2xl shadow-black/40 overflow-hidden font-mono text-sm">
      {/* Bar atas ala terminal */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/[0.03]">
        <span className="w-3 h-3 rounded-full bg-red-500" />
        <span className="w-3 h-3 rounded-full bg-yellow-500" />
        <span className="w-3 h-3 rounded-full bg-green-500" />
        <span className="ml-3 text-xs text-white/40">kodekids — zsh</span>
      </div>
      <div className="p-5 space-y-1.5 min-h-[220px] text-left leading-relaxed">
        {children}
      </div>
    </div>
  );
}

// Baris yang muncul dengan animasi fade + slide pada waktu tertentu
export function AnimatedSpan({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Teks yang diketik karakter demi karakter
export function TypingAnimation({ children, className = "", delay = 0, speed = 32 }) {
  const text = String(children ?? "");
  const [count, setCount] = useState(0);

  useEffect(() => {
    let interval;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        setCount((c) => {
          if (c >= text.length) {
            clearInterval(interval);
            return c;
          }
          return c + 1;
        });
      }, speed);
    }, delay);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [text, delay, speed]);

  return (
    <span className={className}>
      {text.slice(0, count)}
      {count < text.length && <span className="animate-pulse text-emerald-400">▍</span>}
    </span>
  );
}
