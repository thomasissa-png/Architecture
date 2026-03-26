# F1 Iteration Prompts — Recommandations consolidees (Yann Duval + Lucas Moreau)

> Date : 2026-03-24
> Sources : f1-iteration-prompts-yann.md (stylistique) + f1-iteration-prompts-lucas.md (technique)
> Destinataire : @fullstack pour implementation

---

## Decisions cles fusionnees

### 1. Principe : enrichir le furniturePrompt, ne jamais le remplacer

Le commentaire utilisateur est **pre-traite par GPT-4.1-mini** puis injecte comme bloc MODIFICATIONS dans le furniturePrompt original du style. Le style reste l'ancre.

```
PROMPT ITERATION = directive d'iteration
                 + MODIFICATIONS (commentaire enrichi)
                 + BASE STYLE (furniturePrompt original)
                 + contraintes (identiques au builder standard)
                 + descripteurs photo
```

### 2. Builders d'iteration separes (pas de flag sur les builders existants)

Creer dans route.ts :
- `buildIterationFurnitureResponsesPrompt(originalFurniturePrompt, modifications, iterationHistory)`
- `buildIterationFurnitureFluxPrompt(originalFurniturePrompt, modifications, iterationHistory)`

### 3. Ordre des tokens dans le prompt d'iteration

**OpenAI** : `Directive → MODIFICATIONS → BASE STYLE → contraintes → photo`
**Flux** : `{modifications}. {style condense ~40 mots}. contraintes condensees. photo`

Les modifications en PREMIER pour maximiser l'attention du modele sur les changements demandes.

### 4. Cumul des modifications entre iterations

Le prompt d'iteration N inclut TOUTES les modifications des iterations 1 a N-1 :

```
APPLY THESE CHANGES:
- v2: charcoal grey sofa replacing beige
- v3: added Berber-style rug
- v4 (current): add trailing green plants
```

**Pourquoi** : l'input image est TOUJOURS la passe 1 (surfaces), pas l'iteration precedente. Sans cumul, les modifications precedentes sont perdues.

### 5. Cache passe 1 avec meta.json

Cle Object Storage :
```
sessions/{sessionId}/{photoIndex}/pass1.jpg   — image base64
sessions/{sessionId}/{photoIndex}/meta.json   — { width, height, styleId, furniturePrompt, createdAt }
```

Le meta.json permet de recuperer le furniturePrompt original, les dimensions, et verifier l'expiration (24h).

### 6. Pre-processing GPT-4.1-mini specifique iteration

**Nouvel endpoint ou adaptation de /api/preprocess-prompt** avec un mode "iteration" :
- PAS de split surface/furniture — retourne un champ `modifications` unique
- Contextualise par styleId (enrichissement coherent avec le style)
- Filtrage strict : elements muraux, structurels, rideaux → warning
- Detection changement radical (>50% du mobilier) → `isRadicalChange: true`
- Garde-fous de densite par style (Japandi 30%, Wabi-Sabi pas de symetrie, etc.)

Format de reponse :
```json
{
  "modifications": "...",
  "warnings": ["..."],
  "isRadicalChange": false
}
```

### 7. Preservation des surfaces — directive renforcee pour l'iteration

Ajouter dans le builder d'iteration (en plus des directives standard) :
```
"The room surfaces in this photo are FINAL and PERFECT. They must not change in any way — not even subtle color shifts, lighting changes, or texture smoothing."
"This is a REFINEMENT of a previous generation. Focus ONLY on adjusting the furniture and decoration as described in the modifications."
```

### 8. Parametres API identiques au standard

- OpenAI : `input_fidelity: "high"`, meme size
- Flux : `guidance: 15`, `steps: 25`, meme dimensions
- Pas de re-compression de l'image passe 1 cachee

### 9. Negative prompt Flux enrichi pour iteration

Ajouter : `"mismatched furniture style, inconsistent color palette"` au FLUX_NEGATIVE_PROMPT existant pour les iterations.

### 10. Logging iterations

Nouveaux champs dans generation_logs :
```sql
is_iteration          BOOLEAN DEFAULT FALSE,
iteration_number      INT,
session_id            VARCHAR(100),
user_comment_raw      TEXT,
user_comment_enriched TEXT,
pass1_cache_key       TEXT
```

---

## Implementation guide pour @fullstack

### Fichiers a modifier

1. **`app/api/generate/route.ts`** :
   - Ajouter `buildIterationFurnitureResponsesPrompt()` et `buildIterationFurnitureFluxPrompt()`
   - Modifier la fonction POST pour accepter `pass1_key`, `userComment`, `iterationHistory`, `sessionId`
   - Si `pass1_key` present : skip passe 1, lire l'image depuis Object Storage, executer uniquement passe 2 avec le builder d'iteration
   - Sauvegarder le resultat d'iteration dans Object Storage pour les versions
   - Logger avec les champs d'iteration

2. **`lib/db.ts`** :
   - Ajouter les champs d'iteration a la table generation_logs (migration)
   - Ajouter une fonction `cachePass1(sessionId, photoIndex, imageBase64, meta)` pour stocker passe 1 + meta.json
   - Ajouter une fonction `getPass1Cache(sessionId, photoIndex)` pour lire le cache

3. **`lib/custom-prompt.ts`** ou nouveau **`lib/iteration-prompt.ts`** :
   - Nouvelle fonction `preprocessIterationComment(comment, styleId, styleName)` avec system prompt specifique
   - Ne PAS reutiliser `preprocessCustomPrompt()` — le system prompt est fondamentalement different

4. **`app/page.tsx`** :
   - SessionId localStorage (genere au premier usage, persist)
   - Etat des iterations par photo (compteur, historique des modifications, versions)
   - Bouton "Affiner ce resultat" sous le comparateur
   - Modale de saisie du commentaire
   - Selecteur de versions (v1, v2, v3) dans le comparateur
   - Gestion des etats : loading iteration, erreur (iteration non consommee), max atteint, plan gratuit

5. **`components/ImageComparator.tsx`** :
   - Accepter une liste de versions (pas juste une image generee)
   - Selecteur de version (pills v1, v2, v3)
   - Chaque version conserve son commentaire en legende
   - Telechargement HD fonctionne sur chaque version

6. **Nouveau composant `components/RefineModal.tsx`** :
   - Modale avec textarea pour le commentaire
   - Compteur d'iterations restantes
   - Warning si GPT-4.1-mini filtre des elements
   - Bouton "Generer l'ajustement" + "Annuler"
   - Indicateur "Consommera 1 iteration (X restantes)"

---

**Handoff → @fullstack**
- Fichiers produits : `docs/ia/f1-iteration-prompts.md` (ce fichier), `docs/ia/f1-iteration-prompts-yann.md`, `docs/ia/f1-iteration-prompts-lucas.md`
- Decisions pretes pour implementation : structure prompt, builders, cache, pre-processing, logging
- Specs fonctionnelles : `docs/product/functional-specs.md` lignes 26-214
