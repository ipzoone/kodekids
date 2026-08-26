// cloud-functions/auth/login/index.js — login user via Turso DB (REST API).
// Password dibandingkan sebagai hash SHA-256 hex.

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
    return new Response(JSON.stringify({ status: "error", message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const rawUrl = context.env.DB_URL_TURSO;
    const token = context.env.TOKEN_TURSO;
    if (!rawUrl || !token) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Konfigurasi DB_URL_TURSO atau TOKEN_TURSO belum terpasang di context.env",
        }),
        { status: 500, headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" } },
      );
    }

    const url = rawUrl.replace("libsql://", "https://");
    const body = await readBody(context);
    const { email, password } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ status: "error", message: "Email dan password wajib diisi." }),
        { status: 400, headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" } },
      );
    }

    const hashedPassword = await hashPassword(password);

    const loginQuery = "SELECT id, name, email, avatar_url, password FROM users WHERE email = ? LIMIT 1";
    const response = await fetch(`${url}/v1/execute`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stmt: {
          sql: loginQuery,
          args: [{ type: "text", value: String(email) }],
        },
      }),
    });

    const resultText = await response.text();
    if (!response.ok) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: `Gagal query ke Turso: ${response.status} ${response.statusText}`,
          detail: resultText,
        }),
        { status: response.status, headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" } },
      );
    }

    const parsedResult = JSON.parse(resultText);
    const rows = parsedResult.result?.rows || [];
    if (rows.length === 0) {
      return new Response(JSON.stringify({ status: "error", message: "Email tidak ditemukan." }), {
        status: 401,
        headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" },
      });
    }

    const rawRow = rows[0];
    const cols = parsedResult.result?.cols?.map((c) => c.name) || [];
    const userObj = {};
    cols.forEach((colName, idx) => {
      const cell = rawRow[idx];
      userObj[colName] = cell?.type === "null" ? null : (cell?.value ?? cell);
    });

    if (userObj.password !== hashedPassword) {
      return new Response(
        JSON.stringify({ status: "error", message: "Password yang Anda masukkan salah." }),
        { status: 401, headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" } },
      );
    }

    return new Response(
      JSON.stringify(
        {
          status: "success",
          message: "Login berhasil",
          data: {
            id: parseInt(userObj.id, 10),
            name: userObj.name,
            email: userObj.email,
            avatar_url: userObj.avatar_url,
          },
        },
        null,
        2,
      ),
      { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ status: "error", message: "Gagal memproses login", error: error.message }, null, 2),
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" } },
    );
  }
}
