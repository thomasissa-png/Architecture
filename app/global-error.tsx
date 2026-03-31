"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="antialiased bg-[#FAFAF8] text-[#1C1C1E]">
        <div className="min-h-screen flex items-center justify-center px-5">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold tracking-tight mb-3">
              Une erreur est survenue
            </h1>
            <p className="text-sm text-[#6B6B6E] font-light mb-6">
              Nous avons été notifiés automatiquement. Vous pouvez réessayer ou revenir à l&apos;accueil.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={reset}
                className="bg-[#1C1C1E] text-[#FAFAF8] px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#1C1C1E]/85 transition-colors"
              >
                Réessayer
              </button>
              <a
                href="/"
                className="border border-[#1C1C1E]/15 text-[#1C1C1E] px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#1C1C1E]/5 transition-colors"
              >
                Accueil
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
