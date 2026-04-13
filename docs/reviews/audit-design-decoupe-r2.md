# Audit Design — Page "Découpe en biens" (Étape 3) — R2

**Agent** : @design
**Date** : 2026-04-13
**Périmètre** : `app/projet/[id]/decoupe/page.tsx` + `components/marchand/PlanEditor.tsx`
**Révision** : R2 (post-corrections sprint R1)

---

## Scores R1 → R2

| # | Critère | Note R1 | Note R2 | Delta | État |
|---|---------|---------|---------|-------|------|
| 1 | Tokens — cohérence système | 6/10 | 7.5/10 | +1.5 | PlanEditor nettoyé (#4A7A42→sage, bg-[#7D9B76]/[0.08]) mais page.tsx conserve les hex bruts (décision cohérence cross-page) |
| 2 | Hiérarchie visuelle | 8/10 | 8.5/10 | +0.5 | Inchangée — CTA backdrop-blur-sm renforce la séparation fond/barre |
| 3 | Couleurs de lots | 7/10 | 9.5/10 | +2.5 | D97706/DB2777/EA580C conformes WCAG 3:1 — LOT_COLORS vérifiés ligne 23-27 |
| 4 | Plan Editor — lisibilité | 7.5/10 | 8/10 | +0.5 | applyOpacityToColor() résout le conflit hex/RGBA — overlays correctement différenciés |
| 5 | Interactions — états | 7/10 | 8.5/10 | +1.5 | Pills mobiles ont onClick toggle highlightedLotId (ligne 775) + min-h-[44px] |
| 6 | Responsive mobile | 6.5/10 | 9/10 | +2.5 | Bottom sheet complet : backdrop, pill grabber, safe-area-inset-bottom, nom de pièce dans le titre |
| 7 | Feedback visuel — assignation | 8/10 | 8.5/10 | +0.5 | Save toast ajouté (ligne 824-830) + confirmation delete |
| 8 | Espacement | 7.5/10 | 8/10 | +0.5 | Inchangé — rythme solide |
| 9 | Cohérence cross-pages | 7/10 | 7.5/10 | +0.5 | Structure partagée inchangée — tokens hex conservés intentionnellement |
| 10 | États différenciés — cards, selects | 6.5/10 | 8.5/10 | +2 | appearance-none + focus: sur select (ligne 690), hover card lot présent, delete confirmation inline |

**Note R1 : 7.1/10 → Note R2 : 8.35/10 (+1.25 pts)**

---

## Résidus à traiter (non-bloquants)

| Priorité | Critère | Fix restant |
|----------|---------|-------------|
| P1 | Critère 1 — Tokens | Migration tailwind.config non appliquée (décision explicite) : acceptable à court terme mais `bg-[#FAFAF8]` et `text-[#1C1C1E]` restent hors-système — créer des classes utilitaires dans globals.css comme alternative sans modifier le tailwind.config cross-pages. |
| P2 | Critère 4 — PlanEditor lisibilité | La boîte d'aide PlanEditor (ligne 791) utilise `bg-[#7D9B76]/[0.08]` — valeur fractionnaire non standard Tailwind (devrait être `/10` ou `/5`) — risque de non-application selon la version Tailwind. |
| P2 | Critère 9 — Cohérence cross-pages | Documenter la décision "tokens hex délibérément conservés pour cohérence cross-page" dans un commentaire de code pour éviter une future correction automatique erronée. |

---

## Verdict R2

**8.35/10 — GO**

Toutes les corrections P0 et P1 sont correctement appliquées. La page passe le seuil critique : fonctionnalité d'assignation accessible sur mobile, contrastes WCAG conformes, touch targets 44px, pills interactives. Les résidus sont P1/P2, non-bloquants pour la mise en production.

---

**Handoff → @fullstack**

- Fichier produit : `docs/reviews/audit-design-decoupe-r2.md`
- Décisions confirmées : bottom sheet pattern mobile validé, couleurs lots WCAG conformes, applyOpacityToColor() en place
- Points d'attention résiduels : valeur `[0.08]` PlanEditor ligne 791 à normaliser en `/10` ; créer alias CSS dans globals.css si les tokens hex doivent rester sans toucher tailwind.config
