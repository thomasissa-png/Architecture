# Revue croisee -- Systeme de Replay de Prompts -- 2026-03-24

## Resume executif (non-technique)

Le systeme de replay permet de rejouer une generation passee avec les prompts actuels, pour comparer les resultats avant/apres modification de prompts. L'implementation est fonctionnelle et bien structuree, mais presente deux problemes importants : (1) les endpoints de replay sont accessibles sans aucune authentification, ce qui permet a n'importe qui de declencher des generations couteuses en boucle, et (2) les prompts construits ne sont pas retournes dans la reponse du replay car /api/generate ne les inclut pas dans son JSON. Le batch est correctement borne a 20 et sequentiel. La comparaison d'images est solide. On peut avancer avec ces reserves.

## Resume technique

Etat general : implementation coherente, conventions de logging respectees, TypeScript propre. Deux problemes HAUTE priorite (absence d'auth sur /api/replay, prompts construits toujours null dans la reponse). Pas de bloquant -- le systeme est utilisable pour les audits agents, mais le risque d'abus API est reel en production.

**Recommandation : GO avec reserves**

---

## Audit detaille par fichier

### 1. app/api/replay/route.ts -- Replay unitaire

| Point | Verdict | Detail |
|-------|---------|--------|
| Validation input | OK | `sourceGenerationId` verifie, 404 si generation introuvable |
| Chargement image source | OK | Gestion correcte des 3 cas (pass 2 only, pass 1+2, erreur storage) |
| Resolution prompts | OK | Override ou reutilisation source, logique propre |
| Appel interne /api/generate | OK | Via fetch interne avec origin, forwarding IP |
| Gestion erreurs generation | OK | Propagation du status code et message d'erreur |
| Calcul metriques | OK | try/catch, graceful si image source indisponible |
| Logging DB | OK | logGenerationReturningId avec tous les champs replay |
| Reponse JSON | PROBLEME | `genData.built_prompt_pass1` et `built_prompt_pass2` seront toujours `null` (voir H-02) |
| Rate limiting | PROBLEME | Aucun rate limiting propre -- delegue a /api/generate via x-forwarded-for, mais l'IP forwardee est celle du serveur lui-meme pour les appels internes (voir H-01) |
| Authentification | PROBLEME | Aucune -- endpoint public (voir H-01) |
| TypeScript | OK | Types corrects, pas de `any` implicite |

**Observations supplementaires :**

- Ligne 82-84 : le MIME type est force a `image/jpeg` pour toutes les images. Si l'image source est PNG, le data URI sera incorrect. Impact faible car le pipeline accepte les deux, mais c'est une approximation.
- Ligne 91 : `withFurniture: replayPass === 1 ? false : (src.with_furniture ?? true)` -- logique correcte.
- Ligne 100-102 : le commentaire explique honnetement que passer la pass1 comme input pour un replay pass-2-only est une approximation (re-passe 1 sur surfaces deja finies). C'est acceptable pragmatiquement.
- Ligne 154 : `builtPromptPass1: '[REPLAY of #${sourceGenerationId}]'` -- le prompt construit reel de la passe 1 du replay n'est pas stocke. Seul un marqueur est mis. C'est une perte d'information pour les audits (voir M-01).

### 2. app/api/replay/batch/route.ts -- Batch replay

| Point | Verdict | Detail |
|-------|---------|--------|
| Validation input | OK | Array non vide, replayLabel requis |
| Limite batch | OK | Max 20 -- raisonnable |
| Execution sequentielle | OK | Boucle `for...of`, pas de parallelisme |
| Gestion erreurs par item | OK | try/catch individuel, un echec n'arrete pas le batch |
| Summary | OK | Calcul correct des moyennes (avec filtre null) |
| Authentification | PROBLEME | Meme absence d'auth que le replay unitaire |

**Observations supplementaires :**

- Ligne 43 : `ensureTable()` est appele mais le batch ne fait aucune query DB directe -- il delegue tout a /api/replay. L'appel est inutile mais inoffensif.
- Le batch n'a pas de delai entre les replays. Si /api/generate prend 30-90s par generation, un batch de 20 = 10-30 minutes. Le `maxDuration: 300` (5 min) peut etre insuffisant pour un batch plein. C'est un risque de timeout (voir M-02).
- Pas de mecanisme d'annulation en cours de batch.

### 3. lib/db.ts -- Colonnes replay + logGenerationReturningId

| Point | Verdict | Detail |
|-------|---------|--------|
| ALTER TABLE pattern | OK | `DO $$ BEGIN ... EXCEPTION WHEN duplicate_column THEN NULL; END $$;` -- pattern PostgreSQL correct et idempotent |
| Types colonnes | OK | BOOLEAN, INT, VARCHAR(200), FLOAT -- types adequats |
| logGenerationReturningId | OK | RETURNING id, gestion null, memes parametres que logGeneration |
| Duplication code | PROBLEME | logGenerationReturningId duplique ~80 lignes de logGeneration. Seule difference : `RETURNING id` et le return type (voir M-03) |
| GenerationLogParams | OK | Champs replay correctement ajoutes avec types optionnels |
| INSERT colonnes count | OK | 34 colonnes, 34 parametres -- alignment verifie |

### 4. lib/image-metrics.ts -- Comparaison d'images

| Point | Verdict | Detail |
|-------|---------|--------|
| Import sharp | OK | Import ES module, sharp est bundle avec Next.js |
| Robustesse si sharp absent | PROBLEME MINEUR | Si sharp n'est pas disponible, l'import crash le module entier. Pas de fallback (voir M-04) |
| Decode RGBA | OK | sharp avec ensureAlpha + raw, correct |
| Resize si dimensions differentes | OK | Resize B vers A avec `fit: "fill"` -- approche pragmatique |
| Pixel diff | OK | Seuil 30/255, logique par canal, pourcentage correct |
| Color histogram | OK | Normalisation en distribution de probabilite, L1 distance, scale 0-255 |
| Precision | OK | Arrondi a 2 decimales |
| Performance | ACCEPTABLE | Boucle pixel-par-pixel en JS. Pour des images 1536x1024 (~1.5M pixels), cela prend quelques centaines de ms. Acceptable pour un outil d'audit, pas pour du temps reel. |

**Observation mathematique :** la normalisation du colorShiftScore (ligne 111) est correcte. La distance L1 max entre deux distributions de probabilite est 2.0 par canal, donc 6.0 pour RGB. Le scaling vers 0-255 donne une echelle lisible.

### 5. app/api/logs/route.ts -- Champs replay dans le SELECT

| Point | Verdict | Detail |
|-------|---------|--------|
| Champs replay | OK | `is_replay, replay_source_id, replay_label, pixel_diff_pct, color_shift_score` tous presents dans le SELECT |
| Coherence avec ensureTable | OK | Les colonnes demandees correspondent aux colonnes ajoutees par ALTER TABLE |
| force-dynamic | OK | Present, pas de cache Next.js |
| LIMIT 50 | ACCEPTABLE | Pour l'admin, 50 est suffisant. Pour un audit batch de 20+20, les replays les plus anciens pourraient etre tronques. Pas critique. |

### 6. app/admin/page.tsx -- UI replay

| Point | Verdict | Detail |
|-------|---------|--------|
| Interface LogEntry | OK | Tous les champs replay presents avec types corrects (nullable) |
| Badge REPLAY | OK | Affiche avec source ID et label |
| Metriques affichees | OK | pixel_diff_pct et color_shift_score dans le header de la log entry |
| Bouton Rejouer | OK | Conditionnel (success + input_image_path + pas deja un replay) |
| ReplayButton | OK | Label editable, loading state, resultat affiche, refresh des logs apres |
| Pas de replay recursif | OK | `!log.is_replay` empeche de rejouer un replay |
| Accessibilite | MINEURE | Le bouton n'a pas de `aria-label` ni de `aria-busy` pendant le loading. Pas critique pour une page admin. |

---

## Contradictions detectees

| Livrable A | Livrable B | Contradiction | Criticite | Resolution proposee |
|---|---|---|---|---|
| replay/route.ts (L174) | generate/route.ts (L1267-1271) | Le replay lit `genData.built_prompt_pass1` et `genData.built_prompt_pass2` mais /api/generate ne retourne PAS ces champs dans sa reponse JSON. Resultat : toujours `null` dans la reponse replay. | HAUTE | @fullstack : ajouter `builtPromptPass1` et `builtPromptPass2` dans le JSON retourne par /api/generate (3 endroits : iteration, surfaces-only, full pipeline) |
| replay/route.ts (aucune auth) | admin/page.tsx (auth via ADMIN_PASSWORD) | L'admin est protege par mot de passe, mais /api/replay est ouvert a tous. N'importe qui peut declencher des generations couteuses (~$0.05-0.10/generation) sans authentification. | HAUTE | @fullstack : proteger /api/replay et /api/replay/batch avec le meme mecanisme ADMIN_PASSWORD (header ou cookie) |
| replay/route.ts (L109-110) | generate/route.ts (L948) | Le replay forward `x-forwarded-for` vers /api/generate, mais comme l'appel est interne (fetch localhost), le rate limiter voit l'IP du client original OU `127.0.0.1`. Un batch de 20 replays depuis la meme IP declenche le rate limit (10/min). | HAUTE | @fullstack : soit bypasser le rate limit pour les appels internes (header secret), soit augmenter la limite pour les replays |
| replay/route.ts (L154) | lib/db.ts (logGenerationReturningId) | Le `builtPromptPass1` du replay est stocke comme `[REPLAY of #X]` au lieu du vrai prompt construit. Perte d'information pour les audits agents. | MOYENNE | @fullstack : stocker le vrai prompt construit (le recuperer depuis la reponse /api/generate une fois H-02 corrige) |

---

## Angles morts

1. **Pas de protection contre le cout** : un utilisateur malveillant peut POST sur /api/replay en boucle et generer des couts API OpenAI/Replicate illimites. Le rate limit de /api/generate (10/min) est la seule protection, mais elle est bypassable si l'IP forwardee est `127.0.0.1`.

2. **Pas de nettoyage des images replay** : chaque replay sauvegarde des images dans Object Storage (input + output). Un batch de 20 replays = ~40 images supplementaires. Pas de TTL ni de purge automatique. Sur un usage d'audit regulier, le storage va grossir lineairement.

3. **Pas de filtrage des replays dans /api/logs** : les 50 derniers logs incluent les replays, ce qui peut "noyer" les generations utilisateur reelles dans la liste admin. Un filtre `?exclude_replays=true` serait utile.

4. **Timeout batch** : `maxDuration: 300` (5 min) est insuffisant pour un batch de 20 generations a 30-90s chacune. Un batch plein prend 10-30 minutes minimum.

5. **Pas de comparaison pass1 vs pass1** : le systeme compare uniquement output final vs output final. Pour diagnostiquer si un probleme vient de la passe surfaces ou mobilier, il faudrait aussi comparer les images intermediaires passe 1.

---

## Decisions a confirmer

1. **Auth replay** : faut-il proteger /api/replay avec ADMIN_PASSWORD, ou creer un systeme de token d'API separe pour les outils d'audit ?

2. **Rate limit replay** : faut-il un rate limit separe pour les replays (plus genereux que les 10/min utilisateur) ou un bypass total pour les appels internes ?

3. **Retention images replay** : faut-il un TTL sur les images de replay (ex: 7 jours) pour eviter l'accumulation en Object Storage ?

---

## Recommandation

**GO avec reserves**

Le systeme est fonctionnellement correct et utilisable immediatement pour les audits agents (Yann Duval / Lucas Moreau). Les metriques de comparaison sont mathematiquement solides. Le batch est correctement sequentiel et borne.

Les 3 problemes HAUTE doivent etre resolus avant une utilisation reguliere en production :
- H-01 : Auth sur /api/replay (risque de cout)
- H-02 : built_prompt_pass1/pass2 toujours null (perte d'information audit)
- H-03 : Rate limit contreproductif pour le batch interne

Aucun de ces 3 problemes n'est bloquant pour un usage ponctuel en alpha (l'URL Replit n'est pas publique).

---

**Handoff -> @orchestrator**
- Fichiers produits : docs/reviews/replay-system-review.md
- Decisions prises : GO avec reserves, 3 problemes HAUTE identifies
- Points d'attention :
  - H-01 (auth) et H-03 (rate limit) -> @fullstack
  - H-02 (built prompts null) -> @fullstack (ajouter les champs dans la reponse JSON de /api/generate)
  - M-03 (duplication logGeneration/logGenerationReturningId) -> @fullstack (refactoring mineur)
  - Angle mort timeout batch -> confirmer si batch de 20 est un use case reel ou si 5-10 suffit
---
