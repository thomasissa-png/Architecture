# Audit technique pipeline v34 -- Lucas Moreau, Expert IA Image

**Date** : 2026-04-01
**Version prompts** : v34
**Modele generatif** : gpt-image-1.5 (hardcode, pas de fallback, pas d'env var)
**Vision** : gpt-4.1 (Responses API)
**Scope** : Diagnostic des 3 problemes signales par le fondateur : gestion des espaces, remplissage mobilier, interpretation custom
**Type** : Audit structurel des prompts + diagnostic causal (sans acces images production -- Object Storage inaccessible depuis l'environnement dev)

---

## Contexte

Le fondateur signale 3 problemes majeurs sur les 3 dernieres generations :
1. **Gestion des espaces** -- l'espace original n'est pas respecte (angle, geometrie, proportions)
2. **Remplissage de l'espace** -- le mobilier n'est pas bien distribue dans la piece
3. **Interpretation custom** -- les prompts personnalises ne sont pas bien interpretes

Version actuelle : v34. Changement critique depuis le dernier audit (v30) : **re-activation de gpt-image-1.5** apres un revert temporaire en v32 (gpt-image-1). Le commentaire v32 disait explicitement "regression spatiale confirmee par audit Lucas". Le modele a ete remis sur gpt-image-1.5 par decision fondateur ("Hardcoded: gpt-image-1.5 is the only model").

---

## Probleme 1 : Gestion des espaces (angle, geometrie, proportions)

### Diagnostic

Le pipeline de preservation geometrique est correct sur le papier. Les builders contiennent :

```
CAMERA_PRESERVATION = "Same camera angle, lens distortion, vanishing points, field of view, orientation."
```

Cette directive est en **position 1** de tous les builders (passe 1 ET passe 2). C'est conforme -- le token weight est maximal en debut de prompt.

La passe 1 ajoute egalement :
```
WALL_PRESERVATION = "Wall geometry must stay identical: same angles, same corners, same depth."
CEILING_PRESERVATION = "Preserve ceiling 3D geometry -- vaults, beams, ribs keep shape."
```

La passe 2 ajoute :
```
"Room structure is LOCKED: walls, floor, ceiling, windows, doors visually identical to input."
```

### Cause racine probable : gpt-image-1.5

Le probleme n'est PAS dans les prompts -- ils sont corrects et complets. Le probleme est le **modele generatif**.

**Fait objectif** : gpt-image-1.5 a deja cause une regression spatiale confirmee en v26, revertee en v32 par mon audit v30. Le changelog dit textuellement :

> v32 (revert gpt-image-1.5 vers gpt-image-1 -- regression spatiale confirmee par audit Lucas, modele configurable via env)

La re-activation de gpt-image-1.5 en v34 **sans audit visuel prealable** est la cause la plus probable de la regression sur la gestion des espaces.

### Mecanisme technique

gpt-image-1.5 est un modele plus rapide (latence /4 promise en v26) mais avec un comportement different face aux directives de preservation :

1. **input_fidelity "high"** est passe au tool image_generation (ligne 467) -- c'est correct
2. **action "edit"** est passe au tool (ligne 465) -- c'est correct
3. Mais le **modele vision (gpt-4.1) et le modele generatif (gpt-image-1.5) sont decouplees** : la vision comprend l'image, mais le generateur peut ne pas preserver la geometrie aussi fidelement que gpt-image-1

### Severite : CRITIQUE (P0)

Le modele generatif est le parametre le plus impactant du pipeline. Les prompts ne peuvent pas compenser un modele qui ne respecte pas la geometrie.

### Correction proposee

**P0-1** : Revenir a `gpt-image-1` comme modele par defaut dans route.ts.

```typescript
// Ligne 47 de route.ts
const IMAGE_MODEL = "gpt-image-1"; // Revert -- gpt-image-1.5 regression spatiale confirmee v32
```

**P0-2** : Rendre le modele configurable via env var pour permettre des tests A/B :

```typescript
const IMAGE_MODEL = process.env.IMAGE_MODEL || "gpt-image-1";
```

---

## Probleme 2 : Remplissage de l'espace (distribution mobilier)

### Diagnostic

Le builder generique passe 2 contient 10 lignes (apres join). La directive de distribution spatiale est :

```
Position 5/10 : "Distribute furniture across FULL DEPTH and WIDTH: primary group foreground,
                 secondary group further back if space allows."
```

Malgre le changelog v31 qui dit "distribution spatiale remontee position 2", la directive est en **position 5 sur 10** dans le builder generique. Les 4 premieres positions sont :

1. CAMERA_PRESERVATION + Room structure LOCKED (preservation geometrie)
2. EQUIPMENT_PRESERVATION (radiateurs, bouches)
3. "Add the following furniture..." + furniturePrompt
4. "Freestanding objects only, resting on the floor."

La directive de distribution est APRES le furniturePrompt qui peut contenir 80+ mots. En termes de tokens, la distribution est donc autour de la position 120-150 tokens sur ~250 total. C'est la zone de dilution.

### Impact gpt-image-1.5

gpt-image-1.5, etant optimise pour la vitesse, pourrait avoir une fenetre d'attention reduite par rapport a gpt-image-1. Les directives tardives (position 5+) risquent d'etre ignorees.

### Analyse des builders specifiques

| Builder | Position DEPTH_DISTRIBUTION | Total lignes | Verdict |
|---|---|---|---|
| Generique (living_room) | 5/10 (inline) | 10 | Trop tardif |
| Kitchen | 5/7 (constante) | 7 | Trop tardif |
| Bedroom | 5/7 (constante) | 7 | Trop tardif |
| Dining room | 4/8 ("sideboard as background anchor") | 8 | OK |
| Bathroom | N/A (compact -- CONTACT_SHADOWS seulement) | 7 | Acceptable |
| WC | N/A | 5 | Acceptable |
| Entryway | N/A ("do not overcrowd") | 6 | Acceptable |

### Probleme structurel : contradiction echelle

Le furniturePrompt du style Scandinave dit :
```
"large straight three-seat sofa in oatmeal boucle 230cm wide"
```

Le builder dit :
```
"Scale furniture to room volume -- if compact (<4m wide), use smaller pieces."
```

Le furniturePrompt est **avant** le builder dans le prompt construit. Le modele recoit "230cm" puis "if compact, use smaller pieces" 100+ tokens plus tard. Le 230cm prime systematiquement par token weight. Resultat : mobilier surdimensionne dans les petites pieces.

### Severite : HAUTE (P1)

### Corrections proposees

**P1-1** : Remonter la directive de distribution en position 2 du builder generique, AVANT le furniturePrompt :

```typescript
return [
  `${CAMERA_PRESERVATION} Room structure is LOCKED: walls, floor, ceiling, windows, doors visually identical to input.`,
  "Distribute furniture across FULL DEPTH and WIDTH of the room. Primary seating group in foreground, secondary anchor further back if space allows.",
  EQUIPMENT_PRESERVATION,
  `Add the following furniture and decoration into this photo of a finished room: ${furniturePrompt}.`,
  "Freestanding objects only, resting on the floor.",
  CONTACT_SHADOWS,
  "Scale references: door = 204cm. Scale furniture to room volume -- if compact (<4m wide), reduce all dimensions by 20%.",
  "Preserve existing light direction and color temperature. No warm tint or yellow cast.",
  "Result should look like a luxury real estate listing photo -- lived-in, not sterile.",
  DSLR_LINE,
].join(" ");
```

**P1-2** : Propager la meme position aux builders kitchen et bedroom (DEPTH_DISTRIBUTION en position 2).

**P1-3** : Supprimer les dimensions fixes des furniturePrompts (230cm, 260cm) ou les rendre conditionnelles. Concretement dans StylePicker.tsx, remplacer :
- "230cm wide" par "three-seat sofa (scale to room width)"
- "200x300cm" par "large area rug (scale to room)"

Ou mieux : centraliser les dimensions dans le builder (source unique de verite) et ne garder dans les furniturePrompts que les descriptions de forme/materiau/couleur.

---

## Probleme 3 : Interpretation custom

### Diagnostic du pipeline custom

Le flux custom traverse 3 etapes :
1. L'utilisateur tape un texte libre (FR ou EN) dans la textarea
2. Le client envoie ce texte a `/api/preprocess-prompt` qui appelle `preprocessCustomPrompt()`
3. GPT-4.1-mini recoit le texte + un system prompt et retourne un JSON `{surfacePrompt, furniturePrompt, warnings}`
4. Ces prompts sont injectes dans le pipeline standard (buildSurfacesResponsesPrompt + buildFurnitureResponsesPrompt)

### Problemes identifies

**A. Le system prompt de GPT-4.1-mini est trop generic et sous-contraint.**

Le system prompt dit :
```
"ENRICH with specific materials, dimensions (cm), textures, and colors"
```

Mais ne donne **aucun exemple concret** de ce qu'un bon surfacePrompt et furniturePrompt ressemblent. GPT-4.1-mini n'a pas vu les 12 stylePrompts existants -- il ne sait pas que le format attendu est par exemple :

```
surfacePrompt: "Scandinavian minimalist: soft white walls keeping the same overall brightness
as the input photo, wide-plank whitewashed ash flooring..."
```

Sans exemples (few-shot), GPT-4.1-mini produit des prompts vagues et courts qui ne matchent pas la qualite des 12 styles curetes.

**B. Le surfacePrompt custom ne nomme potentiellement pas le materiau de sol.**

La regle dans CLAUDE.md dit :
> surfacePrompt : TOUJOURS nommer le materiau de sol cible -- NE JAMAIS ecrire "preserving existing floor material"

Le system prompt de GPT-4.1-mini demande "Always name specific floor material" mais sans exemple, le LLM peut retourner quelque chose comme "nice wooden floor" au lieu de "light oak wide-plank flooring with matte finish".

**C. Le surfacePrompt custom ne prescrit potentiellement pas un luminaire specifique.**

Meme probleme : le system prompt dit "Always prescribe a ceiling light fixture by style" mais sans reference concrete.

**D. Le fallback en cas d'echec est SILENCIEUX.**

Si GPT-4.1-mini timeout (MINI_TIMEOUT_MS = 15s) ou si le JSON est invalide, `preprocessCustomPrompt()` retourne le prompt brut utilisateur non-traduit comme surfacePrompt ET furniturePrompt. Un prompt francais brut injecte dans un builder anglais produit un prompt incoherent.

**E. Le fallback de l'API `/api/preprocess-prompt` est PIRE.**

En cas d'erreur, l'API retourne :
```json
{"surfacePrompt": "", "furniturePrompt": "", "warnings": []}
```

Des prompts **vides** sont envoyes au pipeline. Le builder recoit alors :
```
"Add the following furniture and decoration into this photo of a finished room: ."
```

C'est une instruction vide -- le modele fait ce qu'il veut.

### Severite : CRITIQUE (P0)

### Corrections proposees

**P0-3** : Ajouter du few-shot au system prompt de `preprocessCustomPrompt()` avec 3 exemples concrets tires des 12 styles existants :

```
Example 1:
User: "salon moderne avec canape gris et table en marbre"
surfacePrompt: "Contemporary modern: very light neutral grey walls keeping the same overall brightness as the input photo, light grey engineered stone flooring with matte finish, white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs, minimal recessed ceiling light in brushed chrome"
furniturePrompt: "Contemporary furniture: large low-profile L-shaped sectional sofa in charcoal premium bouclé 230cm, sculptural white marble coffee table on brushed brass base 110cm, heathered grey thick wool area rug 250x350cm, potted architectural snake plant in matte black planter"

Example 2:
User: "ambiance chaleureuse avec du bois et des textiles doux"
surfacePrompt: "Modern cozy: soft off-white walls with subtle cream undertone keeping the same overall brightness as the input photo, light oak wide-plank flooring with matte finish, white ceiling finish applied over existing ceiling geometry, warm fabric drum pendant light in cream tone"
furniturePrompt: "Cozy furniture: generously proportioned boucle sofa in warm cream 260cm with chunky knit throw, camel boucle armchair, round light oak coffee table 100cm with pillar candles, layered cushions in velvet linen and boucle, cream wool area rug 200x300cm"
```

**P0-4** : Corriger le fallback de `/api/preprocess-prompt` pour retourner le prompt brut en cas d'erreur, pas des chaines vides :

```typescript
// app/api/preprocess-prompt/route.ts ligne 18-21
return NextResponse.json({
  surfacePrompt: body?.prompt?.trim() || "",
  furniturePrompt: body?.prompt?.trim() || "",
  warnings: ["Le pre-traitement a echoue. Le prompt brut sera utilise."],
});
```

**P1-4** : Ajouter une validation minimale du resultat de GPT-4.1-mini dans `preprocessCustomPrompt()` :

```typescript
// Apres le JSON.parse
if (!parsed.surfacePrompt || parsed.surfacePrompt.split(" ").length < 15) {
  // Le surfacePrompt est trop court -- probable echec d'enrichissement
  console.warn("Custom surfacePrompt too short, using fallback enrichment");
  // Fallback : injecter le style le plus proche (Contemporain par defaut)
}
```

**P1-5** : Ajouter un exemple de prompt custom dans l'UI (placeholder dans la textarea) pour guider l'utilisateur vers des descriptions exploitables.

---

## Resume croise : correlation des 3 problemes

| Probleme | Cause racine primaire | Cause secondaire | Severite |
|---|---|---|---|
| Gestion espaces | gpt-image-1.5 (regression geometrie confirmee v32) | -- | P0 |
| Remplissage espace | Distribution spatiale en position 5/10 (diluee) | gpt-image-1.5 fenetre attention reduite | P1 |
| Interpretation custom | System prompt GPT-4.1-mini sans few-shot + fallback vide | Pas de validation du resultat | P0 |

### Facteur commun : gpt-image-1.5

Les problemes 1 et 2 sont directement lies au changement de modele generatif. gpt-image-1.5 ne respecte pas les directives de preservation geometrique et de distribution spatiale aussi bien que gpt-image-1. Cela a ete DEJA confirme en v32 et reverte. La re-activation sans audit visuel est la decision la plus risquee du pipeline actuel.

Le probleme 3 est independant du modele -- c'est un probleme de qualite du pre-processing LLM.

---

## Plan d'action prioritise

### P0 -- Actions immediates

| # | Action | Fichier | Description |
|---|---|---|---|
| P0-1 | Revert modele generatif | `app/api/generate/route.ts` L47 | `IMAGE_MODEL = "gpt-image-1"` (ou configurable via env) |
| P0-2 | Configurable via env | `app/api/generate/route.ts` L47 | `const IMAGE_MODEL = process.env.IMAGE_MODEL \|\| "gpt-image-1"` |
| P0-3 | Few-shot custom prompt | `lib/custom-prompt.ts` L43-76 | Ajouter 3 exemples concrets dans le system prompt de preprocessCustomPrompt |
| P0-4 | Fix fallback vide | `app/api/preprocess-prompt/route.ts` L18-21 | Retourner le prompt brut au lieu de chaines vides |

### P1 -- Corrections prompt (appliquer meme si gpt-image-1 revient)

| # | Action | Fichier | Description |
|---|---|---|---|
| P1-1 | Remonter distribution | `app/api/generate/route.ts` builder generique P2 | Position 2/10 au lieu de 5/10 |
| P1-2 | Propager position | `app/api/generate/route.ts` builders kitchen + bedroom | DEPTH_DISTRIBUTION en position 2 |
| P1-3 | Dimensions conditionnelles | `components/StylePicker.tsx` | Remplacer "230cm wide" par "scale to room" dans les 12 furniturePrompts |
| P1-4 | Validation longueur custom | `lib/custom-prompt.ts` | Rejeter surfacePrompt < 15 mots |
| P1-5 | Placeholder textarea | `components/StylePicker.tsx` | Exemple dans la textarea custom |

### P2 -- Optimisations

| # | Action | Fichier | Description |
|---|---|---|---|
| P2-1 | DSLR_LINE position haute | `app/api/generate/route.ts` | Position 3 au lieu de derniere dans P2 |
| P2-2 | Logger modele exact | `app/api/generate/route.ts` | Inclure IMAGE_MODEL dans les logs DB |

---

## Estimation de notes (sans images -- a confirmer par audit visuel)

Si les generations recentes utilisent gpt-image-1.5 sans les corrections P0-P1 :

| Critere | Note estimee | Note cible post-fix |
|---|---|---|
| Preservation geometrique (x2) | 5-6/10 | 8/10 |
| Rendu photorealiste (x2) | 6/10 | 7.5/10 |
| Coherence lumiere | 6.5/10 | 7.5/10 |
| Ombres de contact | 5/10 | 7/10 |
| Echelle mobilier | 5.5/10 | 7.5/10 |
| Preservation surfaces P1 | 7/10 | 8/10 |
| Color fidelity | 6/10 | 7.5/10 |
| Artefacts IA | 6/10 | 7/10 |
| Grain photographique | 5/10 | 7/10 |
| Distribution spatiale | 4.5/10 | 7.5/10 |

**Note globale estimee : 5.6/10** (ponderee x2 sur criteres 1 et 2)
**Note cible post-corrections P0+P1 : 7.5/10**

---

## Rappel regles memoire permanente

Les corrections proposees sont conformes a toutes les regles memoire. En particulier :
- Flux Depth Pro reste INTERDIT en passe 2
- "Do not add warm tint or yellow cast" reste dans tous les builders
- "Subtle film grain visible at 100% zoom" reste obligatoire
- Les prises electriques sont nettoyees en passe 1
- La passe 2 est toujours lancee avec retry

La SEULE regle qui n'est pas respectee en production est la qualite du rendu -- directement imputable au changement de modele generatif.

---

## IMPORTANT : audit visuel requis

Cet audit est un diagnostic de code. Les notes sont des ESTIMATIONS basees sur l'analyse structurelle des prompts et l'historique des regressions. Un audit visuel des 3 dernieres generations via l'API /api/logs est INDISPENSABLE pour :

1. Confirmer la regression geometrique de gpt-image-1.5
2. Mesurer l'ampleur reelle du probleme de distribution
3. Evaluer la qualite des prompts custom preprocesses
4. Comparer avec les notes de reference (v24 gpt-image-1 : 8.0-8.5/10)

Pour cela, il faudrait que les images soient accessibles via un outil WebFetch ou curl depuis l'environnement de dev.
