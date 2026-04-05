# Cross-Matrix Part 3 — Resultats + Association avant/apres

Audit : app/page.tsx L.710-932 (creation resultats) + L.2390-2510 (JSX resultats)
Date : 2026-04-05

## Matrice PASS/FAIL

| # | Point de controle | Verdict | Detail |
|---|---|---|---|
| 1 | Split-mode : originalUrl = filePreviewUrls[job.img.fileIndex] (L.739) | PASS | Mapping correct via fileIndex assigne a L.582 |
| 2 | Non-split : originalUrl = filePreviewUrls[job.img.fileIndex] (L.839) | PASS | Meme mapping que split-mode |
| 3 | Split-mode : versions creees incrementalement (L.758) | PASS | setVersions(prev => [...prev, [...]]) — append, pas ecrasement |
| 4 | Non-split : versions creees incrementalement (L.863) | PASS | Meme pattern append |
| 5 | Pas d'ecrasement final des versions (L.900-932) | PASS | Aucun setResults ni setVersions apres les batches — uniquement batchesCompleteRef + isGenerating |
| 6 | Passe 2 : recherche par pass1Key (L.793) | PASS | findIndex sur currentResults via pass1Key capture dans closure (p2Pass1Key L.762) |
| 7 | Passe 2 : versions[idx] mis a jour avec le bon idx (L.795-799) | PASS | idx issu de findIndex sur results courant, utilise pour indexer versions — coherent |
| 8 | batchesCompleteRef empeche setIsGenerating(false) premature (L.783, 806, 826) | PASS | Condition batchesCompleteRef.current && !updated.some(r => r.pass2Pending) — double garde |
| 9 | batchesCompleteRef mis a true APRES toutes les batches (L.903) | PASS | Apres la boucle for des batches |
| 10 | Section resultats gated par !isGenerating (L.2391) | PASS | `results.length > 0 && !isGenerating` — resultats masques pendant generation |
| 11 | ImageComparator recoit result.originalUrl (L.2506) | PASS | originalUrl = photo input de l'utilisateur |
| 12 | displayUrl depuis versions[index] (L.2400-2401) | PASS | `resultVersions[activeIdx]?.imageUrl \|\| result.generatedUrl` — fallback correct |
| 13 | 2 photos x 2 styles = 4 resultats, chacun son originalUrl | PASS | Chaque job a son propre fileIndex, les resultats sont append un par un |
| 14 | results[0] correspond a versions[0] a tout moment | PASS | Ajouts toujours synchrones (setResults + setVersions dans le meme bloc) |
| 15 | Non-split : champ roomType present | **FAIL** | L.838-849 : roomType absent. Split-mode (L.750) l'a. Consequence : iterations sur resultats non-split perdent le type de piece |
| 16 | Passe 2 echec : model suffixe "(ameublement echoue)" (L.780, 822) | PASS | Informatif, pass2Pending passe a false — coherent |
| 17 | Pass2 pending overlay visible dans comparateur (L.2488-2503) | PASS | Overlay conditionnel sur result.pass2Pending, affiche pendant ameublement |
| 18 | Split-mode results pas re-ajoutes dans boucle post-batch (L.861) | PASS | Condition `!val.pass2Pending && !val.pass1Url` filtre les split-mode deja ajoutes |

## Bug detecte

**BUG-P3-01 (MOYENNE)** : `roomType` manquant dans le path non-split (L.838-849).
- Fichier : `app/page.tsx`, ligne ~849
- Attendu : `roomType: job.roomType || undefined` (comme L.750 en split-mode)
- Impact : si la generation retourne un resultat complet (pas de split), les iterations ulterieures n'auront pas le type de piece, ce qui peut degrader la qualite du prompt d'iteration.
- Action : ajouter `roomType: job.roomType || undefined` au return L.838-849. Signale a @fullstack.

## Synthese

- 17/18 controles PASS
- 1 FAIL (roomType manquant en non-split) — severite MOYENNE
- L'association avant/apres est solide : originalUrl indexe par fileIndex, versions synchronisees par append incremental
- Le mecanisme batchesCompleteRef est correct et empeche les races entre passe 2 et fin de generation
