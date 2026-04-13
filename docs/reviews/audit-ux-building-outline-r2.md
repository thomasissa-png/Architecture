# Audit UX — Fonctionnalité "Contour du bâtiment" (PlanEditor)
Date : 2026-04-13 | Agent : @ux | Persona : Thomas Berger (marchand de biens)

## Note globale : 8.2 / 10

---

## 1. Découvrabilité — 8/10

**PASS.** Le contour s'affiche automatiquement dès que l'IA extrait le plan. Label "Contour du bâtiment" ancré top-left dans le cadre, fond blanc 90% opaque, couleur sage #7D9B76 contrastée sur fond de plan. Pointillé 2.5px lisible.

**P2 — friction légère :** le texte collapsible d'aide (l. 896) mentionne "Déplacez les pièces, redimensionnez-les" mais ne dit pas "le contour sage est redimensionnable". Un premier utilisateur peut ignorer les 4 poignées circulaires si elles sont partiellement hors du viewport sur petit écran.

---

## 2. Manipulabilité — 9/10

**PASS.** `HANDLE_HIT_SIZE = 44px` (l. 164) est conforme WCAG 2.2 AA. Les événements `onMouseDown` + `onTouchStart` sont câblés sur les 4 coins (l. 1278-1287). `e.stopPropagation()` sur mouseDown évite le conflit avec le drag des pièces.

**P2 — cursor manquant sur l'overlay :** le `div` overlay (l. 1228) est `pointer-events-none`, correct. Mais aucun `cursor: pointer` ni tooltip sur les handles en hover pour signaler l'interaction. L'affordance repose uniquement sur le curseur resize (`nwse-resize` / `nesw-resize`, l. 1273), ce qui est suffisant desktop mais invisible sur mobile.

---

## 3. Feedback — 7.5/10

**PASS partiel.** Le badge "Hors contour" (l. 1548-1551) + box-shadow rouge #DC3C3C (l. 1537) sur la pièce sont deux signaux visuels cumulés — bien.

**P1 — badge non actionnable (8px, illisible sur petites pièces) :** `text-[8px]` est sous le seuil WCAG (16px recommandé pour texte d'alerte). Sur une pièce de 60×50px display, le badge est illisible. Suggestion : passer à `text-[10px]` minimum + `title` tooltip avec message explicatif ("Cette pièce dépasse le contour du bâtiment — redimensionnez-la ou ajustez le contour").

**P2 — pas de feedback pendant le resize du contour :** aucun compteur ni indication des nouvelles dimensions pendant le drag des handles (contrairement aux pièces qui affichent la surface en m²).

---

## 4. Réversibilité — 9/10

**PASS.** `UndoSnapshot = { rooms, outline }` (l. 317) — le contour est inclus dans chaque snapshot. `handleUndo` et `handleRedo` restaurent bien l'outline (l. 345-347, 357-359). `UNDO_MAX_HISTORY = 20` (l. 168) — 20 états suffisants.

**P2 — edge case :** si `prev.outline` est `null` (contour supprimé), le undo ne rappelle pas `onBuildingOutlineChange(null)` car la condition est `if (prev.outline)` (l. 345). Un contour effacé ne peut pas être restauré par Ctrl+Z.

---

## 5. Sauvegarde — 8.5/10

**PASS.** `handleContinue` (extraction/page.tsx l. 461-474) envoie `building_outline` dans le PATCH draft uniquement si `isPlanDirty`. Le payload inclut les rooms ET l'outline atomiquement — cohérent.

**P2 — sauvegarde liée à "Continuer" uniquement :** aucune auto-save du contour (contrairement aux pièces qui persistent en temps réel ?). Si l'utilisateur ferme l'onglet sans cliquer "Continuer" après un resize du contour, les modifications sont perdues. À confirmer selon comportement de `isPlanDirty`.

---

## 6. Cohérence design — 9/10

**PASS.** Couleur sage #7D9B76 strictement conforme à la palette Versimo (CLAUDE.md). Les handles circulaires (14px visuels, 44px hit) reprennent le même pattern que les handles de resize des pièces. Le badge "Hors contour" rouge #DC3C3C est cohérent avec les autres alertes de l'éditeur.

**P2 :** La légende (zone ~l. 900) ne mentionne pas le contour sage — un utilisateur qui lit la légende avant d'interagir ne sait pas ce que représente le cadre pointillé vert.

---

## Récapitulatif priorités

| Priorité | Problème | Correction |
|---|---|---|
| P1 | Badge "Hors contour" illisible (8px) sur petites pièces | `text-[10px]` + tooltip explicatif |
| P2 | Undo ne restaure pas outline=null | Retirer la condition `if (prev.outline)` → appeler `onBuildingOutlineChange(null)` |
| P2 | Aide collapsible ne mentionne pas l'interactivité du contour | Ajouter "Le contour sage est aussi redimensionnable" |
| P2 | Légende ne documente pas le contour | Ajouter entrée sage/pointillé dans la légende |
| P2 | Pas de feedback dimensions pendant resize handles | Afficher w×h en pourcentage ou m² pendant le drag |
