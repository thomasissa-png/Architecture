# F1 Iteration Prompts — Recommandations Lucas Moreau (Expert IA Image)

> Agent : Lucas Moreau — Expert IA Image, prompt engineering multi-modeles
> Date : 2026-03-24
> Mission : Strategie technique pour la construction du prompt d'iteration F1

---

## 1. Architecture du prompt d'iteration — analyse technique

### Contexte pipeline actuel

Le pipeline 2 passes fonctionne ainsi :
- **Passe 1** : `buildSurfacesResponsesPrompt(surfacePrompt)` → image surfaces finies, piece vide
- **Passe 2** : `buildFurnitureResponsesPrompt(furniturePrompt)` → image meublee

Pour l'iteration F1, on skip la passe 1 et on re-execute uniquement la passe 2 sur le resultat de passe 1 cache.

### Probleme technique critique

Le builder `buildFurnitureResponsesPrompt()` actuel ne sait pas qu'il s'agit d'une iteration. Il envoie le prompt comme si c'etait une generation de zero. Or, pour une iteration :
1. Le modele recoit la meme image de passe 1 que la generation initiale
2. Le prompt doit communiquer que c'est un **ajustement**, pas une recreation
3. Les modifications doivent etre **hierachiquement superieures** au furniturePrompt de base dans l'attention du modele

### Solution : nouveau builder dedie

Creer `buildIterationFurnitureResponsesPrompt()` et `buildIterationFurnitureFluxPrompt()` separes du builder standard. Ne PAS reutiliser le builder existant avec un flag — la structure du prompt est fondamentalement differente.

---

## 2. Structure du prompt d'iteration — OpenAI Responses API

### Token weighting et ordre des elements

Pour GPT-4.1 Responses API, l'ordre des elements dans le prompt impacte l'attention du modele. Les premiers tokens ont plus d'influence. Pour une iteration, l'ordre optimal est :

```
1. DIRECTIVE D'ACTION : "Refine the furniture in this photo..."
2. MODIFICATIONS SPECIFIQUES : ce qui change (les plus hautes en priorite)
3. STYLE DE BASE : le furniturePrompt original (contexte)
4. CONTRAINTES : preservation surfaces, freestanding only, etc.
5. DESCRIPTEURS PHOTO : DSLR, DOF, grain
```

**Pourquoi cet ordre** : dans une generation standard, le style est en premier car c'est l'element principal. Dans une iteration, les modifications sont l'element principal — le style est le contexte. Inverser l'ordre donnerait trop de poids au style original et les modifications seraient "noyees" dans les tokens tardifs.

### Prompt d'iteration recommande — OpenAI Responses API

```
"Refine the furniture arrangement in this photo of a finished room.

APPLY THESE CHANGES: {modifications}.

BASE STYLE (keep everything not mentioned in changes): {furniturePrompt original}.

Distribute furniture across the full depth and width of the room. [...]

Room structure is LOCKED: every wall, window, door, ceiling, and floor surface must remain visually identical to the input. [...]

DSLR full-frame wide-angle 16-35mm f/8, deep DOF, sharp focus, subtle sensor grain (ISO 200), natural corner vignetting."
```

**Points cles** :
- "Refine" au lieu de "Add" (signal d'iteration, pas de generation de zero)
- MODIFICATIONS en majuscules et en premier apres la directive (maximum d'attention)
- "keep everything not mentioned" — directive explicite de preservation
- Les contraintes de surface restent identiques au builder standard

---

## 3. Structure du prompt d'iteration — Flux Depth Pro (fallback)

Flux a une fenetre d'attention plus courte que GPT-4.1. Le prompt doit etre plus condense.

### Prompt d'iteration recommande — Flux

```
"{modifications}. {furniturePrompt original, condense a ~40 mots}. Refinement of existing arrangement — keep unchanged elements as described. Freestanding furniture only, no wall-mounted objects. Photo-realistic interior, DSLR 16-35mm f/8, deep DOF, sharp focus, subtle film grain."
```

**Points cles** :
- Modifications en PREMIER (tokens de tete = plus d'influence sur SDXL/Flux)
- furniturePrompt condense car Flux a une attention limitee (~77 tokens CLIP)
- Pas de bloc "APPLY THESE CHANGES" verbeux — Flux n'a pas besoin de la structure formelle

### Negative prompt Flux pour iteration

Ajouter au FLUX_NEGATIVE_PROMPT existant :
```
"mismatched furniture style, inconsistent color palette"
```

Ces termes supplementaires reduisent le risque que Flux genere du mobilier incoherent avec le style de base lorsqu'on applique des modifications.

---

## 4. Preservation des surfaces en iteration

### Risque identifie

En iteration, le modele recoit l'image de passe 1 (surfaces finies, piece vide). C'est la meme image que pour la generation initiale. Mais le prompt d'iteration contient des modifications qui pourraient "contaminer" les surfaces si mal formulees.

### Directives de preservation — identiques au builder standard

Les directives suivantes du `buildFurnitureResponsesPrompt()` existant DOIVENT etre conservees telles quelles dans le builder d'iteration :

1. "Room structure is LOCKED: every wall, window, door, ceiling, and floor surface must remain visually identical to the input"
2. "ONLY add freestanding objects that rest on the floor or sit on existing surfaces. Do NOT attach anything to walls."
3. "Preserve all wall-mounted fixed equipment visible in the input: radiators, heaters, vents, thermostats"
4. "If the input has zero windows, the output must have zero windows"
5. "Preserve the exact same camera angle, lens distortion, vanishing points"

**Ne PAS alleger ces directives pour l'iteration** — le risque de derive des surfaces est le meme que pour une generation standard.

---

## 5. Gestion du cache passe 1 — implications techniques pour les prompts

### Format de l'image cachee

L'image de passe 1 est stockee dans Object Storage au format JPEG (voir `saveImage()` dans `lib/db.ts`). Pour l'iteration :

1. Lire l'image depuis Object Storage : `getImage(pass1_key)`
2. La convertir en base64 pour l'injecter dans l'API OpenAI ou Flux
3. **Pas de re-compression** : l'image est deja compressez lors de la passe 1. Re-compresser degraderait la qualite et ajouterait des artefacts JPEG que le modele pourrait interpreter comme des "textures" a preserver.

### Dimensions

Les dimensions de l'image de passe 1 sont les memes que celles de la generation initiale (le parametre `size` est identique). Donc le `getOutputSize()` pour l'iteration doit utiliser les memes dimensions que la generation originale. Le plus simple : stocker les dimensions dans le cache avec l'image.

### Cle de cache recommandee

```
sessions/{sessionId}/{photoIndex}/pass1.jpg  — image base64
sessions/{sessionId}/{photoIndex}/meta.json  — { width, height, styleId, surfacePrompt, furniturePrompt, createdAt }
```

Le meta.json permet de :
- Verifier l'expiration (createdAt + 24h)
- Recuperer le furniturePrompt original pour le builder d'iteration
- Recuperer les dimensions pour le outputSize
- Recuperer le styleId pour contextualiser l'enrichissement GPT-4.1-mini

---

## 6. Coherence input/output en iteration

### Probleme anticipe : derive progressive

Iteration 1 : legere derive acceptable (canape change de couleur)
Iteration 2 : derive cumulee (la lumiere a legerement change, les ombres sont inconsistantes)
Iteration 3 : derive visible (le resultat ne ressemble plus a la piece originale)

### Solution : toujours utiliser l'image de passe 1 comme input

C'est deja specifie dans les specs F1 ("l'image input de la passe 2 = TOUJOURS le resultat de la passe 1 originale"). Du point de vue technique, c'est la bonne decision car :
- La passe 1 est le "ground truth" des surfaces
- Chaque iteration repart de la meme base geometrique
- Pas de degradation progressive de l'image

### Directive supplementaire de coherence

Ajouter dans le builder d'iteration :
```
"The room surfaces in this photo are FINAL and PERFECT. They must not change in any way — not even subtle color shifts, lighting changes, or texture smoothing."
```

Cette directive renforce que les surfaces de passe 1 sont sacrees, meme plus que dans une generation standard (ou le modele sait qu'il "ajoute" pour la premiere fois).

---

## 7. Parametres API pour l'iteration

### OpenAI Responses API

```typescript
tools: [{
  type: "image_generation",
  input_fidelity: "high",  // CRITIQUE — preserver la geometrie
  size: outputSize.openai,
}]
```

`input_fidelity: "high"` est encore plus important en iteration qu'en generation standard, car on veut que le modele respecte l'image de passe 1 au maximum.

### Flux Depth Pro

```typescript
guidance: 15,  // meme que passe 2 standard
steps: 25,     // meme que standard
```

Le `guidance` de 15 est deja optimal pour la passe 2. Pas besoin de l'augmenter pour l'iteration — un guidance plus eleve risquerait de "forcer" les modifications au detriment de la coherence.

---

## 8. Pre-processing GPT-4.1-mini — regles techniques

### System prompt specifique pour l'iteration

Le system prompt GPT-4.1-mini pour l'iteration est DIFFERENT de celui de `lib/custom-prompt.ts` (qui fait le split surface/furniture pour les prompts custom). Pour l'iteration :

1. **PAS de split surface/furniture** — on ne genere QUE des modifications du furniturePrompt
2. **Contextualiser avec le style** — injecter le styleId et le nom du style pour que GPT-4.1-mini enrichisse dans le bon registre stylistique
3. **Traduire FR→EN** — comme pour le custom
4. **Enrichir avec dimensions/materiaux** — comme pour le custom
5. **Filtrer les elements non-freestanding** — plus strict que le custom : AUCUN element mural, AUCUN rideau, AUCUN changement de surface
6. **Retourner un champ `isRadicalChange`** — si le commentaire revient a changer > 50% du mobilier, signaler

### Format de reponse GPT-4.1-mini pour iteration

```json
{
  "modifications": "...",  // EN, enrichi, dimensions, materiaux
  "warnings": ["..."],     // FR, a afficher a l'utilisateur
  "isRadicalChange": false
}
```

**Note** : le champ `modifications` est une STRING, pas un surfacePrompt/furniturePrompt split. Il sera injecte directement dans le builder d'iteration.

---

## 9. Logging et audit des iterations

### Champs supplementaires dans generation_logs

Pour les iterations, les champs suivants doivent etre loggues :

```sql
is_iteration         BOOLEAN DEFAULT FALSE,
iteration_number     INT,
session_id           VARCHAR(100),
user_comment_raw     TEXT,          -- commentaire brut utilisateur
user_comment_enriched TEXT,         -- commentaire enrichi par GPT-4.1-mini
pass1_cache_key      TEXT,          -- cle Object Storage de la passe 1 reutilisee
previous_iteration_id INT,          -- reference a la generation precedente
```

**Pourquoi** : pour que Yann et Lucas puissent auditer les iterations en production — voir le commentaire brut vs enrichi vs prompt final vs rendu.

---

## 10. Resume des recommandations techniques

| Priorite | Recommandation | Fichier impacte |
|----------|---------------|-----------------|
| P0 | Nouveau builder `buildIterationFurnitureResponsesPrompt()` separe | route.ts |
| P0 | Nouveau builder `buildIterationFurnitureFluxPrompt()` separe | route.ts |
| P0 | Modifications en PREMIER dans le prompt (avant le style de base) | route.ts |
| P0 | Stocker meta.json avec l'image passe 1 (dimensions, styleId, furniturePrompt) | route.ts + db.ts |
| P0 | Pas de re-compression de l'image passe 1 cachee | route.ts |
| P1 | System prompt GPT-4.1-mini specifique iteration (pas de split, contextualise par style) | custom-prompt.ts ou nouveau fichier |
| P1 | Directive "surfaces are FINAL and PERFECT" dans le builder iteration | route.ts |
| P1 | input_fidelity "high" obligatoire pour les iterations | route.ts |
| P2 | Negative prompt Flux enrichi pour iteration | route.ts |
| P2 | Champs de logging supplementaires pour les iterations | db.ts |
| P2 | Cumul des modifications dans le prompt (iteration N inclut les N-1 modifications) | route.ts |

---

**Handoff → Yann Duval + @fullstack**
- Fichier produit : `docs/ia/f1-iteration-prompts-lucas.md`
- Decisions cles : builders separes (pas de flag), modifications en tete du prompt, meta.json avec l'image passe 1, pas de re-compression, system prompt GPT-4.1-mini specifique
- Points d'attention : l'image passe 1 est le ground truth, toujours l'utiliser comme input (jamais le resultat d'une iteration precedente)
