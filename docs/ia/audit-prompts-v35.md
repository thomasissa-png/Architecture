# Audit Prompts v35 — gpt-image-1.5

**Agent** : @ia
**Date** : 2026-04-01
**Fichiers audites** :
- `app/api/generate/route.ts` (builders passe 1, passe 2, constantes)
- `lib/generation-pipeline.ts` (duplication des builders pour batch/queue)
- `lib/room-types.ts` (roomFurnitureOverride, applyRoomTypeOverrides)
- `lib/iteration-prompt.ts` (builders iteration + adjust)
- `lib/custom-prompt.ts` (preprocessing prompts custom)
- `lib/style-resolver.ts` (duplication serveur des 12 styles indoor)
- `lib/outdoor-styles.ts` + `lib/outdoor-subtypes.ts` (outdoor)
- `components/StylePicker.tsx` (source de verite client-side des 12 styles)

**Modele** : gpt-image-1.5 via Responses API (gpt-4.1 vision), action "edit", input_fidelity "high"
**Score global** : 7.4 / 10

---

## Points forts

1. **Architecture 2 passes bien rodee** : la separation surfaces / mobilier est propre. Chaque passe recoit UNIQUEMENT le prompt qui la concerne. Le pipeline est mur apres 22+ sprints d'iteration.

2. **CAMERA_PRESERVATION en position 1** dans tous les builders passe 1 et passe 2. Les premiers tokens ont le plus d'influence sur gpt-image-1.5 -- cette decision est correcte et coherente.

3. **Constantes partagees** (CAMERA_PRESERVATION, LIGHT_PRESERVATION, etc.) : evite les derives de formulation entre builders. Chaque builder utilise exactement le meme texte.

4. **Structure FOREGROUND/LATERAL/BACKGROUND/ACCENTS** des 12 furniturePrompts (v34) : bien pensee pour distribuer le mobilier en profondeur. Cela guide explicitement la composition spatiale.

5. **Builders dedies par type de piece** : kitchen, bathroom, WC, bedroom, entryway, laundry, cellar ont chacun un builder adapte. Les directives sont contextuellement correctes (carrelage en cuisine, espace minimal en WC, fonctionnel en buanderie).

6. **Custom prompt preprocessing** : le system prompt GPT-4.1-mini est detaille avec des exemples concrets (few-shot). Le split surface/furniture est explicite. Le filtrage des elements incompatibles est raisonnable.

7. **Intent classification adjust/restyle** : bonne separation des modes d'iteration. Le mode adjust preserve les meubles existants, le mode restyle repart de la passe 1.

8. **Directives conditionnelles** : "if compact", "if ceiling > 3m", "if deep room" -- le modele adapte sans casser les cas standards.

---

## Problemes identifies

### P0 — Critique

#### P0-1 : Duplication complete des builders entre route.ts et generation-pipeline.ts

Les fonctions `buildSurfacesResponsesPrompt`, `buildFurnitureResponsesPrompt`, `buildOutdoorSurfacesResponsesPrompt`, `buildOutdoorFurnitureResponsesPrompt`, et toutes les constantes (DSLR_LINE, CAMERA_PRESERVATION, etc.) sont dupliquees a l'identique entre `app/api/generate/route.ts` et `lib/generation-pipeline.ts`.

**Risque** : une modification de prompt dans un fichier qui n'est pas propagee dans l'autre = comportement different entre la generation standard (route.ts) et la generation batch/queue (generation-pipeline.ts). Deja vu : l'historique de version dans les commentaires differe legerement entre les deux fichiers ("furniturePrompts 12 styles avec FOREGROUND/LATERAL/BACKGROUND/ACCENTS, pre-processor custom enrichi few-shot + filtrage assoupli" present dans route.ts, absent dans generation-pipeline.ts).

**Correction** : exporter les builders et constantes depuis un seul fichier (`lib/prompt-builders.ts`) et les importer dans les deux. Zero duplication.

#### P0-2 : Style hint trop faible pour les rooms avec builders dedies

Le fix recent :
```
`${rt.roomFurnitureOverride} Match the ${styleId || "contemporary"} design style for all materials, finishes, and color palette.`
```

Ce hint d'une seule phrase est insuffisant pour que gpt-image-1.5 applique un style reconnaissable. Exemples :

- **Cuisine + Scandinave** : le hint dit "Match the scandinavian design style" mais le modele n'a aucune reference concrete. Resultat probable : des caissons generiques dans une teinte neutre, pas de bois clair, pas de poignees typiques, pas de credence identifiable.
- **Salle de bain + Art Deco** : "Match the art-deco design style" ne guide pas vers brass fixtures, geometric patterns, fluted vanity. Le modele va produire une salle de bain generique.
- **Chambre + Japandi** : "Match the japandi design style" sans mentions de ash wood, undyed linen, negative space, le lit sera generique.

Le probleme est structurel : les furniturePrompts des 12 styles contiennent des references materiaux/textures/couleurs tres specifiques (~80-120 mots chacun). Le style hint d'une phrase ne vehicule pas cette richesse.

**Correction** : extraire un "style material palette" de chaque style (20-30 mots) et l'injecter apres le roomFurnitureOverride. Exemple :
```
${rt.roomFurnitureOverride} Style: scandinavian — light ash wood, oatmeal boucle, cream wool, birch legs, matte white finishes, clean geometric lines. All materials, textures, and colors must follow this style.
```

Cela peut etre un champ `materialPalette` dans chaque style de `style-resolver.ts`.

#### P0-3 : Triplication des donnees de style (StylePicker.tsx, style-resolver.ts, CLAUDE.md)

Les 12 x surfacePrompt + furniturePrompt existent dans trois endroits :
1. `components/StylePicker.tsx` — source de verite client
2. `lib/style-resolver.ts` — duplication serveur (pour batch Mode Pro)
3. CLAUDE.md les documente en commentaire (risque de desynchronisation)

La version de `style-resolver.ts` n'a **pas** la structure FOREGROUND/LATERAL/BACKGROUND/ACCENTS de StylePicker.tsx. Les furniturePrompts dans style-resolver.ts sont la version **pre-v34** (sans placement spatial).

**Impact** : les generations batch (Mode Pro, dossiers) utilisent `style-resolver.ts` et ne beneficient pas de la distribution spatiale v34. Le Mode Pro produit des resultats inferieurs a la generation directe.

**Correction** : synchroniser style-resolver.ts avec StylePicker.tsx. Idealement, extraire les donnees de style dans un fichier partage `lib/styles-data.ts` importe par les deux.

### P1 — Haute

#### P1-1 : Formulations negatives dans les builders ("No X", "NOT X", "Do not")

gpt-image-1.5 est plus creatif que gpt-image-1. Les mentions negatives amorcent le modele a generer ce qu'on interdit. Inventaire des formulations a risque :

**Passe 1 (surfaces)** :
- "Room stays COMPLETELY EMPTY — no furniture, no appliances" — 11 occurrences
- "NOT wood, NOT parquet" (cuisine) — mentionne le bois qu'on ne veut pas
- "no fixtures, no objects" (bathroom)
- "No text or watermarks" (DSLR_LINE) — acceptable, standard

**Passe 2 (mobilier)** :
- "Furniture must not touch walls" — risque de mobilier colle aux murs paradoxalement
- "No warm tint or yellow cast" — repete 8+ fois, amorcage potentiel
- "No duplicate items unless style calls for a pair" — mentionne les doublons

**Corrections suggerees** :
- "Room stays COMPLETELY EMPTY — no furniture" → "Room stays COMPLETELY EMPTY. Only finished surfaces visible."
- "NOT wood, NOT parquet" → "Ceramic or natural stone floor tiles exclusively"
- "Furniture must not touch walls" → "Leave 15cm gap between furniture and walls"
- "No warm tint or yellow cast" → "Maintain exact color temperature from input"

#### P1-2 : DEPTH_DISTRIBUTION absent de 4 builders dedies passe 2

Le DEPTH_DISTRIBUTION est present dans : kitchen, bedroom, generic fallback.
Il est **absent** de : bathroom, WC, entryway, laundry, cellar, dining_room.

Pour bathroom/WC/entryway, c'est volontaire (petits espaces). Mais pour **dining_room**, c'est un oubli : une salle a manger peut etre profonde, et sans la directive, table + chaises + buffet seront tous au premier plan.

**Correction** : ajouter DEPTH_DISTRIBUTION au builder dining_room passe 2. Formuler conditionnellement : "If the room appears deep, place the sideboard in the back third as anchor."

#### P1-3 : roomFurnitureOverride des rooms dediees pas de structure FOREGROUND/BACKGROUND

Les roomFurnitureOverride dans `lib/room-types.ts` listent les meubles sans indication de placement spatial. Par exemple :

```
"Adult bedroom furniture: upholstered double bed 160cm wide with padded headboard..."
```

Aucune indication FOREGROUND/BACKGROUND. Le modele va tout empiler au premier plan, contredisant DEPTH_DISTRIBUTION dans le builder.

**Correction** : restructurer les roomFurnitureOverride avec la meme convention FOREGROUND/BACKGROUND. Exemple :
```
"FOREGROUND: upholstered double bed 160cm wide with padded headboard and fitted bedlinen, two matching bedside tables 45cm. BACKGROUND: tall wardrobe or dresser as anchor. FLOOR: soft area rug 160x230cm beside the bed."
```

#### P1-4 : Outdoor passe 1 — CAMERA_PRESERVATION absente en position 1

Le builder `buildOutdoorSurfacesResponsesPrompt` commence par :
```
"Edit this outdoor photo. Keep exact same camera angle, lens distortion, vanishing points."
```

Mais **n'utilise pas** la constante `CAMERA_PRESERVATION`. La formulation est differente et plus faible ("Keep" vs "Same" qui est plus imperatif en early position). De plus, `LIGHT_PRESERVATION` n'est pas en position 1 non plus — elle arrive en fin de prompt ("Preserve the exact lighting conditions from the input").

**Correction** : aligner l'outdoor passe 1 sur la meme structure que l'indoor :
```
[CAMERA_PRESERVATION, "Open-air space — no ceiling, sky preserved as-is. Preserve highlights...", ...]
```

#### P1-5 : Iteration prompt — `_furniturePrompt` parametre inutilise

Dans `buildIterationFurnitureResponsesPrompt`, le parametre `_furniturePrompt` est prefix par `_` (convention d'inutilise). Le prompt de restyle ne reinjecte **pas** le furniturePrompt du style original.

**Impact** : quand l'utilisateur fait un restyle (pas un adjust), le modele ne recoit QUE les modifications demandees, sans le contexte du style original. Le resultat risque d'etre generique.

**Correction** : injecter le furniturePrompt original comme contexte de base dans le prompt de restyle :
```
"Base style furniture: ${furniturePrompt}. Apply these changes: ..."
```

#### P1-6 : Passe 2 builders dedies — pas de directive "lived-in, not sterile catalog"

Le builder generique (fallback) inclut "Result should look like a luxury real estate listing photo — lived-in, not a sterile catalog." Cette directive est absente des builders WC, entryway, laundry, cellar.

Pour WC/laundry/cellar, "luxury real estate listing" est probablement excessif. Mais l'absence totale de directive d'atmosphere produit des rendus cliniques.

**Correction** : ajouter "Clean and functional appearance" pour les espaces techniques, "Warm and welcoming entrance" pour l'entryway.

### P2 — Moyenne

#### P2-1 : Custom prompt preprocessing — pas de gestion du mode outdoor

`preprocessCustomPrompt` dans `lib/custom-prompt.ts` genere toujours un surfacePrompt/furniturePrompt pour l'interieur. Si un utilisateur entre un prompt custom en mode outdoor ("terrasse provencale avec table en fer forge"), le preprocessing va ajouter "white ceiling finish applied over existing ceiling geometry" — inapproprie pour l'exterieur.

**Correction** : passer `isOutdoor` en parametre et adapter le system prompt GPT-4.1-mini.

#### P2-2 : Iteration outdoor — pas de roomType/subtype dans le prompt

`buildIterationOutdoorFurnitureResponsesPrompt` ne recoit pas et n'injecte pas le subtype (balcon, terrasse, patio). Les contraintes de subtype (ex: "bistro-scale furniture" pour balcon) sont perdues en iteration.

**Correction** : passer le subtype et injecter les `subtypeFurnitureOverride` dans le prompt d'iteration outdoor.

#### P2-3 : DSLR_LINE — formulations legerement differentes entre pass 1 et pass 2

- Passe 1 (DSLR_LINE) : "Subtle photographic film grain must be visible at 100% zoom — not smooth CGI rendering. Natural lens vignetting darkening the corners by 5-10%."
- Passe 2 (generic fallback) : "Subtle film grain at 100% zoom. Natural lens vignetting 5-10%."
- Passe 2 (dedies) : "Subtle film grain."
- Iteration : "subtle sensor grain (ISO 200), natural corner vignetting"

Quatre formulations differentes pour la meme intention. Pas bloquant, mais source de variation inutile.

**Correction** : utiliser DSLR_LINE partout, ou creer une version courte DSLR_SHORT pour les builders plus compacts.

#### P2-4 : roomFurnitureOverride kitchen mentionne "upper cabinetry mounted at 140cm from floor"

Cette directive de hauteur specifique risque de forcer le modele a generer des meubles hauts qui ne correspondent pas a la piece reelle. Si les murs de la cuisine sont bas (sous-pente, mezzanine), le resultat sera incoherent.

**Correction** : formuler conditionnellement : "upper cabinetry mounted at standard height" ou supprimer la hauteur exacte.

#### P2-5 : Style hint fallback "contemporary" quand styleId est vide

```typescript
`Match the ${styleId || "contemporary"} design style...`
```

Si `styleId` est vide ou undefined, le style par defaut est "contemporary". Mais pour une cuisine selectionnee avec un style custom, le preprocessor custom a deja produit un furniturePrompt style, et le hint "contemporary" viendrait le contredire.

**Correction** : quand styleId est "custom", ne pas ajouter le style hint. Le furniturePrompt custom suffit.

#### P2-6 : Aucune directive anti-"floating furniture" explicite en passe 2

CONTACT_SHADOWS demande des ombres au sol, mais ne dit pas explicitement que les meubles doivent etre poses au sol (pas en levitation). Le terme "firmly grounded" est present mais pas en position forte.

**Correction** : reformuler CONTACT_SHADOWS pour ouvrir par le positionnement : "Every piece must rest on the floor surface — no floating or hovering. Visible contact shadows, especially for furniture in the back."

---

## Recapitulatif

| # | Severite | Description | Fichier(s) |
|---|---|---|---|
| P0-1 | CRITIQUE | Duplication complete des builders route.ts / generation-pipeline.ts | route.ts, generation-pipeline.ts |
| P0-2 | CRITIQUE | Style hint trop faible pour rooms avec builders dedies | route.ts:1014, generation-pipeline.ts:669 |
| P0-3 | CRITIQUE | style-resolver.ts desynchronise (pas de FOREGROUND/BACKGROUND) | style-resolver.ts vs StylePicker.tsx |
| P1-1 | HAUTE | Formulations negatives amorcent gpt-image-1.5 | route.ts (11+ occurrences) |
| P1-2 | HAUTE | DEPTH_DISTRIBUTION absent du builder dining_room | route.ts, generation-pipeline.ts |
| P1-3 | HAUTE | roomFurnitureOverride sans structure FOREGROUND/BACKGROUND | room-types.ts |
| P1-4 | HAUTE | Outdoor passe 1 n'utilise pas CAMERA_PRESERVATION constant | route.ts, generation-pipeline.ts |
| P1-5 | HAUTE | Restyle iteration n'injecte pas le furniturePrompt original | iteration-prompt.ts |
| P1-6 | HAUTE | Builders dedies sans directive d'atmosphere | route.ts, generation-pipeline.ts |
| P2-1 | MOYENNE | Custom preprocessing ignore le mode outdoor | custom-prompt.ts |
| P2-2 | MOYENNE | Iteration outdoor perd les contraintes de subtype | iteration-prompt.ts |
| P2-3 | MOYENNE | 4 formulations differentes de la directive DSLR | route.ts, iteration-prompt.ts |
| P2-4 | MOYENNE | Kitchen upper cabinetry hauteur hardcodee | room-types.ts |
| P2-5 | MOYENNE | Style hint fallback "contemporary" pour custom | route.ts:1014 |
| P2-6 | MOYENNE | Pas de directive anti-floating explicite | route.ts (CONTACT_SHADOWS) |

---

## Plan d'action recommande

**Vague 1 (P0 — a faire avant toute generation supplementaire)** :
1. Extraire tous les builders + constantes dans `lib/prompt-builders.ts`, importer partout
2. Creer un champ `materialPalette` par style (20-30 mots), injecter dans le hint des rooms dediees
3. Synchroniser style-resolver.ts avec StylePicker.tsx (FOREGROUND/BACKGROUND)

**Vague 2 (P1 — prochaine session)** :
4. Reformuler les negations les plus critiques (5-6 occurrences prioritaires)
5. Ajouter DEPTH_DISTRIBUTION au dining_room
6. Restructurer roomFurnitureOverride avec zones spatiales
7. Aligner outdoor passe 1 sur CAMERA_PRESERVATION
8. Injecter furniturePrompt dans restyle iteration
9. Ajouter directives d'atmosphere aux builders dedies

**Vague 3 (P2 — quand le temps le permet)** :
10-15. Corrections mineures listees ci-dessus

---

**Handoff -> @orchestrator**
- Fichier produit : `docs/ia/audit-prompts-v35.md`
- Decisions prises : aucune modification de code (audit en lecture seule)
- Points d'attention :
  - P0-1 (duplication builders) est une bombe a retardement — toute modification de prompt future risque d'etre appliquee dans un seul des deux fichiers
  - P0-2 (style hint faible) degrade directement la qualite des generations cuisine/salle de bain/chambre/WC — les rooms les plus courantes
  - P0-3 (style-resolver.ts desync) signifie que le Mode Pro batch produit des resultats inferieurs a la generation directe
  - Les corrections P0 doivent etre implementees par @fullstack avec validation par un audit visuel (agents Yann/Lucas)
