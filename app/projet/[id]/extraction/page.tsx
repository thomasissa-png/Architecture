"use client";

/**
 * Page extraction IA (Étape 2).
 *
 * Rendu : Client Component — appel API + polling + affichage résultats.
 *
 * Au mount : appelle POST /api/pro/projects/[id]/extract.
 * Affiche les pièces extraites avec RoomCard.
 * Bouton "Valider et continuer" redirige vers /projet/[id]/validation.
 * En cas d'erreur : message + lien vers saisie manuelle (validation).
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProStepper from "@/components/marchand/ProStepper";
import RoomCard from "@/components/marchand/RoomCard";

// ─── Types ──────────────────────────────────────────────────────────

interface ExtractedRoom {
  id: string;
  name: string;
  room_type: string;
}

type ExtractionState = "idle" | "loading" | "success" | "error";

// ─── Component ──────────────────────────────────────────────────────

export default function ExtractionPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [state, setState] = useState<ExtractionState>("idle");
  const [rooms, setRooms] = useState<ExtractedRoom[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // ─── Timer for loading state ──────────────────────────────────────

  useEffect(() => {
    if (state !== "loading") return;

    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [state]);

  // ─── Trigger extraction on mount ──────────────────────────────────

  const runExtraction = useCallback(async () => {
    setState("loading");
    setElapsedSeconds(0);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/pro/projects/${projectId}/extract`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        setState("error");
        if (data.reason === "NO_ROOMS_DETECTED") {
          setErrorMessage(
            "Plan illisible — aucune pièce détectée. Passez à l'étape suivante pour saisir les pièces manuellement."
          );
        } else if (response.status === 429) {
          setErrorMessage(data.message || "Trop de tentatives. Réessayez plus tard.");
        } else if (response.status === 409) {
          // Already extracted — redirect to validation
          router.push(`/projet/${projectId}/validation`);
          return;
        } else {
          setErrorMessage(data.message || "Erreur lors de l'analyse du plan.");
        }
        return;
      }

      // Success
      setRooms(data.rooms || []);
      setState("success");
    } catch {
      setState("error");
      setErrorMessage("Erreur de connexion. Vérifiez votre réseau et réessayez.");
    }
  }, [projectId, router]);

  useEffect(() => {
    runExtraction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Navigation ──────────────────────────────────────────────────

  const handleContinue = useCallback(() => {
    router.push(`/projet/${projectId}/validation`);
  }, [router, projectId]);

  const handleSkipToManual = useCallback(() => {
    router.push(`/projet/${projectId}/validation`);
  }, [router, projectId]);

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      <Header variant="internal" />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
        {/* Stepper */}
        <div className="mb-8">
          <ProStepper
            currentStep={2}
            completedSteps={[1]}
            errorSteps={state === "error" ? [2] : []}
          />
        </div>

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1C1C1E] tracking-tight">
            Extraction du plan
          </h1>
          <p className="text-sm text-[#9B9A94] mt-1">
            L&apos;IA analyse votre plan pour détecter les pièces et leurs dimensions.
          </p>
        </div>

        {/* Loading state */}
        {state === "loading" && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            {/* Scan animation */}
            <div className="relative w-48 h-48 rounded-lg bg-[#F5F5F0] overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#D1D0CB"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 3v18M3 9h18M3 15h18M15 3v18" />
                </svg>
              </div>
              {/* Scan line */}
              <div
                className="absolute left-0 right-0 h-0.5 bg-[#3B82F6] animate-[scanLine_2s_ease-in-out_infinite]"
                aria-hidden="true"
              />
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-[#1C1C1E]">
                Analyse du plan en cours…
              </p>
              <p className="text-xs text-[#9B9A94] mt-1">
                {elapsedSeconds < 10
                  ? "Détection des pièces et dimensions (~30 secondes)"
                  : elapsedSeconds < 30
                    ? `${elapsedSeconds}s — Extraction en cours…`
                    : `${elapsedSeconds}s — Presque terminé…`}
              </p>
            </div>

            {/* Pulsing dots */}
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse [animation-delay:200ms]" />
              <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse [animation-delay:400ms]" />
            </div>
          </div>
        )}

        {/* Error state */}
        {state === "error" && (
          <div className="py-8">
            <div
              className="p-4 rounded-lg bg-[#FEF2F2] border border-[#EF4444]/20 mb-6"
              role="alert"
            >
              <div className="flex items-start gap-3">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#B91C1C"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-[#B91C1C]">
                    Extraction impossible
                  </p>
                  <p className="text-sm text-[#B91C1C]/80 mt-1">
                    {errorMessage}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={runExtraction}
                className="flex-1 py-2.5 px-4 rounded-lg border border-[#D1D0CB] bg-white
                           text-sm font-medium text-[#1C1C1E] hover:bg-[#F5F5F0]
                           transition-colors focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-[#7D9B76]"
              >
                Réessayer l&apos;extraction
              </button>
              <button
                onClick={handleSkipToManual}
                className="flex-1 py-2.5 px-4 rounded-lg bg-[#7D9B76] text-white
                           text-sm font-medium hover:bg-[#4A7A42]
                           transition-colors focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-[#7D9B76] focus-visible:ring-offset-2"
              >
                Saisir les pièces manuellement
              </button>
            </div>
          </div>
        )}

        {/* Success state */}
        {state === "success" && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#ECFDF5] text-sm text-[#4A7A42]">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {rooms.length} pièce{rooms.length > 1 ? "s" : ""} détectée{rooms.length > 1 ? "s" : ""}
            </div>

            {/* Room list */}
            <div className="space-y-3">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={{
                    id: room.id,
                    name: room.name,
                    room_type: room.room_type,
                    status: "pending",
                  }}
                />
              ))}
            </div>

            {rooms.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-[#9B9A94]">
                  Aucune pièce extraite. Passez à l&apos;étape suivante pour les ajouter manuellement.
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-4 border-t border-[#D1D0CB]/40">
              <button
                onClick={() => router.back()}
                className="py-2.5 px-4 rounded-lg border border-[#D1D0CB] bg-white
                           text-sm font-medium text-[#1C1C1E] hover:bg-[#F5F5F0]
                           transition-colors focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-[#7D9B76]"
              >
                Retour
              </button>
              <button
                onClick={handleContinue}
                className="flex-1 py-2.5 px-4 rounded-lg bg-[#7D9B76] text-white
                           text-sm font-medium hover:bg-[#4A7A42]
                           transition-colors focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-[#7D9B76] focus-visible:ring-offset-2"
              >
                Valider et continuer
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Scan line animation */}
      <style jsx>{`
        @keyframes scanLine {
          0%, 100% { top: 0; }
          50% { top: 100%; }
        }
      `}</style>
    </div>
  );
}
