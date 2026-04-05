# Refonte prompts passe 1 — v53

**Date** : 2026-04-05 | **Auteur** : @orchestrator (après audit Yann+Lucas)

## Diagnostic

**Prompt actuel v52** : ~663 mots par builder passe 1.
**Sweet spot gpt-image-1.5** : ~150-200 mots. Au-delà, le modèle ignore les instructions tardives.

### Problèmes identifiés

| Problème | Cause dans le prompt | Position dans le prompt |
|---|---|---|
| Poteaux amincis | COLUMN_PRESERVATION à ~250 mots | Trop tard, ignoré |
| Plafond réinventé | CEILING_PRESERVATION à ~200 mots | Trop tard, trop abstrait ("preserve geometry") |
| Fenêtre hallucinée | ANTI_FENETRE à ~70 mots | Position OK mais trop long (88 mots) |
| Baignoire hallucinée | "Room stays empty" à ~600 mots | Trop tard, ignoré |
| Moulures ajoutées | surfacePrompt Art Deco prescrit "cornice trim" | surfacePrompt fautif |
| Fusion partielle | Pas un problème de prompt | Bug modèle/tiling |

### Duplications

| Directive | Apparaît dans |
|---|---|
| "Room dimensions FIXED" | PASS1_PREAMBLE + CAMERA_PRESERVATION (2×) |
| "Same camera angle" | PASS1_PREAMBLE + CAMERA_PRESERVATION (2×) |
| "Same windows/doors count" | PASS1_PREAMBLE + ANTI_FENETRE (2×) |
| "No new architectural elements" | ANTI_INVENTION + ANTI_FENETRE (overlap) |

## Principes de la refonte

1. **150 mots max** par builder (actuellement 663)
2. **Structure FIRST** : préservation structurelle en premiers tokens
3. **Action SECOND** : ce qu'on change (surfaces)
4. **Interdit LAST** : ce qu'on ne touche pas
5. **POSITIF** : "keep X" au lieu de "do not remove X"
6. **CONCRET** : "same column width" au lieu de "preserve geometry"
7. **ZÉRO duplication** : chaque instruction une seule fois

## Nouveaux prompts proposés

### PASS1_PREAMBLE_V53 (~80 mots, remplace PASS1_PREAMBLE + CAMERA + ANTI_FENETRE + ANTI_INVENTION)

```
Edit this photo. This is a RENOVATION — keep the building's structure exactly as shown.

STRUCTURE LOCK: every column, beam, slab edge, and ceiling shape keeps its exact width, depth, and position. Same number of windows and doors at the same positions — solid walls stay solid. Same camera angle, same framing, same room dimensions.

CHANGE ONLY: wall color, floor material, ceiling finish, and one ceiling light fixture. Apply finishes OVER existing textures, not replacing the 3D shape underneath.
```

### PRESERVATION_V53 (~50 mots, remplace CEILING + COLUMN + WALL + LIGHT)

```
Ceiling: keep every bump, step, soffit, vault, and beam visible — paint over their surface, keep their shape. Columns and posts: keep full width (typically 25-40cm for concrete). Slab edges: keep full thickness (typically 20-25cm). Light direction and shadows unchanged. No warm color shift.
```

### CLEANUP_V53 (~35 mots, remplace CONSTRUCTION_CLEANUP)

```
Remove loose construction items: cables, junction boxes, exposed pipes, outlets. Keep all fixed equipment in place: radiators, heaters, vents, panels — same count, same positions. Room stays COMPLETELY EMPTY — no furniture, no fixtures, no bathroom elements.
```

### DSLR_V53 (~15 mots, inchangé mais condensé)

```
DSLR wide-angle, sharp focus, deep DOF. Same focal length as input. No text.
```

### Total : ~180 mots (vs 663 actuellement = -73%)

## Builder générique v53 (exemple complet)

```
[PASS1_PREAMBLE_V53]
[inventoryLine if available]
[PRESERVATION_V53]
[CLEANUP_V53]
Surface style: [surfacePrompt].
[DSLR_V53]
```

**~180 mots + surfacePrompt (~40 mots) = ~220 mots total** vs ~663 actuellement.

## Corrections surfacePrompts

### Art Deco — retirer les moulures
Le surfacePrompt Art Deco prescrit "cornice trim" → le modèle ajoute des moulures qui modifient la structure visuelle des murs. Fix : retirer "cornice trim" du surfacePrompt Art Deco.

### Japandi bathroom — "round washi paper pendant" est le seul luminaire
Pas de spots encastrés prescrits. Si le modèle en ajoute, c'est une hallucination. Fix : ajouter "ONE ceiling light only — the pendant described above, no recessed spots" dans le builder bathroom.

## Implémentation

Fichier : `lib/generation-pipeline.ts`

1. Remplacer les 10 constantes par 4 nouvelles (PASS1_PREAMBLE_V53, PRESERVATION_V53, CLEANUP_V53, DSLR_V53)
2. Mettre à jour les 8 builders passe 1 pour utiliser les nouvelles constantes
3. Retirer "cornice trim" du surfacePrompt Art Deco dans `components/StylePicker.tsx`
4. Incrémenter PROMPT_VERSION à v53
5. NE PAS toucher aux builders passe 2 ni aux itérations (ils utilisent PASS2_PREAMBLE qui est différent)
