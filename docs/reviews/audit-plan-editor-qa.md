# Audit QA — PlanEditor.tsx

**Date** : 2026-04-11 | **Fichier** : `components/marchand/PlanEditor.tsx` (1487 lignes)

## Note : 7.5 / 10

Code globalement solide (clamp, snap, undo, ARIA, touch targets 44px). Mais 6 bugs reels et 3 faiblesses significatives.

## Bugs identifies

| # | Severite | Point d'audit | Bug | Correction |
|---|---|---|---|---|
| B1 | HAUTE | Calibration dist=0 | `distancePx` retourne 0 si les 2 clics sont au meme pixel. `distPx / distMetres` = 0, scaleFactor devient 0, `computeSurface` divise par 0 = Infinity m². | Ajouter `if (distPx < 1) return;` dans `confirmCalibration` avant le calcul. |
| B2 | HAUTE | Undo apres fusion | `pushUndo` capture `rooms` via closure. Quand `mergeSelectedRooms` appelle `pushUndo()` puis `onRoomsChange(newRooms)`, le snapshot est correct. MAIS si le parent re-rend entre `pushUndo` et `onRoomsChange`, le `rooms` dans le closure stale. Undo fonctionne mais le snapshot peut contenir un etat intermediaire. | Passer `rooms` en argument a `pushUndo` au lieu de capturer via closure. |
| B3 | MOYENNE | Noms vides | L'input de rename accepte une string vide. `commitRoomName` ne valide rien. Le label affiche "Sans nom" (L1161) mais la piece a `name: ""` en memoire, ce qui peut casser les exports/PDF en aval. | Ajouter dans `commitRoomName` : si `room.name.trim() === ""`, restaurer l'ancien nom ou forcer "Sans nom". |
| B4 | MOYENNE | Concurrence drag+resize | `dragState` est un seul objet. Impossible d'avoir drag+resize simultane. OK. MAIS : un `onTouchStart` sur un handle (resize) declenche aussi le `onTouchStart` du parent div (move) via bubbling. Le `e.stopPropagation()` dans `handlePointerDown` empeche la propagation, MAIS le parent div a `onTouchStart` qui est le meme handler. Si la propagation rate (React synthetic vs native) : 2 `setDragState` concurrents, le dernier gagne. | Ajouter un guard : `if (dragState) return;` en tete de `handlePointerDown`. |
| B5 | MOYENNE | Performance 15+ pieces | `handlePointerMove` appelle `onRoomsChange(rooms.map(...))` a chaque pixel de mouvement. Si le parent fait un setState, tous les room overlays re-rendent. Pas de `React.memo` sur les room divs. Avec 15 pieces, ~15 divs re-rendent a 60fps = potentiel jank sur mobile. | Extraire chaque room overlay dans un `React.memo` composant avec `roomId` stable. Ou utiliser `useRef` pour les positions pendant le drag et flush au `pointerUp`. |
| B6 | BASSE | Long-press timer leak | `longPressTimerRef` est clear au `touchEnd` et `touchMove`, mais PAS au unmount du composant. Si le composant unmount pendant un long-press en cours, le `setTimeout` fire apres le unmount et appelle `setEditingNameId` sur un composant demonte. | Ajouter un `useEffect` cleanup : `return () => { if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current); }`. |

## Points valides (pas de bug)

| Point d'audit | Verdict |
|---|---|
| Drag hors limites | OK — `clamp(rawX, 0, maxW - origWidth)` empeche toute sortie. |
| Resize negatif | OK — `clamp(..., MIN_ROOM_SIZE, ...)` avec `MIN_ROOM_SIZE=40`. |
| Event listeners unmount | OK — le `useEffect` pour drag listeners a un cleanup return. `resize` listener aussi. `keydown` aussi. |
| Etat initial 0 pieces | OK — `visibleRooms.map()` sur array vide = rien rendu. Pas de crash. |
| Touch events | OK (sauf B6) — `touchMove` cancel le long-press, `touchEnd` cleanup. |

## Signalements a @fullstack

- **B1** : P0 — crash silencieux calibration, Thomas verra "Infinity m²" sur toutes les pieces.
- **B5** : P1 — si Thomas a 10+ pieces (T4/T5 typique), le drag peut laguer sur iPhone 14.
- **B6** : P2 — memory leak mineur, symptome = warning React en console.
