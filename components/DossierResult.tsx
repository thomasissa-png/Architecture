"use client";

import StorageImage from "@/components/StorageImage";
import { translateRoomLabel } from "@/lib/constants";

/**
 * F4 — Mode Pro (ex Mode Marchand): Dossier result display.
 * Shows completed before/after images with download and share options.
 * Summary bar removed — share buttons are in MerchantMode.tsx, not here.
 */

interface DossierPhotoResult {
  id: number;
  photoIndex: number;
  roomLabel: string | null;
  inputImageKey: string | null;
  outputImageKey: string | null;
  status: string;
  styleId: string | null;
  errorMessage?: string | null;
}

interface DossierResultProps {
  photos: DossierPhotoResult[];
  dossierUuid?: string;
  onDownloadPdf: () => void;
  onRegenerate?: (photoId: number) => void;
  isRegenerating?: number | null;
}

export default function DossierResult({
  photos,
  dossierUuid,
  onDownloadPdf,
  onRegenerate,
  isRegenerating,
}: DossierResultProps) {
  const completedPhotos = photos.filter((p) => p.status === "completed");
  const failedPhotos = photos.filter((p) => p.status === "failed");

  return (
    <div className="space-y-6" data-testid="dossier-result">
      {/* Action bar — view dossier + PDF */}
      <div className="flex flex-wrap items-center gap-2">
        {dossierUuid && (
          <a
            href={`/dossier/${dossierUuid}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Voir le dossier"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-sage text-white hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            data-testid="dossier-view-page"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            Voir le dossier
          </a>
        )}
        <button
          onClick={onDownloadPdf}
          aria-label="Télécharger le PDF du dossier"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-foreground/5 text-foreground hover:bg-foreground/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
          data-testid="dossier-download-pdf"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          PDF
        </button>
      </div>

      {/* Photos grid */}
      <div className="space-y-4">
        {completedPhotos.map((photo) => (
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
              {onRegenerate && (
                <button
                  onClick={() => onRegenerate(photo.id)}
                  disabled={isRegenerating === photo.id}
                  className="text-xs text-muted font-light hover:text-foreground transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 min-h-[44px] inline-flex items-center"
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
              <div className="relative">
                <div className="aspect-[4/3]">
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

            {/* Download HD link */}
            {photo.outputImageKey && (
              <div className="px-4 py-2 border-t border-foreground/5">
                <a
                  href={`/api/logs/image?path=${encodeURIComponent(photo.outputImageKey)}`}
                  download={`${photo.roomLabel || 'photo'}-apres.jpg`}
                  className="min-h-[44px] inline-flex items-center text-xs text-muted hover:text-foreground transition-colors"
                >
                  Télécharger HD
                </a>
              </div>
            )}
          </div>
        ))}
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
    </div>
  );
}
