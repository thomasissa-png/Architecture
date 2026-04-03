"use client";

/**
 * F4 — Public dossier view: displays before/after images for each photo.
 * Used on the shareable /dossier/[uuid] page.
 * Images loaded from /api/logs/image?path=... (existing image serving endpoint).
 * Clicking any image opens a fullscreen lightbox.
 */

import { useState } from "react";
import Lightbox from "@/components/Lightbox";
import StorageImage from "@/components/StorageImage";

interface DossierPhotoView {
  id: number;
  roomLabel: string;
  inputImageKey: string;
  outputImageKey: string;
}

interface DossierPublicViewProps {
  photos: DossierPhotoView[];
  dossierUuid: string;
}

export default function DossierPublicView({
  photos,
}: DossierPublicViewProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Build a flat array of all images (avant + apres, interleaved per photo)
  // Skip entries with empty/missing keys to avoid 404s in lightbox
  const allImages: { src: string; alt: string }[] = [];
  for (const photo of photos) {
    if (photo.inputImageKey) {
      allImages.push({
        src: `/api/logs/image?path=${encodeURIComponent(photo.inputImageKey)}`,
        alt: `${photo.roomLabel} — avant`,
      });
    }
    if (photo.outputImageKey) {
      allImages.push({
        src: `/api/logs/image?path=${encodeURIComponent(photo.outputImageKey)}`,
        alt: `${photo.roomLabel} — après`,
      });
    }
  }

  // Build index mapping: photoIndex -> [beforeLightboxIdx, afterLightboxIdx]
  // Used to correctly open the lightbox when clicking on a specific image
  const lightboxIndexMap: Array<[number, number]> = [];
  let lightboxIdx = 0;
  for (const photo of photos) {
    const beforeIdx = photo.inputImageKey ? lightboxIdx++ : -1;
    const afterIdx = photo.outputImageKey ? lightboxIdx++ : -1;
    lightboxIndexMap.push([beforeIdx, afterIdx]);
  }

  return (
    <>
      <div className="space-y-6" data-testid="dossier-public-photos">
        {photos.map((photo, photoIndex) => (
          <div
            key={photo.id}
            id={`piece-${photo.id}`}
            className="border border-foreground/5 rounded-2xl overflow-hidden bg-foreground/[0.02] scroll-mt-28"
            data-testid={`dossier-photo-${photo.id}`}
          >
            {/* Room label */}
            <div className="px-5 py-3 border-b border-foreground/5">
              <h3 className="text-sm font-semibold text-foreground">
                {photo.roomLabel}
              </h3>
            </div>

            {/* Before/After grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-foreground/5">
              {/* Before */}
              <button
                type="button"
                className="relative bg-background cursor-zoom-in text-left"
                onClick={() => { const idx = lightboxIndexMap[photoIndex]?.[0]; if (idx !== undefined && idx >= 0) setLightboxIndex(idx); }}
                aria-label={`Agrandir ${photo.roomLabel} — avant`}
              >
                <div className="aspect-[4/3]">
                  <StorageImage
                    imageKey={photo.inputImageKey}
                    alt={`${photo.roomLabel} — avant`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <span className="absolute bottom-2.5 left-2.5 text-[11px] font-medium tracking-widest uppercase text-white/70">
                  AVANT
                </span>
              </button>

              {/* After */}
              <button
                type="button"
                className="relative bg-background cursor-zoom-in text-left"
                onClick={() => { const idx = lightboxIndexMap[photoIndex]?.[1]; if (idx !== undefined && idx >= 0) setLightboxIndex(idx); }}
                aria-label={`Agrandir ${photo.roomLabel} — après`}
              >
                <div className="aspect-[4/3] bg-foreground/5">
                  <StorageImage
                    imageKey={photo.outputImageKey}
                    alt={`${photo.roomLabel} — apres`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <span className="absolute bottom-2.5 left-2.5 text-[11px] font-medium tracking-widest uppercase text-sage">
                  APRÈS
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={allImages}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
