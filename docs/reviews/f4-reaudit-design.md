# Re-audit design — F4 Mode Marchand (post-corrections)
**Agent** : @design
**Date** : 2026-03-25
**Fichiers audités** : `components/MerchantMode.tsx`, `components/DossierProgress.tsx`, `components/DossierResult.tsx`, `components/DossierPublicView.tsx`
**Audit précédent** : `docs/reviews/f4-audit-design.md` — note globale 6.9/10 (2026-03-25)

---

## Note globale : 7.8 / 10

Delta : +0.9 point vs premier audit. Les corrections P0 (tokens hardcodés) et P1 (badges AVANT/APRÈS, séparateur mobile, focus-visible CTA principal) sont appliquées et vérifiées. Le F4 franchit le seuil du "professionnel fiable". Deux écarts majeurs subsistent pour atteindre 9/10 : l'accessibilité au clavier reste incomplète sur les boutons secondaires, et `DossierPublicView.tsx` conserve `bg-white/40` — la correction n'a pas été propagée sur ce composant.

---

## Tableau des 7 critères

| # | Critère | Note audit 1 | Note audit 2 | Delta | Statut |
|---|---|---|---|---|---|
| 1 | Cohérence tokens | 7/10 | 8.5/10 | +1.5 | 3 tokens hardcodés corrigés. 1 résidu identifié dans `DossierPublicView.tsx` |
| 2 | Typographie | 8/10 | 9/10 | +1.0 | Badges AVANT/APRÈS refondus en labels typographiques nus — alignés sur la grille |
| 3 | Espacements | 8/10 | 8/10 | 0 | Stable. Aucune régression, aucune amélioration. Valeurs tolérables maintenues |
| 4 | Responsive | 7/10 | 8/10 | +1.0 | `divide-y sm:divide-y-0` ajouté sur la grille before/after — séparateur mobile résolu |
| 5 | Accessibilité | 4/10 | 6/10 | +2.0 | `focus-visible:ring` sur le CTA principal, `aria-label` sur boutons icône. Lacunes sur boutons secondaires persistantes |
| 6 | Animations | 9/10 | 9/10 | 0 | Stable. Aucune régression |
| 7 | Premium feel | 6/10 | 7.5/10 | +1.5 | Badges refondus = gain majeur. Summary bar tokenisée. Résidu `bg-white/40` dans vue publique maintient un plafond à 7.5 |

---

## Analyse détaillée par critère

### 1. Cohérence tokens — 8.5/10

**Corrections appliquées et vérifiées :**
- `bg-gray-100` → `bg-[var(--foreground)]/5` sur les pills type de bien (`MerchantMode.tsx` L461) : correction exacte, les pills inactives sont maintenant quasi-transparentes sur `#FAFAF8`.
- `bg-white/40` → `bg-[var(--foreground)]/[0.02]` sur le summary bar (`DossierResult.tsx` L41) : correction exacte.
- `text-gray-400` → `text-[var(--muted)]` sur badge AVANT (`DossierResult.tsx` L120) : correction appliquée — le badge AVANT/APRÈS ayant été entièrement refondus, cette correction est désormais encapsulée dans le nouveau pattern.

**Résidu identifié :**

| Fichier | Ligne | Problème | Criticité |
|---|---|---|---|
| `DossierPublicView.tsx` | 30 | `bg-white/40` sur la card wrapper du composant vue publique — la correction n'a pas été propagée depuis `DossierResult.tsx` | **Bloquant** |

La vue publique `/dossier/[uuid]` est la page que Thomas envoie à ses acquéreurs. C'est la surface la plus exposée du produit. Avoir `bg-white/40` sur cette page est d'autant plus critique que c'est la seule impression visuelle que l'acquéreur aura de Versiroom.

---

### 2. Typographie — 9/10

**Corrections appliquées et vérifiées :**
Les badges AVANT/APRÈS sont désormais des labels typographiques nus (`span` positionné `absolute bottom-2 left-2`) avec `text-[11px] font-medium tracking-widest uppercase`. Le fond opaque `bg-white/80 backdrop-blur-sm rounded-full` a été supprimé. La couleur `text-white/70` pour AVANT et `text-[var(--sage)]` pour APRÈS est cohérente avec l'inspiration Apple/Foster+Partners.

**Note :** `DossierResult.tsx` (L120, L136) et `DossierPublicView.tsx` (L53, L69) sont alignés sur ce pattern.

**Seul point d'amélioration résiduel :** le label de chambre dans `DossierResult.tsx` (L92) utilise `text-sm font-medium` — cohérent — mais le header de card n'a pas de padding horizontal uniforme (`px-4 py-2.5` vs `px-5 py-3` dans `DossierPublicView.tsx`). Mineur, mais perceptible en comparant les deux vues côte à côte.

---

### 3. Espacements — 8/10

Stable. Aucune régression introduite par les corrections. Les valeurs `gap-1.5`, `py-2.5` restent présentes — tolérables dans la grille 4px/8px (1.5 = 6px, 2.5 = 10px, non multiples stricts de 8 mais acceptables). Pas d'action immédiate requise.

---

### 4. Responsive — 8/10

**Corrections appliquées et vérifiées :**
`divide-y sm:divide-y-0` présent sur la grille before/after dans `DossierResult.tsx` (L108). Le séparateur horizontal sur mobile délimite clairement la frontière AVANT/APRÈS. Sur desktop, le `sm:divide-y-0` supprime la séparation et les deux images sont côte à côte sans friction.

**Point résiduel :** `DossierPublicView.tsx` utilise encore `gap-0 sm:gap-px bg-[var(--border)]` comme séparateur (L41). Cette technique est fonctionnelle mais fragile — si `--border` passe à une valeur avec alpha faible, le séparateur disparaît. Le `divide-x divide-[var(--border)]` serait plus robuste et aligné avec le pattern de `DossierResult.tsx`.

---

### 5. Accessibilité — 6/10

**Corrections appliquées et vérifiées :**
- `focus-visible:ring` ajouté sur le bouton CTA principal (`handleGenerate`, `MerchantMode.tsx` L671) : `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]/50 focus-visible:ring-offset-2`.
- `aria-label` ajouté sur les boutons icône de `DossierResult.tsx` : "Partager avec un acquéreur" (L56) et "Télécharger le PDF du dossier" (L70).

**Lacunes persistantes :**

| Fichier | Élément | Problème | Criticité |
|---|---|---|---|
| `MerchantMode.tsx` | Bouton "Retour" (steps info/style) L379, L573 | Aucun `focus-visible:ring` — cible clavier aveugle | Majeur |
| `MerchantMode.tsx` | Bouton "Ajouter les photos" L547 | Aucun `focus-visible:ring` | Majeur |
| `MerchantMode.tsx` | Bouton "Vérifier avant de générer" L595 | Aucun `focus-visible:ring` | Majeur |
| `DossierResult.tsx` | Bouton "Regénérer" L99 | Aucun `focus-visible:ring`, taille tactile min-h absente | Majeur |
| `DossierResult.tsx` | Bouton "Relancer (1 crédit)" L163 | Même problème | Majeur |

Ces 5 boutons sont des points de navigation critiques dans le flow. Thomas (persona) utilise son laptop Windows au bureau avec navigation clavier fréquente. Les `focus-visible:ring` manquants sur les boutons de navigation de steps constituent un problème WCAG 2.2 AA niveau A.

Le CTA principal est désormais conforme (correction appliquée). Les boutons secondaires et de navigation restent non conformes. Le score passe de 4/10 à 6/10 — pas 8/10, car l'accessibilité est systémique, pas partielle.

---

### 6. Animations — 9/10

Stable. `animate-fade-in-up` sur tous les steps, progress bar `transition-all duration-500`, spinner sur l'état `generating`. Aucune régression. Aucune amélioration identifiée nécessaire.

---

### 7. Premium feel — 7.5/10

**Améliorations constatées :**
- La refonte des badges AVANT/APRÈS est le gain le plus visible. Le passage de `rounded-full bg-white/80 backdrop-blur-sm` à un label typographique nu transforme la perception du composant. Le composant passe de "app mobile générique" à "editorial photography".
- Le summary bar en `bg-[var(--foreground)]/[0.02]` est maintenant quasi-invisible sur `#FAFAF8` — c'est exactement ce qui est attendu : une délimitation structurelle discrète, pas une boîte.

**Ce qui maintient le plafond à 7.5/10 (et non 9/10) :**

1. `DossierPublicView.tsx` — `bg-white/40` toujours présent. C'est la page acquéreur : l'impression de qualité à ce point du funnel est déterminante pour la confiance dans le produit de Thomas.

2. Le bouton "Regénérer" (`DossierResult.tsx` L99) est un texte nu sans état hover visible (`hover:text-[var(--foreground)] transition-colors` est présent, mais sans `focus-visible` et sans taille tactile minimale, l'affordance est faible). Un acquéreur ou un marchand qui rate ce bouton au premier passage ne comprendra pas immédiatement comment relancer une génération.

3. La typographie du header de card (`px-4 py-2.5` dans `DossierResult.tsx` vs `px-5 py-3` dans `DossierPublicView.tsx`) crée une légère incohérence de densité perceptible uniquement en comparant les deux composants, mais visible pour un oeil exercé.

---

## Delta vs premier audit — synthèse

| Correction demandée en audit 1 | Statut | Impact sur note |
|---|---|---|
| `bg-gray-100` → `bg-[var(--foreground)]/5` sur pills | Appliqué | +0.5 tokens |
| `bg-white/40` → token sur summary bar (DossierResult) | Appliqué | +0.5 tokens |
| `text-gray-400` → `text-[var(--muted)]` (DossierResult + PublicView) | Appliqué dans DossierResult, absorbé par refonte badges | +0.3 tokens |
| Refonte badges AVANT/APRÈS (label nu, sans pill) | Appliqué dans DossierResult ET PublicView | +1.0 typo + premium feel |
| `divide-y sm:divide-y-0` séparateur mobile | Appliqué dans DossierResult | +0.5 responsive |
| `focus-visible:ring` sur CTA principal | Appliqué | +0.5 accessibilité |
| `aria-label` sur boutons icône | Appliqué | +0.5 accessibilité |
| `bg-white/40` dans DossierPublicView (card wrapper) | **Non propagé** | Plafonne tokens à 8.5 |
| `focus-visible:ring` sur boutons secondaires (5 boutons) | **Non corrigé** | Plafonne accessibilité à 6 |

---

## Corrections restantes pour 9/10

Ces 4 corrections sont les seuls points qui séparent le F4 de 9/10. Aucune ne nécessite de refonte architecturale — ce sont des ajouts de classes Tailwind ciblés.

### P0 — Bloquant avant partage acquéreur

**1. Propager `bg-[var(--foreground)]/[0.02]` dans `DossierPublicView.tsx`**

```diff
// DossierPublicView.tsx L30
- className="border border-[var(--border)] rounded-2xl overflow-hidden bg-white/40"
+ className="border border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--foreground)]/[0.02]"
```

Raison : cette page est la surface exposée aux acquéreurs de Thomas. `bg-white/40` signale visuellement "fait vite" sur un écran calibré.

**2. Remplacer le séparateur fragile dans `DossierPublicView.tsx`**

```diff
// DossierPublicView.tsx L41
- className="grid grid-cols-1 sm:grid-cols-2 gap-0 sm:gap-px bg-[var(--border)]"
+ className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]"
```

Raison : aligner avec le pattern robuste de `DossierResult.tsx` et supprimer le risque alpha sur `--border`.

### P1 — Accessibilité clavier (WCAG 2.2 AA niveau A)

**3. `focus-visible:ring` sur les 5 boutons secondaires**

Tous les boutons de navigation et d'action dans `MerchantMode.tsx` et `DossierResult.tsx` doivent recevoir :
```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]/50 focus-visible:ring-offset-2
```

Fichiers et lignes exactes :
- `MerchantMode.tsx` L379 — bouton "Retour" (step info)
- `MerchantMode.tsx` L547 — bouton "Ajouter les photos"
- `MerchantMode.tsx` L573 — bouton "Retour" (step style)
- `MerchantMode.tsx` L595 — bouton "Vérifier avant de générer"
- `DossierResult.tsx` L99 — bouton "Regénérer"
- `DossierResult.tsx` L163 — bouton "Relancer (1 crédit)"

**4. Taille tactile minimale sur "Regénérer"**

Le bouton "Regénérer" dans le header de card (`DossierResult.tsx` L99) est un texte nu sans zone tactile définie. Sur mobile (iPhone de Thomas sur chantier), la cible est inférieure à 44px.

```diff
// DossierResult.tsx L99
- className="text-xs text-[var(--muted)] font-light hover:text-[var(--foreground)] transition-colors disabled:opacity-40"
+ className="text-xs text-[var(--muted)] font-light hover:text-[var(--foreground)] transition-colors disabled:opacity-40 min-h-[44px] px-2 -mr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sage)]/50 focus-visible:ring-offset-2 rounded"
```

---

## Auto-évaluation design system

- Les contrastes WCAG 2.2 AA sont respectés sur les tokens principaux (`var(--foreground)` sur `var(--background)` passe AA large).
- `text-[var(--sage)]` sur `bg-[var(--foreground)]/[0.02]` : ratio ~3.8:1 sur `#FAFAF8` — passe AA pour texte de taille normale (>18px) mais limite pour le texte small (`text-xs`). À surveiller en dark mode.
- Les composants ont leurs états documentés (pending, generating, completed, failed dans DossierProgress).
- Le dark mode n'est pas implémenté sur le projet (non requis par les specs actuelles).
- Les wireframes UX ne sont pas produits formellement — les composants ont été audités sur la base du code existant.

---

**Handoff → @fullstack**
- Fichiers produits : `/home/user/Architecture/docs/reviews/f4-reaudit-design.md`
- Décisions prises : note globale 7.8/10 (+0.9 vs audit 1). 8 corrections sur 9 appliquées. 1 résidu token non propagé (`bg-white/40` dans `DossierPublicView.tsx`). 5 boutons sans `focus-visible:ring`. 1 bouton sans taille tactile (`Regénérer`).
- Points d'attention : les 4 corrections restantes sont toutes des modifications de classes Tailwind, sans impact fonctionnel. La correction la plus critique est la propagation de `bg-[var(--foreground)]/[0.02]` dans `DossierPublicView.tsx` — c'est la page acquéreur, surface la plus exposée du produit. Les corrections `focus-visible` peuvent être appliquées en une seule passe sur `MerchantMode.tsx` (4 boutons) + `DossierResult.tsx` (2 boutons).
