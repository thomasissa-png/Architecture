"use client";

/**
 * PrintPdfButton — Downloads the pre-generated PDF if available,
 * otherwise falls back to browser print dialog.
 */

import { useState, useCallback } from "react";

interface PrintPdfButtonProps {
  /** Title used for the PDF filename */
  title: string;
  /** UUID of the dossier for direct PDF download */
  dossierUuid: string;
  /** Whether a pre-generated PDF exists in storage */
  hasPdf: boolean;
}

export default function PrintPdfButton({
  title,
  dossierUuid,
  hasPdf,
}: PrintPdfButtonProps) {
  const [isPreparing, setIsPreparing] = useState(false);

  const handleDownload = useCallback(async () => {
    if (hasPdf) {
      // Direct download of pre-generated PDF
      window.open(`/api/dossier/${dossierUuid}/pdf`, "_blank");
      return;
    }

    // Fallback: browser print dialog
    setIsPreparing(true);

    const printImages = document.querySelectorAll<HTMLImageElement>(".print-only img");
    const loadPromises = Array.from(printImages).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    });

    try {
      await Promise.all(loadPromises);
    } catch {
      // Proceed even if image loading fails
    }

    const originalTitle = document.title;
    const safeName = title
      .replace(/[^a-zA-Z0-9\u00C0-\u024F\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    document.title = `${safeName}-versimo`;

    await new Promise((resolve) => setTimeout(resolve, 100));

    setIsPreparing(false);
    window.print();

    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  }, [title, dossierUuid, hasPdf]);

  return (
    <button
      onClick={handleDownload}
      disabled={isPreparing}
      className="inline-flex items-center gap-2 border border-foreground/20 text-foreground/60 px-5 py-2.5 rounded-xl font-light text-xs hover:border-foreground/40 hover:text-foreground/80 transition-colors disabled:opacity-50 disabled:cursor-wait"
      data-testid="dossier-print-pdf"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {isPreparing ? "Préparation..." : "Télécharger le PDF"}
    </button>
  );
}
