// cloud-functions/auth/google/index.js — login/daftar via Google Sign-In.
// Frontend mengirim ID token (JWT) dari Google Identity Services, kita
// verifikasi ke endpoint tokeninfo Google lalu cari/buat user di Turso.
// Catatan: GOOGLE_CLIENT_SECRET tidak dipakai di alur ini (ID token flow),
// dan TIDAK PERNAH dikirim ke frontend.
import fs from "node:fs";
import path from "node:path";

function readEnvVar(key) {
  // Cari .env mulai dari cwd lalu naik maksimal 5 level (runtime bisa
  // menjalankan function dari subdirektori, bukan root proyek).
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

async function readBody(context) {
  const parsed = context.request.body;
  if (parsed && parsed.constructor === Object) return parsed;
  if (typeof context.request.json === "function") {
    try {
      return await context.request.json();
    } catch {}
  }
  return {};
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" },
  });
}

// Konversi libsql:// -> https:// dengan pembersihan kutip/spasi nyasar
function normalizeDbUrl(raw) {
  let u = String(raw ?? "").trim().replace(/^["']+|["']+$/g, "");
  if (u.startsWith("libsql://")) u = "https://" + u.slice("libsql://".length);
  else if (!/^https?:\/\//i.test(u)) u = "https://" + u.replace(/^\/+/, "");
  return u;
}

async function executeTurso(url, token, sql, args) {
  const body = JSON.stringify({ stmt: { sql, args } });
  let lastErr;
  // Coba 3 kali — kadang jaringan dari runtime ke Turso gagal sesaat
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
      console.error(
        `[auth/google] Percobaan ${attempt} ke Turso gagal: ${e.message} | cause: ${e.cause?.code || e.cause?.message || "-"}`,
      );
      if (attempt < 3) await new Promise((r) => setTimeout(r, 700));
    }
  }
  // Susun pesan dengan rantai penyebab asli dari undici (DNS, TLS, dsb.)
  const causes = [];
  let c = lastErr;
  while (c) {
    if (c.code || (c.message && c.message !== lastErr.message)) {
      causes.push(c.code ? `${c.code}: ${c.message}` : c.message);
    }
    c = c.cause;
  }
  throw new Error(
    `${lastErr.message}${causes.length ? " | sebab: " + causes.join(" -> ") : ""} (target: ${
      new URL(url).host
    }`,
  );
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

export async function onRequest(context) {
  const { request } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return jsonResponse({ status: "error", message: "Method not allowed" }, 405);
  }

  try {
    const rawUrl = getEnv(context, "DB_URL_TURSO");
    const token = getEnv(context, "TOKEN_TURSO");
    const clientId = getEnv(context, "GOOGLE_CLIENT_ID");
    if (!rawUrl || !token || !clientId) {
      return jsonResponse(
        { status: "error", message: "Konfigurasi DB / GOOGLE_CLIENT_ID belum terpasang." },
        500,
      );
    }
    const url = normalizeDbUrl(rawUrl);

    const { credential, debug } = await readBody(context);

    // ===== Mode diagnosa: {"debug":"db"} -> tes konektivitas Turso mentah =====
    if (debug === "db") {
      try {
        const r = await executeTurso(url, token, "SELECT 1 AS ok", []);
        return jsonResponse({
          status: "success",
          message: "Koneksi Turso OK",
          data: r.result,
        });
      } catch (e) {
        return jsonResponse(
          { status: "error", message: "Diagnosa Turso gagal", error: e.message },
          500,
        );
      }
    }

    if (!credential || typeof credential !== "string") {
      return jsonResponse(
        { status: "error", message: "Credential Google wajib diisi." },
        400,
      );
    }

    // ===== Verifikasi ID token ke Google =====
    let info;
    try {
      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`,
      );
      if (!verifyRes.ok) {
        return jsonResponse(
          { status: "error", message: "Token Google tidak valid atau kedaluwarsa." },
          401,
        );
      }
      info = await verifyRes.json();
    } catch (e) {
      console.error("[auth/google] Gagal menghubungi tokeninfo:", e.message);
      return jsonResponse(
        {
          status: "error",
          message: "Gagal menghubungi server Google untuk verifikasi. Coba lagi.",
          error: e.message,
        },
        502,
      );
    }

    // Pastikan token memang diterbitkan untuk aplikasi ini
    if (info.aud !== clientId) {
      return jsonResponse(
        {
          status: "error",
          message: "Client ID tidak cocok — pastikan GOOGLE_CLIENT_ID di server sama dengan yang dipakai tombol login.",
          error: `aud=${info.aud}`,
        },
        401,
      );
    }
    if (info.email_verified !== "true" && info.email_verified !== true) {
      return jsonResponse(
        { status: "error", message: "Email Google belum terverifikasi." },
        401,
      );
    }

    const email = String(info.email).toLowerCase();
    const googleSub = String(info.sub || ""); // ID unik akun Google
    const name = info.name || info.given_name || email.split("@")[0];
    const avatarUrl = info.picture || null;

    // ===== Deteksi kolom yang tersedia di tabel users =====
    // Skema bisa berbeda (ada/tidaknya google_id, avatar_url) — sesuaikan otomatis.
    let hasGoogleId = false;
    let hasAvatarUrl = false;
    try {
      const tableInfo = rowsToObjects(await executeTurso(url, token, "PRAGMA table_info(users)", []));
      for (const col of tableInfo) {
        if (col.name === "google_id") hasGoogleId = true;
        if (col.name === "avatar_url") hasAvatarUrl = true;
      }
    } catch (e) {
      console.error("[auth/google] Gagal membaca struktur tabel:", e.message);
      // Asumsikan skema dasar saja
    }

    // ===== Cari user: cocokkan google_id ATAU email =====
    let existing;
    try {
      const selectCols = ["id", "name", "email", ...(hasAvatarUrl ? ["avatar_url"] : []), ...(hasGoogleId ? ["google_id"] : [])];
      const where = hasGoogleId ? "email = ? OR google_id = ?" : "email = ?";
      const args = hasGoogleId
        ? [
            { type: "text", value: email },
            { type: "text", value: googleSub },
          ]
        : [{ type: "text", value: email }];
      existing = rowsToObjects(
        await executeTurso(
          url,
          token,
          `SELECT ${selectCols.join(", ")} FROM users WHERE ${where} LIMIT 1`,
          args,
        ),
      );
    } catch (e) {
      console.error("[auth/google] Gagal query Turso:", e.message);
      return jsonResponse(
        { status: "error", message: "Gagal mengakses database.", error: e.message },
        500,
      );
    }

    let user;
    if (existing.length > 0) {
      // Sudah terdaftar (login biasa maupun Google) — langsung masukkan
      const u = existing[0];
      user = { id: parseInt(u.id, 10), name: u.name, email: u.email, avatar_url: u.avatar_url ?? null };

      // Update data yang belum terisi: google_id & avatar Google
      const updates = [];
      const updateArgs = [];
      if (hasGoogleId && !u.google_id && googleSub) {
        updates.push("google_id = ?");
        updateArgs.push({ type: "text", value: googleSub });
      }
      if (hasAvatarUrl && !u.avatar_url && avatarUrl) {
        updates.push("avatar_url = ?");
        updateArgs.push({ type: "text", value: avatarUrl });
        user.avatar_url = avatarUrl;
      }
      if (updates.length) {
        await executeTurso(url, token, `UPDATE users SET ${updates.join(", ")} WHERE id = ?`, [
          ...updateArgs,
          { type: "text", value: String(user.id) },
        ]);
      }
    } else {
      // Belum terdaftar — buat akun baru. Password acak agar tidak bisa
      // ditebak; login via password untuk akun Google tetap tidak mungkin.
      const randomPassword =
        crypto.randomUUID().replace(/-/g, "") + Date.now().toString(36);
      const insertCols = ["name", "email", "password"];
      const insertArgs = [
        { type: "text", value: name },
        { type: "text", value: email },
        { type: "text", value: await hashPassword(randomPassword) },
      ];
      if (hasAvatarUrl) {
        insertCols.push("avatar_url");
        insertArgs.push(avatarUrl ? { type: "text", value: avatarUrl } : { type: "null" });
      }
      if (hasGoogleId) {
        insertCols.push("google_id");
        insertArgs.push({ type: "text", value: googleSub });
      }
      const placeholders = insertCols.map(() => "?").join(", ");
      let insert;
      try {
        insert = await executeTurso(
          url,
          token,
          `INSERT INTO users (${insertCols.join(", ")}) VALUES (${placeholders})`,
          insertArgs,
        );
      } catch (e) {
        console.error("[auth/google] Gagal insert user:", e.message);
        return jsonResponse(
          { status: "error", message: "Gagal membuat akun dari akun Google kamu.", error: e.message },
          500,
        );
      }
      user = {
        id: parseInt(insert.result?.last_insert_rowid, 10),
        name,
        email,
        avatar_url: hasAvatarUrl ? avatarUrl : undefined,
      };
    }

    return jsonResponse({
      status: "success",
      message: "Login dengan Google berhasil",
      data: user,
    });
  } catch (error) {
    return jsonResponse(
      { status: "error", message: "Gagal memproses login Google", error: error.message },
      500,
    );
  }
}
