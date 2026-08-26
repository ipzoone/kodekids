// turso.js — akses DB Turso lewat HTTP API (fetch), bukan @libsql/client.
// Pola ini yang terbukti jalan di runtime serverless EdgeOne
// (@libsql/client memakai modul native yang bisa menggantung di produksi).
import fs from "node:fs";
import path from "node:path";

function readEnvVar(key) {
  try {
    const content = fs.readFileSync(path.join(process.cwd(), ".env"), "utf-8");
    const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
    return match ? match[1].trim() : "";
  } catch {
    return "";
  }
}

export function getTursoConfig(context) {
  const rawUrl = context.env.DB_URL_TURSO || readEnvVar("DB_URL_TURSO");
  const token = context.env.TOKEN_TURSO || readEnvVar("TOKEN_TURSO");
  if (!rawUrl || !token) {
    throw new Error(
      "DB_URL_TURSO / TOKEN_TURSO belum tersedia. Tambahkan sebagai environment variables di konsol EdgeOne."
    );
  }
  return { apiUrl: rawUrl.replace("libsql://", "https://"), token };
}

// Konversi nilai JS -> format typed value Turso REST API
function typedArg(v) {
  if (v === null || v === undefined) return { type: "null" };
  if (typeof v === "number") {
    return Number.isInteger(v)
      ? { type: "integer", value: String(v) }
      : { type: "float", value: String(v) };
  }
  return { type: "text", value: String(v) };
}

// Jalankan satu statement, balikkan rows sebagai array of object
export async function query(cfg, sql, args = []) {
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
  const rows = (r.rows || []).map((row) => {
    const obj = {};
    cols.forEach((name, i) => {
      const cell = row[i];
      obj[name] = cell?.type === "null" ? null : (cell?.value ?? cell);
    });
    return obj;
  });
  return rows;
}

export async function ensureSchema(cfg) {
  await query(
    cfg,
    `CREATE TABLE IF NOT EXISTS challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      age_group TEXT NOT NULL,
      level INTEGER NOT NULL,
      step INTEGER NOT NULL DEFAULT 1,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      data TEXT NOT NULL DEFAULT '{}',
      UNIQUE(age_group, level, step)
    )`
  );
  await query(
    cfg,
    `CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      age_group TEXT NOT NULL,
      order_num INTEGER NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL DEFAULT '',
      icon TEXT NOT NULL DEFAULT 'FaBook',
      color TEXT NOT NULL DEFAULT 'emerald',
      content TEXT NOT NULL DEFAULT '{}',
      UNIQUE(age_group, order_num)
    )`
  );
}

export async function getAgeConfigFromDb(cfg, ageGroup) {
  const rows = await query(
    cfg,
    "SELECT age_group, label, max_levels FROM age_groups WHERE age_group = ?",
    [ageGroup]
  );
  return rows[0] || null;
}

export async function getChallengeFromDb(cfg, ageGroup, level, step = 1) {
  const rows = await query(
    cfg,
    "SELECT type, title, body, data FROM challenges WHERE age_group = ? AND level = ? AND step = ?",
    [ageGroup, level, step]
  );
  // Fallback: kalau soal dengan step itu tidak ada (mis. data lama), ambil step pertama
  const source = rows.length
    ? rows
    : await query(
        cfg,
        "SELECT type, title, body, data FROM challenges WHERE age_group = ? AND level = ? ORDER BY step LIMIT 1",
        [ageGroup, level]
      );
  if (!source.length) return null;
  const row = source[0];
  let data = {};
  try {
    data = JSON.parse(row.data);
  } catch {}
  return { type: row.type, title: row.title, body: row.body, data };
}
