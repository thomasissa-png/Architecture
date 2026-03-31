# Audit Pages Publiques — Versimo (batch 2)

## Synthèse

| Page | Score | P0 | P1 | P2 |
|---|---|---|---|---|
| `app/blog/page.tsx` | 8/10 | 0 | 1 | 2 |
| `app/blog/[slug]/page.tsx` | 7.5/10 | 0 | 2 | 2 |
| `app/examples/page.tsx` | 7/10 | 0 | 3 | 2 |
| `app/annonce/[uuid]/page.tsx` | 8.5/10 | 0 | 1 | 3 |
| `app/dossier/[uuid]/page.tsx` | 8.5/10 | 0 | 1 | 2 |

---

## `app/blog/page.tsx` — Findings

### P1

| # | Sévérité | Localisation | Problème | Code exact | Correction |
|---|---|---|---|---|---|
| B1 | P1 | L.122–129 (empty state) | Entités HTML `&ocirc;` et `&eacute;` encodées en dur dans JSX — CLAUDE.md règle n°13 impose les vrais caractères UTF-8 dans les strings | `Bient&ocirc;t disponible` / `Nous pr&eacute;parons` | Remplacer par `Bientôt disponible` / `Nous préparons` |

### P2

| # | Sévérité | Localisation | Problème | Correction |
|---|---|---|---|---|
| B2 | P2 | L.44–66 (header) | Header dupliqué dans chaque page blog — aucun composant partagé `<Header>`. Incohérence future possible avec homepage si l'un évolue sans l'autre. | Extraire vers `components/Header.tsx` |
| B3 | P2 | L.84–113 (card liste) | Lien card `<a href="/blog/${post.slug}">` sans `focus-visible:ring` explicite — seul `hover:border-foreground/20` présent. Navigation clavier non signalée. | Ajouter `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50` sur le `<a>` |

---

## `app/blog/[slug]/page.tsx` — Findings

### P1

| # | Sévérité | Localisation | Problème | Code exact | Correction |
|---|---|---|---|---|---|
| S1 | P1 | L.177–178 (CTA bas article) | Entité HTML `&eacute;` dans string JSX (règle n°13) + copy prix incorrect pour pricing v3 : "3 générations offertes" est aligné avec l'ancien pricing, pas avec Pricing v3 (Découverte GRATUIT = plan, pas 3 crédits de découverte isolés — vérifier le message exact voulu) | `3 g&eacute;n&eacute;rations offertes, sans carte bancaire.` | `Essayez gratuitement, sans carte bancaire.` + caractères UTF-8 |
| S2 | P1 | L.59 (markdownToHtml) | Les liens générés par `markdownToHtml` (`<a href="$2">`) n'ont pas d'attribut `target` ni `rel` — des liens externes dans le contenu blog ouvrent dans le même onglet, cassant la lecture | `.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="...">$1</a>')` | Ajouter `target="_blank" rel="noopener noreferrer"` pour les URLs absolues, ou parser l'URL |

### P2

| # | Sévérité | Localisation | Problème | Correction |
|---|---|---|---|---|
| S3 | P2 | L.139–143 (breadcrumb nav) | Le breadcrumb `<nav>` n'a pas d'attribut `aria-label` — les screen readers annoncent deux `<nav>` sans distinction (header + breadcrumb) | Ajouter `aria-label="Fil d'Ariane"` |
| S4 | P2 | L.67 (markdownToHtml) | Le parser Markdown inline est fragile : un `<br/>` injecté dans le texte d'un paragraphe n'est pas encodé — si le contenu DB contient `<script>` ou du HTML brut, XSS possible. `dangerouslySetInnerHTML` sans sanitisation. | Ajouter DOMPurify ou sanitize-html côté serveur avant injection, ou encoder le contenu DB au moment de l'insertion |

---

## `app/examples/page.tsx` — Findings

### P1

| # | Sévérité | Localisation | Problème | Code exact | Correction |
|---|---|---|---|---|---|
| E1 | P1 | L.263–265 (CTA bas de page) | Copy CTA incohérent avec Pricing v3 : "3 générations gratuites" correspond à l'ancienne offre. Pricing v3 = plan "Découverte GRATUIT" (sans limite de 3 crédits explicite dans le CTA) | `3 g&eacute;n&eacute;rations gratuites` | `Essayez gratuitement` ou aligner avec le wording exact du plan Découverte |
| E2 | P1 | L.158–199 (ExampleCard) | Toutes les 8 cartes utilisent les mêmes images statiques `/imageavant.jpg` et `/imageapres.jpg` — les 8 exemples affichent le même avant/après, aucune différenciation visuelle par style ou pièce. Impact direct sur la crédibilité pour Thomas et Claire. | Fournir des images réelles par exemple, ou au minimum 2–3 images distinctes. A minima ajouter un `alt` distinct par carte (déjà fait) et documenter le gap comme known issue |
| E3 | P1 | L.291–339 (filtre pills JS inline) | Les boutons filtre `<button>` n'ont pas de `aria-pressed` — le filtre actif n'est pas annoncé aux screen readers. `data-active` CSS ne suffit pas pour l'accessibilité. | Ajouter `aria-pressed={p.key === "tous" ? "true" : "false"}` et le mettre à jour via le script inline, ou migrer vers un composant `"use client"` avec state |

### P2

| # | Sévérité | Localisation | Problème | Correction |
|---|---|---|---|---|
| E4 | P2 | L.246–248 (description) | Entités HTML `&eacute;` et `&eacute;` dans JSX (règle n°13) | `D&eacute;couvrez` → `Découvrez`, `r&eacute;alis&eacute;es` → `réalisées` |
| E5 | P2 | L.178–179 (badge Après) | Badge "Après" utilise l'entité `&egrave;` dans un attribut string JSX | `Apr&egrave;s` → `Après` |

---

## `app/annonce/[uuid]/page.tsx` — Findings

### P1

| # | Sévérité | Localisation | Problème | Code exact | Correction |
|---|---|---|---|---|---|
| A1 | P1 | L.659–661 (footer lien) | URL hardcodée Replit en production `https://versimo.fr/` dans le footer visible par les acheteurs immobiliers — expose l'infrastructure interne, manque de brand polish | `href="https://versimo.fr/"` | Remplacer par `process.env.NEXT_PUBLIC_BASE_URL` ou le domaine de production final |

### P2

| # | Sévérité | Localisation | Problème | Correction |
|---|---|---|---|---|
| A2 | P2 | L.28–29 (PageProps) | `params: { uuid: string }` est un objet synchrone — depuis Next.js 15, `params` est une Promise. Déjà géré dans blog/[slug] avec `Promise<{ slug: string }>`. Incohérence inter-pages, risque de warning ou break sur upgrade. | Aligner sur `params: Promise<{ uuid: string }>` + `await params` |
| A3 | P2 | L.386–389 (empty state galerie) | Texte "contactez-nous" dans un état vide sans lien ni action définie — "nous" est ambigu (Versimo ou le marchand ?). L'utilisateur ne sait pas qui contacter. | Remplacer par "contactez le vendeur" si `hasMerchant`, sinon supprimer la mention |
| A4 | P2 | L.45–84 (generateMetadata) | `robots: "noindex, nofollow"` sur toutes les annonces — les annonces publiques partagées via WhatsApp/email ne sont pas référencées. Intentionnel ? Si les annonces doivent être trouvables via Google, retirer le noindex. Sinon documenter le choix. | Documenter le choix ou conditionner : `robots: isOwner ? "noindex" : "index, nofollow"` |

---

## `app/dossier/[uuid]/page.tsx` — Findings

### P1

| # | Sévérité | Localisation | Problème | Code exact | Correction |
|---|---|---|---|---|---|
| D1 | P1 | L.460–467 (footer lien) | Même problème que A1 — URL Replit hardcodée dans le footer visible acheteurs | `href="https://versimo.fr/"` | Remplacer par `process.env.NEXT_PUBLIC_BASE_URL` |

### P2

| # | Sévérité | Localisation | Problème | Correction |
|---|---|---|---|---|
| D2 | P2 | L.35–36 (PageProps) | Même problème que A2 — `params` synchrone, à aligner sur Next.js 15 async params | `params: Promise<{ uuid: string }>` + `await params` |
| D3 | P2 | L.59 (generateMetadata) | `BASE_URL` définie en dur dans `generateMetadata` — n'utilise pas `process.env.NEXT_PUBLIC_BASE_URL` contrairement au reste du codebase. Double source de vérité pour l'URL de base. | `const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://versimo.fr"` |

---

## Récapitulatif transversal

| Catégorie | Occurrences | Pages concernées |
|---|---|---|
| Entités HTML `&xxx;` dans JSX (règle CLAUDE.md n°13) | 6 | blog/page, blog/[slug], examples |
| Copy Pricing v3 désaligné ("3 générations gratuites/offertes") | 2 | blog/[slug], examples |
| URL Replit hardcodée visible utilisateur final | 2 | annonce/[uuid], dossier/[uuid] |
| `params` synchrone (Next.js 15 compat) | 2 | annonce/[uuid], dossier/[uuid] |
| focus-visible manquant sur éléments interactifs | 1 | blog/page (cards liste) |
| aria manquant (aria-label, aria-pressed) | 2 | blog/[slug] breadcrumb, examples filtre |
| Images statiques identiques pour tous les exemples | 1 | examples (impact crédibilité fort) |

---

**Handoff → @orchestrator**

- Fichier produit : `/home/user/Architecture/docs/reviews/full-site-audit-public-b2.md`
- Décisions prises : audit sur 5 pages, 0 P0 identifié, 8 P1, 12 P2. Priorité immédiate : entités HTML (règle CLAUDE.md n°13, 6 occurrences), copy pricing v3 (2 pages), URL Replit hardcodée (2 pages publiques client-facing)
- Points d'attention : l'issue E2 (images exemples toutes identiques) est la friction crédibilité la plus forte pour Thomas et Claire — à traiter avant toute démonstration produit. L'issue S4 (XSS potentiel markdownToHtml) est à traiter avant publication de vrais articles blog.
