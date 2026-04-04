# Audit — Fix pass2 display (commit f42c65d)

Date : 2026-04-04

## Contexte

Le fix remplace le matching par `imageUrl` (race condition) par un matching via `pass1Key` dans les `.then()` de passe 2. Deux sites concernes : `handleGenerate` (batch) et `handleRegenerate`.

---

## Scenario 1 — Closure stale sur `results` dans handleGenerate

**Fichier** : `app/page.tsx`, ligne 782
**Code** : `const resultIndex = results.findIndex((r) => r.pass1Key === p2Pass1Key);`

`handleGenerate` est un `useCallback` dont les dependances (ligne 894) N'INCLUENT PAS `results`. La variable `results` capturee dans la closure est celle au moment de la creation du callback -- typiquement `[]` (tableau vide). Quand le `.then()` de passe 2 s'execute 30-60s plus tard, `results.findIndex()` cherche dans ce tableau vide et retourne systematiquement `-1`.

**Consequence** : `setVersions` ne met jamais a jour l'entree versions pour cette image. Le tableau `versions[index]` conserve l'URL passe 1 (surfaces).

**Impact reel** : ATTENUE. La ligne 767 (`setResults` avec callback `prev =>`) met correctement a jour `result.generatedUrl` avec l'image meublee. Puisque `displayUrl` (ligne 2320-2321) utilise `resultVersions[activeIdx]?.imageUrl || result.generatedUrl`, le fallback `result.generatedUrl` prend le relais. L'image meublee S'AFFICHE, mais les `versions` sont desynchronisees (contiennent encore l'URL passe 1).

**Verdict** : **FAIL** — bug reel. Le fix corrige la race condition sur imageUrl mais introduit un bug de stale closure. Le comparateur affiche le bon resultat grace au fallback, mais `versions` est incoherent. Cela causera des problemes si l'utilisateur itere (refine) immediatement apres : les versions pointeront vers passe 1 au lieu de passe 2.

**Fix recommande** : remplacer `results.findIndex(...)` par un pattern `setResults` + callback, ou utiliser un `useRef` pour `results`, ou ajouter `results` aux dependances du useCallback (avec les re-renders que cela implique). Alternative plus simple : utiliser `setVersions` avec un pattern identique a `setResults` en matchant par `pass1Key` dans le `prev`.

---

## Scenario 2 — handleRegenerate .then() utilise index direct

**Fichier** : `app/page.tsx`, lignes 1281-1286
**Code** : `setVersions((prev) => prev.map((entries, i) => { if (i === index) ... }))`

`handleRegenerate` a `results` dans ses dependances (ligne 1339). L'`index` est un parametre de la fonction, stable pendant toute l'execution. Le `setVersions` utilise le pattern callback (`prev =>`), donc pas de stale closure.

**Verdict** : **PASS** — aucune race condition.

---

## Scenario 3 — displayUrl affiche-t-il le meuble (passe 2) ?

**Fichier** : `app/page.tsx`, lignes 2320-2321
**Code** : `const displayUrl = resultVersions[activeIdx]?.imageUrl || result.generatedUrl;`

Deux cas :
- **handleRegenerate** : `versions[index]` est mis a jour correctement (scenario 2 PASS). `displayUrl` = image meublee. **PASS**.
- **handleGenerate** : `versions[index]` N'EST PAS mis a jour (scenario 1 FAIL). Mais `result.generatedUrl` est mis a jour via `setResults` ligne 767. Le fallback `|| result.generatedUrl` affiche l'image meublee. **PASS** (par fallback, pas par le fix).

**Verdict** : **PASS** — l'image meublee s'affiche dans les deux cas, mais pour des raisons differentes.

---

## Scenario 4 — Flow complet generation batch

1. Generation lancee -> `isGenerating = true` -> section loading visible
2. Passe 1 termine -> `partialResult` ajoute a `results` avec `pass2Pending: true`
3. Loading block (ligne 2117-2148) affiche l'image passe 1 non-floutee avec "Surfaces terminees"
4. `isGenerating` reste `true` car `hasPendingPass2 = true` (ligne 864)
5. Passe 2 termine -> `setResults` met a jour `generatedUrl` + `pass2Pending: false` (ligne 762-779)
6. `isGenerating` passe a `false` (ligne 775-777) -> section loading disparait, section resultats apparait
7. `displayUrl` = image meublee (via fallback `result.generatedUrl`)

**Verdict** : **PASS** — le flow fonctionne. L'utilisateur voit surfaces pendant le chargement, puis le meuble dans les resultats.

---

## Scenario 5 — Regression potentielle sur iterations post-generation

Apres le fix, si l'utilisateur clique "Affiner" immediatement :
- `versions[index]` contient encore `[{ imageUrl: <passe1_url> }]` (scenario 1)
- `result.generatedUrl` contient l'URL meublee (correct)
- Le composant d'iteration utilise `result.generatedUrl` comme source ? A verifier.

**Verdict** : **WARN** — pas de regression immediate visible, mais `versions` desynchronise est une bombe a retardement.

---

## Resume

| # | Scenario | Verdict |
|---|---|---|
| 1 | Closure stale `results` dans handleGenerate setVersions | **FAIL** |
| 2 | handleRegenerate .then() avec index direct | **PASS** |
| 3 | displayUrl affiche le meuble | **PASS** (par fallback) |
| 4 | Flow complet generation -> passe1 -> passe2 -> comparateur | **PASS** |
| 5 | Regression iterations post-generation | **WARN** |

## Verdict global : FAIL (1 bug, 1 warning)

Le fix resout la race condition originale sur `imageUrl` mais introduit un bug de stale closure sur `results` dans `handleGenerate`. L'impact est masque par le fallback `result.generatedUrl` dans `displayUrl`, donc l'utilisateur voit le bon resultat. Cependant `versions` reste desynchronise, ce qui peut causer des problemes sur les iterations et le suivi de versions.

**Action requise pour @fullstack** : ligne 781-787, remplacer `results.findIndex(...)` par un pattern qui ne depend pas de la closure `results`. Proposition :

```typescript
setVersions((prev) => {
  // Find index by checking results via setResults trick or use a ref
  const idx = prev.findIndex((entries, i) => {
    // We can't access results here — need another approach
  });
});
```

Meilleure approche : stocker `resultIndex` au moment de l'ajout du `partialResult` dans `setResults` (ligne 729), puis l'utiliser dans le `.then()`. Ou utiliser `setResults` pour recuperer l'index en meme temps que la mise a jour, et enchainer `setVersions` dans le meme callback.
