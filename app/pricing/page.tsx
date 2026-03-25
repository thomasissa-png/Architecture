"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AuthButton from "@/components/AuthButton";
import AuthModal from "@/components/AuthModal";

const PACKS = [
  {
    id: "decouverte",
    name: "Decouverte",
    credits: 5,
    price: "4,90",
    perPhoto: "0,98",
    features: ["12 styles disponibles", "Telechargement HD"],
    cta: "Acheter",
    highlight: false,
  },
  {
    id: "starter",
    name: "Starter",
    credits: 20,
    price: "14,90",
    perPhoto: "0,75",
    features: ["1 iteration par photo", "Lien partageable 7 jours"],
    cta: "Acheter",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    credits: 50,
    price: "29",
    perPhoto: "0,58",
    features: [
      "3 iterations par photo",
      "Mode Marchand — dossiers PDF",
      "Annonces immobilieres",
      "Lien partageable 30 jours",
    ],
    cta: "Acheter",
    highlight: true,
  },
  {
    id: "studio",
    name: "Studio",
    credits: 150,
    price: "69",
    perPhoto: "0,46",
    features: [
      "5 iterations par photo",
      "Mode Marchand — 15 photos/dossier",
      "Annonces immobilieres illimitees",
      "Lien partageable 90 jours + support dedie",
    ],
    cta: "Acheter",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}

function PricingContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retractationAccepted, setRetractationAccepted] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingPackId, setPendingPackId] = useState<string | null>(null);
  const [checkboxError, setCheckboxError] = useState(false);
  const retractationRef = useRef<HTMLLabelElement>(null);

  const checkoutCancelled = searchParams.get("checkout") === "cancelled";

  // Auto-buy after login redirect with ?buy=xxx
  useEffect(() => {
    const buyParam = searchParams.get("buy");
    if (buyParam && session?.user?.id && retractationAccepted) {
      handleBuy(buyParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, searchParams, retractationAccepted]);

  async function handleBuy(packId: string) {
    if (!session?.user?.id) {
      setPendingPackId(packId);
      setAuthModalOpen(true);
      return;
    }

    if (!retractationAccepted) {
      setError(
        "Veuillez accepter la clause de retractation avant de continuer."
      );
      setCheckboxError(true);
      retractationRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setCheckboxError(false), 3000);
      return;
    }

    setLoadingPack(packId);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId, retractationAccepted }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors du paiement.");
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors du paiement."
      );
      setLoadingPack(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/5">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
          <a
            href="/"
            className="text-xl font-semibold text-foreground tracking-tighter"
          >
            Versiroom
          </a>
          <nav className="flex items-center gap-4 sm:gap-6">
            <a
              href="/#outil"
              className="text-xs text-muted font-light hover:text-foreground transition-colors"
            >
              Essayer
            </a>
            <AuthButton />
          </nav>
        </div>
      </header>

      {/* Content */}
      <section className="pt-28 sm:pt-32 pb-20 sm:pb-32 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
              Tarifs simples et transparents
            </h1>
            <p className="text-muted font-light">
              Sans abonnement. Sans engagement.
            </p>
          </div>

          {/* Checkout cancelled message */}
          {checkoutCancelled && (
            <div className="mb-8 bg-amber-50/50 border border-amber-200/60 rounded-2xl p-5 text-center max-w-xl mx-auto">
              <p className="text-amber-700/90 text-sm font-light">
                Paiement annule. Vous pouvez reessayer a tout moment.
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-8 bg-red-50/50 border border-red-200/60 rounded-2xl p-5 text-center max-w-xl mx-auto">
              <p className="text-red-600/80 text-sm font-light">{error}</p>
            </div>
          )}

          {/* Packs grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {PACKS.map((pack) => (
              <div
                key={pack.id}
                className={`rounded-2xl p-6 text-center bg-background relative ${
                  pack.highlight
                    ? "border-2 border-foreground"
                    : "border border-foreground/10"
                }`}
              >
                {pack.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background text-[11px] font-medium px-3 py-1 rounded-full uppercase tracking-wider">
                    Recommande
                  </span>
                )}
                <p className="text-xs text-muted font-medium uppercase tracking-widest mb-3">
                  {pack.name}
                </p>
                <p className="text-3xl font-bold text-foreground mb-0.5">
                  {pack.price}&euro;
                </p>
                <p className="text-xs text-muted font-light mb-1">
                  {pack.credits} credits &middot; {pack.perPhoto}&euro;/photo
                </p>
                <p className="text-[11px] text-muted font-light mb-5">
                  TTC &middot; TVA 20% incluse
                </p>
                <ul className="text-sm text-muted font-light space-y-2 text-left mb-6">
                  {pack.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-sage flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleBuy(pack.id)}
                  disabled={loadingPack !== null}
                  className={`w-full px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                    pack.highlight
                      ? "bg-foreground text-background hover:bg-foreground/85"
                      : "border border-foreground/10 text-foreground hover:bg-foreground/5"
                  }`}
                >
                  {loadingPack === pack.id ? (
                    <span className="inline-flex items-center gap-2">
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
                      Redirection...
                    </span>
                  ) : (
                    pack.cta
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Retractation checkbox */}
          <div className="max-w-xl mx-auto mt-10">
            <label ref={retractationRef} className={`flex items-start gap-3 cursor-pointer group rounded-xl p-3 -m-3 transition-colors ${checkboxError ? "border border-red-400 bg-red-50/50" : "border border-transparent"}`}>
              <input
                type="checkbox"
                checked={retractationAccepted}
                onChange={(e) => {
                  setRetractationAccepted(e.target.checked);
                  if (e.target.checked) { setError(null); setCheckboxError(false); }
                }}
                className="mt-0.5 w-4 h-4 rounded border-foreground/20 text-sage focus:ring-sage/50 cursor-pointer"
              />
              <span className="text-xs text-muted font-light leading-relaxed group-hover:text-foreground/70 transition-colors">
                J&apos;accepte que l&apos;ex{"\u00E9"}cution du service num{"\u00E9"}rique
                commence imm{"\u00E9"}diatement et renonce express{"\u00E9"}ment {"\u00E0"} mon droit de
                r{"\u00E9"}tractation de 14 jours conform{"\u00E9"}ment {"\u00E0"} l&apos;article L.
                221-28 du Code de la consommation.
              </span>
            </label>
          </div>

          {/* Free trial note */}
          <p className="text-center text-[11px] text-muted font-light mt-8">
            3 generations offertes sans carte bancaire &middot; TVA recuperable
            pour les professionnels assujettis.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-foreground/5 py-10 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted font-light">
          <div>
            <p>Pour les architectes, marchands de biens et particuliers</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <a href="/" className="hover:text-foreground transition-colors py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 rounded">
              Accueil
            </a>
            <a
              href="/mentions-legales"
              className="hover:text-foreground transition-colors py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 rounded"
            >
              Mentions legales
            </a>
            <a
              href="/cgv"
              className="hover:text-foreground transition-colors py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 rounded"
            >
              CGV
            </a>
            <a
              href="/confidentialite"
              className="hover:text-foreground transition-colors py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 rounded"
            >
              Confidentialite
            </a>
            <span>&copy; Versiroom 2026</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => { setAuthModalOpen(false); setPendingPackId(null); }}
        callbackUrl={pendingPackId ? `/pricing?buy=${pendingPackId}` : "/pricing"}
      />
    </div>
  );
}
