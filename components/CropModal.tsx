"use client";

/**
 * CropModal — Modal de recadrage rectangulaire pour les photos générées.
 *
 * Session 38 (BR-6) : refonte complète. Avant, le composant utilisait
 * react-easy-crop qui ne propose qu'une UX "pan+zoom" (la crop area est le
 * viewport, pas une sélection rectangulaire). Le fondateur a rapporté 3 fois
 * le même bug : "On ne peut pas rogner. Juste zoomer et déplacer".
 *
 * Le nouveau composant utilise react-image-crop qui propose une vraie
 * sélection rectangulaire libre (drag pour déplacer, corners pour redimensionner),
 * avec en plus des presets d'aspect ratio (Libre / 1:1 / 4:3 / 16:9).
 *
 * Le résultat croppé est envoyé au parent en base64 (data URI).
 */

import { useState, useCallback, useEffect, useRef } from "react";
// BR-6 (session 38) — react-image-crop est vendoré dans components/vendor/
// pour contourner un échec de résolution Replit irrécupérable. Voir
// components/vendor/react-image-crop/README.md pour le contexte complet.
// Les types viennent toujours de node_modules via le package npm (gardé
// en dependencies), le runtime vient du vendor.
import type { Crop, PixelCrop } from "react-image-crop";
import ReactCrop, { centerCrop, makeAspectCrop } from "@/components/vendor/react-image-crop/index.js";
import "@/components/vendor/react-image-crop/ReactCrop.css";

interface CropModalProps {
  imageUrl: string;
  onCrop: (croppedBase64: string) => Promise<void>;
  onClose: () => void;
  /** Titre du modal (ex : "Recadrer la photo générée"). Défaut : "Recadrer la photo". */
  title?: string;
}

type AspectPreset = "free" | "1:1" | "4:3" | "16:9" | "3:2";
const ASPECT_RATIOS: Record<AspectPreset, number | undefined> = {
  free: undefined,
  "1:1": 1,
  "4:3": 4 / 3,
  "16:9": 16 / 9,
  "3:2": 3 / 2,
};

/**
 * Génère une crop initiale centrée qui couvre 80% de l'image.
 * Si un aspect est fourni, respecte le ratio.
 */
function makeDefaultCrop(
  aspect: number | undefined,
  imgWidth: number,
  imgHeight: number,
): Crop {
  if (aspect) {
    return centerCrop(
      makeAspectCrop(
        { unit: "%", width: 80 },
        aspect,
        imgWidth,
        imgHeight,
      ),
      imgWidth,
      imgHeight,
    );
  }
  // Free crop : rectangle centré à 80% de l'image
  return {
    unit: "%",
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  };
}

/**
 * Extrait la zone croppée de l'image source en pleine résolution et la
 * retourne en data URI JPEG.
 *
 * Le pixelCrop est en pixels AFFICHÉS (scaled) — il faut multiplier par le
 * facteur d'échelle pour obtenir les pixels NATURELS de l'image source.
 */
async function getCroppedBase64(
  imageSrc: string,
  pixelCrop: PixelCrop,
  imageEl: HTMLImageElement,
): Promise<string> {
  // Charge une copie de l'image source pour accéder à ses dimensions naturelles
  const image = new Image();
  image.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Impossible de charger l'image source."));
    image.src = imageSrc;
  });

  // Facteurs d'échelle : pixels naturels / pixels affichés
  const scaleX = image.naturalWidth / imageEl.width;
  const scaleY = image.naturalHeight / imageEl.height;

  // Dimensions de sortie en pixels naturels
  const outputWidth = Math.round(pixelCrop.width * scaleX);
  const outputHeight = Math.round(pixelCrop.height * scaleY);

  if (outputWidth < 1 || outputHeight < 1) {
    throw new Error("La zone sélectionnée est trop petite.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    image,
    Math.round(pixelCrop.x * scaleX),
    Math.round(pixelCrop.y * scaleY),
    outputWidth,
    outputHeight,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  return canvas.toDataURL("image/jpeg", 0.92);
}

export default function CropModal({ imageUrl, onCrop, onClose, title = "Recadrer la photo" }: CropModalProps) {
  const [crop, setCrop] = useState<Crop | undefined>(undefined);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [aspectPreset, setAspectPreset] = useState<AspectPreset>("free");
  const [isSaving, setIsSaving] = useState(false);
  const [cropError, setCropError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Quand l'image est chargée, initialiser une crop par défaut
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    imgRef.current = img;
    const aspect = ASPECT_RATIOS[aspectPreset];
    const initial = makeDefaultCrop(aspect, img.width, img.height);
    setCrop(initial);
    // Force un completedCrop initial (en pixels) pour que le bouton Appliquer soit actif
    const pixelCrop: PixelCrop = {
      unit: "px",
      x: (initial.x / 100) * img.width,
      y: (initial.y / 100) * img.height,
      width: (initial.width / 100) * img.width,
      height: (initial.height / 100) * img.height,
    };
    setCompletedCrop(pixelCrop);
  }, [aspectPreset]);

  // Quand l'aspect ratio change, regénérer une crop par défaut
  const handleAspectChange = useCallback((preset: AspectPreset) => {
    setAspectPreset(preset);
    const img = imgRef.current;
    if (!img) return;
    const aspect = ASPECT_RATIOS[preset];
    const initial = makeDefaultCrop(aspect, img.width, img.height);
    setCrop(initial);
    const pixelCrop: PixelCrop = {
      unit: "px",
      x: (initial.x / 100) * img.width,
      y: (initial.y / 100) * img.height,
      width: (initial.width / 100) * img.width,
      height: (initial.height / 100) * img.height,
    };
    setCompletedCrop(pixelCrop);
  }, []);

  const handleSave = async () => {
    if (!completedCrop || !imgRef.current) {
      setCropError("Veuillez définir une zone à recadrer.");
      return;
    }
    if (completedCrop.width < 10 || completedCrop.height < 10) {
      setCropError("La zone sélectionnée est trop petite.");
      return;
    }
    setIsSaving(true);
    setCropError(null);
    try {
      const croppedBase64 = await getCroppedBase64(imageUrl, completedCrop, imgRef.current);
      await onCrop(croppedBase64);
    } catch (err) {
      setCropError(err instanceof Error ? err.message : "Erreur lors du recadrage. Réessayez.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
    >
      <div
        className="bg-background rounded-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-foreground/5">
          <div>
            <h2 id="crop-modal-title" className="text-sm font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-muted font-light mt-0.5">
              Faites glisser les coins pour ajuster, ou le rectangle pour déplacer.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-foreground/5 transition-colors text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
            aria-label="Fermer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Aspect ratio presets */}
        <div className="px-5 py-3 flex items-center gap-2 border-b border-foreground/5 overflow-x-auto">
          <span className="text-xs text-muted font-light whitespace-nowrap">Format</span>
          {(Object.keys(ASPECT_RATIOS) as AspectPreset[]).map((preset) => (
            <button
              key={preset}
              onClick={() => handleAspectChange(preset)}
              className={`text-xs px-3 min-h-[36px] py-1.5 rounded-full font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 ${
                aspectPreset === preset
                  ? "bg-sage text-white"
                  : "bg-foreground/5 text-muted hover:bg-foreground/10 hover:text-foreground"
              }`}
              aria-pressed={aspectPreset === preset}
            >
              {preset === "free" ? "Libre" : preset}
            </button>
          ))}
        </div>

        {/* Crop area */}
        <div className="flex-1 overflow-auto bg-[#1C1C1E] flex items-center justify-center p-4 min-h-[40vh]">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={ASPECT_RATIOS[aspectPreset]}
            keepSelection
            minWidth={20}
            minHeight={20}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              onLoad={onImageLoad}
              crossOrigin="anonymous"
              style={{ maxHeight: "60vh", maxWidth: "100%", display: "block" }}
            />
          </ReactCrop>
        </div>

        {/* Error feedback */}
        {cropError && (
          <p className="text-xs text-red-500 font-light px-5 py-2 border-t border-red-200/40 bg-red-50/40">
            {cropError}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-foreground/5">
          <button
            onClick={onClose}
            className="text-xs text-muted font-light px-4 min-h-[44px] py-2 rounded-full hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !completedCrop}
            className="text-xs bg-sage text-white px-5 min-h-[44px] py-2 rounded-full font-medium hover:bg-sage/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
          >
            {isSaving ? "Recadrage..." : "Appliquer le recadrage"}
          </button>
        </div>
      </div>
    </div>
  );
}
