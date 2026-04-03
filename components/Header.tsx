"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQueueStatus } from "@/lib/hooks/useQueueStatus";
import AuthButton from "@/components/AuthButton";

interface HeaderProps {
  variant?: "home" | "internal";
  activePage?: "mes-biens" | "ma-galerie";
}

const navLinksLoggedIn = [
  { href: "/mes-biens", label: "Mes biens", key: "mes-biens" as const },
  { href: "/ma-galerie", label: "Ma galerie", key: "ma-galerie" as const },
];

export default function Header({ variant = "internal", activePage }: HeaderProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isPolling, status: queueStatus } = useQueueStatus();

  const isLoaded = sessionStatus !== "loading";
  const isLoggedIn = !!session;
  const showNav = isLoaded && (variant === "internal" || isLoggedIn);
  const hasActiveQueue = isPolling && queueStatus && queueStatus.status !== "done" && queueStatus.status !== "failed";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/5">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
        <a
          href="/"
          className="text-xl font-semibold text-foreground tracking-tighter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded-sm"
        >
          Versimo
        </a>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-6">
          {showNav &&
            navLinksLoggedIn.map((link) => (
              <a
                key={link.key}
                href={link.href}
                className={`relative ${
                  activePage === link.key
                    ? "text-xs text-sage font-medium"
                    : "text-xs text-muted font-light hover:text-foreground transition-colors"
                }`}
              >
                {link.label}
                {link.key === "ma-galerie" && hasActiveQueue && (
                  <span className="absolute -top-1 -right-3 w-2 h-2 bg-sage rounded-full animate-pulse" />
                )}
              </a>
            ))}
          {/* Tarifs: only when not logged in */}
          {isLoaded && !isLoggedIn && (
            <a
              href={variant === "home" ? "#pricing" : "/#pricing"}
              className="text-xs text-muted font-light hover:text-foreground transition-colors"
            >
              Tarifs
            </a>
          )}
          {isLoaded && !isLoggedIn && variant === "home" && (
            <a
              href="#outil"
              className="text-xs bg-foreground text-background px-4 py-2 rounded-full font-medium hover:bg-foreground/85 transition-colors"
            >
              Essayer gratuitement
            </a>
          )}
          {isLoaded && isLoggedIn && (
            <a
              href={variant === "home" ? "#outil" : "/"}
              className="text-xs bg-foreground text-background px-3 py-2 rounded-full font-medium hover:bg-foreground/85 transition-colors"
            >
              Nouveau visuel
            </a>
          )}
          <AuthButton />
        </nav>

        {/* Mobile: auth + hamburger */}
        <div className="flex sm:hidden items-center gap-3">
          <AuthButton />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-foreground/5 transition-colors"
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-foreground/5 bg-background/95 backdrop-blur-md px-5 py-4 space-y-1 animate-fade-in-up">
          {showNav &&
            navLinksLoggedIn.map((link) => (
              <a
                key={link.key}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block py-3 text-sm relative ${
                  activePage === link.key
                    ? "text-sage font-medium"
                    : "text-foreground font-light"
                }`}
              >
                {link.label}
                {link.key === "ma-galerie" && hasActiveQueue && (
                  <span className="inline-block ml-2 w-2 h-2 bg-sage rounded-full animate-pulse align-middle" />
                )}
              </a>
            ))}
          {/* Tarifs: only when not logged in */}
          {!isLoggedIn && (
            <a
              href={variant === "home" ? "#pricing" : "/#pricing"}
              onClick={() => setMobileOpen(false)}
              className="block py-3 text-sm text-foreground font-light"
            >
              Tarifs
            </a>
          )}
          {!isLoggedIn && variant === "home" && (
            <a
              href="#outil"
              onClick={() => setMobileOpen(false)}
              className="block mt-2 text-center text-sm bg-foreground text-background px-4 py-3 rounded-full font-medium"
            >
              Essayer gratuitement
            </a>
          )}
          {isLoggedIn && (
            <a
              href={variant === "home" ? "#outil" : "/"}
              onClick={() => setMobileOpen(false)}
              className="block mt-2 text-center text-sm bg-foreground text-background px-4 py-3 rounded-full font-medium"
            >
              Nouveau visuel
            </a>
          )}
        </div>
      )}
    </header>
  );
}
