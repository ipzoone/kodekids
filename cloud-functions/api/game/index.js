// agents/game/index.js — Game koding edukasi berbasis LangGraph + EdgeOne Sandbox
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import fs from "node:fs";
import path from "node:path";
import { getTursoConfig, ensureSchema, ensureUserBestTimesSchema, getAgeConfigFromDb, getChallengeFromDb, upsertUserBestTime, getUserBestTimes } from "./turso.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, makers-conversation-id",
};

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function resolveApiKey(context) {
  if (context.env.MAKERS_MODELS_KEY) return context.env.MAKERS_MODELS_KEY;
  if (context.env.AI_GATEWAY_API_KEY) return context.env.AI_GATEWAY_API_KEY;
  try {
    const envPath = path.join(process.cwd(), ".env");
    const content = fs.readFileSync(envPath, "utf-8");
    for (const key of ["MAKERS_MODELS_KEY", "AI_GATEWAY_API_KEY"]) {
      const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
      if (match) return match[1].trim();
    }
  } catch {}
  return "";
}

function parseLLMJson(content) {
  let text = String(content || "").trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  return JSON.parse(text);
}

// Model deepseek kadang menaruh teks di reasoning_content, bukan content
function extractMessageText(msg) {
  if (!msg) return "";
  if (typeof msg.content === "string" && msg.content) return msg.content;
  if (Array.isArray(msg.content) && msg.content.length) {
    return msg.content.map((p) => p?.text || "").join("");
  }
  return (
    msg.additional_kwargs?.reasoning_content ||
    msg.response_metadata?.reasoning_content ||
    msg.text ||
    ""
  );
}

// ================= STATE =================
const GameState = Annotation.Root({
  action: Annotation({ reducer: (_, v) => v, default: () => "start" }),
  ageGroup: Annotation({ reducer: (_, v) => v, default: () => "8-10" }),
  language: Annotation({ reducer: (_, v) => v, default: () => "" }),
  level: Annotation({ reducer: (_, v) => v, default: () => 1 }),
  step: Annotation({ reducer: (_, v) => v, default: () => 1 }),
  score: Annotation({ reducer: (_, v) => v, default: () => 0 }),
  attemptCount: Annotation({ reducer: (_, v) => v, default: () => 0 }),
  lastError: Annotation({ reducer: (_, v) => v, default: () => "" }),
  challenge: Annotation({ reducer: (_, v) => v, default: () => null }),
  submission: Annotation({ reducer: (_, v) => v, default: () => null }),
  sandboxOutput: Annotation({ reducer: (_, v) => v, default: () => "" }),
  feedback: Annotation({ reducer: (_, v) => v, default: () => "" }),
  hint: Annotation({ reducer: (_, v) => v, default: () => "" }),
  correct: Annotation({ reducer: (_, v) => v, default: () => false }),
});

// ================= LEVEL CONFIG (dari Turso DB) =================
// Soal & konfigurasi level disimpan di tabel `challenges` dan `age_groups`.
// Kelola lewat scripts/seed-challenges.mjs atau langsung di DB.

// ================= NODES =================

// --- Node 1: Challenge_Generator ---
function makeChallengeGeneratorNode(generatorModel, cfg) {
  return async (state) => {
    const ageCfg = await getAgeConfigFromDb(cfg, state.ageGroup);
    const maxLevels = ageCfg?.max_levels || 5;
    const levelIndex = Math.min(state.level, maxLevels) - 1;
    const row = await getChallengeFromDb(
      cfg,
      state.ageGroup,
      Math.min(state.level, maxLevels),
      state.step,
    );
    if (!row) {
      throw new Error(`Soal untuk ${state.ageGroup} level ${state.level} tidak ditemukan di DB.`);
    }

    // 5-7 & 11-15 pakai template deterministik (andal untuk anak-anak),
    // 8-10 diracik LLM lalu divalidasi fallback template.
    if (state.ageGroup === "5-7") {
      const targetLength = row.data.length || Math.min(2 + state.level, 5);
      const moves = row.data.moves;
      const offset = ((state.step - 1) * 2) % moves.length;
      const target = Array.from(
        { length: targetLength },
        (_, i) => moves[(i + offset) % moves.length],
      );
      const levelStories = {
        1: "Wah, petualangan pertama kita dimulai! Bayangin kamu lagi bantu si kucing imut mengumpulkan ikan lezatnya",
        2: "Yeay, kamu sudah jago! Sekarang kita lanjut ke tantangan yang sedikit lebih seru ya",
        3: "Wih keren banget! Kamu makin pintar nih. Ayo kita coba yang agak menantang",
        4: "Hampir jadi juara nih! Tinggal sedikit lagi, kamu pasti bisa melewatinya",
        5: "Wah, ini level boss yang paling seru! Waktunya terbatas, jadi harus cepat dan tepat ya",
      };
      const cerita = levelStories[state.level] || levelStories[1];
      const narration = `Halo kodekids! ${cerita}. ${row.body}. Lihat ikon-ikon lucu di bawah ya, terus susun mereka sesuai urutan yang benar. Pelan-pelan aja, nggak usah buru-buru. Yuk, kita mulai petualangannya sekarang!`;
      return {
        challenge: {
          type: "sequence",
          level: state.level,
          story: row.body,
          goalDesc: `susun langkah dengan benar (${targetLength} langkah)`,
          availableIcons: moves,
          goalIcon: row.data.goalIcon,
          target,
          narration,
        },
      };
    }

    if (state.ageGroup === "11-15") {
      const lang = state.language === "javascript" ? "javascript" : "python";
      const langData = row.data.langs[lang];
      return {
        challenge: {
          type: "code",
          level: state.level,
          step: state.step,
          language: lang,
          title: row.title,
          description: langData.description || row.body,
          starterCode: langData.starterCode,
          functionName: langData.functionName || "",
          tests: langData.tests,
        },
      };
    }

    // 8-10: Blockly — deskripsi menyesuaikan bahasa yang dipilih
    const langLabel =
      state.language === "javascript" ? "JavaScript" : state.language === "python" ? "Python" : "";
    const langDesc = row.data.langs?.[state.language]?.desc;
    let llmStory = "";
    try {
      const res = await generatorModel.invoke([
        { role: "system", content: "Kamu perancang soal koding ramah anak 8-10 tahun. Jawab HANYA JSON. Jangan gunakan emoji." },
        {
          role: "user",
          content: `Buat cerita singkat (maksimal 2 kalimat, bahasa Indonesia, menyenangkan${langLabel ? `, menyebut bahwa anak sedang belajar ${langLabel}` : ""}) untuk tantangan Blockly berikut: "${langDesc || row.body}". Format JSON: {"story": "..."}`,
        },
      ]);
      llmStory = parseLLMJson(extractMessageText(res))?.story || "";
    } catch {}
    return {
      challenge: {
        type: "blockly",
        level: state.level,
        step: state.step,
        language: state.language || "",
        title: row.title,
        story: llmStory || `Petualangan koding level ${state.level}!`,
        desc: langDesc || row.body,
        check: row.data.check,
      },
    };
  };
}

// --- Node 2: Evaluator ---
function makeEvaluatorNode(judgeModel, context) {
  return async (state) => {
    const challenge = state.challenge;
    if (!challenge || !state.submission) {
      return { correct: false, feedback: "Tidak ada jawaban untuk diperiksa." };
    }

    // ---- 5-7: cocokkan urutan ikon (JS murni, 0 token) ----
    if (challenge.type === "sequence") {
      const submitted = Array.isArray(state.submission.sequence) ? state.submission.sequence : [];
      const correct =
        submitted.length === challenge.target.length &&
        submitted.every((icon, i) => icon === challenge.target[i]);
      return {
        correct,
        feedback: correct
          ? "Hebat sekali! Kuncinya berhasil kamu susun!"
          : "Belum tepat. Coba lihat lagi urutan yang diminta ya!",
      };
    }

    // ---- 11-15: verdict dieksekusi oleh agent /runner (EdgeOne Sandbox) ----
    // Cloud functions tidak punya akses context.sandbox, jadi frontend menjalankan
    // kode via /runner lalu meneruskan hasilnya ke sini.
    if (challenge.type === "code") {
      const verdict = state.submission.verdict;
      if (!verdict || typeof verdict.passed !== "boolean") {
        return {
          correct: false,
          feedback: "Kode belum dijalankan di sandbox. Coba kirim ulang jawabanmu.",
        };
      }
      return {
        correct: verdict.passed === true,
        feedback: verdict.passed ? "Keren! Semua test case lulus!" : `Belum lulus. ${verdict.message || ""}`,
        sandboxOutput: String(state.submission.output || "").slice(0, 1000),
      };
    }

    // ---- 8-10: nilai struktur program Blockly via LLM judge ----
    const judge = await judgeModel.invoke([
      {
        role: "system",
        content:
          'Anda pemeriksa program Blockly anak-anak. Program direpresentasikan sebagai JSON ringkas dari workspace. Nilailah apakah program memenuhi tantangan. Keluarkan HANYA JSON: {"benar": true/false, "umpan_balik": "kalimat singkat ramah anak tanpa emoji"}',
      },
      {
        role: "user",
        content: `Tantangan: ${challenge.title} — ${challenge.desc}\nKriteria teknis: ${JSON.stringify(challenge.check)}\nProgram Blockly (JSON): ${JSON.stringify(state.submission.blocks).slice(0, 4000)}`,
      },
    ]);
    const verdict = parseLLMJson(extractMessageText(judge));
    return {
      correct: verdict.benar === true,
      feedback: verdict.umpan_balik || (verdict.benar ? "Hebat!" : "Belum tepat, coba lagi!"),
    };
  };
}

// --- Node 3: Adaptive_Hint_Agent ---
function makeHintAgentNode(hintModel) {
  return async (state) => {
    if (state.correct || state.attemptCount <= 2) {
      return { hint: "" };
    }
    const langLabel = state.language
      ? state.language === "javascript"
        ? "JavaScript"
        : "Python"
      : "";
    const hint = await hintModel.invoke([
      {
        role: "system",
        content:
          'Kamu mentor koding ramah anak. Tugasmu memberikan SATU petunjuk kecil (maksimal 2 kalimat, bahasa Indonesia santai, jangan kasih jawaban langsung, TANPA emoji). WAJIB akhiri respons dengan baris berformat persis seperti ini:\nPETUNJUK: {"petunjuk": "<isi petunjukmu>"}',
      },
      {
        role: "user",
        content: `Usia: ${state.ageGroup}.${langLabel ? ` Bahasa pemrograman: ${langLabel}.` : ""} Tantangan: ${JSON.stringify(state.challenge)}. Kesalahan/error terakhir: ${state.lastError || "(tidak ada)"}. Percobaan ke-${state.attemptCount}.`,
      },
    ]);
    const raw = extractMessageText(hint);
    console.log("[hint] raw:", JSON.stringify(raw).slice(0, 300));

    // 1) Cari JSON {"petunjuk": "..."} (ambil yang terakhir)
    const jsonMatches = [...raw.matchAll(/\{[^{}]*"petunjuk"[\s\S]*?\}/g)];
    if (jsonMatches.length) {
      try {
        const parsed = JSON.parse(jsonMatches[jsonMatches.length - 1][0]);
        if (parsed.petunjuk) return { hint: String(parsed.petunjuk).trim() };
      } catch {}
    }
    // 2) Fallback: teks setelah penanda JAWABAN:/PETUNJUK:
    const marker = Math.max(raw.lastIndexOf("JAWABAN:"), raw.lastIndexOf("PETUNJUK:"));
    let result = marker !== -1 ? raw.slice(marker + 9) : raw;
    result = result.replace(/^[\s"']+|[\s"']+$/g, "").split(/\n\s*\n/)[0].trim();
    return { hint: result };
  };
}

const routeAfterEvaluate = (state) => (state.action === "start" ? "generate_challenge" : "hint_agent");

// ================= GRAPH =================
function buildAgent(context, tursoCfg) {
  const apiKey = resolveApiKey(context);
  const baseURL = context.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.edgeone.link/v1";
  const modelName = context.env.AI_GATEWAY_MODEL || context.env.MODEL || "@makers/deepseek-v4-flash";
  const baseConfig = { configuration: { baseURL, apiKey }, modelName };

  const generatorModel = new ChatOpenAI({ ...baseConfig, temperature: 0.8, maxTokens: 800 });
  const judgeModel = new ChatOpenAI({ ...baseConfig, temperature: 0, maxTokens: 800 });
  const hintModel = new ChatOpenAI({ ...baseConfig, temperature: 0.7, maxTokens: 2000 });

  const workflow = new StateGraph(GameState)
    .addNode("evaluate", makeEvaluatorNode(judgeModel, context))
    .addNode("generate_challenge", makeChallengeGeneratorNode(generatorModel, tursoCfg))
    .addNode("hint_agent", makeHintAgentNode(hintModel))
    .addEdge(START, "evaluate")
    .addConditionalEdges("evaluate", routeAfterEvaluate)
    .addEdge("generate_challenge", END)
    .addEdge("hint_agent", END);

  return workflow.compile();
}

// ================= HANDLER =================
export async function onRequest(context) {
  if (context.request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  let body = {};
  try {
    body = await context.request.json();
  } catch {
    body = context.request.body || {};
  }

  const ageGroup = ["5-7", "8-10", "11-15"].includes(body.ageGroup) ? body.ageGroup : "8-10";

    const userId = body.userId || null;

    const inputState = {
      action: body.action === "submit" ? "submit" : "start",
      ageGroup,
      language: body.language === "javascript" ? "javascript" : body.language === "python" ? "python" : "",
      level: Number(body.level) > 0 ? Number(body.level) : 1,
      step: Number(body.step) > 0 ? Number(body.step) : 1,
      score: Number(body.score) || 0,
      attemptCount: Number(body.attemptCount) || 0,
      lastError: body.lastError || "",
      challenge: body.challenge || null,
      submission: body.submission || null,
      bestTime: Number(body.bestTime) || null,
      userId: userId || null,
    };

    try {
      const tursoCfg = getTursoConfig(context);
      await ensureSchema(tursoCfg);
      await ensureUserBestTimesSchema(tursoCfg);
      const maxLevels = (await getAgeConfigFromDb(tursoCfg, ageGroup))?.max_levels || 5;
      const agent = buildAgent(context, tursoCfg);
      const result = await agent.invoke(inputState);

    const base = {
      ok: true,
      ageGroup: inputState.ageGroup,
      language: inputState.language,
      level: inputState.level,
      step: inputState.step,
      score: inputState.score,
    };

    // Mulai level baru → cukup kirim tantangannya
    if (inputState.action === "start") {
      let storedBestTime = null;
      if (inputState.userId) {
        try {
          const bestTimes = await getUserBestTimes(tursoCfg, inputState.userId, inputState.ageGroup);
          storedBestTime = bestTimes[inputState.level] || null;
        } catch {}
      }
      return jsonResponse({ ...base, challenge: result.challenge ?? null, bestTime: storedBestTime });
    }

    const response = {
      ...base,
      attemptCount: inputState.attemptCount,
      correct: result.correct ?? false,
      feedback: result.feedback ?? "",
      hint: result.hint ?? "",
      sandboxOutput: result.sandboxOutput ?? "",
      bestTime: inputState.bestTime,
    };

    if (response.correct) {
      // Progres per soal (step): 5 soal per level. Soal berikutnya terkunci
      // sampai soal sebelumnya benar — jadi alurnya selalu linear.
      const STEPS_PER_LEVEL = 5;
      const lastStep = inputState.step >= STEPS_PER_LEVEL;
      response.level = lastStep ? Math.min(inputState.level + 1, maxLevels) : inputState.level;
      response.step = lastStep ? 1 : inputState.step + 1;
      response.finished = inputState.level >= maxLevels && lastStep;
      response.score = inputState.score + 10 * inputState.level + 2 * (inputState.step - 1);
    } else {
      response.attemptCount = inputState.attemptCount + 1;
      response.lastError = response.feedback.slice(0, 200);
    }

    if (inputState.action === "submit" && inputState.userId && inputState.bestTime) {
      try {
        await upsertUserBestTime(tursoCfg, inputState.userId, inputState.ageGroup, inputState.level, inputState.bestTime);
      } catch {}
    }

    return jsonResponse(response);
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message }, 500);
  }
}
