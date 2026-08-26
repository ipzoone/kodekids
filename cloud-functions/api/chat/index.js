// cloud-functions/api/chat/index.js — chat RAG berbasis knowledge base (folder knowledge/).
// Membaca file .txt/.md/.pdf di knowledge/, chunking sederhana + keyword retrieval,
// lalu menjawab via agent @openai/agents dengan streaming SSE.
import OpenAI from "openai";
import { Agent, run, OpenAIChatCompletionsModel } from "@openai/agents";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_MODEL = "@makers/deepseek-v4-flash";

const CHUNK_SIZE = 512;
const CHUNK_OVERLAP = 64;
const TOP_K = 4;

let knowledgeChunks = null;

async function readTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".pdf") {
    try {
      const { default: pdfParse } = await import("pdf-parse");
      const buffer = fs.readFileSync(filePath);
      return String(pdfParse(buffer)?.text || "");
    } catch (e) {
      console.warn(`[knowledge] Gagal baca PDF ${filePath}: ${e.message}`);
      return "";
    }
  }
  return fs.readFileSync(filePath, "utf-8");
}

function chunkText(text) {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (!clean) return [];
  const chunks = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + CHUNK_SIZE, clean.length);
    if (end < clean.length) {
      const lastBreak = clean.lastIndexOf("\n", end);
      if (lastBreak > start + CHUNK_SIZE / 2) end = lastBreak;
    }
    chunks.push(clean.slice(start, end).trim());
    start += end - start > CHUNK_OVERLAP ? end - CHUNK_OVERLAP : end;
    if (end >= clean.length) break;
  }
  return chunks.filter(Boolean);
}

async function loadKnowledge() {
  if (knowledgeChunks) return knowledgeChunks;
  knowledgeChunks = [];
  const dir = path.join(process.cwd(), "knowledge");
  if (!fs.existsSync(dir)) return knowledgeChunks;
  for (const entry of fs.readdirSync(dir, { recursive: true })) {
    const filePath = path.join(dir, entry);
    if (!fs.statSync(filePath).isFile()) continue;
    if (!/\.(txt|md|pdf)$/i.test(filePath)) continue;
    try {
      const text = await readTextFromFile(filePath);
      knowledgeChunks.push(...chunkText(text));
    } catch (e) {
      console.warn(`[knowledge] Gagal baca ${filePath}: ${e.message}`);
    }
  }
  console.log(`[knowledge] ${knowledgeChunks.length} chunk dimuat`);
  return knowledgeChunks;
}

const SYNONYMS = {
  kuis: ["quiz", "quizzes"],
  quiz: ["kuis"],
  soal: ["question", "questions", "problem"],
  pertanyaan: ["question", "questions"],
  question: ["pertanyaan", "soal"],
  questions: ["pertanyaan", "soal"],
  materi: ["topic", "topics", "material", "subject", "subjects"],
  topic: ["materi", "topik"],
  topics: ["materi", "topik"],
  topik: ["topic", "topics", "materi"],
  matematika: ["mathematics", "math"],
  math: ["matematika", "mathematics"],
  mathematics: ["matematika"],
  sains: ["science"],
  science: ["sains", "ilmu"],
  ilmu: ["science"],
  sejarah: ["history"],
  history: ["sejarah"],
  geografi: ["geography"],
  geography: ["geografi"],
  koding: ["coding", "programming"],
  coding: ["koding", "pemrograman", "programming"],
  pemrograman: ["coding", "programming"],
  programming: ["coding", "pemrograman"],
  jawaban: ["answer", "answers"],
  answer: ["jawaban"],
  answers: ["jawaban"],
  belajar: ["learn", "study", "learning"],
  learn: ["belajar"],
  study: ["belajar"],
  contoh: ["example", "sample"],
  example: ["contoh"],
  sample: ["contoh"],
  daftar: ["list"],
  list: ["daftar"],
  bisa: ["can", "able"],
  tanyakan: ["ask", "asking"],
  ask: ["tanya", "tanyakan"],
};

function expandTerms(message) {
  const base = String(message).toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2);
  const expanded = new Set(base);
  for (const term of base) {
    const syn = SYNONYMS[term];
    if (syn) syn.forEach((s) => expanded.add(s));
    if (term.startsWith("di") && SYNONYMS[term.slice(2)]) {
      SYNONYMS[term.slice(2)].forEach((s) => expanded.add(s));
      expanded.add(term.slice(2));
    }
    if (term.endsWith("kan") && SYNONYMS[term.slice(0, -3)]) {
      SYNONYMS[term.slice(0, -3)].forEach((s) => expanded.add(s));
      expanded.add(term.slice(0, -3));
    }
    if (term.endsWith("nya") && SYNONYMS[term.slice(0, -3)]) {
      SYNONYMS[term.slice(0, -3)].forEach((s) => expanded.add(s));
      expanded.add(term.slice(0, -3));
    }
  }
  return [...expanded];
}

async function retrieve(message, topK = TOP_K) {
  const chunks = await loadKnowledge();
  if (!chunks.length) return [];
  const totalChars = chunks.reduce((sum, c) => sum + c.length, 0);
  if (chunks.length <= 12 || totalChars <= 6_000) {
    return chunks;
  }
  const terms = expandTerms(message);
  const scored = chunks.map((chunk, index) => {
    const lower = chunk.toLowerCase();
    let score = 0;
    for (const term of terms) {
      let pos = lower.indexOf(term);
      while (pos !== -1) {
        score += 1;
        pos = lower.indexOf(term, pos + term.length);
      }
    }
    return { index, score };
  });
  const matches = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => chunks[s.index]);
  return matches.length ? matches : chunks.slice(0, topK);
}

let fullResponse = "";

function toSseEvent(e) {
  if (!e || typeof e !== "object") return undefined;
  if (e.type === "raw_model_stream_event" && e.data?.type === "output_text_delta") {
    fullResponse += e.data.delta;
    return sseEvent({
      type: "ai_response",
      data: { content: e.data.delta },
    });
  }
  return undefined;
}

function sseEvent(payload) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function createSSEResponse(eventGenerator, signal) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(sseEvent({ type: "ping" })));
      }, 15000);
      try {
        for await (const event of eventGenerator()) {
          if (signal?.aborted) break;
          controller.enqueue(encoder.encode(event));
        }
      } catch (err) {
        if (!(err?.name === "AbortError" || signal?.aborted))
          controller.enqueue(
            encoder.encode(
              sseEvent({ type: "error_message", content: err?.message || "Unexpected error" }),
            ),
          );
      } finally {
        clearInterval(heartbeat);
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, makers-conversation-id",
    },
  });
}

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, makers-conversation-id",
      },
    });
  }

  let body = {};
  try {
    body = await context.request.json();
  } catch {
    body = context.request.body || {};
  }

  const { message } = body;
  const env = context.env || {};

  if (!message) {
    return new Response(JSON.stringify({ error: "'message' is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const signal = context.request.signal || undefined;

  const client = new OpenAI({
    apiKey: env.AI_GATEWAY_API_KEY,
    baseURL: env.AI_GATEWAY_BASE_URL,
  });

  const relevantChunks = await retrieve(message);
  const contextText = relevantChunks.length ? relevantChunks.join("\n\n---\n\n") : "";
  const rulesPath = path.join(process.cwd(), "knowledge", "chat-rules.txt");
  const rulesText = fs.existsSync(rulesPath) ? fs.readFileSync(rulesPath, "utf-8").trim() : "";

  const agent = new Agent({
    name: "KodeBot",
    instructions: `You are KodeBot, a coding-learning assistant for kids on the KodeKids website.
${rulesText ? `\n${rulesText}\n` : ""}
Always answer in the SAME language the user is using (Indonesian question -> Indonesian answer, English question -> English answer, etc).
The knowledge base may be written in a different language than the question — that is fine, translate your understanding when answering.
If the answer is not in the knowledge base, say you don't know rather than guessing.
${
  contextText
    ? `
=== KNOWLEDGE BASE ===
${contextText}
=== END KNOWLEDGE BASE ===`
    : "\n(Knowledge base kosong atau tidak ada bagian yang relevan.)"
}`,
    model: new OpenAIChatCompletionsModel(client, env.AI_GATEWAY_MODEL || DEFAULT_MODEL),
  });

  return createSSEResponse(async function* () {
    fullResponse = "";
    const result = await run(agent, message, { stream: true, signal });
    for await (const event of result.toStream()) {
      if (signal?.aborted) break;
      const sse = toSseEvent(event);
      if (sse) yield sse;
    }
  }, signal);
}
