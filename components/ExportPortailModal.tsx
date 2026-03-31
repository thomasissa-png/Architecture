"use client";

/**
 * ExportPortailModal — Wraps ExportPortail in a modal dialog.
 *
 * Renders a trigger button "Exporter pour un portail" that opens a fullscreen
 * modal containing the ExportPortail component. Prevents the export UI from
 * overlapping inline page content (P0-4 fix).
 */

import { useState, useEffect, useCallback } from "react";
import { useScrollLock } from "@/lib/hooks/useScrollLock";
import ExportPortail from "@/components/ExportPortail";

interface ExportPortailModalProps {
  /** All props forwarded to ExportPortail */
  title: string;
  description: string;
  surface: number | null;
  roomCount: number | null;
  price: number | null;
  city: string;
  propertyType: string;
  isCopro: boolean;
  coproLots?: number | null;
  coproChargesAnnuelles?: number | null;
  dpeClasse?: string | null;
  gesClasse?: string | null;
  photos: {
    id: string;
    outputImageKey: string;
    roomType: string;
    roomLabel: string;
  }[];
  annonceUuid: string;
  merchantName?: string | null;
  merchantPhone?: string | null;
}

export default function ExportPortailModal(props: ExportPortailModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Prevent body scroll when modal is open
  useScrollLock(isOpen);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 text-xs bg-foreground text-background px-5 py-3 rounded-full font-medium hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 min-h-[44px]"
        data-testid="export-portail-trigger"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        Exporter pour un portail
      </button>

      {/* Modal backdrop + content */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Exporter votre annonce"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Modal panel */}
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-y-auto animate-fade-in-up">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-foreground/5 px-5 sm:px-6 py-4 flex items-center justify-between">
              <h2 className="text-sm font-medium text-foreground">
                Exporter votre annonce
              </h2>
              <button
                onClick={handleClose}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-foreground/5 text-foreground/60 hover:bg-foreground/10 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 min-h-[44px] min-w-[44px]"
                aria-label="Fermer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content — ExportPortail rendered inside the modal */}
            <div className="px-5 sm:px-6 pb-6">
              <ExportPortail {...props} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
