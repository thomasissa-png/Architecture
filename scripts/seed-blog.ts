/**
 * Seed script — insère 3 articles de blog dans la base PostgreSQL.
 *
 * Usage :
 *   npx tsx scripts/seed-blog.ts
 *
 * Nécessite DATABASE_URL dans l'environnement.
 */

import { createBlogPost, getBlogPostBySlug } from "../lib/blog";

// ─── Article 1 : Pilier — "home staging virtuel IA" ─────────────────────────

const ARTICLE_1_CONTENT = `## Qu'est-ce que le home staging virtuel par IA ?

Le home staging virtuel par IA consiste à **transformer des photos de pièces vides en visuels meublés et décorés**, grâce à l'intelligence artificielle. Contrairement au home staging traditionnel — qui nécessite de louer du mobilier physique ou de faire appel à un infographiste 3D — la version IA génère un résultat en quelques dizaines de secondes, à partir d'une simple photo.

Le principe est simple : vous uploadez une photo de votre pièce vide, vous choisissez un style de décoration, et l'IA produit un visuel réaliste de la pièce meublée. Pas de logiciel 3D à maîtriser, pas de délai de 48 heures, pas de devis à négocier.

## Comment fonctionne la technologie ?

Les outils de home staging IA utilisent des **modèles de génération d'images** entraînés sur des millions de photos d'intérieurs. Les plus avancés fonctionnent en plusieurs passes :

1. **Analyse de la géométrie** — L'IA identifie les murs, le sol, le plafond, les fenêtres et les portes. Cette étape est cruciale pour que les meubles soient placés de manière réaliste.
2. **Application des finitions** — Selon le style choisi, l'IA modifie les surfaces : couleur des murs, type de sol (parquet, carrelage, béton), luminaire de plafond.
3. **Ajout du mobilier** — Des meubles, textiles et éléments de décoration sont ajoutés en respectant les proportions de la pièce et la perspective de la photo.

Les meilleurs outils préservent la **géométrie architecturale originale** : angle de vue, position des fenêtres, hauteur sous plafond, poutres apparentes. C'est ce qui distingue un résultat crédible d'un montage approximatif.

## Home staging IA vs home staging traditionnel

| Critère | Home staging traditionnel | Home staging virtuel IA |
|---|---|---|
| **Délai** | 2 à 5 jours | 30 à 90 secondes |
| **Coût par pièce** | 200 à 500 € | 0 à 5 € |
| **Nombre de styles testables** | 1 (celui du prestataire) | 10 à 80+ selon l'outil |
| **Qualité visuelle** | Excellente (3D manuelle) | Bonne à excellente (selon l'outil) |
| **Préservation de l'architecture** | Parfaite (modélisation exacte) | Variable selon la technologie |
| **Accessibilité** | Nécessite un prestataire | Autonome, en ligne |

Le home staging traditionnel reste pertinent pour les **projets haut de gamme** où chaque détail compte (promoteurs, biens >1M€). Mais pour la grande majorité des cas d'usage — annonces immobilières, pré-commercialisation, inspiration déco — **l'IA offre un rapport qualité/prix imbattable**.

## Qui utilise le home staging virtuel IA ?

### Les professionnels de l'immobilier

Les [marchands de biens](/marchand) et agents immobiliers sont les premiers utilisateurs. Leur besoin est concret : **les acquéreurs ne se projettent pas sur des photos de murs vides**. Un bien présenté meublé se vend en moyenne 73% plus vite selon la National Association of Realtors (étude sur le marché américain, chiffre transposé avec prudence au marché français).

### Les architectes d'intérieur

Les [architectes et décorateurs](/architecte) utilisent le home staging IA comme **outil d'inspiration et de communication client**. Au lieu de passer 2 jours sur une planche d'ambiance en 3D, ils génèrent 3 variantes en 5 minutes pour valider une direction esthétique avec leur client.

### Les particuliers

Les [particuliers](/particulier) qui achètent ou rénovent un bien veulent **voir à quoi LEUR pièce ressemblerait** dans différents styles. Pinterest montre de belles photos, mais jamais dans votre appartement. Le home staging IA comble ce fossé.

## Comment choisir son outil de home staging IA ?

Cinq critères à évaluer avant de choisir :

1. **Qualité de la préservation architecturale** — L'IA respecte-t-elle l'angle de vue, les fenêtres, les poutres ? Testez avec une photo de pièce avec des éléments structurels marqués.
2. **Nombre et qualité des styles** — Un outil avec 12 styles curatés par des designers vaut mieux que 80 styles génériques mal exécutés.
3. **Rapidité** — Un résultat en 30 secondes vs 5 minutes fait une vraie différence dans un flux de travail professionnel.
4. **Tarification adaptée** — À la photo, par abonnement, ou freemium ? Calculez votre coût par usage réel.
5. **Cible** — Certains outils sont conçus pour les agents immobiliers américains, d'autres pour le marché français. La langue de l'interface, les styles proposés et le support client comptent.

## L'avenir du home staging virtuel

Le marché évolue rapidement. Les tendances pour 2026-2027 :

- **Pipelines multi-passes** : au lieu de tout générer en une fois, les meilleurs outils séparent le traitement des surfaces et du mobilier pour une meilleure fidélité.
- **Personnalisation par pièce** : adapter les meubles au type de pièce (salon, chambre, bureau) et à ses dimensions réelles.
- **Intégration immobilière** : génération directe depuis les logiciels de transaction immobilière et les portails d'annonces.
- **Catalogues de meubles réels** : possibilité de placer des meubles achetables directement dans la visualisation.

---

**Envie de tester ?** [Versiroom](/) génère des visuels meublés de qualité architecte en 90 secondes, avec 12 styles curatés par des experts. Uploadez votre première photo gratuitement.`;

// ─── Article 2 : Comparatif ─────────────────────────────────────────────────

const ARTICLE_2_CONTENT = `## Pourquoi comparer les outils de home staging IA ?

Le marché du home staging virtuel par IA s'est structuré en 2025-2026 avec l'arrivée de plusieurs acteurs français et internationaux. Chaque outil a ses forces et ses compromis. Ce comparatif vous aide à **choisir celui qui correspond à votre besoin et votre budget**.

> **Méthodologie** : nous avons analysé les informations publiques de chaque outil (sites web, pages pricing, fonctionnalités annoncées) en mars 2026. Les prix et fonctionnalités peuvent évoluer.

## Tableau comparatif synthétique

| Critère | **Versiroom** | **Gepetto** | **Renovate Club** | **InterieurAI** | **Pedra** |
|---|---|---|---|---|---|
| **Origine** | France | Bordeaux, France | France (KRAFTECH) | France | Europe |
| **Cible principale** | Architectes, marchands, particuliers | Professionnels immobilier | Professionnels immobilier | Mix pros/particuliers | Agents immobiliers |
| **Nombre de styles** | 12 curatés par experts | 30+ | 80+ | ~50 | Non communiqué |
| **Technologie** | Pipeline 2 passes (surfaces + mobilier) | Non communiqué | Non communiqué | Non communiqué | Non communiqué |
| **Tarif entrée** | Gratuit (essai) | Non affiché publiquement | 9,99 €/mois illimité | Dès 1,25 €/photo | 29 €/mois |
| **Abonnement Pro** | 29 €/mois | À demander | 9,99 €/mois | Variable | 29 €/mois |
| **Intérieurs** | Oui | Oui | Oui | Oui | Oui |
| **Extérieurs** | Oui (façades) | Oui | Oui (façades, jardins, piscines) | Non confirmé | Oui |
| **App mobile** | Web responsive | iOS + Android + Web | Web | Web | Web |
| **Langue interface** | Français | Français | Français | Français | Multilingue |

## Analyse détaillée par outil

### Versiroom

**Forces :**
- **Pipeline 2 passes unique** : sépare le traitement des surfaces (murs, sol, plafond) et du mobilier. Résultat : meilleure préservation de la géométrie architecturale originale.
- **12 styles curatés par des experts nommés** : chaque style (Scandinave, Japandi, Art Déco, Industriel, etc.) a été conçu avec des descripteurs précis de mobilier, matériaux et finitions.
- **Triple cible explicite** : pages dédiées pour les [architectes](/architecte), les [marchands de biens](/marchand) et les [particuliers](/particulier).
- **Essai gratuit sans inscription**.

**Limites :**
- Catalogue de 12 styles (vs 30-80 chez les concurrents) — choix de la curation vs le volume.
- Outil récent, en phase de lancement.

**Idéal pour :** les professionnels qui privilégient la qualité architecturale et la préservation de la géométrie sur le volume de styles.

### Gepetto

**Forces :**
- Fondé par un architecte d'intérieur (David Brami) et un ingénieur IA — **crédibilité architecturale forte**.
- 30+ styles conçus par des designers professionnels.
- Fonctionnalités larges : staging, rénovation virtuelle, suppression d'objets, retouche, peinture des murs.
- Disponible en app iOS et Android en plus du web.

**Limites :**
- Pricing non affiché publiquement sur le site — nécessite une prise de contact.
- Positionnement exclusivement professionnel (pas de cible particulier assumée).

**Idéal pour :** les professionnels de l'immobilier qui cherchent un outil français avec une large palette de fonctionnalités et un ancrage architecte d'intérieur.

### Renovate Club

**Forces :**
- **Prix le plus bas du marché français** : 9,99 €/mois en illimité, sans engagement.
- Couverture large : intérieurs + extérieurs (façades, jardins, piscines, terrasses).
- Volume d'adoption fort : 10 000+ utilisateurs, 1 million+ visuels générés.
- 80+ styles disponibles.

**Limites :**
- Le positionnement "illimité et accessible" peut être perçu comme entrée de gamme.
- Pas de communication sur la qualité architecturale ou la technologie IA utilisée.

**Idéal pour :** les professionnels qui ont besoin de volume (nombreuses annonces à meubler) à budget minimal.

### InterieurAI

**Forces :**
- Tarif ultra-compétitif à la photo (dès 1,25 €).
- ~50 styles disponibles.
- Essai gratuit.
- Bonne couverture stylistique.

**Limites :**
- Marque peu mémorable, site sans personnalité forte.
- Cible floue entre particuliers et professionnels.
- Pas de différenciation technologique visible.

**Idéal pour :** l'usage occasionnel — quelques photos à meubler sans engagement d'abonnement.

### Pedra

**Forces :**
- Rapidité mise en avant (25 secondes par image).
- Base utilisateurs significative (20 000+ professionnels).
- Tarif compétitif pour les pros (29 €/mois).

**Limites :**
- Nombre de styles limité dans la documentation publique.
- Messaging générique, peu différencié.
- Focus exclusif immobilier.

**Idéal pour :** les agents immobiliers qui cherchent un outil rapide et simple, sans besoin de variété stylistique.

## Comment choisir ?

Le choix dépend de votre profil :

- **Vous êtes architecte d'intérieur** et la qualité du rendu est votre priorité → testez **Versiroom** (préservation géométrie) et **Gepetto** (ancrage architecte).
- **Vous êtes marchand de biens** avec 8-12 opérations/an → **Versiroom** (29 €/mois, qualité pro) ou **Renovate Club** (9,99 €/mois, volume illimité).
- **Vous êtes agent immobilier** avec beaucoup d'annonces → **Renovate Club** (illimité) ou **Pedra** (rapidité).
- **Vous êtes particulier** → commencez par les essais gratuits de **Versiroom** et **InterieurAI**.

Le conseil universel : **testez avec votre propre photo** avant de vous engager. La qualité du rendu varie selon le type de pièce, l'éclairage et l'angle de vue.

---

**Testez Versiroom gratuitement** — uploadez une photo et comparez le résultat avec les autres outils. [Essayer maintenant](/).`;

// ─── Article 3 : Cluster marchand ────────────────────────────────────────────

const ARTICLE_3_CONTENT = `## Le problème : des plaquettes qui coûtent cher et arrivent trop tard

Vous venez d'acquérir un bien à rénover. Les travaux commencent dans 3 semaines, mais vous devez **pré-commercialiser maintenant** pour sécuriser vos acquéreurs. Le scénario classique :

1. Vous contactez un home stager ou un infographiste 3D
2. Devis : **200 à 500 € par pièce**, minimum 4-5 pièces par bien
3. Délai : **48 à 72 heures** pour recevoir les visuels
4. Total : **1 000 à 2 500 €** par opération, avant même d'avoir signé un compromis

Sur 8 à 12 opérations par an, la facture de home staging représente **8 000 à 30 000 € annuels**. Et si les visuels ne correspondent pas au positionnement du bien, il faut recommencer.

Pendant ce temps, vos plaquettes commerciales montrent des **murs vides et des sols bruts**. Les acquéreurs potentiels ne se projettent pas. Les visites s'éternisent. Le bien stagne.

## La solution : un dossier de pré-commercialisation en 90 secondes

Le home staging virtuel par IA change fondamentalement l'équation pour les [marchands de biens](/marchand). Le processus :

1. **Photographiez le bien** avec votre smartphone (iPhone, Android — peu importe)
2. **Uploadez les photos** sur [Versiroom](/) — 5 photos maximum par session
3. **Choisissez un style** parmi 12 ambiances curatées (Scandinave, Contemporain, Haussmannien, Industriel, etc.)
4. **Récupérez les visuels HD** en 30 à 90 secondes

En 10 minutes, vous avez un dossier complet avec des visuels meublés pour chaque pièce. Pas de rendez-vous, pas de brief créatif, pas d'allers-retours.

## Le ROI concret : 29 € vs 500 € par planche

Faisons le calcul sur une opération type — un T3 de 65 m² avec salon, 2 chambres, cuisine et salle de bain :

| Poste | Home stager traditionnel | Versiroom (Pro 29 €/mois) |
|---|---|---|
| Salon | 350 € | Inclus |
| Chambre 1 | 250 € | Inclus |
| Chambre 2 | 250 € | Inclus |
| Cuisine | 350 € | Inclus |
| **Total par bien** | **1 200 €** | **29 €/mois** |
| **Total annuel (10 opérations)** | **12 000 €** | **348 €/an** |
| **Économie** | — | **11 652 €/an** |

Même en comparant avec les solutions les moins chères du marché (1,25 €/photo chez certains concurrents), l'abonnement Versiroom Pro à 29 €/mois est rentabilisé dès la **deuxième opération** du mois.

## Cas d'usage : la pré-commercialisation avant travaux

Le scénario le plus fréquent pour un marchand de biens :

### Étape 1 — Jour de l'acquisition

Vous visitez le bien avec votre téléphone. Vous prenez 3-5 photos par pièce. Le bien est dans son état brut : murs abîmés, sol béton, pas de luminaire.

### Étape 2 — Le soir même

Vous uploadez les photos sur Versiroom. Le pipeline 2 passes fait le travail :
- **Passe 1** : l'IA applique les finitions de surface (murs blancs, parquet chêne, luminaire contemporain) tout en préservant la géométrie de la pièce.
- **Passe 2** : l'IA ajoute le mobilier (canapé, table, tapis, plantes) en respectant les proportions et la profondeur de la pièce.

### Étape 3 — Diffusion immédiate

Vos visuels sont prêts. Vous les intégrez dans :
- La **plaquette commerciale** PDF pour les investisseurs
- Les **annonces en ligne** (SeLoger, LeBonCoin, portails pros)
- Les **messages WhatsApp** aux acquéreurs de votre réseau (partage en un clic depuis Versiroom)

### Résultat

Les acquéreurs voient un **intérieur meublé de qualité** au lieu de murs vides. Ils se projettent. Les offres arrivent plus vite. Votre cycle de pré-commercialisation passe de **2-3 semaines à 24 heures**.

## Les 12 styles adaptés au marché immobilier

Tous les styles ne se valent pas pour la pré-commercialisation. Les **plus efficaces** pour les marchands de biens :

- **Contemporain** — le plus universel, plaît au plus grand nombre d'acquéreurs
- **Scandinave** — lumineux, aéré, idéal pour les petites surfaces
- **Haussmannien** — parfait pour les biens parisiens avec moulures et cheminées
- **Industriel** — pour les lofts et espaces atypiques (anciens ateliers, commerces transformés)

Le conseil : sur un même bien, générez **2 styles différents** pour le même espace. Proposez les 2 versions aux acquéreurs — cela montre la polyvalence du bien et augmente les chances de coup de cœur.

## Ce que le home staging IA ne remplace pas

Soyons clairs sur les limites :

- **Le home staging IA ne remplace pas un architecte d'intérieur** pour un projet de rénovation haut de gamme. Il génère de l'inspiration et des visuels de pré-commercialisation, pas des plans d'exécution.
- **Les visuels sont des projections**, pas des engagements contractuels. Mentionnez-le dans vos plaquettes.
- **La qualité dépend de la photo d'entrée** : un bon éclairage naturel et un angle droit donnent de meilleurs résultats qu'une photo sombre prise en contre-plongée.

## Passez à l'action

Si vous êtes [marchand de biens](/marchand), le calcul est simple : un abonnement Pro à 29 €/mois vous fait économiser des milliers d'euros par an en frais de home staging, tout en accélérant votre cycle de pré-commercialisation.

**[Testez gratuitement avec votre première photo →](/)**

Uploadez une photo de votre dernier bien acquis et jugez par vous-même la qualité du rendu. Aucune inscription requise pour le premier essai.`;

// ─── Seed runner ─────────────────────────────────────────────────────────────

const ARTICLES = [
  {
    slug: "home-staging-virtuel-ia-guide-complet-2026",
    title: "Home staging virtuel par IA : le guide complet 2026",
    content: ARTICLE_1_CONTENT,
    meta_description:
      "Découvrez le home staging virtuel par IA : fonctionnement, avantages vs traditionnel, comment choisir son outil. Guide complet 2026 par Versiroom.",
    keyword: "home staging virtuel IA",
    persona: "tous",
    published: true,
  },
  {
    slug: "comparatif-outils-home-staging-ia-2026",
    title:
      "Comparatif des outils de home staging IA en 2026 : Versiroom, Gepetto, Renovate Club et plus",
    content: ARTICLE_2_CONTENT,
    meta_description:
      "Comparatif factuel des outils de home staging IA français en 2026 : prix, styles, technologie. Versiroom, Gepetto, Renovate Club, InterieurAI, Pedra.",
    keyword: "comparatif home staging IA",
    persona: "tous",
    published: true,
  },
  {
    slug: "home-staging-ia-marchand-de-biens",
    title:
      "Home staging IA pour marchands de biens : pré-commercialiser en 90 secondes",
    content: ARTICLE_3_CONTENT,
    meta_description:
      "Marchands de biens : générez des visuels meublés en 90 secondes au lieu de payer 500€ par planche. ROI, cas d'usage et guide pratique.",
    keyword: "home staging IA marchand de biens",
    persona: "thomas",
    published: true,
  },
];

async function seed() {
  console.log("--- Seed blog : insertion de 3 articles ---\n");

  for (const article of ARTICLES) {
    const existing = await getBlogPostBySlug(article.slug);
    if (existing) {
      console.log(`[SKIP] "${article.slug}" existe déjà (id=${existing.id})`);
      continue;
    }

    const post = await createBlogPost(article);
    console.log(`[OK]   "${post.slug}" créé (id=${post.id})`);
  }

  console.log("\n--- Seed terminé ---");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
