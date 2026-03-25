"use client";

/**
 * F4 — Mode Marchand: Dossier result display.
 * Shows completed before/after images with download and share options.
 */

interface DossierPhotoResult {
  id: number;
  photoIndex: number;
  roomLabel: string | null;
  inputImageKey: string | null;
  outputImageKey: string | null;
  status: string;
  styleId: string | null;
}

interface DossierResultProps {
  photos: DossierPhotoResult[];
  bienNom: string;
  onDownloadPdf: () => void;
  onShareLink: () => void;
  onRegenerate?: (photoId: number) => void;
  isRegenerating?: number | null;
}

export default function DossierResult({
  photos,
  bienNom,
  onDownloadPdf,
  onShareLink,
  onRegenerate,
  isRegenerating,
}: DossierResultProps) {
  const completedPhotos = photos.filter((p) => p.status === "completed");
  const failedPhotos = photos.filter((p) => p.status === "failed");

  return (
    <div className="space-y-6" data-testid="dossier-result">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-[var(--border)] bg-[var(--foreground)]/[0.02]">
        <div>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            {bienNom}
          </h3>
          <p className="text-xs text-[var(--muted)] font-light mt-0.5">
            {completedPhotos.length} visuel{completedPhotos.length > 1 ? "s" : ""} meublé{completedPhotos.length > 1 ? "s" : ""}
            {failedPhotos.length > 0 && ` — ${failedPhotos.length} échec${failedPhotos.length > 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Share link */}
          <button
            onClick={onShareLink}
            aria-label="Partager avec un acquéreur"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-[var(--foreground)]/5 text-[var(--foreground)] hover:bg-[var(--foreground)]/10 transition-colors"
            data-testid="dossier-share-link"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
            </svg>
            Partager avec un acquéreur
          </button>

          {/* Download PDF */}
          <button
            onClick={onDownloadPdf}
            aria-label="Télécharger le PDF du dossier"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-[var(--sage)] text-white hover:opacity-90 transition-opacity"
            data-testid="dossier-download-pdf"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Télécharger le PDF
          </button>
        </div>
      </div>

      {/* Photos grid */}
      <div className="space-y-4">
        {completedPhotos.map((photo) => (
          <div
            key={photo.id}
            className="border border-[var(--border)] rounded-2xl overflow-hidden"
            data-testid={`dossier-result-photo-${photo.id}`}
          >
            {/* Room label header */}
            <div className="px-4 py-2.5 border-b border-[var(--border)] flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--foreground)]">
                {photo.roomLabel || `Photo ${photo.photoIndex + 1}`}
              </span>
              {onRegenerate && (
                <button
                  onClick={() => onRegenerate(photo.id)}
                  disabled={isRegenerating === photo.id}
                  className="text-xs text-[var(--muted)] font-light hover:text-[var(--foreground)] transition-colors disabled:opacity-40"
                  data-testid={`dossier-regenerate-${photo.id}`}
                >
                  {isRegenerating === photo.id ? "En cours..." : "Regénérer"}
                </button>
              )}
            </div>

            {/* Before/After side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0">
              {/* Before */}
              <div className="relative">
                <div className="aspect-[4/3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/logs/image?path=${encodeURIComponent(photo.inputImageKey || "")}`}
                    alt={`${photo.roomLabel || "Photo"} — avant`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <span className="absolute bottom-2 left-2 text-[11px] font-medium tracking-widest uppercase text-white/70">
                  AVANT
                </span>
              </div>

              {/* After */}
              <div className="relative">
                <div className="aspect-[4/3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/logs/image?path=${encodeURIComponent(photo.outputImageKey || "")}`}
                    alt={`${photo.roomLabel || "Photo"} — apres`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <span className="absolute bottom-2 left-2 text-[11px] font-medium tracking-widest uppercase text-[var(--sage)]">
                  APRÈS
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Failed photos */}
      {failedPhotos.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-red-400 font-medium">
            {failedPhotos.length} photo{failedPhotos.length > 1 ? "s" : ""} en échec — crédit restitué automatiquement
          </p>
          {failedPhotos.map((photo) => (
            <div
              key={photo.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 border border-red-100"
            >
              <span className="text-sm text-red-600 font-light">
                {photo.roomLabel || `Photo ${photo.photoIndex + 1}`}
              </span>
              {onRegenerate && (
                <button
                  onClick={() => onRegenerate(photo.id)}
                  disabled={isRegenerating === photo.id}
                  className="text-xs text-red-500 font-medium hover:text-red-700 transition-colors disabled:opacity-40"
                >
                  {isRegenerating === photo.id ? "..." : "Relancer (1 crédit)"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
