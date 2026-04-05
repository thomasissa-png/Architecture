# Rewrite Passe 1 — v53 (gpt-image-1.5)

**Date** : 2026-04-05
**Agent** : @ia (AI Engineer)
**Sources** : audit Yann Duval + audit Lucas Moreau (passe1-focus 2026-04-05)
**Objectif** : reduire les prompts passe 1 de ~620 mots a ~150-200 mots, reorganiser pour que gpt-image-1.5 execute chaque instruction
**Implementable par** : @fullstack dans `lib/generation-pipeline.ts` + `components/StylePicker.tsx`

---

## 1. Diagnostic quantitatif

### 1.1 Comptage de mots actuel — builder generique (living_room)

| Fragment | Mots | Position |
|---|---|---|
| PASS1_PREAMBLE | ~68 | 1 |
| inventoryLine | ~variable | 2 |
| ANTI_FENETRE | ~74 | 3 |
| CAMERA_PRESERVATION | ~64 | 4 |
| LIGHT_PRESERVATION | ~24 | 5 |
| CEILING_PRESERVATION | ~53 | 6 |
| COLUMN_PRESERVATION | ~62 | 7 |
| WALL_PRESERVATION | ~72 | 8 |
| ANTI_INVENTION | ~34 | 9 |
| surfacePrompt (ex: Scandinave ~35) | ~35 | 10 |
| Lignes specifiques builder | ~42 | 11 |
| CONSTRUCTION_CLEANUP | ~64 | 12 |
| "Keep the room completely empty" | ~12 | 13 |
| DSLR_LINE | ~19 | 14 |
| **TOTAL** | **~623** | |

**Constat** : le prompt fait 623 mots. gpt-image-1.5 perd la coherence au-dela de ~200 mots. Les instructions en position 6+ (CEILING, COLUMN, WALL, CLEANUP, EMPTY) sont systematiquement sous-executees.

### 1.2 Duplications mesurees

| Concept | Occurrence 1 | Occurrence 2 | Mots gaspilles |
|---|---|---|---|
| "room dimensions FIXED / distance between walls IDENTICAL" | PASS1_PREAMBLE | CAMERA_PRESERVATION | ~20 |
| "same camera angle" | PASS1_PREAMBLE | CAMERA_PRESERVATION | ~10 |
| "same windows and doors count + positions" | PASS1_PREAMBLE | ANTI_FENETRE | ~25 |
| "no new architectural elements / windows / doors" | ANTI_INVENTION | ANTI_FENETRE | ~15 |
| "frame edges match input" | PASS1_PREAMBLE | CAMERA_PRESERVATION | ~15 |
| **Total mots dupliques** | | | **~85** |

85 mots sur 623 sont des redondances pures — 14% du budget tokens gaspille.

### 1.3 Ordre des instructions vs poids des tokens

gpt-image-1.5, comme tous les modeles auto-regressifs avec images, donne un poids decroissant aux tokens au fur et a mesure du prompt. Les premiers ~100 mots definissent le comportement. Le reste est du "soft guidance" que le modele peut ignorer.

**Ordre actuel et ses consequences** :

| Position | Contenu | Resultat observe |
|---|---|---|
| 1-68 | PASS1_PREAMBLE (preserve room, same angle) | Execute — l'angle de vue est generalement bon |
| 69-142 | ANTI_FENETRE (count windows) | Partiellement execute — amelioration vs v51 mais pas 100% |
| 143-206 | CAMERA (deja dit dans PREAMBLE) | Redondant |
| 207-230 | LIGHT (preserve direction) | Execute — la lumiere est generalement ok |
| 231-283 | CEILING (preserve shape) | MAL execute — plafond reinvente |
| 284-345 | COLUMN (preserve width) | MAL execute — poteaux amincis |
| 346-417 | WALL (preserve angles) | Partiellement execute |
| 418-451 | ANTI_INVENTION | Partiellement execute — moulures ajoutees |
| 452-486 | surfacePrompt | Execute — c'est le style |
| 487-528 | Lignes specifiques | Partiellement execute |
| 529-592 | CLEANUP + EMPTY | MAL execute — baignoire hallucinee, chantier non nettoye |
| 593-623 | DSLR | Execute — le rendu photo est correct |

**Verdict** : les instructions CRITIQUES (ceiling, column, empty) sont en position 231-592 — zone ou le modele les ignore. Les instructions en position 1-100 sont bien executees.

---

## 2. Analyse des 5 problemes

### Probleme 1 — Poteaux beton amincis (Gen H, Yann 4/10, Lucas 5/10)

**Prompt actuel** : COLUMN_PRESERVATION en position ~284, dit "Preserve ALL vertical structural elements: columns, posts, pilasters, load-bearing frames, concrete pillars. Each must remain as a separate 3D volume at its exact position..."

**Pourquoi ca echoue** :
1. Position trop tardive (mot ~284 sur 623)
2. "Vertical structural elements" est un concept d'ingenieur, pas un terme visuel
3. "Separate 3D volume" est incomprehensible pour un modele image
4. Le modele voit un poteau beton brut rugueux et le "lisse" pour correspondre au style "smooth finish" du surfacePrompt
5. "Preserve" ne dit pas QUOI FAIRE — le modele sait qu'il doit "preserve" mais sa strategie par defaut est d'amincir pour "nettoyer"

**Fix** — instruction concrete en position 1 :
```
Thick columns keep their exact width — paint the surface, keep the shape.
```
- 12 mots au lieu de 62
- "thick" ancre visuellement la largeur
- "paint the surface, keep the shape" dit EXACTEMENT quoi faire
- Position 1 = poids maximum

### Probleme 2 — Plafond reinvente (Gen H chevrons, Gen I decrochement efface)

**Prompt actuel** : CEILING_PRESERVATION en position ~231, dit "Ceiling: if demolition damage visible, apply smooth plaster coat then style finish. Preserve intentional elements (beams, rafters, arches, slab undersides) with original texture..."

**Pourquoi ca echoue** :
1. "If demolition damage visible, apply smooth plaster coat" — le modele interprete TOUTE rugosité comme "demolition damage" et LISSE tout
2. "Intentional elements" demande un jugement que le modele ne sait pas faire
3. "Preserve original texture" — le probleme N'EST PAS la texture, c'est la FORME. Gen H avait des nervures remplacees par des chevrons = forme differente, pas texture differente
4. Le surfacePrompt dit "white ceiling finish applied over existing ceiling geometry" — "finish" et "geometry" sont trop abstraits

**Fix** — instruction visuelle :
```
Ceiling shape stays exactly as in the input — same bumps, steps, beams, ribs. Paint over the surface, do not flatten.
```
- 21 mots au lieu de 53
- "bumps, steps, beams, ribs" est concret et visuel
- "do not flatten" est la directive MANQUANTE dans le prompt actuel
- "same ... as in the input" ancre par rapport a la reference

### Probleme 3 — Fusion partielle (Gen G, moitie non traitee)

**Diagnostic** : ce n'est PAS un probleme de prompt. C'est un artefact du tiling interne de gpt-image-1.5 sur les images panoramiques complexes. La moitie gauche de l'image n'a simplement pas ete editee.

**Ce que le prompt peut faire** : rien. Les deux audits confirment que c'est un bug technique.

**Recommandation pipeline (pour @fullstack)** : apres generation passe 1, comparer les histogrammes couleur du tiers gauche et du tiers droit de l'output. Si la difference est > seuil (ex: 30% de variance entre les 2 moities), relancer automatiquement. Le cout d'un retry ($0.04) est negligeable vs un output inutilisable.

### Probleme 4 — Baignoire hallucinee en passe 1 (Gen D, Lucas "P0-3")

**Prompt actuel** : "Room stays completely empty — no furniture, no objects" en position ~529. Le builder bathroom dit "no fixtures, no objects" mais Gen D utilisait le builder generique (roomTypeId probablement null pour v51).

**Pourquoi ca echoue** :
1. Position ~529 = le modele ne lit plus
2. "No furniture, no objects" ne couvre PAS les sanitaires — une baignoire n'est ni un meuble ni un "object" au sens courant
3. Le modele reconnait une piece etroite en longueur = salle de bain dans son training data, et infere qu'une baignoire "devrait etre la"

**Fix** — liste explicite en position haute :
```
Room stays EMPTY — no furniture, no bathtub, no sink, no shower, no toilet, no appliances, no built-ins. Only finished surfaces.
```
- 23 mots
- Enumere explicitement les sanitaires
- "Only finished surfaces" cadre le perimetre positivement
- Doit etre en position TOP 5 (premiers 100 mots)

**Fix complementaire** : verifier que le roomTypeId est bien propage — si Gen D etait une salle de bain, le builder bathroom aurait du etre invoque, pas le generique. Cote pipeline, si l'utilisateur selecte un roomType, le builder specifique DOIT s'appliquer.

### Probleme 5 — Moulures ajoutees (Gen I Art Deco, Lucas "moulures de corniche non prescrites")

**Cause racine** : le surfacePrompt Art Deco actuel est :
```
Art Deco: off-white walls with smooth finish keeping the same overall brightness as the input photo, dark stained herringbone parquet flooring, white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs, brass and frosted glass geometric pendant chandelier
```

Il ne prescrit PAS de moulures/corniches. C'est une hallucination pure : le modele associe "Art Deco" a des moulures dans son training data et les ajoute spontanement.

Le Haussmannien, lui, prescrit explicitement "preserving existing crown moldings and cornices" — mais c'est pour les PRESERVER, pas les ajouter.

**Fix dans le builder** : ajouter "No moldings or cornices unless the style description names them."
**Pas de fix dans le surfacePrompt Art Deco** — il est correct. C'est le builder qui doit bloquer les ajouts non prescrits.

---

## 3. Refonte complete des constantes passe 1

### Principes de la refonte

1. **150-200 mots max** par builder assemble (vs 623 actuel)
2. **Ordre = priorite** : structure d'abord, action ensuite, interdictions a la fin
3. **Positif et concret** : "keep X" au lieu de "do not remove X", "30cm wide" au lieu de "preserve geometry"
4. **Zero duplication** : chaque instruction UNE SEULE FOIS
5. **Instructions composites** : fusionner les 10 constantes en 3 blocs compacts

### PASS1_CORE (remplace PASS1_PREAMBLE + CAMERA + ANTI_FENETRE + ANTI_INVENTION + LIGHT)

```
Edit this photo of a room. Keep the exact camera angle and framing.

STRUCTURE LOCK: every column, beam, slab edge, and ceiling shape keeps its exact width, thickness, and position in the frame. Thick columns stay thick — paint the surface, keep the shape. Ceiling shape stays exactly as in the input — same bumps, steps, beams, ribs, level changes. Do not flatten or simplify.

Same number of windows and doors at the same positions. Solid walls stay solid. No new openings at any height.

Keep existing light direction and shadow positions. No warm color shift.
```

**Mots : ~90**

### PASS1_ACTION (remplace WALL_PRESERVATION + CEILING_PRESERVATION + COLUMN_PRESERVATION + surfacePrompt inject)

```
CHANGE ONLY: wall color, floor material, ceiling paint, and one ceiling light. Apply finishes OVER existing surfaces — keep the 3D shape underneath. No moldings or cornices unless the style description names them.

Surface style: {surfacePrompt}.
```

**Mots : ~40 + surfacePrompt (~35) = ~75**

### PASS1_CLEANUP (remplace CONSTRUCTION_CLEANUP + "room stays empty")

```
Remove loose construction items (cables, junction boxes, pipes, outlets) — cover with wall or floor finish. Keep ALL fixed equipment (radiators, heaters, vents, panels) at same positions and count.

Room stays EMPTY — no furniture, no bathtub, no sink, no shower, no toilet, no appliances. Only surfaces.
```

**Mots : ~45**

### PASS1_PHOTO (remplace DSLR_LINE)

```
DSLR wide-angle, sharp focus, deep DOF. No HDR, no text.
```

**Mots : ~12**

### Total assemblee : ~90 + ~75 + ~45 + ~12 = **~222 mots**

C'est une reduction de 64% (623 → 222). Dans le sweet spot de gpt-image-1.5.

---

## 4. Builder generique v53 (living_room, dining_room, office, null)

```typescript
// Constantes v53 — passe 1
const PASS1_CORE = `Edit this photo of a room. Keep the exact camera angle and framing.
STRUCTURE LOCK: every column, beam, slab edge, and ceiling shape keeps its exact width, thickness, and position in the frame. Thick columns stay thick — paint the surface, keep the shape. Ceiling shape stays exactly as in the input — same bumps, steps, beams, ribs, level changes. Do not flatten or simplify.
Same number of windows and doors at the same positions. Solid walls stay solid. No new openings at any height.
Keep existing light direction and shadow positions. No warm color shift.`;

const PASS1_ACTION = `CHANGE ONLY: wall color, floor material, ceiling paint, and one ceiling light. Apply finishes OVER existing surfaces — keep the 3D shape underneath. No moldings or cornices unless the style description names them.`;

const PASS1_CLEANUP = `Remove loose construction items (cables, junction boxes, pipes, outlets) — cover with wall or floor finish. Keep ALL fixed equipment (radiators, heaters, vents, panels) at same positions and count.
Room stays EMPTY — no furniture, no bathtub, no sink, no shower, no toilet, no appliances. Only surfaces.`;

const PASS1_PHOTO = `DSLR wide-angle, sharp focus, deep DOF. No HDR, no text.`;
```

### Builder generique assemble

```typescript
export function buildSurfacesResponsesPrompt(
  surfacePrompt: string,
  roomTypeId?: string | null,
  roomInventory?: string
): string {
  const inventoryLine = roomInventory ? `This room has: ${roomInventory}` : "";
  
  return [
    PASS1_CORE,
    inventoryLine,
    PASS1_ACTION,
    `Surface style: ${surfacePrompt}.`,
    PASS1_CLEANUP,
    PASS1_PHOTO,
  ].filter(Boolean).join(" ");
}
```

### Variante kitchen

Remplacer la ligne "Room stays EMPTY" par :
```
Room stays EMPTY — no furniture, no appliances, no built-in cabinets unless already visible in the input. Only surfaces.
```
Et ajouter apres PASS1_ACTION :
```
Floor: ceramic or stone tiles. Splashback behind work area if walls are tiled in the input.
```

### Variante bathroom

Remplacer "Room stays EMPTY" par :
```
Room stays EMPTY — no bathtub, no shower, no toilet, no sink, no vanity, no towel racks. Only wall and floor tiles, ceiling, light.
```
**C'est la variante la plus critique** — c'est elle qui a produit la baignoire hallucinee en Gen D. L'enumeration explicite des sanitaires est obligatoire.

### Variante bedroom, wc, entryway, laundry, cellar

Meme structure, seule la ligne de sol specifique change :
- Bedroom : "Flooring per style description."
- WC : "Waterproof floor — small ceramic tiles or vinyl."
- Entryway : "Durable floor — ceramic, stone, or hard-wearing wood."
- Laundry : "Waterproof floor — white or light grey ceramic tiles."
- Cellar : "Concrete or stone floor with sealant."

---

## 5. Corrections surfacePrompts (StylePicker.tsx)

### Art Deco — retirer la mention "cornice trim"

Le surfacePrompt Art Deco actuel ne mentionne PAS "cornice trim" (verifie). Les moulures sont hallucinées par le modele a cause de l'association Art Deco = moulures dans le training data. Le fix est dans le builder (PASS1_ACTION contient "No moldings or cornices unless the style description names them").

Pas de modification du surfacePrompt Art Deco necessaire.

### Haussmannien — "preserving existing crown moldings" est correct

Le Haussmannien prescrit "preserving existing crown moldings and cornices" — c'est pour les PRESERVER quand elles existent, pas pour les ajouter. Formulation OK, pas de modification.

### Tous les styles — "white ceiling finish applied over existing ceiling geometry"

Cette formulation est presente dans TOUS les surfacePrompts. Elle est redondante avec PASS1_CORE ("Ceiling shape stays exactly as in the input") et PASS1_ACTION ("Apply finishes OVER existing surfaces").

**Recommandation** : simplifier les surfacePrompts en retirant la clause plafond. Le builder s'en charge. Exemple Scandinave actuel :
```
Scandinavian: warm white walls keeping the same overall brightness as the input photo, wide-plank whitewashed ash flooring with visible natural grain and knots matte finish, white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs, matte white tiered pendant light with soft diffused glow 45cm diameter (PH5-style layered shade)
```

Simplifie :
```
Scandinavian: warm white walls, wide-plank whitewashed ash flooring with visible grain matte finish, PH5-style matte white tiered pendant 45cm
```

La preservation du plafond est dans le builder. La clause "keeping the same overall brightness" est dans PASS1_CORE ("No warm color shift"). Economie : ~15 mots par style x 12 styles = 180 mots economises au total.

---

## 6. Constantes passe 1 supprimees

Les 10 constantes suivantes sont SUPPRIMEES et remplacees par les 4 nouvelles :

| Constante supprimee | Absorbee par |
|---|---|
| PASS1_PREAMBLE | PASS1_CORE |
| ANTI_FENETRE | PASS1_CORE |
| CAMERA_PRESERVATION | PASS1_CORE |
| LIGHT_PRESERVATION | PASS1_CORE |
| CEILING_PRESERVATION | PASS1_CORE |
| COLUMN_PRESERVATION | PASS1_CORE |
| WALL_PRESERVATION | PASS1_ACTION |
| ANTI_INVENTION | PASS1_ACTION |
| CONSTRUCTION_CLEANUP | PASS1_CLEANUP |
| DSLR_LINE | PASS1_PHOTO |

**ATTENTION** : les constantes partagees avec la passe 2 (CAMERA_PRESERVATION, LIGHT_PRESERVATION, COLUMN_PRESERVATION) doivent etre conservees dans le fichier pour les builders passe 2 qui les referencent. Les supprimer UNIQUEMENT des builders passe 1.

---

## 7. Plan d'implementation pour @fullstack

### Etape 1 — Ajouter les 4 nouvelles constantes dans generation-pipeline.ts

Placer APRES les anciennes constantes (ne pas les supprimer encore — la passe 2 les utilise).

### Etape 2 — Reecrire les 8 builders passe 1

Remplacer l'assemblage actuel ([PASS1_PREAMBLE, ANTI_FENETRE, CAMERA, LIGHT, CEILING, COLUMN, WALL, ANTI_INVENTION, ...]) par le nouvel assemblage ([PASS1_CORE, inventoryLine, PASS1_ACTION, surfacePrompt, PASS1_CLEANUP, PASS1_PHOTO]).

Conserver les variantes par roomType (kitchen, bathroom, wc, bedroom, entryway, laundry, cellar) — seule la ligne de sol et la ligne "empty" changent.

### Etape 3 — Simplifier les surfacePrompts dans StylePicker.tsx

Retirer la clause "white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs" de chaque surfacePrompt. Le builder s'en charge.

Retirer "keeping the same overall brightness as the input photo" — le builder dit "No warm color shift".

### Etape 4 — Incrementer PROMPT_VERSION a v53

### Etape 5 — NE PAS toucher aux builders passe 2

Les constantes passe 2 (PASS2_PREAMBLE, EQUIPMENT_PRESERVATION, PASS2_ANTI_INVENTION, etc.) restent inchangees. Seule la passe 1 est refaite.

### Etape 6 — NE PAS toucher aux builders outdoor

Les builders outdoor (buildOutdoorSurfacesResponsesPrompt, buildOutdoorFurnitureResponsesPrompt) restent inchanges. Ils ont leurs propres constantes.

---

## 8. Recommandation pipeline (hors prompt)

### Post-check fusion partielle

Gen G montre un artefact de tiling (moitie non traitee). Ce n'est pas un probleme de prompt.

**Action @fullstack** : apres generation passe 1, avant de lancer passe 2, ajouter une verification :
1. Decouper l'output en 3 bandes verticales (gauche, centre, droite)
2. Calculer la luminosite moyenne de chaque bande
3. Si ecart entre bandes > 40%, relancer la generation (max 1 retry)
4. Si le retry echoue aussi, livrer l'image quand meme (l'utilisateur peut retenter)

Cout d'un retry : ~$0.04. Negligeable vs le cout d'un output inutilisable.

### Propagation roomTypeId

Verifier que le roomTypeId est TOUJOURS propage depuis le client vers le builder. La baignoire hallucinee de Gen D (v51) pourrait etre causee par un roomTypeId null → builder generique au lieu de builder bathroom.

---

## 9. Metriques de succes attendues

| Metrique | v52 (actuel) | v53 (cible) |
|---|---|---|
| Preservation spatiale pieces simples | 6-8.5/10 | 8-9/10 |
| Preservation spatiale pieces complexes | 3-5/10 | 6-7/10 |
| Poteaux porteurs preserves | NON (amincis) | OUI (meme largeur) |
| Plafond decrochements preserves | NON (effaces) | OUI (meme forme) |
| Sanitaires hallucines passe 1 | OUI (baignoire) | NON |
| Moulures hallucinées | OUI (Art Deco) | NON |
| Longueur prompt | ~623 mots | ~222 mots |

---

**Handoff → @fullstack**
- Fichier produit : `docs/ia/passe1-rewrite-v53.md`
- Decisions prises : reduction prompt 623→222 mots, fusion 10 constantes en 4, reordonnancement structure-first, ajout anti-sanitaire explicite, ajout anti-moulure explicite
- Points d'attention : conserver les anciennes constantes pour la passe 2 qui les utilise encore. Ne PAS modifier les builders passe 2 ni outdoor. Verifier propagation roomTypeId pour le builder bathroom. Le post-check fusion partielle est un ajout pipeline separe du rewrite de prompts.
