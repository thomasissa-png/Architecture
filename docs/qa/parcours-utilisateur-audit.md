# Audit QA -- Parcours utilisateur reels de la page de generation

**Date** : 2026-04-04
**Fichier audite** : `app/page.tsx` (2839 lignes)
**Methode** : analyse statique du code, ligne par ligne, pour chaque scenario utilisateur

---

## Tableau de resultats

| # | Scenario | Verdict | Lignes cles | Analyse |
|---|---|---|---|---|
| 1 | Upload 1 photo, 1 style, Generer, resultat | PASS | L459-889 | `handleGenerate` construit 1 job (L578-638), execute en batch (L651-854), ajoute le resultat via `setResults` (L723 ou L826-827). Le resultat s'affiche dans le bloc `results.length > 0 && !isGenerating` (L2303). |
| 2 | Upload 3 photos, 1 style, 3 resultats | PASS | L578-638 | La boucle `for (const img of processedImages)` (L578) itere sur chaque image. Pour chaque image, la boucle interne `for (const styleId of photoStyleIds)` (L587) cree 1 job par style selectionne. 3 photos x 1 style = 3 jobs = 3 resultats. |
| 3 | Upload 1 photo, 3 styles, 3 resultats | PASS | L578-638 | Meme logique : 1 photo x 3 styles = 3 jobs. Chaque style dans `photoStyleIds` (L582) genere un job distinct. |
| 4 | Supprimer photo source apres generation : resultat disparait ? | **PASS** | L1783-1786 | `setFiles` retire la photo (L1783). `setResults` filtre les resultats dont `r.originalUrl !== removedUrl` (L1786). Le `removedUrl` est `filePreviewUrls[index]` (L1785) et les resultats utilisent ce meme URL comme `originalUrl` (L705, L807). Les resultats associes sont donc supprimes. |
| 5 | Supprimer photo, ajouter nouvelle, peut-on generer ? | **BUG -- FAIL** | L1797-1802, L432-438 | Quand `files.length <= 1`, `isGenerating` est reset (L1798). MAIS le useEffect L432-438 reset TOUTES les Maps `perPhotoStyles`, `perPhotoRoomTypes`, etc. quand `files` change. Donc si on ajoute une nouvelle photo, les Maps sont videes. `canGenerate` (L445-448) exige `perPhotoStyles.size === files.length` avec des styles selectionnes. L'utilisateur DOIT reconfigurer la photo (choisir style, etc.) avant de pouvoir generer. Ce n'est pas un bug fonctionnel (pas de crash), mais un **probleme UX** : l'utilisateur s'attend a ce que ses choix de style soient conserves pour les photos restantes. En realite, le useEffect L432-438 reset TOUTES les Maps a chaque changement de `files`, ce qui efface la config des photos NON supprimees aussi. |
| 6 | Upload 3 photos, generer, supprimer 1, les 2 autres restent ? | **BUG -- FAIL** | L432-438, L1783-1808 | Le handler de suppression (L1776-1808) fait un `reindex` des Maps (L1803-1808) pour maintenir les configs des photos restantes. MAIS le useEffect L432-438 se declenche APRES car `files` change, et **reset TOUTES les Maps a vide**. Consequence : apres suppression d'une photo, les configs des 2 photos restantes sont perdues. Les resultats eux-memes sont correctement filtres (L1786), mais si l'utilisateur veut regenerer, il doit reconfigurer les 2 photos restantes. De plus, les `versions` et `activeVersions` sont filtrees (L1788-1794), donc les resultats affiches persistent correctement. **Verdict nuance** : les resultats visuels persistent (PASS pour l'affichage), mais la configuration per-photo est perdue (FAIL pour la re-generation). |
| 7 | Upload 3 photos, supprimer les 3, tout reset ? | PASS | L1797-1802 | Quand `files.length <= 1` (derniere photo), le code reset `isGenerating`, `isRefining`, `error`, `iterationsRemaining` (L1797-1802). Le useEffect L432-438 reset toutes les Maps. `results` est vide car tous les resultats sont filtres par `originalUrl`. |
| 8 | Affiner : PhotoAssociator masque pendant affinage ? | PASS | L2519-2528 | Le PhotoAssociator a la condition `!(isRefining && isRefineTarget)` (L2521). Quand `isRefining=true` et que l'index correspond au `refineTargetIndex`, le composant est masque. |
| 9 | Affinage termine : PhotoAssociator reapparait ? | PASS | L1096 | `setIsRefining(false)` dans le `finally` (L1096). La condition L2521 redevient fausse, le PhotoAssociator reapparait. |
| 10 | Affiner pendant loading, supprimer photo source | **BUG -- FAIL** | L1000-1003, L1783-1786 | L'affinage cree un nouvel `AbortController` (L1001-1003). La suppression de photo filtre les resultats (L1786), mais le fetch en cours n'est PAS annule : le `abortControllerRef` est potentiellement ecrase par l'affinage (L1002), et la suppression de photo ne l'abort pas. Le callback de completion de l'affinage tentera un `setResults` / `setVersions` sur un index potentiellement invalide (le result a ete supprime de l'array). Cela ne crashera pas (pas d'erreur JS), mais le resultat de l'affinage sera perdu silencieusement, ou pire, ajoutera une version a un mauvais index. De plus, `isRefining` restera `true` jusqu'a la fin du fetch, bloquant l'UI. **Impact** : UX degradee, pas de crash mais comportement imprevisible. |
| 11 | Regenerer : PhotoAssociator masque pendant regeneration ? | PASS | L2522 | Condition `!(isRegenerating && regeneratingIndex === index)`. Quand `isRegenerating=true` et `regeneratingIndex === index`, le PhotoAssociator est masque. |
| 12 | Regeneration terminee : PhotoAssociator reapparait ? | PASS | L1289-1293, L1319-1320 | `setIsRegenerating(false)` et `setRegeneratingIndex(null)` dans le `finally` (L1289-1290) pour le cas split-mode, ou L1319-1320 pour le cas non-split. La condition L2522 redevient fausse. |
| 13 | "Piece meublee" : passe 1 s'affiche, PhotoAssociator masque ? | PASS | L703-723, L2519-2520 | En split-mode, `pass2Pending: true` est set (L711). Le PhotoAssociator a la condition `!result.pass2Pending` (L2520). Tant que passe 2 est en cours, le composant est masque. |
| 14 | Passe 2 terminee : PhotoAssociator apparait ? | PASS | L756-773 | Le handler passe 2 set `pass2Pending: false` (L763) et ajoute `photoId` (L764). Les conditions L2519-2520 sont satisfaites : `result.photoId` present et `!result.pass2Pending`. |
| 15 | Changer de style apres generation, regenerer : anciens resultats remplaces ou accumules ? | PASS (remplaces) | L481-483 | `handleGenerate` execute `setResults([])` (L482) au debut. Les anciens resultats sont supprimes. Les nouveaux les remplacent. Ce n'est pas une accumulation. |
| 16 | handleFullReset : tout clean ? | PASS | L930-967 | `handleFullReset` abort les requetes (L931), reset `files` (L932), `selectedStyles` (L933), `customPrompt` (L934), toutes les Maps per-photo (L935-940), `results` (L941), `error` (L942), `isGenerating` (L943), `versions` (L948), `activeVersions` (L949), `isRefining` (L952), les etats outdoor (L957-959), regeneration (L962-964), et `pendingGeneration` (L966). Complet. |
| 17 | 0 credits : message d'erreur AVANT le fetch ? | PASS | L1640-1651 | Quand `maxPhotos === 0 && userCredits === 0` (L1640), la zone d'upload est remplacee par un message "Plus de visuels disponibles" avec lien "Recharger". L'utilisateur ne peut meme pas uploader de photo. De plus, `handleGenerate` verifie `totalJobs > userCredits` (L471) et affiche un message d'erreur (L472). |
| 18 | Credits insuffisants (2 credits, 3 styles) : message d'erreur ? | PASS | L470-474 | `totalJobs` est calcule comme la somme de tous les styles per-photo (L470). Si `totalJobs > userCredits`, l'erreur est affichee (L472) AVANT tout fetch. Le message est explicite : "Vous avez X visuels restants, mais cette generation en necessite Y." |
| 19 | "Surfaces uniquement" : passe 1 seule retournee ? | PASS | L676-677, L584 | `jobWithFurniture` est `perPhotoWithFurniture.get(img.fileIndex) !== false` (L584). Quand "Surfaces uniquement" est selectionne, `perPhotoWithFurniture.get(index)` vaut `false`, donc `jobWithFurniture = false`. Le body du fetch inclut `splitMode: job.jobWithFurniture` (L676) = `false` et `withFurniture: job.jobWithFurniture` (L667) = `false`. Le serveur retourne la passe 1 seule (pas de `pendingPass2`). Le resultat est ajoute normalement (L806-817). |
| 20 | Fetch echoue (erreur reseau) : message + retry ? | PASS | L680-689, L2290-2299 | Si `!response.ok`, un `throw new Error(errorMsg)` est declenche (L688). L'erreur est capturee et affichee (L844-851). Le bouton "Reessayer" appelle `handleRetry` (L2296) qui clear les resultats et relance `handleGenerate` (L894-900). |
| 21 | Fetch timeout (180s) : message d'erreur ? | PASS | L100, L113-115 | `resilientFetch` a un timeout de 180s (L100). Le `timeoutPromise` (L113-115) rejette avec "La generation a pris trop de temps." Le `TypeError` handler (L128-129) produit "Connexion perdue pendant la generation." Les deux cas aboutissent a un message affiche. |
| 22 | Photo portrait, format "Paysage" : resultat en paysage ? | PASS | L585, L668 | `jobFormat` est `perPhotoFormat.get(img.fileIndex) || "original"` (L585). Le body du fetch inclut `outputFormat: job.outputFormat` (L668). Le serveur recoit "landscape" et genere en consequence. Note : le choix de format est reserve aux utilisateurs Pro (L1966-2008, condition `hasPro`). |
| 23 | Photo paysage, format "Original" : garde le format ? | PASS | L585, L668 | Par defaut `jobFormat = "original"` (L585). Le serveur utilise les dimensions de l'image d'entree pour determiner le ratio. |
| 24 | Annuler pendant generation : state reset ? | **BUG MINEUR -- PASS CONDITIONNEL** | L919-928 | `handleCancelGeneration` abort le controller (L920), set `isGenerating = false` (L921), clear `error` (L922), et clear `pass2Pending` sur les resultats partiels (L925-927). MAIS : il ne reset PAS `currentProcessing` (reste a la derniere valeur). Ce n'est pas un bug visible car `currentProcessing` n'est utilise que pendant `isGenerating` (L2118). Cependant, si l'utilisateur re-genere immediatement, le compteur `currentProcessing` commencera a la valeur precedente avant d'etre ecrase par `setCurrentProcessing(batch)` (L654). **Verdict** : PASS fonctionnel, mais code imparfait. |

---

## Bugs identifies

### BUG 1 -- HAUTE : useEffect reset toutes les Maps per-photo a chaque changement de `files` (L432-438)

**Fichier** : `app/page.tsx`
**Lignes** : 432-438
**Comportement** : Le useEffect suivant se declenche a chaque changement de `files` :
```javascript
useEffect(() => {
    setPerPhotoStyles(new Map());
    setPerPhotoRoomTypes(new Map());
    setPerPhotoCustomPrompts(new Map());
    setPerPhotoOutdoor(new Map());
    setPerPhotoWithFurniture(new Map());
    setPerPhotoFormat(new Map());
}, [files]);
```

**Impact sur les parcours** :
- **Scenario 5** : Apres suppression + ajout, toute la configuration est perdue.
- **Scenario 6** : Apres suppression d'1 photo parmi 3, le handler `reindex` (L1778-1808) reconstruit correctement les Maps pour les photos restantes, MAIS le useEffect L432-438 les ecrase immediatement a `new Map()` car `files` a change.

**Cause racine** : Le useEffect devrait differencier un "reset complet" (upload initial ou remplacement de toutes les photos) d'un "ajout/suppression incrementale". Actuellement, il traite tout changement de `files` comme un reset complet.

**Correction proposee** : Remplacer le useEffect par une logique dans `setFiles` callback : ne reset les Maps que si les fichiers sont completement differents (pas juste un ajout ou retrait).

---

### BUG 2 -- MOYENNE : Suppression de photo pendant un affinage en cours (L1000-1003 + L1783-1786)

**Fichier** : `app/page.tsx`
**Lignes** : 1000-1003 (AbortController de l'affinage), 1783-1786 (suppression photo)
**Comportement** : Si l'utilisateur supprime la photo source pendant qu'un affinage est en cours :
1. Le fetch d'affinage continue (pas d'abort)
2. Le resultat cible a ete supprime de `results` par le filtre L1786
3. Le callback de completion (L1062-1088) tentera de modifier `results[refineTargetIndex]` qui pointe maintenant vers un autre resultat ou `undefined`
4. `isRefining` reste `true` jusqu'a completion du fetch

**Impact** : Pas de crash, mais l'UI reste en etat "affinage en cours" pour un resultat qui n'existe plus. Le nouveau resultat de l'affinage pourrait etre applique au mauvais index.

**Correction proposee** : Dans le handler de suppression, verifier si un affinage/regeneration est en cours sur cette photo et l'abort si necessaire.

---

### BUG 3 -- BASSE : `currentProcessing` non reset dans `handleCancelGeneration` (L919-928)

**Fichier** : `app/page.tsx`
**Ligne** : 919-928
**Comportement** : `currentProcessing` n'est pas remis a 0. Sans impact visible car la valeur n'est lue que pendant `isGenerating`, mais code imparfait.

---

## Synthese

| Categorie | PASS | FAIL | Total |
|---|---|---|---|
| Parcours de base (1-3) | 3 | 0 | 3 |
| Suppression photo (4-7) | 2 | 2 | 4 |
| Iterations/affinage (8-10) | 2 | 1 | 3 |
| Regeneration (11-12) | 2 | 0 | 2 |
| Split-mode (13-14) | 2 | 0 | 2 |
| Multi-session (15-16) | 2 | 0 | 2 |
| Credits (17-18) | 2 | 0 | 2 |
| Surfaces uniquement (19) | 1 | 0 | 1 |
| Erreur (20-21) | 2 | 0 | 2 |
| Format (22-23) | 2 | 0 | 2 |
| Annulation (24) | 1 | 0 | 1 |
| **TOTAL** | **21** | **3** | **24** |

**Taux de passage** : 21/24 (87.5%)

---

## Bugs classes par priorite

1. **HAUTE** -- BUG 1 : useEffect L432-438 efface la config des photos restantes apres suppression d'une photo. Affecte les scenarios 5 et 6. Signaler a @fullstack.
2. **MOYENNE** -- BUG 2 : Suppression de photo pendant affinage en cours. Etat `isRefining` bloque. Affecte le scenario 10. Signaler a @fullstack.
3. **BASSE** -- BUG 3 : `currentProcessing` non reset dans `handleCancelGeneration`. Aucun impact visible. Signaler a @fullstack comme cleanup.

---

## Recommandation critique

Le BUG 1 est le plus impactant car il affecte un parcours courant : l'utilisateur qui uploade plusieurs photos, genere des resultats, puis veut en supprimer une et regenerer les autres. La perte de configuration force l'utilisateur a reconfigurer toutes les photos restantes, ce qui est frustrant et non intuitif.

---

**Handoff -> @fullstack**
- Fichiers produits : `docs/qa/parcours-utilisateur-audit.md`
- Decisions prises : 24 scenarios testes contre le code source, 3 bugs identifies
- Points d'attention : Le BUG 1 (useEffect L432-438) est une race condition entre le handler de suppression et le useEffect. La correction doit differencier l'ajout/suppression incrementale d'un reset complet.
