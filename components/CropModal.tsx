"use client";

/**
 * CropModal — Modal de recadrage/zoom pour les photos de bien.
 * Permet à Thomas de corriger un grand angle en sélectionnant
 * une zone de la photo avant génération.
 *
 * Utilise react-easy-crop pour le crop interactif.
 * Le résultat croppé est envoyé au parent en base64.
 */

import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

interface CropModalProps {
  imageUrl: string;
  onCrop: (croppedBase64: string) => Promise<void>;
  onClose: () => void;
}

/**
 * Crop the image to the given pixel area and return as base64 JPEG.
 */
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
    image.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return canvas.toDataURL("image/jpeg", 0.92);
}

export default function CropModal({ imageUrl, onCrop, onClose }: CropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [cropError, setCropError] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsSaving(true);
    setCropError(null);
    try {
      const croppedBase64 = await getCroppedImg(imageUrl, croppedAreaPixels);
      await onCrop(croppedBase64);
    } catch {
      setCropError("Erreur lors du recadrage. Réessayez.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-foreground/5">
          <h2 className="text-sm font-semibold text-foreground">Recadrer la photo</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-foreground/5 transition-colors text-muted"
            aria-label="Fermer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Crop area */}
        <div className="relative w-full h-[50vh] sm:h-[60vh]">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={undefined}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            minZoom={1}
            maxZoom={3}
            style={{
              containerStyle: { background: "#1C1C1E" },
            }}
          />
        </div>

        {/* Zoom slider */}
        <div className="px-5 py-3 flex items-center gap-3">
          <span className="text-xs text-muted font-light">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-sage h-1"
          />
          <span className="text-xs text-muted font-light w-8 text-right">{Math.round(zoom * 100)}%</span>
        </div>

        {/* Error feedback */}
        {cropError && (
          <p className="text-xs text-red-500 font-light px-5 py-1">{cropError}</p>
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
            disabled={isSaving}
            className="text-xs bg-sage text-white px-5 min-h-[44px] py-2 rounded-full font-medium hover:bg-sage/85 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50"
          >
            {isSaving ? "Recadrage..." : "Appliquer le recadrage"}
          </button>
        </div>
      </div>
    </div>
  );
}
