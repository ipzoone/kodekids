// cloud-functions/api/materials/index.js — menyajikan daftar & detail materi dari Turso.
// GET /api/materials?ageGroup=8-10          -> semua materi kelompok umur
// GET /api/materials?ageGroup=8-10&order=2  -> satu materi spesifik
// Akses DB pakai HTTP API Turso via fetch (kompatibel runtime EdgeOne).
import fs from "node:fs";
import path from "node:path";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, makers-conversation-id",
};

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function readEnvVar(key) {
  try {
    const content = fs.readFileSync(path.join(process.cwd(), ".env"), "utf-8");
    const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
    return match ? match[1].trim() : "";
  } catch {
    return "";
  }
}

function getTursoConfig(context) {
  const rawUrl = context.env.DB_URL_TURSO || readEnvVar("DB_URL_TURSO");
  const token = context.env.TOKEN_TURSO || readEnvVar("TOKEN_TURSO");
  if (!rawUrl || !token) {
    throw new Error(
      "DB_URL_TURSO / TOKEN_TURSO belum tersedia. Tambahkan sebagai environment variables di konsol EdgeOne."
    );
  }
  return { apiUrl: rawUrl.replace("libsql://", "https://"), token };
}

function typedArg(v) {
  if (v === null || v === undefined) return { type: "null" };
  if (typeof v === "number") {
    return Number.isInteger(v)
      ? { type: "integer", value: String(v) }
      : { type: "float", value: String(v) };
  }
  return { type: "text", value: String(v) };
}

async function query(cfg, sql, args = []) {
  const res = await fetch(`${cfg.apiUrl}/v1/execute`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ stmt: { sql, args: args.map(typedArg) } }),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Turso HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  if (json.error) throw new Error(`Turso error: ${JSON.stringify(json.error)}`);

  const r = json.result || {};
  const cols = (r.cols || []).map((c) => c.name);
  return (r.rows || []).map((row) => {
    const obj = {};
    cols.forEach((name, i) => {
      const cell = row[i];
      obj[name] = cell?.type === "null" ? null : (cell?.value ?? cell);
    });
    return obj;
  });
}

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(context.request.url);
  const ageGroup = ["5-7", "8-10", "11-15"].includes(url.searchParams.get("ageGroup"))
    ? url.searchParams.get("ageGroup")
    : null;
  const order = Number(url.searchParams.get("order")) || null;

  if (!ageGroup) {
    return jsonResponse(
      { ok: false, error: "Parameter ageGroup wajib: 5-7 | 8-10 | 11-15" },
      400,
    );
  }

  try {
    const cfg = getTursoConfig(context);

    let rows;
    if (order) {
      rows = await query(
        cfg,
        "SELECT order_num, title, subtitle, icon, color, content FROM materials WHERE age_group = ? AND order_num = ?",
        [ageGroup, order]
      );
    } else {
      rows = await query(
        cfg,
        "SELECT order_num, title, subtitle, icon, color, content FROM materials WHERE age_group = ? ORDER BY order_num ASC",
        [ageGroup]
      );
    }

    const materials = rows.map((row) => {
      let content = {};
      try {
        content = JSON.parse(row.content);
      } catch {}
      return {
        order: Number(row.order_num),
        title: row.title,
        subtitle: row.subtitle,
        icon: row.icon,
        color: row.color,
        content,
      };
    });

    if (order) {
      return jsonResponse({ ok: true, material: materials[0] ?? null });
    }
    return jsonResponse({ ok: true, ageGroup, total: materials.length, materials });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message }, 500);
  }
}
