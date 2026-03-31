# Stratégie SEO — Versimo
> Produit par @seo — 2026-03-26
> Baseline : audit 25/03 (38/100) → corrections appliquées → score estimé post-corrections

---

## 1. Audit post-corrections (état au 26/03)

### Ce qui a été corrigé le 25/03

| Critère | Avant | Après | Score estimé |
|---|---|---|---|
| Metadata (title, OG, Twitter) | 5/10 | `metadataBase`, OG locale+siteName, Twitter Cards — OK | 9/10 |
| Structure H1/H2 | 4/10 | H1 hero correct, hiérarchie alignée | 8/10 |
| Sitemap + robots.txt | 1/10 | `app/sitemap.ts` + `app/robots.ts` présents | 9/10 |
| JSON-LD | 0/10 | Organization + SoftwareApplication + FAQPage injectés | 9/10 |
| Domaine Replit | 2/10 | Non migré — frein structurel persistant | 2/10 |
| Core Web Vitals | 5/10 | Non adressé — page.tsx reste "use client" lourd | 5/10 |
| Maillage interne | 2/10 | Aucune page cluster créée | 2/10 |
| Image OG | 0/10 | À vérifier — public/og-image.jpg présent ? | ? |

**Score estimé post-corrections : 72-76/100**

### Problèmes structurels persistants (freins critiques)

**Frein n°1 — Domaine Replit (impact : -15 pts d'autorité)**
`versimo.fr` est un sous-domaine générique partagé. Google lui attribue une confiance minimale. Aucune stratégie de backlinks ne peut compenser ce handicap structurel. Migration vers `versimo.fr` est le ROI SEO le plus élevé du projet — priorité absolue avant tout investissement contenu.

**Frein n°2 — Zéro page de destination par persona (impact : 0 trafic organique qualifié)**
L'unique URL `/` cible simultanément 3 personas avec des intentions différentes. Google ne peut pas classer une seule page pour "home staging IA marchand de biens" ET "home staging IA architecte d'intérieur" — les intentions sont trop distinctes.

**Frein n°3 — Zéro contenu indexable (impact : 0 longue traîne)**
Aucun article de blog, aucune page FAQ, aucune page style. Le site est invisible sur toutes les requêtes longue traîne (ex. "comment meubler une pièce vide pour la vendre").

---

## 2. Keyword Map

### Mots-clés primaires (volume estimé FR, difficulté qualitative)

[HYPOTHÈSE : volumes estimés par WebSearch qualitative — à confirmer via Google Search Console ou Semrush]

| Mot-clé | Intention | Cible | Difficulté estimée | URL cible |
|---|---|---|---|---|
| home staging virtuel IA | Transactionnelle | Tous | Moyenne (concurrents : Gepetto, IACrea) | `/` |
| home staging virtuel | Informationnelle + Transactionnelle | Tous | Haute (marché établi) | `/` |
| meuble pièce vide par IA | Transactionnelle | Particuliers | Faible | `/` |
| home staging IA marchand de biens | Transactionnelle | Marchands | Faible-Moyenne | `/marchand` |
| home staging virtuel architecte | Transactionnelle | Architectes | Faible | `/architecte` |
| visualiser décoration appartement IA | Informationnelle | Particuliers | Faible | `/particulier` |
| plaquette pré-commercialisation immobilier | Transactionnelle | Marchands | Faible | `/marchand` |

### Longue traîne prioritaire (difficulté faible, intention forte)

| Mot-clé longue traîne | URL cible |
|---|---|
| comment meubler une pièce vide pour la vendre | `/blog/meubler-piece-vide-vente` |
| home staging virtuel gratuit en ligne | `/` (FAQ) |
| outil IA home staging sans abonnement | `/pricing` |
| visualiser appartement meublé avant achat | `/particulier` |
| home staging IA bien à rénover | `/marchand` |
| home staging virtuel architecte d'intérieur inspiration client | `/architecte` |
| style scandinave pièce vide IA | `/styles/scandinave` (futur) |
| style japandi décoration intérieure IA | `/styles/japandi` (futur) |

### Mots-clés à éviter (trop concurrentiels sans domaine propre)

- "home staging" seul (SERP dominée par HomeByMe, MeilleursAgents, Matterport)
- "décoration intérieure IA" (requête générique, intentions mixtes)

---

## 3. Architecture SEO — Cocon sémantique

### Niveau 1 — Page pilier (existante)

**`/`** — Home staging virtuel IA | Versimo
- Cible : tous les personas, requête principale
- Liens sortants vers toutes les pages cluster (maillage descendant)

### Niveau 2 — Pages cluster personas (à créer — P0)

**`/marchand`** — Home staging IA pour marchands de biens
- Intention : transformer bien brut en plaquette de pré-commercialisation
- Mots-clés : "home staging IA marchand de biens", "plaquette pré-commercialisation IA"
- Structured data : `Service` + `FAQPage` (3 questions Thomas)

**`/architecte`** — Home staging IA pour architectes d'intérieur
- Intention : support de conversation client en 90 secondes
- Mots-clés : "home staging virtuel architecte", "inspiration deco IA chantier"
- Structured data : `Service` + `FAQPage` (3 questions Claire)

**`/particulier`** — Visualiser sa future décoration par IA
- Intention : projeter son appartement vide avant achat/emménagement
- Mots-clés : "visualiser appartement meublé IA", "décoration appartement IA gratuit"
- Structured data : `Service` + `FAQPage` (3 questions Léa)

### Niveau 3 — Pages styles (à créer — P2, phase 2)

Une page par style pour la longue traîne : `/styles/scandinave`, `/styles/japandi`, `/styles/art-deco`, etc.
- Format : galerie avant/après + description du style + CTA
- Volume estimé faible mais cumulé = trafic qualifié (recherche avec intention forte)

### Niveau 4 — Blog (à créer — P1, pipeline automatisé)

Articles piliers (1500-2000 mots) + articles clusters (800-1000 mots) — voir section 5.

---

## 4. Quick wins @fullstack (implémentables maintenant)

### QW-1 — Vérifier og-image.jpg (15 min)
Confirmer que `public/og-image.jpg` existe en 1200x630px. Sans cette image, tous les partages sociaux affichent un aperçu vide. Impact : CTR partages WhatsApp/LinkedIn immédiat.

### QW-2 — Créer `/marchand` et `/architecte` (2-3h chacune)
Pages statiques SSG avec `generateMetadata`, contenu orienté persona, CTA vers l'outil. Pas de base de données requise — contenu statique. Immédiatement indexables.
Specs complètes dans `docs/seo/metadata-templates.md` Section 1.

### QW-3 — Ajouter BreadcrumbList JSON-LD sur les pages cluster (30 min)
Dès que `/marchand` et `/architecte` existent, ajouter `BreadcrumbList` pour signaler la hiérarchie à Google.

### QW-4 — Canonical explicite sur `/` (15 min)
Ajouter `alternates: { canonical: BASE_URL }` dans le `metadata` de `layout.tsx`. Évite le duplicate content entre HTTP/HTTPS et avec/sans trailing slash.

### QW-5 — Migration domaine versimo.fr (décision @infrastructure, impact maximal)
Sans domaine propre, tout investissement SEO est plafonné. Procédure : acheter `versimo.fr`, pointer vers Replit, mettre à jour `NEXT_PUBLIC_BASE_URL`, redirections 301 de l'ancien sous-domaine. Délai d'indexation : 2-4 semaines après migration.

---

## 5. Stratégie de contenu — Pipeline automatisé

### Pourquoi un blog est nécessaire

Les concurrents (Gepetto, IACrea, Renovate Club) publient régulièrement sur le home staging IA. La longue traîne informationelle (comment + guide + comparatif) est le principal canal SEO non-brandé disponible à court terme, accessible même sans autorité de domaine élevée.

### Structure du pipeline (obligatoire — pas de production manuelle)

**Format de publication cible :** 2 articles/semaine, automatisés via IA.

**Types d'articles et templates :**

1. **Article pilier** (~1500 mots) : "Guide complet du home staging virtuel par IA pour [persona]"
   - H1 : keyword cible principal
   - H2 : sections (Pourquoi / Comment / Résultats / FAQ)
   - Maillage : liens vers pages cluster personas + pages styles
   - Structured data : `Article` + `FAQPage`

2. **Article cluster** (~800 mots) : "Home staging IA style [Japandi/Scandinave/...] : guide pratique"
   - H1 : keyword style + IA
   - Galerie avant/après (images générées sur Versimo)
   - CTA vers l'outil avec ancre vers le style concerné
   - Maillage : lien vers article pilier du style

3. **Article comparatif** (~1000 mots) : "Versimo vs [Gepetto/IACrea] : lequel choisir ?"
   - Intention : requêtes de comparaison (volume croissant dans ce secteur)
   - Neutre mais factuel — avantages Versimo documentés

**Workflow de publication automatisée :**

```
[Cron hebdomadaire] → POST /api/blog/generate
  params: { type: "cluster|pilier|comparatif", keyword: "...", styleId?: "..." }
  → GPT-4.1 génère l'article (template + brand voice)
  → Checklist qualité automatique (voir ci-dessous)
  → Si validé → POST /api/blog/publish (slug, contenu, metadata)
  → Article publié à /blog/[slug]
```

**Endpoints @fullstack à implémenter :**
- `POST /api/blog/generate` — génère un article (type, keyword, styleId en params)
- `POST /api/blog/publish` — publie dans la base de données + génère la page statique
- `GET /blog/[slug]` — page article avec `generateMetadata` dynamique + JSON-LD `Article`
- `GET /blog` — index du blog avec sitemap dynamique

**Checklist qualité automatique (avant publication) :**
- Longueur : ≥800 mots (cluster) ou ≥1500 mots (pilier)
- Densité keyword cible : 0.8-1.5%
- Maillage interne : ≥2 liens vers pages Versimo
- H1 unique contenant le keyword cible
- Meta description : 140-160 caractères, contient keyword
- Aucune mention de concurrents sans validation

---

## 6. Stratégie de backlinks

### Phase 1 — Backlinks éditoriaux gratuits (0-3 mois)

| Source | Type | Action |
|---|---|---|
| Journal de l'Agence | Article sponsorisé ou mention | Contacter la rédaction — ce journal couvre déjà Gepetto et IACrea |
| Immobilier 2.0 | Comparatif outils IA | Demande d'inclusion dans les comparatifs existants |
| MeilleursAgents (édito) | Mention dans guide home staging | Contenu informatif + lien vers Versimo |
| Maformationimmo.fr | Test produit | Proposer un accès gratuit pour test |
| Forums SeLoger/PAP | Mentions organiques | Répondre aux questions sur le home staging virtuel |

### Phase 2 — Backlinking par le contenu (3-6 mois)

- Publier des études de cas avec chiffres réels (before/after + taux de visite)
- Infographie "Home staging IA vs traditionnel : le comparatif chiffré" — format viral pour l'immobilier
- Guest post sur des blogs d'architectes d'intérieur (persona Claire)

### Phase 3 — Relations presse (6+ mois, après domaine propre)

- Communiqué de presse lors du lancement officiel sur `versimo.fr`
- Pitch Product Hunt (backlink DA élevé)
- LinkedIn Thought Leadership du fondateur sur le home staging IA

---

## 7. Optimisations techniques restantes

| Action | Priorité | Impact | Responsable |
|---|---|---|---|
| Migration domaine `versimo.fr` | P0 | +15 pts autorité | @infrastructure |
| Pages cluster personas (`/marchand`, `/architecte`, `/particulier`) | P0 | Trafic qualifié | @fullstack |
| Blog avec pipeline automatisé | P1 | Longue traîne | @fullstack |
| LCP : extraire hero en Server Component | P1 | Core Web Vitals | @fullstack |
| Image OG vérifiée 1200x630 | P1 | CTR social | @fullstack |
| Canonical explicite `/` | P2 | Duplicate content | @fullstack |
| Pages styles (`/styles/[style]`) | P2 | Longue traîne | @fullstack |
| Google Search Console activation | P2 | Monitoring | Fondateur |
| Google Business Profile | P3 | SEO local Lyon/France | Fondateur |

---

## Auto-évaluation obligatoire

- JSON-LD validables Rich Results Test : oui (Organization + SoftwareApplication + FAQPage déjà en place)
- Mots-clés avec volume documenté : partiellement — volumes estimés par WebSearch qualitative, marqués [HYPOTHÈSE]. Données précises accessibles via Google Search Console après activation.
- Cocon sémantique : structure définie (pilier → 3 clusters personas → blog → pages styles), profondeur max 2 clics depuis `/`
- Benchmark concurrentiel : oui (Gepetto +30 styles, IACrea 16€/mois, Renovate Club illimité — différenciateurs Versimo documentés)
- Compatibilité GEO : aucune cannibalisation détectée — le contenu blog peut servir les deux stratégies (articles informatifs = signal GEO + longue traîne SEO)

---

**Handoff → @fullstack**

Fichiers produits :
- `/home/user/Architecture/docs/seo/seo-strategy.md` (ce fichier)

Décisions prises :
- Cocon sémantique : `/` → `/marchand` + `/architecte` + `/particulier` → `/blog/[slug]` → `/styles/[style]`
- Mots-clés primaires : "home staging virtuel IA" (transactionnel), "home staging IA marchand de biens" (ciblé)
- Pipeline blog : 2 articles/semaine via `POST /api/blog/generate` + `POST /api/blog/publish`
- Domaine `versimo.fr` : recommandé P0 avant tout investissement contenu

Actions immédiates pour @fullstack :
1. Vérifier `public/og-image.jpg` existe en 1200x630px
2. Créer `app/marchand/page.tsx` avec `generateMetadata` — specs dans `docs/seo/metadata-templates.md`
3. Créer `app/architecte/page.tsx` avec `generateMetadata`
4. Ajouter `alternates: { canonical: BASE_URL }` dans `layout.tsx`
5. Implémenter `/api/blog/generate` + `/api/blog/publish` + `/blog/[slug]` pour le pipeline automatisé

Points d'attention :
- `page.tsx` est `"use client"` — toutes les pages cluster DOIVENT être Server Components (SSG) pour être indexées
- Les pages cluster doivent linker vers `/` ET entre elles (maillage horizontal)
- Sans domaine propre, l'impact de toutes ces actions est plafonné — escalader la décision `versimo.fr` à l'équipe
