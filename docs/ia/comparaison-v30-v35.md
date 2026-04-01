# Comparaison prompts v30 vs v35 — Versimo

Date : 2026-04-01

## Contexte

v30 etait la meilleure version de prompts en production. v35 est la version actuelle dans `route.ts`. Cette analyse identifie ce qui a ete perdu et ce qui a ete gagne entre les deux.

---

## 1. Regression principale : inversion de l'ordre des tokens

C'est LE changement le plus impactant entre v30 et v35.

### Passe 1 (surfaces)

| Position | v30 | v35 |
|---|---|---|
| **Debut** | `Edit this photo of a room. Apply this surface finish: ...` | `CAMERA_PRESERVATION + LIGHT_PRESERVATION` |
| **Milieu** | `CEILING_PRESERVATION, WALL_PRESERVATION` | `Edit this photo of a room. Apply this surface finish: ...` |
| **Fin** | `CAMERA_PRESERVATION + LIGHT_PRESERVATION` | `DSLR_LINE` |

### Passe 2 (mobilier)

| Position | v30 | v35 |
|---|---|---|
| **Debut** | `Add the following furniture...` | `CAMERA_PRESERVATION + Room structure LOCKED...` |
| **Milieu** | Directives de placement + densite | `Add the following furniture...` |
| **Fin** | `STRUCTURE_LOCKED + CAMERA_AND_PHOTO` | `DSLR_LINE` |

**Pourquoi c'est une regression** : GPT-image-1 accorde plus de poids aux premiers tokens. Quand les premiers tokens sont "preserve, keep, same angle, same light", le modele entre en mode ultra-conservateur. Quand les premiers tokens sont "Edit / Add furniture", le modele comprend qu'il doit AGIR.

**Concerne** : TOUS les builders (generique, kitchen, bedroom, bathroom, WC, laundry, cellar, entryway, dining).

---

## 2. Directives v30 supprimees en v35

| Directive v30 | Builder concerne | Impact de la perte |
|---|---|---|
| "Do not add baseboards or moldings unless clearly present in the input" | Passe 1 generique + kitchen | Le modele ajoute des plinthes/moulures fantomes |
| "Calm atmosphere -- respect furniture density implied by the style" | Passe 2 bedroom | Perte du controle de densite specifique chambre |
| "No curtains." (explicite dans chaque builder passe 2) | Tous les builders passe 2 | Risque de rideau hallucine (v35 le dit ailleurs mais pas dans les builders dedies) |
| "The number of windows and doors must be EXACTLY the same as in the input. If there are zero windows, there must be zero windows in the output." | Passe 1 generique | Directive de comptage explicite perdue |
| Directive accent wall detaillee (2 cas : 1 mur accent / tous murs meme couleur) | Passe 1 bedroom + generique | v35 condense en une phrase, perte de la logique conditionnelle complete |
| "Place all objects naturally on the floor with correct perspective and scale" | Tous builders passe 2 | Remplace par CONTACT_SHADOWS (partiel) |
| "Cast realistic shadows matching existing light" | Tous builders passe 2 | Remplace par CONTACT_SHADOWS (partiel -- ne couvre pas le matching de lumiere) |
| "same room geometry, same proportions" | Passe 1 generique | Directive geometrique explicite perdue |
| "They must blend seamlessly into the wall finish" (pour elements construction) | Passe 1 generique | v35 abrege en "blend into wall finish" -- OK mais moins precis |
| Scaling detaille bathroom ("ceiling ~250cm, tile size, plumbing, 60cm passage") | Passe 2 bathroom | Perte de references d'echelle specifiques |
| CAMERA_AND_PHOTO (camera + DSLR en un seul bloc en fin) | Tous passe 2 | v35 met CAMERA en tete et DSLR en fin = fragmentation |

---

## 3. Gains v35 a conserver

| Gain v35 | Description | Impact |
|---|---|---|
| **CONTACT_SHADOWS** | "Every piece must appear firmly grounded on the floor with visible contact shadows -- especially furniture placed in the back of the room." | Corrige le mobilier flottant. Absent en v30. GARDER. |
| **DEPTH_DISTRIBUTION constant** | Distribution en profondeur formalisee, propagee a bedroom + kitchen + fallback | v30 l'avait seulement dans le fallback generique. GARDER. |
| **"Furniture must not touch walls"** | Directive anti-cramming explicite dans les builders dedies | v30 l'avait uniquement dans dining et fallback. GARDER. |
| **"luxury real estate listing"** | Propage a kitchen, bedroom, dining (v30 : fallback uniquement) | Direction esthetique renforcee. GARDER. |
| **EQUIPMENT_PRESERVATION centralisee** | Constante partagee au lieu de texte duplique | Plus maintenable. GARDER. |
| **IMAGE_MODEL configurable via env var** | `process.env.IMAGE_MODEL || "gpt-image-1"` | Deja corrige dans v35 actuel (default gpt-image-1). GARDER. |
| **CEILING_PRESERVATION enrichie** | "Refinish ceiling surface: smooth plaster over raw concrete, formwork marks, seams" | Plus detaille que v30. GARDER. |
| **LIGHT_PRESERVATION enrichie** | Inclut "Do not add any warm tint or yellow cast" | Corrige le color shift warm. GARDER. |

---

## 4. Divergences mineures (neutres)

- v35 supprime les Flux builders (buildSurfacesFluxPrompt, buildFurnitureFluxPrompt) : le pipeline actuel n'utilise plus Flux en passe 2 (decision Sprint 22, confirmee par audit Lucas). Neutre.
- v35 supprime le STRUCTURE_LOCKED constant au profit d'un texte inline plus long : fonctionnellement equivalent, plus verbeux. Neutre.
- v35 remplace "For the ceiling light fixture, follow the style description above exactly" par "Ceiling light per style description" : meme intention, plus court. Neutre a legere regression (moins directif).

---

## 5. Recommandations concretes pour v36

### P0 — Restaurer l'ordre v30 (action FIRST)

Dans TOUS les builders passe 1 :
```
1. "Edit this photo of a room. Apply this surface finish: ${surfacePrompt}."
2. Directives specifiques (sol, murs, luminaire)
3. CEILING_PRESERVATION, WALL_PRESERVATION
4. Remove construction leftovers
5. Room stays EMPTY
6. ${CAMERA_PRESERVATION} ${LIGHT_PRESERVATION}
7. DSLR_LINE
```

Dans TOUS les builders passe 2 :
```
1. "Add the following furniture... : ${furniturePrompt}."
2. Directives de placement + densite
3. DEPTH_DISTRIBUTION (si applicable)
4. CONTACT_SHADOWS
5. STRUCTURE_LOCKED / Room structure LOCKED
6. EQUIPMENT_PRESERVATION
7. CAMERA_AND_PHOTO (camera + DSLR en un seul bloc)
```

### P1 — Restaurer les directives v30 perdues

- Ajouter "Do not add baseboards or moldings unless clearly present in the input" dans passe 1 generique
- Ajouter "Calm atmosphere -- respect furniture density implied by the style" dans passe 2 bedroom
- Ajouter "No curtains." explicitement dans chaque builder passe 2 (kitchen, bathroom, WC, bedroom, entryway, laundry)
- Restaurer la directive accent wall en 2 cas dans passe 1 bedroom et generique
- Restaurer "The number of windows and doors must be EXACTLY the same" dans passe 1 generique
- Restaurer le scaling detaille dans passe 2 bathroom

### P2 — Fusionner CAMERA + DSLR en un seul bloc en fin

Recreer la constante CAMERA_AND_PHOTO de v30 :
```ts
const CAMERA_AND_PHOTO = `${CAMERA_PRESERVATION} ${DSLR_LINE}`;
```
Et l'utiliser en FIN de chaque builder passe 2 au lieu de fragmenter camera en tete et DSLR en fin.

---

## Resume : ce qui a casse v30

| # | Cause | Severite | Builders touches |
|---|---|---|---|
| 1 | Action noyee au milieu (preservation en tete) | CRITIQUE | Tous (passe 1 + passe 2) |
| 2 | Perte "Do not add baseboards" | HAUTE | Passe 1 generique, kitchen |
| 3 | Perte "Calm atmosphere" bedroom | HAUTE | Passe 2 bedroom |
| 4 | Perte "No curtains" explicite | HAUTE | Tous passe 2 dedies |
| 5 | Perte directive comptage fenetres | MOYENNE | Passe 1 generique |
| 6 | Fragmentation camera/DSLR | MOYENNE | Tous passe 2 |

---

**Handoff -> @fullstack**
- Fichier : `docs/ia/comparaison-v30-v35.md`
- Decision principale : l'inversion de l'ordre des tokens est la regression n.1. Restaurer action FIRST dans tous les builders.
- Les gains v35 (CONTACT_SHADOWS, DEPTH_DISTRIBUTION, LIGHT_PRESERVATION enrichie) doivent etre conserves.
- Le modele gpt-image-1 est deja le default (env var configurable) -- pas de changement necessaire.
- Estimation : ~20 modifications dans `app/api/generate/route.ts` (reordonner les lignes, restaurer 5-6 directives perdues).
