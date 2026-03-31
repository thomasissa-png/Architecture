# Specs — Queue de génération asynchrone

**Date** : 2026-03-31
**Auteur** : @product-manager
**Destinataire** : @fullstack
**Statut** : Prêt pour implémentation

---

## 1. Schéma SQL — Table `generation_queue`

```sql
CREATE TABLE IF NOT EXISTS generation_queue (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ownership
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Input stocké dans Object Storage (clé, pas base64)
  input_image_key     TEXT NOT NULL,            -- ex : "queue/abc123_input.jpg"

  -- Prompts (identiques à ce que /api/generate reçoit)
  surface_prompt      TEXT NOT NULL,
  furniture_prompt    TEXT NOT NULL,
  style_id            VARCHAR(50),
  room_type           VARCHAR(50),
  is_outdoor          BOOLEAN DEFAULT FALSE,
  outdoor_subtype     VARCHAR(50),
  input_width         INT NOT NULL,
  input_height        INT NOT NULL,
  with_furniture      BOOLEAN NOT NULL DEFAULT TRUE,

  -- Statut de la file
  status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','processing','done','failed')),
  retry_count         INT NOT NULL DEFAULT 0,
  next_retry_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_until        TIMESTAMPTZ,              -- évite le double-traitement concurrent
  error_message       TEXT,
  abandon_reason      VARCHAR(50),              -- 'max_retries' | 'timeout' | 'non_transient'

  -- Output (rempli quand status = 'done')
  output_image_key    TEXT,                     -- clé Object Storage du résultat
  pass1_image_key     TEXT,                     -- clé Object Storage passe 1
  user_photo_id       UUID REFERENCES user_photos(id) ON DELETE SET NULL,

  -- Timing
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_queue_user     ON generation_queue (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_queue_status   ON generation_queue (status, next_retry_at)
  WHERE status IN ('pending', 'failed');       -- partial index : seuls les jobs actifs
CREATE INDEX IF NOT EXISTS idx_queue_user_status ON generation_queue (user_id, status);
```

**Colonnes clés :**

| Colonne | Rôle |
|---|---|
| `locked_until` | Timestamp jusqu'où le job est "réservé" par un worker. Évite qu'un second cron prenne le même job. Valeur : `NOW() + 3min`. Mis à NULL quand done/failed. |
| `next_retry_at` | Heure à partir de laquelle le job peut être repris. Le cron filtre `next_retry_at <= NOW()`. |
| `abandon_reason` | Enum pour distinguer l'abandon par épuisement des retries, timeout absolu, ou erreur non-transitoire. |
| `user_photo_id` | FK vers `user_photos` — remplie après succès. Permet au client de naviguer vers la photo depuis la notif. |

**Migration dans `ensureTable()` (lib/db.ts) :**
Ajouter l'appel `await ensureGenerationQueueTable()` dans `ensureTable()` après la création des tables existantes. Pattern identique à `ensureUserPhotosTable()` dans lib/user-photos.ts.

---

## 2. Flux de génération

### Scénario A — Succès immédiat (comportement actuel inchangé)

```
Client → POST /api/generate
         ↓
  Route : decrementCredit → pipeline 2 passes → succès
         ↓
  saveUserPhoto() → logGeneration() (fire-and-forget)
         ↓
  Response : { success: true, output: "data:image/jpeg;base64,..." }
```

Aucun changement dans ce scénario. Le Scénario B ne s'active que sur échec des 2 tentatives existantes.

### Scénario B — Échec après retries côté serveur

```
Client → POST /api/generate
         ↓
  Route : decrementCredit → pipeline 2 passes → ECHEC (après 2 tentatives, ~240s)
         ↓
  1. Sauvegarder l'image input dans Object Storage
     key = "queue/{timestamp}_{userId}_input.jpg"
  2. INSERT INTO generation_queue (user_id, input_image_key, surface_prompt,
     furniture_prompt, style_id, room_type, is_outdoor, outdoor_subtype,
     input_width, input_height, with_furniture)
  3. NE PAS rembourser le crédit maintenant (remboursé si abandon définitif)
         ↓
  Response HTTP 202 :
  {
    "queued": true,
    "queueId": "<uuid>",
    "message": "Génération en cours en arrière-plan. Vous serez notifié dès que c'est prêt."
  }
```

**Condition de bascule vers Scénario B :**
Tout `catch` dans la route `/api/generate` qui produit actuellement une réponse 500. Concrètement, wrapper le bloc de génération existant dans un try/catch de niveau route (pas par passe) et envoyer le 202 si `shouldQueue(error) === true`.

```typescript
function shouldQueue(error: unknown): boolean {
  if (!(error instanceof Error)) return true;
  const msg = error.message.toLowerCase();
  // Erreurs non-transitoires : ne pas queuer, renvoyer l'erreur directement
  const nonTransient = [
    'content_policy_violation',
    'invalid_request_error',
    'billing_hard_limit',
    'invalid_api_key',
  ];
  return !nonTransient.some((t) => msg.includes(t));
}
```

---

## 3. Worker / Cron

### Endpoint : `POST /api/cron/process-queue`

**Authentification :**
```typescript
const secret = request.headers.get('x-cron-secret');
if (secret !== process.env.CRON_SECRET) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```
Valeur de `CRON_SECRET` : chaîne aléatoire 32 chars, à ajouter dans les env vars Replit. L'appelant (Replit Cron ou service externe) envoie `X-Cron-Secret: <valeur>`.

**Fréquence d'appel :** toutes les 60 secondes. À configurer dans Replit Deployments > Cron Jobs : `* * * * *`, URL `https://versimo.fr/api/cron/process-queue`, méthode POST, header `x-cron-secret`.

**Logique du worker (pseudo-code) :**

```typescript
// 1. Claim jusqu'à 2 jobs disponibles (atomic pour éviter race condition)
const jobs = await db.query(`
  UPDATE generation_queue
  SET status = 'processing',
      locked_until = NOW() + INTERVAL '3 minutes',
      started_at = COALESCE(started_at, NOW()),
      updated_at = NOW()
  WHERE id IN (
    SELECT id FROM generation_queue
    WHERE status = 'pending'
      AND next_retry_at <= NOW()
      AND (locked_until IS NULL OR locked_until < NOW())
    ORDER BY created_at ASC
    LIMIT 2
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *
`);

// 2. Pour chaque job :
for (const job of jobs.rows) {
  try {
    // a. Abandon si trop vieux (45 min)
    if (Date.now() - new Date(job.created_at).getTime() > 45 * 60 * 1000) {
      await abandonJob(job.id, 'timeout');
      await addCredits(job.user_id, 1);  // remboursement
      continue;
    }

    // b. Récupérer l'image input depuis Object Storage
    const inputImageBytes = await getImage(job.input_image_key);
    const inputBase64 = Buffer.from(inputImageBytes).toString('base64');

    // c. Relancer le pipeline (appel interne, même logique que /api/generate)
    const result = await runGenerationPipeline({
      inputBase64,
      surfacePrompt: job.surface_prompt,
      furniturePrompt: job.furniture_prompt,
      styleId: job.style_id,
      roomType: job.room_type,
      isOutdoor: job.is_outdoor,
      outdoorSubtype: job.outdoor_subtype,
      width: job.input_width,
      height: job.input_height,
      withFurniture: job.with_furniture,
    });

    // d. Sauvegarder le résultat
    const outputKey = await saveImage(result.outputBase64, `${Date.now()}_${job.style_id}_queue_output`);
    const pass1Key = result.pass1Base64
      ? await saveImage(result.pass1Base64, `${Date.now()}_${job.style_id}_queue_pass1`)
      : null;

    const photoId = await saveUserPhoto({
      userId: job.user_id,
      inputImageKey: job.input_image_key,
      outputImageKey: outputKey,
      pass1ImageKey: pass1Key ?? null,
      styleId: job.style_id,
      roomType: job.room_type,
      isOutdoor: job.is_outdoor,
    });

    // e. Marquer done
    await db.query(`
      UPDATE generation_queue
      SET status = 'done',
          output_image_key = $2,
          pass1_image_key = $3,
          user_photo_id = $4,
          completed_at = NOW(),
          locked_until = NULL,
          updated_at = NOW()
      WHERE id = $1
    `, [job.id, outputKey, pass1Key, photoId]);

  } catch (error) {
    await handleJobError(job, error);
  }
}
```

**Gestion des erreurs (`handleJobError`) :**

```typescript
async function handleJobError(job: QueueJob, error: unknown) {
  const msg = error instanceof Error ? error.message.toLowerCase() : '';

  // Erreur non-transitoire : abandon immédiat
  const nonTransient = ['content_policy_violation', 'invalid_request_error', 'billing_hard_limit'];
  if (nonTransient.some((t) => msg.includes(t))) {
    await abandonJob(job.id, 'non_transient');
    await addCredits(job.user_id, 1);
    return;
  }

  const newRetryCount = job.retry_count + 1;

  // Max retries atteint (5 tentatives = retry_count 0,1,2,3,4)
  if (newRetryCount >= 5) {
    await abandonJob(job.id, 'max_retries');
    await addCredits(job.user_id, 1);
    return;
  }

  // Retry exponentiel
  const delayMinutes = [1, 2, 4, 8, 15][job.retry_count] ?? 15;
  await db.query(`
    UPDATE generation_queue
    SET status = 'pending',
        retry_count = $2,
        next_retry_at = NOW() + ($3 || ' minutes')::INTERVAL,
        locked_until = NULL,
        error_message = $4,
        updated_at = NOW()
    WHERE id = $1
  `, [job.id, newRetryCount, delayMinutes, msg.slice(0, 500)]);
}

async function abandonJob(id: string, reason: string) {
  await db.query(`
    UPDATE generation_queue
    SET status = 'failed',
        abandon_reason = $2,
        locked_until = NULL,
        updated_at = NOW()
    WHERE id = $1
  `, [id, reason]);
}
```

**Tableau des délais de retry :**

| Tentative | retry_count avant | Délai |
|---|---|---|
| 1re | 0 | 1 min |
| 2e | 1 | 2 min |
| 3e | 2 | 4 min |
| 4e | 3 | 8 min |
| 5e | 4 | 15 min |
| Abandon | 5 | — |

**Factorisation `runGenerationPipeline()` :**
Extraire la logique de génération de `app/api/generate/route.ts` dans `lib/generation-pipeline.ts`. Ce module exporte une fonction pure `runGenerationPipeline(params)` que consomment à la fois `route.ts` et le worker cron. Pas de duplication de logique.

---

## 4. Notifications

### Phase 1 — Polling (sans email)

**Endpoint de statut :**
```
GET /api/generation/[id]/status
Auth : session NextAuth obligatoire
```

Réponse :
```typescript
// pending ou processing
{ "status": "pending" | "processing", "retryCount": number, "createdAt": string }

// done
{
  "status": "done",
  "userPhotoId": "uuid",
  "outputImageKey": "logs/xxx_output.jpg",
  "createdAt": string,
  "completedAt": string
}

// failed
{
  "status": "failed",
  "abandonReason": "max_retries" | "timeout" | "non_transient",
  "creditRefunded": true
}
```

Sécurité : vérifier que `generation_queue.user_id = session.user.id`. Retourner 404 si le job n'appartient pas à l'utilisateur.

**Stratégie de polling côté client (hook `useQueueStatus`) :**

```typescript
// Intervalle adaptatif : agressif au début, puis se ralentit
const POLL_INTERVALS = [5, 5, 10, 10, 30, 60]; // secondes, index = nombre de polls effectués

// Arrêt automatique : si status = done ou failed, ou après 50 minutes
// Conservation entre navigations : stocker le queueId dans localStorage
// clé : "versimo_queue_pending" → { id, createdAt }
```

**Badge header :**
Ajouter dans le Header un badge "1 génération en cours" tant que localStorage contient un `queueId` actif. Le badge disparaît quand le statut passe à `done` ou `failed`.

**Toast retour sur le site :**
Au chargement de n'importe quelle page, lire localStorage. Si `queueId` présent et statut = `done` : afficher un toast vert "Votre génération est prête — Voir le résultat" avec lien vers `/ma-galerie`. Si `failed` : toast rouge + message de remboursement (voir section 6). Supprimer l'entrée localStorage après affichage du toast.

**Comportement de `/ma-galerie` :**
Requête supplémentaire `GET /api/generation/[id]/status` si `queueId` en localStorage. Si `done`, ajouter la photo en tête de liste sans recharger la page entière. Les jobs `pending`/`processing` affichent une card placeholder en tête de galerie avec un spinner et le label du style.

### Phase 2 — Email transactionnel

**Déclencheur :** dans le worker, après le `UPDATE status = 'done'`, appeler `sendGenerationReadyEmail()` en fire-and-forget.

**Sujet :** `Votre visuel Versimo est prêt — [Nom du style]`

**Contenu :**
```
Bonjour [prénom ou "vous" si pas de prénom],

Votre génération [style] est terminée.

[Bouton CTA] → Voir mon visuel

Ce visuel est disponible dans votre galerie à tout moment.

— L'équipe Versimo
```

**CTA URL :** `https://versimo.fr/ma-galerie?highlight=[userPhotoId]`
Le paramètre `highlight` fait défiler et met en surbrillance la photo concernée.

**Provider email :** à choisir par @fullstack (Resend recommandé — SDK minimal, gratuit jusqu'à 3 000 emails/mois). Variable d'env : `RESEND_API_KEY`.

**Ne pas envoyer si :** l'utilisateur n'a pas d'email vérifié (Google auth = toujours vérifié, credentials = vérifier `email_verified` si le champ existe).

---

## 5. Remboursement de crédit

**Règle :** le crédit est débité au lancement (Scénario A et B). Remboursement uniquement en cas d'abandon définitif.

**Triggers de remboursement :**
1. `abandonJob(id, 'max_retries')` → `addCredits(userId, 1)`
2. `abandonJob(id, 'timeout')` → `addCredits(userId, 1)`
3. `abandonJob(id, 'non_transient')` → `addCredits(userId, 1)`

**Idempotence :** avant d'appeler `addCredits`, vérifier que le statut actuel n'est pas déjà `failed` (évite un double-remboursement si le cron crashe en cours de route) :
```sql
UPDATE generation_queue SET status='failed', ... WHERE id=$1 AND status != 'failed'
RETURNING id
-- Si rowCount = 0 : déjà abandonné, ne pas rappeler addCredits
```

**Message dans l'interface :**
Toast rouge :
> "Votre génération n'a pas pu être traitée malgré plusieurs tentatives. Votre crédit a été remboursé automatiquement."

Toast distinct si `non_transient` :
> "Cette image n'a pas pu être traitée (contenu non compatible). Votre crédit a été remboursé."

---

## 6. UX Client — Messages par statut

| Statut | Zone d'affichage | Message exact |
|---|---|---|
| Envoi en queue (202 reçu) | Toast vert + modal légère | "Génération lancée en arrière-plan. Vous serez notifié dès que c'est prêt — vous pouvez fermer cette page." |
| `pending` (polling) | Badge header + card galerie | "Génération en cours — arrivée estimée dans quelques minutes" |
| `processing` (polling) | Badge header + card galerie | "Génération en cours — traitement démarré" |
| `done` (retour site) | Toast vert | "Votre visuel est prêt ! [Voir le résultat →]" |
| `failed` abandon max_retries | Toast rouge | "Votre génération n'a pas pu être traitée malgré plusieurs tentatives. Votre crédit a été remboursé automatiquement." |
| `failed` abandon timeout | Toast rouge | "Votre génération a expiré (délai dépassé). Votre crédit a été remboursé automatiquement." |
| `failed` non_transient | Toast rouge | "Cette image n'a pas pu être traitée (contenu non compatible). Votre crédit a été remboursé." |

**Card placeholder dans `/ma-galerie` (job pending/processing) :**
- Position : en tête de liste, avant les photos existantes
- Contenu : fond gris animé (skeleton), label du style en bas, spinner top-right
- Disparaît automatiquement quand le polling détecte `done` et insère la vraie photo

---

## 7. Fichiers à créer / modifier

| Fichier | Action | Contenu |
|---|---|---|
| `lib/generation-queue.ts` | Créer | Fonctions DB : `enqueueGeneration()`, `claimJobs()`, `markDone()`, `markFailed()`, `ensureQueueTable()` |
| `lib/generation-pipeline.ts` | Créer | Extraction de la logique génération depuis `route.ts` → `runGenerationPipeline(params)` |
| `app/api/generate/route.ts` | Modifier | Import `runGenerationPipeline`, catch → `shouldQueue()` → enqueue → 202 |
| `app/api/cron/process-queue/route.ts` | Créer | Worker cron (voir section 3) |
| `app/api/generation/[id]/status/route.ts` | Créer | Polling endpoint (voir section 4) |
| `lib/db.ts` | Modifier | Appel `ensureQueueTable()` dans `ensureTable()` |
| `lib/hooks/useQueueStatus.ts` | Créer | Hook React polling adaptatif + localStorage |
| `components/QueueStatusBadge.tsx` | Créer | Badge header "N génération(s) en cours" |
| `components/QueuePlaceholderCard.tsx` | Créer | Card skeleton pour galerie |
| `app/ma-galerie/page.tsx` | Modifier | Intégration `useQueueStatus` + card placeholder |

---

## 8. Contraintes et points d'attention pour @fullstack

**Concurrence cron :** le `FOR UPDATE SKIP LOCKED` dans la requête de claim est obligatoire. Sans lui, deux instances cron lancées simultanément prennent le même job. Le `locked_until` est une sécurité secondaire pour le cas où un worker crashe avant de marquer done/failed.

**Taille du payload input en queue :** l'image input peut faire jusqu'à 2 Mo (après resize client). Stocker dans Object Storage (clé dans la table), pas en colonne BYTEA. La clé `queue/{timestamp}_{userId}_input.jpg` est créée dans `/api/generate` avant d'insérer la ligne queue.

**Pas de WebSocket ni SSE :** le polling est suffisant pour ce cas d'usage (résultat attendu en 1-15 min). Replit ne supporte pas les connexions longue durée de manière fiable.

**`runGenerationPipeline()` doit être sans état :** pas de référence à `NextRequest`, pas d'utilisation de `headers()` ou `cookies()`. Accepte uniquement des paramètres scalaires + `inputBase64`. Compatible route handler et worker cron.

**Timeout dans le worker :** envelopper `runGenerationPipeline()` dans un `withTimeout(promise, 130_000, 'queue-pipeline')`. Si timeout → traiter comme erreur transitoire → retry.

**ESLint :** vérifier les imports inutilisés après extraction vers `generation-pipeline.ts`. Lancer `npx next lint` avant de committer (règle critique CLAUDE.md).

---

## Handoff → @fullstack

- **Fichier produit** : `/home/user/Architecture/docs/product/generation-queue-specs.md`
- **Décisions prises** :
  - Polling Phase 1 (pas de WebSocket ni SSE — incompatible Replit)
  - Scénario B uniquement sur échec (Scénario A inchangé — zéro régression)
  - `runGenerationPipeline()` extrait en lib partagée (factorisation obligatoire, pas de duplication)
  - `FOR UPDATE SKIP LOCKED` pour la concurrence cron
  - Remboursement idempotent via vérification statut avant UPDATE
  - Phase 2 email : Resend recommandé, implémentation après Phase 1 validée en prod
- **Points d'attention** :
  - Extraction de `generation-pipeline.ts` est le prérequis de tout le reste — commencer par là
  - Le schéma SQL s'intègre dans le pattern `ensureTable()` existant de `lib/db.ts` — ne pas créer un nouveau mécanisme de migration
  - L'image input doit être sauvegardée dans Object Storage AVANT d'insérer la ligne queue (si le save échoue, on ne queue pas)
  - Tester le cas `locked_until` expiré sans status=done/failed (worker crashé) : le prochain cron doit reprendre le job
