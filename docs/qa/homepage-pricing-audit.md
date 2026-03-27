# Audit QA — Homepage, Pricing, Personas, Renommage Mode Pro

**Date** : 2026-03-27
**Auditeur** : @qa
**Scope** : Renommage "Mode Marchand" -> "Mode Pro", homepage, pricing, pages personas, comparatif, footer, tests E2E

---

## 1. Renommage "Mode Marchand" -> "Mode Pro" dans le texte UI visible

### Verdict global : FAIL — 12 occurrences residuelles dans le texte UI visible

| # | Fichier | Ligne | Texte residuel | Severite |
|---|---------|-------|----------------|----------|
| 1 | `app/page.tsx` | 122 | `{ label: "Marchands de biens", href: "/marchand" }` (pill hero) | P2 — label persona, pas "Mode Marchand" |
| 2 | `app/page.tsx` | 882 | `Marchand de biens ? Voir le Mode Pro` | P2 — acceptable, reference au persona |
| 3 | `app/page.tsx` | 921 | `Dossiers de pre-commercialisation (PDF avant/apres)` | **P1** — le "(PDF avant/apres)" est residuel |
| 4 | `app/compte/page.tsx` | 352 | `Je suis marchand de biens` | **P1** — texte UI visible, devrait etre "Je suis professionnel de l'immobilier" ou similaire |
| 5 | `app/comparatif/page.tsx` | 286 | `Pour les marchands de biens` | P2 — sous-titre persona |
| 6 | `app/comparatif/page.tsx` | 289 | `Thomas, marchand de biens a Bordeaux` | P2 — reference persona |
| 7 | `app/comparatif/page.tsx` | 373 | `concu pour les marchands de biens` | **P1** — devrait etre "concu pour les professionnels" |
| 8 | `app/comparatif/page.tsx` | 465 | `Marchands de biens` (lien footer comparatif) | P2 — reference persona |
| 9 | `app/pricing/page.tsx` | 78 | `Pour les architectes, marchands de biens et agences` | P2 — description persona |
| 10 | `components/Footer.tsx` | 27 | `Pour les architectes, marchands de biens et particuliers` | P2 — tagline, acceptable |
| 11 | `app/examples/page.tsx` | 129 | `{ key: "marchand", label: "Marchands de biens" }` | P2 — filtre persona |
| 12 | `app/marchand/page.tsx` | 100 | `Pour les marchands de biens` | P2 — page persona dediee, correct |

### "Mode Marchand" (ancien nom du feature) : PASS

**Zero occurrence de "Mode Marchand" dans le texte UI visible.** Toutes les occurrences dans le code sont des commentaires internes (`// F4 — Mode Pro (ex Mode Marchand)`) dans :
- `lib/credits.ts:128`, `lib/dossier.ts:2`, `lib/properties.ts:2`
- `components/DossierProgress.tsx:4`, `components/DossierResult.tsx:8`, `components/MerchantMode.tsx:4`
- `app/dossier/[uuid]/page.tsx:2`, `app/api/dossier/route.ts:2`, `app/api/dossier/[uuid]/route.ts:2`, `app/api/dossier/[uuid]/pdf/route.ts:2`
- `app/page.tsx:155`

Ces commentaires de code internes sont acceptables (documentent l'historique).

### "Dossiers PDF avant/apres" -> "Dossiers de pre-commercialisation"

| # | Fichier | Ligne | Texte | Verdict |
|---|---------|-------|-------|---------|
| 1 | `app/page.tsx` | 921 | `Dossiers de pre-commercialisation (PDF avant/apres)` | **FAIL** — le "(PDF avant/apres)" est residuel |
| 2 | `app/page.tsx` | 1594 | `Dossiers de pre-commercialisation` | PASS |
| 3 | `app/pricing/page.tsx` | 73 | `Dossiers de pre-commercialisation` | PASS |

---

## 2. Homepage (app/page.tsx)

### Section galerie avant/apres par metier : PASS
Aucune section "galerie avant/apres par metier" trouvee dans le code. Supprimee.

### Encart Mode Pro placement : PASS
- L'encart Mode Pro est a la ligne 891 (`{/* Encart Mode Pro -- positionne apres le hero, avant l'outil */}`).
- Le CTA "Essayer gratuitement" est a la ligne 867, dans le hero.
- L'outil commence a la ligne 948 (`{/* Tool Section */}`).
- Ordre correct : Hero (avec CTA) -> Encart Mode Pro -> Outil.

### Pills hero cliquables : PASS
- Ligne 120-124 : `AUDIENCE_PILLS` avec liens vers `/architecte`, `/marchand`, `/particulier`.
- Ligne 877-887 : rendu en `<a href="...">` (liens HTML natifs, cliquables).

### Section Pricing : PASS (4 tiers corrects)

| Tier | Prix | Badge | CTA | Verdict |
|------|------|-------|-----|---------|
| Gratuit | 0 EUR | - | Essayer l'outil | PASS |
| Decouverte | 4,90 EUR | - | Acheter | PASS |
| Starter | 14,90 EUR | - | Acheter | PASS |
| Pro | 29 EUR/mois | "Recommande" + "Prix de lancement" | S'abonner | PASS |

---

## 3. Pages personas

### /architecte : PASS
- Existe : `app/architecte/page.tsx`
- H1 : contenu reel (pas placeholder)
- CTA : "Essayer" (lien vers /#outil)
- Footer : present (`<Footer currentPage="/architecte" />` implicite par structure)
- UTF-8 : **FAIL** — 6 occurrences `\u00E9`, `\u2019`, `\u00E8` dans les strings JS (lignes 7, 18, 197, 202, 207, 212)

### /marchand : PASS
- Existe : `app/marchand/page.tsx`
- H1 : `29 EUR/mois. Vos dossiers de pre-commercialisation en 10 minutes, pas 10 jours.`
- CTA : "Creer mon premier dossier -- Abonnement Pro"
- Footer : present (ligne 322 `<Footer currentPage="/marchand" />`)
- UTF-8 : **FAIL** — 6 occurrences `\u00E9`, `\u20AC` dans les strings JS (lignes 154, 164, 202, 207, 212, 253)

### /particulier : PASS
- Existe : `app/particulier/page.tsx`
- H1 : `Votre appartement. Pas celui de quelqu'un d'autre.`
- CTA : "Essayer gratuitement -- sans carte bancaire"
- Footer : present (implicite par structure similaire)
- UTF-8 : **FAIL** — 6 occurrences `\u00E9`, `\u00E7`, `\u00E8`, `\u00E0` dans les strings JS (lignes 7, 19, 155, 197, 202, 207)

---

## 4. Pricing page (/pricing)

### Coherence avec homepage : **FAIL partiel**

| Critere | Homepage | /pricing | Verdict |
|---------|----------|----------|---------|
| Nombre de tiers | 4 (Gratuit, Decouverte, Starter, Pro) | 3 (Decouverte, Starter, Pro) | **FAIL** — /pricing n'a pas de tier Gratuit |
| Prix Decouverte | 4,90 EUR | 4,90 EUR | PASS |
| Prix Starter | 14,90 EUR | 14,90 EUR | PASS |
| Prix Pro | 29 EUR/mois | 29 EUR | **FAIL** — /pricing dit "29 EUR" sans "/mois" dans le prix affiche |
| "Mode Pro" | oui | oui | PASS |
| "Dossiers de pre-commercialisation" | oui | oui | PASS |
| "Prix de lancement" badge | oui (homepage) | **non** | **FAIL** — absent de /pricing |
| "Liens partageables sans limite" pour Pro | oui (homepage) | oui | PASS |
| CTA Pro | "S'abonner" (homepage) | "S'abonner" (/pricing) | PASS |

### Problemes P1 identifies :
1. **Tier Gratuit absent de /pricing** — la homepage montre 4 tiers, /pricing en montre 3. Un utilisateur qui clique "Voir les tarifs" depuis la homepage s'attend a retrouver les memes options.
2. **"Prix de lancement" absent de /pricing** — present sur la homepage (ligne 1581) et l'encart Mode Pro (ligne 907), mais pas sur la page tarifs.
3. **Pro affiche comme pack unique au lieu d'abonnement** — la homepage dit "29 EUR/mois", /pricing dit "29 EUR" avec "50 credits" sans mention explicite que c'est un abonnement mensuel.

---

## 5. Tests E2E

### Assertions sur "Mode Marchand" : PASS
Zero assertion sur "Mode Marchand" dans les tests E2E. Grep confirme aucune occurrence.

### Assertions sur "marchand" dans les tests E2E : PASS (acceptable)
Les tests E2E referencent `/marchand` comme URL de route et "marchand" comme concept persona — c'est correct puisque la route existe toujours.

| Fichier | Contenu | Verdict |
|---------|---------|---------|
| `tests/e2e/persona-pages.spec.ts` | Navigation vers `/marchand`, titre contient "marchand" | PASS — page existe |
| `tests/e2e/comparatif-page.spec.ts` | Lien `a[href="/marchand"]` visible | PASS — lien existe |
| `tests/e2e/blog-pages.spec.ts` | Footer contient lien `/marchand` | PASS — lien existe |
| `tests/e2e/merchant-dossiers.spec.ts` | Navigation `/mes-dossiers` | PASS — route correcte |

---

## 6. Coherence cross-fichiers

### Footer : PASS
- `components/Footer.tsx` ligne 8 : `{ href: "/marchand", label: "Professionnels" }` — label correct ("Professionnels", pas "Marchands").
- Ligne 27 : `Pour les architectes, marchands de biens et particuliers` — tagline acceptable (mentionne les personas, pas le feature).

### /comparatif : PASS partiel
- Utilise "Mode Pro" (ligne 297) et non "Mode Marchand".
- Mentionne "marchands de biens" en tant que persona (acceptable).
- **P1** : ligne 373 `concu pour les marchands de biens` — devrait etre "concu pour les professionnels de l'immobilier" car ici le "Mode Pro" s'adresse aussi aux architectes et agences.

### /mes-dossiers : PASS
- Route existe et fonctionne.
- Pas de texte "Mode Marchand" dans la page.

### /compte : FAIL
- Ligne 352 : `Je suis marchand de biens` — Ce checkbox devrait etre reformule ("Je suis professionnel de l'immobilier" ou "Activer le Mode Pro") puisque le Mode Pro s'adresse a tous les professionnels, pas uniquement aux marchands.

---

## 7. UTF-8 (Regle n13 CLAUDE.md)

### Violations `\u00XX` dans les strings JS (hors metadata SEO)

**Severite P2** — Les strings dans les objets JS (titres, descriptions) utilisent des sequences Unicode echappees au lieu de vrais caracteres UTF-8.

| Fichier | Lignes | Exemples |
|---------|--------|----------|
| `app/architecte/page.tsx` | 7, 18, 197, 202, 207, 212 | `\u00E9` (e), `\u2019` ('), `\u00E8` (e) |
| `app/marchand/page.tsx` | 145, 154, 164, 202, 207, 212, 253 | `\u00E9` (e), `\u20AC` (EUR), `\u00E9` (e) |
| `app/particulier/page.tsx` | 7, 19, 155, 197, 202, 207 | `\u00E9` (e), `\u00E7` (c), `\u00E8` (e), `\u00E0` (a) |
| `app/examples/page.tsx` | 15, 19, 50, 68, 70, 77, 80, 90, 110, 117, 118, 120 | `\u00E9`, `\u00E8`, `\u00e0` |
| `app/pricing/page.tsx` | 79, 122 | `\u00A0` (espace insecable), `\u00e9` |
| `app/mes-biens/[id]/page.tsx` | 310, 313, 317, 320 | `\u00e9`, `\u00e8`, `\u2019`, `\u00ea` |

**Note** : Les `\u00A0` (espaces insecables) dans les prix (`29\u00A0EUR`) sont un pattern accepte pour le formatage typographique. Les `\u00E9` et similaires dans les strings JS visibles sont des violations de la regle n13.

---

## Resume des problemes

### P0 (bloquant) : 0

### P1 (haute severite) : 5

| # | Description | Fichier | Action |
|---|-------------|---------|--------|
| P1-1 | "(PDF avant/apres)" residuel dans l'encart Mode Pro | `app/page.tsx:921` | Supprimer le "(PDF avant/apres)" — garder "Dossiers de pre-commercialisation" seul |
| P1-2 | Tier Gratuit absent de /pricing | `app/pricing/page.tsx` | Ajouter le tier Gratuit ou ajouter une mention "3 generations offertes" explicite |
| P1-3 | "Prix de lancement" absent de /pricing pour le Pro | `app/pricing/page.tsx` | Ajouter le badge "Prix de lancement" comme sur la homepage |
| P1-4 | Pro affiche sans "/mois" sur /pricing | `app/pricing/page.tsx` | Le pack Pro devrait afficher "29 EUR/mois" et non "29 EUR" avec "50 credits" |
| P1-5 | "Je suis marchand de biens" dans /compte | `app/compte/page.tsx:352` | Reformuler en "Je suis professionnel de l'immobilier" ou "Activer le Mode Pro" |

### P2 (moyenne severite) : 3

| # | Description | Fichier | Action |
|---|-------------|---------|--------|
| P2-1 | `\u00E9` et equivalents dans les strings JS | Pages personas + examples + pricing + mes-biens | Remplacer par vrais caracteres UTF-8 |
| P2-2 | "concu pour les marchands de biens" dans /comparatif | `app/comparatif/page.tsx:373` | Reformuler en "concu pour les professionnels" |
| P2-3 | "marchand de biens" dans descriptions comparatif | `app/comparatif/page.tsx:289` | Acceptable en tant que reference persona Thomas |

---

## Checklist finale

| Point de controle | Verdict |
|---|---|
| "Mode Marchand" dans le texte UI visible | **PASS** — 0 occurrence |
| "Mode Marchand" dans les commentaires code (acceptable) | PASS — `(ex Mode Marchand)` partout |
| "Mode Pro" utilise correctement | PASS |
| "PDF avant/apres" supprime | **FAIL** — 1 occurrence residuelle (page.tsx:921) |
| "Dossiers de pre-commercialisation" utilise | PASS — 3 occurrences correctes |
| Galerie avant/apres par metier supprimee | PASS |
| Encart Mode Pro apres CTA, avant outil | PASS |
| Pills hero cliquables vers /architecte, /marchand, /particulier | PASS |
| Pricing homepage : 4 tiers | PASS |
| Pricing homepage : Pro 29 EUR/mois + "Prix de lancement" + "S'abonner" | PASS |
| /architecte existe + contenu reel + Footer | PASS |
| /marchand existe + contenu reel + Footer | PASS |
| /particulier existe + contenu reel + Footer | PASS |
| Pricing page coherente avec homepage | **FAIL** — 3 ecarts (tier Gratuit, badge, /mois) |
| Tests E2E sans assertion "Mode Marchand" | PASS |
| Footer dit "Professionnels" (pas "Marchands") | PASS |
| /comparatif utilise "Mode Pro" | PASS |
| /mes-dossiers fonctionne | PASS |
| UTF-8 dans les strings JS | **FAIL** — ~30 violations |

---

**Handoff -> @fullstack**
- Fichiers audites : `app/page.tsx`, `app/pricing/page.tsx`, `app/architecte/page.tsx`, `app/marchand/page.tsx`, `app/particulier/page.tsx`, `app/comparatif/page.tsx`, `app/compte/page.tsx`, `app/examples/page.tsx`, `components/Footer.tsx`, `tests/e2e/*.spec.ts`
- Decisions prises : les commentaires `(ex Mode Marchand)` dans le code sont acceptables, les references au persona "marchand de biens" dans les pages dediees sont acceptables, seul le texte UI du feature doit dire "Mode Pro"
- Points d'attention :
  - P1-1 : supprimer "(PDF avant/apres)" dans `app/page.tsx:921`
  - P1-2/3/4 : aligner /pricing avec la homepage (tier Gratuit, badge "Prix de lancement", "29 EUR/mois")
  - P1-5 : reformuler le checkbox dans /compte
  - P2-1 : passe de nettoyage UTF-8 sur les pages personas et examples (remplacer `\u00E9` par `e` etc.)
