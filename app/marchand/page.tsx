import type { Metadata } from "next";
import Footer from "@/components/Footer";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://architecture-toum92.replit.app";

export const metadata: Metadata = {
  title: "Home staging IA marchand de biens | Versiroom",
  description:
    "Transformez vos biens bruts en visuels meublés professionnels en 90 secondes. 12 styles, téléchargement HD, dossiers de pré-commercialisation. Alternative rapide et économique au home stager traditionnel.",
  keywords: [
    "home staging marchand de biens",
    "home staging virtuel immobilier",
    "visuels meublés IA",
    "pré-commercialisation immobilière",
    "home staging IA pas cher",
  ],
  openGraph: {
    title: "Home staging IA pour marchands de biens | Versiroom",
    description:
      "Créez des dossiers de pré-commercialisation meublés en 90 secondes. 12 styles, HD, sans home stager.",
    type: "website",
    locale: "fr_FR",
    siteName: "Versiroom",
    url: `${BASE_URL}/marchand`,
    images: [{ url: `${BASE_URL}/imageapres.jpg`, width: 1200, height: 630, alt: "Versiroom — Home staging virtuel par IA" }],
  },
  alternates: {
    canonical: `${BASE_URL}/marchand`,
  },
};

const faqItems = [
  {
    question: "Combien coûte Versiroom par rapport à un home stager traditionnel ?",
    answer:
      "Un home stager traditionnel facture entre 200 et 500 euros par planche, avec un délai de 48 à 72 heures. Avec Versiroom Pro à 29 €/mois, vous générez jusqu'à 50 visuels meublés par mois, soit environ 0,58 € par photo. Pour 8 à 12 opérations par an, l'économie est considérable.",
  },
  {
    question: "Les visuels sont-ils suffisamment réalistes pour des plaquettes commerciales ?",
    answer:
      "Oui. Versiroom préserve la géométrie exacte de la pièce : angle de prise de vue, lumière naturelle, proportions. Les visuels sont en haute définition, sans filigrane, et téléchargeables immédiatement. Ils sont utilisés par des marchands de biens pour leurs dossiers de pré-commercialisation et annonces sur les portails immobiliers.",
  },
  {
    question: "Puis-je générer des visuels depuis mon téléphone sur un chantier ?",
    answer:
      "Absolument. Versiroom est optimisé pour mobile. Prenez une photo du bien brut directement depuis votre iPhone ou Android, uploadez-la, choisissez un style parmi 12 ambiances, et recevez votre visuel meublé en 90 secondes. Vous pouvez ensuite le partager par WhatsApp ou le télécharger en HD.",
  },
  {
    question: "Est-ce conforme au droit immobilier ?",
    answer:
      "Oui. Chaque visuel généré par Versiroom porte la mention « Simulation IA — home staging virtuel ». Cette transparence est conforme aux exigences du EU AI Act et aux bonnes pratiques du secteur immobilier. Vous pouvez utiliser les visuels dans vos plaquettes et annonces en toute sérénité.",
  },
  {
    question: "Puis-je ajouter mon logo sur les dossiers ?",
    answer:
      "Oui. Avec l'abonnement Pro, vous pouvez personnaliser vos dossiers de pré-commercialisation avec votre logo et vos coordonnées depuis votre profil. Le dossier PDF brandé est prêt à envoyer à vos acquéreurs.",
  },
  {
    question: "Que faites-vous de mes photos ?",
    answer:
      "Vos photos sont traitées uniquement pour générer le visuel, puis supprimées automatiquement sous 30 jours. Elles ne sont ni partagées, ni utilisées pour entraîner un modèle d'IA. Vos projets clients restent confidentiels.",
  },
  {
    question: "Et si le résultat ne me convient pas ?",
    answer:
      "Vous pouvez itérer sur chaque visuel : ajoutez un commentaire (« plus de lumière », « retirer le tapis ») et Versiroom régénère en tenant compte de vos retours. Avec le Mode Pro, 3 itérations par photo sont incluses.",
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

const jsonLdApp = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Versiroom",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "29",
    priceCurrency: "EUR",
    description: "Abonnement Pro — 50 crédits/mois",
  },
};

export default function MarchandPage() {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdApp) }}
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
              href="/mes-dossiers"
              className="text-xs text-muted font-light hover:text-foreground transition-colors"
            >
              Mes dossiers
            </a>
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
            Pour les marchands de biens
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-foreground tracking-tight mb-5 leading-tight">
            29 €/mois. Vos dossiers de pré-commercialisation
            <br />
            <span className="font-light text-muted">en 10 minutes, pas 10 jours.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted font-light leading-relaxed max-w-2xl mx-auto mb-8">
            vs 200-500 € par planche chez un home stager.
            Lien partageable acquéreurs · Sans limite de durée.
          </p>
          <a
            href="/#outil"
            className="inline-flex items-center gap-2 bg-sage text-white px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-sage/85 transition-all duration-200 active:scale-[0.98] shadow-sm"
          >
            Créer mon dossier Pro
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <p className="text-sm text-foreground/60 font-light mt-4">
            50 crédits/mois inclus · 1 crédit = 1 visuel
          </p>
        </div>
      </section>

      {/* Avant / Après */}
      <section className="pb-4 sm:pb-6 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 rounded-2xl overflow-hidden">
            <div className="relative aspect-[4/3]">
              <img src="/imageavant.jpg" alt="T3 brut à Bordeaux avant home staging Versiroom" className="w-full h-full object-cover" loading="lazy" />
              <span className="absolute bottom-2 left-2 text-xs font-medium text-white bg-black/50 px-2 py-1 rounded">Avant</span>
            </div>
            <div className="relative aspect-[4/3]">
              <img src="/imageapres.jpg" alt="T3 meublé en style Scandinave par Versiroom" className="w-full h-full object-cover" loading="lazy" />
              <span className="absolute bottom-2 left-2 text-xs font-medium text-white bg-black/50 px-2 py-1 rounded">Après</span>
            </div>
          </div>
          <p className="text-xs text-muted font-light text-center mt-3">
            T3 brut, Bordeaux — Style Scandinave, généré par Versiroom en 90 secondes.
          </p>
        </div>
      </section>

      {/* Galerie multi-styles — remplacer les placeholders par des images réelles */}
      <section className="pb-6 sm:pb-10 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-muted font-light text-center mb-4">
            Un même bien, 3 styles différents — prêts pour vos plaquettes
          </p>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { style: "Scandinave", src: "/imageapres.jpg" },
              { style: "Contemporain", src: "/imageapres.jpg" },
              { style: "Cosy", src: "/imageapres.jpg" },
            ].map((item) => (
              <div key={item.style} className="relative aspect-[4/3] rounded-xl overflow-hidden">
                <img src={item.src} alt={`Style ${item.style} — Versiroom`} className="w-full h-full object-cover" loading="lazy" />
                <span className="absolute bottom-2 left-2 text-xs font-medium text-white bg-black/50 px-2 py-1 rounded">{item.style}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted/50 font-light text-center mt-2">
            Images placeholder — seront remplacées par des générations réelles
          </p>
        </div>
      </section>

      {/* Social proof line */}
      <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-xs text-muted font-light py-6">
        <span>12 styles curatés</span>
        <span>·</span>
        <span>Résultat en 90 secondes</span>
        <span>·</span>
        <span>HD sans filigrane</span>
        <span>·</span>
        <span>Utilisé en dossiers de pré-commercialisation</span>
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "200 à 500 € par planche",
                desc: "Un home stager traditionnel facture entre 200 et 500 euros par visuel meublé. Sur 10 opérations par an, le budget explose.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "48 à 72h de délai",
                desc: "Vous devez attendre 2 à 3 jours pour recevoir les visuels. Pendant ce temps, votre bien reste en attente de commercialisation.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                title: "Les acquéreurs ne se projettent pas",
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

      {/* Bloc ROI chiffré */}
      <section className="py-12 sm:py-16 px-5 sm:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl bg-sage/5 border border-sage/15 p-6 sm:p-8 text-center">
            <p className="text-sm text-foreground font-light leading-relaxed">
              <span className="font-semibold">10 opérations/an</span> × 3 visuels = 30 photos.
            </p>
            <p className="text-sm text-foreground font-light leading-relaxed mt-1">
              Home stager traditionnel : <span className="font-semibold">~9 000 €</span>.
              Versiroom Pro : <span className="font-semibold">29 €/mois</span>.
            </p>
            <p className="text-lg font-semibold text-sage mt-3">
              Économie : 97 %
            </p>
          </div>
        </div>
      </section>

      {/* Témoignage */}
      <section className="py-10 sm:py-14 px-5 sm:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <blockquote className="text-base sm:text-lg text-foreground font-light leading-relaxed italic">
            « Je sortais mes plaquettes en 3 jours avec un home stager. Maintenant c'est fait dans la matinée. Mes acquéreurs reçoivent les visuels le jour même de la visite. »
          </blockquote>
          <p className="text-sm text-muted font-light mt-3">
            Marchand de biens — Bordeaux, 10 opérations/an
          </p>
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
            Notre IA préserve la géométrie exacte de votre bien : angles, volumes, proportions.
          </p>
          <div className="space-y-6">
            {[
              {
                num: "01",
                title: "Le visuel respecte votre bien",
                desc: "Hauteur sous plafond, proportions, position des ouvertures : le rendu préserve la géométrie réelle de la pièce. Vos acquéreurs voient le bien tel qu'il est, meublé.",
              },
              {
                num: "02",
                title: "12 styles curatés",
                desc: "Scandinave, Contemporain, Industriel, Japandi, Art Déco, Mid-Century, Bohème, Méditerranéen, Cosy, Wabi-Sabi, Maximaliste, Haussmannien. Chaque style a été conçu par un architecte d'intérieur.",
              },
              {
                num: "03",
                title: "Dossier de pré-commercialisation PDF",
                desc: "Générez des visuels meublés HD pour vos plaquettes commerciales et annonces portails. Dossier PDF brandé avec votre logo, téléchargeable et partageable en un clic.",
              },
              {
                num: "04",
                title: "Partage instantané acquéreurs",
                desc: "Envoyez les visuels par WhatsApp, copiez le lien, ou partagez directement depuis votre mobile. Vos acquéreurs se projettent immédiatement.",
              },
              {
                num: "05",
                title: "Annonce prête à publier",
                desc: "Description générée par IA, visuels HD sans filigrane, export compatible portails immobiliers. De la photo brute à l'annonce publiée en une session.",
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
                title: "Uploadez vos photos",
                desc: "Prenez en photo le bien brut depuis votre téléphone ou importez vos clichés. Jusqu'à 5 photos par session.",
              },
              {
                step: "2",
                title: "Choisissez un style",
                desc: "Sélectionnez parmi 12 ambiances curatées par un architecte d'intérieur. Ou décrivez votre propre style.",
              },
              {
                step: "3",
                title: "Téléchargez le dossier",
                desc: "Recevez vos visuels meublés HD en 90 secondes. Téléchargez, partagez, intégrez à vos plaquettes.",
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
            Conçu pour les professionnels de l'immobilier. Visuels utilisés en dossiers de pré-commercialisation.
          </p>
          <p className="text-lg font-semibold text-foreground mb-3">
            Prêt à accélérer votre commercialisation ?
          </p>
          <p className="text-sm text-muted font-light mb-4">
            Abonnement Pro — 29 €/mois · Dossiers de pré-commercialisation · 50 crédits/mois
          </p>
          <p className="text-xs text-muted font-light mb-8">
            3 générations offertes, sans carte bancaire.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 bg-sage text-white px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-sage/85 transition-all duration-200 active:scale-[0.98] shadow-sm"
            >
              S'abonner au Mode Pro
            </a>
            <a
              href="/#outil"
              className="inline-flex items-center justify-center gap-2 border border-foreground/15 text-foreground px-6 py-3.5 rounded-full text-sm font-medium hover:bg-foreground/5 transition-colors"
            >
              Essayer gratuitement
            </a>
          </div>
        </div>
      </section>

      <Footer currentPage="/marchand" />
    </div>
  );
}
