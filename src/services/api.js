// Badge: hitung & bandingkan dari progres
import { computeBadges, diffNewBadges } from "../utils/badges";

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

// ===== Profil =====
export async function fetchProfile(userId) {
  const res = await fetch(`/api/profile?userId=${encodeURIComponent(userId)}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json;
}

export async function saveProfile(userId, name, avatarUrl) {
  const res = await fetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, name, avatarUrl }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json;
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

// ===== Progres challenge — DISIMPAN PER USER =====
// Kunci memakai userId supaya tiap akun punya progres sendiri.
// Belum login -> kunci guest (terpisah, mulai dari nol).
const LEGACY_PROGRESS_KEYS = ["kidcode-progress-v1"];

function currentUserOrNull() {
  try {
    return JSON.parse(localStorage.getItem("kidcode-user")) || null;
  } catch {
    return null;
  }
}

function progressKey() {
  const user = currentUserOrNull();
  return user?.id ? `kk-progress-${user.id}` : "kk-progress-guest";
}

export function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(progressKey())) || {};
  } catch {
    return {};
  }
}

export function saveAgeProgress(ageGroup, data) {
  const user = currentUserOrNull();
  const all = loadProgress();
  all[ageGroup] = { ...(all[ageGroup] || {}), ...data };
  localStorage.setItem(progressKey(), JSON.stringify(all));

  // Bersihkan sisa penyimpanan versi lama yang bersifat global
  for (const k of LEGACY_PROGRESS_KEYS) localStorage.removeItem(k);

  // ===== Badge & sinkronisasi rank (hanya kalau sedang login) =====
  if (!user?.id) return all;
  try {
    const earned = computeBadges(all);
    // Set badge yang sudah terlihat juga per-user
    const badgeKey = `kk-badges-known-${user.id}`;
    const known = JSON.parse(localStorage.getItem(badgeKey) || "[]");
    const fresh = diffNewBadges(earned, known);
    if (fresh.length) {
      localStorage.setItem(badgeKey, JSON.stringify(known.concat(fresh)));
      // Popup achievement ditangani App.js lewat event ini
      for (const id of fresh) {
        window.dispatchEvent(new CustomEvent("new-badge", { detail: id }));
      }
    }
    // Sinkron ke papan peringkat (fire-and-forget, tidak memblokir game)
    syncRank(user, all, earned).catch(() => {});
  } catch {}

  return all;
}

// Kirim progres + badge ke papan peringkat (EdgeOne Blob KV)
async function syncRank(user, progress, badges) {
  await fetch("/api/rank", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: user.id,
      name: user.name,
      avatarUrl: user.avatar_url || null,
      badges,
      scores: {
        "5-7": progress["5-7"]?.totalScore || 0,
        "8-10": progress["8-10"]?.totalScore || 0,
        "11-15": progress["11-15"]?.totalScore || 0,
      },
    }),
  });
}

// Versi publik — dipakai Profile.jsx setelah ganti nama/avatar
export function syncRankProfile(user) {
  const progress = loadProgress();
  return syncRank(user, progress, computeBadges(progress)).catch(() => {});
}

// ===== Leaderboard & profil publik =====
export async function fetchLeaderboard(game) {
  const res = await fetch(`/api/rank?type=board&game=${encodeURIComponent(game)}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json.data || [];
}

export async function fetchPublicUser(userId) {
  const res = await fetch(`/api/rank?type=user&id=${encodeURIComponent(userId)}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json.data;
}
