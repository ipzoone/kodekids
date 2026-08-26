import React, { useState, useEffect } from "react";
import HomePage from "./components/HomePage";
import ModeSelect from "./components/ModeSelect";
import LevelSelect from "./components/LevelSelect";
import Materials from "./components/Materials";
import Playground from "./components/Playground";
import Navbar from "./components/Navbar";
import ChatWidget from "./components/ChatWidget";
import AuthPage from "./components/AuthPage";
import Profile from "./components/Profile";
import Leaderboard from "./components/Leaderboard";
import PublicProfile from "./components/PublicProfile";
import AchievementPopup from "./components/AchievementPopup";
import { DotPattern } from "./components/magicui/DotPattern";
import GameBlockPuzzle from "./components/GameBlockPuzzle";
import GameBlockly from "./components/GameBlockly";
import GameCode from "./components/GameCode";
import { loadStoredUser, storeUser, loadProgress } from "./services/api";

const GAMES = {
  "5-7": GameBlockPuzzle,
  "8-10": GameBlockly,
  "11-15": GameCode,
};

export default function App() {
  const [user, setUser] = useState(loadStoredUser);
  const [authMode, setAuthMode] = useState(null); // null | "login"
  const [ageGroup, setAgeGroup] = useState(null);
  const [mode, setMode] = useState(null);
  const [pendingMode, setPendingMode] = useState(null);
  const [challengeLevel, setChallengeLevel] = useState(null); // level yang dipilih di layar pilih level
  const [badgePopup, setBadgePopup] = useState(null); // id badge untuk popup achievement
  const [selectedPublicUserId, setSelectedPublicUserId] = useState(null);

  // Dengarkan event badge baru dari saveAgeProgress (services/api.js)
  useEffect(() => {
    function onBadge(e) {
      const id = e.detail;
      setBadgePopup((prev) => prev || id); // antre: tampilkan satu dulu
    }
    window.addEventListener("new-badge", onBadge);
    return () => window.removeEventListener("new-badge", onBadge);
  }, []);

  function closeBadgePopup() {
    setBadgePopup(null);
  }

  function setSelectedPublicUser(id) {
    setSelectedPublicUserId(id);
    setMode("public-profile");
  }

  function goHome() {
    setPendingMode(null);
    setMode(null);
    setAgeGroup(null);
    setAuthMode(null);
    setChallengeLevel(null);
  }

  // Keluar dari game kembali ke layar pilih mode (umur tetap tersimpan)
  function backToModeSelect() {
    setChallengeLevel(null);
    setMode(null);
  }

  function handleNavigate(target) {
    setAuthMode(null);
    setChallengeLevel(null);
    if (target === "home") {
      goHome();
      return;
    }
    if (target === "leaderboard") {
      setMode("leaderboard");
      setPendingMode(null);
      return;
    }
    // Halaman profil: butuh login, tidak butuh pilih umur
    if (target === "profile") {
      if (!user) {
        setMode(null);
        setPendingMode(null);
        setAuthMode("login");
        return;
      }
      setMode("profile");
      setPendingMode(null);
      return;
    }
    // Playground tidak butuh umur
    if (target === "playground") {
      setMode("playground");
      setPendingMode(null);
      return;
    }
    // Materi / Challenge: kalau umur sudah dipilih langsung buka,
    // kalau belum, arahkan ke halaman pilih umur dulu.
    // Materi bisa dibuka tanpa pilih umur (tampilkan semuanya)
    if (target === "materi") {
      setAgeGroup(null);
      setMode("materi");
      setPendingMode(null);
      return;
    }
    if (ageGroup) {
      setMode(target);
      setPendingMode(null);
    } else {
      setPendingMode(target);
      setMode(null);
      setAgeGroup(null);
    }
  }

  function handleLoginSuccess(loggedInUser) {
    setUser(loggedInUser);
    storeUser(loggedInUser);
    setAuthMode(null);
    setMode("playground");
  }

  // Dipanggil Profile.jsx setelah profil disimpan — update state & localStorage
  function handleUpdateUser(updatedUser) {
    const merged = { ...user, ...updatedUser };
    setUser(merged);
    storeUser(merged);
  }

  function handleLogout() {
    setUser(null);
    storeUser(null);
    // Lupakan sesi Google yang terpilih supaya login berikutnya bisa ganti akun
    try {
      window.google?.accounts?.id?.disableAutoSelect();
    } catch {}
    fetch("/auth/logout", { method: "POST" }).catch(() => {});
    if (mode === "playground") setMode(null);
  }

  function handleSelectAge(group) {
    if (pendingMode) {
      setMode(pendingMode);
      setPendingMode(null);
    }
    setAgeGroup(group);
  }

  let screen = <HomePage onSelect={handleSelectAge} />;
  let navActive = "home";

  if (authMode === "login") {
    screen = (
      <AuthPage
        onBack={goHome}
        onSuccess={handleLoginSuccess}
        initialMode="login"
      />
    );
    navActive = "login";
  } else if (mode === "leaderboard") {
    screen = <Leaderboard onBack={goHome} onSelectUser={(id) => setSelectedPublicUser(id)} />;
    navActive = "leaderboard";
  } else if (mode === "public-profile") {
    screen = <PublicProfile userId={selectedPublicUserId} onBack={() => setMode("leaderboard")} />;
    navActive = "leaderboard";
  } else if (mode === "profile") {
    screen = (
      <Profile
        user={user}
        onUpdateUser={handleUpdateUser}
        onBack={goHome}
      />
    );
    navActive = "profile";
  } else if (mode === "materi") {
    screen = <Materials ageGroup={ageGroup} onHome={goHome} />;
    navActive = "materi";
  } else if (mode === "playground") {
    screen = <Playground onHome={goHome} user={user} />;
    navActive = "playground";
  } else if (ageGroup && mode === "challenge") {
    // Level belum dipilih -> tampilkan layar pilih level (yang terkunci tidak bisa dibuka)
    if (challengeLevel == null) {
      screen = (
        <LevelSelect
          ageGroup={ageGroup}
          onBack={backToModeSelect}
          onSelect={(lvl) => setChallengeLevel(lvl)}
        />
      );
      navActive = "challenge";
    } else {
      const Game = GAMES[ageGroup];
      const prog = loadProgress()[ageGroup] || {};
      // Main ulang level lama = mode latihan: progres & poin tersimpan tidak terganggu
      const practice = challengeLevel < (prog.level || 1);
      screen = (
        <Game
          key={`${ageGroup}-L${challengeLevel}-${practice ? "latihan" : "utama"}`}
          onHome={backToModeSelect}
          initialLevel={challengeLevel}
          practice={practice}
        />
      );
      navActive = "challenge";
    }
  } else if (ageGroup) {
    screen = (
      <ModeSelect ageGroup={ageGroup} onBack={goHome} onMode={(m) => setMode(m)} />
    );
  } else if (pendingMode) {
    navActive = pendingMode;
  }

  return (
    <div className="min-h-screen relative">
      <DotPattern className="fixed -z-10 [mask-image:radial-gradient(600px_circle_at_50%_0%,white,transparent)]" />
      <Navbar
        active={navActive}
        onNavigate={(t) => (t === "login" ? (setMode(null), setAuthMode("login")) : handleNavigate(t))}
        user={user}
        onLogout={handleLogout}
      />
      <div className="relative">{screen}</div>
      <ChatWidget />
      {badgePopup && (
        <AchievementPopup badgeId={badgePopup} onClose={closeBadgePopup} />
      )}
    </div>
  );
}
