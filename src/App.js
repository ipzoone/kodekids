import React, { useState } from "react";
import HomePage from "./components/HomePage";
import ModeSelect from "./components/ModeSelect";
import Materials from "./components/Materials";
import Playground from "./components/Playground";
import Navbar from "./components/Navbar";
import ChatWidget from "./components/ChatWidget";
import AuthPage from "./components/AuthPage";
import { DotPattern } from "./components/magicui/DotPattern";
import GameBlockPuzzle from "./components/GameBlockPuzzle";
import GameBlockly from "./components/GameBlockly";
import GameCode from "./components/GameCode";
import { loadStoredUser, storeUser } from "./services/api";

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

  function goHome() {
    setPendingMode(null);
    setMode(null);
    setAgeGroup(null);
    setAuthMode(null);
  }

  function handleNavigate(target) {
    setAuthMode(null);
    if (target === "home") {
      goHome();
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

  function handleLogout() {
    setUser(null);
    storeUser(null);
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
  } else if (mode === "materi") {
    screen = <Materials ageGroup={ageGroup} onHome={goHome} />;
    navActive = "materi";
  } else if (mode === "playground") {
    screen = <Playground onHome={goHome} user={user} />;
    navActive = "playground";
  } else if (ageGroup && mode === "challenge") {
    const Game = GAMES[ageGroup];
    screen = <Game onHome={() => setMode(null)} />;
    navActive = "challenge";
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
    </div>
  );
}
