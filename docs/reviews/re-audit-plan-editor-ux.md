# Re-audit UX — PlanEditor (post-11 corrections)
Date : 2026-04-11 | Agent : @ux | Référence audit précédent : 6.2/10

## Vérification des 5 corrections signalées

| Critique | Statut | Évidence dans le code |
|---|---|---|
| C1 — Suppression sans confirmation | FIXE | `pendingDeleteId` + confirmation inline (l. 1435-1466), texte "Supprimer X ?" + Oui/Non |
| C2 — Save indicator | NON RÉSOLU | Aucun indicateur de sauvegarde détecté. `onRoomsChange` déclenche un callback parent mais aucun feedback visuel dans PlanEditor (pas de toast, pas de badge "Modifications non sauvegardées") |
| C3 — Toolbar surchargée | FIXE | Dropdown "Options" (l. 913-931) masque Calibrer + toggle Plan/Projet par défaut |
| C4 — Labels undo/redo | FIXE | `<span className="hidden sm:inline">Annuler</span>` / "Refaire" (l. 790, 809) + aria-label détaillé avec raccourci |
| C5 — Aide simplifiée | FIXE | Ligne unique + bouton "En savoir plus" expandable (l. 730-750) |

## Note

**7.8 / 10** — progression de +1.6 pts vs audit précédent.

## Ce qui manque pour atteindre 9.5/10

**C2 — Save indicator (bloquant, -1.2 pts)**
Thomas ne sait jamais si ses modifications sont sauvegardées. Le parent reçoit `onRoomsChange` mais PlanEditor n'affiche aucun signal. Sur un outil pro avec des données patrimoniales (surfaces de vente), l'absence de feedback est une friction critique. Fix attendu : badge "Modifications en attente" / "Sauvegardé" piloté par un prop `saveStatus` ou une logique interne de debounce.

**Confirmation suppression trop compacte (-0.3 pts)**
Les boutons "Oui" / "Non" (l. 1448-1464) ont `min-h-[32px]`, en dessous des 44px requis WCAG pour les cibles tactiles. Sur mobile, risque de confirmation accidentelle sur une pièce adjacente.

**Undo/redo masqués sur mobile (-0.1 pt)**
`<span className="hidden sm:inline">` masque les labels texte en dessous de 640px. Sur mobile, Thomas voit deux icônes fléchées sans label — le pattern reste acceptable grâce aux aria-labels, mais la cohérence avec le desktop est perdue.

## Verdict

**NO-PASS — 7.8/10**. Seuil 9.5 non atteint. Une seule correction bloquante restante : C2 save indicator.

Priorité : implémenter un prop `saveStatus: "idle" | "pending" | "saved" | "error"` dans PlanEditor, avec badge visible dans la toolbar. Corriger également les touch targets des boutons de confirmation (32px → 44px).
