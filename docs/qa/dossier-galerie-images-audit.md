# Audit images "avant" -- Dossiers + Galerie

Date : 2026-04-04 | Agent : @qa

## Verdicts

| # | Check | Verdict | Fichier:ligne | Detail |
|---|---|---|---|---|
| 1 | `input_image_key` sauve en DB a la creation dossier photo | **PASS** | `app/api/dossier/[uuid]/route.ts:138-153` | `saveImage()` await avant `addDossierPhoto()` qui recoit `imageKey` en param. Stockage synchrone. |
| 2 | Image input sauvee dans Object Storage AVANT la reponse (pas fire-and-forget) | **PASS** | `app/api/dossier/[uuid]/route.ts:138-141` | `const imageKey = await saveImage(...)` -- await bloquant, la reponse 201 n'est envoyee qu'apres. |
| 3 | DossierPublicView utilise le bon imageKey via StorageImage | **PASS** | `components/DossierPublicView.tsx:87-89` | `<StorageImage imageKey={photo.inputImageKey} .../>` passe la cle a StorageImage qui construit `/api/logs/image?path=...`. |
| 4 | StorageImage fallback quand imageKey est null/vide | **PASS** | `components/StorageImage.tsx:64` | `if (!imageKey \|\| failed)` affiche le fallback SVG placeholder. Pas de requete 404 envoyee. |
| 5 | API `/api/logs/image` lit correctement depuis Object Storage | **PASS** | `app/api/logs/image/route.ts:28-48` | Normalise la cle en `logs/{basename}`, tente la cle brute en fallback. Diagnostic si `"null"` / `"undefined"` recu. |
| 6a | Galerie F1 (generation normale) : `inputImageKey` sauve | **PASS** | `app/api/generate/route.ts:945-946` | `inputKey = await saveImg(base64Image, ...)` puis passe a `saveUserPhoto`. Await. |
| 6b | Galerie F1 (iteration) : `inputImageKey` sauve | **FAIL** | `app/api/generate/route.ts:460` | `inputImageKey: null` -- le commentaire dit "original input not available in iteration cache". L'image "avant" est absente dans la galerie pour toutes les iterations. |
| 6c | Galerie F1 (pass2Only) : `inputImageKey` sauve | **FAIL** | `app/api/generate/route.ts:592` | `inputImageKey: null` -- meme probleme que 6b. Pas d'input sauvegarde. |
| 6d | Galerie dossier (batch) : `inputImageKey` sauve | **PASS** | `app/api/dossier/[uuid]/route.ts:785-786` | `inputImageKey: photo.input_image_key` -- utilise la cle deja stockee en DB. |
| 6e | Galerie dossier (regeneration) : `inputImageKey` sauve | **PASS** | `app/api/dossier/[uuid]/route.ts:460` | `inputImageKey: targetPhoto.input_image_key` -- cle DB existante. |
| 7a | Fire-and-forget : batch `saveUserPhoto` | **FAIL** | `app/api/dossier/[uuid]/route.ts:782-794` | `.catch(err => console.error(...))` sans await. Le worker Replit peut etre tue avant que l'ecriture galerie aboutisse. Risque de photos dossier absentes de la galerie. |
| 7b | Fire-and-forget : regeneration `saveUserPhoto` | **FAIL** | `app/api/dossier/[uuid]/route.ts:458-470` | Meme pattern `.catch()` sans await, AVANT `return NextResponse.json()` a la ligne 472. Cependant la promise n'est pas attendue -- la reponse est envoyee immediatement, le worker peut mourir. |
| 7c | Fire-and-forget : PDF generation | **FAIL** | `app/api/dossier/[uuid]/route.ts:823` | `generateDossierPdfBackground(...).catch(...)` -- fire-and-forget apres la boucle batch. Moins critique (PDF = bonus) mais perdu sur autoscale. |

## Cause racine du bug "images avant qui ne s'affichent plus"

Le flow dossier sauve correctement `input_image_key` en DB (check 1 PASS). Le probleme n'est **pas** dans les dossiers eux-memes.

**Hypothese a verifier en priorite** : les "dossiers les plus recents" utilisent-ils des images dont la cle Object Storage a ete corrompue ou perdue ? Verifier en DB :

```sql
SELECT id, input_image_key, output_image_key FROM dossier_photos
WHERE input_image_key IS NULL OR input_image_key = ''
ORDER BY created_at DESC LIMIT 20;
```

Si des lignes ont `input_image_key = NULL`, le bug est en amont (upload non sauvegarde). Sinon, le bug est dans Object Storage (cle presente en DB mais image absente du bucket).

## Fixes recommandes

### FAIL 6b/6c -- `inputImageKey: null` sur iterations et pass2Only (galerie)

**Fichier** : `app/api/generate/route.ts`, lignes 460 et 592.

Le cache d'iteration (`getPass1Cache`) ne stocke pas l'image input originale. Deux options :
- **Option A** (recommandee) : stocker `inputImageKey` dans le cache pass1 (dans `savePass1Cache`) et le recuperer en iteration.
- **Option B** : chercher la `user_photos` row la plus recente pour ce style/user et copier son `input_image_key`.

Signale a @fullstack pour implementation.

### FAIL 7a/7b -- Fire-and-forget `saveUserPhoto` dans le dossier route

**Fichier** : `app/api/dossier/[uuid]/route.ts`.

- Ligne 458-470 (regeneration) : ajouter `await` devant `saveUserPhoto(...)` avant le `return NextResponse.json()`.
- Ligne 782-794 (batch) : remplacer `.catch(...)` par `await saveUserPhoto(...).catch(...)`. Le batch est deja en background (la reponse HTTP est deja partie a la ligne 521), donc le `await` ne bloque rien cote client mais garantit l'ecriture avant que le worker soit recycle.

### FAIL 7c -- Fire-and-forget PDF

Moins critique. Meme fix : `await generateDossierPdfBackground(...)` dans le bloc batch (la reponse HTTP est deja partie).

---

**Handoff -> @fullstack**
- Fichiers a modifier : `app/api/generate/route.ts` (lignes 460, 592), `app/api/dossier/[uuid]/route.ts` (lignes 458-470, 782-794, 823)
- Decisions : les `saveUserPhoto` DOIVENT etre awaites avant tout `return` ou fin de fonction sur Replit autoscale
- Points d'attention : verifier en DB si des `input_image_key` sont NULL sur les dossiers recents -- si oui, le bug est ailleurs (upload)
