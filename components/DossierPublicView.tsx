"use client";

/**
 * F4 — Public dossier view: displays before/after images for each photo.
 * Used on the shareable /dossier/[uuid] page.
 * Images loaded from /api/logs/image?path=... (existing image serving endpoint).
 */

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

  return (
    <div className="space-y-6" data-testid="dossier-public-photos">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="border border-foreground/5 rounded-2xl overflow-hidden bg-foreground/[0.02]"
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
            <div className="relative bg-background">
              <div className="aspect-[4/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/logs/image?path=${encodeURIComponent(photo.inputImageKey)}`}
                  alt={`${photo.roomLabel} — avant`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <span className="absolute bottom-2.5 left-2.5 text-[11px] font-medium tracking-widest uppercase text-white/70">
                AVANT
              </span>
            </div>

            {/* After */}
            <div className="relative bg-background">
              <div className="aspect-[4/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/logs/image?path=${encodeURIComponent(photo.outputImageKey)}`}
                  alt={`${photo.roomLabel} — apres`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <span className="absolute bottom-2.5 left-2.5 text-[11px] font-medium tracking-widest uppercase text-sage">
                APRÈS
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
