// cloud-functions/auth/register/index.js — daftar akun baru ke Turso DB.
// Password disimpan sebagai hash SHA-256 hex (konsisten dengan login).

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
    const rawUrl = context.env.DB_URL_TURSO;
    const token = context.env.TOKEN_TURSO;
    if (!rawUrl || !token) {
      return jsonResponse(
        {
          status: "error",
          message: "Konfigurasi DB_URL_TURSO atau TOKEN_TURSO belum terpasang di context.env",
        },
        500,
      );
    }

    const url = rawUrl.replace("libsql://", "https://");
    const body = await readBody(context);
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return jsonResponse({ status: "error", message: "Nama, email, dan password wajib diisi." }, 400);
    }
    if (String(password).length < 6) {
      return jsonResponse({ status: "error", message: "Password minimal 6 karakter." }, 400);
    }

    // Cek email sudah terdaftar
    const checkResponse = await fetch(`${url}/v1/execute`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stmt: {
          sql: "SELECT id FROM users WHERE email = ? LIMIT 1",
          args: [{ type: "text", value: String(email).toLowerCase() }],
        },
      }),
    });

    if (!checkResponse.ok) {
      const detail = await checkResponse.text();
      return jsonResponse(
        { status: "error", message: `Gagal query ke Turso: ${checkResponse.status}`, detail },
        checkResponse.status,
      );
    }

    const checkResult = JSON.parse(await checkResponse.text());
    if ((checkResult.result?.rows || []).length > 0) {
      return jsonResponse({ status: "error", message: "Email sudah terdaftar." }, 409);
    }

    const hashedPassword = await hashPassword(password);

    const insertResponse = await fetch(`${url}/v1/execute`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stmt: {
          sql: "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
          args: [
            { type: "text", value: String(name) },
            { type: "text", value: String(email).toLowerCase() },
            { type: "text", value: hashedPassword },
          ],
        },
      }),
    });

    if (!insertResponse.ok) {
      const detail = await insertResponse.text();
      return jsonResponse(
        { status: "error", message: `Gagal menyimpan user: ${insertResponse.status}`, detail },
        insertResponse.status,
      );
    }

    const insertResult = JSON.parse(await insertResponse.text());
    if (insertResult.error) {
      return jsonResponse(
        { status: "error", message: "Gagal menyimpan user", detail: insertResult.error },
        500,
      );
    }
    const rowid = insertResult.result?.last_insert_rowid ?? null;

    return jsonResponse(
      {
        status: "success",
        message: "Registrasi berhasil",
        data: { id: rowid, name, email: String(email).toLowerCase() },
      },
      201,
    );
  } catch (error) {
    return jsonResponse({ status: "error", message: "Gagal memproses registrasi", error: error.message }, 500);
  }
}
