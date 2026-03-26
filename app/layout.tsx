import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://architecture-toum92.replit.app"

export const metadata: Metadata = {
  title: {
    default: "Versiroom — Home staging virtuel IA | 12 styles, 90 secondes",
    template: "%s | Versiroom"
  },
  description:
    "Meublez vos pièces vides par IA en 90 secondes. Pipeline 2 passes qui préserve votre géométrie. Pour architectes d'intérieur, marchands de biens et particuliers exigeants. HD sans filigrane.",
  keywords: [
    "home staging virtuel",
    "home staging IA",
    "décoration intérieure IA",
    "virtual staging",
    "immobilier",
    "architecture",
    "meuble par IA",
    "home staging France",
  ],
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: "Versiroom — Home staging virtuel IA | 12 styles, 90 secondes",
    description:
      "Uploadez une photo de pièce vide, choisissez un style parmi 12 ambiances curatées. Votre pièce meublée en 90 secondes — géométrie et lumière préservées.",
    type: "website",
    locale: "fr_FR",
    siteName: "Versiroom",
  },
  twitter: {
    card: "summary_large_image",
    site: "@versiroom",
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: BASE_URL,
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Versiroom",
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description:
      "Home staging virtuel par IA pour architectes d'intérieur, marchands de biens et particuliers. Pipeline 2 passes qui préserve la géométrie de la pièce originale.",
    foundingDate: "2025",
    knowsAbout: [
      "home staging virtuel",
      "home staging par IA",
      "préservation géométrique IA",
      "pipeline 2 passes",
      "styles curatés architecte d'intérieur",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Versiroom",
    applicationCategory: "DesignApplication",
    operatingSystem: "Web",
    url: BASE_URL,
    description:
      "Outil de home staging virtuel par IA. Uploadez une photo de pièce vide, choisissez un style parmi 12 ambiances curatées. Le pipeline 2 passes génère un visuel meublé en 90 secondes en préservant la géométrie originale.",
    offers: [
      { "@type": "Offer", name: "Gratuit", price: "0", priceCurrency: "EUR" },
      { "@type": "Offer", name: "Découverte", price: "4.90", priceCurrency: "EUR" },
      { "@type": "Offer", name: "Starter", price: "14.90", priceCurrency: "EUR" },
      { "@type": "Offer", name: "Pro", price: "29", priceCurrency: "EUR" },
    ],
    featureList: [
      "Pipeline 2 passes (surfaces + mobilier)",
      "12 styles curatés par des experts",
      "Préservation géométrique de la pièce",
      "Téléchargement HD sans filigrane",
      "Upload multi-photos (jusqu'à 5)",
      "Résultat en 90 secondes",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Comment Versiroom préserve-t-il la géométrie de ma pièce ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Versiroom utilise un pipeline en 2 passes séquentielles. La passe 1 applique les finitions de surface (murs, sol, luminaire) sans toucher à la géométrie. La passe 2 ajoute le mobilier sur la pièce finie, avec les surfaces verrouillées. Résultat : l'angle de prise de vue, les proportions et la lumière naturelle sont identiques entre la photo originale et le visuel généré.",
        },
      },
      {
        "@type": "Question",
        name: "Quelle est la différence entre Versiroom et les autres outils de home staging virtuel ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "La plupart des outils de home staging virtuel génèrent une nouvelle image à partir de votre photo — ils s'en inspirent mais ne l'éditent pas. Versiroom édite votre photo en 2 passes distinctes. La pièce reste la vôtre : même géométrie, même lumière, mêmes proportions. Seuls les finitions et le mobilier changent.",
        },
      },
      {
        "@type": "Question",
        name: "Versiroom convient-il aux professionnels de l'immobilier ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui. Versiroom est conçu pour les architectes d'intérieur (support de conversation client en 90 secondes), les marchands de biens (plaquettes de pré-commercialisation sans home stager) et les particuliers exigeants. Téléchargement HD sans filigrane inclus dans tous les plans.",
        },
      },
    ],
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {/* JSON-LD schemas — placed in body to avoid hydration mismatch with Sentry */}
        {jsonLd.map((schema, i) => (
          <script
            key={`jsonld-${i}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
