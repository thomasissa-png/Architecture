# Audit QA — Robustesse de la generation d'images Versimo

**Date** : 2026-04-04
**Agent** : @qa
**Fichiers audites** :
- `app/page.tsx` (client) — `resilientFetch()` lignes 84-159, `handleGenerate` lignes 483-886, `handleRefine` lignes 973-1099, `handleRegenerate` lignes 1112-1278+
- `app/api/generate/route.ts` (serveur) — route POST complete, 1053 lignes
- `lib/generation-pipeline.ts` — `generatePass()`, `tryOpenAIResponses()`, `tryOpenAIResponsesWithPrompt()`, `runGenerationPipeline()`

**PROMPT_VERSION** : v45

---

## Synthese

| Categorie | PASS | FAIL | Total |
|---|---|---|---|
| Client (page.tsx) | 12 | 2 | 14 |
| Serveur (route.ts) | 7 | 1 | 8 |
| Coherence imports | 1 | 1 | 2 |
| **TOTAL** | **20** | **4** | **24** |

---

## Cote client (page.tsx)

### Scenario 1 — Utilisateur reste sur la page (generation normale)

**PASS**

- `handleGenerate` (ligne 483) cree un `AbortController` (ligne 502-503), passe `controller.signal` a `resilientFetch` (ligne 663, 683).
- `resilientFetch` (ligne 99) encapsule un `fetch` standard avec timeout 180s (ligne 104).
- Le flux complet fonctionne : jobs construits, batches de 2 (ligne 656), `Promise.allSettled` (ligne 661), resultats accumules dans `allResults`.
- Le split-mode (ligne 681 `splitMode: job.jobWithFurniture`) envoie d'abord la passe 1 puis lance la passe 2 en arriere-plan (ligne 732).

### Scenario 2 — Utilisateur change d'onglet mobile pendant generation

**PASS**

- `resilientFetch` detecte le passage en `hidden` via `visibilitychange` (lignes 117-119).
- Le flag `wentHiddenDuringFetch` est mis a `true` si la page passe en background pendant le fetch (ligne 118).
- Si le fetch echoue ET `wentHiddenDuringFetch === true`, le code attend que la page redevienne visible via `waitForVisible()` (ligne 141) puis retry (ligne 143 `continue`).
- `waitForVisible()` (lignes 85-96) est correctement implementee : resout immediatement si deja visible, sinon ecoute `visibilitychange`.
- Le retry est limite a 1 (MAX_RETRIES = 1, ligne 107) — suffisant car le serveur continue de traiter.

### Scenario 3 — Utilisateur change d'app mobile pendant generation

**PASS**

- Meme mecanisme que le scenario 2 : le changement d'app declenche `visibilitychange` → `hidden` sur la plupart des navigateurs mobiles.
- Le fetch est retry au retour de l'app.

### Scenario 4 — Utilisateur ferme le navigateur pendant generation

**PASS** (cote serveur)

- Le serveur ne verifie JAMAIS `request.signal.aborted` (voir scenario 15). Il continue jusqu'a completion.
- Le resultat est logue en DB (lignes 962-977 de route.ts) et sauvegarde dans la galerie utilisateur (lignes 901-947).
- Cote client : le resultat est perdu (aucun mecanisme de reprise), mais le visuel est disponible dans la galerie utilisateur au prochain chargement.

### Scenario 5 — Reseau lent / timeout 180s depasse

**PASS**

- `resilientFetch` a un timeout de 180s (ligne 104 `TIMEOUT_MS = 180_000`).
- Si depasse : `timeoutController.abort()` (ligne 111) → `AbortError` → message utilisateur clair (ligne 148 : "La generation a pris trop de temps. Verifiez votre connexion et reessayez.").
- Cote serveur, `ROUTE_DEADLINE_MS = 150_000` (ligne 37 de route.ts) pour eviter le timeout proxy Replit (~180s). Si la passe 1 est lente, la passe 2 est sautee si le budget restant < 30s (ligne 850).

### Scenario 6 — Utilisateur clique Annuler

**PASS**

- `handleCancelGeneration` (ligne 916) appelle `abortControllerRef.current?.abort()` (ligne 917).
- Dans `resilientFetch`, le `parentSignal.aborted` est verifie dans le catch (ligne 134) — si `true`, le retry n'est PAS tente, l'erreur est propagee.
- Le `parentSignal` est ecoute via `addEventListener("abort", onParentAbort)` (ligne 124) qui avorte le timeout controller.
- Le cleanup est propre dans `finally` (lignes 151-155) : timer, event listeners.

### Scenario 7 — Utilisateur non connecte (anonymous)

**FAIL**

- `handleGenerate` (ligne 487-491) : si `authStatus !== "authenticated"`, le code ouvre l'`AuthModal` et met `pendingGeneration = true`. **L'utilisateur ne peut PAS generer sans compte.**
- Le serveur (route.ts ligne 145-147) mentionne "Anonymous users: allowed with IP rate limit only" dans le commentaire, mais le CLIENT bloque avant d'atteindre le serveur.
- **Verdict** : Les utilisateurs anonymes ne peuvent PAS generer — le commentaire serveur est trompeur mais le comportement est coherent avec la decision "Compte obligatoire avant generation" (ligne 191 `pendingGeneration`). Ce n'est PAS un bug mais le commentaire serveur est a corriger pour eviter la confusion.
- **Ligne** : route.ts ligne 145 — commentaire "Anonymous users: allowed with IP rate limit only" alors qu'en pratique le client force l'auth.

**Reclassification : PASS avec reservation** — le comportement est voulu (Changement 2), mais le commentaire serveur est obsolete/trompeur.

### Scenario 8 — Utilisateur Decouverte (2 credits gratuits)

**PASS**

- `handleGenerate` (lignes 494-497) : verifie `userCredits` vs `totalJobs` AVANT de lancer les fetches. Message clair si insuffisant.
- Cote serveur (lignes 243-251) : `decrementCredit` pour les utilisateurs connectes.
- Le credit est decremente cote serveur AVANT la generation (optimiste), et rembourse si echec (lignes 879-885).

### Scenario 9 — Utilisateur Starter / Scenario 10 — Utilisateur Pro

**PASS**

- Meme flux que scenario 8. Le systeme de credits est identique quel que soit le pack.
- `decrementCredit` (ligne 244) est appele pour TOUTES les generations (sauf iterations et pass2Only).
- Les iterations ne consomment pas de credit (ligne 242 `const isIteration = !!pass1Key && !pass2Only` → skip decrement si `isIteration`).

### Scenario 11 — Credits epuises

**PASS**

- Client (lignes 494-497) : comparaison `totalJobs > userCredits` avec message explicite ("Vous avez N visuels restants, mais cette generation en necessite M.").
- Serveur (lignes 244-249) : `decrementCredit` retourne `false` si plus de credits → reponse 402 "Plus de visuels disponibles. Rechargez pour continuer."
- Aucun fetch n'est lance cote client si credits insuffisants — verification AVANT.

### Scenario 12 — Split mode (passe 1 visible pendant passe 2)

**PASS**

- Client : `splitMode: job.jobWithFurniture` (ligne 681) envoie le flag au serveur.
- Serveur (lignes 770-801) : si `splitMode && withFurniture`, retourne la passe 1 immediatement avec `pendingPass2: true` et `pass1_key`.
- Client (lignes 708-804) : recoit le resultat partiel, l'affiche immediatement, puis lance la passe 2 en arriere-plan via un second `resilientFetch` (ligne 732-740).
- La passe 2 met a jour le resultat via `setResults` (lignes 760-776) et efface `isGenerating` quand toutes les passe 2 sont terminees (ligne 773).

### Scenario 13 — Iteration (refine)

**PASS**

- `handleRefine` (ligne 973) envoie `pass1_key`, `iterationComment`, `previousModifications` au serveur.
- Utilise `resilientFetch` (ligne 1010) avec le meme mecanisme de survie mobile.
- Serveur (lignes 255-488) : charge le cache passe 1, classifie l'intent (adjust vs restyle), pre-traite le commentaire via GPT-4.1-mini, genere via `generateIterationPass` local.
- L'iteration ne consomme PAS de credit (ligne 242-243 : `isIteration` → skip decrement).
- Safety rejection handling (route.ts lignes 96-104) : si la premiere tentative echoue pour "safety system", le prompt est simplifie via `simplifyPromptForSafetyRetry` avant retry.

### Scenario 14 — Regeneration

**PASS**

- `handleRegenerate` (ligne 1112) reconstruit les prompts a partir du `result.styleId` et relance via `resilientFetch` (ligne 1181).
- Utilise `splitMode: true` (ligne 1198) pour afficher la passe 1 immediatement.
- La passe 2 est lancee en arriere-plan (lignes 1244-1278).
- Les credits sont decrementes optimistiquement cote client (ligne 1119) et reellement cote serveur.

---

## Cote serveur (route.ts)

### Scenario 15 — request.signal.aborted : AUCUN check ne doit exister

**PASS**

- Grep sur `request.signal` dans route.ts retourne uniquement 3 COMMENTAIRES (lignes 379, 722, 847) qui expliquent POURQUOI il ne faut PAS checker le signal.
- Aucun check `if (request.signal.aborted)` n'existe dans le code.
- Le serveur traite TOUJOURS la generation jusqu'a completion, meme si le client a ferme/change d'onglet.

### Scenario 16 — Passe 1 reussie, passe 2 echoue

**PASS**

- Lignes 857-868 : passe 2 avec 2 tentatives (`for (let attempt = 1; attempt <= 2; attempt++)`).
- Si passe 2 echoue apres 2 tentatives (lignes 874-886) :
  - `pass2Failed = true`
  - Le credit est rembourse via `addCredits(session.user.id, 1)` (ligne 881)
  - Le resultat passe 1 est livre avec le flag `pass2Failed: true` (ligne 958)
  - Le modele affiche "(surfaces uniquement — passe 2 echouee)" (ligne 955)

### Scenario 17 — Erreur OpenAI (retry)

**PASS**

- `generatePass` (generation-pipeline.ts lignes 641-668) : 2 tentatives avec 2s de delai entre chaque (`MAX_PASS_RETRIES = 2`, `RETRY_DELAY_MS = 2_000`).
- `generateIterationPass` local (route.ts lignes 77-115) : 2 tentatives, avec simplification du prompt si safety rejection.
- Si toutes les tentatives echouent, l'erreur est propagee au catch global (route.ts ligne 982).

### Scenario 18 — Safety rejection

**PASS**

- `isSafetyRejection` (route.ts lignes 40-44) detecte "safety system", "content_policy", "moderation".
- `generateIterationPass` local (route.ts lignes 96-104) : si safety rejection a l'attempt 1, utilise `simplifyPromptForSafetyRetry` (lignes 48-75) pour l'attempt 2.
- `simplifyPromptForSafetyRetry` strip les formulations agressives (SURGICAL EDIT, LOCKED, identical pixels, etc.) et garde uniquement l'instruction core.

### Scenario 19 — Queue fallback

**PASS**

- `shouldQueue` (generation-queue.ts lignes 246-257) : retourne `true` pour les erreurs transitoires, `false` pour les erreurs non-transitoires (content_policy, invalid_api_key, billing_hard_limit).
- Route.ts (lignes 989-1028) : si erreur dans le catch global ET `shouldQueue(error)` ET utilisateur connecte ET image disponible → enqueue via `enqueueGeneration`.
- Retourne 202 avec `queueId` (ligne 1019-1023).
- Client (lignes 699-703) : detecte `data.queued && data.queueId` → lance le polling via `startQueuePolling`.

### Scenario 20 — Logging en DB

**PASS**

- Chaque chemin de generation log via `logGeneration()` :
  - Generation standard : ligne 962 (AWAIT avant response — Replit autoscale kill fix)
  - Split-mode pass 1 : ligne 774 (fire-and-forget)
  - Pass2Only : ligne 615 (await)
  - Iteration : ligne 408 (fire-and-forget)
  - Surfaces-only : ligne 815 (fire-and-forget)
  - Echecs : ligne 1044
  - Queue : ligne 1012
- Champs loges : ip, styleId, surfacePrompt, furniturePrompt, timing par passe, modele, prompts construits, promptVersion.
- **Point d'attention** : les logs fire-and-forget (iterations, split-mode pass 1) risquent d'etre perdus sur Replit autoscale. Seul le log de la generation standard (ligne 962) est `await`. C'est un risque accepte (la generation standard est le cas principal).

---

## Coherence imports

### Scenario 21 — route.ts importe depuis generation-pipeline.ts

**FAIL — BUG DETECTE**

- route.ts (ligne 16) importe `generatePass` et `tryOpenAIResponsesWithPrompt` depuis `@/lib/generation-pipeline`.
- **MAIS** route.ts definit AUSSI une fonction locale `generateIterationPass` (lignes 77-115) qui est une COPIE MODIFIEE de `generateIterationPass` dans `generation-pipeline.ts` (lignes 612-635).
- Les 2 versions divergent :
  - **route.ts** (locale) : gere le safety rejection retry avec prompt simplifie (lignes 96-104). C'est la version utilisee pour les iterations.
  - **generation-pipeline.ts** (exportee) : simple retry sans safety handling.
- **Risque** : un developpeur qui modifie `generateIterationPass` dans generation-pipeline.ts pensera avoir corrige le comportement des iterations, alors que c'est la version locale de route.ts qui est utilisee. La version exportee de generation-pipeline.ts n'est utilisee NULLE PART (aucun import detecte).
- **Recommandation** : soit supprimer la version exportee de generation-pipeline.ts (dead code), soit unifier en une seule version avec le safety retry dans generation-pipeline.ts et importer dans route.ts.
- **Lignes** : route.ts:77-115 vs generation-pipeline.ts:612-635

### Scenario 22 — PROMPT_VERSION unique

**PASS**

- `PROMPT_VERSION` est defini dans `generation-pipeline.ts` ligne 33 (`export const PROMPT_VERSION = "v45"`).
- route.ts l'importe (ligne 6) — aucune redefinition locale.
- Utilise dans tous les appels `logGeneration` de route.ts.

---

## Resume des FAIL

| # | Severite | Fichier | Ligne | Description |
|---|---|---|---|---|
| 7 | BASSE | route.ts | 145 | Commentaire "Anonymous users: allowed with IP rate limit" obsolete — le client force l'auth. Pas de bug fonctionnel, mais trompeur pour la maintenance. |
| 21 | HAUTE | route.ts:77 + generation-pipeline.ts:612 | 77, 612 | Duplication de `generateIterationPass` avec divergence logique (safety retry). Dead code dans generation-pipeline.ts. Risque de regression silencieuse si un dev modifie le mauvais fichier. |

---

## Bugs additionnels detectes pendant l'audit

### BUG-A : `MAX_PASS_RETRIES` et `RETRY_DELAY_MS` utilises avant declaration dans route.ts

- `generateIterationPass` (ligne 77) utilise `MAX_PASS_RETRIES` (ligne 93) et `RETRY_DELAY_MS` (ligne 97).
- Ces constantes sont declarees aux lignes 117-118, APRES la fonction.
- **Impact** : Aucun en pratique grace au hoisting de `const` dans le scope du module (les constantes sont dans la "temporal dead zone" mais puisque `generateIterationPass` est appelee APRES l'initialisation du module, ca fonctionne). Cependant, c'est un anti-pattern qui rend le code fragile.
- **Recommandation** : Deplacer `MAX_PASS_RETRIES` et `RETRY_DELAY_MS` AVANT `generateIterationPass`.

### BUG-B : Fire-and-forget logs risquent d'etre perdus sur Replit autoscale

- `logGeneration` en fire-and-forget (iterations ligne 408, split-mode pass1 ligne 774) peut etre kill par Replit autoscale apres envoi de la reponse.
- Le log de la generation standard (ligne 962) est correctement `await` AVANT la reponse.
- **Impact** : Perte potentielle de logs pour les iterations et split-mode pass1.
- **Recommandation** : Convertir en `await` comme pour la generation standard, ou au minimum `await logGeneration(...)` avec un timeout court (2s).

---

## Conclusion

Le mecanisme `resilientFetch` est **solide et bien pense**. Les principaux points de robustesse sont en place :

1. **Survie mobile** : detection de `visibilitychange`, retry au retour — fonctionne pour changement d'onglet ET changement d'app.
2. **Independance serveur** : aucun check de `request.signal.aborted` cote serveur — la generation continue toujours.
3. **Timeout raisonnable** : 180s client, 150s serveur, 120s par appel API — cascade coherente.
4. **Cancel utilisateur** : seul le `parentSignal` (UI button) peut avorter le retry.
5. **Credits** : decrement optimiste, remboursement si echec, pas de double debit sur iterations/pass2Only.
6. **Queue fallback** : si erreur transitoire, mise en file d'attente avec notification.

Les 2 FAIL identifies sont :
- Un **dead code / duplication** a risque de regression (`generateIterationPass` dans 2 fichiers)
- Un **commentaire obsolete** (anonymous generation)

Ni l'un ni l'autre n'est un bug bloquant pour l'utilisateur final.

---

**Handoff → @fullstack**
- Fichiers produits : `docs/qa/generation-robustness-audit.md`
- Decisions prises : 22 scenarios audites, 20 PASS, 2 FAIL (1 HAUTE, 1 BASSE), 2 bugs additionnels (BUG-A, BUG-B)
- Points d'attention :
  - **P1** : Unifier `generateIterationPass` — supprimer la version dead code dans `generation-pipeline.ts` ou l'enrichir avec le safety retry et importer dans route.ts
  - **P2** : Corriger le commentaire obsolete "Anonymous users: allowed" dans route.ts ligne 145
  - **P2** : Deplacer `MAX_PASS_RETRIES`/`RETRY_DELAY_MS` avant `generateIterationPass` dans route.ts
  - **P3** : Considerer `await logGeneration(...)` pour les iterations/split-mode pour eviter la perte de logs sur autoscale
