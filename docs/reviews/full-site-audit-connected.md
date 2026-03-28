# Audit UX — Pages connectées Versiroom — Batch 1

> Agent : @ux — 2026-03-28
> Périmètre : 5 pages connectées principales
> Pricing de référence : Découverte GRATUIT / Starter 9,90€ one-shot / Pro 29€/mois

---

## Synthèse globale

| Page | Score | P0 | P1 | P2 |
|---|---|---|---|---|
| Ma galerie | 7.5/10 | 1 | 3 | 2 |
| Mes biens | 8/10 | 0 | 2 | 3 |
| Fiche bien [id] | 7/10 | 2 | 4 | 2 |
| Mes dossiers | 7.5/10 | 1 | 2 | 2 |
| Mon compte | 8/10 | 0 | 2 | 3 |

---

## Page 1 — Ma galerie (`app/ma-galerie/page.tsx`)

**Score : 7.5/10**

### État vide
- PASS : message "Aucune photo pour le moment." + CTA "Générer ma première photo" → `/#outil`. Correct.
- P1 : état vide filtré absent. Si un filtre actif retourne 0 résultats, le message reste "Aucune photo pour le moment" — l'utilisateur ne sait pas que c'est le filtre qui est responsable.

### Accents français
- P0 : entités HTML dans du JSX rendu — `&#233;` (é), `&#232;` (è), `&#224;` (à) dans le JSX. Règle CLAUDE.md §13 : utiliser les vrais caractères UTF-8 dans les strings JavaScript.
  - Ligne 287 : `g&#233;n&#233;r&#233;e` → `générée`
  - Ligne 329 : `Non class&#233;es` → `Non classées`
  - Ligne 389 : `Non class&#233;e` → `Non classée`
  - Ligne 412 : `Associer &#224; un bien :` → `Associer à un bien :`
  - Ligne 497 : `Ext&#233;rieur` → `Extérieur`
  - Ligne 507 : `Associ&#233;e &#224; :` → `Associée à :`
  - Ligne 511 : `Associer &#224; un bien :` → `Associer à un bien :`

### Pricing
- PASS : aucune mention de prix sur cette page. Non concerné.

### Focus-visible / touch targets
- PASS : tous les boutons principaux ont `focus-visible:ring-2 focus-visible:ring-sage/50`.
- P1 : le bouton "Associer" en overlay carte (ligne 400) a une cible `px-2 py-1` — hauteur estimée ~28px, sous le seuil 44px.
  - Correction : ajouter `min-h-[44px]` au bouton Associer en overlay.
- P2 : les boutons de la dropdown d'association (ligne 415) ont `py-1.5` → ~30px. Ajouter `min-h-[44px]`.

### Apostrophes JSX
- PASS : pas d'apostrophes dans du texte JSX entre balises (les apostrophes dans les strings JS sont correctes — "Aujourd'hui" ligne 25 est dans une fonction JS, pas du JSX).

### Mobile responsive
- PASS : grille `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`. Modal détail `max-w-3xl w-full max-h-[90vh] overflow-y-auto`.
- P2 : la dropdown d'association `absolute top-10 right-0 sm:right-2` peut dépasser le viewport sur mobile. `max-w-[calc(100vw-2rem)]` est présent — acceptable.

### Navigation / liens retour
- P1 : pas de lien retour ni breadcrumb. Si Thomas arrive depuis une fiche bien, il n'a pas de retour contextuel. La nav header suffit pour le cas nominal, mais l'ajout d'un breadcrumb serait plus conforme aux standards H1.

---

## Page 2 — Mes biens (`app/mes-biens/page.tsx`)

**Score : 8/10**

### État vide
- PASS : message "Aucun bien enregistré." + bouton "Ajouter mon premier bien" qui ouvre le formulaire inline. CTA clair et actionnable.

### Accents français
- P1 : entités HTML dans du JSX :
  - Ligne 207 : `enregistr&#233;` → `enregistré`
  - Ligne 259 : `S&#233;lectionner` → `Sélectionner`
  - Ligne 267 : `m&#178;` → `m²`
  - Ligne 279 : `pi&#232;ces` → `pièces`
  - Ligne 289 : `&#8364;` → `€`
  - Lignes 369, 371, 374, 380 : mêmes problèmes dans les cartes de biens.

### Pricing
- PASS : aucune mention de prix sur cette page.

### Focus-visible / touch targets
- PASS : bouton "+ Nouveau bien" et bouton "Créer le bien" ont `focus-visible:ring-2`.
- P2 : bouton "Annuler" (ligne 322) : `px-4 py-2` → hauteur ~36px. Passer à `py-2.5`.
- P2 : suggestions d'autocomplétion adresse (ligne 241) : `px-3 py-2` → ~36px. Ajouter `min-h-[44px]`.

### Apostrophes JSX
- PASS : apostrophes dans strings JS, pas dans du JSX rendu entre balises. OK.

### Mobile responsive
- PASS : grille `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`. Formulaire en `grid-cols-1 sm:grid-cols-2`. OK.

### Navigation / liens retour
- P1 : le logo Versiroom fait office de retour vers `/` mais ce n'est pas évident sur mobile. Pas bloquant, mais un lien "← Accueil" en pied de page serait utile.
- P2 : après création de bien, redirection `window.location.href` (ligne 143) — perd l'état. Préférer `router.push`. Impact mineur.

### Autres
- P1 : `ProGate` doit afficher le pricing v3 (29€/mois) pour les non-Pro. Vérifier que le composant ProGate affiche bien "À partir de 29€/mois" et non un ancien tarif.

---

## Page 3 — Fiche bien `[id]` (`app/mes-biens/[id]/page.tsx`)

**Score : 7/10**

### État vide (0 photos associées)
- P1 : aucun empty state explicite pour la section photos quand `photos.length === 0`. Le composant `InlineGenerator` est proposé mais sans texte d'accompagnement.
  - Correction : ajouter avant `InlineGenerator` : `<p className="text-sm text-muted font-light mb-4">Aucune photo générée pour ce bien. Commencez par générer des visuels ci-dessous.</p>`.

### Accents français
- P0 : ligne 445 : `setToastMsg("Erreur lors de l\u2019archivage.")` — Unicode escape `\u2019` dans une string JS.
  - Correction : `"Erreur lors de l'archivage."`
- P0 : ligne 493 : `"Erreur lors de la création de l\u2019annonce."` — même problème.
  - Correction : `"Erreur lors de la création de l'annonce."`
- P1 : entités HTML dans JSX — lignes 597–614 : `m&#178;`, `pi&#232;ces`, `&#8364;` → remplacer par `m²`, `pièces`, `€`.

### Pricing
- P1 : ligne 486-489 — le toast d'erreur 403 mentionne "Pack Pro" (`Cette fonctionnalité est réservée au Pack Pro`). Terminologie v3 incorrecte.
  - Correction : `"Cette fonctionnalité est réservée à l'abonnement Pro (29€/mois)."`

### Focus-visible / touch targets
- PASS : modales avec focus trap correct (Escape, Tab, focus premier élément).
- P1 : boutons "Modifier la description" (ligne 655) et "Regénérer" (ligne 660) : `text-xs font-light hover:underline` — pas de `focus-visible:ring`.
  - Correction : ajouter `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 rounded`.
- P1 : `handleDeleteProperty` (ligne 454) utilise `window.confirm()` — non accessible (pas de focus trap, non stylé, bloqué sur certains navigateurs mobile).
  - Correction : remplacer par un composant `<ConfirmModal>` avec focus trap.

### Apostrophes JSX
- PASS : `l&apos;annonce` dans du JSX est correctement encodé.

### Mobile responsive
- PASS : grille `grid-cols-1 lg:grid-cols-3` pour le header. Section infos complémentaires en `grid-cols-2 sm:grid-cols-4`.
- P2 : breadcrumb tronque l'adresse à 40 chars — correct sur mobile, mais sur desktop l'adresse entière serait utile.

### Navigation / liens retour
- PASS : breadcrumb `Mes biens / [adresse]` présent (ligne 573). Excellent.

---

## Page 4 — Mes dossiers (`app/mes-dossiers/page.tsx`)

**Score : 7.5/10**

### État vide
- P0 : CTA "Créer un dossier" (ligne 169) pointe vers `/` (accueil). Thomas ne comprend pas comment créer un dossier depuis `/` — il faut aller dans une fiche bien. CTA trompeur.
  - Correction : href `/mes-biens`, texte "Créer depuis une fiche bien".

### Accents français
- PASS : tous les caractères sont en UTF-8 natif. `Terminé` (ligne 38) est correct. OK.

### Pricing
- PASS : aucune mention de prix. `ProGate` gère l'accès.

### Focus-visible / touch targets
- P1 : bouton "Copier le lien" (ligne 232) : `px-1.5 py-1` → hauteur ~28px. Sous le seuil 44px.
  - Correction : `min-h-[44px] px-3 py-2`.
- PASS : les cartes dossiers sont des `<a>` avec surface de clic complète.

### Apostrophes JSX
- PASS : `Créez votre premier dossier en Mode Pro.` — pas d'apostrophe problématique dans du JSX.

### Mobile responsive
- PASS : layout en stack vertical `space-y-3`. Responsive correct.
- P2 : sur mobile, `dossier.bien_adresse` est tronqué `max-w-[200px]` (ligne 214). Acceptable.

### Navigation / liens retour
- P1 : pas de lien retour depuis Mes dossiers vers Mes biens. Ajouter un lien contextuel.

### Autres
- P2 : le status `"generating"` affiche "En cours" sans indicateur de progression ni ETA. Thomas ne sait pas si le dossier est bloqué.

---

## Page 5 — Mon compte (`app/compte/page.tsx`)

**Score : 8/10**

### État vide (profil non rempli)
- PASS : checkbox décochée par défaut. Formulaire marchand masqué. État initial propre.

### Accents français
- PASS : tous les caractères sont en UTF-8 natif dans le JSX. `l&apos;immobilier` (ligne 369) et `d&apos;entreprise` (ligne 389) sont correctement encodés (apostrophes dans du JSX entre balises).
- P1 : strings dans les handlers SIRET sans accents :
  - Ligne 121 : `"Service de verification indisponible. Reessayez..."` → `"Service de vérification indisponible. Réessayez dans quelques instants."`
  - Ligne 171 : `"Aucune entreprise trouvee."` → `"Aucune entreprise trouvée."`
  - Ligne 158 : `"Erreur serveur. Reessayez dans quelques instants."` → `"Erreur serveur. Réessayez dans quelques instants."`

### Pricing
- PASS : aucune mention de prix. Le CTA post-save vers `/mes-biens` est cohérent.

### Focus-visible / touch targets
- PASS : boutons Rechercher et Enregistrer ont `focus-visible:ring-2 focus-visible:ring-sage/50 focus-visible:ring-offset-2`. Excellent.
- P1 : `input[type="color"]` (lignes 623, 649) : `w-10 h-10` = 40×40px — sous le seuil 44px.
  - Correction : `w-11 h-11` (44px).
- P2 : `input[type="checkbox"]` (ligne 363) : `w-5 h-5` = 20px. La zone de clic du label adjacent compense — acceptable.

### Apostrophes JSX
- PASS : `l&apos;immobilier`, `d&apos;entreprise`, `Aperçu` — tous corrects.
- P2 : ligne 402 : `focus:outline-none` et `focus-visible:border-foreground` mélangés sur certains inputs. Uniformiser en `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50`.

### Mobile responsive
- PASS : `grid-cols-1 sm:grid-cols-2` partout. Header `max-w-4xl`. OK.

### Navigation / liens retour
- P1 : header `/compte` utilise `sticky` (ligne 330) au lieu de `fixed top-0 left-0 right-0` — incohérence avec toutes les autres pages connectées qui utilisent `fixed`.
  - Correction : `fixed top-0 left-0 right-0 z-50` + `pt-24` sur `<main>` (remplacer `py-8 sm:py-12` par `pt-24 pb-12 px-5 sm:px-8`).

---

## Récapitulatif des corrections prioritaires

### P0 — Blocants (3 issues)

| # | Page | Problème | Correction |
|---|---|---|---|
| P0-1 | Ma galerie | Entités HTML `&#NNN;` dans JSX rendu — viole règle UTF-8 CLAUDE.md §13 | Remplacer par vrais caractères : `é`, `è`, `à`, `²` |
| P0-2 | Fiche bien | `\u2019` dans strings JS (lignes 445, 493) | Écrire directement l'apostrophe UTF-8 `'` |
| P0-3 | Mes dossiers | CTA "Créer un dossier" → `/` : destination trompeuse pour Thomas | href `/mes-biens`, texte "Créer depuis une fiche bien" |

### P1 — Haute priorité (14 issues)

| # | Page | Problème | Correction |
|---|---|---|---|
| P1-1 | Ma galerie | État vide filtré non différencié | Détecter filtre actif → "Aucun résultat pour ce filtre. [Réinitialiser]" |
| P1-2 | Ma galerie | Bouton "Associer" overlay : cible <44px | Ajouter `min-h-[44px]` |
| P1-3 | Mes biens | Entités HTML dans JSX (enregistré, Sélectionner, m², pièces, €) | Remplacer par UTF-8 |
| P1-4 | Mes biens | ProGate : vérifier pricing v3 affiché | Confirmer affichage "29€/mois" |
| P1-5 | Fiche bien | Entités HTML dans JSX (m², pièces, €) | Remplacer par UTF-8 |
| P1-6 | Fiche bien | Toast 403 : "Pack Pro" ≠ terminologie v3 | → "abonnement Pro (29€/mois)" |
| P1-7 | Fiche bien | Boutons Modifier/Regénérer sans focus-visible | Ajouter `focus-visible:ring-2 focus-visible:ring-sage/50 rounded` |
| P1-8 | Fiche bien | `window.confirm()` pour suppression : non accessible | Remplacer par `<ConfirmModal>` avec focus trap |
| P1-9 | Fiche bien | Empty state photos sans texte d'accompagnement | Ajouter phrase avant InlineGenerator |
| P1-10 | Mes dossiers | Bouton "Copier le lien" : cible <44px | `min-h-[44px] px-3 py-2` |
| P1-11 | Mon compte | Strings SIRET sans accents (verification, trouvee) | → "vérification", "trouvée", "Réessayez" |
| P1-12 | Mon compte | `input[type="color"]` : 40×40px < 44px | `w-11 h-11` |
| P1-13 | Mon compte | Header `sticky` ≠ `fixed` des autres pages | `fixed top-0 left-0 right-0 z-50` + `pt-24` sur main |
| P1-14 | Mes dossiers | Pas de lien retour vers Mes biens | Ajouter lien contextuel dans empty state ou nav |

### P2 — Basse priorité (12 issues)

- Ma galerie : cibles dropdown association <44px
- Ma galerie : dropdown peut déborder sur mobile (partiellement géré)
- Mes biens : bouton "Annuler" py-2 → py-2.5
- Mes biens : suggestions autocomplete <44px
- Mes biens : `window.location.href` → `router.push`
- Fiche bien : breadcrumb tronqué à 40 chars sur desktop
- Mes dossiers : adresse tronquée max-w-[200px] sur mobile
- Mes dossiers : status "generating" sans ETA
- Mon compte : checkbox 20px (compensé par label)
- Mon compte : mélange `focus:` / `focus-visible:` sur inputs SIRET
- Mon compte : aperçu branding non scrollable si raison sociale longue

---

## Tests UX — Parcours Thomas (marchand de biens)

| Test | Critère | Statut |
|---|---|---|
| Thomas peut créer un bien et générer un visuel | Formulaire création + génération inline fonctionnels | ✅ |
| Charge cognitive ≤ 3 actions par écran clé | Mes biens (1 action), Fiche bien (~6 sections = dense) | ⚠️ |
| Time-to-value : inscription → premier dossier ≤ 5 étapes | Compte → Mes biens → Fiche → Générer → Dossier = 5 étapes | ⚠️ |
| Edge case : CTA "Créer un dossier" sans bien | CTA pointe vers `/` : incompréhensible pour Thomas | ❌ P0-3 |
| Accessibilité WCAG 2.2 AA | focus-visible présent sur éléments majeurs, 3 cibles <44px | ⚠️ |
| Pricing v3 cohérent | "Pack Pro" dans toast 403 ≠ v3 | ❌ P1-6 |

---

## Handoff → @fullstack

**Fichiers produits :**
- `/home/user/Architecture/docs/reviews/full-site-audit-connected.md`

**Corrections à implémenter par priorité :**

P0 (immédiat) :
1. `app/ma-galerie/page.tsx` : remplacer toutes les entités HTML `&#NNN;` par vrais caractères UTF-8
2. `app/mes-biens/[id]/page.tsx` lignes 445 et 493 : `\u2019` → apostrophe directe `'`
3. `app/mes-dossiers/page.tsx` ligne 169 : href `/` → `/mes-biens`, texte → "Créer depuis une fiche bien"

P1 (prioritaire) :
4. `app/mes-biens/page.tsx` : entités HTML → UTF-8
5. `app/mes-biens/[id]/page.tsx` : entités HTML + toast 403 "Pack Pro" → "abonnement Pro (29€/mois)" + focus-visible sur Modifier/Regénérer + ConfirmModal pour suppression + empty state photos
6. `app/mes-dossiers/page.tsx` : bouton "Copier le lien" min-h-[44px]
7. `app/compte/page.tsx` : strings SIRET sans accents → UTF-8 + input color w-11 h-11 + header sticky → fixed + pt-24 sur main

**Points d'attention :**
- Créer un composant `<ConfirmModal>` réutilisable (remplace window.confirm — P1-8, et permettra d'éviter la pattern à l'avenir)
- Vérifier que `ProGate` affiche le pricing v3 (29€/mois) et non un ancien tarif
- L'incohérence header sticky vs fixed sur `/compte` cause un glitch de scroll sur iOS Safari
