// cloud-functions/api/workspace/index.js — conversation storage Playground.
// Menyimpan/memuat kode per user via EdgeOne Pages Blob (@edgeone/pages-blob).
// Key: playground/{userId} berisi JSON { files, activeId, savedAt }.
import { getStore } from "@edgeone/pages-blob";

const STORE_NAME = "kodekids-workspace";

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
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
    const store = getStore(STORE_NAME);
    const url = new URL(request.url);

    // GET /api/workspace?userId=1 — muat workspace user
    if (request.method === "GET") {
      const userId = url.searchParams.get("userId");
      if (!userId) {
        return jsonResponse({ status: "error", message: "userId wajib diisi." }, 400);
      }
      const data = await store.get(`playground/${userId}`, {
        type: "json",
        consistency: "strong",
      });
      return jsonResponse({
        status: "success",
        data: data || null,
      });
    }

    // POST /api/workspace — simpan workspace user
    if (request.method === "POST") {
      let body = {};
      try {
        body = await request.json();
      } catch {
        body = context.request.body || {};
      }
      const { userId, files, activeId } = body;
      if (!userId || !files) {
        return jsonResponse(
          { status: "error", message: "userId dan files wajib diisi." },
          400,
        );
      }
      await store.setJSON(`playground/${userId}`, {
        files,
        activeId: activeId ?? null,
        savedAt: Date.now(),
      });
      return jsonResponse({ status: "success", message: "Workspace tersimpan." });
    }

    return jsonResponse({ status: "error", message: "Method not allowed" }, 405);
  } catch (error) {
    return jsonResponse(
      { status: "error", message: "Gagal mengakses workspace", error: error.message },
      500,
    );
  }
}
