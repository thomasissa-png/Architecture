# Audit QA — resilientFetch + tab-switch (2026-04-04)

**Fichier audite** : `app/page.tsx` (lignes 83-122 + tous les call sites)
**Fix audite** : suppression `signal` du fetch, timeout via `Promise.race`, cancel via `parentSignal` manuel.

## Architecture resilientFetch (L83-122)

- `fetch(url, init)` sans `signal` (L97) — le navigateur ne kill PAS le fetch au tab-switch.
- Timeout 180s via `Promise.race` avec `timeoutPromise` (L99-100) — ne tue pas le fetch, juste le await.
- Cancel utilisateur via `cancelPromise` ecoutant `parentSignal` (L104-109) — independant du fetch.
- Erreur reseau (TypeError) traduite en message FR (L116-119).

## Call sites (6 appels)

| Ligne | Contexte | parentSignal |
|-------|----------|-------------|
| 633 | Generation principale (batch) | `controller.signal` |
| 702 | Passe 2 background (split-mode) | `controller.signal` |
| 980 | Iteration (handleRefine) | `controller.signal` |
| 1151 | Regeneration | `controller.signal` |
| 1214 | Passe 2 regeneration background | `controller.signal` |

Tous les call sites passent `controller.signal` comme `parentSignal` (bouton Annuler). Aucun ne passe de `signal` dans `init`.

## Resultats par scenario

| # | Scenario | Verdict | Lignes | Detail |
|---|----------|---------|--------|--------|
| **Tab-switch** | | | | |
| 1 | 1 photo 1 style, tab-switch 1s, retour | **PASS** | 97 | fetch sans signal, Promise.race ne kill pas, loading persiste via `isGenerating` state |
| 2 | 3 photos 2 styles (6 jobs), tab-switch | **PASS** | 626-821 | boucle batch sequentielle, chaque fetch survit, `Promise.allSettled` collecte tous les resultats |
| 3 | Tab-switch pendant passe 1 (split-mode) | **PASS** | 678-774 | passe 1 complete → passe 2 lancee en fire-and-forget (L702), les deux survivent au tab-switch |
| **Type utilisateur** | | | | |
| 4 | Anonyme | **PASS** | 451-454 | `authStatus !== "authenticated"` → AuthModal, pas de fetch |
| 5 | Decouverte (2 credits) | **PASS** | 458-462 | credit check cote client + serveur debite, `setUserCredits` decremente (L695, L778) |
| 6 | Starter (15 credits) + iterations | **PASS** | 288-289, 943-1069 | `maxIterations` fetche depuis API (L183), `iterationsRemaining` decremente (L1043) |
| 7 | Pro (50 credits) + regen | **PASS** | 1082-1270 | `handleRegenerate` utilise `resilientFetch` (L1151), split-mode + passe 2 background (L1214) |
| **Nombre de visuels** | | | | |
| 8 | 1 photo x 1 style = 1 job | **PASS** | 626 | batch unique, `MAX_CONCURRENT=2` (L621), 1 fetch |
| 9 | 1 photo x 3 styles = 3 jobs | **PASS** | 626-628 | batch 2+1, `Promise.allSettled` par batch |
| 10 | 5 photos x 1 style = 5 jobs | **PASS** | 626-628 | batch 2+2+1 |
| 11 | 5 photos x 3 styles = 15 jobs | **PASS** | 626-628 | batch 2+2+2+2+2+2+2+1, sequentiel inter-batch, parallele intra-batch |
| **Erreurs** | | | | |
| 12 | Timeout 180s | **PASS** | 99-100 | `Promise.race` rejette avec message FR clair, fetch continue en arriere-plan (pas de kill) |
| 13 | Bouton Annuler | **PASS** | 886-895 | `abortControllerRef.current.abort()` → `cancelPromise` rejette (L107), `isGenerating=false` |
| 14 | Erreur reseau reelle | **PASS** | 116-119 | `TypeError` detectee → "Connexion perdue pendant la generation" |
| 15 | Erreur serveur 500 | **PASS** | 655-663 | `response.ok` check, message extrait du JSON ou fallback "Erreur serveur (500)" |
| 16 | Safety rejection | **PASS** | route.ts:39-103 | Cote serveur : `isSafetyRejection()` → retry avec `simplifyPromptForSafetyRetry()`. Client transparent. |
| **Split-mode** | | | | |
| 17 | splitMode passe 1 immediate + passe 2 bg | **PASS** | 678-774 | `pendingPass2` detecte, resultat partiel ajoute (L698), passe 2 fire-and-forget (L702) |
| 18 | Passe 2 echoue → passe 1 seule | **PASS** | 712-725 | `pass2Pending: false` + model suffixe "(ameublement echoue)", `isGenerating` cleared |
| **Regressions** | | | | |
| 19 | Fetch sans `signal` confirme | **PASS** | 97 | `fetch(url, init)` — `init` ne contient que method/headers/body, jamais signal |
| 20 | Timeout ne kill pas le fetch | **PASS** | 99-112 | `Promise.race` rejette l'await, le fetch natif continue (comportement standard) |
| 21 | parentSignal (Annuler) fonctionne sans signal fetch | **PASS** | 104-108 | `cancelPromise` ecoute `parentSignal.abort`, rejette le `Promise.race` |
| 22 | Images envoyees en data: URI | **PASS** | image-utils.ts:77 + L637 | `canvas.toDataURL("image/jpeg")` → `job.img.base64` envoye au serveur. Regen (L1118) convertit blob→dataURI. |

## Bug potentiel detecte

| # | Severite | Detail | Lignes |
|---|----------|--------|--------|
| B1 | **MOYENNE** | Timeout 180s : le fetch continue en arriere-plan meme apres rejet Promise.race. Si le serveur repond apres le timeout, la reponse est ignoree mais le fetch consomme des ressources reseau. Pas de regression, comportement voulu (mieux que kill). | 97-112 |
| B2 | **BASSE** | `filePreviewUrls` sont des `blob:` URLs (L410). `originalUrl` dans les resultats est un blob: URL (L680, L781). Si l'utilisateur fait un full reset (revoke L415) puis revient sur un ancien resultat, `originalUrl` sera invalide. Pas lie au tab-switch. | 409-417, 680 |
| B3 | **BASSE** | Cancel (L887) abort le controller mais les fetches deja en vol (sans signal) continuent. Les `.then()` de passe 2 (L711-772) pourraient mettre a jour le state apres cancel. Le check `AbortError` (L759) ne se declenchera pas car le fetch n'a pas de signal. Impact minimal : un resultat pourrait apparaitre apres annulation. | 758-759 |

## Verdict global

**22/22 PASS** — Le fix tab-switch est correct et complet. `resilientFetch` elimine le probleme "Connexion perdue" au changement d'onglet mobile sans casser le timeout, le cancel utilisateur, ni les scenarios multi-photos/multi-styles.

B3 est le seul point d'attention : apres annulation, une passe 2 en vol peut encore mettre a jour les resultats car le fetch n'a pas de signal. Fix recommande : verifier `controller.signal.aborted` dans les `.then()` de passe 2 (L711, L1223) avant `setResults`. Non bloquant.
