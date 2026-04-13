# Audit Design — Contour du bâtiment (Round 2)
**Composant :** `components/marchand/PlanEditor.tsx`
**Date :** 2026-04-13
**Auditeur :** @design
**Note R1 :** 5.5/10 → **Note R2 : 8.2/10**

---

## Verdict par critère

### C1 — Cohérence palette (P1 corrigé)
**PASS — 9/10**
`OUTLINE_COLOR = "#7D9B76"` extrait en constante nommée. Le sage s'applique uniformément au border, au handle background, au label color. Zéro valeur hex en dur dans le JSX.
Bémol mineur : `OUTLINE_SHADOW` utilise `rgba(125, 155, 118, 0.15)` au lieu de référencer `OUTLINE_COLOR` — incohérence de maintenance si la couleur change.

### C2 — Touch targets WCAG 2.2 AA (P0 corrigé)
**PASS — 9/10**
`HANDLE_HIT_SIZE = 44` (ligne 164) avec `pointer-events-auto` sur la zone hit et `pointerEvents: "none"` sur le dot visuel. Centrage parfait via flexbox. Pattern conforme : zone 44×44px invisible + dot 14px centré = standard Apple HIG.
Bémol : `HANDLE_HIT_SIZE` est partagé avec les poignées de pièces — si une pièce très petite force une réduction, les handles outline héritent de la régression. Acceptable en l'état.

### C3 — Hiérarchie z-index (P1 corrigé)
**PASS — 9/10**
Architecture propre et documentée :
- `OUTLINE_Z_VISUAL = 1` (sous pièces z-10/15/20)
- `OUTLINE_Z_HANDLES = 4` (au-dessus pièces, sous guides z-5)
Séparation visuel / interactif sur deux `<div>` distincts : excellente décision — le `pointer-events-none` de l'overlay visuel ne pollue pas les handles.

### C4 — Lisibilité du label (P2 corrigé)
**PASS — 7.5/10**
Position inside `top-1 left-1.5` : résout le débordement hors viewport. Fond `rgba(255,255,255,0.9)` assure la lisibilité sur plan dense. Taille `text-[12px] font-medium` acceptable.
Deux points à surveiller :
1. **Contraste à vérifier** : `#7D9B76` sur `rgba(255,255,255,0.9)` ≈ 3.1:1 — en dessous du seuil WCAG 4.5:1 pour le texte normal. Passerait avec `font-weight: 600` ou en montant à `text-[13px]`. Non bloquant pour un label secondaire mais à corriger.
2. **Collision possible** : si le contour est très petit (ex : bâtiment de 8% de la surface), le label déborde sur les handles. Aucune contrainte `max-w` ou `hidden` conditionnelle.

### C5 — Maintenabilité des constantes (P1 corrigé)
**PASS — 8/10**
9 constantes nommées dans un bloc dédié (lignes 170-180), commentaire séparateur `─── Building outline design tokens ───`. Lecture d'un coup d'œil. Le regroupement avec `HANDLE_SIZE` / `HANDLE_HIT_SIZE` au-dessus (lignes 163-164) est cohérent.
Point d'amélioration : `OUTLINE_SHADOW` encode manuellement les composantes RGB du sage — préférer une fonction `hexToRgba(OUTLINE_COLOR, 0.15)` ou au moins un commentaire `/* same as OUTLINE_COLOR */`.

---

## Résumé des corrections R1 → R2

| Correction | Statut | Impact |
|---|---|---|
| P0 — Touch targets 44×44px | FAIT | Conformité WCAG 2.2 AA rétablie |
| P1 — Palette sage + constantes | FAIT | Brand consistency + maintenabilité |
| P1 — Z-index séparé visuel/handles | FAIT | Supprime le conflit d'interaction avec les pièces |
| P2 — Label inside + fond | FAIT | Lisibilité sur tous viewports |

---

## Points résiduels (non bloquants)

- **Contraste label** : `#7D9B76` sur blanc ≈ 3.1:1 — insuffisant WCAG AA texte normal. Corriger en `font-semibold` ou `#5E7A57` (sage foncé).
- **OUTLINE_SHADOW** : valeur RGB découplée de `OUTLINE_COLOR` — risque de dérive si couleur change.
- **Pas de `aria-hidden="true"`** sur la div handles : ces éléments ont des listeners souris/touch mais pas de rôle ARIA ni de `aria-label`. Ajouter `role="button" aria-label="Redimensionner le contour — coin [nw/ne/sw/se]"` pour accessibilité clavier.

---

## Note finale

**8.2 / 10**

Les 4 corrections P0/P1/P2 de R1 sont proprement implémentées. L'architecture du composant est solide : séparation visuel/interactif, constantes nommées, z-index documenté. Le gap résiduel tient à un contraste de label limite et à l'absence de rôle ARIA sur les handles interactifs.

---

**Handoff → @fullstack**
- Fichier audité : `/home/user/Architecture/components/marchand/PlanEditor.tsx`
- Corrections R2 validées : lignes 163-180 (constantes) + 1226-1300 (overlay JSX)
- Actions résiduelles : (1) label `font-semibold` ou couleur `#5E7A57` pour contraste WCAG, (2) `role="button" aria-label="..."` sur les 4 handles resize, (3) commentaire `/* same as OUTLINE_COLOR */` dans `OUTLINE_SHADOW`
