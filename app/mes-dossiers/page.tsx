"use client";

/**
 * Page "Mes dossiers" — liste des dossiers Mode Marchand de l'utilisateur.
 * Redirige vers la page d'accueil si non connecte.
 */

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

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
    className: "bg-[var(--foreground)]/5 text-[var(--muted)]",
  },
  generating: {
    label: "En cours",
    className: "bg-[var(--sage)]/10 text-[var(--sage)]",
  },
  completed: {
    label: "Termine",
    className: "bg-[var(--sage)]/15 text-[var(--sage)]",
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

  // Redirect if not authenticated
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      window.location.href = "/";
    }
  }, [authStatus]);

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
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--foreground)]/10 border-t-[var(--sage)] rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated — redirecting
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--foreground)]/5">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
          <a
            href="/"
            className="text-xl font-semibold text-[var(--foreground)] tracking-tighter hover:opacity-80 transition-opacity"
          >
            Versiroom
          </a>
          <a
            href="/"
            className="text-xs text-[var(--muted)] font-light hover:text-[var(--foreground)] transition-colors"
          >
            Retour
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="pt-24 sm:pt-28 pb-16 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-light text-[var(--foreground)] tracking-tight mb-1">
            Mes dossiers
          </h1>
          <p className="text-sm text-[var(--muted)] font-light mb-8">
            Retrouvez tous vos dossiers Mode Marchand.
          </p>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-[var(--foreground)]/10 border-t-[var(--sage)] rounded-full animate-spin" />
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
              <p className="text-sm text-[var(--muted)] font-light mb-4">
                Aucun dossier. Creez votre premier dossier en Mode Marchand.
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--foreground)] text-[var(--background)] rounded-xl text-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]/50 focus-visible:ring-offset-2"
              >
                Creer un dossier
              </a>
            </div>
          )}

          {/* Dossier list */}
          {!isLoading && dossiers.length > 0 && (
            <div className="space-y-3">
              {dossiers.map((dossier) => {
                const statusInfo = STATUS_LABELS[dossier.status] || STATUS_LABELS.draft;

                return (
                  <a
                    key={dossier.uuid}
                    href={`/dossier/${dossier.uuid}`}
                    className="block p-5 rounded-2xl border border-[var(--border)] hover:border-[var(--foreground)]/15 bg-[var(--foreground)]/[0.01] hover:bg-[var(--foreground)]/[0.03] transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                          <h2 className="text-sm font-medium text-[var(--foreground)] truncate">
                            {dossier.bien_nom || "Sans titre"}
                          </h2>
                          <span
                            className={`shrink-0 text-[11px] font-medium px-2.5 py-0.5 rounded-full ${statusInfo.className}`}
                          >
                            {statusInfo.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--muted)] font-light">
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

                      {/* Right: arrow */}
                      <svg
                        className="w-4 h-4 text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors shrink-0 mt-1"
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
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
