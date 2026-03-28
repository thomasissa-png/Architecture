"use client";

/**
 * AnnonceGallery — Photo gallery for /annonce/[uuid] with lightbox support.
 * Groups photos by room, adds click-to-enlarge on each photo.
 */

import { useState } from "react";
import Lightbox from "@/components/Lightbox";
import StorageImage from "@/components/StorageImage";

interface GalleryPhoto {
  id: string | number;
  outputImageKey: string;
  roomType: string;
  roomLabel: string | null;
}

interface AnnonceGalleryProps {
  photosByRoom: { roomType: string; roomLabel: string; photos: GalleryPhoto[] }[];
  /** Flat list of all photos in display order, for lightbox navigation */
  allPhotos: { src: string; alt: string }[];
}

export default function AnnonceGallery({ photosByRoom, allPhotos }: AnnonceGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Build a map from photo id to flat index for lightbox opening
  let flatIndex = 0;
  const photoIdToFlatIndex = new Map<string | number, number>();
  for (const group of photosByRoom) {
    for (const photo of group.photos) {
      photoIdToFlatIndex.set(photo.id, flatIndex);
      flatIndex++;
    }
  }

  // If most groups have only 1 photo, flatten into a single grid for better layout
  const totalPhotos = photosByRoom.reduce((sum, g) => sum + g.photos.length, 0);
  const singlePhotoGroups = photosByRoom.filter(g => g.photos.length === 1).length;
  const shouldFlatten = totalPhotos > 1 && singlePhotoGroups > photosByRoom.length / 2;

  return (
    <>
      <div className="mb-10" data-testid="annonce-gallery">
        {shouldFlatten ? (
          /* Flat grid — all photos side by side */
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photosByRoom.flatMap((group) =>
              group.photos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  className="relative bg-foreground/[0.02] rounded-2xl overflow-hidden border border-foreground/5 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                  onClick={() => {
                    const idx = photoIdToFlatIndex.get(photo.id);
                    if (idx !== undefined) setLightboxIndex(idx);
                  }}
                  aria-label={`Agrandir : ${photo.roomLabel || group.roomLabel || "Photo"}`}
                >
                  <StorageImage
                    imageKey={photo.outputImageKey}
                    alt={photo.roomLabel || group.roomLabel || "Photo"}
                    className="w-full aspect-[4/3] object-cover"
                    loading="lazy"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-2">
                    <span className="text-xs text-white/90 font-medium">
                      {photo.roomLabel || group.roomLabel}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          /* Grouped by room — when rooms have multiple photos */
          <div className="space-y-8">
            {photosByRoom.map((group) => (
              <div key={group.roomType} id={`piece-${group.roomType}`} className="scroll-mt-28">
                <h2 className="text-sm font-medium text-foreground mb-3">
                  {group.roomLabel}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {group.photos.map((photo) => (
                <button
                  key={photo.id}
                  type="button"
                  className="relative bg-foreground/[0.02] rounded-2xl overflow-hidden border border-foreground/5 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
                  onClick={() => {
                    const idx = photoIdToFlatIndex.get(photo.id);
                    if (idx !== undefined) setLightboxIndex(idx);
                  }}
                  aria-label={`Agrandir : ${photo.roomLabel || "Photo"}`}
                >
                  <StorageImage
                    imageKey={photo.outputImageKey}
                    alt={photo.roomLabel || "Photo"}
                    className="w-full aspect-[4/3] object-cover"
                    loading="lazy"
                  />
                  {photo.roomLabel && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-2">
                      <span className="text-xs text-white/90 font-medium">
                        {photo.roomLabel}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={allPhotos}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
