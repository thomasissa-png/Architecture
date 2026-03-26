# Audit Persistance Photos Utilisateur

**Date** : 2026-03-26 | **Agent** : @qa | **Statut** : 2 BUG, 2 RISK, 4 OK

---

## Diagramme du flow complet

```
Generation (route.ts)
  |
  +--> saveImage(base64, key) --> Object Storage (Replit)  [OK - persistant]
  |       |
  |       +--> retry x1 si echec + read-after-write verify
  |
  +--> saveUserPhoto({userId, outputImageKey, ...}) --> INSERT user_photos  [OK - conditionnel]
  |       |
  |       +--> SKIP si outputKey est null (evite entree sans image)
  |       +--> Await max 8s (Promise.race) avant retour reponse
  |
  v
Ma galerie (GET /api/user/photos)
  |
  +--> getServerSession() --> session.user.id  [BUG si id change]
  |
  +--> getUserPhotos(session.user.id) --> SELECT FROM user_photos WHERE user_id = $1
  |
  +--> Affichage: /api/logs/image?path={output_image_key}
          |
          +--> getImage(key) --> Object Storage download  [OK]
```

---

## Audit point par point

### 1. Sauvegarde lors de la generation — OK

**Fichier** : `app/api/generate/route.ts` (lignes 1471-1531)

- `saveImage` est appele AVANT `saveUserPhoto` — correct
- Si `saveImage` echoue (retry x1 inclus), `outputKey` est null et `saveUserPhoto` est SKIP — correct, evite les entrees fantomes
- Le `photoId` retourne dans la reponse JSON est bien celui de `user_photos`
- Timeout 8s sur le `Promise.race` — suffisant pour 2 tentatives Object Storage

**Verdict : OK** — Le flow de sauvegarde est robuste.

### 2. Schema user_photos — OK

**Fichier** : `lib/user-photos.ts`

- `user_id VARCHAR(255) NOT NULL` — pas de FK vers users (intentionnel, evite les blocages)
- Index sur `user_id` — les requetes galerie sont performantes
- `output_image_key` peut etre NULL (generations echouees ou anciennes)
- `getUserPhotos` filtre `output_image_key IS NOT NULL` uniquement si `unassociatedOnly` — les entrees sans output SONT retournees en mode normal

**Verdict : OK** — Schema correct. Note : les entrees avec `output_image_key = NULL` apparaissent dans la galerie et affichent "Image non disponible".

### 3. Recuperation dans Ma galerie — OK

**Fichier** : `app/api/user/photos/route.ts`

- Utilise `getServerSession(authOptions)` pour obtenir `session.user.id`
- Passe directement a `getUserPhotos(session.user.id)` — pas de transformation
- `force-dynamic` present — pas de cache Next.js

**Verdict : OK** — Le code de recuperation est correct. Le probleme est en amont (stabilite du user_id).

### 4. Stabilite du user_id entre sessions — BUG

**Fichiers** : `lib/auth.ts`, `lib/credits.ts`, `app/api/auth/register/route.ts`

#### Credentials (email/password)

- Inscription : `id = email_{timestamp}_{random}` (ligne 66 de register/route.ts)
- Connexion : `authorize()` fait `SELECT WHERE email` et retourne le `id` existant de la DB
- JWT callback : `token.userId = user.id` (le id de la DB)

**Verdict pour credentials seul : OK** — Le id est stable entre sessions. Meme si NEXTAUTH_SECRET change, `authorize()` re-lit le id depuis la DB par email.

#### Google OAuth

- `id = google_{providerAccountId}` — stable tant que le compte Google est le meme
- `ensureUser()` appele au `signIn` — upsert `ON CONFLICT (id)`

**Verdict pour Google seul : OK** — Le id est stable.

#### BUG CRITIQUE : Cross-provider (meme email, providers differents)

**Scenario** :
1. User s'inscrit par email → `id = email_1711234_abc123`
2. User genere des photos → `user_photos.user_id = email_1711234_abc123`
3. User se deconnecte, se reconnecte via Google → `id = google_987654321`
4. `ensureUser()` detecte le mismatch (log DANGER) mais :
   - INSERT avec `google_987654321` + meme email → **ECHEC** sur contrainte `UNIQUE(email)` car l'ancien row `email_1711234_abc123` existe toujours
   - `ON CONFLICT (id)` ne matche pas (id different)
   - Le signIn **plante silencieusement** ou retourne une erreur
5. Meme si l'INSERT reussissait : `ensureUser()` migre role et credits mais **NE MIGRE PAS user_photos**

**Deux bugs** :
- **BUG-A** : `ensureUser` fait `ON CONFLICT (id)` mais devrait gerer `ON CONFLICT (email)` quand un id change pour le meme email. L'ancien row n'est jamais supprime.
- **BUG-B** : `ensureUser` migre `role` et `credits_remaining` mais **oublie `user_photos`**. Meme si la migration d'id reussissait, les photos de l'ancien id seraient orphelines.

**Verdict : BUG** — Les photos deviennent inaccessibles si l'utilisateur change de provider d'authentification.

### 5. Object Storage persistance — OK avec RISK

**Fichier** : `lib/db.ts` (lignes 144-238)

- Utilise `@replit/object-storage` — persistant a travers les redeploys (confirme CLAUDE.md Sprint 16, point 146)
- `withStorageRetry()` gere le sidecar instable (reinit client)
- `saveImage()` fait un read-after-write verify + retry

**Verdict : OK** — Les images survivent aux redeploys. Le SDK est fragile mais le retry compense.

**RISK** : Le sidecar Object Storage peut etre temporairement indisponible apres un redeploy. Si un utilisateur genere pendant ce court laps de temps, `saveImage` peut echouer 2 fois → `saveUserPhoto` est skip → photo perdue.

### 6. Scenario de persistence post-reconnexion — RISK

| Scenario | Resultat | Explication |
|---|---|---|
| Credentials → deconnexion → reconnexion credentials | **OK** | Meme id (SELECT by email) |
| Google → deconnexion → reconnexion Google | **OK** | Meme id (google_{providerAccountId}) |
| Credentials → reconnexion Google (meme email) | **BUG** | Id different, migration incomplete, photos orphelines |
| Google → reconnexion credentials (meme email) | **DEPEND** | Si register detecte le Google account, lie le password au meme row (OK). Mais authorize retourne l'id du row Google → OK seulement si l'id Google etait le row principal. |
| Redeploy → reconnexion | **OK** | DB PostgreSQL persistante, Object Storage persistant |

---

## Resume des defaillances

| # | Severite | Description | Fichier | Fix propose |
|---|---|---|---|---|
| BUG-A | CRITIQUE | `ensureUser()` echoue sur UNIQUE(email) quand le meme email arrive avec un id different | `lib/credits.ts:22-48` | Ajouter `DELETE FROM users WHERE email = $1 AND id != $2` avant INSERT, ou utiliser `ON CONFLICT (email)` |
| BUG-B | CRITIQUE | Migration d'id dans `ensureUser()` ne migre pas `user_photos.user_id` | `lib/credits.ts:33-48` | Ajouter `UPDATE user_photos SET user_id = $new WHERE user_id = $old` dans le bloc de migration |
| RISK-1 | MOYENNE | Object Storage indisponible temporairement post-deploy → photo skip | `lib/db.ts` | Deja mitige par retry. Ajouter un mecanisme de re-save depuis le base64 encore en memoire client. |
| RISK-2 | BASSE | Entrees `user_photos` avec `output_image_key = NULL` visibles dans la galerie | `lib/user-photos.ts:137` | Filtrer `output_image_key IS NOT NULL` par defaut dans `getUserPhotos` |

---

## Fix prioritaire recommande pour @fullstack

```
// Dans lib/credits.ts, bloc migration (ligne 33-48), AJOUTER :
// Migrate user_photos from old id to new id
await db.query(
  `UPDATE user_photos SET user_id = $1 WHERE user_id = $2`,
  [user.id, oldId]
);
console.log(`[ensureUser] Migrated user_photos from old="${oldId}" to new="${user.id}"`);
```

Et remplacer le `INSERT ... ON CONFLICT (id)` par un flow qui gere le conflit email :
```
// Delete old row if same email but different id (provider switch)
if (existing.rows.length > 0 && existing.rows[0].id !== user.id) {
  await db.query(`DELETE FROM users WHERE id = $1`, [existing.rows[0].id]);
}
// Then INSERT ... ON CONFLICT (id) DO UPDATE (safe now)
```

---

**Handoff --> @fullstack**
- Fichier produit : `docs/qa/image-persistence-audit.md`
- Decisions : 2 bugs critiques identifies (migration user_photos + conflit email UNIQUE)
- Points d'attention : Le fix de `ensureUser` doit etre transactionnel (BEGIN/COMMIT) pour eviter une race condition entre DELETE et INSERT. Tester le scenario cross-provider (credentials puis Google, meme email) apres le fix.
