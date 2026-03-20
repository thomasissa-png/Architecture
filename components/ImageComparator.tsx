"use client";

import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";

interface ImageComparatorProps {
  originalUrl: string;
  generatedUrl: string;
  model?: string;
}

export default function ImageComparator({
  originalUrl,
  generatedUrl,
  model,
}: ImageComparatorProps) {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = generatedUrl;
    link.download = `visirenov-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl overflow-hidden border border-gray-200/80">
        <ReactCompareSlider
          itemOne={
            <ReactCompareSliderImage
              src={originalUrl}
              alt="Avant — Photo originale"
            />
          }
          itemTwo={
            <ReactCompareSliderImage
              src={generatedUrl}
              alt="Après — Visualisation IA"
            />
          }
          style={{ width: "100%", height: "auto", aspectRatio: "16/10" }}
          handle={
            <div className="flex flex-col items-center h-full">
              <div className="w-px h-full bg-white/80" />
              <div className="absolute top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center">
                <svg className="w-4 h-4 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                </svg>
              </div>
            </div>
          }
        />
        <div className="flex justify-between px-5 py-2.5 bg-gray-50/50">
          <span className="text-[10px] font-medium text-muted uppercase tracking-widest">
            Avant
          </span>
          <span className="text-[10px] font-medium text-muted uppercase tracking-widest">
            Après
          </span>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleDownload}
          aria-label="Télécharger l'image générée"
          className="inline-flex items-center justify-center gap-2.5 bg-foreground text-background px-6 py-3 rounded-full text-sm font-medium hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Télécharger HD
        </button>
      </div>

      {model && (
        <p className="text-center text-[10px] text-muted/40 font-light">
          Généré avec {model}
        </p>
      )}
    </div>
  );
}
