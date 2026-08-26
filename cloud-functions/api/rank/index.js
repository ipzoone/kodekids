// cloud-functions/api/rank/index.js — leaderboard & profil publik via EdgeOne
// Pages Blob (KV). Tidak menyentuh Turso supaya cepat dan murah.
//
// POST { userId, name, avatarUrl, badges, scores }  -> simpan record user
//                                                       + update papan peringkat per game
// GET ?type=board&game=11-15                        -> top 50 pemain per game
// GET ?type=user&id=123                             -> record publik satu user
import { getStore } from "@edgeone/pages-blob";

const STORE_NAME = "kodekids-rank";
const GAMES = ["5-7", "8-10", "11-15"];

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" },
  });
}

async function onRequestInternal(context) {
  const store = getStore(STORE_NAME);
  const request = context.request;
  const url = new URL(request.url);

  // ===== GET =====
  if (request.method === "GET") {
    const type = url.searchParams.get("type");
    if (type === "board") {
      const game = url.searchParams.get("game");
      if (!GAMES.includes(game)) {
        return jsonResponse({ status: "error", message: "game tidak valid." }, 400);
      }
      const board = (await store.get(`board/${game}`, { type: "json" })) || [];
      return jsonResponse({ status: "success", data: board });
    }
    if (type === "user") {
      const id = url.searchParams.get("id");
      if (!id) return jsonResponse({ status: "error", message: "id wajib diisi." }, 400);
      const record =
        (await store.get(`u/${id}`, { type: "json" })) ||
        (await store.get(`u/${String(id).replace(".0", "")}`, { type: "json" }));
      if (!record) {
        return jsonResponse({ status: "error", message: "User tidak ditemukan." }, 404);
      }
      return jsonResponse({ status: "success", data: record });
    }
    return jsonResponse({ status: "error", message: "type tidak valid." }, 400);
  }

  // ===== POST =====
  if (request.method === "POST") {
    let body = {};
    try {
      body = await request.json();
    } catch {}
    const userId = body.userId != null ? String(body.userId) : null;
    if (!userId || !body.name) {
      return jsonResponse({ status: "error", message: "userId dan name wajib diisi." }, 400);
    }

    const record = {
      userId,
      name: String(body.name).slice(0, 40),
      avatarUrl: typeof body.avatarUrl === "string" && body.avatarUrl ? body.avatarUrl : null,
      badges: Array.isArray(body.badges) ? body.badges.slice(0, 30) : [],
      scores: {},
      updatedAt: Date.now(),
    };
    for (const g of GAMES) {
      const n = Number(body.scores?.[g]);
      record.scores[g] = Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    }

    // Simpan record publik user
    await store.setJSON(`u/${userId}`, record);

    // Perbarui papan peringkat tiap game
    for (const g of GAMES) {
      const score = record.scores[g];
      if (!score) continue;
      const key = `board/${g}`;
      let board = (await store.get(key, { type: "json" })) || [];
      board = board.filter((e) => String(e.userId) !== userId);
      board.push({
        userId,
        name: record.name,
        avatarUrl: record.avatarUrl,
        score,
        badges: record.badges.length,
      });
      board.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
      await store.setJSON(key, board.slice(0, 50));
    }

    return jsonResponse({ status: "success", message: "Rank tersimpan.", data: record });
  }

  return jsonResponse({ status: "error", message: "Method not allowed" }, 405);
}

export async function onRequest(context) {
  const { request } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
  try {
    return await onRequestInternal(context);
  } catch (error) {
    console.error("[rank] Error:", error.message);
    return jsonResponse(
      { status: "error", message: "Gagal memproses rank", error: error.message },
      500,
    );
  }
}
