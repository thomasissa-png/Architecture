import type { Metadata } from "next";
import Footer from "@/components/Footer";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://architecture-toum92.replit.app";

export const metadata: Metadata = {
  title: "Home staging IA architecte d'int\u00E9rieur | Versiroom",
  description:
    "Partagez des pistes d'inspiration a vos clients en 90 secondes. 12 styles curetes par des architectes d'interieur, comparateur avant/apres, partage instantane. Alternative rapide aux rendus 3D.",
  keywords: [
    "home staging architecte interieur",
    "rendu 3D rapide IA",
    "inspiration decoration IA",
    "planches ambiance IA",
    "home staging virtuel architecte",
  ],
  openGraph: {
    title: "Home staging IA pour architectes d'int\u00E9rieur | Versiroom",
    description:
      "Generez des planches d'ambiance en 90 secondes au lieu d'attendre 2-3 jours par rendu 3D. 12 styles, comparateur avant/apres.",
    type: "website",
    locale: "fr_FR",
    siteName: "Versiroom",
    url: `${BASE_URL}/architecte`,
  },
  alternates: {
    canonical: `${BASE_URL}/architecte`,
  },
};

const faqItems = [
  {
    question: "Versiroom remplace-t-il un rendu 3D professionnel ?",
    answer:
      "Non, et ce n'est pas l'objectif. Versiroom genere un support de conversation en 90 secondes : une piste d'inspiration visuelle pour valider une direction esthetique avec votre client. Le rendu 3D final reste necessaire pour les projets aboutis. Versiroom intervient au debut du processus, quand le client veut voir a quoi ca va ressembler des le premier rendez-vous.",
  },
  {
    question: "Les 12 styles sont-ils adaptes a une clientele haut de gamme ?",
    answer:
      "Oui. Chaque style a ete concu et valide par un architecte d'interieur avec 20 ans d'experience. Les prompts incluent des references de mobilier iconique (Eames, Noguchi, PH5), des dimensions precises et des materiaux specifiques. Le rendu est credible pour une presentation client professionnelle.",
  },
  {
    question: "Puis-je tester plusieurs ambiances sur la meme photo ?",
    answer:
      "Absolument. C'est le cas d'usage principal pour les architectes. Uploadez une photo de chantier, generez un visuel Scandinave, puis Japandi, puis Contemporain. Comparez les resultats avec le slider avant/apres et envoyez les 2-3 directions preferees a votre client par email ou WhatsApp.",
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
      <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs text-sage font-medium uppercase tracking-widest mb-4">
            Pour les architectes d'intérieur
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight mb-5 leading-tight">
            Vos clients veulent voir.
            <br />
            <span className="font-light text-muted">En 90 secondes, montrez-leur.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted font-light leading-relaxed max-w-2xl mx-auto mb-4">
            Un support de conversation avec votre client dès le premier RDV,
            sans attendre 48h le rendu 3D.
          </p>
          {/* TODO: remplacer par témoignage réel */}
          <blockquote className="text-sm text-foreground/70 font-light italic mb-8 max-w-lg mx-auto">
            « Je ne cherche pas un rendu final, je cherche un support de conversation avec mon client. »
            <span className="block text-xs text-muted mt-1 not-italic">— Claire D., architecte DPLG, Lyon</span>
          </blockquote>
          <a
            href="/#outil"
            className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-3.5 rounded-full text-sm font-medium hover:bg-foreground/85 transition-all duration-200 active:scale-[0.98]"
          >
            Générer votre première planche gratuitement
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <p className="text-sm text-foreground/60 font-light mt-4">
            Sans carte bancaire · 3 générations offertes
          </p>
        </div>
      </section>

      {/* Le probleme */}
      <section className="pb-16 sm:pb-24 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-8 text-center">
            Le probl&egrave;me que vous connaissez
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "2 a 3 jours par planche de rendu",
                desc: "Un rendu 3D professionnel prend du temps. Votre client veut voir le resultat des le premier rendez-vous, pas une semaine plus tard.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                  </svg>
                ),
                title: "Difficulte a se projeter",
                desc: "Vos clients ne visualisent pas le potentiel d'une piece vide sur un plan 2D. Ils ont besoin de voir la piece meublee dans le style envisage.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                ),
                title: "Iterer prend du temps",
                desc: "Tester 3 ambiances differentes sur la meme piece, c'est 3 fois le delai et 3 fois le cout. Difficile d'explorer largement.",
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
            Un support de conversation visuel g&eacute;n&eacute;r&eacute; en 90 secondes,
            pas un rendu final.
          </p>
          <div className="space-y-6">
            {[
              {
                num: "01",
                title: "12 styles curat\u00E9s par un architecte d\u2019int\u00E9rieur",
                desc: "Scandinave, Japandi, Art Deco, Haussmannien, Wabi-Sabi... Chaque style integre des references de mobilier iconique, des materiaux precis et des proportions validees par un professionnel.",
              },
              {
                num: "02",
                title: "Comparateur avant/apr\u00E8s",
                desc: "Un slider intuitif pour comparer la photo originale et le visuel meuble. Ideal pour presenter 2-3 directions a votre client et orienter la discussion.",
              },
              {
                num: "03",
                title: "Partage instantan\u00E9",
                desc: "Envoyez les visuels par email, WhatsApp ou lien partageable. Votre client recoit l'inspiration directement sur son telephone, sans telecharger d'application.",
              },
              {
                num: "04",
                title: "G\u00E9om\u00E9trie pr\u00E9serv\u00E9e",
                desc: "Le pipeline 2 passes preserve l'angle de prise de vue, la lumiere naturelle et les proportions exactes de la piece. Le visuel genere correspond a la realite du chantier.",
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

      {/* Citation */}
      <section className="py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <blockquote className="text-lg sm:text-xl text-foreground font-light italic leading-relaxed">
            &laquo; Je ne cherche pas un rendu final, je cherche un support de conversation avec mon client. &raquo;
          </blockquote>
          <p className="text-xs text-muted font-light mt-4">
            Claire, architecte d&apos;int&eacute;rieur &mdash; Lyon
          </p>
        </div>
      </section>

      {/* Separator */}
      <div className="max-w-24 mx-auto border-t border-foreground/10" />

      {/* FAQ */}
      <section className="py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-10 text-center">
            Questions fr&eacute;quentes
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
          <p className="text-lg font-semibold text-foreground mb-3">
            Prêt à gagner du temps sur vos présentations client ?
          </p>
          <p className="text-sm text-muted font-light mb-4">
            3 générations offertes, sans carte bancaire, résultat en 90 secondes.
          </p>
          <p className="text-xs text-muted font-light mb-8">
            Abonnement Pro — 29€/mois, tout inclus
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
        </div>
      </section>

      <Footer currentPage="/architecte" />
    </div>
  );
}
