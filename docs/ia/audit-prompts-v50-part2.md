# Audit Prompts v50 — Partie 2 : iteration-prompt.ts, custom-prompt.ts, StylePicker.tsx

Date : 2026-04-05 | Agent : @ia | Fichiers : 3

## Scores par section

| Section | Poids | Note | Commentaire |
|---|---|---|---|
| 1. Iterations (4 builders) | x2 | 7.5/10 | Bonnes protections de base, mais manques vs pipeline principal |
| 2. Custom prompts (GPT-4.1-mini) | x2 | 8/10 | System prompt solide, split correct, filtrage adequate |
| 3. StylePrompts (12 styles) | x2 | 9/10 | Excellente differenciation, hero pieces, dimensions, zero curtains/light |
| 4. Coherence pipeline principal | x2 | 7/10 | Ecarts significatifs entre iteration et pipeline principal |

**Note globale : 7.9/10** (ponderee)

---

## Problemes identifies

### P0 — CRITIQUE

**P0-1 : Pas de comptage anti-fenetre dans iteration-prompt.ts**
- Le pipeline principal (generation-pipeline.ts) utilise PASS1_PREAMBLE avec "Preserve [...] all windows and doors (same count, same positions)" + formulation positive "Walls without windows must remain solid" (Sprint 23, #165).
- iteration-prompt.ts dit seulement "same windows and doors" (ligne 25) — pas de comptage explicite, pas de formulation positive anti-hallucination.
- buildAdjustResponsesPrompt mentionne "Keep walls, floor, ceiling, windows, and doors as they are" (ligne 89) — encore moins precis.
- **Impact** : les iterations sont le vecteur principal d'hallucination de fenetres car le modele regenere plus agressivement.

**P0-2 : Pas de CAMERA_PRESERVATION complete dans les iterations**
- Le pipeline principal a une constante dediee CAMERA_PRESERVATION (174 lignes) avec "same height, same tilt angle, same horizontal rotation" + "frame edges must match" + "walls cut off at edge must be cut off at same position".
- iteration-prompt.ts se contente de "Same camera angle" (4 mots) dans les 4 builders.
- **Impact** : les iterations ont un risque de changement d'angle non detecte, surtout en mode restyle.

### P1 — HAUTE

**P1-1 : Pas de directive anti-stretch/room-dimensions dans le builder outdoor iteration**
- buildIterationOutdoorFurnitureResponsesPrompt a "Space dimensions are FIXED" mais manque "distance between walls and fences must be IDENTICAL to the input" present dans le pipeline outdoor principal.

**P1-2 : Le custom-prompt.ts autorise curtains/drapes conditionnellement**
- Ligne 63 : "ALLOW with note: curtains/drapes -> only if the user explicitly mentions windows or curtains"
- CLAUDE.md dit clairement "NE JAMAIS mentionner curtains/drapes/windows dans les stylePrompts — risque d'hallucination."
- Meme si c'est une demande utilisateur explicite, le risque d'hallucination de fenetre reste. Le filtre devrait BLOQUER + avertir, pas AUTORISER.

**P1-3 : Pas de directive "No curtains, no drapes" dans les iterations**
- Le pipeline principal (PASS2_PREAMBLE, ligne 181) inclut "No curtains, no drapes" explicitement.
- Aucun des 4 builders d'iteration ne contient cette directive.

**P1-4 : preprocessIterationComment filtre les rideaux (ligne 225) mais ne les bloque pas formellement**
- La ligne dit "risk of window hallucination, always filter these out" — correct dans l'intent.
- Mais le GPT-4.1-mini pourrait les laisser passer car c'est une instruction system, pas un hard-block code.

### P2 — MOYENNE

**P2-1 : Pas de directive anti-warm-shift dans iterations**
- Le pipeline principal a "Do not add any warm tint or yellow cast" (Sprint 22 fix).
- Absente des 4 builders d'iteration.

**P2-2 : Le custom-prompt.ts n'a pas de directive anti-grain**
- CLAUDE.md interdit le grain ISO/vignetting. Le system prompt de custom-prompt ne mentionne pas cette interdiction.
- Si l'utilisateur demande "style photo argentique avec grain", le preprocessor l'enrichira au lieu de le filtrer.

**P2-3 : buildAdjustOutdoorResponsesPrompt n'a pas de comptage equipements**
- Pas de preservation explicite des equipements (barbecue, luminaires exterieurs, etc.).

---

## Points positifs

1. **StylePicker.tsx** : zero mention de curtains/drapes/windows dans les 12 styles — propre.
2. **StylePicker.tsx** : zero directive de lumiere dans les styles — conforme a la regle.
3. **StylePicker.tsx** : dimensions explicites partout (230cm, 200x300cm, 120cm) — excellent.
4. **StylePicker.tsx** : "choose one" avec 3 variantes par element — differenciation remarquable entre generations.
5. **StylePicker.tsx** : placement spatial (FOREGROUND/LATERAL/BACKGROUND) coherent avec pipeline.
6. **custom-prompt.ts** : split surface/furniture bien structure avec exemples concrets.
7. **custom-prompt.ts** : comptage equipements et preservation geometrie dans le system prompt.
8. **iteration-prompt.ts** : comptage radiateurs present dans les 2 builders indoor (lignes 45, 96).
9. **iteration-prompt.ts** : inventaire mental ("note every visible object") dans les 4 builders.
10. **iteration-prompt.ts** : isExclusive + allowWallMounted — gestion fine de l'intent utilisateur.

---

## Recommandations (par priorite)

1. **P0-1** : Ajouter comptage fenetre explicite + formulation positive dans les 4 builders indoor d'iteration
2. **P0-2** : Remplacer "Same camera angle" par la directive complete CAMERA_PRESERVATION dans les 4 builders
3. **P1-2** : Changer curtains/drapes de ALLOW a BLOCK dans custom-prompt.ts
4. **P1-3** : Ajouter "No curtains, no drapes" dans les 4 builders d'iteration
5. **P2-1** : Ajouter anti-warm-shift dans les builders indoor d'iteration

---

**Handoff -> @fullstack**
- Fichiers a modifier : `lib/iteration-prompt.ts` (4 builders), `lib/custom-prompt.ts` (system prompt)
- StylePicker.tsx : RAS, qualite excellente
- Priorite : P0-1 et P0-2 avant prochaine mise en production
