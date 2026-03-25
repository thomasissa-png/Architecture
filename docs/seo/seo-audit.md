# Audit SEO Technique — VisiRénov
> Produit par @seo — 2026-03-25
> Stack auditée : Next.js 14 App Router, Replit hosting
> URL : https://architecture-toum92.replit.app/
> Référence : audit code source (`layout.tsx`, `page.tsx`, `next.config.mjs`) + `docs/seo/metadata-templates.md`

---

## Tableau des 10 critères

| # | Critère | Note | Statut | Constat |
|---|---|---|---|---|
| 1 | Metadata (title, description, OG, Twitter) | 5/10 | PARTIEL | Title et description présents mais non alignés sur `metadata-templates.md`. OG sans `locale`, sans `siteName`, sans image. Twitter Cards absentes. `metadataBase` manquant — URLs OG relatives non résolues. |
| 2 | Structure HTML (H1, hiérarchie, sémantique) | 4/10 | KO | H1 = "VisiRénov" (logo texte dans le header). Le titre principal du hero (`h2`) est "Visualisez vos espaces meublés par l'IA" — hiérarchie inversée. La section tool a un `h3` sans H2 parent. `use client` sur `page.tsx` = le contenu est rendu côté client, non indexable en SSR. |
| 3 | Performance (images, lazy loading, bundle) | 5/10 | PARTIEL | Pas de dossier `public/` : aucune image OG, aucun logo. Le hero utilise des SVG inline (pas d'images réelles = bon pour les performances mais zéro signal visuel pour Google). `page.tsx` est un Client Component lourd (tout le JS au premier chargement). Pas de `next/image`. |
| 4 | Indexation (sitemap, robots.txt, canonical) | 1/10 | KO | `app/sitemap.ts` absent. `app/robots.ts` absent. `public/sitemap.xml` absent. `public/robots.txt` absent. `public/` n'existe pas. Google découvre le site sans guidance d'exploration. Aucune URL canonique déclarée. |
| 5 | Mobile (viewport, responsive) | 8/10 | OK | `<html lang="fr">` présent. Design mobile-first avec classes Tailwind `sm:` cohérentes. Header fixe, CTA accessible. Pas de `viewport` meta explicite dans `layout.tsx` — Next.js App Router l'injecte automatiquement, donc OK. |
| 6 | Données structurées JSON-LD | 0/10 | KO | Aucun JSON-LD implémenté. Les schemas Organization, SoftwareApplication et FAQPage sont spécifiés dans `metadata-templates.md` mais non injectés dans le code. Opportunité Rich Results manquée (étoiles, FAQ en SERP). |
| 7 | Maillage interne | 2/10 | KO | Une seule page existante (`/`). Les pages clusters définies dans `metadata-templates.md` (`/marchand`, `/decorateur`, `/about`, `/pricing`) n'existent pas. Le nav contient deux ancres (#tarifs, #outil) mais pas de liens vers des pages distinctes. Cocon sémantique non implémenté. |
| 8 | Accessibilité SEO (alt text, lang, hreflang) | 6/10 | PARTIEL | `lang="fr"` sur `<html>` — correct. SVG hero sans `aria-label` (contenu décoratif, acceptable si `role="presentation"`). Pas d'images réelles donc pas de problème d'alt text, mais aussi aucun contenu visuel indexable. Pas de hreflang (site mono-langue — normal). |
| 9 | Core Web Vitals estimées (LCP, CLS, INP) | 5/10 | PARTIEL | **LCP** : probable dégradation — `page.tsx` est un Client Component, le LCP est différé à l'hydratation. Le hero SVG inline est léger mais pas d'image réelle pour ancrer le LCP. **CLS** : faible risque (layout Tailwind stable, pas d'images sans dimensions). **INP** : risque élevé — gestion d'état React complexe (15+ useState), génération IA longue durée. Replit hosting : latence serveur variable. |
| 10 | Domaine (sous-domaine Replit) | 2/10 | KO | `architecture-toum92.replit.app` est un sous-domaine générique. Google traite les sous-domaines Replit comme du contenu hébergé partagé — confiance de domaine faible, pas d'historique d'autorité. Aucun signal d'entité de marque. Risque de déréférencement si Replit change ses politiques. |

**Score global : 38/100**

---

## Top 5 actions prioritaires

### P0 — Créer `app/sitemap.ts` et `app/robots.ts`
Le code est fourni clé en main dans `metadata-templates.md` (Section 3). Sans ces fichiers, Google explore le site au hasard et peut indexer `/api/` et `/admin`. Temps d'implémentation : 15 minutes. Impact SEO : immédiat dès le prochain crawl Google.

### P1 — Aligner `layout.tsx` sur `metadata-templates.md`
Remplacer le `metadata` actuel par le template Section 3 de `metadata-templates.md` : ajout de `metadataBase`, `title.template`, `openGraph.locale`, `openGraph.siteName`, `openGraph.images`, `twitter.card`. Sans `metadataBase`, les URLs OpenGraph sont relatives et ne fonctionnent pas lors du partage sur les réseaux sociaux.

### P2 — Injecter les JSON-LD dans `layout.tsx`
Les trois schemas (Organization, SoftwareApplication, FAQPage) sont rédigés dans `metadata-templates.md` Section 2. Les placer dans un `<script type="application/ld+json">` dans le `<head>` via un Server Component wrapper autour du layout. Débloque les Rich Results Google (encarts FAQ en SERP, données d'application).

### P3 — Corriger la hiérarchie H1/H2 dans `page.tsx`
Le H1 actuel est le logo texte "VisiRénov" dans le header. Le titre principal du hero (`h2` "Visualisez vos espaces meublés par l'IA") doit passer en `h1`. La section outil ("Transformez vos photos") peut rester `h2`. La hiérarchie correcte est attendue par Google pour comprendre le sujet principal de la page.

### P4 — Créer le dossier `public/` avec l'image OG
Créer `public/og-image.jpg` (1200x630px) — visuel avant/après représentatif. Sans cette image, les partages sur LinkedIn, Twitter et WhatsApp affichent un aperçu vide, réduisant le CTR des partages sociaux. Créer aussi `public/favicon.ico` (absent).

---

## Note sur le domaine Replit (critère 10)

Le sous-domaine `architecture-toum92.replit.app` est le frein SEO structurel majeur. Un domaine propre (`visirenov.fr` ou `visirenov.com`) apporterait : autorité de domaine indépendante, indexation Google Business Profile possible, Email marketing avec SPF/DKIM, et crédibilité auprès des personas professionnels (architectes, marchands de biens). Cette décision dépasse le périmètre SEO — à arbitrer avec @infrastructure et @orchestrator.

---

**Handoff → @fullstack**
- Fichier produit : `docs/seo/seo-audit.md`
- Actions immédiates à implémenter :
  1. `app/sitemap.ts` — code fourni dans `docs/seo/metadata-templates.md` Section 3
  2. `app/robots.ts` — code fourni dans `docs/seo/metadata-templates.md` Section 3
  3. `app/layout.tsx` — remplacer le `metadata` par le template Section 3 de `metadata-templates.md` (ajout `metadataBase`, `title.template`, OG complet, Twitter Cards)
  4. JSON-LD — injecter les 3 schemas (Section 2) dans le `<head>` via `<script type="application/ld+json">` dans un Server Component wrapper
  5. `page.tsx` — corriger H1 (logo) → H2, H2 hero → H1
- Contrainte : `page.tsx` est `"use client"` — les JSON-LD doivent être dans `layout.tsx` (Server Component) et non dans `page.tsx`
- Créer `public/` avec `og-image.jpg` (1200x630) et `favicon.ico`

**Handoff → @infrastructure**
- Décision à arbitrer : migration vers domaine propre (`visirenov.fr`) — impact SEO critique (critère 10, 2/10)
- Sans domaine propre, le plafond d'autorité SEO est structurellement limité par le sous-domaine Replit
- Si migration : prévoir redirections 301 de `architecture-toum92.replit.app` → nouveau domaine pour préserver l'historique d'indexation existant
- Variable d'environnement `NEXT_PUBLIC_BASE_URL` recommandée pour éviter de coder le domaine en dur dans `sitemap.ts` et `metadata.metadataBase`
