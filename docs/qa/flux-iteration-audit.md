# Audit : Flux Depth Pro interdit en iteration et passe 2

**Date** : 2026-03-31
**Contexte** : Bug P0 generation #81 — une iteration "rajoute un dessin de mickey sur le mur" a ete routee vers Flux Depth Pro apres echec OpenAI. Flux a regenere une scene entierement nouvelle (3.0/10).
**Fichier audite** : `app/api/generate/route.ts` + `lib/iteration-prompt.ts`
**Prompt version** : v30

---

## 1. Inventaire complet des chemins d'appel vers Flux/Replicate

### 1.1 Fonctions Flux dans route.ts

| Fonction | Ligne | Description | Appelants |
|---|---|---|---|
| `tryFluxDepth()` | 768 | Flux Depth Pro pour pipeline standard (passe 1 ou 2) | `generatePass()` ligne 1007 |
| `tryFluxDepthWithPrompt()` | 905 | Flux Depth Pro avec prompt pre-construit (iterations) | **AUCUN** (dead code) |

### 1.2 Points d'appel `generatePass()` (ligne 981)

| Ligne | Contexte | Pass | Flux autorise ? |
|---|---|---|---|
| 1413 | Passe 1 standard (surfaces) | 1 | OUI — garde `pass !== 2` ligne 1005 autorise |
| 1490 | Passe 2 standard (mobilier) | 2 | NON — garde `pass !== 2` ligne 1005 bloque |

### 1.3 Points d'appel `generateIterationPass()` (ligne 956)

| Ligne | Contexte | Flux autorise ? |
|---|---|---|
| 1240 | Iteration (adjust ou restyle) | NON — fonction utilise OpenAI uniquement, echec propre si erreur |

### 1.4 Instances `new Replicate()` / `replicate.run()`

| Ligne | Fonction | Contexte |
|---|---|---|
| 779 | `tryFluxDepth()` | Pipeline standard — protege par garde dans `generatePass()` |
| 911 | `tryFluxDepthWithPrompt()` | **DEAD CODE** — jamais appelee |

### 1.5 References `REPLICATE_API_TOKEN`

| Fichier | Ligne | Contexte |
|---|---|---|
| `route.ts` | 779 | `tryFluxDepth()` — init client |
| `route.ts` | 911 | `tryFluxDepthWithPrompt()` — DEAD CODE |
| `route.ts` | 1005 | Garde dans `generatePass()` — verifie si cle existe avant tentative |
| `route.ts` | 1014 | Message erreur si aucune cle API configuree |
| `app/api/health/route.ts` | 51 | Health check — non problematique |

---

## 2. Verdict par chemin

| Chemin | Statut | Justification |
|---|---|---|
| Passe 1 standard → `generatePass(pass=1)` → `tryFluxDepth()` | AUTORISE | Flux en fallback pour surfaces uniquement — conforme CLAUDE.md |
| Passe 2 standard → `generatePass(pass=2)` | BLOQUE | Garde `pass !== 2` ligne 1005 — Flux jamais appele |
| Iteration → `generateIterationPass()` | BLOQUE | Fonction n'appelle que `tryOpenAIResponsesWithPrompt()`, echec propre |
| Appel direct `tryFluxDepth(pass=2)` | RISQUE | Pas de garde interne dans la fonction — repose sur l'appelant |
| Appel direct `tryFluxDepthWithPrompt()` | DEAD CODE | Jamais appelee depuis le fix |

---

## 3. Problemes identifies et corrections

### P1 — DEAD CODE : `tryFluxDepthWithPrompt()` toujours presente (RISQUE MOYEN)

**Constat** : La fonction `tryFluxDepthWithPrompt()` (lignes 905-953) est entierement fonctionnelle mais n'est plus jamais appelee. Elle reste importee, compile sans erreur, et pourrait etre re-invoquee par accident lors d'un futur refactoring.

**Correction** : Ne pas supprimer la fonction (risque de regression si un futur developpeur la recree sans les gardes). Ajouter un commentaire d'avertissement explicite et un guard throw en tete de fonction.

**Statut** : CORRIGE — voir ci-dessous.

### P2 — DEAD CODE : Builders Flux iteration dans `lib/iteration-prompt.ts` (RISQUE FAIBLE)

**Constat** : Les fonctions suivantes sont exportees et appellees dans route.ts (lignes 1220, 1230, 1195, 1205) mais leurs valeurs de retour sont stockees dans `fluxPrompt` qui est passe a `generateIterationPass()` comme `_fluxPrompt` (parametre unused) :
- `buildIterationFurnitureFluxPrompt()`
- `buildIterationOutdoorFurnitureFluxPrompt()`
- `buildAdjustFluxPrompt()`
- `buildAdjustOutdoorFluxPrompt()`

Ces fonctions executent du code (string concatenation) pour un resultat qui n'est jamais utilise. Ce n'est pas un bug de securite mais du gaspillage CPU et une source de confusion.

**Correction** : Remplacer les appels par des chaines vides dans route.ts.

**Statut** : CORRIGE — voir ci-dessous.

### P3 — DEFENSE EN PROFONDEUR : `tryFluxDepth()` n'a pas de garde interne pour pass=2 (RISQUE FAIBLE)

**Constat** : La fonction `tryFluxDepth()` accepte `pass: 1 | 2` et construit des prompts pour les deux passes. La protection vient uniquement de `generatePass()` qui verifie `pass !== 2` avant d'appeler. Si quelqu'un appelle `tryFluxDepth()` directement avec pass=2, ca fonctionnerait.

**Correction** : Ajouter un guard throw en debut de fonction pour pass=2.

**Statut** : CORRIGE — voir ci-dessous.

### P4 — Import inutile de `Replicate` dans le top-level (RISQUE NUL)

**Constat** : `import Replicate from "replicate"` est au top-level (ligne 12). Le SDK est utilise uniquement dans `tryFluxDepth()` et `tryFluxDepthWithPrompt()`. Si `tryFluxDepthWithPrompt` est dead code, l'import reste necessaire pour `tryFluxDepth()` (passe 1 standard).

**Statut** : PAS DE CORRECTION NECESSAIRE.

---

## 4. Aucun chemin cache supplementaire

- **Aucun autre fichier `.ts` n'appelle `replicate.run()`** en dehors de `route.ts`.
- **`lib/outdoor-subtypes.ts`** et **`lib/room-types.ts`** mentionnent "flux" uniquement dans des noms de prompts/commentaires, pas d'appels API.
- **`scripts/seed-blog.ts`** mentionne "Flux" dans du contenu texte de blog, pas d'appel API.
- **`app/api/health/route.ts`** verifie l'existence de la cle API mais ne fait aucun appel Replicate.

---

## 5. Resume des corrections appliquees

| # | Correction | Fichier | Severite |
|---|---|---|---|
| P1 | Guard throw dans `tryFluxDepthWithPrompt()` + commentaire WARNING | `route.ts` | MOYENNE |
| P2 | Remplacement appels builders Flux par chaines vides dans le flow iteration | `route.ts` | FAIBLE |
| P3 | Guard throw dans `tryFluxDepth()` si pass === 2 | `route.ts` | FAIBLE |

---

## 6. Recommandation finale

Le fix applique a `generateIterationPass()` est **correct et suffisant** pour empecher le bug #81 de se reproduire. Les corrections P1, P2, P3 ajoutent de la defense en profondeur :

- **Couche 1** (existante) : `generateIterationPass()` n'appelle que OpenAI
- **Couche 2** (existante) : `generatePass()` bloque Flux pour pass=2
- **Couche 3** (ajoutee) : `tryFluxDepth()` refuse pass=2 en interne
- **Couche 4** (ajoutee) : `tryFluxDepthWithPrompt()` throw un avertissement si appelee

Avec ces 4 couches, il est physiquement impossible que Flux soit utilise pour une iteration ou une passe 2, quel que soit le chemin d'appel.
