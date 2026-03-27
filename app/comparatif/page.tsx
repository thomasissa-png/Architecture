import type { Metadata } from "next";
import Footer from "@/components/Footer";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://architecture-toum92.replit.app";

export const metadata: Metadata = {
  title:
    "Comparatif home staging IA 2026 : Versiroom vs Gepetto vs InterieurAI | Versiroom",
  description:
    "Comparez les meilleurs outils de home staging virtuel par IA en France : prix, styles, technologie. Tableau comparatif factuel et objectif.",
  keywords: [
    "comparatif home staging IA",
    "home staging virtuel comparatif",
    "Versiroom vs Gepetto",
    "meilleur outil home staging IA",
    "home staging IA prix",
    "home staging virtuel France",
  ],
  openGraph: {
    title:
      "Comparatif home staging IA 2026 : Versiroom vs Gepetto vs InterieurAI",
    description:
      "Comparez les meilleurs outils de home staging virtuel par IA en France : prix, styles, technologie, preservation geometrie.",
    type: "website",
    locale: "fr_FR",
    siteName: "Versiroom",
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
      "Le meilleur outil depend de votre usage. Pour les architectes d'interieur qui cherchent un rendu de qualite architecturale avec preservation de la geometrie, Versiroom est le plus adapte grace a son pipeline 2 passes et ses 12 styles curetes par des experts. Pour un usage en volume a petit prix, Renovate Club propose un forfait illimite a 9,99 euros par mois. Pour les professionnels de l'immobilier qui veulent un outil francais haut de gamme, Gepetto est egalement une option serieuse.",
  },
  {
    question: "Combien coute le home staging virtuel par IA ?",
    answer:
      "Les prix varient selon les outils. En France, les tarifs vont de 4,90 euros pour 5 photos (Versiroom) a 9,99 euros par mois en illimite (Renovate Club). InterieurAI propose un tarif a la photo des 1,25 euro. Gepetto fonctionne sur devis. A titre de comparaison, un home stager humain facture entre 200 et 500 euros par planche, avec un delai de 48 a 72 heures.",
  },
  {
    question:
      "Le home staging virtuel par IA preserve-t-il la geometrie de la piece ?",
    answer:
      "Tous les outils ne se valent pas sur ce point. Versiroom utilise un pipeline 2 passes unique : la premiere passe traite les surfaces (murs, sol, plafond), la seconde ajoute le mobilier. Cette separation preserve l'angle de prise de vue, la perspective et les proportions de la piece. Les autres outils utilisent generalement un pipeline en une seule passe, ce qui peut deformer la geometrie originale. Versiroom utilise egalement une depth map via Flux Depth Pro en fallback pour verrouiller la structure 3D.",
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
    versiroom: "A partir de 4,90 \u20AC (5 credits)",
    gepetto: "Sur devis",
    interieurAI: "Des 1,25 \u20AC/photo",
    renovateClub: "9,99 \u20AC/mois illimite",
  },
  {
    critere: "Nombre de styles",
    versiroom: "12 + 8 outdoor + custom",
    gepetto: "30+",
    interieurAI: "~50",
    renovateClub: "80+",
  },
  {
    critere: "Technologie",
    versiroom: "Pipeline 2 passes (GPT-4.1 vision)",
    gepetto: "IA proprietaire",
    interieurAI: "IA proprietaire",
    renovateClub: "IA proprietaire",
  },
  {
    critere: "Preservation geometrie",
    versiroom: "Oui (depth map + 2 passes)",
    gepetto: "Non documente",
    interieurAI: "Mentionnee",
    renovateClub: "Non documente",
  },
  {
    critere: "Cible principale",
    versiroom: "Architectes + Marchands + Particuliers",
    gepetto: "Professionnels immobilier",
    interieurAI: "Particuliers + Professionnels",
    renovateClub: "Professionnels immobilier",
  },
  {
    critere: "Mode Marchand (dossier PDF)",
    versiroom: "Oui",
    gepetto: "Non",
    interieurAI: "Non",
    renovateClub: "Non",
  },
  {
    critere: "Annonce partageable",
    versiroom: "Oui (page publique + QR)",
    gepetto: "Non",
    interieurAI: "Non",
    renovateClub: "Non",
  },
  {
    critere: "Enrichissement auto (quartier, DVF)",
    versiroom: "Oui",
    gepetto: "Non",
    interieurAI: "Non",
    renovateClub: "Non",
  },
  {
    critere: "Made in France",
    versiroom: "Oui",
    gepetto: "Oui (Bordeaux)",
    interieurAI: "Non documente",
    renovateClub: "Oui",
  },
  {
    critere: "Essai gratuit",
    versiroom: "3 generations gratuites",
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
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-sage font-medium uppercase tracking-widest mb-4">
            Comparatif 2026
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight mb-5 leading-tight">
            Comparatif home staging virtuel IA 2026 &mdash; Versiroom vs
            Gepetto vs InterieurAI
          </h1>
          <p className="text-lg sm:text-xl text-muted font-light leading-relaxed max-w-3xl mx-auto">
            Le march&eacute; du home staging virtuel par IA en France compte
            plusieurs acteurs avec des positionnements diff&eacute;rents. Voici
            un comparatif factuel pour choisir l&apos;outil adapt&eacute;
            &agrave; vos besoins, que vous soyez architecte d&apos;int&eacute;rieur,
            marchand de biens ou particulier.
          </p>
        </div>
      </section>

      {/* Tableau comparatif */}
      <section className="pb-16 sm:pb-24 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-foreground/15">
                <th className="text-left py-4 px-4 text-xs font-semibold text-foreground uppercase tracking-wider">
                  Crit&egrave;re
                </th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-sage uppercase tracking-wider">
                  Versiroom
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
                    {row.versiroom}
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
            Donn&eacute;es collect&eacute;es en mars 2026 sur les sites
            publics des concurrents. &laquo; Non document&eacute; &raquo;
            signifie que l&apos;information n&apos;est pas disponible
            publiquement.
          </p>
        </div>
      </section>

      {/* Separator */}
      <div className="max-w-24 mx-auto border-t border-foreground/10" />

      {/* Pour qui est fait Versiroom ? */}
      <section className="py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-10 text-center">
            Pour qui est fait Versiroom ?
          </h2>
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Pour les architectes d&apos;int&eacute;rieur
              </h3>
              <p className="text-sm text-muted font-light leading-relaxed">
                Claire, architecte DPLG &agrave; Lyon, utilise Versiroom pour
                g&eacute;n&eacute;rer 2 &agrave; 3 ambiances diff&eacute;rentes
                en 90 secondes et les envoyer &agrave; son client avant le
                premier rendez-vous. Au lieu d&apos;attendre 2-3 jours par
                planche de rendu 3D, elle explore rapidement les directions
                esth&eacute;tiques et oriente la discussion. Les{" "}
                <a
                  href="/architecte"
                  className="text-sage underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  12 styles curat&eacute;s par des architectes d&apos;int&eacute;rieur
                </a>{" "}
                incluent des r&eacute;f&eacute;rences de mobilier iconique
                (Eames, PH5, Wegner) et des proportions valid&eacute;es.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Pour les marchands de biens
              </h3>
              <p className="text-sm text-muted font-light leading-relaxed">
                Thomas, marchand de biens &agrave; Bordeaux, photographie ses
                biens bruts juste apr&egrave;s l&apos;achat et g&eacute;n&egrave;re
                des visuels meubl&eacute;s pour ses plaquettes de
                pr&eacute;-commercialisation. Le{" "}
                <a
                  href="/marchand"
                  className="text-sage underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  mode Marchand
                </a>{" "}
                lui permet de cr&eacute;er des dossiers PDF professionnels avec
                annonces partageables et QR code. Au lieu de payer 200-500
                euros par planche &agrave; un home stager humain, il
                g&eacute;n&egrave;re ses visuels en quelques minutes.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Pour les particuliers
              </h3>
              <p className="text-sm text-muted font-light leading-relaxed">
                L&eacute;a vient d&apos;acheter son premier appartement et veut
                visualiser diff&eacute;rents styles de d&eacute;coration dans
                SES pi&egrave;ces avant d&apos;acheter ses meubles. Avec{" "}
                <a
                  href="/particulier"
                  className="text-sage underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  3 g&eacute;n&eacute;rations gratuites
                </a>
                , elle teste le Scandinave, le Japandi ou le Contemporain
                directement sur ses photos, sans engagement. Le rendu est
                suffisamment r&eacute;aliste pour partager sur Instagram ou
                envoyer &agrave; ses proches.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Separator */}
      <div className="max-w-24 mx-auto border-t border-foreground/10" />

      {/* Ce qui distingue Versiroom */}
      <section className="py-16 sm:py-24 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-10 text-center">
            Ce qui distingue Versiroom
          </h2>
          <div className="space-y-6">
            <div className="flex gap-5 items-start">
              <span className="text-sage text-xs font-medium tracking-widest mt-1 shrink-0">
                01
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Pipeline 2 passes &mdash; pr&eacute;servation de la
                  g&eacute;om&eacute;trie
                </p>
                <p className="text-sm text-muted font-light leading-relaxed">
                  Contrairement aux outils qui g&eacute;n&egrave;rent tout en
                  une seule passe, Versiroom traite d&apos;abord les surfaces
                  (murs, sol, plafond, luminaire) puis ajoute le mobilier dans
                  un second temps. Cette s&eacute;paration pr&eacute;serve
                  l&apos;angle de prise de vue, la perspective, les proportions
                  et la lumi&egrave;re naturelle de la pi&egrave;ce originale.
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
                  Mode Marchand &mdash; dossiers PDF et annonces partageables
                </p>
                <p className="text-sm text-muted font-light leading-relaxed">
                  Aucun concurrent ne propose de g&eacute;n&eacute;rer un
                  dossier de pr&eacute;-commercialisation complet avec visuels
                  meubl&eacute;s, donn&eacute;es DVF du quartier et page
                  d&apos;annonce partageable avec QR code. Ce mode est
                  con&ccedil;u pour les marchands de biens qui ont besoin
                  d&apos;un support professionnel imm&eacute;diat, pas juste
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
                  Enrichissement automatique &mdash; quartier et donn&eacute;es
                  DVF
                </p>
                <p className="text-sm text-muted font-light leading-relaxed">
                  Versiroom enrichit automatiquement les annonces avec les
                  donn&eacute;es publiques du quartier (prix au m&sup2;,
                  &eacute;volution du march&eacute; local). Cette
                  fonctionnalit&eacute; n&apos;existe chez aucun concurrent du
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
            Pr&ecirc;t &agrave; essayer ?
          </p>
          <p className="text-sm text-muted font-light mb-8">
            3 g&eacute;n&eacute;rations offertes, sans carte bancaire,
            r&eacute;sultat en 90 secondes.
          </p>
          <a
            href="/#outil"
            className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-3.5 rounded-full text-sm font-medium hover:bg-foreground/85 transition-all duration-200 active:scale-[0.98]"
          >
            Essayer Versiroom gratuitement
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
              className="text-sage underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Architectes
            </a>
            <a
              href="/marchand"
              className="text-sage underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Marchands de biens
            </a>
            <a
              href="/particulier"
              className="text-sage underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Particuliers
            </a>
            <a
              href="/blog"
              className="text-sage underline underline-offset-2 hover:text-foreground transition-colors"
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
