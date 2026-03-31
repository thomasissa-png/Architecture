"use client";

import { useSession } from "next-auth/react";
import AuthButton from "@/components/AuthButton";

interface HeaderProps {
  variant?: "home" | "internal";
  activePage?: "mes-biens" | "ma-galerie" | "mes-dossiers";
}

const navLinks = [
  { href: "/mes-biens", label: "Mes biens", key: "mes-biens" as const },
  { href: "/ma-galerie", label: "Ma galerie", key: "ma-galerie" as const },
  { href: "/mes-dossiers", label: "Mes dossiers", key: "mes-dossiers" as const },
];

export default function Header({ variant = "internal", activePage }: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/5">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
        <a
          href="/"
          className="text-xl font-semibold text-foreground tracking-tighter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded-sm"
        >
          Versimo
        </a>
        <nav className="flex items-center gap-2 sm:gap-6">
          {variant === "home" ? (
            <>
              {session && (
                <>
                  {navLinks.map((link) => (
                    <a
                      key={link.key}
                      href={link.href}
                      className="hidden sm:inline text-xs text-muted font-light hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  ))}
                </>
              )}
              <a
                href="#pricing"
                className="hidden sm:inline text-xs text-muted font-light hover:text-foreground transition-colors"
              >
                Tarifs
              </a>
              {session ? (
                <a
                  href="#outil"
                  className="hidden sm:inline text-xs bg-foreground text-background px-3 py-2 rounded-full font-medium hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                >
                  Nouveau visuel
                </a>
              ) : (
                <a
                  href="#outil"
                  className="text-xs bg-foreground text-background px-3 sm:px-4 py-2 rounded-full font-medium hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                >
                  <span className="sm:hidden">Essayer</span>
                  <span className="hidden sm:inline">Essayer gratuitement</span>
                </a>
              )}
            </>
          ) : (
            <>
              {navLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.href}
                  className={
                    activePage === link.key
                      ? "text-xs text-sage font-medium min-h-[44px] flex items-center"
                      : "text-xs text-muted font-light hover:text-foreground transition-colors min-h-[44px] flex items-center"
                  }
                >
                  {link.label}
                </a>
              ))}
            </>
          )}
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}
