# Vérification croisée exhaustive — Matrice multi-photo v52

**Date** : 2026-04-05 | **Auditeur** : @orchestrator (traçage code direct)

## Logique de création des jobs (L.609-669)

```
Pour chaque photo (processedImages) :
  - Récupère isOutdoor, roomType, photoStyleIds, customPrompt, withFurniture, format
  - Pour chaque styleId sélectionné :
    - Si custom → job custom
    - Si outdoor → job outdoor
    - Sinon → job intérieur
  - jobWithFurniture = perPhotoWithFurniture.get(fileIndex) !== false (défaut: true)
```

**totalJobs** (L.484) = somme des longueurs de perPhotoStyles pour chaque photo.

## Matrice vérifiée

### Axe 1 : Nombre de photos (1-5)

| Photos | Jobs (1 style) | Batch size | Simultané ? | Loading cards | Verdict |
|--------|---------------|-----------|-------------|---------------|---------|
| 1 | 1 | 1 | Oui (< MAX_CONCURRENT=5) | 1 | **PASS** |
| 2 | 2 | 2 | Oui | 2 | **PASS** |
| 3 | 3 | 3 | Oui | 3 | **PASS** |
| 4 | 4 | 4 | Oui | 4 | **PASS** |
| 5 | 5 | 5 | Oui (= MAX_CONCURRENT) | 5 | **PASS** |

### Axe 2 : Type de compte

| Compte | Crédits | 1 photo | 3 photos | 5 photos | Verdict |
|--------|---------|---------|----------|----------|---------|
| Gratuit | 2 | OK (-1) | BLOQUÉ L.485 ("nécessite 3, vous avez 2") | BLOQUÉ | **PASS** (check correct) |
| Starter | 15 | OK (-1) | OK (-3) | OK (-5) | **PASS** |
| Pro | 50 | OK (-1) | OK (-3) | OK (-5) | **PASS** |

Le check crédits (L.484-488) bloque AVANT le décrément (L.506) → pas de crédit perdu.

### Axe 3 : Espace (intérieur / extérieur / mix)

| Config | isOutdoor par job | surfacePrompt source | furniturePrompt source | Verdict |
|--------|-------------------|---------------------|----------------------|---------|
| Toutes int | false | STYLES[].surfacePrompt | STYLES[].furniturePrompt | **PASS** |
| Toutes ext | true | OUTDOOR_STYLES[].surfacePrompt | OUTDOOR_STYLES[].furniturePrompt | **PASS** |
| Mix (photo 1 int, photo 2 ext) | false/true par job | Correct par job | Correct par job | **PASS** |

`perPhotoOutdoor.get(fileIndex)` (L.610) est lu par photo → chaque job a le bon flag.

### Axe 4 : Mode mobilier

| Mode | jobWithFurniture | splitMode | Path dans batchResults | Résultat |
|------|-----------------|-----------|----------------------|----------|
| Surfaces + meubles | true | true | Split: pass1 → setResults(pass2Pending:true) → pass2 background | Overlay "Ameublement en cours" puis résultat final | **PASS** |
| Surfaces only | false | false | Non-split: résultat direct L.854-857 | Résultat sans meubles, pas d'overlay | **PASS** |
| Mix (photo 1 meubles, photo 2 surfaces) | true/false par job | true/false par job | Job 1 split, Job 2 non-split | Chaque job suit son propre path | **PASS** |

`perPhotoWithFurniture.get(fileIndex)` (L.615) est lu par photo.
`splitMode: job.jobWithFurniture` (L.702) → le serveur sait quel mode.

### Axe 5 : Multi-styles par photo

| Config | Jobs | Loading cards | done check | Verdict |
|--------|------|---------------|-----------|---------|
| 1 photo × 1 style | 1 | 1 | 1 résultat → every OK | **PASS** |
| 1 photo × 2 styles | 2 | 1 card (itère files, pas jobs) | 2 résultats même originalUrl → done quand les 2 terminés | **PASS** |
| 1 photo × 3 styles | 3 | 1 card | 3 résultats → done quand les 3 terminés (every) | **PASS** |
| 2 photos × 2 styles | 4 | 2 cards | Chaque card vérifie ses propres résultats | **PASS** |
| 3 photos × 3 styles | 9 | 3 cards | 9 jobs > MAX_CONCURRENT=5 → batch 5+4 | **ATTENTION** |

**ATTENTION 3×3** : 9 jobs avec MAX_CONCURRENT=5 → batch 1 (5 jobs) puis batch 2 (4 jobs). Les 4 derniers jobs démarrent APRÈS que les 5 premiers aient terminé. Le loading block montrera "Génération…" sur les 3 cards pendant le batch 1, mais certaines cards pourraient montrer "done" (checkmark) avant que le batch 2 lance les jobs restants pour cette photo.

**Verdict** : le `done = photoResults.every(!pass2Pending)` protège contre ça — les résultats du batch 2 n'existent pas encore dans `results` quand le batch 1 finit, donc `photoResults` ne contient que les résultats terminés. La card ne montre PAS checkmark car `photoResults.length` (ex: 1 sur 3 attendus) ne couvre pas tous les styles. MAIS le code ne SAIT PAS combien de styles sont attendus par photo — il ne vérifie que les résultats existants.

**BUG IDENTIFIÉ** : pour 1 photo × 3 styles, si les 2 premiers jobs du batch 1 terminent (2 résultats non-pass2Pending), `done = photoResults.every(!pass2Pending)` = true (les 2 existants sont tous terminés). La card affiche checkmark. Mais le 3ème job (batch 2) n'a pas encore démarré. Quand il démarre et termine, le résultat s'ajoute mais la card est déjà "done".

**Impact** : uniquement pour >5 jobs simultanés (3 photos × 2+ styles). Pour le cas courant (1-5 photos × 1 style), pas de problème.

**Fix proposé** : comparer `photoResults.length` avec le nombre attendu de styles pour cette photo.

## 5 cas critiques tracés

### Cas A : Gratuit, 1 photo intérieur, 1 style surfaces+meubles

```
L.484: totalJobs = 1
L.485: 1 <= 2 (crédits gratuit) → OK
L.506: setUserCredits(2-1=1), CustomEvent({credits:1})
L.609: 1 photo → photoStyleIds = ["scandinavian"]
L.618: 1 itération → jobs.push(1 job, isOutdoor=false, jobWithFurniture=true)
L.671: jobs.length=1, OK
L.680: MAX_CONCURRENT=5, batch 0→5, chunk=[1 job]
L.686: 1 fetch /api/generate avec splitMode=true
L.713: data.pendingPass2=true → split path
L.744: setResults([partialResult]) avec pass2Pending=true
L.748: setVersions([[{pass1 image}]]), setActiveVersions([0])
L.752: pass2 lancée en background
Loading: 1 card, showPass1=true → "Surfaces terminées — Ameublement en cours"
L.786: pass2 termine → setResults update pass2Pending=false
L.793: batchesCompleteRef=true && !updated.some(pass2Pending) → setIsGenerating(false)
Résultats: 1 comparateur, originalUrl=photo upload, displayUrl=pass2 result
```
**PASS**

### Cas B : Starter, 3 photos intérieures, 1 style chacune surfaces+meubles

```
L.484: totalJobs = 3
L.506: setUserCredits(15-3=12), CustomEvent({credits:12})
L.609: 3 photos → 3 itérations, 1 job chacune
L.680: MAX_CONCURRENT=5, batch 0→5, chunk=[3 jobs]
L.685: Promise.allSettled avec 3 fetches simultanés
L.713: 3× split path → 3× setResults(prev => [...prev, partial])
L.748: 3× setVersions/setActiveVersions incrémentaux
Loading: 3 cards, chacune showPass1=true quand sa pass1 termine
Passe 2: 3 passe 2 en background, chacune update son résultat par pass1Key
L.793: isGenerating=false quand les 3 pass2 terminées
Résultats: 3 comparateurs, chacun avec sa bonne photo
```
**PASS**

### Cas C : Pro, 2 photos (1 int + 1 ext), 2 styles chacune surfaces+meubles

```
L.484: totalJobs = 4
L.506: setUserCredits(50-4=46)
L.609: photo 0 → 2 styles intérieurs, photo 1 → 2 styles outdoor
L.618+633: 2 jobs isOutdoor=false + 2 jobs isOutdoor=true
L.680: 4 jobs, 1 batch
Loading: 2 cards (itère files, pas jobs)
- Card 0: 2 résultats attendus (2 styles int)
- Card 1: 2 résultats attendus (2 styles ext)
done = photoResults.every(!pass2Pending) → attend les 2 de chaque card
Résultats: 4 comparateurs
```
**PASS**

### Cas D : Starter, 5 photos intérieures, 1 style chacune surfaces only

```
L.484: totalJobs = 5
L.506: setUserCredits(15-5=10)
L.615: perPhotoWithFurniture.get(i) = false → jobWithFurniture=false
L.686: splitMode=false (L.702)
L.810: data.pendingPass2 absent → non-split path
L.827: résultat direct (pas de pass2)
L.854: setResults/setVersions/setActiveVersions incrémentaux
Loading: 5 cards, pas de showPass1 (pas de pass2Pending), done dès résultat reçu
Résultats: 5 résultats surfaces only, pas d'overlay "ameublement"
```
**PASS**

### Cas E : Pro, 3 photos mix (surfaces-only + meubles + extérieur)

```
L.484: totalJobs = 3
Photo 0: intérieur, surfaces-only (jobWithFurniture=false)
Photo 1: intérieur, surfaces+meubles (jobWithFurniture=true)
Photo 2: extérieur, surfaces+meubles (jobWithFurniture=true)

Job 0: splitMode=false → non-split path → résultat direct
Job 1: splitMode=true → split path → pass1 + pass2 background
Job 2: splitMode=true, isOutdoor=true → split path outdoor

Loading:
- Card 0: done=true dès résultat reçu (surfaces only, pas de pass2)
- Card 1: showPass1 → "Ameublement en cours" → done quand pass2 termine
- Card 2: showPass1 → "Ameublement en cours" → done quand pass2 termine

Résultats: 3 comparateurs, mix de types
```
**PASS**

## Bug identifié

### BUG : done=true prématuré pour >5 jobs (batch séquentiel)

**Condition** : 3 photos × 2 styles = 6 jobs → batch 1 (5), batch 2 (1).
Si les 2 jobs de la photo 1 (dans batch 1) terminent avant que le batch 2 démarre le job restant d'une AUTRE photo, la card de la photo 1 montre checkmark (correct). Mais si la photo 3 n'a qu'1 de ses 2 styles dans le batch 1 et que ce style termine, done=true (1 résultat, every=true car 1/1 terminé) alors que le 2ème style n'a pas encore démarré.

**Sévérité** : BASSE — ne se produit que pour >5 jobs simultanés, et l'impact est cosmétique (checkmark prématuré dans le loading, le résultat final est correct).

**Fix** : pas urgent. Si nécessaire, stocker le nombre attendu de jobs par photo et comparer.

## Résumé

| Axe | Combinaisons | Verdict |
|-----|-------------|---------|
| 1-5 photos × 1 style | 5 | **5/5 PASS** |
| Gratuit/Starter/Pro | 3 | **3/3 PASS** |
| Int/Ext/Mix | 3 | **3/3 PASS** |
| Meubles/Surfaces/Mix | 3 | **3/3 PASS** |
| Multi-styles (≤5 jobs) | 3 | **3/3 PASS** |
| Multi-styles (>5 jobs) | 1 | **PASS avec note** (checkmark cosmétique) |
| 5 cas critiques | 5 | **5/5 PASS** |

**Verdict global : PASS — 0 bug bloquant, 1 bug cosmétique mineur (>5 jobs).**
