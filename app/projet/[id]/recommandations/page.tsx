"use client";

/**
 * Page recommandations architecte IA (Étape 5).
 *
 * Rendu : Client Component — appel IA + interactions accepter/refuser.
 *
 * Au mount : charge les lots, appelle POST /api/pro/projects/[id]/recommend
 * pour chaque lot. Affiche les RecommendationCard groupées par lot.
 * Thomas accepte ou refuse individuellement. Bouton "Lancer la génération".
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProStepper from "@/components/marchand/ProStepper";
import RecommendationCard from "@/components/marchand/RecommendationCard";

// ─── Types ──────────────────────────────────────────────────────────

type RecommendationType = "redistribute" | "merge" | "convert" | "add" | "optimize";
type RecommendationDecision = "pending" | "accepted" | "rejected";

interface Recommendation {
  id: string;
  type: RecommendationType;
  room_name: string;
  description: string;
  estimated_cost?: string | null;
  impact: string;
}

interface LotRecommendations {
  lot_id: string;
  lot_name: string;
  recommendations: Recommendation[];
  summary: string;
  isLoading: boolean;
  error: string | null;
}

type PageState = "loading" | "generating" | "ready" | "error";

// ─── Map API action_type to RecommendationCard type ─────────────────

const ACTION_TYPE_MAP: Record<string, RecommendationType> = {
  redistribution: "redistribute",
  cloison: "merge",
  affectation: "convert",
  deco: "optimize",
  sol: "optimize",
  luminaire: "optimize",
};

const IMPACT_LABELS: Record<string, string> = {
  haute: "Impact élevé",
  moyenne: "Impact moyen",
  basse: "Impact faible",
};

// ─── Component ──────────────────────────────────────────────────────

export default function RecommandationsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [lotRecommendations, setLotRecommendations] = useState<LotRecommendations[]>([]);
  const [decisions, setDecisions] = useState<Map<string, RecommendationDecision>>(new Map());
  const [globalError, setGlobalError] = useState<string | null>(null);

  const hasTriggered = useRef(false);

  // ─── Load lots and generate recommendations ──────────────────────

  const loadAndGenerate = useCallback(async () => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;

    try {
      // Fetch lots
      const lotsResponse = await fetch(`/api/pro/projects/${projectId}/lots`);
      if (!lotsResponse.ok) {
        setGlobalError("Impossible de charger les lots du projet.");
        setPageState("error");
        return;
      }

      const lotsData = await lotsResponse.json();
      const lots = lotsData.lots || [];

      if (lots.length === 0) {
        setGlobalError("Aucun lot trouvé. Veuillez d'abord qualifier votre projet.");
        setPageState("error");
        return;
      }

      // Initialize lot recommendations
      const initialLotRecs: LotRecommendations[] = lots.map((lot: { id: string; name: string }) => ({
        lot_id: lot.id,
        lot_name: lot.name,
        recommendations: [],
        summary: "",
        isLoading: true,
        error: null,
      }));
      setLotRecommendations(initialLotRecs);
      setPageState("generating");

      // Generate recommendations for each lot in parallel
      const results = await Promise.allSettled(
        lots.map(async (lot: { id: string; name: string }) => {
          const response = await fetch(`/api/pro/projects/${projectId}/recommend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lot_id: lot.id }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Erreur lors de la génération.");
          }

          return { lot_id: lot.id, data: await response.json() };
        })
      );

      // Process results
      const newDecisions = new Map<string, RecommendationDecision>();
      const updatedLotRecs = initialLotRecs.map((lotRec) => {
        const result = results.find((r) => {
          if (r.status === "fulfilled") return r.value.lot_id === lotRec.lot_id;
          return false;
        });

        if (result && result.status === "fulfilled") {
          const apiRecs = result.value.data.recommendations || [];
          const mapped: Recommendation[] = apiRecs.map(
            (rec: {
              id: string;
              title: string;
              description: string;
              action_type: string;
              estimated_cost_eur: number | null;
              impact_level: string;
              affected_rooms: string[];
            }) => {
              newDecisions.set(rec.id, "pending");
              return {
                id: rec.id,
                type: ACTION_TYPE_MAP[rec.action_type] || "optimize",
                room_name: rec.title,
                description: rec.description,
                estimated_cost: rec.estimated_cost_eur
                  ? `${rec.estimated_cost_eur.toLocaleString("fr-FR")} \u20AC`
                  : null,
                impact: IMPACT_LABELS[rec.impact_level] || rec.impact_level,
              };
            }
          );

          return {
            ...lotRec,
            recommendations: mapped,
            summary: result.value.data.summary || "",
            isLoading: false,
            error: null,
          };
        }

        // Check for errors
        const errorResult = results.find((r) => {
          if (r.status === "rejected") return true;
          return false;
        });

        return {
          ...lotRec,
          isLoading: false,
          error:
            errorResult && errorResult.status === "rejected"
              ? (errorResult.reason as Error).message
              : "Erreur inconnue",
        };
      });

      setLotRecommendations(updatedLotRecs);
      setDecisions(newDecisions);
      setPageState("ready");
    } catch {
      setGlobalError("Erreur de connexion. Vérifiez votre réseau.");
      setPageState("error");
    }
  }, [projectId]);

  useEffect(() => {
    loadAndGenerate();
  }, [loadAndGenerate]);

  // ─── Accept / Reject handlers ─────────────────────────────────────

  async function handleAccept(recId: string) {
    setDecisions((prev) => new Map(prev).set(recId, "accepted"));
    // Fire-and-forget: persist to DB
    fetch(`/api/pro/projects/${projectId}/recommendations/${recId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_accepted: true }),
    }).catch(() => {
      // Non-critical — decision is in UI state
    });
  }

  async function handleReject(recId: string) {
    setDecisions((prev) => new Map(prev).set(recId, "rejected"));
    // Fire-and-forget: persist to DB
    fetch(`/api/pro/projects/${projectId}/recommendations/${recId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_accepted: false }),
    }).catch(() => {
      // Non-critical
    });
  }

  // ─── Stats ────────────────────────────────────────────────────────

  const allRecs = lotRecommendations.flatMap((lr) => lr.recommendations);
  const totalRecs = allRecs.length;
  const acceptedCount = Array.from(decisions.values()).filter((d) => d === "accepted").length;
  const decidedCount = Array.from(decisions.values()).filter((d) => d !== "pending").length;

  // ─── Launch generation ────────────────────────────────────────────

  function handleLaunchGeneration() {
    router.push(`/projet/${projectId}/generation`);
  }

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      <Header variant="internal" />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
        {/* Stepper */}
        <div className="mb-8">
          <ProStepper
            currentStep={5}
            completedSteps={[1, 2, 3, 4]}
            errorSteps={pageState === "error" ? [5] : []}
          />
        </div>

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1C1C1E] tracking-tight">
            {pageState === "generating"
              ? "Analyse en cours..."
              : "Recommandations de l'architecte IA"}
          </h1>
          <p className="text-sm text-[#9B9A94] mt-1">
            {pageState === "generating" &&
              "L'architecte IA analyse votre projet et prépare ses recommandations..."}
            {pageState === "ready" && totalRecs > 0 && (
              <>
                {totalRecs} recommandation{totalRecs > 1 ? "s" : ""} —{" "}
                {acceptedCount} acceptée{acceptedCount > 1 ? "s" : ""}
                {decidedCount < totalRecs && (
                  <> / {totalRecs - decidedCount} en attente</>
                )}
              </>
            )}
            {pageState === "ready" && totalRecs === 0 &&
              "L'architecte n'a pas de recommandation pour ce projet. Vous pouvez lancer la génération."}
            {pageState === "error" && "Une erreur est survenue."}
          </p>
        </div>

        {/* Generating state */}
        {pageState === "generating" && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <svg
              className="animate-spin w-8 h-8 text-[#7D9B76]"
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
            <p className="text-sm text-[#9B9A94]">
              L&apos;architecte IA analyse votre projet...
            </p>
            <p className="text-xs text-[#9B9A94]">
              Cette opération peut prendre quelques secondes.
            </p>
          </div>
        )}

        {/* Loading state */}
        {pageState === "loading" && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <svg
              className="animate-spin w-8 h-8 text-[#7D9B76]"
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
            <p className="text-sm text-[#9B9A94]">Chargement...</p>
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
                {globalError || "Erreur lors de la génération des recommandations."}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  hasTriggered.current = false;
                  setPageState("loading");
                  setGlobalError(null);
                  loadAndGenerate();
                }}
                className="py-2.5 px-4 rounded-lg bg-[#7D9B76] text-white text-sm font-medium
                           hover:bg-[#4A7A42] transition-colors
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76]"
              >
                Réessayer
              </button>
              <button
                onClick={() => router.push(`/projet/${projectId}/qualification`)}
                className="py-2.5 px-4 rounded-lg border border-[#D1D0CB] bg-white
                           text-sm font-medium text-[#1C1C1E] hover:bg-[#F5F5F0]
                           transition-colors focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-[#7D9B76]"
              >
                Retour à la qualification
              </button>
            </div>
          </div>
        )}

        {/* Recommendations by lot */}
        {pageState === "ready" && (
          <div className="space-y-8">
            {lotRecommendations.map((lotRec) => (
              <section key={lotRec.lot_id}>
                {/* Lot header */}
                <div className="mb-3">
                  <h2 className="text-base font-semibold text-[#1C1C1E]">
                    {lotRec.lot_name}
                  </h2>
                  {lotRec.summary && (
                    <p className="text-sm text-[#9B9A94] mt-0.5">
                      {lotRec.summary}
                    </p>
                  )}
                </div>

                {/* Loading per lot */}
                {lotRec.isLoading && (
                  <div className="flex items-center gap-2 py-4">
                    <svg
                      className="animate-spin w-4 h-4 text-[#7D9B76]"
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
                    <span className="text-sm text-[#9B9A94]">Analyse en cours...</span>
                  </div>
                )}

                {/* Error per lot */}
                {lotRec.error && (
                  <div
                    className="p-3 rounded-lg bg-[#FEF2F2] border border-[#EF4444]/20 mb-3"
                    role="alert"
                  >
                    <p className="text-sm text-[#B91C1C]">{lotRec.error}</p>
                  </div>
                )}

                {/* Recommendation cards */}
                {!lotRec.isLoading && lotRec.recommendations.length > 0 && (
                  <div className="space-y-3">
                    {lotRec.recommendations.map((rec) => (
                      <RecommendationCard
                        key={rec.id}
                        recommendation={rec}
                        decision={decisions.get(rec.id) || "pending"}
                        onAccept={handleAccept}
                        onReject={handleReject}
                      />
                    ))}
                  </div>
                )}

                {/* No recommendations for this lot */}
                {!lotRec.isLoading && !lotRec.error && lotRec.recommendations.length === 0 && (
                  <div className="py-4 text-center">
                    <p className="text-sm text-[#9B9A94]">
                      Aucune recommandation pour ce lot.
                    </p>
                  </div>
                )}
              </section>
            ))}

            {/* Counter bar */}
            {totalRecs > 0 && (
              <div className="sticky bottom-0 bg-[#FAFAF8]/95 backdrop-blur-sm border-t border-[#D1D0CB]/40 py-3 -mx-4 px-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#9B9A94]">
                    {acceptedCount} recommandation{acceptedCount > 1 ? "s" : ""} acceptée{acceptedCount > 1 ? "s" : ""} / {totalRecs} total
                  </span>
                  <span className="text-xs text-[#9B9A94]">
                    {decidedCount}/{totalRecs} décidée{decidedCount > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#D1D0CB]/40">
              <button
                onClick={handleLaunchGeneration}
                className="flex-1 py-3 px-4 rounded-lg bg-[#7D9B76] text-white text-sm font-semibold
                           hover:bg-[#4A7A42] transition-colors
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7D9B76] focus-visible:ring-offset-2
                           shadow-[0_2px_8px_rgba(28,28,30,0.12)]"
              >
                Lancer la génération des visuels
              </button>
              <button
                onClick={() => router.push(`/projet/${projectId}/qualification`)}
                className="py-3 px-4 rounded-lg border border-[#D1D0CB] bg-white
                           text-sm font-medium text-[#1C1C1E] hover:bg-[#F5F5F0]
                           transition-colors focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-[#7D9B76]"
              >
                Retour à la qualification
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
