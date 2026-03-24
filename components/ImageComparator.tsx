"use client";

import { useState, useEffect } from "react";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";

interface ImageComparatorProps {
  originalUrl: string;
  generatedUrl: string;
  model?: string;
}

/**
 * Converts a base64 data URI to a Blob.
 */
function dataUriToBlob(dataUri: string): Blob {
  const [meta, b64] = dataUri.split(",");
  const mime = meta.match(/:(.*?);/)?.[1] || "image/png";
  const bytes = atob(b64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export default function ImageComparator({
  originalUrl,
  generatedUrl,
  model,
}: ImageComparatorProps) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  // Avoid hydration mismatch: check navigator.share on client only
  useEffect(() => {
    setCanShare(!!navigator.share);
  }, []);

  const handleDownload = () => {
    // Convert base64 to blob URL for reliable cross-browser download
    const blob = dataUriToBlob(generatedUrl);
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `visirenov-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Revoke after a short delay to ensure download starts
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      const blob = dataUriToBlob(generatedUrl);
      const file = new File([blob], "visirenov.png", { type: "image/png" });
      await navigator.share({
        title: "Mon visuel VisiR\u00e9nov",
        text: "D\u00e9couvrez cette visualisation d\u2019int\u00e9rieur g\u00e9n\u00e9r\u00e9e par IA",
        files: [file],
      });
    } catch {
      // User cancelled or share failed
    }
  };

  const handleCopyImage = async () => {
    try {
      const blob = dataUriToBlob(generatedUrl);
      // Ensure correct MIME for clipboard
      const pngBlob = new Blob([blob], { type: "image/png" });
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": pngBlob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available — show feedback anyway
      setCopied(false);
    }
  };

  const handleWhatsApp = async () => {
    const blob = dataUriToBlob(generatedUrl);
    const file = new File([blob], "visirenov.png", { type: "image/png" });

    // Mobile: navigator.share with files sends the image directly via WhatsApp
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          text: "D\u00e9couvre ce visuel d\u2019int\u00e9rieur g\u00e9n\u00e9r\u00e9 par VisiR\u00e9nov \ud83c\udfe0",
          files: [file],
        });
        return;
      } catch {
        // User cancelled — fall through to desktop fallback
      }
    }

    // Desktop fallback: copy image to clipboard, then open WhatsApp Web
    try {
      const pngBlob = new Blob([blob], { type: "image/png" });
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": pngBlob }),
      ]);
    } catch {
      // Clipboard not available — proceed anyway
    }
    const text = encodeURIComponent(
      "D\u00e9couvre ce visuel d\u2019int\u00e9rieur g\u00e9n\u00e9r\u00e9 par VisiR\u00e9nov \ud83c\udfe0 \u2014 visirenov.fr"
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener");
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl overflow-hidden border border-gray-200/80">
        <ReactCompareSlider
          itemOne={
            <ReactCompareSliderImage
              src={originalUrl}
              alt="Avant \u2014 Photo originale"
            />
          }
          itemTwo={
            <ReactCompareSliderImage
              src={generatedUrl}
              alt="Apr\u00e8s \u2014 Visualisation IA"
            />
          }
          className="aspect-[4/3] sm:aspect-[16/10]"
          style={{ width: "100%" }}
          handle={
            <div className="flex flex-col items-center h-full" role="slider" aria-label="Comparer avant et apr\u00e8s" aria-valuemin={0} aria-valuemax={100} aria-valuenow={50}>
              <div className="w-px h-full bg-white/80" />
              <div className="absolute top-1/2 -translate-y-1/2 w-11 h-11 sm:w-9 sm:h-9 bg-white rounded-full shadow-md flex items-center justify-center">
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
            Apr\u00e8s
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {/* Download */}
        <button
          onClick={handleDownload}
          aria-label="T\u00e9l\u00e9charger l'image g\u00e9n\u00e9r\u00e9e"
          className="inline-flex items-center gap-2 bg-foreground text-background px-5 min-h-[44px] py-3 sm:py-2.5 rounded-full text-sm font-medium hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          T&eacute;l&eacute;charger HD
        </button>

        {/* Copy */}
        <button
          onClick={handleCopyImage}
          aria-label="Copier l'image"
          className="inline-flex items-center gap-2 border border-gray-300 text-muted px-4 min-h-[44px] py-3 sm:py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Copi&eacute;
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
              </svg>
              Copier
            </>
          )}
        </button>

        {/* WhatsApp */}
        <button
          onClick={handleWhatsApp}
          aria-label="Partager sur WhatsApp"
          className="inline-flex items-center gap-2 border border-gray-300 text-muted px-4 min-h-[44px] py-3 sm:py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          WhatsApp
        </button>

        {/* Native Share (mobile) — rendered client-side only */}
        {canShare && (
          <button
            onClick={handleNativeShare}
            aria-label="Partager"
            className="inline-flex items-center gap-2 border border-gray-300 text-muted px-4 min-h-[44px] py-3 sm:py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
            Partager
          </button>
        )}
      </div>

      {model && (
        <p className="text-center text-[10px] text-muted/70 font-light">
          G&eacute;n&eacute;r&eacute; avec {model}
        </p>
      )}
    </div>
  );
}
