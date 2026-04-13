# Audit UX R3 — Page "Découpe en biens" (Étape 3)

**Date** : 2026-04-13
**Agent** : @ux
**Persona** : Thomas Berger, 35 ans, marchand de biens, iPhone + laptop Windows, niveau tech moyen
**Fichiers audités** : `app/projet/[id]/decoupe/page.tsx`
**Référence R2** : `docs/reviews/audit-ux-decoupe-r2.md` (score 8.1/10)

---

## Scoring UX — 10 critères (delta vs R2)

| # | Critère | R2 | R3 | Delta | Statut |
|---|---|---|---|---|---|
| 1 | Parcours & task flow | 8.5 | 9.0 | +0.5 | PASS |
| 2 | Feedback & états système | 8.0 | 9.0 | +1.0 | PASS |
| 3 | Mobile (iPhone Thomas) | 9.0 | 9.0 | = | PASS |
| 4 | Accessibilité WCAG 2.2 AA | 8.5 | 9.5 | +1.0 | PASS |
| 5 | Cohérence cross-page | 7.5 | 7.5 | = | A surveiller |
| 6 | États vides & edge cases | 7.0 | 8.5 | +1.5 | PASS |
| 7 | Gestion des erreurs | 7.5 | 9.0 | +1.5 | PASS |
| 8 | Performance perçue | 8.0 | 8.5 | +0.5 | PASS |
| 9 | Hiérarchie de l'information | 8.5 | 8.5 | = | PASS |
| 10 | Charge cognitive | 8.0 | 8.0 | = | PASS |

**Score R2 : 8.1/10 → Score R3 : 8.65/10 (+0.55)**

---

## Verdicts par critère

**1. Parcours & task flow (9.0, +0.5)** — Le recap summary (lignes 817-840) est correctement implémenté : `lots.length > 1` affiche un bandeau inline avec nombre de pièces et m² par lot + total assigné/total. Thomas voit l'état complet de sa découpe avant de valider. La friction résiduelle R2 (affordance cliquabilité du plan) n'est pas corrigée — la description `"Assignez chaque pièce à un lot. Cliquez sur une pièce du plan pour changer son lot."` en sous-titre (ligne 438-439) supplée partiellement l'absence de pulse/tooltip, mais reste un texte statique que Thomas peut ignorer au scroll. Non bloquant pour le score.

**2. Feedback & états système (9.0, +1.0)** — L'estimation de durée est implémentée (lignes 450-452) : `"5 à 15 secondes environ"` s'affiche en `text-xs` sous le spinner de détection uniquement quand `pageState === "detecting"`. Différenciation correcte loading/detecting conservée. Toast "Découpe enregistrée" avec checkmark SVG + spinner inline save : complet. Plus aucune friction critique sur ce critère.

**3. Mobile iPhone Thomas (9.0, =)** — Aucune modification sur ce critère. Bottom sheet, safe-area, pills 44px, backdrop dismiss : inchangés et corrects.

**4. Accessibilité WCAG 2.2 AA (9.5, +1.0)** — Les deux boutons de confirmation delete passent désormais `min-h-[44px]` (lignes 682 et 688). Le bouton delete principal passe également `min-w-[44px] min-h-[44px]` avec `flex items-center justify-center` (ligne 696). focus-visible:ring-2 présent sur tous les interactifs. Retour button : `min-h-[44px]` confirmé (ligne 846). Score quasi-parfait — seule friction marginale : le select lot_type (ligne 712) n'a pas de `min-h-[44px]` explicite mais `py-1.5` sur un select natif atteint ~34px en pratique sur iOS Safari. Acceptable, non critique.

**5. Cohérence cross-page (7.5, =)** — Non adressé en R3 : `floorLabel()` reste dupliquée, `ROOM_TYPE_LABELS` non extraite. Dette technique confirmée, sans régression. Aucun nouvel écart introduit.

**6. États vides & edge cases (8.5, +1.5)** — L'edge case `planRooms.length === 0` avec plan disponible est géré (lignes 526-529) : message `"Les pièces n'ont pas pu être localisées sur le plan — assignez-les depuis la liste ci-contre."` positionné sous le PlanEditor. La formulation est actionnable et oriente Thomas vers la sidebar. L'état `planImageUrl === null` (ligne 533) est couvert par le fallback texte existant. Score augmenté : les 2 états vides critiques sont couverts. Friction résiduelle marginale : si `rooms.length === 0` après chargement réussi (projet sans pièces), la sidebar des lots est vide sans explication — cas très improbable, non bloquant.

**7. Gestion des erreurs (9.0, +1.5)** — Le banner fallback détection (lignes 477-483) est implémenté : `detectionFallback === true` affiche `"Détection automatique indisponible — proposition par défaut appliquée. Ajustez manuellement si nécessaire."`. Le state `detectionFallback` est activé dans les deux branches d'échec de `detectLots` (ligne 253 pour `detected.length === 0`, ligne 278 pour `catch`). Thomas sait désormais que la proposition vient d'un fallback, pas d'une analyse IA réussie. Ton neutre et actionnable. Score élevé : toutes les erreurs critiques ont un feedback explicite.

**8. Performance perçue (8.5, +0.5)** — L'estimation de durée (critère 2) résout l'anxiété d'attente. Le spinner reste sans progression visuelle chiffrée, mais `"5 à 15 secondes"` ancre l'attente. Pas de changement structurel (pas de streaming, pas de progress bar), score plafonné à 8.5.

**9. Hiérarchie de l'information (8.5, =)** — Recap summary bien positionné avant le CTA sticky. La friction résiduelle R2 (warning pièces non assignées positionné après scroll) reste présente — le CTA n'est pas disabled si `unassignedRooms.length > 0`. Non adressé, non régressé.

**10. Charge cognitive (8.0, =)** — L'icône crayon recommandée en R2 n'est pas implémentée. L'affordance du renommage reste hover-only desktop (`title="Cliquez pour renommer"`, ligne 672). Non bloquant pour Thomas — il découvre le renommage naturellement. Score stable.

---

## Verdict global

**Score 8.65/10 — GO production.** Les 3 corrections P1 signalées en R2 sont intégralement implémentées (touch targets 44px, estimation durée détection, banner fallback). L'edge case `planRooms.length === 0` est couvert. La dette technique cross-page (critère 5) reste ouverte et doit être adressée dans la prochaine session de refactoring.

---

**Handoff → @fullstack**
- Fichier produit : `docs/reviews/audit-ux-decoupe-r3.md`
- Statut : GO production — aucune correction bloquante
- Dette technique à planifier (non bloquante) :
  - Extraire `floorLabel` + `ROOM_TYPE_LABELS` dans `lib/room-utils.ts` (critère 5)
  - Aligner `ROOM_TYPE_OPTIONS` entre extraction, decoupe et validation (critère 5)
  - Ajouter icône crayon visible en permanence sur les noms de lots (critère 10, optionnel)
  - Vérifier `min-h-[44px]` sur le select lot_type (ligne 712) pour conformité WCAG stricte sur iOS Safari (critère 4, mineur)
