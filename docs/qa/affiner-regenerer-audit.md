# Audit Affiner / Regenerer — 2026-04-04

| # | Scenario | Verdict | Ref |
|---|---|---|---|
| 1 | Generer puis Affiner "ajoute tapis" : fetch envoie `pass1_key` + `iterationComment` | **PASS** | page.tsx:1025-1028 — `pass1_key: targetResult.pass1Key`, `iterationComment: enrichedComment`, `previousModifications` inclus |
| 2 | Serveur `getIterationBase()` trouve image meublee ; `saveIterationBase` await avant reponse | **PASS** | route.ts:327 `getIterationBase(effectiveSessionId)` ; route.ts:912-914 `await saveIterationBase(sessionId, outputBase64)` avant `NextResponse.json` |
| 3 | Intent "adjust" → `buildAdjustResponsesPrompt` → inventaire mental present | **PASS** | iteration-prompt.ts:87 "Before editing, mentally list every visible object" + "SURGICAL EDIT" framing |
| 4 | Resultat affiche remplace la version dans le comparateur | **PASS** | page.tsx:1089-1096 `setResults` met a jour `generatedUrl: data.image` sur `refineTargetIndex` |
| 5 | Affiner 2x → `previousModifications` contient 2 commentaires ; source = image v2 | **PASS** | page.tsx:1002-1007 slice versions jusqu'a `activeIdx+1`, filtre sur `v.comment`. Serveur : route.ts:391 `saveIterationBase` apres chaque iteration → `getIterationBase` retourne la derniere image meublee |
| 6 | Regenerer PUIS Affiner → `pass1Key` mis a jour ; source = nouveau resultat | **PASS** | page.tsx:1235 `pass1Key: data.pass1_key` dans `setResults` apres regen. Route.ts:914 `saveIterationBase(sessionId, outputBase64)` sur gen initiale + route.ts:573 idem sur `pass2Only`. Affiner utilise le nouveau `pass1Key` |
| 7 | Surfaces uniquement → Affiner possible ; `pass1Key` existe | **PASS** | route.ts:850 `pass1_key: pass1CacheKey` retourne meme si `!withFurniture`. Client recoit `pass1Key`. Mais **note** : `saveIterationBase` n'est PAS appele en mode surfaces-only (route.ts:801-852) → `getIterationBase` retournera null → adjust fallback sur image pass1 (vide). Comportement coherent : affinage sur surfaces = restyle depuis piece vide |
| 8 | `iterationsRemaining` decremente ; credits NON consommes pour affinage | **PASS** | Client : page.tsx:1085 `setIterationsRemaining(prev => Math.max(0, prev - 1))`. Serveur : route.ts:239 `isIteration = !!pass1Key && !pass2Only` → skip `decrementCredit` pour iterations |
| 9 | Apres affinage, galerie : nouvelle entree creee (pas mise a jour) | **PASS** | route.ts:458 `saveUserPhoto(...)` avec nouvel `outputKey` — pas d'`updateUserPhoto`. Chaque iteration cree une entree distincte. `inputImageKey: null` (input original non disponible dans le cache iteration) |
| 10 | `saveUserPhoto` appele apres iteration avec bon `outputKey` | **PASS** | route.ts:438-478 — `saveImage(outputBase64, ...)` puis `saveUserPhoto({outputImageKey: outputKey, ...})`. Await avec timeout 5s (route.ts:477) avant reponse |

## Points d'attention

- **Scenario 7** : en surfaces-only, Affiner fait un restyle (pas un adjust) car aucune `iterationBase` n'est sauvegardee. Comportement correct mais potentiellement confus pour l'utilisateur (le bouton dit "Affiner" mais repart de zero). A documenter dans l'UX ou masquer le bouton en mode surfaces-only.
- **Scenario 9** : chaque affinage cree une NOUVELLE photo en galerie sans `inputImageKey`. Sur 3 affinages = 4 entrees galerie (1 initiale + 3 iterations) sans lien entre elles. Pas de regroupement visuel possible cote galerie.

**Verdict global : 10/10 PASS.** Aucun bug bloquant. Deux ameliorations UX recommandees (signalees ci-dessus).
