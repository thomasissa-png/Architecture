# Audit QA -- Matrice croisee Modes x Loading (Part 2)

Date : 2026-04-05 | Fichier : app/page.tsx | Lignes : 609-669, 2188-2250

## 1. Creation des jobs (L.609-669)

| Combinaison | Ligne(s) | Verdict | Detail |
|---|---|---|---|
| Interieur (isOutdoor=false) | 650-666 | PASS | `STYLES.find(s => s.id)`, isOutdoor force a false, outdoorSubtype force a undefined |
| Exterieur (isOutdoor=true) | 633-648 | PASS | `OUTDOOR_STYLES[styleId]`, isOutdoor force a true, outdoorSubtype propage |
| Mix int+ext par photo | 610 | PASS | `perPhotoOutdoor.get(fileIndex) \|\| isOutdoor` — resolution par photo, fallback global |
| Custom (int ou ext) | 619-632 | PASS | Meme surfacePrompt+furniturePrompt = texte utilisateur brut, isOutdoor propage |
| Surfaces+meubles (default) | 615, 630/646/663 | PASS | `perPhotoWithFurniture !== false` default true, jobWithFurniture=true |
| Surfaces only | 615 | PASS | `perPhotoWithFurniture.get(i) === false` -> jobWithFurniture=false |
| Mix split+non-split | 618 boucle | PASS | Chaque job a son propre jobWithFurniture, independant des autres jobs |

## 2. Split-mode dispatch (L.701-861)

| Cas | Ligne(s) | Verdict | Detail |
|---|---|---|---|
| jobWithFurniture=true -> splitMode=true | 710 | PASS | `splitMode: job.jobWithFurniture` — passe 1 retourne pass1, lance pass2 async |
| jobWithFurniture=false -> splitMode=false | 710 | PASS | Serveur retourne resultat final direct, pas de pendingPass2 |
| Split result ajoute immediat | 756 | PASS | `setResults([...prev, partialResult])` avec pass2Pending=true |
| Non-split result ajoute apres batch | 861 | PASS | `!val.pass2Pending && !val.pass1Url` filtre correctement |
| Pass2 echec -> pass2Pending=false | 780, 823 | PASS | Marque "(ameublement echoue)" mais libere le flag |

## 3. Loading block (L.2188-2250)

| Verification | Ligne(s) | Verdict | Detail |
|---|---|---|---|
| `photoResults` filtre par originalUrl | 2197 | PASS | `originalUrl = filePreviewUrls[job.img.fileIndex]` (L.739/839). Meme ref useMemo. Multi-styles = plusieurs results pour meme URL |
| `done` correct mix split+non-split | 2199 | PASS | Non-split: pass2Pending=undefined (falsy), !undefined=true. Split termine: false->!false=true. Split en cours: true->!true=false. `every()` correct |
| `showPass1` affiche pass1 split | 2200 | **WARN** | `find()` retourne le PREMIER result avec pass2Pending. Si 2+ styles split sur meme photo, seule 1 image pass1 affichee. UX mineure, pas de crash |
| `hasError` par photo | 2201 | PASS | `photoErrors.has(i)` — Map par index photo. Erreur localisee, pas globale |
| `active` couvre tous les cas | 2202 | PASS | `!done && !showPass1 && !hasError` — loading spinner uniquement si aucun resultat partiel ni erreur ni fini |
| Overlay erreur avec message | 2214-2221 | PASS | Message specifique `photoErrors.get(i)` + "Credit rembourse" |
| Overlay pass1 intermediaire | 2222-2231 | PASS | Montre image pass1 (L.2208) + "Surfaces terminees / Ameublement en cours" |
| Badge done (checkmark vert) | 2243-2248 | PASS | `done && !showPass1` — correct, checkmark seulement quand TOUT est fini |
| Image source loading | 2208 | PASS | `showPass1 ? partialResult.generatedUrl : filePreviewUrls[i]` — pass1 ou blur original |
| Blur CSS conditionnel | 2210 | PASS | `done \|\| showPass1 ? "" : "blur-sm"` — deblur des que pass1 arrive ou tout fini |

## 4. Bugs et risques identifies

| # | Severite | Description |
|---|---|---|
| BUG-1 | **MOYENNE** | Multi-styles split meme photo : `find()` L.2200 prend le 1er pass2Pending. Si style A est en pass2 et style B aussi, seule l'image pass1 de A s'affiche dans le loading. L'image pass1 de B est invisible pendant le loading. Pas de crash, UX sous-optimale. |
| OK | -- | Aucun bug sur les combinaisons int/ext/custom x split/non-split. La matrice est propre. |

## Verdict global

**11 PASS / 0 FAIL / 1 WARN** -- La logique de creation des jobs et le loading block couvrent correctement toutes les combinaisons de modes. Le seul point d'attention (BUG-1) est un cas marginal multi-styles split sur la meme photo qui n'impacte que l'affichage intermediaire.
