# QA Audit : Persistance des outputs de Thomas (Marchand de biens)

**Date** : 2026-03-25
**Agent** : @qa
**Branche** : claude/fix-lint-e2e-tests-4VmSc
**Scope** : Cycle de vie complet de chaque output du persona Thomas — photos generees, biens, dossiers, annonces, profil marchand, iterations, logs.

---

## 1. Photos generees (coeur du produit)

### Generation standard (pipeline 2 passes)

| Point de controle | Statut | Detail |
|---|---|---|
| Image input sauvegardee en Object Storage | OK | `saveImage(base64Image, "user_photo_{ts}_input")` dans route.ts:1455. Cle retournee : `logs/user_photo_{ts}_input.jpg`. |
| Image pass1 (surfaces) sauvegardee en Object Storage | OK | `saveImage(pass1Base64, "user_photo_{ts}_pass1")` dans route.ts:1457. Cle : `logs/user_photo_{ts}_pass1.jpg`. |
| Image output (meublee) sauvegardee en Object Storage | OK | `saveImage(outputBase64, "user_photo_{ts}_output")` dans route.ts:1456. Cle : `logs/user_photo_{ts}_output.jpg`. |
| Chemins en DB pointent vers cles Object Storage | OK | `user_photos` table stocke `input_image_key`, `output_image_key`, `pass1_image_key` — toutes au format `logs/xxx.jpg`. |
| `getUserPhotos()` charge via DB (cles seulement) | OK | La query SQL retourne les cles. L'affichage passe par `/api/logs/image`. |
| Galerie affiche les images apres redeploy | **BUG CRITIQUE CORRIGE** | Voir section Bugs ci-dessous. |

### Generation iteration (adjust/restyle)

| Point de controle | Statut | Detail |
|---|---|---|
| Image iteration sauvegardee en Object Storage | OK | `saveImage(outputBase64, "user_photo_iter{n}_{ts}_output")` dans route.ts:1274. |
| Pass1 iteration en Object Storage | OK | `saveImage(cached.imageBase64, "user_photo_iter{n}_{ts}_pass1")` dans route.ts:1275. |
| Iteration base en Object Storage | OK | `saveIterationBase(sessionId, imageBase64)` dans db.ts:324. Cle : `iteration-base/{sessionId}.jpg`. |
| Fallback si pas d'image base | OK | `getIterationBase()` retourne `null` gracieusement, le code gere ce cas. |
| Session ID stable entre requetes | OK | Le `sessionId` est genere cote client et envoye dans le body de chaque requete. Stable au sein d'une session de generation. |

### Logs de generation

| Point de controle | Statut | Detail |
|---|---|---|
| Logs en PostgreSQL | OK | Table `generation_logs`, INSERT via `logGeneration()` fire-and-forget. |
| Images des logs en Object Storage | OK | `saveImage()` appele pour input, pass1, output dans `logGeneration()` (db.ts:412-431). |
| `prompt_version` stocke | OK | `PROMPT_VERSION = "v21"` passe a chaque appel `logGeneration()`. |
| Prompts construits en DB | OK | `built_prompt_pass1` et `built_prompt_pass2` stockes dans `generation_logs`. |

---

## 2. Biens immobiliers

| Point de controle | Statut | Detail |
|---|---|---|
| Biens en PostgreSQL | OK | Table `properties`, CRUD dans `lib/properties.ts`. |
| 11 champs supplementaires (DPE, etage, etc.) | OK | Migration idempotente dans `ensurePropertiesTable()` avec pattern `ADD COLUMN ... EXCEPTION WHEN duplicate_column`. |
| Description GPT en DB | OK | Champs `description_generated` et `description_final` dans table `properties`. |
| Carte OSM en Object Storage | OK | `saveImage(base64, "map_property_{ts}")` dans `app/api/properties/route.ts:169`. Cle stockee dans `map_image_key`. |

---

## 3. Dossiers PDF

| Point de controle | Statut | Detail |
|---|---|---|
| Dossiers en PostgreSQL | OK | Table `dossiers` + `dossier_photos`, CRUD dans `lib/dossier.ts`. |
| Photos du dossier pointent vers Object Storage | OK | `input_image_key`, `output_image_key`, `pass1_image_key` dans `dossier_photos` referent les cles Object Storage des `user_photos` d'origine. |
| PDF genere a la volee ET stocke | OK | Genere a chaque GET `/api/dossier/[uuid]/pdf`, puis sauvegarde via `saveImage(pdfBase64, "dossier_{uuid}_pdf")` dans Object Storage. `pdf_storage_key` mis a jour en DB. |
| PDF persiste apres redeploy | OK | Stocke en Object Storage (pas filesystem). Mais le GET regenere systematiquement — le `pdf_storage_key` n'est jamais lu pour servir un cache. |

### WARNING : Regeneration PDF systematique

Le PDF est regenere a chaque telechargement meme si `pdf_storage_key` existe deja. Ce n'est pas un bug de persistance, mais un cout de performance inutile. Le PDF stocke en Object Storage n'est jamais reutilise.

---

## 4. Annonces

| Point de controle | Statut | Detail |
|---|---|---|
| Annonces en PostgreSQL | OK | Table `annonces`, CRUD dans `lib/annonce.ts`. |
| Photos de l'annonce viennent de user_photos (Object Storage) | OK | L'annonce reference `property_id`, les photos sont chargees via `user_photos.property_id`. Les images sont servies via `/api/logs/image?path=`. |
| Titre et status persistent | OK | Champs `title` et `status` dans table `annonces`. |
| Expiration a 90 jours | OK | `expires_at` calcule automatiquement a la creation. |

---

## 5. Profil marchand

| Point de controle | Statut | Detail |
|---|---|---|
| Profil en PostgreSQL | OK | Table `merchant_profiles`, UPSERT dans `lib/merchant.ts`. |
| Logo en Object Storage | OK | `uploadMerchantLogo()` utilise `saveImage()` (db.ts). Cle : `logs/merchant_logo_{userId}_{ts}.jpg`. |
| Logo servi via API | OK | `getMerchantLogo()` utilise `getImage()` (Object Storage). Affiche via `/api/logs/image?path=`. |
| Couleurs et police persistent | OK | `couleur_principale`, `couleur_secondaire`, `police` dans table `merchant_profiles`. Defaults : `#1C1C1E`, `#7D9B76`, `Inter`. |

---

## 6. Object Storage — Resilience (Sprint 19)

| Point de controle | Statut | Detail |
|---|---|---|
| `withStorageRetry` applique a toutes les operations | OK | `saveImage`, `getImage`, `savePass1Cache`, `getPass1Cache`, `getPass1Meta`, `saveIterationBase`, `getIterationBase` — tous wrapes. |
| Detection etat erreur du SDK | OK | `getStorage()` verifie `(client as any).state?.status === "error"` et reinitialise. |
| Retry avec reinit | OK | `withStorageRetry()` fait 1 retry automatique avec `storageClient = null` avant le 2e essai. |

---

## 7. Migrations DB — Idempotence

| Point de controle | Statut | Detail |
|---|---|---|
| `generation_logs` | OK | `CREATE TABLE IF NOT EXISTS` + pattern `ADD COLUMN ... EXCEPTION WHEN duplicate_column` pour toutes les colonnes ajoutees dans les sprints posterieurs. |
| `users` / `purchases` | OK | `CREATE TABLE IF NOT EXISTS`. `ADD COLUMN IF NOT EXISTS password_hash`. |
| `user_photos` | OK | `CREATE TABLE IF NOT EXISTS`. Pas de colonnes ajoutees posterieurement. |
| `properties` | OK | `CREATE TABLE IF NOT EXISTS` + migration idempotente pour 11 champs supplementaires. |
| `dossiers` / `dossier_photos` | OK | `CREATE TABLE IF NOT EXISTS` + migration idempotente pour colonnes d'enrichissement. |
| `annonces` | OK | `CREATE TABLE IF NOT EXISTS`. Pas de colonnes ajoutees posterieurement. |
| `merchant_profiles` | OK | `CREATE TABLE IF NOT EXISTS`. Pas de colonnes ajoutees posterieurement. |

**Verdict** : toutes les migrations sont idempotentes. Un redeploy Replit ne casse pas les tables existantes.

---

## BUGS TROUVES

### BUG CRITIQUE : Parametre query `?path=` vs `?file=` dans /api/logs/image

**Severite** : CRITIQUE (toutes les images cassees sauf admin)
**Fichier** : `/home/user/Architecture/app/api/logs/image/route.ts`
**Comportement observe** : L'endpoint ne lit que `req.nextUrl.searchParams.get("file")`. Or, 6 pages sur 7 utilisent `?path=` :

| Page | Parametre utilise | Fonctionne ? |
|---|---|---|
| `/admin` | `?file=` | OUI |
| `/ma-galerie` | `?path=` | NON (400 "Invalid file parameter") |
| `/mes-biens/[id]` | `?path=` | NON |
| `/compte` (logo) | `?path=` | NON |
| `/annonce/[uuid]` | `?path=` | NON |
| `/dossier/[uuid]` | `?path=` | NON |

**Impact** : AUCUNE image n'est visible dans la galerie, les biens, les annonces, les dossiers publics ni le profil marchand. Thomas ne voit pas ses visuels generes.

**Cause racine** : L'API a ete ecrite avec `?file=` (page admin), puis les autres pages ont ete developpees avec `?path=` sans mettre a jour l'API.

**Fix applique** : L'API accepte maintenant les deux parametres (`?file=` OU `?path=`).

---

## RISQUES IDENTIFIES

| # | Risque | Severite | Detail |
|---|---|---|---|
| 1 | PDF jamais servi depuis le cache Object Storage | BASSE | Le `pdf_storage_key` est ecrit en DB mais jamais lu. Chaque telechargement regenere le PDF complet (cout CPU + I/O Object Storage pour chaque image). Non bloquant mais gaspillage. |
| 2 | Race condition photoId response | BASSE | `Promise.race([photoIdPromise, timeout(50)])` dans route.ts:1478. Si le save prend >50ms, `photoId` est `null` dans la reponse. Le photo est quand meme sauvee en background, mais le client ne recoit pas l'ID. Impact : lien direct vers la photo impossible immediatement. |
| 3 | `inputImageKey` null pour iterations | INFO | route.ts:1279 : `inputImageKey: null` pour les iterations car l'image originale n'est pas dans le cache pass1. L'image d'input n'est pas liee a la photo d'iteration dans `user_photos`. Impact : pas d'avant/apres possible sur les photos d'iteration dans la galerie. |
| 4 | Aucun cleanup Object Storage | BASSE | Les images orphelines (generations echouees, anciennes iterations) ne sont jamais supprimees de l'Object Storage. Accumulation progressive. Non bloquant tant que le quota n'est pas atteint. |
| 5 | `dossier_photos.input_image_key` peut etre vide | BASSE | route.ts:130 : `inputImageKey: photo.input_image_key || ""`. Si `input_image_key` est null dans `user_photos` (cas iteration), le dossier photo a une chaine vide comme input. Le PDF n'affiche pas d'image "avant" pour cette photo. |

---

## RECOMMANDATIONS

1. **[FAIT]** Fix `?path=` vs `?file=` dans `/api/logs/image/route.ts` — corrige dans ce commit.
2. **[A FAIRE - @fullstack]** Ajouter un cache PDF : si `pdf_storage_key` existe en DB, servir directement depuis Object Storage au lieu de regenerer.
3. **[A FAIRE - @fullstack]** Stocker `inputImageKey` pour les iterations en le recuperant depuis `user_photos` de la generation originale (via `sessionId`).
4. **[A FAIRE - @infrastructure]** Planifier un job de cleanup Object Storage pour les cles orphelines (generations > 90 jours, dossiers expires).

---

## CHECKLIST RECAPITULATIVE

| # | Point | Statut |
|---|---|---|
| 1 | Images input en Object Storage | OK |
| 2 | Images pass1 en Object Storage | OK |
| 3 | Images output en Object Storage | OK |
| 4 | Images iteration en Object Storage | OK |
| 5 | Iteration base en Object Storage | OK |
| 6 | Chemins DB = cles Object Storage | OK |
| 7 | Galerie charge depuis Object Storage | OK (apres fix) |
| 8 | Biens en PostgreSQL | OK |
| 9 | 11 champs supplementaires migres | OK |
| 10 | Description GPT en DB | OK |
| 11 | Carte OSM en Object Storage | OK |
| 12 | Dossiers en PostgreSQL | OK |
| 13 | Photos dossier pointent Object Storage | OK |
| 14 | PDF genere a la volee + stocke | OK |
| 15 | Annonces en PostgreSQL | OK |
| 16 | Photos annonce via user_photos (OS) | OK |
| 17 | Titre/status annonce persistent | OK |
| 18 | Profil marchand en PostgreSQL | OK |
| 19 | Logo en Object Storage | OK |
| 20 | Couleurs/police persistent | OK |
| 21 | Logs generation en PostgreSQL | OK |
| 22 | Images logs en Object Storage | OK |
| 23 | prompt_version stocke | OK |
| 24 | Prompts construits en DB | OK |
| 25 | withStorageRetry sur toutes ops | OK |
| 26 | Migrations idempotentes | OK |
| 27 | Rien sur filesystem persistant | OK |
| 28 | API images accepte ?path= ET ?file= | OK (apres fix) |

**Verdict global** : La persistance est solide. Toutes les donnees sont en PostgreSQL ou Object Storage. Aucune utilisation du filesystem pour du stockage persistant. Le seul bug critique (parametre `?path=` ignore par l'API images) a ete corrige dans ce commit.
