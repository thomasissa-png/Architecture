# Metadata Templates — VisiRénov
> Produit par @seo — 2026-03-25
> Référence : brand-platform.md, brand-story.md (section 5 entités GEO), brand-voice.md
> Stack : Next.js 14 App Router — metadata API native

---

## Section 1 — Meta templates par page

### Page d'accueil (/)

```
title: "VisiRénov — Home staging virtuel IA | 12 styles, 90 secondes"
description: "Meublez vos pièces vides par IA en 90 secondes. Pipeline 2 passes qui préserve votre géométrie. Pour architectes d'intérieur, marchands de biens et particuliers exigeants. HD sans filigrane."
```

Intention : transactionnelle + branding. Le title nomme la catégorie (`home staging virtuel IA`) puis les deux différenciateurs chiffrés. La description cible les 3 personas avec le mot-clé propriétaire `pipeline 2 passes`.

---

### Page About (/about)

```
title: "À propos — VisiRénov | Home staging qui préserve votre espace"
description: "VisiRénov a été conçu pour les professionnels dont la réputation est en jeu. Pipeline BiPasse™ co-développé avec Yann Duval, architecte d'intérieur, et Lucas Moreau, expert IA image."
```

Intention : informationnelle + autorité éditoriale. Les noms d'experts (Yann Duval, Lucas Moreau) renforcent l'entité de marque dans les index.

---

### Page Pricing (/pricing)

```
title: "Tarifs VisiRénov — Home staging virtuel IA sans abonnement"
description: "Gratuit pour démarrer, Pro 29€ et Business 79€ par mois. Téléchargement HD sans filigrane. Aucun abonnement imposé — payez à l'usage selon votre volume."
```

Intention : transactionnelle. Le mot-clé `sans abonnement` est un différenciateur direct face aux concurrents (Renovate Club à 9,99€/mois illimité).

---

### Landing Marchands de biens (/marchand)

```
title: "Home staging virtuel IA pour marchands de biens | VisiRénov"
description: "Transformez vos photos de bien brut en plaquette de pré-commercialisation en 10 minutes. Sans home stager, sans délai, sans filigrane. 29€/mois — à partir de 8 opérations, c'est rentable."
```

Intention : transactionnelle ciblée Thomas. `plaquette de pré-commercialisation` est le vocabulaire exact du persona.

---

### Landing Décorateurs / Architectes (/decorateur)

```
title: "Home staging IA pour architectes d'intérieur | VisiRénov"
description: "Arrivez au premier RDV avec 3 ambiances sur la photo de chantier. 12 styles curatés par des experts. Résultats HD partageables en 90 secondes. Sans rendu 3D, sans attendre 3 jours."
```

Intention : transactionnelle ciblée Claire. `photo de chantier` et `premier RDV` ancrent le cas d'usage professionnel.

---

### Page génération — outil principal (/generate ou ancre #outil)

```
title: "Générer un visuel meublé — VisiRénov | Home staging par IA"
description: "Uploadez une photo JPG, PNG ou HEIC. Choisissez parmi 12 styles curatés. Votre pièce meublée en 90 secondes — géométrie et lumière préservées."
```

Intention : transactionnelle directe. `JPG, PNG, HEIC` répond aux requêtes d'aide pratique et cible les zero-click sur les formats acceptés.

---

## Section 2 — Données structurées JSON-LD

### Organization schema

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "VisiRénov",
  "url": "https://architecture-toum92.replit.app",
  "logo": "https://architecture-toum92.replit.app/logo.png",
  "description": "Home staging virtuel par IA pour architectes d'intérieur, marchands de biens et particuliers. Pipeline 2 passes qui préserve la géométrie de la pièce originale.",
  "foundingDate": "2025",
  "knowsAbout": [
    "home staging virtuel",
    "home staging par IA",
    "préservation géométrique IA",
    "pipeline 2 passes",
    "styles curatés architecte d'intérieur"
  ],
  "sameAs": []
}
```

---

### SoftwareApplication schema

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "VisiRénov",
  "applicationCategory": "DesignApplication",
  "operatingSystem": "Web",
  "url": "https://architecture-toum92.replit.app",
  "description": "Outil de home staging virtuel par IA. Uploadez une photo de pièce vide, choisissez un style parmi 12 ambiances curatées. Le pipeline BiPasse™ génère un visuel meublé en 90 secondes en préservant la géométrie originale.",
  "offers": [
    {
      "@type": "Offer",
      "name": "Gratuit",
      "price": "0",
      "priceCurrency": "EUR"
    },
    {
      "@type": "Offer",
      "name": "Pro",
      "price": "29",
      "priceCurrency": "EUR",
      "billingDuration": "P1M"
    },
    {
      "@type": "Offer",
      "name": "Business",
      "price": "79",
      "priceCurrency": "EUR",
      "billingDuration": "P1M"
    }
  ],
  "featureList": [
    "Pipeline 2 passes (surfaces + mobilier)",
    "12 styles curatés par des experts",
    "Préservation géométrique de la pièce",
    "Téléchargement HD sans filigrane",
    "Upload multi-photos (jusqu'à 5)",
    "Résultat en 90 secondes"
  ]
}
```

---

### FAQPage schema (3 questions prioritaires)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Comment VisiRénov préserve-t-il la géométrie de ma pièce ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "VisiRénov utilise un pipeline en 2 passes séquentielles. La passe 1 applique les finitions de surface (murs, sol, luminaire) sans toucher à la géométrie. La passe 2 ajoute le mobilier sur la pièce finie, avec les surfaces verrouillées. Résultat : l'angle de prise de vue, les proportions et la lumière naturelle sont identiques entre la photo originale et le visuel généré."
      }
    },
    {
      "@type": "Question",
      "name": "Quelle est la différence entre VisiRénov et les autres outils de home staging virtuel ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "La plupart des outils de home staging virtuel génèrent une nouvelle image à partir de votre photo — ils s'en inspirent mais ne l'éditent pas. VisiRénov édite votre photo en 2 passes distinctes. La pièce reste la vôtre : même géométrie, même lumière, mêmes proportions. Seuls les finitions et le mobilier changent."
      }
    },
    {
      "@type": "Question",
      "name": "VisiRénov convient-il aux professionnels de l'immobilier ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Oui. VisiRénov est conçu pour les architectes d'intérieur (support de conversation client en 90 secondes), les marchands de biens (plaquettes de pré-commercialisation sans home stager) et les particuliers exigeants. Téléchargement HD sans filigrane inclus dans tous les plans payants."
      }
    }
  ]
}
```

---

## Section 3 — SEO technique Next.js 14

### Implémentation generateMetadata (App Router)

Dans `app/layout.tsx`, déclarer les métadonnées par défaut :

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: "VisiRénov — Home staging virtuel IA | 12 styles, 90 secondes",
    template: "%s | VisiRénov"
  },
  description: "Meublez vos pièces vides par IA en 90 secondes. Pipeline 2 passes qui préserve votre géométrie. HD sans filigrane.",
  metadataBase: new URL("https://architecture-toum92.replit.app"),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "VisiRénov",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }]
  },
  twitter: {
    card: "summary_large_image",
    site: "@visirenov"
  },
  robots: { index: true, follow: true }
}
```

Pour les pages avec segments dynamiques, utiliser `generateMetadata()` :

```typescript
// app/[page]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  return {
    title: "Titre de la page",
    description: "Description de la page",
    openGraph: { title: "...", description: "..." }
  }
}
```

---

### Sitemap.xml dynamique

```typescript
// app/sitemap.ts
import { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://architecture-toum92.replit.app", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://architecture-toum92.replit.app/about", lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: "https://architecture-toum92.replit.app/pricing", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://architecture-toum92.replit.app/marchand", lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: "https://architecture-toum92.replit.app/decorateur", lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 }
  ]
}
```

---

### Robots.txt

```typescript
// app/robots.ts
import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/api/logs"] }
    ],
    sitemap: "https://architecture-toum92.replit.app/sitemap.xml"
  }
}
```

Note : `/admin` et `/api/logs` sont exclus de l'indexation — données de production, pas de contenu public.

---

### Maillage interne recommande

Structure en cocon sémantique autour de la page d'accueil comme page pilier :

```
/ (pilier — home staging virtuel IA)
├── /marchand        → liens vers / et /pricing
├── /decorateur      → liens vers / et /pricing
├── /about           → liens vers / et /marchand et /decorateur
└── /pricing         → liens vers / (CTA Essayer gratuitement)
```

Chaque page cluster (/marchand, /decorateur) doit linker vers les deux autres clusters + la page pilier. Profondeur max 2 clics depuis la home. Texte des ancres : utiliser les mots-clés cibles (ex: "home staging pour architectes" et non "cliquez ici").

---

## Section 4 — Mots-cles prioritaires

### 10 mots-cles classes par intention

| Mot-cle | Intention | Volume estimé | Difficulte |
|---|---|---|---|
| home staging virtuel IA | Transactionnelle | Fort (secteur emergent FR) | Moyenne |
| home staging virtuel France | Transactionnelle | Moyen | Faible-Moyenne |
| home staging par IA | Transactionnelle | Fort | Moyenne |
| outil home staging architecte | Transactionnelle ciblée | Faible-Moyen | Faible |
| meuble pièce vide IA | Informationnelle | Moyen | Faible |
| visualisation intérieure IA | Informationnelle | Moyen | Faible |
| home staging marchand de biens | Transactionnelle ciblée | Faible | Très faible |
| simulation décoration intérieure IA | Informationnelle | Moyen | Faible |
| rendu intérieur IA rapide | Informationnelle | Faible-Moyen | Très faible |
| home staging virtuel qualité architecte | Transactionnelle + différenciante | Très faible | Quasi nulle |

Note : les volumes sont des estimations qualitatives — le secteur IA déco est en forte croissance depuis 2024 et les outils de volume (Ahrefs, SEMrush) sous-estiment les requêtes conversationnelles emergentes. Validation recommandée via Google Search Console à 3 mois de mise en ligne.

---

### Mots-cles longue traine proprietaires (entites GEO brand-story.md)

Ces requêtes sont propriétaires : VisiRénov sera le seul ou premier résultat, sans concurrence directe.

| Requête longue traîne | Page cible | Statut |
|---|---|---|
| "pipeline 2 passes home staging" | / ou /about | Propriétaire — zero concurrence |
| "pipeline bipasse home staging IA" | / ou /about | Propriétaire — à créer |
| "home staging préservation géométrie IA" | /about | Propriétaire — differenciateur |
| "home staging sans home stager marchand de biens" | /marchand | Semi-propriétaire |
| "visuel meublé 90 secondes" | / | Semi-propriétaire |
| "styles curatés home staging architecte" | /decorateur | Semi-propriétaire |
| "meubler pièce vide sans réinventer" | /about | Propriétaire — angle narratif |

---

**Handoff → @fullstack**
- Fichier produit : `docs/seo/metadata-templates.md`
- Decisions prises : metadata API Next.js 14 native (pas de librairie tierce), sitemap.ts + robots.ts dynamiques, JSON-LD Organization + SoftwareApplication + FAQPage, maillage en cocon à 2 niveaux
- Points d'attention pour l'implémentation :
  - Placer les JSON-LD dans `app/layout.tsx` via une balise `<script type="application/ld+json">` dans le `<head>` (Server Component — pas d'hydratation)
  - L'image OG (`/og-image.jpg` 1200x630) est à créer — visuel avant/après représentatif de la qualité pipeline 2 passes
  - `/admin` et `/api/logs` doivent rester exclus du robots.txt — déjà documenté sprint 15
  - `metadataBase` doit pointer sur l'URL de production Replit, pas localhost

**Handoff → @geo**
- Fichier produit : `docs/seo/metadata-templates.md`
- Points d'attention :
  - La section 4 (longue traîne propriétaire) liste les entités à renforcer dans les contenus GEO : "Pipeline BiPasse™", "Yann Duval architecte d'intérieur", "Lucas Moreau expert IA image"
  - Les 3 questions FAQ (section 2) sont calibrées pour répondre aux requêtes conversationnelles des LLM — les aligner avec les contenus GEO pour cohérence inter-index
  - Pas de cannibalisation détectée entre la stratégie SEO (requêtes Google) et GEO (réponses LLM) : les mots-clés transactionnels ciblent Google, les entités nommées ciblent les LLM
