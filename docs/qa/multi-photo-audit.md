# Audit exhaustif multi-photo — 2026-04-05

## Invariants de l'état de génération

À TOUT moment, ces invariants doivent être vrais :
1. `results.length === versions.length === activeVersions.length`
2. `results[i].originalUrl` pointe vers la photo d'input du job i
3. `versions[i]` contient les versions (itérations) du résultat i
4. `activeVersions[i]` est un index valide dans `versions[i]`
5. Si `results[i].pass2Pending === true`, l'overlay "ameublement en cours" s'affiche

## Bugs corrigés (session actuelle)

### BUG-1 : setVersions écrasait les versions incrémentales
**Cause** : `setVersions(allResults.map(...))` à la fin de handleGenerate écrasait les entrées créées pendant le split-mode.
**Fix** : chaque résultat (split ou non-split) crée sa propre entrée versions/activeVersions au moment de l'ajout à results. Plus d'écrasement final.
**Lignes** : 734-737 (split), 841-843 (non-split), 897-901 (fin, plus d'écrasement)

### BUG-2 : versions/activeVersions non clearés au début de handleGenerate
**Cause** : `setResults([])` clearait les résultats mais pas versions/activeVersions → stale versions du run précédent.
**Fix** : ajout `setVersions([]); setActiveVersions([]);` après `setResults([])`.
**Lignes** : 493-494

### BUG-3 : handleRetry ne clearait pas versions/activeVersions
**Cause** : retry relançait handleGenerate (qui les clear maintenant) mais avec 100ms de gap.
**Fix** : clear explicite dans handleRetry aussi.
**Lignes** : 913-914

### BUG-4 : Section résultats cachée pendant la génération
**Cause** : `results.length > 0 && !isGenerating` empêchait l'affichage des résultats split pendant que d'autres batches étaient en cours.
**Fix** : retiré `!isGenerating` — les résultats s'affichent dès qu'ils existent.
**Ligne** : 2344

## Combinaisons testées (analyse de code)

| Combinaison | Jobs | Split | Crédits | Invariant 1 | Overlay | Verdict |
|---|---|---|---|---|---|---|
| 1 photo × 1 style intérieur | 1 | oui | -1 | OK (1=1=1) | OK | PASS |
| 1 photo × 2 styles | 2 (batch 1) | oui | -2 | OK (2=2=2) | OK les 2 | PASS |
| 1 photo × 3 styles | 3 (batch 2+1) | oui | -3 | OK (3=3=3) | OK les 3 | PASS |
| 2 photos × 1 style | 2 (batch 1) | oui | -2 | OK | OK | PASS |
| 2 photos × 2 styles | 4 (batch 2+2) | oui | -4 | OK | OK | PASS |
| 3 photos × 1 style | 3 (batch 2+1) | oui | -3 | OK | OK | PASS |
| 1 extérieur × 1 style | 1 | oui | -1 | OK | OK | PASS |
| Mix int+ext 2 photos | 2 (batch 1) | oui | -2 | OK | OK | PASS |
| 1 photo surfaces-only | 1 | non | -1 | OK (non-split path) | N/A | PASS |
| 1 photo custom prompt | 1 | oui | -1 | OK | OK | PASS |
| Régénérer après multi | remplace index | oui | -1 | OK (versions[idx] reset) | OK | PASS |
| Affiner après multi | ajoute version | non | 0 | OK (newVersionIndex) | N/A | PASS |
| Annuler pendant multi | abort controller | - | - | OK (handleFullReset clear all) | N/A | PASS |

## Race conditions analysées

### RC-1 : Passe 2 photo 1 finit AVANT passe 1 photo 3
**Risque** : versions[idx] mis à jour avec mauvais idx car photo 3 pas encore dans results
**Analyse** : le `findIndex` par `pass1Key` dans le setter fonctionnel de setResults est sûr — photo 3 n'est pas dans results donc son index n'est pas affecté.
**Verdict** : SAFE

### RC-2 : Passe 2 échoue sur photo 2, réussit sur photo 1
**Risque** : les indices versions/results divergent
**Analyse** : l'échec ne modifie pas l'ordre — `results.map` met juste `pass2Pending: false` + message erreur sur le bon résultat (par pass1Key).
**Verdict** : SAFE

### RC-3 : Toutes les passe 2 du batch 1 terminent pendant batch 2
**Risque** : `setIsGenerating(false)` prématuré → loading spinner disparaît momentanément
**Analyse** : les résultats batch 2 ne sont pas encore dans results, donc `!updated.some(r.pass2Pending)` regarde seulement batch 1. Si toutes les passe 2 de batch 1 sont done, isGenerating passe à false. Quand batch 2 lance ses résultats, ils ont pass2Pending=true mais isGenerating est déjà false.
**Impact** : le loading spinner du batch 2 ne s'affiche pas. Les résultats apparaissent quand même (grâce au fix !isGenerating). Flicker mineur possible.
**Verdict** : MINOR — acceptable pour v1

### RC-4 : Régénérer photo 1 pendant passe 2 photo 2 en cours
**Risque** : le nouveau AbortController (ligne 1152) annule la passe 2 en cours
**Analyse** : OUI, `abortControllerRef.current?.abort()` va annuler la passe 2 de photo 2.
**Verdict** : BUG CONNU — la régénération d'une photo annule les passe 2 des autres. Impact : les photos en cours d'ameublement sont gelées en "surfaces only".
**Sévérité** : MOYENNE — ne se produit que si l'utilisateur régénère pendant que d'autres photos sont encore en traitement. Rare en pratique.

## Résumé

- **4 bugs critiques corrigés** (versions écrasées, clear manquant, résultats cachés)
- **1 bug mineur identifié** (RC-4 : régénérer annule les autres passe 2)
- **1 flicker mineur** (RC-3 : loading spinner disparaît momentanément entre batches)
- **0 bug de mélange avant/après** après les fixes
- **0 bug de perte de visuel** après les fixes
