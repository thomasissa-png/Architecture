# Audit QA Prompts v34 -- Versimo

**Date** : 2026-04-01
**Auditeur** : @qa
**Scope** : Verification que les prompts v34 sont correctement appliques dans TOUS les scenarios de generation.

---

## A. Mode Standard (utilisateur non connecte, /api/generate direct)

### A.1 Generation interieure standard (12 styles) -- surfacePrompt + furniturePrompt correctement separes

**Fichier** : `/home/user/Architecture/app/api/generate/route.ts`

- Le client envoie `surfacePrompt` et `furniturePrompt` dans le body (ligne 949 : validation `!image || !surfacePrompt || !furniturePrompt`).
- `buildSurfacesResponsesPrompt(surfacePrompt, roomTypeId)` est appele pour la passe 1 (lignes 439-440).
- `buildFurnitureResponsesPrompt(furniturePrompt, roomTypeId)` est appele pour la passe 2 (lignes 441-442).
- La passe 1 n'injecte que `surfacePrompt`, la passe 2 que `furniturePrompt`. Aucun melange.
- Les 12 builders dedies (kitchen, bathroom, WC, bedroom, laundry, cellar, entryway, dining_room) + le fallback generique (living_room, office, null) respectent tous la separation.

**Verdict : PASS**

### A.2 Generation exterieure standard

- La condition `outdoor?.isOutdoor` (ligne 432-436) selectionne `buildOutdoorSurfacesResponsesPrompt` (passe 1) et `buildOutdoorFurnitureResponsesPrompt` (passe 2).
- Les builders outdoor sont correctement distincts des indoor.
- Les overrides de sous-types (terrasse, balcon, patio, jardin, rooftop) sont injectes via le parametre `subtypeOverride`.

**Verdict : PASS**

### A.3 Generation custom (prompt libre)

- Le pre-processing se fait cote CLIENT : `page.tsx` appelle `/api/preprocess-prompt` (ligne 413) qui utilise `preprocessCustomPrompt()` de `lib/custom-prompt.ts`.
- GPT-4.1-mini traduit FR->EN, split en surfacePrompt/furniturePrompt, enrichit avec dimensions/materiaux, filtre les elements incompatibles (rideaux, mural, structural).
- Le serveur (`route.ts`) recoit les prompts deja pre-traites. Il ne fait PAS de pre-processing supplementaire pour le mode standard.
- `preprocessCustomPrompt` n'est PAS importe dans `route.ts` (confirme par Grep). Il est appele uniquement via l'endpoint `/api/preprocess-prompt`.

**Verdict : PASS**

---

## B. Mode Pro (utilisateur connecte, batch via MerchantMode)

### B.1 Les styles sont resolus via `lib/style-resolver.ts`

**Fichier** : `/home/user/Architecture/lib/style-resolver.ts`

- `getStyleById(styleId, isOutdoor)` retourne `{ id, surfacePrompt, furniturePrompt }`.
- Pour les styles indoor, il utilise `INDOOR_STYLES` (record local).
- Pour les outdoor, il importe `OUTDOOR_STYLES` depuis `lib/outdoor-styles.ts`.
- `generation-pipeline.ts` ne contient AUCUNE definition de style (confirme par Grep : zero match sur "scandinavian/contemporary/industrial/japandi").

**Verdict : PASS**

### B.2 Coherence style-resolver.ts vs StylePicker.tsx

- Les 12 styles indoor dans `style-resolver.ts` (lignes 23-107) et `StylePicker.tsx` (lignes 15-148) ont ete compares manuellement.
- Tous les surfacePrompts et furniturePrompts sont **strictement identiques** pour les 12 styles (scandinavian, contemporary, industrial, japandi, art-deco, mid-century, bohemian, mediterranean, cosy, wabi-sabi, maximalist, haussmannian).

**Verdict : PASS**

### B.3 Coherence builders generation-pipeline.ts vs route.ts

- Les constantes partagees sont identiques dans les deux fichiers :
  - `DSLR_LINE` : identique
  - `CEILING_PRESERVATION` : identique
  - `LIGHT_PRESERVATION` : identique
  - `WALL_PRESERVATION` : identique
  - `CAMERA_PRESERVATION` : identique
  - `EQUIPMENT_PRESERVATION` : identique
  - `CONTACT_SHADOWS` : identique
  - `DEPTH_DISTRIBUTION` : identique
- Les fonctions `buildSurfacesResponsesPrompt`, `buildFurnitureResponsesPrompt`, `buildOutdoorSurfacesResponsesPrompt`, `buildOutdoorFurnitureResponsesPrompt` sont identiques dans les deux fichiers.
- La fonction `tryOpenAIResponses` est identique.

**Verdict : PASS**

---

## C. Iterations (re-passe 2 sur image existante)

**Fichier** : `/home/user/Architecture/lib/iteration-prompt.ts`

### C.1 Les 4 builders

- `buildIterationFurnitureResponsesPrompt` (indoor restyle) : present, lignes 13-53.
- `buildIterationOutdoorFurnitureResponsesPrompt` (outdoor restyle) : present, lignes 62-91.
- `buildAdjustResponsesPrompt` (indoor adjust) : present, lignes 95-119.
- `buildAdjustOutdoorResponsesPrompt` (outdoor adjust) : present, lignes 122-137.

**Verdict : PASS**

### C.2 CAMERA_PRESERVATION en position 1 dans les 4 builders

- `buildIterationFurnitureResponsesPrompt` (ligne 26) : "Preserve the exact same camera angle, lens distortion, vanishing points, field of view, and image orientation." -- **POSITION 1**
- `buildIterationOutdoorFurnitureResponsesPrompt` (ligne 74) : "Preserve the exact same camera angle..." -- **POSITION 1**
- `buildAdjustResponsesPrompt` (ligne 101) : "Preserve the exact same camera angle..." -- **POSITION 1**
- `buildAdjustOutdoorResponsesPrompt` (ligne 127) : "Preserve the exact same camera angle..." -- **POSITION 1**

**Note** : les builders d'iteration utilisent une formulation inline ("Preserve the exact same camera angle, lens distortion, vanishing points, field of view, and image orientation.") au lieu de la constante `CAMERA_PRESERVATION` ("Same camera angle, lens distortion, vanishing points, field of view, orientation."). La formulation est legerement plus longue mais semantiquement equivalente. Ce n'est PAS un bug -- les builders d'iteration sont declares comme "SEPARATE from the standard builders" (commentaire de tete). Neanmoins, une future normalisation serait souhaitable.

**Verdict : PASS**

### C.3 "No curtains" n'apparait nulle part

- Grep "No curtains" dans `iteration-prompt.ts` : **ZERO resultats**
- Grep "No curtains" dans `route.ts` : **ZERO resultats**
- Grep "No curtains" dans `generation-pipeline.ts` : **ZERO resultats**
- Grep "curtains" dans `style-resolver.ts` : **ZERO resultats**
- Grep "curtains" dans `StylePicker.tsx` : **ZERO resultats**

Le mot "curtains" n'apparait que dans le `roomNegativeOverride` de la cave (`room-types.ts` ligne 153), ce qui est correct (negative prompt, pas une instruction de generation).

**Verdict : PASS**

---

## D. Types de pieces (room types)

**Fichier** : `/home/user/Architecture/lib/room-types.ts`

### D.1 `applyRoomTypeOverrides()` MERGE le roomFurnitureOverride avec le style

Code (lignes 214-216) :
```typescript
effectiveFurniturePrompt: rt.roomFurnitureOverride
  ? `${rt.roomFurnitureOverride} Use the following style for materials, textures, colors, and design references: ${furniturePrompt}`
  : furniturePrompt,
```

C'est bien un **MERGE** : le room type fournit la liste de meubles fonctionnels, le style fournit materiaux/textures/couleurs en complement.

**Verdict : PASS**

### D.2 Le commentaire dit "MERGES"

**PROBLEME DETECTE** : contradiction dans les commentaires.
- Ligne 6 : "roomFurnitureOverride: **MERGES** with the style's furniturePrompt"
- Ligne 9 : "Decision: roomFurnitureOverride **replaces** (not concatenates)"
- Ligne 212 : "**MERGE** room type furniture with style furniture"

Le code fait un MERGE (les deux sont concatenes avec une phrase de liaison). Le commentaire de decision (ligne 9) est **obsolete** -- il date d'une version anterieure ou le comportement etait un remplacement pur.

**Verdict : FAIL**
- **Fichier** : `/home/user/Architecture/lib/room-types.ts`
- **Ligne** : 9
- **Probleme** : Commentaire "replaces (not concatenates)" contredit le comportement reel (MERGE) et les commentaires lignes 6 et 212.
- **Severite** : MOYENNE (pas d'impact fonctionnel, mais un futur developpeur pourrait mal comprendre le comportement)
- **Action** : Mettre a jour le commentaire ligne 9 pour refleter le comportement actuel de MERGE. Signaler a @fullstack.

---

## E. Sous-types exterieurs (outdoor subtypes)

**Fichier** : `/home/user/Architecture/lib/outdoor-subtypes.ts`

- `applyOutdoorSubtypeOverrides()` (lignes 90-118) concatene correctement les overrides de sous-type aux prompts de style.
- Les 5 sous-types (terrasse, balcon, patio, jardin, rooftop) ont des overrides coherents.
- La concatenation est additive (point + espace), contrairement aux room types qui font un merge.

**Verdict : PASS**

---

## F. Coherence inter-fichiers

### F.1 PROMPT_VERSION = "v34"

- `route.ts` ligne 42 : `export const PROMPT_VERSION = "v34";` -- PASS
- `generation-pipeline.ts` ligne 29 : `export const PROMPT_VERSION = "v34";` -- PASS

**Verdict : PASS**

### F.2 IMAGE_MODEL = "gpt-image-1.5" hardcode

- `route.ts` ligne 47 : `const IMAGE_MODEL = "gpt-image-1.5";` -- PASS
- `generation-pipeline.ts` ligne 34 : `const IMAGE_MODEL = "gpt-image-1.5";` -- PASS
- Aucune reference a `process.env` pour le modele (commentaire : "No fallback, no env var override.").

**Verdict : PASS**

### F.3 Aucune reference a Flux/Replicate/SDXL dans le code executable

- Grep dans `route.ts` :
  - Ligne 38 : dans un commentaire d'historique ("v30 ... bedroom Flux") -- OK
  - Ligne 586 : dans un commentaire ("GPT-4.1 only, no Flux fallback") -- OK
  - Aucune reference dans le code executable.
- Grep dans `generation-pipeline.ts` :
  - Ligne 25 : commentaire d'historique -- OK
  - Ligne 569 : commentaire -- OK
  - Aucune reference dans le code executable.

**Verdict : PASS**

### F.4 Constantes partagees identiques

Les constantes `CAMERA_PRESERVATION`, `DSLR_LINE`, `CEILING_PRESERVATION`, `LIGHT_PRESERVATION`, `WALL_PRESERVATION`, `EQUIPMENT_PRESERVATION`, `CONTACT_SHADOWS`, `DEPTH_DISTRIBUTION` sont strictement identiques entre `route.ts` et `generation-pipeline.ts`.

**Verdict : PASS**

---

## G. Verifications "warm white" et "No curtains"

### G.1 "warm white" dans style-resolver.ts

Grep : 1 resultat, ligne 28 -- dans le **furniturePrompt** du Scandinave : "...floor lamp with angled cone shade in **warm white** (AJ-style)..."

Ceci est la couleur de l'abat-jour de la lampe, pas une directive de surface. C'est correct.

Aucune occurrence de "warm white" dans les surfacePrompts.

**Verdict : PASS**

### G.2 "warm tint" dans style-resolver.ts et StylePicker.tsx

- Grep "warm tint" dans `style-resolver.ts` : **ZERO resultats**
- Grep "warm tint" dans `StylePicker.tsx` : **ZERO resultats**

**Verdict : PASS**

### G.3 "No curtains" dans iteration-prompt.ts

Grep : **ZERO resultats**

**Verdict : PASS**

### G.4 "No curtains" dans route.ts et generation-pipeline.ts

- Grep dans `route.ts` : **ZERO resultats**
- Grep dans `generation-pipeline.ts` : **ZERO resultats**

**Verdict : PASS**

---

## H. Scene custom

### H.1 Le pre-processing GPT-4.1-mini est-il appele pour les prompts custom ?

Oui. Le flux est :
1. `page.tsx` (client) detecte `selectedStyles.includes("custom")` (ligne 411)
2. Appel `fetch("/api/preprocess-prompt", ...)` avec le prompt brut (ligne 413)
3. `/api/preprocess-prompt/route.ts` appelle `preprocessCustomPrompt()` de `lib/custom-prompt.ts`
4. GPT-4.1-mini traduit, split, enrichit, filtre
5. Le client recoit `{ surfacePrompt, furniturePrompt, warnings }` et les envoie au serveur

**Verdict : PASS**

### H.2 Le meme surfacePrompt et furniturePrompt sont-ils envoyes pour les 2 passes en mode custom ?

Oui. Le client envoie les deux prompts dans le body de `/api/generate`. Le serveur les utilise comme pour n'importe quel style :
- Passe 1 : `buildSurfacesResponsesPrompt(trimmedSurface, roomTypeId)` -- le surfacePrompt custom enrichi
- Passe 2 : `buildFurnitureResponsesPrompt(trimmedFurniture, roomTypeId)` -- le furniturePrompt custom enrichi

Les deux prompts sont separes et injectes chacun dans la passe correspondante.

**Verdict : PASS**

---

## Synthese

| Scenario | Sous-point | Verdict |
|---|---|---|
| A.1 | Generation interieure standard | PASS |
| A.2 | Generation exterieure standard | PASS |
| A.3 | Generation custom | PASS |
| B.1 | Styles resolus via style-resolver.ts | PASS |
| B.2 | Coherence style-resolver.ts vs StylePicker.tsx | PASS |
| B.3 | Coherence builders generation-pipeline.ts vs route.ts | PASS |
| C.1 | 4 builders d'iteration presents | PASS |
| C.2 | CAMERA_PRESERVATION en position 1 | PASS |
| C.3 | "No curtains" absent | PASS |
| D.1 | applyRoomTypeOverrides fait un MERGE | PASS |
| D.2 | Commentaire dit "MERGES" | **FAIL** -- commentaire ligne 9 contradictoire |
| E | Outdoor subtypes overrides | PASS |
| F.1 | PROMPT_VERSION = "v34" | PASS |
| F.2 | IMAGE_MODEL hardcode | PASS |
| F.3 | Zero Flux/Replicate/SDXL en code executable | PASS |
| F.4 | Constantes partagees identiques | PASS |
| G.1 | "warm white" uniquement dans furniturePrompts | PASS |
| G.2 | "warm tint" absent des stylePrompts | PASS |
| G.3 | "No curtains" absent de iteration-prompt.ts | PASS |
| G.4 | "No curtains" absent de route.ts et generation-pipeline.ts | PASS |
| H.1 | Pre-processing custom appele | PASS |
| H.2 | surfacePrompt et furniturePrompt separes en mode custom | PASS |

**Score global : 21/22 PASS (1 FAIL de severite MOYENNE)**

---

## Anomalie detectee

### D.2 -- Commentaire obsolete dans room-types.ts

- **Fichier** : `lib/room-types.ts`, ligne 9
- **Texte actuel** : "Decision: roomFurnitureOverride replaces (not concatenates) because bedroom furniture has nothing in common with living room furniture."
- **Comportement reel** : le code fait un MERGE (room type en premier, style en second via phrase de liaison)
- **Severite** : MOYENNE -- pas d'impact fonctionnel, risque de confusion pour un futur developpeur
- **Action recommandee** : remplacer ligne 9 par "Decision: roomFurnitureOverride MERGES with the style -- room type provides the functional furniture list, style provides materials/textures/colors."

---

**Handoff -> @fullstack**
- Fichiers audites : `app/api/generate/route.ts`, `lib/generation-pipeline.ts`, `lib/iteration-prompt.ts`, `lib/room-types.ts`, `lib/outdoor-subtypes.ts`, `lib/style-resolver.ts`, `lib/custom-prompt.ts`, `components/StylePicker.tsx`
- Anomalie a corriger : commentaire obsolete dans `lib/room-types.ts` ligne 9 (MERGE vs REPLACE)
- Aucun bug fonctionnel detecte. Les prompts v34 sont correctement appliques dans tous les scenarios audites.
