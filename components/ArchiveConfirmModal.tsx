"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/lib/hooks/useScrollLock";

interface ArchiveConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  propertyLabel?: string;
  isLoading?: boolean;
}

export default function ArchiveConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  propertyLabel,
  isLoading = false,
}: ArchiveConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus le bouton d'annulation à l'ouverture — pattern sécuritaire pour les actions destructives
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        // Focus sur Annuler plutôt que Archiver : évite les confirmations accidentelles
        const cancelBtn = modalRef.current?.querySelector<HTMLButtonElement>(
          "button[data-cancel]"
        );
        cancelBtn?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Focus trap + ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const modal = modalRef.current;
        if (!modal) return;

        const focusable = modal.querySelectorAll<HTMLElement>(
          "button:not([disabled]), [tabindex]:not([tabindex=\"-1\"])"
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  // Lock scroll iOS-safe
  useScrollLock(isOpen);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-modal-title"
      aria-describedby="archive-modal-desc"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={isLoading ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Panneau */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md mx-4 bg-background rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-200/60 animate-fade-in-up"
        style={{ animationDuration: "280ms" }}
      >
        <div className="p-6 sm:p-8">

          {/* Icône + Titre */}
          <div className="flex items-start gap-4 mb-5">
            {/* Icône archive — neutre, ton sage */}
            <div className="shrink-0 w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-sage"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-.375c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v.375c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <h2
                id="archive-modal-title"
                className="text-base font-semibold text-foreground tracking-tight"
              >
                Archiver ce bien
              </h2>
              <p
                id="archive-modal-desc"
                className="mt-1 text-sm text-muted font-light leading-relaxed"
              >
                {propertyLabel ? (
                  <>
                    <span className="font-medium text-foreground/80">
                      {propertyLabel}
                    </span>{" "}
                    sera archivé et retiré de votre liste active.
                  </>
                ) : (
                  "Ce bien sera archivé et retiré de votre liste active."
                )}
                <br />
                Vous pourrez le retrouver dans vos archives à tout moment.
              </p>
            </div>
          </div>

          {/* Séparateur */}
          <div className="border-t border-gray-200/60 mb-5" aria-hidden="true" />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              data-cancel
              onClick={onClose}
              disabled={isLoading}
              className="px-5 min-h-[44px] py-2.5 rounded-full text-sm font-medium text-muted border border-gray-300 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Annuler
            </button>

            <button
              ref={confirmButtonRef}
              onClick={onConfirm}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 min-h-[44px] py-2.5 rounded-full text-sm font-medium bg-foreground text-background hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Archivage...
                </>
              ) : (
                <>
                  Archiver
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-.375c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v.375c0 .621.504 1.125 1.125 1.125z"
                    />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
