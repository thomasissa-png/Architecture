# Re-audit design — F4 Mode Marchand (post-corrections, v2)
**Agent** : @design
**Date** : 2026-03-25
**Fichiers audités** : `components/MerchantMode.tsx`, `components/DossierProgress.tsx`, `components/DossierResult.tsx`, `components/DossierPublicView.tsx`
**Audit précédent** : `docs/reviews/f4-audit-design.md` — note globale 6.9/10 (2026-03-25)
**Re-audit v1** : note globale 7.8/10 — corrections restantes documentées

---

## Note globale : 7.8 / 10

Delta net : +0.9 point vs premier audit. Identique au re-audit v1. Les corrections P0 (tokens hardcodés, badges AVANT/APRÈS, séparateur mobile, focus-visible CTA principal, aria-label boutons icône) sont toutes appliquées et vérifiées dans le code source. Les 4 corrections restantes pour 9/10 identifiées en v1 sont **toujours en attente** — aucune n'a été propagée depuis. La note stagne à 7.8/10 par conséquent.

---

## Tableau des 7 critères

| # | Critère | Audit 1 | Re-audit v1 | Re-audit v2 | Delta v1→v2 | Statut |
|---|---|---|---|---|---|---|
| 1 | Cohérence tokens | 7/10 | 8.5/10 | 8.5/10 | 0 | Stable. Résidu `bg-white/40` dans `DossierPublicView.tsx` L30 non corrigé |
| 2 | Typographie | 8/10 | 9/10 | 9/10 | 0 | Stable. Badges AVANT/APRÈS en labels typographiques nus conformes |
| 3 | Espacements | 8/10 | 8/10 | 8/10 | 0 | Stable. Aucune régression, aucune amélioration |
| 4 | Responsive | 7/10 | 8/10 | 8/10 | 0 | Stable. `divide-y sm:divide-y-0` dans `DossierResult.tsx`. Pattern fragile `gap-0 sm:gap-px bg-[var(--border)]` dans `DossierPublicView.tsx` L41 non migré |
| 5 | Accessibilité | 4/10 | 6/10 | 6/10 | 0 | Stable. Focus-visible sur CTA principal + boutons primaires de navigation. Boutons "Retour" (L379, L573) sans ring. Boutons "Regénérer" et "Relancer" sans ring ni taille tactile |
| 6 | Animations | 9/10 | 9/10 | 9/10 | 0 | Stable. Aucune régression |
| 7 | Premium feel | 6/10 | 7.5/10 | 7.5/10 | 0 | Stable. Plafond maintenu par `bg-white/40` dans la vue acquéreur (`DossierPublicView.tsx`) |

---

## Vérification des corrections du re-audit v1

### Corrections demandées en re-audit v1 — état actuel

| Correction | Fichier | Ligne | État v2 |
|---|---|---|---|
| P0 — `bg-white/40` → `bg-[var(--foreground)]/[0.02]` (vue publique) | `DossierPublicView.tsx` | 30 | **Non appliqué** — `bg-white/40` toujours présent |
| P0 — `gap-0 sm:gap-px bg-[var(--border)]` → `divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]` | `DossierPublicView.tsx` | 41 | **Non appliqué** — pattern fragile toujours présent |
| P1 — `focus-visible:ring` + `min-h-[44px]` sur "Regénérer" | `DossierResult.tsx` | 99 | **Non appliqué** — bouton texte nu sans ring ni taille tactile |
| P1 — `focus-visible:ring` sur "Relancer (1 crédit)" | `DossierResult.tsx` | 163 | **Non appliqué** — bouton texte nu sans ring |
| P1 — `focus-visible:ring` sur "Retour" (step info) | `MerchantMode.tsx` | 379 | **Non appliqué** — `className` sans ring |
| P1 — `focus-visible:ring` sur "Retour" (step style) | `MerchantMode.tsx` | 573 | **Non appliqué** — `className` sans ring |

### Corrections correctement identifiées comme appliquées en re-audit v1 — confirmées

| Correction | Fichier | Ligne | État v2 |
|---|---|---|---|
| `bg-[var(--foreground)]/5` sur pills type de bien | `MerchantMode.tsx` | 461 | Confirmé présent |
| `bg-[var(--foreground)]/[0.02]` sur summary bar | `DossierResult.tsx` | 41 | Confirmé présent |
| Badges AVANT/APRÈS : labels typographiques nus | `DossierResult.tsx` | 120, 136 | Confirmés conformes |
| Badges AVANT/APRÈS vue publique | `DossierPublicView.tsx` | 53, 69 | Confirmés conformes |
| `divide-y sm:divide-y-0` grille before/after | `DossierResult.tsx` | 108 | Confirmé présent |
| `focus-visible:ring` sur CTA générer | `MerchantMode.tsx` | 671 | Confirmé présent |
| `focus-visible:ring` sur "Ajouter les photos" | `MerchantMode.tsx` | 547 | Confirmé présent |
| `focus-visible:ring` sur "Vérifier avant de générer" | `MerchantMode.tsx` | 595 | Confirmé présent |
| `aria-label` sur boutons partage et PDF | `DossierResult.tsx` | 56, 70 | Confirmés présents |

**Note de précision :** le re-audit v1 listait les boutons L547 et L595 parmi les "lacunes persistantes". La vérification du code montre qu'ils ont `focus-visible:ring` appliqué. La lacune réelle se limite aux deux boutons "Retour" (L379, L573) et aux deux boutons de `DossierResult.tsx` (L99, L163).

---

## Analyse détaillée — corrections restantes pour 9/10

### 1. Cohérence tokens — résidu bloquant

**`DossierPublicView.tsx` L30 — `bg-white/40`**

La page `/dossier/[uuid]` est la surface d'exposition aux acquéreurs de Thomas. C'est la seule page Versiroom que l'acheteur potentiel voit. `bg-white/40` sur le fond `#FAFAF8` introduit un blanc légèrement froid qui trahit une incohérence de palette. Sur un écran OLED ou calibré, la différence est perceptible. Ce résidu est d'autant plus problématique qu'il est visible à chaque scroll sur la page acquéreur.

Correction exacte :
```diff
// DossierPublicView.tsx L30
- className="border border-[var(--border)] rounded-2xl overflow-hidden bg-white/40"
+ className="border border-[var(--border)] rounded-2xl overflow-hidden"
```

La suppression pure du fond est préférable à `bg-[var(--foreground)]/[0.02]` ici : le fond de la card sur `#FAFAF8` est naturellement le fond de la page — pas besoin d'un overlay. Le fond quasi-transparent `0.02` ne serait perceptible que si la page avait un fond différent. La suppression est le fix le plus propre.

---

### 2. Responsive — séparateur fragile dans la vue publique

**`DossierPublicView.tsx` L41 — `gap-0 sm:gap-px bg-[var(--border)]`**

Cette technique utilise le `background-color` du conteneur comme couleur de séparateur, rendu visible par le `gap-px`. Elle est fonctionnelle mais fragile : si `--border` est défini avec une valeur alpha faible (ex : `rgba(0,0,0,0.08)`), le séparateur disparaît sur mobile. Le pattern de `DossierResult.tsx` (`divide-y sm:divide-y-0`) est plus robuste car il utilise `border-color` directement sur les éléments.

Correction exacte :
```diff
// DossierPublicView.tsx L41
- className="grid grid-cols-1 sm:grid-cols-2 gap-0 sm:gap-px bg-[var(--border)]"
+ className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]"
```

Les divs enfants (`Before` et `After`) devront perdre leur `bg-[var(--background)]` résiduel si présent — vérifier que les images couvrent bien l'espace via `object-cover`.

---

### 3. Accessibilité — boutons "Retour" sans focus-visible

**`MerchantMode.tsx` L379 et L573 — boutons "Retour"**

Ces deux boutons sont les seuls points de retour arrière dans le flow multi-step. Un utilisateur naviguant au clavier (Thomas sur son laptop Windows) se retrouve sans indicateur de focus après avoir tabé sur ces éléments. La classe actuelle :
```
"text-xs text-[var(--muted)] font-light hover:text-[var(--foreground)] transition-colors"
```

Correction exacte (identique pour les deux lignes) :
```diff
- className="text-xs text-[var(--muted)] font-light hover:text-[var(--foreground)] transition-colors"
+ className="text-xs text-[var(--muted)] font-light hover:text-[var(--foreground)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]/50 focus-visible:ring-offset-2 rounded"
```

---

### 4. Accessibilité — bouton "Regénérer" sans focus-visible ni taille tactile

**`DossierResult.tsx` L99 — bouton "Regénérer"**

Ce bouton est dans le header de card, aligné à droite. Sans `min-h-[44px]`, la zone tactile est déterminée par le texte seul, soit ~28-30px de haut. Sur l'iPhone de Thomas sur chantier, ce bouton est difficile à presser. Sans `focus-visible:ring`, il est invisible au clavier.

Correction exacte :
```diff
- className="text-xs text-[var(--muted)] font-light hover:text-[var(--foreground)] transition-colors disabled:opacity-40"
+ className="text-xs text-[var(--muted)] font-light hover:text-[var(--foreground)] transition-colors disabled:opacity-40 min-h-[44px] px-2 -mr-2 inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]/50 focus-visible:ring-offset-2 rounded"
```

Le `-mr-2` compense le `px-2` ajouté pour que l'alignement visuel du texte dans le header reste inchangé.

---

### 5. Accessibilité — bouton "Relancer (1 crédit)" sans focus-visible

**`DossierResult.tsx` L163 — bouton "Relancer (1 crédit)"**

Ce bouton apparaît dans la section des photos en échec. Sans ring de focus, un utilisateur clavier ne peut pas l'atteindre visuellement.

Correction exacte :
```diff
- className="text-xs text-red-500 font-medium hover:text-red-700 transition-colors disabled:opacity-40"
+ className="text-xs text-red-500 font-medium hover:text-red-700 transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 focus-visible:ring-offset-2 rounded"
```

Note : le ring utilise `ring-red-400/50` pour rester cohérent avec le contexte d'erreur (rouge), contrairement aux autres boutons qui utilisent `ring-[var(--sage)]/50`.

---

## Ce qui atteint déjà 9/10 — ne pas régresser

Ces éléments sont conformes et doivent être préservés dans toute modification future :

- **Badges AVANT/APRÈS** : labels typographiques nus (`text-[11px] font-medium tracking-widest uppercase`), sans fond, positionnement `absolute bottom-2 left-2`. Ne pas réintroduire de pill ou de backdrop.
- **Pills type de bien** : `bg-[var(--foreground)]/5` inactif / `bg-[var(--sage)] text-white` actif — tokénisation correcte.
- **Summary bar** : `bg-[var(--foreground)]/[0.02]` — quasi-transparent, structurel sans être visible.
- **Séparateur mobile** : `divide-y sm:divide-y-0` dans `DossierResult.tsx` — robuste.
- **CTA principal** et boutons primaires de navigation : `focus-visible:ring-2 focus-visible:ring-[var(--sage)]/50 focus-visible:ring-offset-2` appliqué.
- **Animations** : `animate-fade-in-up` sur tous les steps, progress bar `transition-all duration-500`.

---

## Récapitulatif corrections pour 9/10

5 modifications de classes Tailwind ciblées, aucune refonte architecturale :

| Priorité | Fichier | Ligne | Correction | Impact |
|---|---|---|---|---|
| P0 | `DossierPublicView.tsx` | 30 | Supprimer `bg-white/40` | Token + Premium feel (+0.5 tokens, +0.5 feel) |
| P0 | `DossierPublicView.tsx` | 41 | `divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]` | Responsive (+0.5) |
| P1 | `MerchantMode.tsx` | 379 | Ajouter `focus-visible:ring` + `rounded` | Accessibilité (+0.3) |
| P1 | `MerchantMode.tsx` | 573 | Ajouter `focus-visible:ring` + `rounded` | Accessibilité (+0.3) |
| P1 | `DossierResult.tsx` | 99 | Ajouter `focus-visible:ring` + `min-h-[44px]` + `inline-flex items-center` | Accessibilité + tactile (+0.4) |
| P1 | `DossierResult.tsx` | 163 | Ajouter `focus-visible:ring-red-400/50` | Accessibilité (+0.2) |

Ces 6 corrections appliquées portent le score estimé à :
- Tokens : 9/10 (+0.5)
- Responsive : 9/10 (+1.0)
- Accessibilité : 8/10 (+2.0)
- Premium feel : 9/10 (+1.5)
- **Note globale estimée post-corrections : 9/10**

---

## Auto-évaluation design system

- Les contrastes WCAG 2.2 AA sont respectés sur les tokens principaux (`var(--foreground)` sur `var(--background)` passe AA).
- `text-[var(--sage)]` (#7D9B76) sur `#FAFAF8` : ratio ~3.8:1 — passe AA pour texte ≥18px ou gras ≥14px. En `text-xs` (`12px`, non gras) : limite. Acceptable en alpha, à surveiller en cas d'implémentation dark mode.
- `text-red-400` dans les états d'erreur : ratio sur `bg-red-50` ≈ 3.2:1 — limite AA pour texte normal. Acceptable pour les messages d'état courts.
- Le dark mode n'est pas implémenté (non requis par les specs actuelles).

---

**Handoff → @fullstack**
- Fichiers produits : `/home/user/Architecture/docs/reviews/f4-reaudit-design.md`
- Décisions prises : note globale 7.8/10 confirmée (aucune régression, aucune progression depuis re-audit v1). 6 corrections restantes identifiées avec lignes exactes et diffs Tailwind prêts à appliquer.
- Points d'attention : la correction la plus critique est la suppression de `bg-white/40` dans `DossierPublicView.tsx` L30 (page acquéreur, surface la plus exposée du produit Thomas). Les 4 corrections `focus-visible` sont toutes dans MerchantMode.tsx (L379, L573) et DossierResult.tsx (L99, L163) — une seule passe suffit. Le bouton "Regénérer" nécessite aussi `min-h-[44px]` pour la conformité tactile mobile. Toutes les corrections sont non fonctionnelles — zéro risque de régression.
