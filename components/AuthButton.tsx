"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import AuthModal from "@/components/AuthModal";

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [credits, setCredits] = useState<number | null>(null);
  const [hasPro, setHasPro] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  async function fetchCredits() {
    try {
      const res = await fetch("/api/user/credits");
      if (res.ok) {
        const data = await res.json();
        setCredits(data.credits);
        setHasPro(data.hasPro === true);
      }
    } catch (err) {
      console.error("Erreur chargement credits:", err);
    }
  }

  // Fetch credits when authenticated
  useEffect(() => {
    if (status !== "authenticated") return;
    fetchCredits();
  }, [status]);

  // Re-fetch credits after successful checkout
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("checkout=success")) {
      fetchCredits();
    }
  }, []);

  // Close menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  // Loading state — render nothing to avoid layout shift
  if (status === "loading") {
    return (
      <div className="w-8 h-8 rounded-full bg-foreground/5 animate-pulse" />
    );
  }

  // Not authenticated
  if (!session) {
    return (
      <>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="text-xs bg-foreground/5 text-foreground px-4 py-2 rounded-full font-medium hover:bg-foreground/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
          data-testid="auth-login-btn"
        >
          Se connecter
        </button>
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
      </>
    );
  }

  // Authenticated
  const initials = session.user.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : session.user.email?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen((prev) => !prev)}
        className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 rounded-full"
        aria-label="Menu utilisateur"
        aria-expanded={menuOpen}
        aria-haspopup="true"
      >
        <span className="w-11 h-11 flex items-center justify-center">
          {session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt=""
              className="w-8 h-8 rounded-full object-cover border border-foreground/10"
            />
          ) : (
            <span className="w-8 h-8 rounded-full bg-sage/15 text-sage flex items-center justify-center text-xs font-medium">
              {initials}
            </span>
          )}
        </span>
        {credits !== null && (
          <span className="text-xs text-muted font-light hidden sm:inline">
            {credits} cr.
          </span>
        )}
      </button>

      {/* Dropdown */}
      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-background border border-foreground/10 rounded-2xl shadow-lg py-2 z-50 animate-fade-in-up">
          <div className="px-4 py-2 border-b border-foreground/5">
            <p className="text-sm font-medium text-foreground truncate">
              {session.user.name || session.user.email}
            </p>
            {session.user.name && (
              <p className="text-xs text-muted font-light truncate">
                {session.user.email}
              </p>
            )}
          </div>

          <div className="px-4 py-3 border-b border-foreground/5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted font-light">Compte</span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  hasPro
                    ? "bg-sage/15 text-sage"
                    : "bg-foreground/5 text-muted"
                }`}
                data-testid="account-level"
              >
                {hasPro ? "Pro" : "Gratuit"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted font-light">Crédits</span>
              <span className="text-sm font-medium text-foreground">
                {credits !== null ? credits : "..."}
              </span>
            </div>
            {credits !== null && credits <= 3 && (
              <a
                href="/pricing"
                className="block mt-2 text-center text-xs bg-sage/10 text-sage px-3 py-1.5 rounded-full font-medium hover:bg-sage/20 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Recharger
              </a>
            )}
          </div>

          {/* Navigation links */}
          <div className="px-2 py-1 border-b border-foreground/5">
            <a
              href="/compte"
              className="block px-3 py-2 text-sm text-muted font-light hover:text-foreground hover:bg-foreground/5 rounded-xl transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Mon compte
            </a>
            <a
              href="/mes-biens"
              className="block px-3 py-2 text-sm text-muted font-light hover:text-foreground hover:bg-foreground/5 rounded-xl transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Mes biens
            </a>
            <a
              href="/ma-galerie"
              className="block px-3 py-2 text-sm text-muted font-light hover:text-foreground hover:bg-foreground/5 rounded-xl transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Ma galerie
            </a>
            <a
              href="/mes-dossiers"
              className="block px-3 py-2 text-sm text-muted font-light hover:text-foreground hover:bg-foreground/5 rounded-xl transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Mes dossiers
            </a>
          </div>

          <div className="px-2 py-1">
            <a
              href="/pricing"
              className="block px-3 py-2 text-sm text-muted font-light hover:text-foreground hover:bg-foreground/5 rounded-xl transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Acheter des crédits
            </a>
            <button
              onClick={() => {
                setMenuOpen(false);
                signOut();
              }}
              className="w-full text-left px-3 py-2 text-sm text-muted font-light hover:text-foreground hover:bg-foreground/5 rounded-xl transition-colors"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
