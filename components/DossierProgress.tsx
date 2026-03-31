"use client";

/**
 * F4 — Mode Pro (ex Mode Marchand): Batch generation progress display.
 * Shows per-photo status (pending, generating, completed, failed)
 * with a progress bar and timing.
 */

interface PhotoStatus {
  id: number;
  photoIndex: number;
  roomLabel: string | null;
  status: "pending" | "generating" | "completed" | "failed";
  errorMessage?: string | null;
  outputImageKey?: string | null;
}

interface DossierProgressProps {
  photos: PhotoStatus[];
  isGenerating: boolean;
  elapsed: number; // seconds
}

export default function DossierProgress({
  photos,
  isGenerating,
  elapsed,
}: DossierProgressProps) {
  const completed = photos.filter((p) => p.status === "completed").length;
  const failed = photos.filter((p) => p.status === "failed").length;
  const total = photos.length;
  const progress = total > 0 ? ((completed + failed) / total) * 100 : 0;

  return (
    <div className="space-y-4" data-testid="dossier-progress">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground font-medium">
            {isGenerating ? "Génération en cours..." : "Terminé"}
          </span>
          <span className="text-muted font-light">
            {completed}/{total} photos
            {failed > 0 && ` (${failed} échec${failed > 1 ? "s" : ""})`}
          </span>
        </div>

        <div className="h-2 bg-foreground/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-sage rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {isGenerating && elapsed > 0 && (
          <p className="text-xs text-muted font-light">
            {elapsed}s · ~{Math.max(0, Math.ceil((total - completed - failed) * 30))}s restant
          </p>
        )}
      </div>

      {/* Per-photo status list */}
      <div className="space-y-1.5">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="flex items-center gap-3 px-3 py-2 rounded-xl bg-foreground/[0.02]"
            data-testid={`dossier-photo-status-${photo.id}`}
          >
            {/* Status icon */}
            {photo.status === "completed" && (
              <svg
                className="w-4 h-4 text-sage shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {photo.status === "generating" && (
              <svg
                className="w-4 h-4 text-sage shrink-0 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {photo.status === "failed" && (
              <svg
                className="w-4 h-4 text-red-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {photo.status === "pending" && (
              <div className="w-4 h-4 rounded-full border-2 border-foreground/10 shrink-0" />
            )}

            {/* Label */}
            <span className="text-sm text-foreground font-normal flex-1 truncate">
              {photo.roomLabel || `Photo ${photo.photoIndex + 1}`}
            </span>

            {/* Status text + thumbnail */}
            <div className="shrink-0 flex items-center gap-2">
              {photo.status === "completed" && photo.outputImageKey && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`/api/logs/image?path=${encodeURIComponent(photo.outputImageKey)}`}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover border border-foreground/5"
                />
              )}
              <div className="text-right">
                <span className={`text-xs font-light ${
                  photo.status === "completed" ? "text-sage" :
                  photo.status === "failed" ? "text-red-400" :
                  photo.status === "generating" ? "text-sage" :
                  "text-muted/60"
                }`}>
                  {photo.status === "completed" && "Prêt"}
                  {photo.status === "generating" && "En cours..."}
                  {photo.status === "failed" && "Échec"}
                  {photo.status === "pending" && "En attente"}
                </span>
                {photo.status === "failed" && photo.errorMessage && (
                  <p className="text-[11px] text-muted font-light mt-0.5 max-w-[200px]">{photo.errorMessage}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
