import type { Metadata } from "next";
import Footer from "@/components/Footer";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://architecture-toum92.replit.app";

export const metadata: Metadata = {
  title: "Home staging IA marchand de biens | Versiroom",
  description:
    "Transformez vos biens bruts en visuels meubles professionnels en 90 secondes. 12 styles, telechargement HD, dossiers de pre-commercialisation. Alternative rapide et economique au home stager traditionnel.",
  keywords: [
    "home staging marchand de biens",
    "home staging virtuel immobilier",
    "visuels meubles IA",
    "pre-commercialisation immobiliere",
    "home staging IA pas cher",
  ],
  openGraph: {
    title: "Home staging IA pour marchands de biens | Versiroom",
    description:
      "Creez des dossiers de pre-commercialisation meubles en 90 secondes. 12 styles, HD, sans home stager.",
    type: "website",
    locale: "fr_FR",
    siteName: "Versiroom",
    url: `${BASE_URL}/marchand`,
  },
  alternates: {
    canonical: `${BASE_URL}/marchand`,
  },
};

const faqItems = [
  {
    question: "Combien coute Versiroom par rapport a un home stager traditionnel ?",
    answer:
      "Un home stager traditionnel facture entre 200 et 500 euros par planche, avec un delai de 48 a 72 heures. Avec Versiroom, vous generez un visuel meuble en 90 secondes a partir de 0,58 euros par photo avec le pack Pro. Pour 8 a 12 operations par an, l'economie est considerable.",
  },
  {
    question: "Les visuels sont-ils suffisamment realistes pour des plaquettes commerciales ?",
    answer:
      "Oui. Le pipeline 2 passes de Versiroom preserve la geometrie exacte de la piece (angle, lumiere, proportions). Les visuels sont en haute definition, sans filigrane, et telechargeables immediatement. Ils sont utilises par des marchands de biens pour leurs dossiers de pre-commercialisation et annonces sur les portails immobiliers.",
  },
  {
    question: "Puis-je generer des visuels depuis mon telephone sur un chantier ?",
    answer:
      "Absolument. Versiroom est optimise pour mobile. Prenez une photo du bien brut directement depuis votre iPhone ou Android, uploadez-la, choisissez un style parmi 12 ambiances, et recevez votre visuel meuble en 90 secondes. Vous pouvez ensuite le partager par WhatsApp ou le telecharger en HD.",
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

export default function MarchandPage() {
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
            Pour les marchands de biens
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight mb-5 leading-tight">
            Home staging virtuel IA pour marchands de biens
          </h1>
          <p className="text-lg sm:text-xl text-muted font-light leading-relaxed max-w-2xl mx-auto mb-10">
            Transformez vos biens bruts en visuels meubl&eacute;s professionnels.
            Cr&eacute;ez des dossiers de pr&eacute;-commercialisation en 90 secondes.
          </p>
          <a
            href="/#outil"
            className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-3.5 rounded-full text-sm font-medium hover:bg-foreground/85 transition-all duration-200 active:scale-[0.98]"
          >
            Essayer gratuitement
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <p className="text-xs text-muted font-light mt-4">
            3 g&eacute;n&eacute;rations offertes &middot; sans carte bancaire
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "200 a 500 \u20AC par planche",
                desc: "Un home stager traditionnel facture entre 200 et 500 euros par visuel meuble. Sur 10 operations par an, le budget explose.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "48 a 72h de d\u00E9lai",
                desc: "Vous devez attendre 2 a 3 jours pour recevoir les visuels. Pendant ce temps, votre bien reste en attente de commercialisation.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                title: "Les acqu\u00E9reurs ne se projettent pas",
                desc: "Des murs vides, un sol brut : les acheteurs potentiels ne voient pas le potentiel. Le bien se vend moins vite et moins cher.",
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
            Un pipeline IA en 2 passes qui pr&eacute;serve la g&eacute;om&eacute;trie exacte de votre bien.
          </p>
          <div className="space-y-6">
            {[
              {
                num: "01",
                title: "Pipeline 2 passes",
                desc: "La passe 1 applique les finitions de surface (murs, sol, plafond). La passe 2 ajoute le mobilier. Votre piece reste geometriquement identique a la photo originale.",
              },
              {
                num: "02",
                title: "12 styles curat\u00E9s",
                desc: "Scandinave, Contemporain, Industriel, Japandi, Art Deco, Mid-Century, Boheme, Mediterraneen, Cosy, Wabi-Sabi, Maximaliste, Haussmannien. Chaque style a ete concu par un architecte d'interieur.",
              },
              {
                num: "03",
                title: "Dossier de pr\u00E9-commercialisation",
                desc: "Generez des visuels meubles HD pour vos plaquettes commerciales et vos annonces sur les portails immobiliers. Telechargement immediat, sans filigrane.",
              },
              {
                num: "04",
                title: "Partage instantan\u00E9",
                desc: "Envoyez les visuels par WhatsApp, copiez le lien, ou partagez directement depuis votre mobile. Vos acquereurs se projettent immediatement.",
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

      {/* Comment ca marche */}
      <section className="py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-12">
            Comment &ccedil;a marche
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Uploadez vos photos",
                desc: "Prenez en photo le bien brut depuis votre telephone ou importez vos cliches. Jusqu'a 5 photos par session.",
              },
              {
                step: "2",
                title: "Choisissez un style",
                desc: "Selectionnez parmi 12 ambiances curatees par un architecte d'interieur. Ou decrivez votre propre style.",
              },
              {
                step: "3",
                title: "T\u00E9l\u00E9chargez le dossier",
                desc: "Recevez vos visuels meubles HD en 90 secondes. Telechargez, partagez, integrez a vos plaquettes.",
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
            Pr&ecirc;t &agrave; acc&eacute;l&eacute;rer votre commercialisation ?
          </p>
          <p className="text-sm text-muted font-light mb-8">
            3 g&eacute;n&eacute;rations offertes, sans carte bancaire, r&eacute;sultat en 90 secondes.
          </p>
          <a
            href="/#outil"
            className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-3.5 rounded-full text-sm font-medium hover:bg-foreground/85 transition-all duration-200 active:scale-[0.98]"
          >
            Essayer gratuitement
          </a>
        </div>
      </section>

      <Footer currentPage="/marchand" />
    </div>
  );
}
