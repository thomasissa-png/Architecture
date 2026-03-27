import type { Metadata } from "next";
import Footer from "@/components/Footer";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://architecture-toum92.replit.app";

export const metadata: Metadata = {
  title: "Home staging IA architecte d'intérieur | Versiroom",
  description:
    "Partagez des pistes d'inspiration à vos clients en 90 secondes. 12 styles curatés par des architectes d'intérieur, comparateur avant/après, partage instantané. Alternative rapide aux rendus 3D.",
  keywords: [
    "home staging architecte intérieur",
    "rendu 3D rapide IA",
    "inspiration décoration IA",
    "planches ambiance IA",
    "home staging virtuel architecte",
  ],
  openGraph: {
    title: "Home staging IA pour architectes d'intérieur | Versiroom",
    description:
      "Générez des planches d'ambiance en 90 secondes au lieu d'attendre 2-3 jours par rendu 3D. 12 styles, comparateur avant/après.",
    type: "website",
    locale: "fr_FR",
    siteName: "Versiroom",
    url: `${BASE_URL}/architecte`,
    images: [{ url: `${BASE_URL}/imageapres.jpg`, width: 1200, height: 630, alt: "Versiroom — Home staging virtuel par IA" }],
  },
  alternates: {
    canonical: `${BASE_URL}/architecte`,
  },
};

const faqItems = [
  {
    question: "Versiroom remplace-t-il un rendu 3D professionnel ?",
    answer:
      "Non, et ce n'est pas l'objectif. Versiroom génère un support de conversation en 90 secondes : une piste d'inspiration visuelle pour valider une direction esthétique avec votre client. Le rendu 3D final reste nécessaire pour les projets aboutis. Versiroom intervient au début du processus, quand le client veut voir à quoi ça va ressembler dès le premier rendez-vous.",
  },
  {
    question: "Les 12 styles sont-ils adaptés à une clientèle haut de gamme ?",
    answer:
      "Oui. Chaque style a été conçu et validé par Yann Duval, architecte d'intérieur avec 20 ans d'expérience. Les prompts incluent des références de mobilier iconique (Eames, Noguchi, PH5), des dimensions précises et des matériaux spécifiques. Le rendu est crédible pour une présentation client professionnelle.",
  },
  {
    question: "Puis-je tester plusieurs ambiances sur la même photo ?",
    answer:
      "Absolument. C'est le cas d'usage principal pour les architectes. Uploadez une photo de chantier, générez un visuel Scandinave, puis Japandi, puis Contemporain. Comparez les résultats avec le slider avant/après et envoyez les 2-3 directions préférées à votre client par email ou WhatsApp.",
  },
  {
    question: "Ça fonctionne sur un chantier brut ?",
    answer:
      "Oui, c'est le cas d'usage principal. En deux étapes : d'abord les finitions (murs, sol, plafond), ensuite l'ameublement. Une pièce en béton brut devient un intérieur fini et meublé. Hauteur sous plafond, poutres apparentes, voûtes : la géométrie est préservée.",
  },
  {
    question: "Quels sont les droits d'usage sur les visuels générés ?",
    answer:
      "Les visuels vous appartiennent. Vous pouvez les utiliser librement dans vos présentations client, votre site, vos réseaux sociaux, vos dossiers de présentation. Aucune restriction d'usage commercial.",
  },
  {
    question: "Que faites-vous de mes photos ?",
    answer:
      "Vos photos sont traitées uniquement pour générer le visuel, puis supprimées automatiquement sous 30 jours. Elles ne sont ni partagées, ni utilisées pour entraîner un modèle d'IA. Vos projets clients restent confidentiels.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function ArchitectePage() {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
              href="/pricing"
              className="text-xs text-muted font-light hover:text-foreground transition-colors"
            >
              Tarifs
            </a>
            <a
              href="/#outil"
              className="text-xs font-medium text-background bg-foreground px-4 py-2 rounded-full hover:bg-foreground/85 transition-colors"
            >
              Essayer
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-28 sm:pt-36 pb-10 sm:pb-14 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs text-sage font-medium uppercase tracking-widest mb-4">
            Pour les architectes d'intérieur
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight mb-5 leading-tight">
            Vos clients veulent voir.
            <br />
            <span className="font-light text-muted">En 90 secondes, montrez-leur.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted font-light leading-relaxed max-w-2xl mx-auto mb-8">
            Une planche d'ambiance pour votre client dès le premier RDV,
            sans attendre 48h le rendu 3D.
          </p>
          <a
            href="/#outil"
            className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-3.5 rounded-full text-sm font-medium hover:bg-foreground/85 transition-all duration-200 active:scale-[0.98]"
          >
            Générer votre première planche
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <p className="text-sm text-foreground/60 font-light mt-4">
            Sans carte bancaire · 3 générations offertes
          </p>
        </div>
      </section>

      {/* Avant / Après */}
      <section className="pb-4 sm:pb-6 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 rounded-2xl overflow-hidden">
            <div className="relative aspect-[4/3]">
              <img src="/imageavant.jpg" alt="Appartement en chantier avant Versiroom" className="w-full h-full object-cover" />
              <span className="absolute bottom-2 left-2 text-xs font-medium text-white bg-black/50 px-2 py-1 rounded">Avant</span>
            </div>
            <div className="relative aspect-[4/3]">
              <img src="/imageapres.jpg" alt="Appartement meublé en style Scandinave par Versiroom" className="w-full h-full object-cover" />
              <span className="absolute bottom-2 left-2 text-xs font-medium text-white bg-black/50 px-2 py-1 rounded">Après</span>
            </div>
          </div>
          <p className="text-xs text-muted font-light text-center mt-3">
            Appartement en chantier — Style Scandinave, généré par Versiroom en 90 secondes.
          </p>
        </div>
      </section>

      {/* Social proof line */}
      <div className="flex flex-wrap justify-center gap-6 sm:gap-10 text-xs text-muted font-light py-6">
        <span>12 styles curatés</span>
        <span>·</span>
        <span>Résultat en 90 secondes</span>
        <span>·</span>
        <span>HD gratuit, sans filigrane</span>
      </div>

      {/* Le problème */}
      <section className="pb-16 sm:pb-24 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-8 text-center">
            Le problème que vous connaissez
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "2 à 3 jours par planche de rendu",
                desc: "Un rendu 3D professionnel prend du temps. Votre client veut voir le résultat dès le premier rendez-vous, pas une semaine plus tard.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                  </svg>
                ),
                title: "Difficulté à se projeter",
                desc: "Vos clients ne visualisent pas le potentiel d'une pièce vide sur un plan 2D. Ils ont besoin de voir la pièce meublée dans la direction esthétique envisagée.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                ),
                title: "Itérer prend du temps",
                desc: "Tester 3 ambiances différentes sur la même pièce, c'est 3 fois le délai et 3 fois le coût. Difficile d'explorer largement.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-2xl border border-foreground/10 bg-background"
              >
                <div className="text-foreground/60 mb-3">{item.icon}</div>
                <p className="text-sm font-semibold text-foreground mb-2">{item.title}</p>
                <p className="text-xs text-muted font-light leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Separator */}
      <div className="max-w-24 mx-auto border-t border-foreground/10" />

      {/* La solution */}
      <section className="py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4 text-center">
            La solution Versiroom
          </h2>
          <p className="text-muted font-light text-center mb-12 max-w-xl mx-auto">
            Un support de conversation visuel généré en 90 secondes, pas un rendu final.
          </p>
          <div className="space-y-6">
            {[
              {
                num: "01",
                title: "12 styles curatés par Yann Duval",
                desc: "Scandinave, Japandi, Art Déco, Haussmannien, Wabi-Sabi… Chaque style a été conçu et validé par Yann Duval, architecte d'intérieur — 20 ans d'expérience, collaborateur d'ateliers de référence internationaux. Références de mobilier iconique, matériaux précis, proportions professionnelles.",
              },
              {
                num: "02",
                title: "Comparateur avant/après",
                desc: "Un slider intuitif pour comparer la photo originale et le visuel meublé. Idéal pour présenter 2-3 directions esthétiques à votre client et orienter la discussion.",
              },
              {
                num: "03",
                title: "Partage instantané",
                desc: "Envoyez les visuels par email, WhatsApp ou lien partageable. Votre client reçoit le dossier de présentation directement sur son téléphone, sans télécharger d'application.",
              },
              {
                num: "04",
                title: "Géométrie préservée",
                desc: "Le visuel respecte la géométrie réelle de votre pièce : hauteur sous plafond, proportions, position des ouvertures. Même sur un chantier brut, le résultat est crédible pour un dossier de présentation client.",
              },
            ].map((item) => (
              <div key={item.num} className="flex gap-5 items-start">
                <span className="text-sage text-xs font-medium tracking-widest mt-1 shrink-0">
                  {item.num}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">{item.title}</p>
                  <p className="text-sm text-muted font-light leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Separator */}
      <div className="max-w-24 mx-auto border-t border-foreground/10" />

      {/* Comment ça marche */}
      <section className="py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-12">
            Comment ça marche
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Photographiez",
                desc: "Prenez en photo le chantier depuis votre iPad Pro sur chantier, MacBook au bureau, iPhone en déplacement.",
              },
              {
                step: "2",
                title: "Choisissez",
                desc: "Sélectionnez un style parmi 12 ambiances curatées par Yann Duval. Ou décrivez votre propre direction.",
              },
              {
                step: "3",
                title: "Partagez",
                desc: "Envoyez la planche d'ambiance à votre client par email ou WhatsApp. 90 secondes.",
              },
            ].map((item) => (
              <div key={item.step}>
                <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-4">
                  <span className="text-sm font-semibold text-foreground">{item.step}</span>
                </div>
                <p className="text-sm font-semibold text-foreground mb-2">{item.title}</p>
                <p className="text-xs text-muted font-light leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Separator */}
      <div className="max-w-24 mx-auto border-t border-foreground/10" />

      {/* FAQ */}
      <section className="py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-10 text-center">
            Questions fréquentes
          </h2>
          <div className="space-y-8">
            {faqItems.map((item) => (
              <div key={item.question}>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  {item.question}
                </h3>
                <p className="text-sm text-muted font-light leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="pb-20 sm:pb-32 px-5 sm:px-8">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-xs text-muted font-light mb-6">
            Conçu avec et pour des architectes d'intérieur indépendants.
          </p>
          <p className="text-lg font-semibold text-foreground mb-3">
            Prêt à gagner du temps sur vos présentations client ?
          </p>
          <p className="text-sm text-muted font-light mb-4">
            3 générations offertes, sans carte bancaire, résultat en 90 secondes.
          </p>
          <p className="text-xs text-muted font-light mb-8">
            Abonnement Pro — 29 €/mois, tout inclus
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/#outil"
              className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-8 py-3.5 rounded-full text-sm font-medium hover:bg-foreground/85 transition-all duration-200 active:scale-[0.98]"
            >
              Essayer gratuitement
            </a>
            <a
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 border border-foreground/15 text-foreground px-6 py-3.5 rounded-full text-sm font-medium hover:bg-foreground/5 transition-colors"
            >
              Voir les tarifs Pro
            </a>
          </div>
          <p className="text-xs text-foreground/40 font-light mt-4">
            Aussi disponible à l'usage, sans abonnement — à partir de 4,90 €
          </p>
        </div>
      </section>

      <Footer currentPage="/architecte" />
    </div>
  );
}
