"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/lib/hooks/useScrollLock";

interface RefineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
  iterationsRemaining: number;
  isLoading: boolean;
  warnings?: string[];
}

export default function RefineModal({
  isOpen,
  onClose,
  onSubmit,
  iterationsRemaining,
  isLoading,
  warnings = [],
}: RefineModalProps) {
  const [comment, setComment] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the modal is rendered
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setComment("");
    }
  }, [isOpen]);

  // Focus trap
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

        const focusableElements = modal.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl?.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  // Prevent body scroll when modal is open — preserve scroll position
  useScrollLock(isOpen);

  const handleSubmit = useCallback(() => {
    const trimmed = comment.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
  }, [comment, isLoading, onSubmit]);

  const handleKeyDownTextarea = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Cmd/Ctrl + Enter to submit
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  if (!isOpen) return null;

  const canSubmit = comment.trim().length > 0 && !isLoading;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="refine-modal-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={isLoading ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-lg bg-background rounded-2xl shadow-xl border border-gray-200/60 animate-fade-in-up max-h-[90vh] overflow-y-auto"
        style={{ animationDuration: "300ms" }}
      >
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <h2
              id="refine-modal-title"
              className="text-lg font-semibold text-foreground tracking-tight"
            >
              Affiner le résultat
            </h2>
            <button
              onClick={onClose}
              disabled={isLoading}
              aria-label="Fermer"
              className="p-1.5 -m-1.5 text-muted hover:text-foreground transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Description */}
          <label
            htmlFor="refine-comment"
            className="block text-sm text-muted font-light mb-2"
          >
            Décrivez votre ajustement :
          </label>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            id="refine-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={handleKeyDownTextarea}
            placeholder="Ex : canapé anthracite, tapis berbère, moins de plantes"
            disabled={isLoading}
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 rounded-xl border border-gray-200/80 bg-white text-sm text-foreground placeholder:text-muted/50 font-light resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage/30 disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Info message */}
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted/70 font-light flex items-start gap-1.5">
              <svg
                className="w-3.5 h-3.5 mt-0.5 shrink-0 text-sage"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Le style et les surfaces ne changent pas
            </p>
            <p className="text-xs text-muted/70 font-light flex items-start gap-1.5">
              <svg
                className="w-3.5 h-3.5 mt-0.5 shrink-0 text-sage"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              Soyez précis (couleur, matière, dimensions)
            </p>
          </div>

          {/* Warnings from pre-processing */}
          {warnings.length > 0 && (
            <div className="mt-3 bg-amber-50/50 border border-amber-200/60 rounded-xl p-3">
              <ul className="space-y-1">
                {warnings.map((w, i) => (
                  <li
                    key={i}
                    className="text-amber-600/80 text-xs font-light flex items-start gap-1.5"
                  >
                    <span className="mt-0.5 shrink-0">!</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Iteration cost notice */}
          <p className="mt-4 text-xs text-muted/60 font-light text-center">
            Affinage gratuit ({iterationsRemaining} restant{iterationsRemaining > 1 ? "s" : ""} sur 3)
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-5">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-5 min-h-[44px] py-2.5 rounded-full text-sm font-medium text-muted border border-gray-300 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 px-5 min-h-[44px] py-2.5 rounded-full text-sm font-medium bg-foreground text-background hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
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
                  Traitement...
                </>
              ) : (
                <>
                  Générer l&apos;ajustement
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
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
