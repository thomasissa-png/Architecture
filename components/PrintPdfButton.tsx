"use client";

/**
 * PrintPdfButton — Triggers browser print dialog to export as PDF.
 *
 * Sets the document title before printing so the browser suggests
 * a meaningful filename (e.g. "Appartement-Bordeaux-versimo.pdf").
 * Restores the original title after printing.
 *
 * Also waits for all images to load before triggering print
 * to avoid blank images in the PDF.
 */

import { useState, useCallback } from "react";

interface PrintPdfButtonProps {
  /** Title used for the PDF filename */
  title: string;
  /** Fallback PDF URL (legacy pdf-lib endpoint) */
  fallbackPdfUrl: string;
}

export default function PrintPdfButton({
  title,
  fallbackPdfUrl,
}: PrintPdfButtonProps) {
  const [isPreparing, setIsPreparing] = useState(false);

  const handlePrint = useCallback(async () => {
    setIsPreparing(true);

    // Wait for all print-view images to finish loading
    const printImages = document.querySelectorAll<HTMLImageElement>(".print-only img");
    const loadPromises = Array.from(printImages).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve(); // Don't block print if an image fails
      });
    });

    try {
      await Promise.all(loadPromises);
    } catch {
      // Proceed even if image loading fails
    }

    // Set document title to control the suggested PDF filename
    const originalTitle = document.title;
    const safeName = title
      .replace(/[^a-zA-Z0-9\u00C0-\u024F\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    document.title = `${safeName}-versimo`;

    // Small delay to let the browser update the title
    await new Promise((resolve) => setTimeout(resolve, 100));

    setIsPreparing(false);
    window.print();

    // Restore original title after print dialog closes
    // Use a timeout because window.print() blocks on some browsers
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  }, [title]);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handlePrint}
        disabled={isPreparing}
        className="inline-flex items-center gap-2 border border-foreground/20 text-foreground/60 px-5 py-2.5 rounded-xl font-light text-xs hover:border-foreground/40 hover:text-foreground/80 transition-colors disabled:opacity-50 disabled:cursor-wait"
        data-testid="dossier-print-pdf"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {isPreparing ? "Préparation..." : "Télécharger le PDF"}
      </button>
      <a
        href={fallbackPdfUrl}
        className="text-[10px] text-muted/40 hover:text-muted/60 transition-colors no-print"
      >
        Version simplifiée (sans images HD)
      </a>
    </div>
  );
}
