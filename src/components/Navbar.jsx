import React, { useEffect, useState } from "react";
import {
  FaBook,
  FaGamepad,
  FaHome,
  FaFolderOpen,
  FaSignInAlt,
  FaSignOutAlt,
  FaUserCircle,
  FaBars,
  FaTimes,
} from "react-icons/fa";

export default function Navbar({ active, onNavigate, user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const items = [
    { id: "home", label: "Beranda", Icon: FaHome },
    { id: "materi", label: "Materi", Icon: FaBook },
    { id: "challenge", label: "Challenge", Icon: FaGamepad },
    { id: "playground", label: "Playground", Icon: FaFolderOpen },
  ];

  // Tutup menu kalau pindah halaman / layar diperbesar ke desktop
  useEffect(() => {
    setMenuOpen(false);
  }, [active]);
  useEffect(() => {
    const onResize = () => window.innerWidth >= 860 && setMenuOpen(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function handleNav(target) {
    setMenuOpen(false);
    onNavigate(target);
  }

  return (
    <nav className="sticky top-0 z-40 bg-kk-paper border-b-[3px] border-kk-ink">
      {/* ===== Bar atas (desktop & mobile) ===== */}
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
        <button
          onClick={() => handleNav("home")}
          className="flex items-center gap-2.5 font-display font-semibold text-xl text-kk-ink shrink-0"
        >
          <span className="bg-kk-indigo w-9 h-9 rounded-[11px] border-[2.5px] border-kk-ink flex items-center justify-center font-mono font-bold text-white text-sm">
            &lt;/&gt;
          </span>
          KodeKids
        </button>

        {/* Nav pills — hanya desktop */}
        <div className="hidden md:flex items-center gap-1 sm:gap-1.5">
          {items.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-sm font-bold border-2 transition-all hover:-translate-y-px ${
                active === id
                  ? "bg-kk-sun text-kk-ink border-kk-ink"
                  : "text-kk-inksoft border-transparent hover:bg-kk-cream"
              }`}
            >
              <Icon /> <span>{label}</span>
            </button>
          ))}

          {user ? (
            <div className="flex items-center gap-2 ml-1 sm:ml-2 pl-1 sm:pl-3 border-l-2 border-kk-ink/10">
              <button
                onClick={() => onNavigate("profile")}
                title="Profil kamu"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border-2 transition-all hover:-translate-y-px ${
                  active === "profile"
                    ? "bg-kk-sun text-kk-ink border-kk-ink"
                    : "text-kk-ink border-transparent hover:bg-kk-cream"
                }`}
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover bg-kk-cream"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                ) : (
                  <FaUserCircle className="text-kk-indigo text-lg" />
                )}
                <span className="hidden lg:inline">{user.name}</span>
              </button>
              <button
                onClick={onLogout}
                title="Keluar"
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold text-kk-coraldeep hover:bg-kk-coral/10 transition-colors"
              >
                <FaSignOutAlt /> Keluar
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate("login")}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 ml-1 sm:ml-2 rounded-full text-sm font-bold border-2 transition-colors ${
                active === "login"
                  ? "bg-kk-sun text-kk-ink border-kk-ink"
                  : "bg-kk-teal text-white border-kk-ink shadow-kk-sm hover:brightness-110"
              }`}
            >
              <FaSignInAlt /> Masuk
            </button>
          )}
        </div>

        {/* Tombol hamburger — hanya mobile */}
        <div className="md:hidden flex items-center gap-2">
          {!user && (
            <button
              onClick={() => onNavigate("login")}
              title="Masuk"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold border-2 ${
                active === "login"
                  ? "bg-kk-sun text-kk-ink border-kk-ink"
                  : "bg-kk-teal text-white border-kk-ink shadow-kk-sm"
              }`}
            >
              <FaSignInAlt />
            </button>
          )}
          {user && (
            <span
              title={user.name}
              className="flex items-center text-sm font-bold text-kk-ink"
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  className="w-7 h-7 rounded-full border-2 border-kk-ink object-cover bg-kk-cream cursor-pointer"
                  onClick={() => onNavigate("profile")}
                />
              ) : (
                <FaUserCircle
                  className="text-kk-indigo text-lg cursor-pointer"
                  onClick={() => onNavigate("profile")}
                />
              )}
            </span>
          )}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuOpen}
            className="w-10 h-10 rounded-xl bg-kk-sun border-[2.5px] border-kk-ink shadow-kk-sm flex items-center justify-center text-kk-ink active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            {menuOpen ? <FaTimes className="text-lg" /> : <FaBars className="text-lg" />}
          </button>
        </div>
      </div>

      {/* ===== Menu dropdown mobile ===== */}
      {menuOpen && (
        <div className="md:hidden border-t-[3px] border-kk-ink bg-kk-paper px-4 py-3 space-y-1.5 animate-[pop_.15s_ease]">
          {items.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => handleNav(id)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-bold border-2 transition-colors ${
                active === id
                  ? "bg-kk-sun text-kk-ink border-kk-ink"
                  : "text-kk-inksoft border-transparent bg-kk-cream hover:bg-kk-sun/25"
              }`}
            >
              <Icon className="text-base" /> {label}
              {active === id && <span className="ml-auto w-2.5 h-2.5 rounded-full bg-kk-ink" />}
            </button>
          ))}
          {user && (
            <button
              onClick={() => handleNav("profile")}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-bold border-2 transition-colors ${
                active === "profile"
                  ? "bg-kk-sun text-kk-ink border-kk-ink"
                  : "text-kk-inksoft border-transparent bg-kk-cream hover:bg-kk-sun/25"
              }`}
            >
              <FaUserCircle className="text-base" /> Profil ({user.name})
              {active === "profile" && <span className="ml-auto w-2.5 h-2.5 rounded-full bg-kk-ink" />}
            </button>
          )}
          {user && (
            <button
              onClick={() => {
                setMenuOpen(false);
                onLogout();
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-bold border-2 border-transparent bg-kk-cream text-kk-coraldeep hover:bg-kk-coral/10 transition-colors"
            >
              <FaSignOutAlt className="text-base" /> Keluar ({user.name})
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
