"use client";

import { useState, useEffect, useCallback } from "react";
import StorageImage from "@/components/StorageImage";
import { translateRoomLabel } from "@/lib/constants";

/**
 * F4 — Mode Pro (ex Mode Marchand): Dossier result display.
 * Shows completed before/after images with download and share options.
 * WhatsApp share uses navigator.share with image file (native pattern from ImageComparator).
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
  bienNom: string;
  dossierUuid?: string;
  onDownloadPdf: () => void;
  onShareLink: () => void;
  onRegenerate?: (photoId: number) => void;
  isRegenerating?: number | null;
}

export default function DossierResult({
  photos,
  bienNom,
  dossierUuid,
  onDownloadPdf,
  onShareLink,
  onRegenerate,
  isRegenerating,
}: DossierResultProps) {
  const completedPhotos = photos.filter((p) => p.status === "completed");
  const failedPhotos = photos.filter((p) => p.status === "failed");
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const handleWhatsAppShare = useCallback(async () => {
    if (!dossierUuid) return;
    const shareUrl = `${window.location.origin}/dossier/${dossierUuid}`;
    const text = `${bienNom} — Visuels meubles par Versiroom\n${shareUrl}`;

    if (canNativeShare) {
      try {
        await navigator.share({
          title: bienNom,
          text: `${bienNom} — Visuels meubles par Versiroom`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to wa.me
      }
    }

    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener"
    );
  }, [dossierUuid, bienNom, canNativeShare]);

  return (
    <div className="space-y-6" data-testid="dossier-result">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-foreground/5 bg-foreground/[0.02]">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {bienNom}
          </h3>
          <p className="text-xs text-muted font-light mt-0.5">
            {completedPhotos.length} visuel{completedPhotos.length > 1 ? "s" : ""} meublé{completedPhotos.length > 1 ? "s" : ""}
            {failedPhotos.length > 0 && ` — ${failedPhotos.length} échec${failedPhotos.length > 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* WhatsApp share */}
          {dossierUuid && (
            <button
              onClick={handleWhatsAppShare}
              aria-label="Partager via WhatsApp"
              className="inline-flex items-center gap-1.5 px-2 sm:px-4 py-2 rounded-xl text-xs font-medium bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/50 focus-visible:ring-offset-2"
              data-testid="dossier-share-whatsapp"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </button>
          )}

          {/* Share link */}
          <button
            onClick={onShareLink}
            aria-label="Partager avec un acquereur"
            className="inline-flex items-center gap-1.5 px-2 sm:px-4 py-2 rounded-xl text-xs font-medium bg-foreground/5 text-foreground hover:bg-foreground/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            data-testid="dossier-share-link"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
            </svg>
            Partager avec un acquéreur
          </button>

          {/* View dossier page */}
          {dossierUuid && (
            <a
              href={`/dossier/${dossierUuid}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Voir le dossier"
              className="inline-flex items-center gap-1.5 px-2 sm:px-4 py-2 rounded-xl text-xs font-medium bg-sage text-white hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
              data-testid="dossier-view-page"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Voir le dossier
            </a>
          )}

          {/* Download PDF */}
          <button
            onClick={onDownloadPdf}
            aria-label="Télécharger le PDF du dossier"
            className="inline-flex items-center gap-1.5 px-2 sm:px-4 py-2 rounded-xl text-xs font-medium bg-foreground/5 text-foreground hover:bg-foreground/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            data-testid="dossier-download-pdf"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF
          </button>
        </div>
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
            {failedPhotos.length} photo{failedPhotos.length > 1 ? "s" : ""} en échec — crédit restitué automatiquement
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
