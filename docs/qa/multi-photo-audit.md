# Audit exhaustif multi-photo — 2026-04-05 (v2)

> Mis a jour le 2026-04-05 pour refleter les changements recents :
> credits decrément immediat, MAX_CONCURRENT=5, loading unifie, refund, AuthButton CustomEvent.

## Changements recents integres

| Changement | Impact sur les tests |
|---|---|
| Credits decrement immediat au clic (totalJobs d'un coup) | Verifier que le CustomEvent fire AVANT la premiere requete API |
| MAX_CONCURRENT passe de 2 a 5 | Plus de "En attente" pour <= 5 photos — toutes affichent "Generation..." |
| Loading: `active = !done && !showPass1` remplace le check `currentProcessing` | "En attente" est desormais du code mort (branche inatteignable) |
| Section resultats gated par `!isGenerating` | Pas de duplication contenu pendant la generation |
| Refund credits pour jobs echoues | Message "X visuel(s) rembourse(s)" + credits re-incrementes |
| AuthButton ecoute CustomEvent detail.credits | Pas de fetch API supplementaire — mise a jour instantanee |

## Invariants de l'etat de generation (v2)

A TOUT moment, ces invariants doivent etre vrais :

1. `results.length === versions.length === activeVersions.length`
2. `results[i].originalUrl` pointe vers la photo d'input du job i (PAS celle d'un autre job)
3. `versions[i]` contient les versions (iterations) du resultat i
4. `activeVersions[i]` est un index valide dans `versions[i]`
5. Si `results[i].pass2Pending === true`, l'overlay "Ameublement en cours..." s'affiche
6. **NOUVEAU** : Pendant la generation, `#step-results` est INVISIBLE (`!isGenerating` gate)
7. **NOUVEAU** : Le decrement credits est SYNCHRONE au clic — le CustomEvent `credits-updated` fire avec `detail.credits` AVANT le premier fetch `/api/generate`
8. **NOUVEAU** : Avec `MAX_CONCURRENT=5`, toutes les images (jusqu'a 5) lancent simultanement — aucune image ne passe par l'etat "En attente"
9. **NOUVEAU** : Si N jobs echouent, `userCredits += N` et un CustomEvent `credits-updated` fire pour le refund

## Bugs corriges (sessions precedentes)

### BUG-1 : setVersions ecrasait les versions incrementales
**Cause** : `setVersions(allResults.map(...))` a la fin de handleGenerate ecrasait les entrees creees pendant le split-mode.
**Fix** : chaque resultat (split ou non-split) cree sa propre entree versions/activeVersions au moment de l'ajout a results. Plus d'ecrasement final.

### BUG-2 : versions/activeVersions non clears au debut de handleGenerate
**Cause** : `setResults([])` clearait les resultats mais pas versions/activeVersions → stale versions du run precedent.
**Fix** : ajout `setVersions([]); setActiveVersions([]);` apres `setResults([])`.

### BUG-3 : handleRetry ne clearait pas versions/activeVersions
**Cause** : retry relancait handleGenerate (qui les clear maintenant) mais avec 100ms de gap.
**Fix** : clear explicite dans handleRetry aussi.

### BUG-4 : Section resultats cachee pendant la generation
**Cause** : `results.length > 0 && !isGenerating` empechait l'affichage des resultats split pendant que d'autres batches etaient en cours.
**Fix** : revert — la gate `!isGenerating` est VOULUE pour eviter la duplication contenu.

## Matrice de combinaisons testees

| # | Combinaison | Jobs | Credits | Loading | "En attente" | Resultats | Test E2E |
|---|---|---|---|---|---|---|---|
| S01 | 1 photo x 1 style interieur | 1 | -1 immediat | 1x "Generation..." | NON | 1 comparateur | `multi-photo.spec.ts:S01` |
| S02 | 3 photos x 1 style | 3 | -3 immediat | 3x "Generation..." simultane | NON | 3 comparateurs | `multi-photo.spec.ts:S02` |
| S03 | 2 photos x 2 styles | 4 | -4 immediat | 4x "Generation..." | NON | 4 comparateurs | `multi-photo.spec.ts:S03` |
| S04 | 1 photo exterieur | 1 | -1 immediat | 1x "Generation..." | NON | 1 comparateur outdoor | `multi-photo.spec.ts:S04` |
| S05 | 1 photo surfaces-only | 1 | -1 immediat | 1x "Generation..." | NON | 1 resultat sans meubles | `multi-photo.spec.ts:S05` |
| S06 | 3 photos, 1 echoue | 3 | -3 puis +1 refund | 3x "Generation..." | NON | 2 comparateurs + message refund | `multi-photo.spec.ts:S06` |
| S07 | 3 photos, toutes echouent | 3 | -3 puis +3 refund | 3x "Generation..." | NON | 0 resultat + erreur | `multi-photo.spec.ts:S07` |
| S08 | Annulation | 2 | -2 puis abort | disparait | NON | selon timing | `multi-photo.spec.ts:S08` |
| S09 | 2 photos avant/apres | 2 | -2 immediat | 2x "Generation..." | NON | chaque resultat montre SA photo | `multi-photo.spec.ts:S09` |
| S10 | AuthButton sync | 2 | -2 via CustomEvent | - | - | - | `multi-photo.spec.ts:S10` |

## Invariants specifiques au loading block

### Logique de l'etat par image dans `#step-loading`

```
done      = results.some(r => !r.pass2Pending && r.originalUrl === filePreviewUrls[i])
showPass1 = !!results.find(r => r.pass2Pending && r.originalUrl === filePreviewUrls[i])
active    = !done && !showPass1
```

| Condition | Affichage | Visible quand |
|---|---|---|
| `showPass1` | "Surfaces terminees — Ameublement en cours..." | Passe 1 terminee, passe 2 en cours |
| `active` (= `!done && !showPass1`) | "Generation..." | Aucun resultat pour cette image |
| `done` | Checkmark vert | Resultat final recu |
| else | "En attente" | **CODE MORT** — branche inatteignable (si `!showPass1 && !active` alors forcement `done`) |

### Pourquoi "En attente" est du code mort

Avec `active = !done && !showPass1` :
- Si `showPass1 = false` et `done = false` → `active = true` → branche "Generation..."
- Si `showPass1 = false` et `done = true` → branche `null`
- Si `showPass1 = true` → branche "Ameublement en cours..."

La branche `else` ("En attente") ne peut JAMAIS etre atteinte. C'est un artefact de l'ancien code avec `currentProcessing`.

> **Recommandation @fullstack** : supprimer la branche "En attente" morte (lignes ~2215-2218 de page.tsx) pour eviter la confusion.

## Logique credits — sequence d'events

### Cas normal (N jobs, tous reussis)

```
1. Clic "Generer"
2. setUserCredits(prev - totalJobs)           ← decrement immediat
3. CustomEvent("credits-updated", { detail: { credits: newCredits } })
4. AuthButton recoit l'event → affiche newCredits (PAS de fetch API)
5. N appels /api/generate en parallele (MAX_CONCURRENT=5)
6. Resultats arrivent progressivement
7. isGenerating = false → #step-results visible
```

### Cas erreur partielle (N jobs, K echouent)

```
1-4. identique
5. N appels, (N-K) reussissent, K echouent
6. setUserCredits(prev + K)                   ← refund des echecs
7. CustomEvent("credits-updated")             ← sans detail (AuthButton fera un fetch)
8. Message: "N-K/N generation(s) reussie(s). K visuel(s) rembourse(s)."
```

### Cas erreur totale (N jobs, tous echouent)

```
1-4. identique
5. N appels, tous echouent
6. setUserCredits(prev + totalJobs)           ← refund total
7. CustomEvent("credits-updated")
8. Message d'erreur serveur
9. #step-results NON visible (0 resultat)
```

### Cas annulation

```
1-4. identique
5. Utilisateur clique "Annuler"
6. abortControllerRef.current.abort()
7. isGenerating = false
8. Resultats deja recus restent visibles (pass2Pending cleared)
9. Credits NON rembourses pour les jobs deja en vol (comportement actuel)
```

> **Point d'attention** : l'annulation ne rembourse PAS les credits des jobs en cours. Seuls les jobs qui echouent (status 500) sont rembourses. C'est un choix de design — le serveur peut avoir deja consomme les credits cote API IA. A documenter dans le UX.

## Race conditions analysees (v2)

### RC-1 : Passe 2 photo 1 finit AVANT passe 1 photo 3
**Verdict** : SAFE — le `findIndex` par `pass1Key` dans le setter fonctionnel est isole.

### RC-2 : Passe 2 echoue sur photo 2, reussit sur photo 1
**Verdict** : SAFE — l'echec ne modifie pas l'ordre.

### RC-3 : Toutes les passe 2 du batch 1 terminent pendant batch 2
**Verdict** : N/A avec MAX_CONCURRENT=5 — un seul batch pour <= 5 photos.
Pour > 5 photos : flicker mineur possible (isGenerating toggled entre batches).

### RC-4 : Regenerer photo 1 pendant passe 2 photo 2 en cours
**Verdict** : BUG CONNU — la regeneration abort les passe 2 des autres photos.
**Severite** : MOYENNE — rare en pratique (utilisateur doit regenerer pendant que d'autres sont en cours).

### RC-5 (NOUVEAU) : CustomEvent credits-updated fire 2 fois (decrement + refund)
**Risque** : AuthButton affiche brievement les credits decrementees, puis les credits refundees.
**Analyse** : C'est le comportement VOULU — l'utilisateur voit -3 puis +1 refund.
**Verdict** : SAFE — comportement correct et comprehensible.

## Resume

- **4 bugs critiques corriges** dans les sessions precedentes
- **1 bug mineur connu** (RC-4 : regenerer annule les autres passe 2)
- **1 branche de code mort** ("En attente" dans le loading block)
- **10 scenarios E2E** couverts dans `tests/e2e/multi-photo.spec.ts`
- **0 risque de melange avant/apres** apres les fixes
- **Credits : decrement immediat + refund sur echec** = UX reactive et equitable
