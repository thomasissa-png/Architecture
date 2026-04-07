# v55 — Fixes prompts post-audit v54 NO-GO (session 35)

**Date :** 2026-04-07
**Source :** audits Yann Duval 7.35/10 + Lucas Moreau 7.10/10 (NO-GO)
**Cible fondateur :** 9.5/10
**PROMPT_VERSION :** v54 → v55

## Synthèse

4 fixes P0 appliqués chirurgicalement, sans refactor. Tous les fixes sont **additifs ou substitutifs** — aucun changement d'architecture. Le pipeline 2 passes reste intact. Sync StylePicker.tsx + style-resolver.ts garantie (les 12 styles indoor sont en ligne sur les 2 fichiers).

## Fichiers modifiés

| Fichier | Type de modif | Lignes touchées |
|---|---|---|
| `lib/generation-pipeline.ts` | P0-A pipeline override + P0-C ARCHITECTURAL_HONESTY clause + bump v55 | ~30 |
| `components/StylePicker.tsx` | P0-B vault beams sur 12 styles + P0-D Contemporary color shift | 12 lignes |
| `lib/style-resolver.ts` | P0-B vault beams sur 12 styles + P0-D Contemporary color shift (sync StylePicker) | 12 lignes |
| `lib/custom-prompt.ts` | P0-B propagation cohérence dans le system prompt GPT-4.1-mini (3 occurrences : règle + 2 exemples) | 3 lignes |

## FIX P0-A — Bug propagation room_type Pipeline B

### Cause racine identifiée

`lib/generation-pipeline.ts` ligne ~880 : la logique `hasDedicatedBuilder` ne couvrait que les 8 room types avec builder dédié (kitchen, bathroom, wc, bedroom_*, entryway, laundry, cellar). Pour `dining_room` et `office`, qui ont aussi un `roomFurnitureOverride` non vide mais PAS de builder dédié, le code tombait dans la branche `else` et utilisait `effectiveFurniturePrompt` venant de `applyRoomTypeOverrides`. Cette fonction CONCATÈNE :

```
"Dining room furniture: rectangular dining table 180cm + 6 chairs ... Use the following style for materials...: An architect's living room balancing warmth and rigor. FOREGROUND: curved four-seat sofa..."
```

Le modèle gpt-image-1.5 voyait DEUX descriptions de mobilier contradictoires (salle à manger + salon) et tranchait pour la plus longue (le variant living-room). Résultat : Pipeline B livrait un salon avec coin repas relégué au tiers arrière au lieu d'une vraie salle à manger.

### Diff

**Avant** (`lib/generation-pipeline.ts` ligne 879+) :
```ts
const ROOMS_WITH_DEDICATED_BUILDERS = ["kitchen", "bathroom", "wc", "bedroom_adults", "bedroom_children", "entryway", "laundry", "cellar"];
const hasDedicatedBuilder = roomType && ROOMS_WITH_DEDICATED_BUILDERS.includes(roomType);
const { effectiveSurfacePrompt, effectiveFurniturePrompt } =
  applyRoomTypeOverrides(surfacePrompt.trim(), furniturePrompt.trim(), roomType ?? null);
trimmedSurface = hasDedicatedBuilder ? surfacePrompt.trim() : effectiveSurfacePrompt;

if (hasDedicatedBuilder && roomType) {
  const rt = ROOM_TYPES[roomType];
  trimmedFurniture = rt?.roomFurnitureOverride
    ? `${rt.roomFurnitureOverride} ${getStyleMaterialHint(styleId)}`
    : furniturePrompt.trim();
} else {
  trimmedFurniture = effectiveFurniturePrompt; // ← BUG : dining_room/office tombent ici
}
```

**Après** :
```ts
const ROOMS_WITH_DEDICATED_BUILDERS = ["kitchen", "bathroom", "wc", "bedroom_adults", "bedroom_children", "entryway", "laundry", "cellar"];
const hasDedicatedBuilder = roomType && ROOMS_WITH_DEDICATED_BUILDERS.includes(roomType);
const { effectiveSurfacePrompt, effectiveFurniturePrompt } =
  applyRoomTypeOverrides(surfacePrompt.trim(), furniturePrompt.trim(), roomType ?? null);
trimmedSurface = hasDedicatedBuilder ? surfacePrompt.trim() : effectiveSurfacePrompt;

// CRITICAL FIX (v55) — la règle override-replace s'applique à TOUS les room types
// avec roomFurnitureOverride non vide, pas seulement aux dedicated builders.
const rt = roomType ? ROOM_TYPES[roomType] : null;
if (rt?.roomFurnitureOverride) {
  trimmedFurniture = `${rt.roomFurnitureOverride} ${getStyleMaterialHint(styleId)}`;
} else {
  trimmedFurniture = effectiveFurniturePrompt;
}
```

### Approche choisie

**Option (a) du prompt session 35** : modifier `applyRoomTypeOverrides` au niveau pipeline pour qu'il REMPLACE le furniturePrompt par l'override room-type + style hint, au lieu de concaténer. Pourquoi cette option :
- Le pattern existait DÉJÀ pour les dedicated builders — on étend la règle existante au lieu d'en inventer une nouvelle.
- `applyRoomTypeOverrides()` lui-même est laissé inchangé (les tests `room-types.test.ts` U-RT-002 vérifient que la fonction continue de merger pour kitchen — ne pas casser).
- La règle est claire et auto-documentée : **`living_room` est le seul room type indoor avec `roomFurnitureOverride` vide → c'est le seul qui reçoit le variant style verbatim**.

### Impact attendu

- Pipeline B (Contemporary + dining_room) → table à manger 180cm + 6 chaises + sideboard, plus aucun canapé.
- Pipeline office (jamais audité auparavant mais affecté par le même bug) → bureau + chaise ergo + bibliothèque, plus aucun canapé.
- `living_room` → comportement inchangé (variant style envoyé verbatim).
- 8 dedicated builders (kitchen, bathroom, wc, bedroom_*, entryway, laundry, cellar) → comportement inchangé (logique override-replace déjà appliquée).

## FIX P0-B — Suppression "vault beams" amorçantes

### Cause racine

La formulation `white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs` était présente dans **les 12 surfacePrompts indoor**, en double sur `components/StylePicker.tsx` ET `lib/style-resolver.ts` (24 occurrences au total). Sur les 10 styles où les poutres sont implausibles dans l'input typique (Scandinavian, Contemporary, Japandi, Art Deco, Mid-Century, Bohemian, Cosy, Wabi-Sabi, Maximalist, Haussmannian), le modèle gpt-image-1.5 lisait "beams" et hallucinait des poutres / caissons / nervures même sur des plafonds plats. Confirmé sur Pipeline A (#193 → plafond plat BA13 → 9 caissons quadrillés inventés).

### Diff (10 styles standards)

**Avant** :
```
white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs
```

**Après** :
```
white ceiling finish applied strictly over the existing ceiling, matching its exact shape without adding any relief, beams, or coffers
```

### Diff (Mediterranean — formulation conditionnelle)

**Avant** :
```
white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs — if beams are visible whitewash them
```

**Après** :
```
white ceiling finish applied strictly over the existing ceiling, matching its exact shape without adding any relief, beams, or coffers. If — and only if — the input already shows visible ceiling beams, whitewash them in place without relocating them. Otherwise apply a flat whitewashed ceiling matching the existing ceiling shape.
```

### Diff (Industrial — formulation conditionnelle)

**Avant** :
```
ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs
```

**Après** :
```
If — and only if — the input shows visible structural beams, IPN, or steel girders, preserve them in their exact position with their raw industrial finish (rust patina, factory paint). Otherwise apply a flat painted ceiling matching the existing ceiling shape.
```

### Diff (Haussmannian — préserve les moulures existantes)

**Avant** :
```
white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs preserving existing crown moldings and cornices
```

**Après** :
```
white ceiling finish applied strictly over the existing ceiling, matching its exact shape without adding any relief, beams, or coffers — if existing crown moldings and cornices are visible in the input, preserve them in place
```

### Synchronisation

- `components/StylePicker.tsx` : 12 modifications (3 spéciales + 9 bulk via replace_all).
- `lib/style-resolver.ts` : 12 modifications symétriques.
- `lib/custom-prompt.ts` : 3 occurrences (1 règle + 2 exemples) propagées pour cohérence du pre-processing GPT-4.1-mini sur les prompts custom.

Vérification : `grep -c "vault beams\|structural ribs"` retourne 0 dans StylePicker.tsx et style-resolver.ts, et 1 dans custom-prompt.ts (mention intentionnelle dans une instruction négative au LLM : "do NOT mention vault beams unless...").

## FIX P0-C — ARCHITECTURAL HONESTY clause dans builder passe 1

### Cause

Les builders surfaces (passe 1) n'avaient AUCUNE directive globale anti-invention de structure. Le seul garde-fou était la clause "preserving existing ceiling geometry" — qui s'est avérée amorçante (cf P0-B). Sans clause explicite, le modèle inventait :
- des caissons au plafond (Pipeline A #195)
- un passage architectural dans un mur plein (Pipeline B #196)
- des moulures sur des murs lisses (générations historiques)

### Diff

Ajout d'une nouvelle constante en tête de la section "Shared prompt fragments" :

```ts
// v55: ARCHITECTURAL HONESTY clause (audit Yann/Lucas Pipeline A — plafond a caissons hallucines).
// Placée RIGHT après PASS1_PREAMBLE dans chaque branche pour que le modèle la lise avant tout style.
// Goal: prevent the model from inventing structural elements (beams, coffers, vaults, moldings,
// passages) when the input does not visibly show them. Formulée positivement pour éviter l'amorce.
const ARCHITECTURAL_HONESTY_V55 = "ARCHITECTURAL HONESTY: Do NOT invent structural elements that are not visibly present in the input photo. If the input ceiling is flat, keep it flat — do not add beams, coffers, vaults, or ribs. If the input has no moldings, do not add moldings. If the input has solid walls, do not open passages or doorways. Apply finishes over the EXISTING geometry only.";
```

Injectée dans **les 8 branches indoor** de `buildSurfacesResponsesPrompt` (kitchen, bathroom, wc, bedroom, laundry, cellar, entryway, fallback), positionnée juste après `PASS1_PREAMBLE_V53` et avant `inventoryLine` pour bénéficier du poids token maximal.

**NON injectée dans les builders outdoor** (`buildOutdoorSurfacesResponsesPrompt`) car (a) la clause mentionne "ceiling" qui n'a pas de sens en outdoor et (b) le test `U-GP-018` vérifie que les outdoor builders ne contiennent jamais "ceiling".

### Pourquoi pas dans les builders Flux

CLAUDE.md décision fondateur : **un seul modèle gpt-image-1.5, pas de fallback Flux**. Aucun builder Flux actif dans le code. Section P0-C du prompt session 35 mentionnait Flux pour vérification — confirmé absent.

## FIX P0-D — Color shift Contemporary

### Diff

`components/StylePicker.tsx` ligne ~34 et `lib/style-resolver.ts` ligne ~34, surfacePrompt Contemporary :

**Avant** :
```
very light neutral grey walls barely tinted from the original keeping the same overall brightness as the input photo
```

**Après** :
```
walls in light neutral grey that preserves the EXACT warm/cool temperature of the input walls — neutralize saturation only, do not shift hue
```

### Cause racine

Audit Lucas F1 Pipeline B : les murs béton brut chaud (ocre) viraient gris perle bleuté (cool shift). La formulation "barely tinted" ne s'oppose pas au shift — elle ne fait que limiter son AMPLEUR, pas sa DIRECTION. La nouvelle formulation est explicite sur la préservation de la TEMPÉRATURE (axe warm/cool) et n'autorise que la neutralisation de la SATURATION.

## Vérifications passées

| Vérification | Résultat |
|---|---|
| `grep -c "vault beams\|structural ribs" StylePicker.tsx` | `0` ✅ |
| `grep -c "vault beams\|structural ribs" style-resolver.ts` | `0` ✅ |
| `grep -c "vault beams\|structural ribs" custom-prompt.ts` | `1` (intentionnel : instruction négative au LLM) ✅ |
| `grep -c "matching its exact shape without adding any relief" StylePicker.tsx` | `11` (10 styles standards + Haussmannian + Mediterranean) ✅ |
| `grep -c "matching its exact shape without adding any relief" style-resolver.ts` | `11` ✅ |
| `grep -c "preserves the EXACT warm/cool temperature" StylePicker.tsx` | `1` ✅ |
| `grep -c "preserves the EXACT warm/cool temperature" style-resolver.ts` | `1` ✅ |
| `grep -c "ARCHITECTURAL_HONESTY_V55" generation-pipeline.ts` | `9` (1 def + 8 branches injectées) ✅ |
| `PROMPT_VERSION` | `v55` ✅ |

## Tests unitaires affectés

| Test | Statut attendu |
|---|---|
| `tests/unit/generation/room-types.test.ts` U-RT-001/002/003 | ✅ inchangé (la fonction `applyRoomTypeOverrides` n'est PAS modifiée, seule la pipeline qui l'appelle est modifiée) |
| `tests/unit/generation/pipeline.test.ts` U-GP-014 (kitchen sanitizer) | ✅ inchangé (pas de touche au sanitizer) |
| `tests/unit/generation/pipeline.test.ts` U-GP-015 (inventory injection) | ✅ inchangé |
| `tests/unit/generation/pipeline.test.ts` U-GP-016 (no TRANSFORM) | ✅ ARCHITECTURAL_HONESTY_V55 ne contient pas "TRANSFORM" |
| `tests/unit/generation/pipeline.test.ts` U-GP-016b (no curtains/drapes) | ✅ ARCHITECTURAL_HONESTY_V55 ne contient ni "curtains" ni "drapes" |
| `tests/unit/generation/pipeline.test.ts` U-GP-017 (No curtains in furniture builders) | ✅ inchangé (passe 2 non touchée) |
| `tests/unit/generation/pipeline.test.ts` U-GP-018 (no ceiling/pendant in outdoor) | ✅ ARCHITECTURAL_HONESTY_V55 NON injectée dans les builders outdoor |
| `tests/unit/generation/pipeline.test.ts` U-GP-026 (PROMPT_VERSION format) | ✅ "v55" matche `^v\d+$` et ≥ 54 |

⚠️ **Tests vitest non exécutables dans cette sandbox** (pas de `node_modules`). Le fondateur DOIT exécuter `npx vitest run` avant déploiement pour confirmer la baseline 175/179. Idem pour `npx next lint` qui n'est pas exécutable ici (préférence fondateur absolue : zéro warning lint avant commit).

## Out of scope (non touchés cette session)

- ❌ Test `input_fidelity: medium/low` → @ia en parallèle (P0 #5 hors scope @fullstack)
- ❌ Lock perspective/focale (P1 Lucas)
- ❌ MATERIAL HONESTY clause béton brut (P1 Lucas)
- ❌ Régénération clean baies vitrées (P1 Lucas)
- ❌ Tapis Mediterranean (P1 Yann)
- ❌ Pipeline architecture (intacte : 2 passes, gpt-image-1.5 unique, pas de fallback)
- ❌ Builders outdoor (intacts : surfaces et furniture)
- ❌ Builders iteration / refine (intacts)
- ❌ `applyRoomTypeOverrides()` lui-même (la fonction est intacte ; seule la pipeline l'appelant a été modifiée)

## Commits

1. `fix(prompts): v55 — 4 fixes P0 post-audit Yann+Lucas (7.22 → cible 9.5)`

## Handoff

→ **Fondateur** :
1. Pull la branche `claude/extract-project-context-vFT9J`
2. Lancer `npx next lint` localement → vérifier zéro warning
3. Lancer `npx vitest run tests/unit/generation/` → vérifier baseline 175/179
4. Déployer sur Replit
5. Régénérer 4 photos sur les MÊMES inputs que l'audit v54 :
   - `#193-input` Mediterranean bedroom_adults
   - `#192-input` Contemporary dining_room (test critique du fix P0-A)
   - `#194-input` Scandinavian living_room
   - + 1 Art Deco bedroom_adults (continuité Pipeline D, qui était déjà à 8.93/10)
6. Re-lancer audit croisé Yann + Lucas via `@orchestrator session 36`
7. Vérifier que le verdict atteint ≥ 9.5/10 sur les 4 nouvelles générations
