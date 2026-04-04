# Audit QA - PhotoAssociator + Flow "Surfaces uniquement"

**Date** : 2026-04-04
**Agent** : @qa
**Fichiers audites** :
- `app/page.tsx` (composant Home, conditions d'affichage PhotoAssociator)
- `app/api/generate/route.ts` (flow surfaces-only, saveUserPhoto, photoId)
- `components/PhotoAssociator.tsx` (composant, conditions internes)

---

## 1. PhotoAssociator -- QUAND il apparait

**Condition d'affichage** (page.tsx, ligne 2526-2529) :
```tsx
{session && result.photoId && !dismissedAssociators.has(index)
  && !result.pass2Pending
  && !(isRefining && isRefineTarget)
  && !(isRegenerating && regeneratingIndex === index)
  && (
  <PhotoAssociator ... />
)}
```

| Scenario | Attendu | Verdict | Ligne(s) | Explication |
|---|---|---|---|---|
| Generation "Piece meublee" terminee (passe 2 finie) | VISIBLE | **PASS** | page.tsx:756-764 | `pass2Pending` passe a `false`, `photoId` est merge depuis `p2Data.photoId`. Condition remplie. |
| Generation "Surfaces uniquement" terminee | VISIBLE | **PASS** | route.ts:847-852, page.tsx:812-817 | Le serveur retourne `photoId` dans la reponse JSON (ligne 851). Le client le lit a ligne 817. `pass2Pending` est absent/false. |
| Pendant passe 2 en cours (pass2Pending = true) | MASQUE | **PASS** | page.tsx:2527 | `!result.pass2Pending` bloque l'affichage. |
| Pendant affinage en cours (isRefining + isRefineTarget) | MASQUE | **PASS** | page.tsx:2528 | `!(isRefining && isRefineTarget)` bloque l'affichage. |
| Pendant regeneration en cours (isRegenerating + regeneratingIndex) | MASQUE | **PASS** | page.tsx:2529 | `!(isRegenerating && regeneratingIndex === index)` bloque l'affichage. |
| Affinage termine, nouveau resultat | VISIBLE | **PASS** | page.tsx:1086-1094 | `setResults` met a jour `generatedUrl` et `model` mais ne touche PAS `photoId` -- le `photoId` original persiste. `isRefining` repasse a `false`. |
| Regeneration terminee, nouveau resultat | VISIBLE | **PASS** | page.tsx:1274-1277 | Le handler pass2 de la regeneration merge `p2Data.photoId || r.photoId`. `isRegenerating` repasse a `false` dans `.finally()`. |
| Utilisateur non connecte | MASQUE | **PASS** | page.tsx:2526 | `session` est `null` quand non connecte. Condition bloquee. |
| Utilisateur Decouverte (pas de Pro) | VISIBLE si photoId existe | **PASS** | page.tsx:2526 | Aucun check `hasPro`. Si `photoId` existe et `session` est present, le composant s'affiche. Voir section 2 pour l'analyse de cette decision. |

---

## 2. PhotoAssociator -- POUR QUI il apparait

### Constat

**Aucun check de role/plan dans le composant** (PhotoAssociator.tsx). Le composant s'affiche pour TOUT utilisateur connecte qui a un `result.photoId` non-null.

**Aucun check de role/plan dans la condition d'affichage** (page.tsx, ligne 2526). La seule condition est `session && result.photoId`.

**Aucun check Pro dans `/api/properties` GET** (app/api/properties/route.ts). L'endpoint retourne les biens de tout utilisateur authentifie.

### Garde naturelle

Le composant PhotoAssociator retourne `null` si `properties.length === 0` (ligne 67). Donc un utilisateur qui n'a jamais cree de bien ne verra rien. La creation de biens (`/mes-biens`) est accessible a tous les utilisateurs connectes -- il n'y a pas de gating Pro sur cette fonctionnalite.

### Verdict : **FAIL -- Potentiel ecart avec l'intention du fondateur**

Le fondateur a specifiquement dit : "verifier que associer un bien n'est present que pour les marchands de bien". Or :
- Un utilisateur Starter ou Decouverte qui cree manuellement un bien verra le PhotoAssociator.
- Le lien "+ Nouveau bien" (ligne 83-86) dans le composant redirige vers `/mes-biens?create=true` sans aucun gating.

### FIX PROPOSE

**Option A (recommandee)** : Ajouter un check `hasPro` dans la condition d'affichage de page.tsx :

```tsx
// page.tsx ligne 2526
{session && hasPro && result.photoId && !dismissedAssociators.has(index)
```

**Option B** : Gater `/api/properties` GET pour les Pro uniquement et retourner un tableau vide sinon. Mais cela casserait la page `/mes-biens` pour les non-Pro qui y auraient acces.

**Decision** : a escalader au fondateur. Le gating Pro sur le PhotoAssociator est-il bien l'intention ?

---

## 3. Flow "Surfaces uniquement" -- photoId retourne

### Chemin serveur (route.ts, lignes 800-853)

```
withFurniture: false
  -> await pass1CachePromise (ligne 802)
  -> saveImage(outputBase64) AVEC AWAIT (ligne 810-811)
  -> saveUserPhoto() AVEC AWAIT (ligne 813-814)
  -> photoId = result de saveUserPhoto (ligne 813)
  -> return NextResponse.json({ ..., photoId }) (ligne 851)
```

| Verification | Verdict | Ligne(s) | Detail |
|---|---|---|---|
| `saveUserPhoto()` est appele | **PASS** | route.ts:813 | `photoId = await saveUserPhoto({...})` |
| `saveImage` est AWAIT (pas fire-and-forget) | **PASS** | route.ts:810-811 | `const outputKey = await saveImage(...)` avec `.catch(() => null)` |
| `photoId` est dans la reponse JSON | **PASS** | route.ts:851 | `...(photoId ? { photoId } : {})` -- conditionnel mais correct |
| Cas ou `outputKey` est null | **ATTENTION** | route.ts:811,823 | Si `saveImage` echoue, `outputKey` est `null`, `saveUserPhoto` n'est pas appele, `photoId` reste `null`. La reponse JSON n'inclut pas `photoId`. Le PhotoAssociator ne s'affiche pas. C'est un comportement degrade acceptable. |

**Verdict** : **PASS** -- Le flow "Surfaces uniquement" retourne correctement `photoId`.

---

## 4. Suppression photo -- resultat supprime

### Handler de suppression (page.tsx, lignes 1783-1816)

| Verification | Verdict | Ligne(s) | Detail |
|---|---|---|---|
| `setResults` filtre les resultats par `originalUrl` | **PASS** | 1793 | `prev.filter((r) => r.originalUrl !== removedUrl)` |
| `setVersions` nettoye | **PASS** | 1795-1798 | Filtre les versions dont le resultat correspondant matche l'URL supprimee. |
| `setActiveVersions` nettoye | **PASS** | 1799-1802 | Meme logique que versions. |
| `isGenerating` reset si derniere photo | **PASS** | 1804-1805 | `if (files.length <= 1) setIsGenerating(false)` |
| `isRefining` reset si derniere photo | **PASS** | 1806 | `setIsRefining(false)` |
| `error` reset si derniere photo | **PASS** | 1807 | `setError(null)` |
| Per-photo maps reindexees | **PASS** | 1810-1815 | `reindex()` decale les indices correctement. |
| Apres suppression + ajout nouvelle photo, peut-on generer ? | **PASS** | 432-439 | `useEffect` sur `files` reset toutes les per-photo maps. Le `canGenerate` se recalcule. |

### BUG DETECTE : `dismissedAssociators` n'est PAS reset

**Fichier** : page.tsx
**Lignes** : 936-973 (handleFullReset), 908-923 (handleReset)

`dismissedAssociators` (Set d'indices) n'est nettoye ni dans `handleFullReset` ni dans `handleReset`. Si l'utilisateur :
1. Genere des resultats
2. Dismiss le PhotoAssociator sur le resultat index 0
3. Fait un full reset
4. Genere de nouveaux resultats
5. Le nouveau resultat a l'index 0 ne montrera PAS le PhotoAssociator (l'index 0 est dans le Set)

**Severite** : HAUTE -- Le PhotoAssociator ne reapparait jamais apres un dismiss + reset.

### FIX

Ajouter dans `handleFullReset` (apres ligne 972) :
```tsx
setDismissedAssociators(new Set());
```

Ajouter dans `handleReset` (apres ligne 923) :
```tsx
setDismissedAssociators(new Set());
```

---

## 5. Bouton "Nouvelle session" (handleFullReset)

**Emplacement** : page.tsx, lignes 936-973

| State reset | Present | Ligne |
|---|---|---|
| `abortControllerRef.current?.abort()` | OUI | 937 |
| `setFiles([])` | OUI | 938 |
| `setSelectedStyles([])` | OUI | 939 |
| `setCustomPrompt("")` | OUI | 940 |
| `setPerPhotoStyles(new Map())` | OUI | 941 |
| `setPerPhotoRoomTypes(new Map())` | OUI | 942 |
| `setPerPhotoCustomPrompts(new Map())` | OUI | 943 |
| `setPerPhotoOutdoor(new Map())` | OUI | 944 |
| `setPerPhotoWithFurniture(new Map())` | OUI | 945 |
| `setPerPhotoFormat(new Map())` | OUI | 946 |
| `setSelectedRoomType(null)` | OUI | 947 |
| `setResults([])` | OUI | 948 |
| `setError(null)` | OUI | 949 |
| `setIsGenerating(false)` | OUI | 950 |
| `setPreprocessWarnings([])` | OUI | 951 |
| `setPhotoWarnings({})` | OUI | 952 |
| `setVersions([])` | OUI | 954 |
| `setActiveVersions([])` | OUI | 955 |
| `setIterationsRemaining(maxIterations)` | OUI | 956 |
| `setIsRefineModalOpen(false)` | OUI | 957 |
| `setRefineTargetIndex(0)` | OUI | 958 |
| `setIsRefining(false)` | OUI | 959 |
| `setRefineError(null)` | OUI | 960 |
| `setLastRefineComment("")` | OUI | 961 |
| `setRefineWarnings([])` | OUI | 962 |
| `setIsOutdoor(false)` | OUI | 964 |
| `setOutdoorSubtype("terrasse")` | OUI | 965 |
| `setSelectedOutdoorStyle(null)` | OUI | 966 |
| `setRegenerateConfirmIndex(null)` | OUI | 968 |
| `setIsRegenerating(false)` | OUI | 969 |
| `setRegeneratingIndex(null)` | OUI | 970 |
| `setPendingGeneration(false)` | OUI | 972 |
| **`setDismissedAssociators(new Set())`** | **NON** | -- |
| **`setRegeneratedIndex(null)`** | **NON** | -- |
| **`setGenerationElapsed(0)`** | **NON** | -- |
| **`setCurrentProcessing(0)`** | **NON** | -- |
| `setRefineElapsed(0)` | NON (auto par useEffect) | -- |
| `setRegenerateElapsed(0)` | NON (auto par useEffect) | -- |

### BUG 1 (HAUTE) : `dismissedAssociators` non reset -- detaille en section 4.

### BUG 2 (BASSE) : `regeneratedIndex` non reset. Si un badge "Nouveau resultat" est visible au moment du reset, il persisterait. Impact minimal car `setTimeout` le clear apres 3s, et les results sont vides.

### BUG 3 (NEGLIGEABLE) : `generationElapsed` et `currentProcessing` non reset. `generationElapsed` est auto-reset par le `useEffect` (ligne 386) qui detecte `isGenerating: false`. `currentProcessing` n'a d'impact que pendant une generation active.

---

## 6. Split-mode coherence -- photoId par passe

### Passe 1 (splitMode pass1)

**Fichier** : route.ts, lignes 792-797

```json
{
  "image": "...",
  "model": "...",
  "pass1_key": "...",
  "pendingPass2": true
}
```

`photoId` n'est PAS inclus dans la reponse splitMode pass1. **PASS** -- c'est correct, l'image n'est pas encore meublee, pas encore sauvegardee dans la galerie utilisateur.

### Passe 2 (pass2Only)

**Fichier** : route.ts, lignes 579-636

```json
{
  "image": "...",
  "model": "...",
  "pass1_key": "...",
  "photoId": "..." // si session utilisateur
}
```

`photoId` EST inclus (ligne 635 : `...(photoId ? { photoId } : {})`).

`saveUserPhoto` est appele AVEC AWAIT (lignes 580-604), AVANT la reponse JSON. **PASS**.

### Client merge du photoId

**Fichier** : page.tsx, lignes 756-764

```tsx
setResults((prev) => prev.map((r) =>
  r.pass1Key === p2Pass1Key
    ? { ...r, generatedUrl: p2Data.image, ..., photoId: p2Data.photoId || r.photoId }
    : r
));
```

**PASS** -- Le `photoId` de passe 2 est merge dans le resultat. Le PhotoAssociator s'affiche ensuite car `pass2Pending` passe a `false` et `photoId` est present.

### Regeneration split-mode

**Fichier** : page.tsx, lignes 1274-1277

```tsx
photoId: p2Data.photoId || r.photoId
```

**PASS** -- Meme pattern de merge.

---

## Resume des verdicts

| # | Verification | Verdict | Severite |
|---|---|---|---|
| 1a | PhotoAssociator visible apres piece meublee | **PASS** | -- |
| 1b | PhotoAssociator visible apres surfaces uniquement | **PASS** | -- |
| 1c | PhotoAssociator masque pendant passe 2 | **PASS** | -- |
| 1d | PhotoAssociator masque pendant affinage | **PASS** | -- |
| 1e | PhotoAssociator masque pendant regeneration | **PASS** | -- |
| 1f | PhotoAssociator visible apres affinage termine | **PASS** | -- |
| 1g | PhotoAssociator visible apres regeneration terminee | **PASS** | -- |
| 1h | PhotoAssociator masque si non connecte | **PASS** | -- |
| 1i | PhotoAssociator visible pour Decouverte si photoId | **PASS** | -- |
| 2 | Gating Pro/marchand sur PhotoAssociator | **FAIL** | HAUTE |
| 3 | Flow surfaces-only retourne photoId | **PASS** | -- |
| 4a | Suppression photo filtre les resultats | **PASS** | -- |
| 4b | Versions/activeVersions nettoyes | **PASS** | -- |
| 4c | isGenerating reset si derniere photo | **PASS** | -- |
| 4d | dismissedAssociators reset apres suppression | **FAIL** | HAUTE |
| 5a | handleFullReset reset tout | **FAIL** | HAUTE |
| 5b | handleReset reset tout | **FAIL** | HAUTE |
| 6a | splitMode pass1 ne retourne PAS photoId | **PASS** | -- |
| 6b | pass2Only retourne photoId (await) | **PASS** | -- |
| 6c | Client merge photoId de passe 2 | **PASS** | -- |

---

## Bugs trouves -- FIX a appliquer

### BUG 1 (HAUTE) : `dismissedAssociators` jamais reset

**Fichier** : `app/page.tsx`
**Impact** : Apres un full reset ou un reset simple, le PhotoAssociator ne reapparait plus sur les nouveaux resultats aux memes indices.

**FIX** :

Dans `handleFullReset` (apres ligne 972) ajouter :
```tsx
setDismissedAssociators(new Set());
```

Dans `handleReset` (apres ligne 923) ajouter :
```tsx
setDismissedAssociators(new Set());
```

### BUG 2 (HAUTE) : Pas de gating Pro sur PhotoAssociator

**Fichier** : `app/page.tsx`, ligne 2526
**Impact** : Tous les utilisateurs connectes (Decouverte, Starter, Pro) voient le PhotoAssociator si un `photoId` existe ET s'ils ont au moins un bien. Le fondateur souhaite que seuls les marchands (Pro) y aient acces.

**FIX PROPOSE** (a valider par le fondateur) :

```tsx
// page.tsx ligne 2526 — ajouter hasPro
{session && hasPro && result.photoId && !dismissedAssociators.has(index)
```

**Escalade** : Le fondateur doit confirmer si le gating Pro est bien l'intention. Si oui, @fullstack applique le fix.

---

**Handoff -> @fullstack**
- Fichiers a modifier : `app/page.tsx`
- Bug 1 : ajouter `setDismissedAssociators(new Set())` dans `handleFullReset` et `handleReset`
- Bug 2 : ajouter `hasPro &&` dans la condition d'affichage du PhotoAssociator (ligne 2526) -- en attente de confirmation fondateur
- Points d'attention : le composant `PhotoAssociator.tsx` lui-meme n'a aucun bug, les deux bugs sont dans `page.tsx`
