import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaRobot, FaPaperPlane, FaTimes, FaCommentDots } from "react-icons/fa";
import ReactMarkdown from "react-markdown";

// Membaca response SSE dari /api/chat secara bertahap (streaming)
async function streamChat(message, onDelta) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "makers-conversation-id": "chat-" + Math.random().toString(36).slice(2),
    },
    body: JSON.stringify({ message }),
  });
  if (!res.ok || !res.body) throw new Error("Chat sedang tidak bisa dihubungi");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      for (const line of rawEvent.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        try {
          const evt = JSON.parse(line.slice(6));
          if (evt.type === "ai_response" && evt.data?.content) onDelta(evt.data.content);
          if (evt.type === "error_message") onDelta("\n[error] " + evt.content);
        } catch {}
      }
    }
  }
}

// Merender jawaban bot yang berformat Markdown (bold, list, heading, kode)
const markdownComponents = {
  p: ({ children }) => <p className="my-1.5 first:mt-0 last:mb-0">{children}</p>,
  h1: ({ children }) => <h3 className="font-display font-semibold text-base my-2 first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="font-display font-semibold text-[15px] my-2 first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="font-display font-semibold text-sm my-1.5 first:mt-0">{children}</h4>,
  ul: ({ children }) => <ul className="list-disc pl-4 my-1.5 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4 my-1.5 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="pl-0.5 marker:text-kk-coral">{children}</li>,
  strong: ({ children }) => <strong className="font-extrabold text-kk-indigodeep">{children}</strong>,
  em: ({ children }) => <em className="italic text-kk-inksoft">{children}</em>,
  hr: () => <hr className="border-kk-ink/15 my-2" />,
  blockquote: ({ children }) => (
    <blockquote className="border-l-[3px] border-kk-sun pl-2.5 my-1.5 text-kk-inksoft">{children}</blockquote>
  ),
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-kk-indigo underline font-bold">
      {children}
    </a>
  ),
  code: ({ inline, className, children }) =>
    inline ? (
      <code className="bg-kk-cream border border-kk-ink/15 rounded px-1 py-0.5 text-[12px] font-mono text-kk-coraldeep">
        {children}
      </code>
    ) : (
      <pre className="bg-kk-ink rounded-xl p-3 my-1.5 overflow-x-auto border-2 border-kk-ink/20">
        <code className={`text-[12px] font-mono leading-relaxed text-kk-cream ${className || ""}`}>{children}</code>
      </pre>
    ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-1.5">
      <table className="text-xs border-collapse w-full">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-kk-ink/20 bg-kk-cream px-2 py-1 font-extrabold text-left">{children}</th>
  ),
  td: ({ children }) => <td className="border border-kk-ink/20 px-2 py-1">{children}</td>,
};

function BotMarkdown({ text }) {
  return (
    <div className="break-words">
      <ReactMarkdown components={markdownComponents}>{text}</ReactMarkdown>
    </div>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hai! Aku KodeBot 🤖 Tanya apa aja soal koding ya!" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setBusy(true);
    setMessages((m) => [...m, { role: "bot", text: "" }]);

    try {
      await streamChat(text, (delta) => {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "bot", text: copy[copy.length - 1].text + delta };
          return copy;
        });
      });
    } catch (e) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "bot",
          text: copy[copy.length - 1].text || "Waduh, aku lagi bermasalah. Coba lagi ya!",
        };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Tombol bulat mengambang */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="open"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.08, x: -2, y: -2 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-kk-indigo hover:bg-kk-indigodeep border-[3px] border-kk-ink shadow-kk-md flex items-center justify-center text-white"
            title="Tanya KodeBot"
          >
            <FaCommentDots className="text-2xl" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel chat */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ y: 60, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] sm:w-96 rounded-3xl overflow-hidden flex flex-col bg-kk-paper text-kk-ink border-[3px] border-kk-ink shadow-kk-lg"
            style={{ height: "min(70vh, 540px)" }}
          >
            {/* Header */}
            <div className="bg-kk-indigo text-white px-4 py-3 flex items-center justify-between border-b-[3px] border-kk-ink">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center">
                  <FaRobot className="text-xl" />
                </div>
                <div>
                  <div className="font-display font-semibold leading-tight">KodeBot</div>
                  <div className="text-xs text-white/85 font-semibold">
                    {busy ? "sedang mengetik..." : "siap membantu"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-white/20 flex items-center justify-center"
              >
                <FaTimes />
              </button>
            </div>

            {/* Pesan */}
            <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-kk-cream/60">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-kk-teal text-white rounded-br-sm whitespace-pre-wrap border-2 border-kk-ink/80"
                        : "bg-kk-paper rounded-bl-sm border-2 border-kk-ink/15"
                    }`}
                  >
                    {m.text ? (
                      m.role === "bot" ? (
                        <BotMarkdown text={m.text} />
                      ) : (
                        m.text
                      )
                    ) : (
                      <span className="animate-pulse">▌</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t-[3px] border-kk-ink flex gap-2 bg-kk-paper">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Tanya sesuatu..."
                className="flex-1 bg-kk-cream border-2 border-kk-ink/20 rounded-full px-4 py-2.5 text-sm outline-none focus:border-kk-indigo placeholder:text-kk-inksoft/50 transition-colors"
              />
              <button
                onClick={send}
                disabled={busy || !input.trim()}
                className="w-11 h-11 rounded-full bg-kk-indigo hover:bg-kk-indigodeep border-[2.5px] border-kk-ink shadow-kk-sm disabled:opacity-40 flex items-center justify-center shrink-0 text-white transition-colors"
              >
                <FaPaperPlane />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
