import type { Metadata } from "next";
import Footer from "@/components/Footer";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://versimo.fr";

export const metadata: Metadata = {
  title:
    "Comparatif home staging IA 2026 : Versimo vs Gepetto vs InterieurAI | Versimo",
  description:
    "Comparez les meilleurs outils de home staging virtuel par IA en France : prix, styles, technologie. Tableau comparatif factuel et objectif.",
  keywords: [
    "comparatif home staging IA",
    "home staging virtuel comparatif",
    "Versimo vs Gepetto",
    "meilleur outil home staging IA",
    "home staging IA prix",
    "home staging virtuel France",
  ],
  openGraph: {
    title:
      "Comparatif home staging IA 2026 : Versimo vs Gepetto vs InterieurAI",
    description:
      "Comparez les meilleurs outils de home staging virtuel par IA en France : prix, styles, technologie, préservation géométrie.",
    type: "website",
    locale: "fr_FR",
    siteName: "Versimo",
    url: `${BASE_URL}/comparatif`,
  },
  alternates: {
    canonical: `${BASE_URL}/comparatif`,
  },
};

const faqItems = [
  {
    question: "Quel est le meilleur outil de home staging virtuel IA ?",
    answer:
      "Le meilleur outil dépend de votre usage. Pour les architectes d'intérieur qui cherchent un rendu de qualité architecturale avec préservation de la géométrie, Versimo est le plus adapté grâce à son pipeline 2 passes et ses 12 styles curatés par des experts. Pour un usage en volume à petit prix, Renovate Club propose un forfait illimité à 9,99 euros par mois. Pour les professionnels de l'immobilier qui veulent un outil français haut de gamme, Gepetto est également une option sérieuse.",
  },
  {
    question: "Combien coûte le home staging virtuel par IA ?",
    answer:
      "Les prix varient selon les outils. En France, les tarifs vont de 9,90 euros pour 15 visuels en achat unique (Versimo Starter) à 29 euros par mois pour 50 visuels (Versimo Pro). Renovate Club propose un forfait illimité à 9,99 euros par mois. InterieurAI propose un tarif à la photo dès 1,25 euro. Gepetto fonctionne sur devis. À titre de comparaison, un home stager humain facture entre 200 et 500 euros par planche, avec un délai de 48 à 72 heures.",
  },
  {
    question:
      "Le home staging virtuel par IA préserve-t-il la géométrie de la pièce ?",
    answer:
      "Tous les outils ne se valent pas sur ce point. Versimo utilise un pipeline 2 passes unique : la première passe traite les surfaces (murs, sol, plafond), la seconde ajoute le mobilier. Cette séparation préserve l'angle de prise de vue, la perspective et les proportions de la pièce. Les autres outils utilisent généralement un pipeline en une seule passe, ce qui peut déformer la géométrie originale. Versimo utilise également une depth map via Flux Depth Pro en fallback pour verrouiller la structure 3D.",
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

const comparatifData = [
  {
    critere: "Prix",
    versimo: "Gratuit (2 visuels) puis 9,90 € (15 visuels)",
    gepetto: "Sur devis",
    interieurAI: "Dès 1,25 €/photo",
    renovateClub: "9,99 €/mois illimité",
  },
  {
    critere: "Nombre de styles",
    versimo: "12 + 8 outdoor + custom",
    gepetto: "30+",
    interieurAI: "~50",
    renovateClub: "80+",
  },
  {
    critere: "Technologie",
    versimo: "Pipeline 2 passes (GPT-4.1 vision)",
    gepetto: "IA propriétaire",
    interieurAI: "IA propriétaire",
    renovateClub: "IA propriétaire",
  },
  {
    critere: "Préservation géométrie",
    versimo: "Oui (depth map + 2 passes)",
    gepetto: "Non documenté",
    interieurAI: "Mentionnée",
    renovateClub: "Non documenté",
  },
  {
    critere: "Cible principale",
    versimo: "Architectes + Marchands + Particuliers",
    gepetto: "Professionnels immobilier",
    interieurAI: "Particuliers + Professionnels",
    renovateClub: "Professionnels immobilier",
  },
  {
    critere: "Mode Pro (dossiers de pré-commercialisation)",
    versimo: "Oui",
    gepetto: "Non",
    interieurAI: "Non",
    renovateClub: "Non",
  },
  {
    critere: "Annonce partageable",
    versimo: "Oui (page publique + QR)",
    gepetto: "Non",
    interieurAI: "Non",
    renovateClub: "Non",
  },
  {
    critere: "Enrichissement auto (quartier, DVF)",
    versimo: "Oui",
    gepetto: "Non",
    interieurAI: "Non",
    renovateClub: "Non",
  },
  {
    critere: "Made in France",
    versimo: "Oui",
    gepetto: "Oui (Bordeaux)",
    interieurAI: "Non documenté",
    renovateClub: "Oui",
  },
  {
    critere: "Essai gratuit",
    versimo: "2 visuels gratuits",
    gepetto: "Sur devis",
    interieurAI: "Essai gratuit",
    renovateClub: "1 photo gratuite",
  },
];

export default function ComparatifPage() {
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
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-sage font-medium uppercase tracking-widest mb-4">
            Comparatif 2026
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight mb-5 leading-tight">
            Comparatif home staging virtuel IA 2026 — Versimo vs
            Gepetto vs InterieurAI
          </h1>
          <p className="text-lg sm:text-xl text-muted font-light leading-relaxed max-w-3xl mx-auto">
            Le marché du home staging virtuel par IA en France compte
            plusieurs acteurs avec des positionnements différents. Voici
            un comparatif factuel pour choisir l&apos;outil adapté
            à vos besoins, que vous soyez architecte d&apos;intérieur,
            marchand de biens ou particulier.
          </p>
        </div>
      </section>

      {/* Tableau comparatif */}
      <section className="pb-10 sm:pb-14 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-foreground/15">
                <th className="text-left py-4 px-4 text-xs font-semibold text-foreground uppercase tracking-wider">
                  Critère
                </th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-sage uppercase tracking-wider">
                  Versimo
                </th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                  Gepetto
                </th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                  InterieurAI
                </th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-foreground/70 uppercase tracking-wider">
                  Renovate Club
                </th>
              </tr>
            </thead>
            <tbody>
              {comparatifData.map((row, index) => (
                <tr
                  key={row.critere}
                  className={`border-b border-foreground/5 ${
                    index % 2 === 0 ? "bg-foreground/[0.02]" : "bg-background"
                  }`}
                >
                  <td className="py-3.5 px-4 font-medium text-foreground">
                    {row.critere}
                  </td>
                  <td className="py-3.5 px-4 text-foreground font-medium">
                    {row.versimo}
                  </td>
                  <td className="py-3.5 px-4 text-muted font-light">
                    {row.gepetto}
                  </td>
                  <td className="py-3.5 px-4 text-muted font-light">
                    {row.interieurAI}
                  </td>
                  <td className="py-3.5 px-4 text-muted font-light">
                    {row.renovateClub}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-muted font-light mt-4 italic">
            Données collectées en mars 2026 sur les sites
            publics des concurrents. « Non documenté »
            signifie que l&apos;information n&apos;est pas disponible
            publiquement.
          </p>
        </div>
      </section>

      {/* Separator */}
      <div className="max-w-24 mx-auto border-t border-foreground/10" />

      {/* Pour qui est fait Versimo ? */}
      <section className="py-10 sm:py-14 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-8 text-center">
            Pour qui est fait Versimo ?
          </h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Pour les architectes d&apos;intérieur
              </h3>
              <p className="text-sm text-muted font-light leading-relaxed">
                Claire, architecte DPLG à Lyon, utilise Versimo pour
                générer 2 à 3 ambiances différentes
                en 90 secondes et les envoyer à son client avant le
                premier rendez-vous. Au lieu d&apos;attendre 2-3 jours par
                planche de rendu 3D, elle explore rapidement les directions
                esthétiques et oriente la discussion. Les{" "}
                <a
                  href="/architecte"
                  className="text-sage underline underline-offset-2 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded-sm"
                >
                  12 styles curatés par des architectes d&apos;intérieur
                </a>{" "}
                incluent des références de mobilier iconique
                (Eames, PH5, Wegner) et des proportions validées.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Pour les marchands de biens
              </h3>
              <p className="text-sm text-muted font-light leading-relaxed">
                Thomas, marchand de biens à Bordeaux, photographie ses
                biens bruts juste après l&apos;achat et génère
                des visuels meublés pour ses plaquettes de
                pré-commercialisation. Le{" "}
                <a
                  href="/marchand"
                  className="text-sage underline underline-offset-2 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded-sm"
                >
                  Mode Pro
                </a>{" "}
                lui permet de créer des dossiers de pré-commercialisation avec
                annonces partageables et QR code. Au lieu de payer 200-500
                euros par planche à un home stager humain, il
                génère ses visuels en quelques minutes.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Pour les particuliers
              </h3>
              <p className="text-sm text-muted font-light leading-relaxed">
                Léa vient d&apos;acheter son premier appartement et veut
                visualiser différents styles de décoration dans
                SES pièces avant d&apos;acheter ses meubles. Avec{" "}
                <a
                  href="/particulier"
                  className="text-sage underline underline-offset-2 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded-sm"
                >
                  2 visuels gratuits
                </a>
                , elle teste deux styles sur son salon
                directement sur ses photos, sans engagement. Le rendu est
                suffisamment réaliste pour partager sur Instagram ou
                envoyer à ses proches.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Separator */}
      <div className="max-w-24 mx-auto border-t border-foreground/10" />

      {/* Ce qui distingue Versimo */}
      <section className="py-10 sm:py-14 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-8 text-center">
            Ce qui distingue Versimo
          </h2>
          <div className="space-y-6">
            <div className="flex gap-5 items-start">
              <span className="text-sage text-xs font-medium tracking-widest mt-1 shrink-0">
                01
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Pipeline 2 passes — préservation de la
                  géométrie
                </p>
                <p className="text-sm text-muted font-light leading-relaxed">
                  Contrairement aux outils qui génèrent tout en
                  une seule passe, Versimo traite d&apos;abord les surfaces
                  (murs, sol, plafond, luminaire) puis ajoute le mobilier dans
                  un second temps. Cette séparation préserve
                  l&apos;angle de prise de vue, la perspective, les proportions
                  et la lumière naturelle de la pièce originale.
                  En fallback, une depth map (Flux Depth Pro) verrouille la
                  structure 3D.
                </p>
              </div>
            </div>
            <div className="flex gap-5 items-start">
              <span className="text-sage text-xs font-medium tracking-widest mt-1 shrink-0">
                02
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Mode Pro — dossiers de pré-commercialisation et annonces partageables
                </p>
                <p className="text-sm text-muted font-light leading-relaxed">
                  Aucun concurrent ne propose de générer un
                  dossier de pré-commercialisation complet avec visuels
                  meublés, données DVF du quartier et page
                  d&apos;annonce partageable avec QR code. Ce mode est
                  conçu pour les marchands de biens qui ont besoin
                  d&apos;un support professionnel immédiat, pas juste
                  d&apos;une image.
                </p>
              </div>
            </div>
            <div className="flex gap-5 items-start">
              <span className="text-sage text-xs font-medium tracking-widest mt-1 shrink-0">
                03
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Enrichissement automatique — quartier et données
                  DVF
                </p>
                <p className="text-sm text-muted font-light leading-relaxed">
                  Versimo enrichit automatiquement les annonces avec les
                  données publiques du quartier (prix au m&sup2;,
                  évolution du marché local). Cette
                  fonctionnalité n&apos;existe chez aucun concurrent du
                  home staging virtuel par IA.
                </p>
              </div>
            </div>
          </div>
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
      <section className="pb-14 sm:pb-20 px-5 sm:px-8">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-lg font-semibold text-foreground mb-3">
            Prêt à essayer ?
          </p>
          <p className="text-sm text-muted font-light mb-8">
            2 visuels offerts, sans carte bancaire,
            résultat en 90 secondes.
          </p>
          <a
            href="/#outil"
            className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-3.5 rounded-full text-sm font-medium hover:bg-foreground/85 transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2"
          >
            Essayer Versimo gratuitement
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-xs text-muted font-light">
            <a
              href="/architecte"
              className="text-sage underline underline-offset-2 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded-sm"
            >
              Architectes
            </a>
            <a
              href="/marchand"
              className="text-sage underline underline-offset-2 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded-sm"
            >
              Marchands de biens
            </a>
            <a
              href="/particulier"
              className="text-sage underline underline-offset-2 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded-sm"
            >
              Particuliers
            </a>
            <a
              href="/blog"
              className="text-sage underline underline-offset-2 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2 rounded-sm"
            >
              Blog
            </a>
          </div>
        </div>
      </section>

      <Footer currentPage="/comparatif" />
    </div>
  );
}
