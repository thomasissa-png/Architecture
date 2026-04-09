"use client";

/**
 * Page génération des visuels (Étape 6).
 *
 * Rendu : Client Component — lance la génération, poll le statut, affiche en temps réel.
 *
 * Au mount : appelle POST /api/pro/projects/[id]/generate.
 * Poll GET /api/pro/projects/[id]/status toutes les 3 secondes.
 * Chaque pièce passe par : En attente → Passe 1 (surfaces) → Passe 2 (mobilier) → Terminée.
 * Quand tout est done : bouton "Voir le dossier" redirige vers /projet/[id]/dossier.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProStepper from "@/components/marchand/ProStepper";

// ─── Types ──────────────────────────────────────────────────────────

interface RoomStatus {
  id: string;
  name: string;
  room_type: string;
  lot_name: string | null;
  generation_status: "pending" | "generating_pass1" | "generating_pass2" | "done" | "failed";
  visual_output_path: string | null;
  visual_pass1_path: string | null;
  error: string | null;
}

interface StatusSummary {
  total: number;
  done: number;
  failed: number;
  generating: number;
  pending: number;
}

type PageState = "triggering" | "generating" | "complete" | "error";

// ─── Status display config ──────────────────────────────────────────

const GENERATION_STATUS_CONFIG: Record<
  RoomStatus["generation_status"],
  { label: string; color: string; pulse?: boolean }
> = {
  pending: { label: "En attente", color: "text-[#9B9A94]" },
  generating_pass1: { label: "Préparation de la pièce", color: "text-[#1D4ED8]", pulse: true },
  generating_pass2: { label: "Ajout du mobilier", color: "text-[#1D4ED8]", pulse: true },
  done: { label: "Terminée", color: "text-[#4A7A42]" },
  failed: { label: "Erreur", color: "text-[#B91C1C]" },
};

// ─── Component ──────────────────────────────────────────────────────

export default function GenerationPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [pageState, setPageState] = useState<PageState>("triggering");
  const [rooms, setRooms] = useState<RoomStatus[]>([]);
  const [summary, setSummary] = useState<StatusSummary>({ total: 0, done: 0, failed: 0, generating: 0, pending: 0 });
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isGenerationTriggered = useRef(false);

  // ─── Timer ────────────────────────────────────────────────────────

  useEffect(() => {
    if (pageState !== "generating" && pageState !== "triggering") return;

    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [pageState]);

  // ─── Trigger generation ───────────────────────────────────────────

  useEffect(() => {
    if (isGenerationTriggered.current) return;
    isGenerationTriggered.current = true;

    async function triggerGeneration() {
      try {
        const response = await fetch(`/api/pro/projects/${projectId}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          const data = await response.json();
          if (response.status === 409) {
            // Already generating — just start polling
            setPageState("generating");
            return;
          }
          setError(data.message || "Erreur lors du lancement de la génération.");
          setPageState("error");
          return;
        }

        setPageState("generating");
      } catch {
        setError("Erreur de connexion. Vérifiez votre réseau.");
        setPageState("error");
      }
    }

    triggerGeneration();
  }, [projectId]);

  // ─── Poll status every 3 seconds ─────────────────────────────────

  const pollStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/pro/projects/${projectId}/status`);
      if (!response.ok) return;

      const data = await response.json();
      const newRooms = data.rooms as RoomStatus[];
      const newSummary = data.summary as StatusSummary;

      setRooms(newRooms);
      setSummary(newSummary);

      // Check if generation is complete
      const allDone = newSummary.pending === 0 && newSummary.generating === 0;
      if (allDone) {
        setPageState("complete");
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    } catch {
      // Silent retry — polling will continue
    }
  }, [projectId]);

  useEffect(() => {
    if (pageState !== "generating") return;

    // Initial poll
    pollStatus();

    // Start polling every 3 seconds
    pollIntervalRef.current = setInterval(pollStatus, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [pageState, pollStatus]);

  // ─── Progress percentage ──────────────────────────────────────────

  const progressPercent = summary.total > 0
    ? Math.round(((summary.done + summary.failed) / summary.total) * 100)
    : 0;

  // ─── Format elapsed time ─────────────────────────────────────────

  function formatTime(seconds: number): string {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    if (min === 0) return `${sec}s`;
    return `${min}min ${sec.toString().padStart(2, "0")}s`;
  }

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      <Header variant="internal" />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
        {/* Stepper */}
        <div className="mb-8">
          <ProStepper
            currentStep={6}
            completedSteps={[1, 2, 3, 4, 5]}
            errorSteps={pageState === "error" ? [6] : []}
          />
        </div>

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1C1C1E] tracking-tight">
            {pageState === "complete" ? "Génération terminée" : "Génération en cours…"}
          </h1>
          <p className="text-sm text-[#9B9A94] mt-1">
            {pageState === "triggering" && "Lancement de la génération…"}
            {pageState === "generating" && (
              <>
                {summary.total} pièce{summary.total > 1 ? "s" : ""} — ~{Math.ceil(summary.total * 1.5)} minutes estimées
              </>
            )}
            {pageState === "complete" && (
              <>
                {summary.done} pièce{summary.done > 1 ? "s" : ""} générée{summary.done > 1 ? "s" : ""}
                {summary.failed > 0 && ` — ${summary.failed} en erreur`}
              </>
            )}
            {pageState === "error" && "La génération a rencontré un problème."}
          </p>
        </div>

        {/* Progress bar */}
        {(pageState === "generating" || pageState === "complete") && summary.total > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-[#9B9A94] mb-2">
              <span>{progressPercent}% — {summary.done}/{summary.total} terminées</span>
              <span>{formatTime(elapsedSeconds)}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#F5F5F0] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  pageState === "complete" ? "bg-[#7D9B76]" : "bg-[#3B82F6]"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Error state */}
        {pageState === "error" && (
          <div className="py-8">
            <div
              className="p-4 rounded-lg bg-[#FEF2F2] border border-[#EF4444]/20 mb-6"
              role="alert"
            >
              <p className="text-sm text-[#B91C1C]">
                {error || "Génération indisponible — réessayez dans quelques instants."}
              </p>
            </div>
            <button
              onClick={() => {
                isGenerationTriggered.current = false;
                setPageState("triggering");
                setError(null);
                setElapsedSeconds(0);
                // Re-trigger
                isGenerationTriggered.current = false;
                window.location.reload();
              }}
              className="py-2.5 px-4 rounded-lg bg-[#7D9B76] text-white text-sm font-medium
                         hover:bg-[#4A7A42] transition-colors
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76]"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Room grid */}
        {(pageState === "generating" || pageState === "complete") && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {rooms.map((room) => {
              const statusConfig = GENERATION_STATUS_CONFIG[room.generation_status];
              const imageUrl = room.visual_output_path
                ? `/api/logs/image?path=${encodeURIComponent(room.visual_output_path)}`
                : room.visual_pass1_path
                  ? `/api/logs/image?path=${encodeURIComponent(room.visual_pass1_path)}`
                  : null;

              return (
                <article
                  key={room.id}
                  className="rounded-lg bg-white border border-[#D1D0CB]/40 overflow-hidden
                             shadow-[0_1px_3px_rgba(28,28,30,0.08),0_1px_2px_rgba(28,28,30,0.04)]"
                >
                  {/* Image area */}
                  <div className="relative aspect-[4/3] bg-[#F5F5F0]">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={`Résultat pour ${room.name}`}
                        className={`w-full h-full object-cover ${
                          room.generation_status === "done" ? "" : "blur-sm opacity-70"
                        } transition-all duration-500`}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {room.generation_status === "pending" ? (
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#D1D0CB"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5L5 21" />
                          </svg>
                        ) : (
                          <svg
                            className="animate-spin w-6 h-6 text-[#3B82F6]"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                        )}
                      </div>
                    )}

                    {/* Status overlay */}
                    {room.generation_status !== "done" && room.generation_status !== "pending" && (
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-2">
                        <span className={`text-xs font-medium text-white flex items-center gap-1.5`}>
                          {statusConfig.pulse && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" aria-hidden="true" />
                          )}
                          {statusConfig.label}
                        </span>
                      </div>
                    )}

                    {/* Done check */}
                    {room.generation_status === "done" && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#7D9B76] flex items-center justify-center">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 14 14"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M2.5 7.5L5.5 10.5L11.5 3.5"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Error indicator */}
                    {room.generation_status === "failed" && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#EF4444] flex items-center justify-center">
                        <span className="text-white text-xs font-bold" aria-hidden="true">!</span>
                      </div>
                    )}
                  </div>

                  {/* Room info */}
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[#1C1C1E] truncate">
                        {room.name}
                      </h3>
                      <span className={`text-[11px] font-medium ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    {room.lot_name && (
                      <p className="text-xs text-[#9B9A94] mt-0.5">{room.lot_name}</p>
                    )}
                    {room.error && (
                      <p className="text-xs text-[#B91C1C] mt-1">{room.error}</p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Triggering state */}
        {pageState === "triggering" && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <svg
              className="animate-spin w-8 h-8 text-[#3B82F6]"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <p className="text-sm text-[#9B9A94]">Lancement de la génération…</p>
          </div>
        )}

        {/* Complete state — navigation */}
        {pageState === "complete" && (
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#D1D0CB]/40">
            <button
              onClick={() => router.push(`/projet/${projectId}/dossier`)}
              className="flex-1 py-3 px-4 rounded-lg bg-[#7D9B76] text-white text-sm font-semibold
                         hover:bg-[#4A7A42] transition-colors
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76] focus-visible:ring-offset-2
                         shadow-[0_2px_8px_rgba(28,28,30,0.12)]"
            >
              Voir le dossier
            </button>
            <button
              onClick={() => router.push("/mes-biens")}
              className="py-3 px-4 rounded-lg border border-[#D1D0CB] bg-white
                         text-sm font-medium text-[#1C1C1E] hover:bg-[#F5F5F0]
                         transition-colors focus-visible:outline-none
                         focus-visible:ring-2 focus-visible:ring-[#7D9B76]"
            >
              Voir tous mes biens
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
