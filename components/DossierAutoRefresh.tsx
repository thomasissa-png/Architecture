"use client";

/**
 * BUG-5 fix: Auto-refresh component for dossier pages in "generating" or "draft" status.
 * Refreshes the page every 5 seconds until generation is complete.
 */

import { useEffect, useState } from "react";

export default function DossierAutoRefresh({ dossierUuid }: { dossierUuid: string }) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    // Animate dots
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    // Auto-refresh every 5 seconds
    const refreshInterval = setInterval(() => {
      window.location.reload();
    }, 5000);

    return () => {
      clearInterval(dotInterval);
      clearInterval(refreshInterval);
    };
  }, [dossierUuid]);

  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center gap-2 text-sage">
        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm font-light">Génération en cours{dots}</span>
      </div>
      <p className="text-xs text-muted/50 mt-2">Cette page se rafraîchit automatiquement.</p>
    </div>
  );
}
