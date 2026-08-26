// cloud-functions/auth/logout/index.js — endpoint logout.
// Auth saat ini stateless (tanpa session/JWT di server), jadi logout utamanya
// dilakukan client dengan menghapus data user dari localStorage.
// Endpoint ini hanya konfirmasi + tempat invalidasi token bila nanti pakai JWT.

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

  // Bila nanti pakai token JWT/session di cookie, hapus di sini:
  // response headers tambahkan Set-Cookie untuk menghapus cookie sesi.

  return jsonResponse({ status: "success", message: "Logout berhasil" });
}
