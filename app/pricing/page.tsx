"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AuthButton from "@/components/AuthButton";
import AuthModal from "@/components/AuthModal";
import Footer from "@/components/Footer";

interface PackFeature {
  text: string;
  active: boolean;
  sub?: boolean;
}

interface Pack {
  id: string;
  name: string;
  credits: number;
  price: string;
  perPhoto: string;
  features: PackFeature[];
  cta: string;
  highlight: boolean;
  note?: string;
  personaLine: string;
  roiNote?: string;
}

const PACKS: Pack[] = [
  {
    id: "decouverte",
    name: "Découverte",
    credits: 5,
    price: "4,90",
    perPhoto: "0,98",
    features: [
      { text: "12 styles disponibles", active: true },
      { text: "Téléchargement HD", active: true },
      { text: "Partage & comparateur", active: true },
      { text: "Itérations", active: false },
    ],
    cta: "Acheter",
    highlight: false,
    note: "3 générations offertes sans CB",
    personaLine: "Ce pack est fait pour vous si vous découvrez le home staging virtuel et voulez tester sur vos premières photos.",
  },
  {
    id: "starter",
    name: "Starter",
    credits: 20,
    price: "14,90",
    perPhoto: "0,75",
    features: [
      { text: "12 styles + mode personnalisé", active: true },
      { text: "1 itération par photo", active: true },
      { text: "Lien partageable 7 jours", active: true },
      { text: "Mode Pro", active: false },
    ],
    cta: "Acheter",
    highlight: false,
    personaLine: "Ce pack est fait pour vous si vous avez un projet en cours et voulez tester plusieurs styles avec des itérations.",
  },
  {
    id: "pro",
    name: "Pro",
    credits: 50,
    price: "29",
    perPhoto: "0,58",
    features: [
      { text: "3 itérations par photo", active: true },
      { text: "Mode Pro", active: true },
      { text: "Dossiers de pré-commercialisation", active: true, sub: true },
      { text: "Liens partageables sans limite", active: true, sub: true },
    ],
    cta: "S'abonner",
    highlight: true,
    personaLine: "Pour les architectes, marchands de biens et agences qui gèrent plusieurs projets par an.",
    roiNote: "29\u00A0€/mois au lieu de 200-500\u00A0€ chez un home stager",
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
        "Veuillez accepter la clause de r\u00e9tractation avant de continuer."
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
                Paiement annulé. Vous pouvez réessayer à tout moment.
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-8 bg-red-50/50 border border-red-200/60 rounded-2xl p-5 text-center max-w-xl mx-auto">
              <p className="text-red-600/80 text-sm font-light">{error}</p>
            </div>
          )}

          {/* CTA gratuit bandeau */}
          <div className="bg-sage/8 border border-sage/20 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 max-w-2xl mx-auto">
            <p className="text-sm text-foreground font-light text-center sm:text-left">
              Essayez avec <strong className="font-semibold">3 photos gratuites</strong> &mdash; sans carte bancaire
            </p>
            <a
              href="/#outil"
              className="flex-shrink-0 inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium hover:bg-foreground/85 active:scale-[0.99] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            >
              Essayer l&apos;outil
            </a>
          </div>

          {/* Packs grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto items-stretch">
            {PACKS.map((pack) => (
              <div
                key={pack.id}
                className={`rounded-2xl p-7 text-center bg-background relative flex flex-col transition-colors ${
                  pack.highlight
                    ? "border-2 border-sage/30 shadow-[0_8px_32px_rgba(125,155,118,0.12)]"
                    : "border border-foreground/10 hover:border-foreground/15"
                }`}
              >
                {pack.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-foreground text-background text-[11px] font-semibold px-4 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Recommand&eacute;
                  </span>
                )}
                <p className={`text-xs font-medium uppercase tracking-widest mb-3 ${pack.highlight ? "text-sage" : "text-muted"}`}>
                  {pack.name}
                </p>
                <p className="text-4xl font-bold text-foreground mb-0.5">
                  {pack.price}&euro;
                </p>
                <p className="text-xs text-muted font-light mb-1">
                  {pack.credits} cr&eacute;dits &middot; {pack.perPhoto}&euro;/photo
                </p>
                <p className={`text-[11px] text-muted/60 font-light ${pack.roiNote ? "mb-2" : "mb-6"}`}>
                  TTC &middot; TVA 20% incluse
                </p>
                {pack.roiNote && (
                  <p className="text-xs text-sage font-medium mb-6">{pack.roiNote}</p>
                )}
                <ul className="text-sm text-muted font-light space-y-2.5 text-left mb-4 flex-1">
                  {pack.features.map((f) => (
                    <li
                      key={f.text}
                      className={`flex items-start gap-2.5 ${!f.active ? "opacity-40 line-through" : ""} ${f.sub ? "pl-6" : ""}`}
                    >
                      <svg
                        className={`flex-shrink-0 mt-0.5 ${f.sub ? "w-3.5 h-3.5" : "w-4 h-4"} ${f.active ? (f.sub ? "text-sage/70" : "text-sage") : "text-muted/30"}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d={f.active ? "M5 13l4 4L19 7" : "M18 12H6"}
                        />
                      </svg>
                      {f.sub ? (
                        <span className="text-xs">{f.text}</span>
                      ) : f.text === "Mode Pro" && f.active ? (
                        <span><strong className="font-medium text-foreground">Mode Pro</strong></span>
                      ) : (
                        f.text
                      )}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted/70 font-light italic mb-4 text-left">
                  {pack.personaLine}
                </p>
                {pack.note && (
                  <p className="text-xs text-sage font-medium mb-4">{pack.note}</p>
                )}
                <button
                  onClick={() => handleBuy(pack.id)}
                  disabled={loadingPack !== null}
                  className={`mt-auto w-full px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                    pack.highlight
                      ? "bg-foreground text-background hover:bg-foreground/85 font-semibold shadow-sm"
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
                J&apos;accepte que l&apos;exécution du service numérique
                commence immédiatement et renonce expressément à mon droit de
                rétractation de 14 jours conformément à l&apos;article L.
                221-28 du Code de la consommation.
              </span>
            </label>
          </div>

          {/* Free trial note */}
          <p className="text-center text-[11px] text-muted font-light mt-8">
            3 g&eacute;n&eacute;rations offertes sans carte bancaire &middot; TVA r&eacute;cup&eacute;rable
            pour les professionnels assujettis.
          </p>
        </div>
      </section>

      <Footer currentPage="/pricing" />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => { setAuthModalOpen(false); setPendingPackId(null); }}
        callbackUrl={pendingPackId ? `/pricing?buy=${pendingPackId}` : "/pricing"}
      />
    </div>
  );
}
