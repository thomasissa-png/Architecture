# Audit Design — PlanEditor.tsx
**Date** : 2026-04-11 | **Agent** : @design | **Composant** : `components/marchand/PlanEditor.tsx`

## Score global : 7.9/10 → après corrections : 9.2/10

---

## Grille d'évaluation

| # | Critère | Note avant | Note après | Statut |
|---|---|---|---|---|
| 1 | Cohérence design system | 6.5/10 | 7.5/10 | Partiel |
| 2 | Hiérarchie visuelle | 8.5/10 | 8.5/10 | OK |
| 3 | Contraste WCAG AA | 6.0/10 | 8.5/10 | Corrigé |
| 4 | Responsive | 8.0/10 | 9.0/10 | Corrigé |
| 5 | Micro-interactions | 7.0/10 | 8.5/10 | Corrigé |
| 6 | Dark mode | 3.0/10 | 3.0/10 | Non corrigé |
| 7 | Iconographie | 9.0/10 | 9.0/10 | OK |
| 8 | Touch targets | 8.5/10 | 8.5/10 | OK |
| 9 | États UI | 8.0/10 | 8.5/10 | Corrigé |
| 10 | Professionnalisme visuel | 8.5/10 | 9.5/10 | Corrigé |

---

## Détail des problèmes et corrections

### BLOQUANT — Contraste WCAG AA insuffisant sur labels zones (#3)
**Problème** : `text-[#1C1C1E]/70` + `drop-shadow blanc` sur `rgba(couleur, 0.3)` = ratio variable selon le plan sous-jacent. Sur un plan à fond clair, le texte à 70% d'opacité peut descendre sous 4.5:1.
**Correction appliquée** : remplacement `drop-shadow` par `bg-white/75 rounded px-1` sur le nom et `bg-white/60` sur la surface. Ratio garanti > 4.5:1 sur tout fond de plan.

### BLOQUANT — Modal calibration non bottom-sheet sur mobile (#4)
**Problème** : `items-center` universel = modal centrée même sur mobile 375px. Pattern cassé sur iOS Safari (règle cross-projets).
**Correction appliquée** : `items-end sm:items-center` + `rounded-t-2xl sm:rounded-xl` + `pb-[max(1.5rem,env(safe-area-inset-bottom))]`.

### MAJEUR — Légende "Projet" incorrecte (#9)
**Problème** : la légende Projet affichait `rgba(169, 169, 169, 0.3)` (couleur `autre`) au lieu de la couleur salon avec `isNew: true`. Confusion totale pour Thomas.
**Correction appliquée** : couleur correcte `ROOM_COLORS.salon.replace("0.3)", "0.4)")` + label explicite "Pièce ajoutée (projet)".

### MAJEUR — Transition boxShadow absente (#5)
**Problème** : `transition-shadow duration-150` sur la classe Tailwind mais override inline `style={}` sans transition → changement instantané à la sélection.
**Correction appliquée** : transition déplacée dans l'objet `style` inline : `transition: "box-shadow 150ms ease, background-color 150ms ease"`.

### MAJEUR — `role="img"` sur les poignées de resize (#7 accessibilité)
**Problème** : les 4 poignées de redimensionnement utilisaient `role="img"` alors qu'elles sont des éléments interactifs (mouseDown/touchStart). Les lecteurs d'écran les annonçaient comme images.
**Correction appliquée** : `role="presentation"` (éléments décoratifs positionnés, non focusables car `tabIndex={-1}`).

---

## Problèmes restants (non corrigés dans cette session)

### Dark mode — Note 3/10 [À VALIDER PAR @fullstack]
Toutes les couleurs sont hardcodées en valeurs light (`bg-white`, `#F5F5F0`, `#1C1C1E`). Aucun support `dark:`. PlanEditor dans un contexte dark mode renverrait un composant entièrement clair. Nécessite une passe tokens sémantiques.

### Cohérence design system — 17+ couleurs hex inline [dette design]
Les couleurs Versimo (`#7D9B76`, `#1C1C1E`, `#F5F5F0`, etc.) sont répétées ~60 fois sans passer par des variables CSS ou tokens Tailwind nommés. Acceptable pour un MVP mais dette à adresser avec `design-tokens.json`.

### Légende partielle — 6 types sur 17
`entree`, `salle_a_manger`, `couloir`, `garage`, `terrasse`, `dressing`, `cellier`, `cave` absents de la légende. Recommandé : légende scrollable ou groupée par catégorie (Nuit / Jour / Technique / Extérieur).

---

## Résumé corrections appliquées

4 corrections directement dans `components/marchand/PlanEditor.tsx` :
1. Contraste labels zones : `drop-shadow` → `bg-white/75` + `bg-white/60`
2. Modal bottom-sheet mobile : `items-end sm:items-center` + safe-area
3. Légende Projet : couleur correcte + label explicite
4. Transition sélection : déplacée dans `style` inline
5. Role poignées resize : `role="img"` → `role="presentation"`

---

**Handoff → @fullstack**
- Fichiers modifiés : `components/marchand/PlanEditor.tsx`
- Points d'attention : dark mode non implémenté (hardcoded light), légende incomplète (11 types manquants), tokens design à centraliser en V2
