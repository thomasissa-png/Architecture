"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
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
    credits: 2,
    price: "0",
    perPhoto: "0",
    features: [
      { text: "12 styles disponibles", active: true },
      { text: "Téléchargement HD", active: true },
      { text: "Partage & comparateur", active: true },
      { text: "Itérations (ajuster le résultat)", active: false },
      { text: "Mode Pro (dossiers, PDF, annonces)", active: false },
    ],
    cta: "Essayer",
    highlight: false,
    note: "Sans carte bancaire",
    personaLine: "Testez la qualité Versimo sur vos propres photos. 2 visuels offerts.",
  },
  {
    id: "starter",
    name: "Starter",
    credits: 15,
    price: "9,90",
    perPhoto: "0,66",
    features: [
      { text: "12 styles + mode personnalisé", active: true },
      { text: "1 itération par photo", active: true },
      { text: "Historique des visuels", active: true },
      { text: "Visuels sans expiration", active: true },
      { text: "Recharge : +10 visuels à 5,90 €", active: true },
      { text: "Mode Pro", active: false },
    ],
    cta: "Acheter",
    highlight: false,
    personaLine: "Achat unique — vos visuels n'expirent pas. Idéal pour un projet ponctuel de décoration ou un bien isolé à valoriser.",
  },
  {
    id: "pro",
    name: "Pro",
    credits: 50,
    price: "29",
    perPhoto: "0,58",
    features: [
      { text: "3 itérations par photo", active: true },
      { text: "Mode Pro complet", active: true },
      { text: "Planches d'ambiance pour présentations client", active: true },
      { text: "Dossiers de pré-commercialisation", active: true },
      { text: "PDF brandé avec votre logo", active: true },
      { text: "Annonces & liens partageables illimités", active: true },
      { text: "Sans engagement — résiliable en 1 clic", active: true },
      { text: "Recharge : +20 visuels à 9 €", active: true },
    ],
    cta: "S'abonner",
    highlight: true,
    personaLine: "Pour les marchands de biens, architectes multi-projets et agences.",
    roiNote: "8 biens × 5 photos × 300 €/planche = 12 000 €/an chez un home stager. Versimo Pro : 348 €/an.",
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
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingPackId, setPendingPackId] = useState<string | null>(null);

  const checkoutCancelled = searchParams.get("checkout") === "cancelled";

  // Auto-buy after login redirect with ?buy=xxx
  useEffect(() => {
    const buyParam = searchParams.get("buy");
    if (buyParam && session?.user?.id) {
      handleBuy(buyParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, searchParams]);

  async function handleBuy(packId: string) {
    if (!session?.user?.id) {
      setPendingPackId(packId);
      setAuthModalOpen(true);
      return;
    }

    setLoadingPack(packId);
    setError(null);
    const stripeTab = window.open("about:blank", "_blank");

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors du paiement.");
      }

      const data = await res.json();
      if (data.url) {
        if (stripeTab) { stripeTab.location.href = data.url; } else { window.location.href = data.url; }
      }
    } catch (err) {
      if (stripeTab) stripeTab.close();
      setError(
        err instanceof Error ? err.message : "Erreur lors du paiement."
      );
      setLoadingPack(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header role="banner" className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/5">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
          <a
            href="/"
            className="text-xl font-semibold text-foreground tracking-tighter focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded-sm"
          >
            Versimo
          </a>
          <nav aria-label="Navigation principale" className="flex items-center gap-4 sm:gap-6">
            <a
              href="/#outil"
              className="text-xs text-muted font-light hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded-sm"
            >
              Essayer
            </a>
            <AuthButton />
          </nav>
        </div>
      </header>

      {/* Content */}
      <section className="pt-28 sm:pt-32 pb-14 sm:pb-20 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-3">
              Tarifs simples et transparents
            </h1>
            <p className="text-muted font-light">
              3 offres claires. Starter sans abonnement, Pro mensuel. Résiliez à tout moment.
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
              Essayez avec <strong className="font-semibold">2 visuels offerts</strong> — sans carte bancaire
            </p>
            <a
              href="/#outil"
              className="flex-shrink-0 inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 min-h-[44px] rounded-full text-sm font-medium hover:bg-foreground/85 active:scale-[0.99] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            >
              {"Essayer l'outil"}
            </a>
          </div>

          {/* Equivalence visuel */}
          <p className="text-sm text-muted font-light text-center mb-8">1 visuel = 1 photo uploadée, meublée dans le style de votre choix.</p>

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
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sage text-white text-[11px] font-semibold px-4 py-1 rounded-full tracking-wider shadow-sm">
                    Recommandé
                  </span>
                )}
                <p className={`text-xs font-medium uppercase tracking-widest mb-3 ${pack.highlight ? "text-sage" : "text-muted"}`}>
                  {pack.name}
                </p>
                <p className="text-4xl font-bold text-foreground mb-0.5">
                  {pack.id === "decouverte" ? (
                    <span>Gratuit</span>
                  ) : (
                    <>{pack.price} €{pack.id === "pro" && <span className="text-base font-light text-muted">/mois</span>}{pack.id === "starter" && <span className="text-base font-light text-muted"> une fois</span>}</>
                  )}
                </p>
                <p className="text-xs text-muted font-light mb-1">
                  {pack.id === "decouverte"
                    ? `${pack.credits} visuels offerts`
                    : `${pack.credits} visuels · ${pack.perPhoto} €/visuel`}
                </p>
                {pack.id === "starter" && <p className="text-xs text-sage font-medium mb-1">Achat unique — sans abonnement</p>}
                <p className={`text-xs text-muted font-light ${pack.roiNote ? "mb-2" : "mb-6"}`}>
                  TTC · TVA 20% incluse
                </p>
                {pack.roiNote && (
                  <p className="text-xs text-sage font-medium mb-6">{pack.roiNote}</p>
                )}
                <p className="text-[13px] text-foreground/60 font-medium mb-4 text-left">
                  {pack.personaLine}
                </p>
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
                {pack.note && (
                  <p className="text-xs text-sage font-medium mb-4">{pack.note}</p>
                )}
                {pack.id === "decouverte" ? (
                  <a
                    href="/#outil"
                    className="mt-auto w-full px-4 py-3 min-h-[44px] rounded-full text-sm font-medium transition-all duration-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 border border-foreground/10 text-foreground hover:bg-foreground/5 inline-flex items-center justify-center"
                  >
                    {pack.cta}
                  </a>
                ) : (
                  <button
                    onClick={() => handleBuy(pack.id)}
                    disabled={loadingPack !== null}
                    className={`mt-auto w-full px-4 py-3 min-h-[44px] rounded-full text-sm font-medium transition-all duration-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${
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
                )}
              </div>
            ))}
          </div>


          {/* Comparaison ROI */}
          <div className="max-w-xl mx-auto mt-10 text-center space-y-1.5">
            <p className="text-sm text-muted font-light">
              Un home stager facture <strong className="text-foreground font-semibold">200 à 500 € par planche</strong> et 48-72h de délai.
            </p>
            <p className="text-sm text-muted font-light">
              Versimo Pro : <strong className="text-foreground font-semibold">0,58 €/photo</strong>, résultat en <strong className="text-foreground font-semibold">90 secondes</strong>.
            </p>
            <p className="text-xs text-sage font-medium pt-1">
              Sur 8 biens et 40 photos par an, vous passez de 12 000 € à 348 €.
            </p>
          </div>

          {/* Section recharge */}
          <div className="max-w-2xl mx-auto mt-10 p-6 rounded-2xl border border-foreground/5 bg-foreground/[0.02]">
            <h3 className="text-sm font-semibold text-foreground mb-2">Besoin de plus de visuels ?</h3>
            <p className="text-xs text-muted font-light mb-4">Rechargez à tout moment au prix de votre offre.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-foreground/10">
                <p className="text-xs font-semibold text-foreground mb-2">Recharges Starter</p>
                <div className="space-y-2">
                  <button
                    onClick={() => handleBuy("recharge-starter-10")}
                    disabled={loadingPack !== null}
                    className="w-full flex items-center justify-between text-xs text-muted font-light px-3 py-2.5 rounded-lg border border-foreground/10 hover:bg-foreground/5 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>+10 visuels</span>
                    <span className="font-medium text-foreground">5,90 €</span>
                  </button>
                  <button
                    onClick={() => handleBuy("recharge-starter-25")}
                    disabled={loadingPack !== null}
                    className="w-full flex items-center justify-between text-xs text-muted font-light px-3 py-2.5 rounded-lg border border-foreground/10 hover:bg-foreground/5 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>+25 visuels</span>
                    <span className="font-medium text-foreground">12,90 €</span>
                  </button>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-sage/20 bg-sage/5">
                <p className="text-xs font-semibold text-sage mb-2">Recharges Pro</p>
                <div className="space-y-2">
                  <button
                    onClick={() => handleBuy("recharge-pro-20")}
                    disabled={loadingPack !== null}
                    className="w-full flex items-center justify-between text-xs text-muted font-light px-3 py-2.5 rounded-lg border border-sage/20 hover:bg-sage/10 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>+20 visuels</span>
                    <span className="font-medium text-foreground">9 €</span>
                  </button>
                  <button
                    onClick={() => handleBuy("recharge-pro-50")}
                    disabled={loadingPack !== null}
                    className="w-full flex items-center justify-between text-xs text-muted font-light px-3 py-2.5 rounded-lg border border-sage/20 hover:bg-sage/10 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>+50 visuels</span>
                    <span className="font-medium text-foreground">19 €</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Free trial note */}
          <p className="text-center text-[11px] text-muted font-light mt-8">
            2 visuels offerts sans carte bancaire · TVA récupérable
            pour les professionnels assujettis.
          </p>

          {/* FAQ */}
          <div aria-label="Questions fréquentes" role="region" className="max-w-2xl mx-auto mt-16">
            <h2 className="text-lg font-semibold text-foreground text-center mb-8">Questions fréquentes</h2>
            <div className="space-y-4">
              {[
                { q: "Mes visuels Starter expirent-ils ?", a: "Non. Les visuels Starter sont valables à vie, sans limite de temps." },
                { q: "Les visuels Pro non utilisés sont-ils reportés ?", a: "Non, les 50 visuels Pro sont renouvelés chaque mois. Les visuels non utilisés ne sont pas cumulables." },
                { q: "Comment résilier mon abonnement Pro ?", a: "En 1 clic depuis votre compte, rubrique Abonnement. La résiliation prend effet à la fin du mois en cours." },
                { q: "Je peux changer d'offre ?", a: "Oui, vous pouvez passer de Starter à Pro à tout moment. Vos visuels Starter restent disponibles en plus de votre abonnement Pro." },
                { q: "Je reçois une facture ?", a: "Oui, une facture TTC est envoyée automatiquement par email après chaque achat ou renouvellement." },
                { q: "Le paiement est-il sécurisé ?", a: "Oui. Tous les paiements sont traités par Stripe, leader mondial du paiement en ligne. Vos données bancaires ne transitent jamais par nos serveurs." },
              ].map((faq) => (
                <details key={faq.q} className="group border border-foreground/10 rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between px-5 py-4 min-h-[44px] cursor-pointer text-sm font-medium text-foreground hover:bg-foreground/[0.02] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 list-none [&::-webkit-details-marker]:hidden">
                    {faq.q}
                    <svg className="w-4 h-4 flex-shrink-0 text-muted group-open:rotate-180 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </summary>
                  <p className="px-5 pb-4 text-sm text-muted font-light leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>

          {/* Bandeau sécurité paiement */}
          <div className="max-w-xl mx-auto mt-10 flex items-center justify-center gap-3 text-xs text-muted font-light">
            <svg className="w-4 h-4 text-sage flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <span>Paiement sécurisé par Stripe · Données bancaires chiffrées · CB, Visa, Mastercard</span>
          </div>
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
