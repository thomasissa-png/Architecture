import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";

/* ---------- SEO ---------- */

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  "https://architecture-toum92.replit.app";

export const metadata: Metadata = {
  title: "Exemples de home staging virtuel IA",
  description:
    "Avant / apr\u00e8s de home staging virtuel par IA : salons, chambres, s\u00e9jours. 12 styles, 90 secondes, g\u00e9om\u00e9trie pr\u00e9serv\u00e9e. Pour architectes, marchands de biens et particuliers.",
  openGraph: {
    title: "Exemples de home staging virtuel IA \u2014 Versiroom",
    description:
      "D\u00e9couvrez des transformations r\u00e9alis\u00e9es par Versiroom sur de vrais biens immobiliers.",
    type: "website",
    locale: "fr_FR",
    siteName: "Versiroom",
  },
  alternates: {
    canonical: `${BASE_URL}/examples`,
  },
};

/* ---------- Static data ---------- */

type Persona = "tous" | "architecte" | "marchand" | "particulier";

interface Example {
  id: string;
  persona: Persona;
  style: string;
  roomType: string;
  caption: string;
  beforeImage: string;
  afterImage: string;
}

const EXAMPLES: Example[] = [
  {
    id: "scandinavian-salon",
    persona: "architecte",
    style: "Scandinave",
    roomType: "Salon",
    caption:
      "Direction esth\u00e9tique valid\u00e9e en 90 secondes au lieu de 3 jours de rendu 3D.",
    beforeImage: "/imageavant.jpg",
    afterImage: "/imageapres.jpg",
  },
  {
    id: "japandi-chambre",
    persona: "particulier",
    style: "Japandi",
    roomType: "Chambre",
    caption:
      "Visualiser MON espace en Japandi, pas celui de quelqu\u2019un d\u2019autre sur Pinterest.",
    beforeImage: "/imageavant.jpg",
    afterImage: "/imageapres.jpg",
  },
  {
    id: "contemporain-sejour",
    persona: "marchand",
    style: "Contemporain",
    roomType: "S\u00e9jour",
    caption:
      "3 visuels meubl\u00e9s en 10 minutes pour la plaquette de pr\u00e9-commercialisation.",
    beforeImage: "/imageavant.jpg",
    afterImage: "/imageapres.jpg",
  },
  {
    id: "art-deco-salon",
    persona: "architecte",
    style: "Art D\u00e9co",
    roomType: "Salon",
    caption:
      "Un support de conversation client qui ancre la direction d\u00e8s le premier rendez-vous.",
    beforeImage: "/imageavant.jpg",
    afterImage: "/imageapres.jpg",
  },
  {
    id: "industriel-loft",
    persona: "marchand",
    style: "Industriel",
    roomType: "Loft",
    caption:
      "Les acqu\u00e9reurs se projettent enfin sur un plateau brut de 80\u00a0m\u00b2.",
    beforeImage: "/imageavant.jpg",
    afterImage: "/imageapres.jpg",
  },
  {
    id: "cosy-chambre",
    persona: "particulier",
    style: "Cosy",
    roomType: "Chambre",
    caption:
      "Tester l\u2019ambiance Cosy dans ma future chambre avant d\u2019acheter le moindre meuble.",
    beforeImage: "/imageavant.jpg",
    afterImage: "/imageapres.jpg",
  },
  {
    id: "mid-century-bureau",
    persona: "architecte",
    style: "Mid-Century",
    roomType: "Bureau",
    caption:
      "Proposer une ambiance Mid-Century \u00e0 un client passionn\u00e9 de design vintage.",
    beforeImage: "/imageavant.jpg",
    afterImage: "/imageapres.jpg",
  },
  {
    id: "mediterraneen-sejour",
    persona: "particulier",
    style: "M\u00e9diterran\u00e9en",
    roomType: "S\u00e9jour",
    caption:
      "Imaginer mon s\u00e9jour avec une ambiance vacances avant m\u00eame la livraison.",
    beforeImage: "/imageavant.jpg",
    afterImage: "/imageapres.jpg",
  },
];

const PERSONA_LABELS: { key: Persona; label: string }[] = [
  { key: "tous", label: "Tous" },
  { key: "architecte", label: "Architectes" },
  { key: "marchand", label: "Marchands de biens" },
  { key: "particulier", label: "Particuliers" },
];

/* ---------- JSON-LD ---------- */

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Exemples de home staging virtuel IA \u2014 Versiroom",
  description:
    "Transformations avant / apr\u00e8s r\u00e9alis\u00e9es par Versiroom sur de vrais biens immobiliers.",
  numberOfItems: EXAMPLES.length,
  itemListElement: EXAMPLES.map((ex, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: `${ex.style} \u2014 ${ex.roomType}`,
    description: ex.caption,
  })),
};

/* ---------- Components ---------- */

function ExampleCard({ example }: { example: Example }) {
  return (
    <article className="group rounded-2xl border border-foreground/8 bg-background overflow-hidden transition-shadow hover:shadow-lg hover:shadow-foreground/5">
      {/* Before / After side by side */}
      <div className="grid grid-cols-2 aspect-[16/9] overflow-hidden">
        <div className="relative overflow-hidden">
          <Image
            src={example.beforeImage}
            alt={`Avant \u2014 ${example.roomType} vide`}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover"
          />
          <span className="absolute bottom-2 left-2 text-[10px] font-medium uppercase tracking-wider bg-foreground/60 text-background px-2 py-0.5 rounded">
            Avant
          </span>
        </div>
        <div className="relative overflow-hidden">
          <Image
            src={example.afterImage}
            alt={`Apr\u00e8s \u2014 ${example.roomType} style ${example.style}`}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover"
          />
          <span className="absolute bottom-2 right-2 text-[10px] font-medium uppercase tracking-wider bg-sage text-background px-2 py-0.5 rounded">
            Apr&egrave;s
          </span>
        </div>
      </div>

      {/* Metadata */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-sage">
            {example.style}
          </span>
          <span className="text-foreground/15">&middot;</span>
          <span className="text-[11px] text-muted font-light">
            {example.roomType}
          </span>
        </div>
        <p className="text-sm text-foreground/80 font-light leading-relaxed">
          &laquo;&nbsp;{example.caption}&nbsp;&raquo;
        </p>
      </div>
    </article>
  );
}

/* ---------- Page (Server Component, SSG) ---------- */

export default function ExamplesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header — same style as homepage */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-12 px-5 sm:px-8">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            Versiroom
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/pricing"
              className="text-xs text-muted font-light hover:text-foreground transition-colors"
            >
              Tarifs
            </Link>
            <Link
              href="/#outil"
              className="text-xs font-medium text-background bg-foreground px-3 py-1.5 rounded-full hover:bg-foreground/85 transition-colors"
            >
              Essayer
            </Link>
          </nav>
        </div>
      </header>

      <main className="pt-20 pb-16 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Heading */}
          <div className="text-center mb-10 sm:mb-14">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-4">
              Exemples de home staging virtuel
            </h1>
            <p className="text-muted font-light text-base sm:text-lg max-w-2xl mx-auto">
              D&eacute;couvrez des transformations r&eacute;alis&eacute;es par
              Versiroom sur de vrais biens immobiliers.
            </p>
          </div>

          {/* Persona filter pills — client interactive island */}
          <ExamplesFilter examples={EXAMPLES} />

          {/* CTA */}
          <div className="text-center mt-14 sm:mt-20">
            <p className="text-muted font-light text-sm mb-5">
              Pr&ecirc;t &agrave; transformer vos propres espaces&nbsp;?
            </p>
            <Link
              href="/#outil"
              className="inline-block text-sm font-medium text-background bg-foreground px-6 py-3 rounded-full hover:bg-foreground/85 transition-colors"
            >
              Essayez avec vos propres photos &mdash; 3 g&eacute;n&eacute;rations
              gratuites
            </Link>
          </div>
        </div>
      </main>

      <Footer currentPage="/examples" />
    </>
  );
}

/* ---------- Client island for filtering ---------- */

function ExamplesFilter({ examples }: { examples: Example[] }) {
  /*
   * Since this is a Server Component page, we implement the filter
   * with CSS-only technique: render all cards once, use data attributes
   * and a client-side pill that toggles visibility via a tiny script.
   *
   * This keeps the page fully SSG-compatible with zero client JS bundle
   * for the cards themselves.
   */
  return (
    <>
      {/* Pills — rendered server-side, toggled client-side */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8 sm:mb-10">
        {PERSONA_LABELS.map((p) => (
          <button
            key={p.key}
            type="button"
            data-filter={p.key}
            className="examples-filter-pill text-xs font-medium px-4 py-2 rounded-full border transition-colors cursor-pointer border-foreground/10 text-muted hover:text-foreground hover:border-foreground/20 data-[active]:bg-foreground data-[active]:text-background data-[active]:border-foreground"
            data-active={p.key === "tous" ? "" : undefined}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div
        id="examples-grid"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8"
      >
        {examples.map((ex) => (
          <div key={ex.id} data-persona={ex.persona} className="examples-card">
            <ExampleCard example={ex} />
          </div>
        ))}
      </div>

      {/* Inline script for filter toggling — keeps page SSG, no "use client" */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
(function(){
  var pills=document.querySelectorAll('.examples-filter-pill');
  var cards=document.querySelectorAll('.examples-card');
  pills.forEach(function(pill){
    pill.addEventListener('click',function(){
      pills.forEach(function(p){p.removeAttribute('data-active')});
      pill.setAttribute('data-active','');
      var f=pill.getAttribute('data-filter');
      cards.forEach(function(c){
        if(f==='tous'||c.getAttribute('data-persona')===f){
          c.style.display='';
        }else{
          c.style.display='none';
        }
      });
    });
  });
})();
`,
        }}
      />
    </>
  );
}
