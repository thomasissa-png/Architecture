# Audit QA — Crédits + Nombre de photos (cross-matrix)

Date : 2026-04-05 | Fichier : app/page.tsx | Lignes : 475-510, 670-690

## Logique auditee

- **Credit check** L.487 : `if (userCredits !== null && totalJobs > userCredits)` — AVANT decrement L.506
- **Decrement** L.506 : `Math.max(0, userCredits - totalJobs)` — optimiste client-side
- **totalJobs** L.486 : somme des styles selectionnes par photo via `perPhotoStyles` Map
- **Batching** L.680-690 : `MAX_CONCURRENT=5`, boucle `for` par chunks, chaque chunk dans `Promise.allSettled`

## Matrice Credits

| Compte | Credits | Scenario | totalJobs | Check L.487 | Verdict |
|---|---|---|---|---|---|
| Gratuit | 2 | 1 photo x 1 style | 1 | 1 > 2 = false | PASS — genere |
| Gratuit | 2 | 1 photo x 2 styles | 2 | 2 > 2 = false | PASS — genere |
| Gratuit | 2 | 1 photo x 3 styles | 3 | 3 > 2 = true | PASS — bloque |
| Gratuit | 2 | 3 photos x 1 style | 3 | 3 > 2 = true | PASS — bloque |
| Starter | 15 | 5 photos x 3 styles | 15 | 15 > 15 = false | PASS — genere |
| Starter | 15 | 5 photos x 3 styles + 1 | 16 | 16 > 15 = true | PASS — bloque |
| Pro | 50 | 5 photos x 3 styles | 15 | 15 > 50 = false | PASS — genere |

## Matrice Batching

| Scenario | jobs.length | Batches (ceil/5) | Chunk sizes | Promise.allSettled | Verdict |
|---|---|---|---|---|---|
| 1 photo x 1 style | 1 | 1 | [1] | 1 call | PASS |
| 2 photos x 1 style | 2 | 1 | [2] | 1 call | PASS |
| 3 photos x 1 style | 3 | 1 | [3] | 1 call | PASS |
| 4 photos x 1 style | 4 | 1 | [4] | 1 call | PASS |
| 5 photos x 1 style | 5 | 1 | [5] | 1 call | PASS |
| 1 photo x 3 styles | 3 | 1 | [3] | 1 call | PASS |
| 3 photos x 3 styles | 9 | 2 | [5, 4] | 2 calls seq | PASS |
| 5 photos x 3 styles | 15 | 3 | [5, 5, 5] | 3 calls seq | PASS |

## Bugs et edge cases

| # | Cas | Verdict | Detail |
|---|---|---|---|
| B1 | `userCredits === null` (pas encore charge) | **FAIL** | Le check L.487 est skippe (`!== null` guard). La generation lance sans verification de credits. Le decrement L.506 ne fait rien non plus. Risque : generation gratuite si l'etat credits n'est pas encore hydrate. |
| B2 | Credits suffisants exactement (totalJobs === userCredits) | PASS | `>` strict, pas `>=`. 15 jobs avec 15 credits passe correctement. |
| B3 | Decrement optimiste sans rollback serveur | **WARN** | Si la generation echoue cote serveur, les credits client sont deja decrementes. Pas de mecanisme de rollback visible dans le code audite. Le serveur est la source de verite mais l'UI montre un solde faux jusqu'au prochain fetch. |
| B4 | Abort entre batches | PASS | `controller.signal.aborted` check L.686 avant chaque batch. |

## Verdict global

- Credit guard : **PASS** (fonctionnel pour tous les cas nominaux)
- Batching : **PASS** (MAX_CONCURRENT=5 correct, Promise.allSettled isole les erreurs)
- Edge case B1 (null credits) : **FAIL** — a signaler a @fullstack
- Edge case B3 (rollback) : **WARN** — risque UX, pas de perte financiere si serveur est source de verite
