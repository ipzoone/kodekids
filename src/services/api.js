const CONVERSATION_ID = "game-" + Math.random().toString(36).slice(2);

export async function callGame(payload) {
  const res = await fetch("/api/game", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "makers-conversation-id": CONVERSATION_ID,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

// Eksekusi kode via agent /runner (satu-satunya yang punya akses EdgeOne Sandbox)
// mode: "test" (jalankan test case) | "run" (jalankan apa adanya untuk preview)
export async function callRunner({ language, code, tests, mode = "test" }) {
  const res = await fetch("/runner", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "makers-conversation-id": CONVERSATION_ID,
    },
    body: JSON.stringify({ language, code, tests, mode }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

// ===== Auth =====
export async function callAuth(action, payload) {
  // "api-google" dipetakan ke /api/auth-google (grup /api/* terbukti bisa
  // mengakses Turso dari produksi; grup /auth/* bermasalah egressnya)
  const path = action === "api-google" ? `/api/auth-google` : `/auth/${action}`;
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Sertakan detail teknis kalau ada, supaya penyebab gagal kelihatan
    const parts = [json.message, json.detail || json.error].filter(Boolean);
    throw new Error(parts.join(" — ") || `HTTP ${res.status}`);
  }
  return json;
}

export function loadStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("kidcode-user")) || null;
  } catch {
    return null;
  }
}

export function storeUser(user) {
  if (user) localStorage.setItem("kidcode-user", JSON.stringify(user));
  else localStorage.removeItem("kidcode-user");
}

// ===== Workspace Playground (conversation storage per user via Blob) =====
export async function loadWorkspace(userId) {
  const res = await fetch(`/api/workspace?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.data || null;
}

export async function saveWorkspace(userId, files, activeId) {
  const res = await fetch("/api/workspace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, files, activeId }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

const PROGRESS_KEY = "kidcode-progress-v1";

export function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveAgeProgress(ageGroup, data) {
  const all = loadProgress();
  all[ageGroup] = { ...(all[ageGroup] || {}), ...data };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  return all;
}
