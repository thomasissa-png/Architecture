"use client";

/**
 * GalleryGate — Gating component for /ma-galerie.
 * Shows an upgrade prompt if the user hasn't purchased at least a Starter pack.
 * Wraps children and only renders them if hasGalleryAccess is true.
 */

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface GalleryGateProps {
  children: React.ReactNode;
}

export default function GalleryGate({ children }: GalleryGateProps) {
  const { data: session, status } = useSession();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchAccess = () => {
    setIsLoading(true);
    setHasError(false);

    fetch("/api/user/credits")
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data) => {
        setHasAccess(data?.hasGalleryAccess ?? false);
        setIsLoading(false);
      })
      .catch(() => {
        setHasAccess(null);
        setHasError(true);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      setIsLoading(false);
      setHasAccess(false);
      return;
    }
    if (status !== "authenticated" || !session?.user?.id) return;

    fetchAccess();
  }, [session, status]);

  // Loading state — skeleton
  if (status === "loading" || isLoading) {
    return (
      <div className="max-w-lg mx-auto px-5 sm:px-8 py-20">
        <div className="h-6 w-48 bg-foreground/5 rounded-lg animate-pulse mb-4" />
        <div className="h-4 w-72 bg-foreground/5 rounded-lg animate-pulse" />
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className="max-w-lg mx-auto px-5 sm:px-8 py-20 text-center">
        <p className="text-sm text-muted font-light mb-4">
          Impossible de vérifier votre accès — réessayez.
        </p>
        <button
          onClick={fetchAccess}
          className="text-sm bg-foreground text-background px-6 py-2.5 rounded-full font-medium hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
        >
          Réessayer
        </button>
      </div>
    );
  }

  // Access granted — render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // No access — show upgrade prompt
  return (
    <div
      className="max-w-lg mx-auto px-5 sm:px-8 py-20 text-center"
      style={{ animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both" }}
    >
      {/* Gallery icon */}
      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-sage/10 flex items-center justify-center">
        <svg className="w-8 h-8 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-3">
        Votre galerie vous attend
      </h1>
      <p className="text-sm text-muted font-light mb-8 max-w-sm mx-auto leading-relaxed">
        L&apos;historique de vos visuels est disponible dès votre premier pack.
      </p>

      <div className="flex flex-col items-center gap-3">
        <a
          href="/#pricing"
          className="inline-flex items-center justify-center px-8 py-3 bg-sage text-white rounded-full text-sm font-medium hover:opacity-90 active:scale-[0.99] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
        >
          Pack Starter — 14,90&nbsp;&#8364;
        </a>

        <a
          href="/pricing"
          className="text-sm text-muted font-light hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sage/50 rounded-sm"
        >
          Voir les formules
        </a>
      </div>

      <p className="text-xs text-muted/50 font-light mt-8">
        Vous avez déjà acheté un pack ?{" "}
        <button
          onClick={fetchAccess}
          className="underline hover:text-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sage/50 rounded-sm min-h-[44px] inline-flex items-center"
        >
          Rafraîchir la page
        </button>
      </p>
    </div>
  );
}
