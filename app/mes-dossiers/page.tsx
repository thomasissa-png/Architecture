"use client";

/**
 * Page "Mes dossiers" — liste des dossiers Mode Marchand de l'utilisateur.
 * Redirige vers la page d'accueil si non connecte.
 */

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import AuthButton from "@/components/AuthButton";
import ProGate from "@/components/ProGate";

interface Dossier {
  id: number;
  uuid: string;
  bien_nom: string | null;
  bien_adresse: string | null;
  bien_type: string | null;
  status: "draft" | "generating" | "completed" | "partial";
  photo_count: number;
  success_count: number;
  fail_count: number;
  created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Brouillon",
    className: "bg-foreground/5 text-muted",
  },
  generating: {
    label: "En cours",
    className: "bg-sage/10 text-sage",
  },
  completed: {
    label: "Terminé",
    className: "bg-sage/15 text-sage",
  },
  partial: {
    label: "Partiel",
    className: "bg-amber-50 text-amber-600",
  },
};

export default function MesDossiersPage() {
  const { data: session, status: authStatus } = useSession();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedUuid, setCopiedUuid] = useState<string | null>(null);

  // Fetch dossiers
  useEffect(() => {
    if (authStatus !== "authenticated") return;

    async function fetchDossiers() {
      try {
        const res = await fetch("/api/dossier");
        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = "/";
            return;
          }
          throw new Error("Erreur lors du chargement des dossiers.");
        }
        const data = await res.json();
        setDossiers(data.dossiers || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur lors du chargement."
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchDossiers();
  }, [authStatus]);

  function formatDate(dateStr: string): string {
    try {
      return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  }

  // Loading auth
  if (authStatus === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground/10 border-t-sage rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated — redirecting
  if (!session) {
    return null;
  }

  return (
    <ProGate featureName="Mes dossiers">
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/5">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-semibold text-foreground tracking-tighter">
            Versiroom
          </a>
          <nav className="flex items-center gap-2 sm:gap-6">
            <a href="/mes-biens" className="text-xs text-muted font-light hover:text-foreground transition-colors">
              Mes biens
            </a>
            <a href="/ma-galerie" className="text-xs text-muted font-light hover:text-foreground transition-colors">
              Ma galerie
            </a>
            <a href="/mes-dossiers" className="text-xs text-sage font-medium">
              Mes dossiers
            </a>
            <AuthButton />
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="pt-24 sm:pt-28 pb-16 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-light text-foreground tracking-tight mb-1">
            Mes dossiers
          </h1>
          <p className="text-sm text-muted font-light mb-8">
            Retrouvez tous vos dossiers Mode Marchand.
          </p>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-foreground/10 border-t-sage rounded-full animate-spin" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-600 font-light">
              {error}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && dossiers.length === 0 && (
            <div className="text-center py-20">
              <p className="text-sm text-muted font-light mb-4">
                Aucun dossier. Créez votre premier dossier en Mode Marchand.
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-full text-sm font-medium hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
              >
                Créer un dossier
              </a>
            </div>
          )}

          {/* Dossier list */}
          {!isLoading && dossiers.length > 0 && (
            <div className="space-y-3" data-testid="dossiers-list">
              {dossiers.map((dossier) => {
                const statusInfo = STATUS_LABELS[dossier.status] || STATUS_LABELS.draft;

                return (
                  <a
                    key={dossier.uuid}
                    href={`/dossier/${dossier.uuid}`}
                    className="block p-5 rounded-2xl border border-foreground/5 hover:border-foreground/10 hover:bg-foreground/5 transition-all group"
                    data-testid="dossier-card"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                          <h2 className="text-sm font-medium text-foreground truncate">
                            {dossier.bien_nom || "Sans titre"}
                          </h2>
                          <span
                            className={`shrink-0 text-[11px] font-medium px-2.5 py-0.5 rounded-full ${statusInfo.className}`}
                          >
                            {statusInfo.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted font-light">
                          <span>{formatDate(dossier.created_at)}</span>
                          <span>
                            {dossier.photo_count} photo{dossier.photo_count > 1 ? "s" : ""}
                          </span>
                          {dossier.bien_type && (
                            <span className="capitalize">{dossier.bien_type}</span>
                          )}
                          {dossier.bien_adresse && (
                            <span className="truncate max-w-[200px]">
                              {dossier.bien_adresse}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: copy + arrow */}
                      <div className="flex items-center gap-2 shrink-0 mt-1">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const url = `${window.location.origin}/dossier/${dossier.uuid}`;
                            navigator.clipboard.writeText(url).then(() => {
                              setCopiedUuid(dossier.uuid);
                              setTimeout(() => setCopiedUuid(null), 2000);
                            });
                          }}
                          className="text-[11px] text-muted hover:text-foreground font-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 rounded px-1.5 py-1"
                          title="Copier le lien de partage"
                        >
                          {copiedUuid === dossier.uuid ? "Copié" : "Copier le lien"}
                        </button>
                        <svg
                          className="w-4 h-4 text-muted group-hover:text-foreground transition-colors"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.25 4.5l7.5 7.5-7.5 7.5"
                          />
                        </svg>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
    </ProGate>
  );
}
