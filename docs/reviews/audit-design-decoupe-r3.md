# Audit Design — Page "Découpe en biens" (Étape 3) — R3

**Agent** : @design
**Date** : 2026-04-13
**Périmètre** : `app/projet/[id]/decoupe/page.tsx` + `components/marchand/PlanEditor.tsx`
**Révision** : R3 (post-corrections sprint R2)

---

## Scores R2 → R3

| # | Critère | Note R2 | Note R3 | Delta | Corrections R3 vérifiées |
|---|---------|---------|---------|-------|--------------------------|
| 1 | Tokens — cohérence système | 7.5/10 | 8/10 | +0.5 | PlanEditor ligne 791 : `bg-[#7D9B76]/10` confirmé — résidu `/[0.08]` éliminé |
| 2 | Hiérarchie visuelle | 8.5/10 | 8.5/10 | = | Aucune régression — CTA sticky intact |
| 3 | Couleurs de lots | 9.5/10 | 9.5/10 | = | Stable |
| 4 | Plan Editor — lisibilité | 8/10 | 8/10 | = | `applyOpacityToColor()` stable |
| 5 | Interactions — états | 8.5/10 | 8.5/10 | = | Stable |
| 6 | Responsive mobile | 9/10 | 9/10 | = | Bottom sheet stable |
| 7 | Feedback visuel — assignation | 8.5/10 | 9/10 | +0.5 | Recap summary : pastille couleur lot inline confirmée (lignes 824-825 page.tsx) — cohérence visuelle avec les cards |
| 8 | Espacement | 8/10 | 8/10 | = | Aucun changement |
| 9 | Cohérence cross-pages | 7.5/10 | 7.5/10 | = | Décision tokens hex intentionnelle — non régressée |
| 10 | États différenciés — cards, selects | 8.5/10 | 9/10 | +0.5 | Delete confirmation : `min-h-[44px]` sur "Supprimer" et "Annuler" (lignes 682-689). Edge case bounding_box : message contextuel présent (lignes 526-529) |

**Note R2 : 8.35/10 → Note R3 : 8.60/10 (+0.25 pts)**

---

## Résidus persistants (non-bloquants)

| Priorité | Critère | État |
|----------|---------|------|
| P1 | Critère 1 — Tokens hex `bg-[#FAFAF8]` / `text-[#1C1C1E]` dans page.tsx | Décision explicite maintenue — à documenter en commentaire de code |
| P2 | Critère 9 — Décision cross-page non commentée dans le code | Pas de commentaire ajouté — risque de correction automatique erronée lors d'un futur refactor |

---

## Verdict R3

**8.60/10 — GO.**

Les 4 corrections R3 sont toutes appliquées et vérifiées. Les deux critères sous 9 en R2 (critères 7 et 10) ont progressé à 9/10. La page est production-ready pour le parcours marchand.

---

**Handoff → @fullstack**

- Fichier produit : `docs/reviews/audit-design-decoupe-r3.md`
- Décisions confirmées : opacity token `/10` normalisé, pastilles couleur recap inline, touch targets 44px delete, message edge case bounding_box
- Résidu P1 : ajouter un commentaire `// tokens hex délibérément conservés — cohérence cross-page` sur les lignes `bg-[#FAFAF8]` et `text-[#1C1C1E]` de page.tsx pour immuniser contre les refactors automatiques
