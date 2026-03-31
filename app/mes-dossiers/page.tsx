"use client";

/**
 * Page "Mes dossiers" — liste des dossiers Mode Pro de l'utilisateur.
 * Redirige vers la page d'accueil si non connecte.
 */

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AuthButton from "@/components/AuthButton";
import ProGate from "@/components/ProGate";

interface Dossier {
  id: number;
  uuid: string;
  slug: string | null;
  bien_nom: string | null;
  bien_adresse: string | null;
  bien_type: string | null;
  status: "draft" | "generating" | "completed" | "partial" | "archived";
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
  archived: {
    label: "Archivé",
    className: "bg-foreground/5 text-muted",
  },
};

export default function MesDossiersPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedUuid, setCopiedUuid] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [archivingUuid, setArchivingUuid] = useState<string | null>(null);

  const fetchDossiers = useCallback(async (archived = false) => {
    try {
      setIsLoading(true);
      const url = archived ? "/api/dossier?archived=true" : "/api/dossier";
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/");
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
  }, [router]);

  // Fetch dossiers
  useEffect(() => {
    if (authStatus !== "authenticated") return;
    fetchDossiers(showArchived);
  }, [authStatus, showArchived, fetchDossiers]);

  async function handleArchive(uuid: string, action: "archive" | "unarchive") {
    setArchivingUuid(uuid);
    try {
      const res = await fetch(`/api/dossier/${uuid}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await fetchDossiers(showArchived);
      }
    } catch {
      // Silent fail
    } finally {
      setArchivingUuid(null);
    }
  }

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

  // Not authenticated — redirect to home
  if (!session) {
    if (typeof window !== "undefined") {
      router.push("/");
    }
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted font-light">Redirection en cours...</p>
      </div>
    );
  }

  return (
    <ProGate featureName="Mes dossiers">
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/5">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-semibold text-foreground tracking-tighter">
            Versimo
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
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm text-muted font-light">
              Retrouvez tous vos dossiers Mode Pro.
            </p>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="text-xs text-muted hover:text-foreground font-light transition-colors px-3 py-1.5 rounded-full border border-foreground/10 hover:border-foreground/20 min-h-[36px]"
            >
              {showArchived ? "Masquer archivés" : "Voir archivés"}
            </button>
          </div>

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
                Aucun dossier. Créez votre premier dossier en Mode Pro.
              </p>
              <a
                href="/#outil"
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
                    href={`/dossier/${dossier.slug || dossier.uuid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-5 rounded-2xl border border-foreground/5 hover:border-foreground/10 hover:bg-foreground/5 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
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

                      {/* Right: actions + arrow */}
                      <div className="flex items-center gap-2 shrink-0 mt-1">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const action = dossier.status === "archived" ? "unarchive" : "archive";
                            handleArchive(dossier.uuid, action);
                          }}
                          disabled={archivingUuid === dossier.uuid}
                          className="text-[11px] text-muted hover:text-foreground font-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded px-1.5 py-1 min-h-[44px] inline-flex items-center disabled:opacity-40"
                          title={dossier.status === "archived" ? "Désarchiver" : "Archiver"}
                        >
                          {archivingUuid === dossier.uuid
                            ? "..."
                            : dossier.status === "archived"
                              ? "Désarchiver"
                              : "Archiver"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const url = `${window.location.origin}/dossier/${dossier.slug || dossier.uuid}`;
                            navigator.clipboard.writeText(url).then(() => {
                              setCopiedUuid(dossier.uuid);
                              setTimeout(() => setCopiedUuid(null), 2000);
                            }).catch(() => {
                              /* Clipboard non disponible — silencieux */
                            });
                          }}
                          className="text-[11px] text-muted hover:text-foreground font-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded px-1.5 py-1 min-h-[44px] inline-flex items-center"
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
