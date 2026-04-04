# Audit bouton "Regenerer" — 2026-04-04

Source : `app/page.tsx` handleRegenerate (L1124-1340), `app/api/generate/route.ts`, `lib/generation-pipeline.ts`

| # | Scenario | Verdict | Ref |
|---|---|---|---|
| 1 | Fetch envoie l'image ORIGINALE (result.originalUrl converti en base64) | **PASS** | page.tsx L1159 : `imageDataUri = result.originalUrl`, conversion blob->base64 L1160-1176 |
| 2 | splitMode: true — passe 1 retournee, passe 2 en background | **PASS** | page.tsx L1210 : `splitMode: true`. L1227 : si `data.pendingPass2 && data.pass1_key`, affiche passe 1 puis lance passe 2 via fetch pass2Only (L1256-1303) |
| 3 | Resultat REMPLACE l'ancien dans results[index] | **PASS** | page.tsx L1229-1240 (splitMode) et L1306-1317 (non-split) : `updated[index] = { ...result, generatedUrl: data.image }` |
| 4 | resolveChooseOne randomise le furniturePrompt | **PASS** | generation-pipeline.ts L262-268 : regex `(choose one: X, Y)` -> pick aleatoire. Appele L273 dans buildFurnitureResponsesPrompt. En plus, selectVariant (route.ts L218-225) peut substituer un furniturePrompt entier selon hash image + styleId |
| 5 | Regenerer 2x -> resultats DIFFERENTS | **PASS (partiel)** | resolveChooseOne (L262) + selectVariant (L222) garantissent de la variete. MAIS selectVariant utilise un hash SHA256 de l'image (L221) : meme image = meme hash = meme variant. La variete vient UNIQUEMENT de resolveChooseOne (aleatoire). Si le prompt n'a pas de clause `(choose one:...)`, deux regenerations sur la meme image + meme style peuvent produire des prompts identiques cote serveur. La variete repose alors sur le modele IA seul. |
| 6 | Affiner PUIS Regenerer -> repart de l'image originale | **PASS** | page.tsx L1159 : utilise `result.originalUrl`, pas `result.generatedUrl` ni la version active. L'image affinee est dans versions[], pas dans originalUrl |
| 7 | versions[] reset pour cet index | **PASS** | page.tsx L1243-1252 (splitMode) et L1318-1327 (non-split) : `updated[index] = [{ imageUrl: data.image, ... }]` + activeVersions reset a 0. En splitMode, second reset a passe 2 finale (L1282-1287) |
| 8 | 1 credit consomme par regeneration | **PASS** | page.tsx L1131 : `setUserCredits(prev => prev !== null ? Math.max(0, prev - 1) : prev)` cote client. route.ts L240-241 : `decrementCredit(session.user.id)` cote serveur. pass2Only exempte (L238-240) donc pas de double debit |
| 9 | saveUserPhoto appelee — nouvelle entree ou mise a jour ? | **PASS — nouvelle entree** | En splitMode, saveUserPhoto est appelee dans le flow pass2Only (route.ts L590) avec INSERT (user-photos.ts L80-85). C'est un INSERT, pas un UPSERT : chaque regeneration cree une NOUVELLE entree en galerie. L'ancienne entree reste (pas de suppression). **Bug potentiel** : la galerie accumule des doublons visuels pour la meme image source. |
| 10 | saveIterationBase appelee avec le nouveau resultat | **PASS** | En splitMode, saveIterationBase est appelee dans pass2Only (route.ts L573) avec `p2OutputBase64` (resultat meuble). En non-split, route.ts L914 avec `outputBase64`. L'affinage futur partira bien du nouveau resultat regenere. |

## Bugs identifies

**BUG-1 (MOYENNE)** — Galerie : doublons apres regeneration. saveUserPhoto fait un INSERT a chaque appel. Regenerer N fois = N entrees en galerie pour la meme image source, sans suppression de l'ancienne. Pas de lien entre l'entree precedente et la nouvelle.
- Fichier : `lib/user-photos.ts` L80-85, `app/api/generate/route.ts` L590
- Fix propose : soit supprimer l'ancienne entree (DELETE WHERE id = photoId precedent), soit UPSERT sur (userId, inputImageKey, styleId)

**BUG-2 (BASSE)** — Variete limitee si pas de `(choose one:...)`. selectVariant est deterministe (hash image). Deux regenerations consecutives sur la meme image + meme style produisent le meme variant. Seul resolveChooseOne apporte de l'aleatoire, et uniquement si le prompt contient des clauses alternatives.
- Fichier : `app/api/generate/route.ts` L218-225
- Fix propose : injecter un salt aleatoire dans le hash (ex: `Date.now()`) ou ajouter un parametre `regenerationSeed`

**BUG-3 (BASSE)** — pass2Only inputImageKey null. Dans le flow pass2Only (route.ts L592), `inputImageKey: null` car l'image originale n'est pas dans le cache pass1. La galerie n'aura pas l'image input pour les photos regenerees via splitMode.
- Fichier : `app/api/generate/route.ts` L592
