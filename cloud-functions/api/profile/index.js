// cloud-functions/api/profile/index.js — dashboard profil user.
// GET  ?userId=            -> ambil profil
// POST {userId,name,avatarUrl} -> perbarui nama & avatar
import fs from "node:fs";
import path from "node:path";

function readEnvVar(key) {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    try {
      const content = fs.readFileSync(path.join(dir, ".env"), "utf-8");
      const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
      if (match) return match[1].trim();
    } catch {}
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return "";
}

function getEnv(context, key) {
  return context.env?.[key] || readEnvVar(key) || "";
}

function normalizeDbUrl(raw) {
  let u = String(raw ?? "").trim().replace(/^["']+|["']+$/g, "");
  if (u.startsWith("libsql://")) u = "https://" + u.slice("libsql://".length);
  else if (!/^https?:\/\//i.test(u)) u = "https://" + u.replace(/^\/+/, "");
  return u;
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" },
  });
}

async function executeTurso(url, token, sql, args) {
  const body = JSON.stringify({ stmt: { sql, args } });
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${url}/v1/execute`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body,
      });
      if (!res.ok) {
        throw new Error(`Turso HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      }
      return JSON.parse(await res.text());
    } catch (e) {
      lastErr = e;
      console.error(`[profile] Percobaan ${attempt} gagal: ${e.message}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 700));
    }
  }
  throw lastErr;
}

function rowsToObjects(parsedResult) {
  const cols = parsedResult.result?.cols?.map((c) => c.name) || [];
  return (parsedResult.result?.rows || []).map((row) => {
    const obj = {};
    cols.forEach((colName, idx) => {
      const cell = row[idx];
      obj[colName] = cell?.type === "null" ? null : (cell?.value ?? cell);
    });
    return obj;
  });
}

async function onRequestInternal(context) {
  const rawUrl = getEnv(context, "DB_URL_TURSO");
  const token = getEnv(context, "TOKEN_TURSO");
  if (!rawUrl || !token) {
    return jsonResponse({ status: "error", message: "Konfigurasi DB belum terpasang." }, 500);
  }
  const url = normalizeDbUrl(rawUrl);
  const request = context.request;

  // ===== GET ?userId= — ambil profil =====
  if (request.method === "GET") {
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) {
      return jsonResponse({ status: "error", message: "userId wajib diisi." }, 400);
    }
    const rows = rowsToObjects(
      await executeTurso(url, token, "SELECT id, name, email, avatar_url FROM users WHERE id = ? LIMIT 1", [
        { type: "text", value: String(userId) },
      ]),
    );
    if (!rows.length) {
      return jsonResponse({ status: "error", message: "User tidak ditemukan." }, 404);
    }
    const u = rows[0];
    return jsonResponse({
      status: "success",
      data: { id: parseInt(u.id, 10), name: u.name, email: u.email, avatar_url: u.avatar_url },
    });
  }

  // ===== POST — perbarui profil =====
  if (request.method === "POST") {
    let body = {};
    try {
      body = await request.json();
    } catch {}
    const { userId, name, avatarUrl } = body;

    if (!userId) {
      return jsonResponse({ status: "error", message: "userId wajib diisi." }, 400);
    }
    const cleanName = String(name ?? "").trim();
    if (!cleanName) {
      return jsonResponse({ status: "error", message: "Nama tidak boleh kosong." }, 400);
    }
    if (cleanName.length > 40) {
      return jsonResponse({ status: "error", message: "Nama maksimal 40 karakter." }, 400);
    }
    const cleanAvatar = String(avatarUrl ?? "").trim();
    if (cleanAvatar && !/^https?:\/\/.+/i.test(cleanAvatar)) {
      return jsonResponse(
        { status: "error", message: "Avatar harus berupa link gambar yang valid (http/https)." },
        400,
      );
    }

    await executeTurso(
      url,
      token,
      "UPDATE users SET name = ?, avatar_url = ? WHERE id = ?",
      [
        { type: "text", value: cleanName },
        cleanAvatar ? { type: "text", value: cleanAvatar } : { type: "null" },
        { type: "text", value: String(userId) },
      ],
    );

    return jsonResponse({
      status: "success",
      message: "Profil berhasil diperbarui.",
      data: { id: parseInt(userId, 10), name: cleanName, avatar_url: cleanAvatar || null },
    });
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
    console.error("[profile] Error:", error.message);
    return jsonResponse(
      { status: "error", message: "Gagal memproses profil", error: error.message },
      500,
    );
  }
}
