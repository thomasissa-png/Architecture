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
    <div className="space-y-4">
      <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200">
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
            <div className="flex flex-col items-center">
              <div className="w-1 h-full bg-white shadow-lg" />
              <div className="absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                  />
                </svg>
              </div>
            </div>
          }
        />
        <div className="flex justify-between px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500">
          <span>Avant</span>
          <span>Après</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={handleDownload}
          className="inline-flex items-center justify-center gap-2 bg-sage text-white px-6 py-3 rounded-lg font-medium hover:bg-sage-dark transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Télécharger l&apos;image HD
        </button>
      </div>

      {model && (
        <p className="text-center text-xs text-gray-400">
          Généré avec {model}
        </p>
      )}
    </div>
  );
}
