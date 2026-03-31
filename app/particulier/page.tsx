import type { Metadata } from "next";
import Footer from "@/components/Footer";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://versimo.fr";

export const metadata: Metadata = {
  title: "Visualiser sa décoration par IA | Versimo",
  description:
    "Testez 12 styles de déco dans VOS pièces. Uploadez une photo, choisissez un style, voyez votre pièce meublée en 90 secondes. Gratuit, instantané, sans inscription.",
  keywords: [
    "décoration intérieure IA",
    "visualiser décoration",
    "visualiser déco appartement",
    "inspiration déco IA",
    "déco intérieure virtuelle",
    "meublé par IA gratuit",
  ],
  openGraph: {
    title: "Visualisez votre future décoration avec l'IA | Versimo",
    description:
      "Testez 12 styles de déco dans VOS pièces. Gratuit, instantané, sans inscription. Résultat en 90 secondes.",
    type: "website",
    locale: "fr_FR",
    siteName: "Versimo",
    url: `${BASE_URL}/particulier`,
    images: [{ url: `${BASE_URL}/imageapres.jpg`, width: 1200, height: 630, alt: "Versimo — Visualiser sa déco par IA" }],
  },
  alternates: {
    canonical: `${BASE_URL}/particulier`,
  },
};

const faqItems = [
  {
    question: "Est-ce vraiment gratuit ?",
    answer:
      "Oui. 3 visuels complets offerts, sans carte bancaire, sans inscription. C'est assez pour tester Scandinave, Japandi et Bohème sur votre salon. Si vous voulez continuer, le pack Starter à 9,90 € donne accès à 15 visuels en achat unique — pas d'abonnement, pas de renouvellement automatique.",
  },
  {
    question: "Comment ça marche concrètement ?",
    answer:
      "Prenez une photo de votre pièce vide avec votre téléphone. Uploadez-la sur Versimo, choisissez un style parmi 12 ambiances (Scandinave, Japandi, Bohème, Cosy…), et recevez un visuel de votre pièce meublée en 90 secondes. Vous pouvez ensuite télécharger l'image en HD ou la partager.",
  },
  {
    question: "Le résultat ressemble-t-il vraiment à ma pièce ?",
    answer:
      "Oui. Versimo utilise une technologie IA qui préserve la géométrie exacte de votre pièce : les murs, les fenêtres, la lumière, l'angle de la photo. Seules les finitions (couleur des murs, sol) et le mobilier changent. C'est votre pièce, dans le style que vous avez choisi. Le rendu est photo-réaliste — pas un filtre Instagram ni un placement 3D.",
  },
  {
    question: "Que faites-vous de mes photos ?",
    answer:
      "Vos photos sont traitées uniquement pour générer le visuel. Elles ne sont ni partagées, ni utilisées pour entraîner une IA. Elles sont supprimées automatiquement sous 30 jours.",
  },
  {
    question: "Ça marche aussi pour une petite pièce ou une pièce sombre ?",
    answer:
      "Oui. Versimo fonctionne avec toutes les configurations — petite surface, couloir, pièce sans fenêtre ou sous mauvaise lumière. L'IA s'adapte à la géométrie réelle de votre espace. Plus la photo est nette, plus le résultat sera précis.",
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

export default function ParticulierPage() {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
              href="/pricing"
              className="text-xs text-muted font-light hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded-sm"
            >
              Tarifs
            </a>
            <a
              href="/#outil"
              className="text-xs font-medium text-background bg-foreground px-4 min-h-[44px] flex items-center rounded-full hover:bg-foreground/85 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
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
            Pour les particuliers
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight mb-5 leading-tight">
            Votre appartement.
            <br />
            <span className="font-light text-muted">Pas celui de quelqu&apos;un d&apos;autre.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted font-normal leading-relaxed max-w-2xl mx-auto mb-8">
            Testez 12 styles de déco dans VOS pièces.
            Gratuit, instantané, depuis votre iPhone.
          </p>
          <a
            href="/#outil"
            className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-3.5 rounded-full text-sm font-medium hover:bg-foreground/85 transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
          >
            Essayer gratuitement
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <p className="text-sm text-foreground/60 font-normal mt-4">
            Sans carte bancaire · Sans inscription · 3 visuels offerts
          </p>
          <p className="text-xs text-foreground/50 font-medium mt-6">Une photo, 90 secondes, 12 possibilités.</p>
        </div>
      </section>

      {/* Avant / Après */}
      <section className="pb-4 sm:pb-6 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 rounded-2xl overflow-hidden">
            <div className="relative aspect-[4/3]">
              <img src="/imageavant.jpg" alt="Pièce vide avant Versimo" className="w-full h-full object-cover" loading="eager" />
              <span className="absolute bottom-2 left-2 text-xs font-medium text-white bg-black/50 px-2 py-1 rounded">Avant</span>
            </div>
            <div className="relative aspect-[4/3]">
              <img src="/imageapres.jpg" alt="Pièce meublée par Versimo" className="w-full h-full object-cover" loading="eager" />
              <span className="absolute bottom-2 left-2 text-xs font-medium text-white bg-black/50 px-2 py-1 rounded">Après</span>
            </div>
          </div>
          <p className="text-xs text-muted font-light text-center mt-3">
            Salon vide → Salon Scandinave — généré en 90 secondes avec Versimo.
          </p>
        </div>
      </section>

      {/* Palette des styles — en attendant la galerie avec images réelles */}
      <section className="pb-8 sm:pb-12 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs text-muted font-light mb-4">12 ambiances pour trouver votre style</p>
          <div className="flex flex-wrap justify-center gap-2">
            {["Scandinave", "Japandi", "Bohème", "Cosy", "Contemporain",
              "Industriel", "Art Déco", "Mid-Century", "Méditerranéen",
              "Wabi-Sabi", "Maximaliste", "Haussmannien"].map((style) => (
              <span key={style} className="text-xs font-light text-foreground/70 border border-foreground/10 rounded-full px-3 py-1.5">
                {style}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof line */}
      <div className="flex flex-wrap justify-center gap-6 sm:gap-10 text-xs text-muted font-light py-6">
        <span>3 essais gratuits · Sans CB</span>
        <span>·</span>
        <span>12 styles curatés</span>
        <span>·</span>
        <span>Résultat en 90 secondes</span>
      </div>

      {/* Le problème */}
      <section className="pb-10 sm:pb-14 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-8 text-center">
            Le problème, c&apos;est Pinterest
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25c0 .828.672 1.5 1.5 1.5z" />
                  </svg>
                ),
                title: "Pinterest, c'est beau mais pas chez vous",
                desc: "Vous trouvez de belles photos de décoration sur Pinterest ou Instagram. Mais c'est toujours chez quelqu'un d'autre. Impossible de voir le résultat dans votre pièce.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "Les apps déco existantes déçoivent",
                desc: "Les applications de décoration existantes sont soit moches (rendu cartoon), soit payantes dès le départ, soit limitées à 2-3 styles génériques.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                  </svg>
                ),
                title: "Difficile de choisir un style",
                desc: "Scandinave ou Japandi ? Contemporain ou Cosy ? Sans voir le résultat dans votre pièce, impossible de trancher. Vous achetez des meubles à l'aveugle.",
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
      <section className="py-10 sm:py-14 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4 text-center">
            Essayez avant d&apos;acheter
          </h2>
          <p className="text-muted font-normal text-center mb-8 max-w-xl mx-auto">
            Scandinave, Japandi, Bohème, Cosy… testez-les tous sur votre pièce.
            Même vide, même sombre, même petite — ça marche.
          </p>
          <div className="space-y-6">
            {[
              {
                num: "01",
                title: "Votre pièce, vos styles",
                desc: "Prenez une photo directement depuis l'appareil photo de votre iPhone, ou uploadez une image de votre salon, chambre ou séjour. L'IA génère un visuel meublé dans votre pièce, pas dans celle de quelqu'un d'autre.",
              },
              {
                num: "02",
                title: "12 ambiances à explorer",
                desc: "Scandinave, Japandi, Bohème, Cosy, Contemporain, Industriel, Art Déco, Mid-Century, Méditerranéen, Wabi-Sabi, Maximaliste, Haussmannien. Scandinave le matin, Maximaliste le soir : testez autant de fois que vous voulez.",
              },
              {
                num: "03",
                title: "Résultat en 90 secondes",
                desc: "Pas besoin d'attendre. Le visuel meublé est généré en moins de 2 minutes. Comparez avec la photo originale grâce au slider avant/après.",
              },
              {
                num: "04",
                title: "Prêt à publier sur Instagram",
                desc: "Le visuel est net, HD, sans filigrane. Téléchargez, partagez sur votre story Insta, épinglez sur Pinterest, ou envoyez à votre partenaire pour avoir son avis.",
              },
            ].map((item) => (
              <div key={item.num} className="flex gap-5 items-start">
                <span className="text-sage text-xs font-medium tracking-widest mt-1 shrink-0">
                  {item.num}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">{item.title}</p>
                  <p className="text-sm text-muted font-normal leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Témoignage */}
      <section className="py-8 sm:py-10 px-5 sm:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <blockquote className="text-base sm:text-lg text-foreground font-normal leading-relaxed italic">
            « J&apos;ai testé 4 ambiances sur mon salon vide en 10 minutes, directement depuis mon iPhone. Mon copain a enfin compris pourquoi je voulais du Japandi — il a voté pour le Scandinave, on a comparé. »
          </blockquote>
          <p className="text-sm text-muted font-normal mt-3">
            Julie, 29 ans — Nantes, T3 livré en janvier
          </p>
        </div>
      </section>

      {/* Separator */}
      <div className="max-w-24 mx-auto border-t border-foreground/10" />

      {/* FAQ */}
      <section aria-label="Questions fréquentes" className="py-10 sm:py-14 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-6 text-center">
            Questions fréquentes
          </h2>
          <div className="space-y-1">
            {faqItems.map((item) => (
              <details key={item.question} className="group">
                <summary className="flex items-center justify-between cursor-pointer py-4 text-sm font-semibold text-foreground hover:text-foreground/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2">
                  {item.question}
                  <svg className="w-4 h-4 text-muted shrink-0 ml-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="text-sm text-muted font-normal leading-relaxed pb-4">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="pb-14 sm:pb-20 px-5 sm:px-8">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-lg font-semibold text-foreground mb-3">
            Votre pièce. Le style que vous cherchez. En 90 secondes.
          </p>
          <p className="text-sm text-muted font-normal mb-6">
            Rendu photo-réaliste, pas un filtre. Testé sur des vraies pièces — salons, chambres, studios.
          </p>
          <p className="text-sm text-muted font-normal mb-8">
            3 visuels offerts · Sans CB · Ensuite à partir de 9,90 €
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/#outil"
              className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-8 py-3.5 rounded-full text-sm font-medium hover:bg-foreground/85 transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
            >
              Essayer gratuitement
            </a>
            <a
              href="/pricing"
              className="text-xs text-muted font-light underline hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded-sm min-h-[44px] inline-flex items-center px-2"
            >
              Voir les packs
            </a>
          </div>
        </div>
      </section>

      <Footer currentPage="/particulier" />
    </div>
  );
}
