# Audit : Flux Depth Pro interdit en iteration et passe 2

**Date** : 2026-03-31
**Contexte** : Bug P0 generation #81 -- une iteration "rajoute un dessin de mickey sur le mur" a ete routee vers Flux Depth Pro apres echec OpenAI. Flux a regenere une scene entierement nouvelle (3.0/10).
**Fichier audite** : `app/api/generate/route.ts` + `lib/iteration-prompt.ts`
**Prompt version** : v30

---

## 1. Inventaire complet des chemins d'appel vers Flux/Replicate

### 1.1 Fonctions Flux dans route.ts

| Fonction | Ligne | Description | Appelants |
|---|---|---|---|
| `tryFluxDepth()` | ~775 | Flux Depth Pro pour pipeline standard | `generatePass()` -- protege par DOUBLE garde (appelant + interne) |
| `tryFluxDepthWithPrompt()` | ~912 | Flux Depth Pro avec prompt pre-construit | **AUCUN** (dead code, throw en premiere instruction) |

### 1.2 Points d'appel `generatePass()` (ligne ~987)

| Contexte | Pass | Flux autorise ? | Protection |
|---|---|---|---|
| Passe 1 standard (surfaces) | 1 | OUI | `pass !== 2` dans generatePass() autorise Flux |
| Passe 2 standard (mobilier) | 2 | NON | Garde `pass !== 2` dans generatePass() BLOQUE + throw interne dans tryFluxDepth() |

### 1.3 Points d'appel `generateIterationPass()` (ligne ~963)

| Contexte | Flux autorise ? | Protection |
|---|---|---|
| Iteration adjust (indoor) | NON | Fonction utilise OpenAI uniquement, echec propre si erreur |
| Iteration adjust (outdoor) | NON | Idem |
| Iteration restyle (indoor) | NON | Idem |
| Iteration restyle (outdoor) | NON | Idem |

### 1.4 Instances `new Replicate()` / `replicate.run()`

| Fonction | Contexte | Accessible ? |
|---|---|---|
| `tryFluxDepth()` | Pipeline standard passe 1 uniquement | OUI (protege par double garde) |
| `tryFluxDepthWithPrompt()` | DEAD CODE | NON (throw en premiere instruction) |

### 1.5 References `REPLICATE_API_TOKEN`

| Fichier | Contexte | Risque |
|---|---|---|
| `route.ts` — `tryFluxDepth()` | Init client Replicate | Protege par gardes |
| `route.ts` — `tryFluxDepthWithPrompt()` | DEAD CODE | Aucun (unreachable) |
| `route.ts` — `generatePass()` | Garde conditionnel `pass !== 2 && process.env.REPLICATE_API_TOKEN` | Correct |
| `route.ts` — message erreur | Informatif seulement | Aucun |
| `app/api/health/route.ts` | Health check, pas d'appel API | Aucun |

---

## 2. Verdict par chemin

| Chemin | Statut | Justification |
|---|---|---|
| Passe 1 standard -> `generatePass(pass=1)` -> `tryFluxDepth()` | AUTORISE | Flux en fallback pour surfaces uniquement -- conforme CLAUDE.md |
| Passe 2 standard -> `generatePass(pass=2)` | BLOQUE (x2) | Garde `pass !== 2` dans generatePass() + throw interne dans tryFluxDepth() |
| Iteration (adjust ou restyle) -> `generateIterationPass()` | BLOQUE | Fonction n'appelle que `tryOpenAIResponsesWithPrompt()`, echec propre |
| Appel direct `tryFluxDepth(pass=2)` | BLOQUE | Guard throw interne refuse pass=2 |
| Appel direct `tryFluxDepthWithPrompt()` | BLOQUE | Guard throw en premiere instruction |

---

## 3. Corrections appliquees dans cette session

### P1 -- Guard throw dans `tryFluxDepthWithPrompt()` (CORRIGE)

**Constat** : La fonction etait du dead code pleinement fonctionnel, sans aucune protection.

**Correction** : Ajout d'un `throw new Error("BLOCKED: ...")` en premiere instruction de la fonction. Si elle est appelee par accident lors d'un futur refactoring, elle echoue immediatement avec un message explicite.

### P2 -- Suppression appels builders Flux dans le flow iteration (CORRIGE)

**Constat** : Les 4 branches du flow iteration (adjust indoor/outdoor + restyle indoor/outdoor) appelaient toujours les builders Flux :
- `buildAdjustFluxPrompt()` (ligne 1205)
- `buildAdjustOutdoorFluxPrompt()` (ligne 1195)
- `buildIterationFurnitureFluxPrompt()` (ligne 1230)
- `buildIterationOutdoorFurnitureFluxPrompt()` (ligne 1220)

Les valeurs de retour etaient passees a `generateIterationPass()` comme `_fluxPrompt` (parametre unused). Pas un bug de securite (le parametre est ignore) mais du code executant du travail inutile et source de confusion.

**Correction** : Les 4 appels remplaces par `fluxPrompt = ""; // Flux disabled for iterations (bug #81)`.

Les imports correspondants supprimes de route.ts :
- `buildIterationFurnitureFluxPrompt`
- `FLUX_ITERATION_NEGATIVE_PROMPT`
- `buildIterationOutdoorFurnitureFluxPrompt`
- `buildAdjustFluxPrompt`
- `buildAdjustOutdoorFluxPrompt`

### P3 -- Guard throw dans `tryFluxDepth()` pour pass=2 (CORRIGE)

**Constat** : La fonction acceptait `pass: 1 | 2` sans aucune verification interne. La protection reposait uniquement sur l'appelant (`generatePass()` verifie `pass !== 2`). Si quelqu'un appelait `tryFluxDepth()` directement avec pass=2, ca fonctionnerait.

**Correction** : Ajout d'un guard throw en debut de fonction :
```typescript
if (pass === 2) {
  throw new Error("BLOCKED: tryFluxDepth() called with pass=2. Flux Depth Pro must NEVER be used for furniture pass...");
}
```

### P4 -- Reference `FLUX_ITERATION_NEGATIVE_PROMPT` dans dead code (CORRIGE)

**Constat** : La reference a `FLUX_ITERATION_NEGATIVE_PROMPT` dans `tryFluxDepthWithPrompt()` (ligne 927) causait une erreur TypeScript apres suppression de l'import.

**Correction** : Remplacee par une chaine vide avec commentaire `// Was FLUX_ITERATION_NEGATIVE_PROMPT -- dead code`.

---

## 4. Dead code dans `lib/iteration-prompt.ts`

Les fonctions suivantes sont exportees mais plus jamais importees dans route.ts :
- `buildIterationFurnitureFluxPrompt()` (ligne 58)
- `buildIterationOutdoorFurnitureFluxPrompt()` (ligne 139)
- `buildAdjustFluxPrompt()` (ligne 193)
- `buildAdjustOutdoorFluxPrompt()` (ligne 223)
- `FLUX_ITERATION_NEGATIVE_PROMPT` (ligne 99)

**Decision** : NE PAS supprimer ces fonctions de iteration-prompt.ts. Elles servent de documentation et de reference si un futur modele Flux compatible img2img est integre. Les imports sont supprimes de route.ts -- c'est suffisant pour eliminer le risque.

---

## 5. Aucun chemin cache supplementaire

- **Aucun autre fichier `.ts` n'appelle `replicate.run()`** en dehors de `route.ts`.
- **`app/api/demo/generate/route.ts`** ne contient aucune reference a Replicate/Flux.
- **`app/api/health/route.ts`** verifie l'existence de la cle API mais ne fait aucun appel Replicate.
- **`lib/outdoor-subtypes.ts`** et **`lib/room-types.ts`** mentionnent "flux" uniquement dans des noms de fonctions/commentaires.

---

## 6. Defense en profondeur -- 4 couches

| Couche | Protection | Portee |
|---|---|---|
| 1 | `generateIterationPass()` n'appelle que OpenAI | Toutes les iterations |
| 2 | `generatePass()` bloque Flux si `pass === 2` | Passe 2 standard |
| 3 | `tryFluxDepth()` refuse pass=2 en interne (throw) | Defense en profondeur |
| 4 | `tryFluxDepthWithPrompt()` throw immediatement | Dead code protege |

Avec ces 4 couches, il est physiquement impossible que Flux soit utilise pour une iteration ou une passe 2, quel que soit le chemin d'appel.

---

## 7. Note sur le precedent audit

L'audit precedent (meme fichier, meme date) indiquait les corrections P1, P2, P3 comme "CORRIGE" alors qu'elles n'etaient **PAS presentes dans le code**. Les 3 protections etaient documentees comme appliquees mais le code source n'avait pas ete modifie. Cette version de l'audit reflete l'etat REEL du code apres application effective des corrections.

---

**Handoff -> @infrastructure**
- Fichiers modifies : `app/api/generate/route.ts` (4 corrections : P1 guard throw tryFluxDepthWithPrompt, P2 suppression 4 appels builders Flux + 5 imports, P3 guard throw tryFluxDepth pass=2, P4 fix reference TS)
- Fichier produit : `docs/qa/flux-iteration-audit.md` (rapport corrige)
- Decisions prises : dead code conserve dans `lib/iteration-prompt.ts` (documentation), supprime uniquement des imports dans route.ts
- Points d'attention : aucune variable d'env necessaire, le build TS existant a des erreurs pre-existantes (types manquants) non liees a ces changements
