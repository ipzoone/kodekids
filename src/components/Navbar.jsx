import React from "react";
import { FaBook, FaGamepad, FaHome, FaFolderOpen, FaSignInAlt, FaSignOutAlt, FaUserCircle } from "react-icons/fa";

export default function Navbar({ active, onNavigate, user, onLogout }) {
  const items = [
    { id: "home", label: "Beranda", Icon: FaHome },
    { id: "materi", label: "Materi", Icon: FaBook },
    { id: "challenge", label: "Challenge", Icon: FaGamepad },
    { id: "playground", label: "Playground", Icon: FaFolderOpen },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-kk-paper border-b-[3px] border-kk-ink">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2.5 font-display font-semibold text-xl text-kk-ink"
        >
          <span className="bg-kk-indigo w-9 h-9 rounded-[11px] border-[2.5px] border-kk-ink flex items-center justify-center font-mono font-bold text-white text-sm">
            &lt;/&gt;
          </span>
          KodeKids
        </button>

        <div className="flex items-center gap-1 sm:gap-1.5">
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
              <Icon /> <span className="hidden xs:inline sm:inline">{label}</span>
            </button>
          ))}

          {user ? (
            <div className="flex items-center gap-2 ml-1 sm:ml-2 pl-1 sm:pl-3 border-l-2 border-kk-ink/10">
              <span className="hidden sm:flex items-center gap-1.5 text-sm font-bold text-kk-ink">
                <FaUserCircle className="text-kk-indigo" /> {user.name}
              </span>
              <button
                onClick={onLogout}
                title="Keluar"
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold text-kk-coraldeep hover:bg-kk-coral/10 transition-colors"
              >
                <FaSignOutAlt /> <span className="hidden sm:inline">Keluar</span>
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
              <FaSignInAlt /> <span className="hidden xs:inline sm:inline">Masuk</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
