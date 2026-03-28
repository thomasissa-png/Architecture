"use client";

/**
 * ProGate — Gating component for Pro-only pages.
 * Shows an upgrade prompt if the user doesn't have Pro access.
 * Wraps children and only renders them if hasPro is true.
 */

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface ProGateProps {
  children: React.ReactNode;
  /** Page name shown in the upgrade prompt */
  featureName: string;
}

export default function ProGate({ children, featureName }: ProGateProps) {
  const { data: session, status } = useSession();
  const [hasPro, setHasPro] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      setIsLoading(false);
      setHasPro(false);
      return;
    }
    if (status !== "authenticated" || !session?.user?.id) return;

    fetch("/api/user/credits")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setHasPro(data?.hasPro ?? false);
        setIsLoading(false);
      })
      .catch(() => {
        setHasPro(false);
        setIsLoading(false);
      });
  }, [session, status]);

  // Still loading auth or pro status
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-sage/30 border-t-sage rounded-full animate-spin" />
      </div>
    );
  }

  // Pro access granted — render children
  if (hasPro) {
    return <>{children}</>;
  }

  // Not Pro — show upgrade prompt
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-foreground/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-semibold text-foreground tracking-tighter">
            Versiroom
          </a>
          <a
            href="/"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Retour
          </a>
        </div>
      </header>

      <div
        className="max-w-lg mx-auto px-5 sm:px-8 py-20 text-center"
        style={{ animation: "fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) both" }}
      >
        {/* Lock icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-sage/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-3">
          {featureName}
        </h1>
        <p className="text-sm text-muted font-light mb-8 max-w-sm mx-auto leading-relaxed">
          Gérez vos biens, créez des dossiers de présentation et des annonces professionnelles pour vos acquéreurs — fonctionnalité réservée aux comptes Pro.
        </p>

        {/* Pricing highlight */}
        <div className="bg-foreground/[0.02] border border-foreground/5 rounded-2xl p-6 mb-6 text-left max-w-sm mx-auto">
          <p className="text-sm font-semibold text-foreground mb-3">Pack Pro (29&nbsp;&#8364;/mois) inclut :</p>
          <ul className="space-y-2 text-sm text-muted font-light">
            <li className="flex items-start gap-2">
              <svg className="w-3.5 h-3.5 text-sage mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Gestion de biens illimitée
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-3.5 h-3.5 text-sage mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Dossiers de pré-commercialisation brandés
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-3.5 h-3.5 text-sage mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Annonces publiques partageables
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-3.5 h-3.5 text-sage mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Enrichissement automatique (description, carte, DVF)
            </li>
          </ul>
        </div>

        <a
          href="/#pricing"
          className="inline-flex items-center justify-center px-8 py-3 bg-sage text-white rounded-full text-sm font-medium hover:opacity-90 active:scale-[0.99] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
        >
          Découvrir les offres Pro
        </a>

        <p className="text-xs text-muted/50 font-light mt-4">
          Vous avez déjà un accès Pro ?{" "}
          <button
            onClick={() => window.location.reload()}
            className="underline hover:text-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sage/50 rounded-sm min-h-[44px] inline-flex items-center"
          >
            Rafraîchir la page
          </button>
        </p>
      </div>
    </div>
  );
}
