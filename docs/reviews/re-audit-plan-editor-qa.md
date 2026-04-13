# Re-audit QA -- PlanEditor.tsx (2026-04-11)

Audit precedent : 7.5/10, 6 bugs (B1-B6).

## Bugs corriges (3/5 audites)

| Bug | Statut | Preuve |
|-----|--------|--------|
| B1 div/0 calibration | FIXE | `if (distPx < 1) return;` L672 + guard `distMetres <= 0` L668 |
| B3 nom vide accepte | FIXE | `previousName` restore L618-622 |
| B6 timer leak unmount | FIXE | `clearTimeout(longPressTimerRef)` L257-264 |

## Bugs NON corriges (2/5)

| Bug | Severite | Detail |
|-----|----------|--------|
| B2 closure stale pushUndo | P2 | `pushUndo` capture `rooms` via closure (L274). Deux mutations rapides dans le meme render cycle poussent le meme snapshot. Fix : `roomsRef.current` ou passer rooms en param. |
| B5 pas de throttle drag | P2 | `handlePointerMove` appele a chaque event sans rAF. Declenche `onRoomsChange` + `findAlignmentGuides` + `setAlignmentGuides` a 60-120 Hz. Fix : wrapper dans `requestAnimationFrame`. |

## Note re-audit

**8.5 / 10** -- progression de +1.0 pt. Les 3 bugs critiques (B1 div/0, B3 perte de donnee, B6 fuite) sont corriges proprement. Les 2 bugs restants (B2, B5) sont P2 : ils n'affectent pas la stabilite en usage normal mais degradent la robustesse sous charge rapide (undo incorrect) et la fluidite sur devices lents (drag sans throttle).

**Verdict : NO-PASS (8.5 < 9.5).** Corriger B2 + B5 pour atteindre le seuil.
