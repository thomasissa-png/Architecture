"use client";

import { useState } from "react";
import StorageImage from "@/components/StorageImage";
import RefineModal from "@/components/RefineModal";
import { translateRoomLabel } from "@/lib/constants";

/**
 * F4 — Mode Pro (ex Mode Marchand): Dossier result display.
 * Shows completed before/after images with download, share, regenerate and iterate options.
 * Summary bar removed — share buttons are in MerchantMode.tsx, not here.
 */

interface DossierPhotoResult {
  id: number;
  photoIndex: number;
  roomLabel: string | null;
  inputImageKey: string | null;
  outputImageKey: string | null;
  pass1ImageKey?: string | null;
  status: string;
  styleId: string | null;
  errorMessage?: string | null;
  iterationCount?: number;
}

interface DossierResultProps {
  photos: DossierPhotoResult[];
  onRegenerate?: (photoId: number) => void;
  onIterate?: (photoId: number, comment: string, previousModifications: string[]) => Promise<void>;
  isRegenerating?: number | null;
  isIterating?: number | null;
  /** Max iterations allowed for this user's plan (0=Découverte, 1=Starter, 3=Pro/Admin) */
  maxIterations?: number;
}

export default function DossierResult({
  photos,
  onRegenerate,
  onIterate,
  isRegenerating,
  isIterating,
  maxIterations = 3,
}: DossierResultProps) {
  const completedPhotos = photos.filter((p) => p.status === "completed");
  const failedPhotos = photos.filter((p) => p.status === "failed");

  // RefineModal state
  const [refinePhotoId, setRefinePhotoId] = useState<number | null>(null);
  const [previousModifications, setPreviousModifications] = useState<Record<number, string[]>>({});
  const [refineWarnings, setRefineWarnings] = useState<string[]>([]);

  const refinePhoto = completedPhotos.find((p) => p.id === refinePhotoId);
  const refineIterationsUsed = refinePhoto?.iterationCount ?? 0;
  const refineIterationsRemaining = maxIterations - refineIterationsUsed;

  const handleOpenRefine = (photoId: number) => {
    setRefinePhotoId(photoId);
    setRefineWarnings([]);
  };

  const handleRefineSubmit = async (comment: string) => {
    if (!refinePhotoId || !onIterate) return;
    const mods = previousModifications[refinePhotoId] || [];
    await onIterate(refinePhotoId, comment, mods);
    // Track modification for cumulative prompt
    setPreviousModifications((prev) => ({
      ...prev,
      [refinePhotoId]: [...(prev[refinePhotoId] || []), comment],
    }));
    setRefinePhotoId(null);
  };

  return (
    <div className="space-y-6" data-testid="dossier-result">
      {/* Photos grid */}
      <div className="space-y-4">
        {completedPhotos.map((photo) => {
          const iterationsUsed = photo.iterationCount ?? 0;
          const iterationsLeft = maxIterations - iterationsUsed;
          const canIterate = iterationsLeft > 0 && !!photo.pass1ImageKey && !!onIterate;

          return (
            <div
              key={photo.id}
              className="border border-foreground/5 rounded-2xl overflow-hidden"
              data-testid={`dossier-result-photo-${photo.id}`}
            >
              {/* Room label header */}
              <div className="px-4 py-2.5 border-b border-foreground/5 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {translateRoomLabel(photo.roomLabel, `Photo ${photo.photoIndex + 1}`)}
                </span>
                <div className="flex items-center gap-3">
                  {/* Iterate (refine) button */}
                  {canIterate && (
                    <button
                      onClick={() => handleOpenRefine(photo.id)}
                      disabled={isIterating === photo.id || isRegenerating === photo.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-sage/40 text-sage hover:bg-sage/5 transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 min-h-[44px]"
                      data-testid={`dossier-iterate-${photo.id}`}
                    >
                      {isIterating === photo.id ? (
                        "Affinage..."
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                          </svg>
                          Affiner ({iterationsLeft})
                        </>
                      )}
                    </button>
                  )}
                  {/* Iterations exhausted indicator */}
                  {iterationsUsed >= maxIterations && (
                    <span className="text-xs text-muted/50 font-light min-h-[44px] inline-flex items-center">
                      {iterationsUsed}/{maxIterations} affinages
                    </span>
                  )}
                  {/* Regenerate button */}
                  {onRegenerate && (
                    <button
                      onClick={() => onRegenerate(photo.id)}
                      disabled={isRegenerating === photo.id || isIterating === photo.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-foreground/50 border border-foreground/10 hover:text-foreground hover:border-foreground/20 transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 min-h-[44px]"
                      data-testid={`dossier-regenerate-${photo.id}`}
                    >
                      {isRegenerating === photo.id ? "En cours..." : "Regénérer"}
                    </button>
                  )}
                </div>
              </div>

              {/* Before/After side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0">
                {/* Before */}
                <div className="relative overflow-hidden">
                  <div className="aspect-[3/2]">
                    <StorageImage
                      imageKey={photo.inputImageKey}
                      alt={`${translateRoomLabel(photo.roomLabel, "Photo")} — avant`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <span className="absolute bottom-2 left-2 text-[11px] font-medium tracking-widest uppercase text-white/70">
                    AVANT
                  </span>
                </div>

                {/* After */}
                <div className="relative overflow-hidden">
                  <div className="aspect-[3/2]">
                    <StorageImage
                      imageKey={photo.outputImageKey}
                      alt={`${translateRoomLabel(photo.roomLabel, "Photo")} — après`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <span className="absolute bottom-2 left-2 text-[11px] font-medium tracking-widest uppercase text-sage">
                    APRÈS
                  </span>
                </div>
              </div>

              {/* Download HD link + iteration info */}
              {photo.outputImageKey && (
                <div className="px-4 py-2 border-t border-foreground/5 flex items-center justify-between">
                  <a
                    href={`/api/logs/image?path=${encodeURIComponent(photo.outputImageKey)}`}
                    download={`${photo.roomLabel || 'photo'}-apres.jpg`}
                    className="min-h-[44px] inline-flex items-center text-xs text-muted hover:text-foreground transition-colors"
                  >
                    Télécharger HD
                  </a>
                  {iterationsUsed > 0 && (
                    <span className="text-xs text-muted/50 font-light">
                      {iterationsUsed} affinage{iterationsUsed > 1 ? "s" : ""} appliqué{iterationsUsed > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Failed photos */}
      {failedPhotos.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-red-400 font-medium">
            {failedPhotos.length} photo{failedPhotos.length > 1 ? "s" : ""} en échec — visuel restitué automatiquement
          </p>
          {failedPhotos.map((photo) => (
            <div
              key={photo.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 border border-red-100"
            >
              <div className="flex-1 min-w-0">
                <span className="text-sm text-red-600 font-light">
                  {translateRoomLabel(photo.roomLabel, `Photo ${photo.photoIndex + 1}`)}
                </span>
                {photo.errorMessage && (
                  <p className="text-xs text-muted mt-1 font-light">{photo.errorMessage}</p>
                )}
              </div>
              {onRegenerate && (
                <button
                  onClick={() => onRegenerate(photo.id)}
                  disabled={isRegenerating === photo.id}
                  className="text-xs text-red-500 font-medium hover:text-red-700 transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
                >
                  {isRegenerating === photo.id ? "..." : "Relancer (1 visuel)"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* RefineModal for iteration */}
      <RefineModal
        isOpen={refinePhotoId !== null}
        onClose={() => setRefinePhotoId(null)}
        onSubmit={handleRefineSubmit}
        iterationsRemaining={refineIterationsRemaining}
        maxIterations={3}
        isLoading={isIterating === refinePhotoId}
        warnings={refineWarnings}
      />
    </div>
  );
}
