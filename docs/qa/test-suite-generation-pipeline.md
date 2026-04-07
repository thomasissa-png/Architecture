# Suite de tests — Pipeline de génération d'images Versimo

> **Auteur** : @qa (QA Engineering Manager)
> **Date** : 2026-04-07
> **Version** : v1
> **Scope** : EXCLUSIF au pipeline de génération d'images (F1 itération, F2 type de pièce, F3 outdoor, F12 multi-photo, crédits/refund, robustesse infra, custom prompt). Hors scope : auth, dossiers PDF, annonces, F4 Mode Pro, blog, SEO.
> **Pré-requis lecture** : `docs/qa/qa-strategy.md` (stratégie globale), `docs/product/functional-specs.md` F1/F2/F3/F10/F11/F12, `docs/lessons-learned.md` sessions 30-33.
>
> **Justification d'existence** : le fondateur signale des erreurs récurrentes à l'usage malgré la session 33 dédiée au debug. La `qa-strategy.md` existante couvre les E2E nominaux (E2E-01 à E2E-07) mais NE couvre PAS :
> 1. Les **race conditions multi-photo F12** (MAX_CONCURRENT=5, fileIndex ordering, secondaryAbortRef, batchesCompleteRef, refund partiel) — bugs de session 33
> 2. Les **régressions du pipeline 2 passes** (cache pass1, TTL 24h, image source itération, pre-processing GPT-4.1-mini)
> 3. Les **régressions infra Replit** (tab-switch iOS → BackgroundDisconnectError, autoscale fire-and-forget, getServerSession sporadique) — bugs sessions 31/32
> 4. La **non-régression visuelle des prompts** (chaque bump PROMPT_VERSION doit déclencher un benchmark Yann/Lucas)
> 5. Les tests UNITAIRES fins (les E2E testent des parcours, pas des fonctions pures comme `getOutputSize`, `applyRoomTypeOverrides`, `resolveChooseOne`)
>
> **Alternatives écartées** :
> - "Écrire une batterie de tests E2E en plus" → rejeté : les E2E prennent 30-60s chacun et le fondateur a besoin d'un smoke test en 5 min. On sépare E2E complet (CI) et smoke (pré-deploy).
> - "Refactorer d'abord `page.tsx` (2959 lignes) pour le rendre testable" → rejeté : délai trop long, on adapte les tests au code existant et on liste les refactors nécessaires à faire au fil de l'eau (Section 1).
> - "S'appuyer uniquement sur les audits Yann/Lucas" → rejeté : les audits sont visuels qualitatifs et ne détectent PAS les régressions de logique (refund manquant, crédits mal décrémentés, fileIndex mélangés).
>
> Cette suite ajoute : (1) une couche UNITAIRE Vitest fine sur les fonctions pures du pipeline, (2) des tests E2E ciblés sur les zones à risque F12/F1/infra, (3) une checklist manuelle du point de vue utilisateur (exigence fondateur sessions 32 et 33), (4) un smoke test de 5 min exécutable avant chaque deploy.

---

## Sommaire

1. [Audit testabilité actuel](#section-1--audit-testabilité-actuel)
2. [Tests unitaires Vitest (P0/P1/P2)](#section-2--tests-unitaires-vitest)
3. [Tests E2E Playwright](#section-3--tests-e2e-playwright)
4. [Tests manuels critiques (point de vue utilisateur)](#section-4--tests-manuels-critiques)
5. [Smoke test pré-déploiement (5 min)](#section-5--smoke-test-pré-déploiement)
6. [Matrice de couverture](#section-6--matrice-de-couverture)
7. [Recommandations process](#section-7--recommandations-process)

---

## Section 1 — Audit testabilité actuel

### 1.1 Fichiers audités

| Fichier | Lignes | Rôle | Testabilité actuelle |
|---|---|---|---|
| `lib/generation-pipeline.ts` | 924 | Pipeline 2 passes, builders, prompt version, SSIM, OpenAI call | **BONNE** — fonctions pures exportées (`getOutputSize`, `buildSurfacesResponsesPrompt`, `buildFurnitureResponsesPrompt`, `scorePreservationLocal`, `resolveChooseOne`, `checkRateLimit`, `runGenerationPipeline`). OpenAI client singleton mockable via `vi.mock("openai")`. |
| `app/api/generate/route.ts` | 1126 | POST route — orchestration, auth, credits, cache pass1 | **MOYENNE** — route handler unique, logique imbriquée avec auth + credits + pipeline. Mockable via `@testing-library/react` + MSW. Les branches `pass1Key` / `pass2Only` / `isIteration` nécessitent 4 scénarios distincts. |
| `app/page.tsx` | **2959** | UI client, handleGenerate, F12 multi-photo, refund, abort | **MAUVAISE** — fichier monolithique. `handleGenerate` non-extrait, logique F12 (jobs, batches, MAX_CONCURRENT) imbriquée dans un `useCallback`. Testable UNIQUEMENT via Playwright E2E. Refactor recommandé : extraire `lib/multi-photo-scheduler.ts` pour tester la logique jobs/batches/refund en unitaire pur. |
| `lib/db.ts` | 678 | Pool PG, Object Storage (save/get), pass1 cache, logging | **BONNE** — fonctions exportées pures. `withStorageRetry` wrapper à tester avec client mock qui échoue 1 fois puis réussit. `savePass1Cache` + `getPass1Cache` testables avec mock Object Storage. |
| `lib/iteration-prompt.ts` | 128 | Builders prompts d'itération (indoor/outdoor × adjust/restyle) | **EXCELLENTE** — 4 builders purs, inputs/outputs texte. Snapshot testing direct. |
| `lib/custom-prompt.ts` | 270 | Pre-processing GPT-4.1-mini (classify, enrich, filter) | **BONNE** — 3 fonctions exportées (`preprocessCustomPrompt`, `classifyIterationIntent`, `preprocessIterationComment`). Mock OpenAI chat.completions → tests JSON input/output déterministes. |
| `lib/session.ts` | 40 | `getSessionRobust` avec fallback JWT | **BONNE** — fonction unique, mock `getServerSession` + `getToken` pour tester les 4 branches (OK / OK-fallback / fail-fail / token sans userId). |
| `lib/credits.ts` | 226 | `hasProAccess`, `hasStarterAccess`, `getMaxIterations`, `decrementCredit`, `addCredits` | **EXCELLENTE** — fonctions pures avec 1 dépendance (`getPool`). Mock PG pour tester chaque branche. |

### 1.2 Zones NON-testables depuis le code (→ test manuel obligatoire)

- **Rendu visuel des images générées par gpt-image-1.5** : aucune assertion automatisée ne peut vérifier "le canapé est bien scandinave et pas industriel". Ces tests sont l'affaire des agents Yann (interior-architect) et Lucas (ai-image-expert) qui auditent visuellement. **Automatisation partielle possible** : SSIM (déjà implémenté via `scorePreservationLocal`) peut détecter une dérive > 20% en non-régression visuelle mais pas juger la qualité.
- **Comportement Safari iOS tab-switch** : le `BackgroundDisconnectError` déclenché par le navigateur quand la PWA passe en background ne peut être reproduit qu'avec un vrai device iOS (Playwright WebKit desktop ne tue PAS le fetch de la même manière). **Obligatoire** : test manuel sur iPhone réel avant chaque deploy qui touche au flow génération.
- **Race conditions Replit autoscale** : le bug "saveIterationBase fire-and-forget tué par autoscale" (session 32) ne peut pas être reproduit en local (worker jamais tué). Validable uniquement en staging/prod Replit avec monitoring sur `[saveImage] VERIFY FAILED`.
- **Session getServerSession sporadique** : bug non-déterministe (session 31). Détectable via monitoring logs `[auth] getServerSession null — JWT fallback`, pas via test unitaire.

### 1.3 data-testid à ajouter (bloquants E2E)

Aucun attribut `data-testid` n'est actuellement présent dans `app/page.tsx`. Les tests E2E s'appuieront sur `getByRole`/`getByText` quand possible, mais les éléments suivants DOIVENT recevoir un `data-testid` pour fiabiliser les tests :

| Élément | `data-testid` proposé | Usage test |
|---|---|---|
| Compteur de visuels restants (header) | `credits-counter` | Vérifier décrément synchrone, refund |
| Bouton générer principal | `cta-generate` | Click action |
| Zone d'upload drop | `upload-zone` | Drag-and-drop Playwright |
| Tile de chaque photo uploadée | `photo-tile-{fileIndex}` | Vérifier ordre fileIndex |
| Overlay d'erreur per-photo | `photo-error-{fileIndex}` | Vérifier message contextuel |
| Résultat généré (carte) | `result-card-{fileIndex}-{styleId}` | Vérifier ordre, contenu |
| Comparateur avant/après | `comparator-slider` | Tester drag slider |
| Bouton itération / affiner | `btn-iterate-{fileIndex}` | Gating par tier |
| Textarea commentaire itération | `iteration-comment-input` | Remplir commentaire |
| Bouton annuler génération | `btn-cancel-generation` | Déclencher abort + refund |
| Toast erreur / succès | `toast-{type}` | Vérifier message |
| Bandeau post-achat Stripe | `post-checkout-banner` | Vérifier crédits incrémentés |
| Modale warning custom prompt | `custom-prompt-warnings` | Vérifier liste des warnings FR |
| Picker type de pièce | `room-type-picker` | Sélection F2 |
| Picker outdoor subtype | `outdoor-subtype-picker` | Sélection F3 |
| Switch intérieur/extérieur | `toggle-indoor-outdoor` | Mutex F2/F3 |

**Action bloquante** : @fullstack ajoute ces 16 `data-testid` avant exécution des E2E de Section 3. Durée estimée : 20 min.

### 1.4 Refactors recommandés pour augmenter la testabilité (non-bloquants)


| Refactor | Fichier cible | Bénéfice | Priorité |
|---|---|---|---|
| Extraire `scheduleMultiPhotoJobs(jobs, MAX_CONCURRENT)` en fonction pure | `lib/multi-photo-scheduler.ts` (nouveau) | Tester la logique fileIndex + batches + abort SANS Playwright | **P0** |
| Extraire `computeRefund(jobs, completed, aborted)` en fonction pure | `lib/refund-calculator.ts` (nouveau) | Tester refund partiel/total avec assertions déterministes | **P0** |
| Extraire `validateGenerationRequest(body)` (Zod schema) | `lib/generation-schema.ts` (nouveau) | Tester validation body côté serveur, rejeter les inputs invalides avant pipeline | **P1** |
| Exporter `isComplexRoom` helper | `lib/generation-pipeline.ts` | Tester la regex de détection best-of-2 (vault, mezzanine, L-shaped...) | **P2** |

---

## Section 2 — Tests unitaires Vitest

**Framework** : Vitest (déjà présent ou à installer : `npm i -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom msw`)
**Convention** : `tests/unit/{domaine}/{fichier}.test.ts`, 1 fichier test par fichier source.
**Coverage cible** : 80% lignes sur `lib/`, 60% sur `app/api/`.
**Mocks partagés** : `tests/unit/mocks/openai.ts`, `tests/unit/mocks/storage.ts`, `tests/unit/mocks/db.ts`.

### P0 — Bloquants (rouges = deploy interdit)

#### G1 — Pipeline 2 passes — `lib/generation-pipeline.ts`

| Test ID | Nom | Fonction testée | Inputs | Output attendu | Edge cases |
|---|---|---|---|---|---|
| U-GP-001 | `getOutputSize — paysage 4:3 → 1536x1024` | `getOutputSize(2048, 1536)` | w=2048, h=1536 | `{openai: "1536x1024", w: 1536, h: 1024}` | Seuil 1.2 (session 32 bug) |
| U-GP-002 | `getOutputSize — portrait 3:4 → 1024x1536` | `getOutputSize(1536, 2048)` | w=1536, h=2048 | `{openai: "1024x1536"}` | Seuil 0.83 |
| U-GP-003 | `getOutputSize — carré 1:1` | `getOutputSize(1024, 1024)` | w=1024, h=1024 | `{openai: "1024x1024"}` | Ratio exactement 1.0 |
| U-GP-004 | `getOutputSize — dimensions manquantes → fallback carré` | `getOutputSize(undefined, undefined)` | undefined | `{openai: "1024x1024"}` | Null safety |
| U-GP-005 | `getOutputSize — ratio limite 1.2` | `getOutputSize(1200, 1000)` | ratio=1.2 exact | DOIT retourner carré (non strictement >) | Régression session 32 |
| U-GP-006 | `checkRateLimit — premier appel OK` | `checkRateLimit("1.2.3.4")` | IP neuve | `true` | Map vide |
| U-GP-007 | `checkRateLimit — 11e appel bloqué` | 11 appels successifs même IP | Count > 10 | 11e = `false` | Limite exacte |
| U-GP-008 | `checkRateLimit — reset après 60s` | appel, avance temps, appel | `vi.useFakeTimers()` | 11e appel après 60s = `true` | Fake timers |
| U-GP-009 | `resolveChooseOne — sélection aléatoire` | `"A, choose one: red, blue, green. End"` | Prompt avec clause | Contient UNE seule couleur parmi les 3 | `vi.spyOn(Math, "random")` pour déterminisme |
| U-GP-010 | `resolveChooseOne — prompt sans clause → inchangé` | Prompt simple sans "choose one" | Idem input | Idempotence |
| U-GP-011 | `scorePreservationLocal — images identiques → score 10` | Même image en input et output | Base64 identique | Score 10 | SSIM = 1.0 |
| U-GP-012 | `scorePreservationLocal — image noire vs blanche → score bas` | Black vs white image | 2 images générées via sharp | Score < 5 | Edge case dégradation maximale |
| U-GP-013 | `scorePreservationLocal — fail-open sur buffer invalide` | Base64 invalide | `"not-base64"` | Score 5 (fallback) | Ne throw pas |
| U-GP-014 | `buildSurfacesResponsesPrompt — kitchen → ceramic/stone tiles` | `buildSurfacesResponsesPrompt("scandinave", "kitchen", "")` | — | Contient "ceramic or stone tiles", ne contient PAS "wide-plank" | Régression session 32, le filtre regex |
| U-GP-015 | `buildSurfacesResponsesPrompt — inventaire injecté si présent` | roomInventory non vide | — | Contient `"This room has: ${inventory}"` | Fail-open vision |
| U-GP-016 | `buildSurfacesResponsesPrompt — aucun mot "TRANSFORM"` | Tous les roomType | — | Grep absent | Règle CLAUDE.md absolue |
| U-GP-017 | `buildFurnitureResponsesPrompt — aucun mot "curtains/drapes/windows"` | Tous les roomType | — | Grep absent | Règle CLAUDE.md hallucination fenêtre |
| U-GP-018 | `extractRoomInventory — timeout 5s → fail-open ""` | Mock OpenAI qui pend > 5s | — | `""` + warn log | API_TIMEOUT critique |
| U-GP-019 | `extractRoomInventory — erreur OpenAI → fail-open ""` | Mock OpenAI qui throw | — | `""` | Fail-open fondamental |
| U-GP-020 | `generatePass — retry 1 fois sur échec passe 1` | Mock OpenAI échoue 1x puis OK | — | 1 succès après 1 retry | MAX_PASS_RETRIES=2 |
| U-GP-021 | `generatePass — 2 échecs passe 1 → throw` | Mock OpenAI échoue 2x | — | Throw `"Échec passe 1 après 2 tentatives"` | Escalade erreur |
| U-GP-022 | `generatePass — best-of-2 uniquement si roomInventory contient "vault"` | roomInventory="simple room" vs "vaulted ceiling" | — | Simple = 1 appel, vault = 2 appels parallèles | isComplexRoom regex |
| U-GP-023 | `runGenerationPipeline — pass2Failed=true si passe 2 throw` | Mock passe 1 OK, passe 2 throw | — | `{outputBase64: pass1Base64, pass2Failed: true, pass2Model: null}` | Fallback pass1 |
| U-GP-024 | `runGenerationPipeline — withFurniture=false skip passe 2` | `withFurniture: false` | — | Aucun appel passe 2, `durationMs = pass1DurationMs` | Mode surfaces only |
| U-GP-025 | `runGenerationPipeline — dedicated builder kitchen n'injecte PAS furniturePrompt salon` | roomType="kitchen", furniturePrompt="sofa" | — | `trimmedFurniture` NE contient PAS "sofa", contient `roomFurnitureOverride` | Cause racine F2 |
| U-GP-026 | `PROMPT_VERSION — format semver v{n}` | `PROMPT_VERSION` | — | Match `/^v\d+$/` | Régression si non bumpé après modif |

#### G2 — Pre-processing custom prompt — `lib/custom-prompt.ts`

| Test ID | Nom | Inputs | Output attendu |
|---|---|---|---|
| U-CP-001 | `preprocessCustomPrompt — FR → EN traduction` | `"salon cosy avec beaucoup de textures"` (mock OpenAI retour anglais) | `surfacePrompt` et `furniturePrompt` en anglais, pas d'accent FR |
| U-CP-002 | `preprocessCustomPrompt — split surface/furniture` | Mock retour avec 2 champs distincts | `surfacePrompt !== furniturePrompt`, surfacePrompt NE contient PAS "sofa" |
| U-CP-003 | `preprocessCustomPrompt — mot "rideaux" → warning FR` | `"salon avec rideaux blancs"` | `warnings` contient au moins 1 entrée mentionnant "rideaux", aucun "curtain" dans les prompts |
| U-CP-004 | `preprocessCustomPrompt — mot "cuisine équipée" → warning built-in` | `"cuisine équipée blanche"` | `warnings` mentionne équipement non supporté |
| U-CP-005 | `preprocessCustomPrompt — fail-open sans OPENAI_API_KEY` | `env.OPENAI_API_KEY = ""` | `{surfacePrompt: userPrompt, furniturePrompt: userPrompt, warnings: []}` |
| U-CP-006 | `preprocessCustomPrompt — timeout 15s` | Mock OpenAI qui pend | Throw `"preprocessCustomPrompt timeout after 15s"` |
| U-CP-007 | `preprocessCustomPrompt — JSON invalide → fallback raw` | Mock retour non-JSON | Retourne userPrompt tel quel |
| U-CP-008 | `classifyIterationIntent — "change to scandinavian" → restyle` | `"change to scandinavian style"` | `"restyle"` |
| U-CP-009 | `classifyIterationIntent — "add a plant" → adjust` | `"add a plant"` | `"adjust"` |
| U-CP-010 | `classifyIterationIntent — safe default adjust sur erreur` | Mock OpenAI throw | `"adjust"` |
| U-CP-011 | `preprocessIterationComment — "juste un canapé" → isExclusive=true` | Mot clé "juste" | `isExclusive: true`, enrichedComment commence par "ONLY:" |
| U-CP-012 | `preprocessIterationComment — "remplacer X par Y" → isExclusive=false` | Keyword non-exclusif | `isExclusive: false` |
| U-CP-013 | `preprocessIterationComment — "ajouter étagère" → allowWallMounted=true` | Wall-mounted explicite | `allowWallMounted: true` |
| U-CP-014 | `preprocessIterationComment — "ajouter canapé" → allowWallMounted=false` | Freestanding | `allowWallMounted: false` |
| U-CP-015 | `preprocessIterationComment — "enlever toilette" → warning sanitaire` | Plumbing fixture | `warnings` mentionne "home staging mobilier" |

#### G3 — Crédits & accès — `lib/credits.ts`

| Test ID | Nom | Setup DB mock | Output attendu |
|---|---|---|---|
| U-CR-001 | `hasStarterAccess — 0 achats → false` | `purchases = []` | `false` |
| U-CR-002 | `hasStarterAccess — 1 achat completed → true` | `purchases = [{status: "completed"}]` | `true` |
| U-CR-003 | `hasStarterAccess — achat pending → false` | `purchases = [{status: "pending"}]` | `false` (bug régression session 31) |
| U-CR-004 | `hasProAccess — role="pro" → true` | `users.role = "pro"` | `true`, pas de query purchases |
| U-CR-005 | `hasProAccess — role="user" + 50 crédits achetés → true` | `users.role="user", purchases=[{credits_purchased:50, status:"completed"}]` | `true` |
| U-CR-006 | `hasProAccess — role="user" + 15 crédits → false` | `credits_purchased: 15` | `false` |
| U-CR-007 | `getMaxIterations — anonyme → 0` | `userId=null` | `0` |
| U-CR-008 | `getMaxIterations — Découverte (2 crédits gratuits, 0 achat) → 0` | Aucun achat | `0` (régression session 31 : bug classé Starter) |
| U-CR-009 | `getMaxIterations — Starter → 1` | 1 achat 15 crédits | `1` |
| U-CR-010 | `getMaxIterations — Pro → 3` | 1 achat 50 crédits | `3` |
| U-CR-011 | `decrementCredit — credits=0 → false (no-op)` | `credits_remaining=0` | `false`, pas de décrément |
| U-CR-012 | `decrementCredit — credits=5 → 4 + true` | `credits_remaining=5` | `true` |
| U-CR-013 | `addCredits — +10 sur user existant` | `credits_remaining=3` | `13` |
| U-CR-014 | `hasGalleryAccess — TOUJOURS true (décision 2026-04-04)` | N'importe quel userId | `true` |

#### G4 — Session robuste — `lib/session.ts`

| Test ID | Nom | Setup | Output |
|---|---|---|---|
| U-SE-001 | `getSessionRobust — getServerSession OK` | Mock session valide | Retourne session sans appeler getToken |
| U-SE-002 | `getSessionRobust — getServerSession null, getToken OK` | Mock session null, token.userId présent | Retourne session construite depuis token + warn log |
| U-SE-003 | `getSessionRobust — getServerSession null, getToken null` | Les 2 null | `null` |
| U-SE-004 | `getSessionRobust — getToken throw → null sans crash` | getToken throw | `null` + error log, pas d'exception propagée |
| U-SE-005 | `getSessionRobust — token sans userId → null` | `token = {email: "x"}` | `null` (pas de fabrication) |

#### G5 — Builders d'itération — `lib/iteration-prompt.ts` (snapshot testing)

| Test ID | Nom | Inputs | Assertion |
|---|---|---|---|
| U-IT-001 | `buildIterationFurnitureResponsesPrompt — snapshot Scandinave adjust` | roomType=null, mods=["add plant"], allowWallMounted=false | Match snapshot, contient "Freestanding objects only" |
| U-IT-002 | `buildIterationFurnitureResponsesPrompt — kitchen → "Built-in cabinetry expected"` | roomType="kitchen" | Grep chaîne présente |
| U-IT-003 | `buildIterationFurnitureResponsesPrompt — allowWallMounted=true → "Wall-mounted items allowed"` | allowWallMounted=true | Grep chaîne |
| U-IT-004 | `buildIterationFurnitureResponsesPrompt — aucun mot "curtains"` | Tous cas | Grep absent (règle absolue) |
| U-IT-005 | `buildIterationFurnitureResponsesPrompt — "EXACT same count" présent` | Tous cas | Anti-hallucination fenêtre (session 33) |
| U-IT-006 | `buildIterationOutdoorFurnitureResponsesPrompt — pas de "radiators" ni "ceiling"` | — | Grep absent (mutex F3/F2) |
| U-IT-007 | `buildIterationOutdoorFurnitureResponsesPrompt — "sky stays as-is"` | — | Grep présent |
| U-IT-008 | Tous les 4 builders contiennent "Same camera angle, height, tilt" | — | Régression session 30 "Camera LOCKED" |

#### G6 — Object Storage résilient — `lib/db.ts`

| Test ID | Nom | Setup | Output |
|---|---|---|---|
| U-DB-001 | `saveImage — upload OK + verify OK` | Mock client.uploadFromBytes OK, downloadAsBytes OK | Retourne key, 1 seul upload |
| U-DB-002 | `saveImage — upload OK + verify fail → retry 1x` | Mock verify fail premier, OK second | 2 uploads, retourne key |
| U-DB-003 | `saveImage — upload fail → withStorageRetry réinit client` | Mock client en état "error" | Réinit détecté, 1 retry |
| U-DB-004 | `savePass1Cache — stocke image + meta alongside` | — | 2 uploads (`.jpg` + `_meta.json`) |
| U-DB-005 | `getPass1Cache — meta corrompue → null` | Mock meta JSON invalide | Throws JSON error OR retourne null (comportement à documenter) |
| U-DB-006 | `getPass1Cache — TTL 24h expiré` | meta.createdAt = Date.now() - 25h | getPass1Cache retourne les données (TTL vérifié par route.ts, pas par db.ts) — test documentaire |

### P1 — Importants (rouges = PR bloquée)

#### G7 — Multi-photo scheduler (NÉCESSITE refactor R1)

Prérequis : extraction `lib/multi-photo-scheduler.ts` (voir Section 1.4).

| Test ID | Nom | Inputs | Output |
|---|---|---|---|
| U-MP-001 | `createJobs — 3 photos × 2 styles = 6 jobs` | 3 files, stylesPerPhoto=[2,2,2] | 6 jobs, fileIndex correct |
| U-MP-002 | `createJobs — ordre fileIndex préservé` | files = [A, B, C] | jobs[0].fileIndex=0, jobs[2].fileIndex=1... |
| U-MP-003 | `batchJobs — 7 jobs / MAX_CONCURRENT=5 → 2 batches` | 7 jobs | batch0.length=5, batch1.length=2 |
| U-MP-004 | `computeRefund — 5 jobs, 3 réussis, 2 annulés → refund=2` | totalJobs=5, completed=3, aborted=2 | `refundCount: 2` |
| U-MP-005 | `computeRefund — 5 jobs, 5 réussis → refund=0` | Tous succès | `refundCount: 0` |
| U-MP-006 | `computeRefund — 5 jobs, 0 réussis, 5 errors → refund=5` | Tous errors | `refundCount: 5` (règle fondateur session 33) |

#### G8 — Room types & outdoor — `lib/room-types.ts` + `lib/outdoor-subtypes.ts`

| Test ID | Nom | Inputs | Output |
|---|---|---|---|
| U-RT-001 | `applyRoomTypeOverrides — salon → style inchangé` | styleId="scandinave", roomType="living_room" | Pas d'override |
| U-RT-002 | `applyRoomTypeOverrides — kitchen → roomFurnitureOverride appliqué` | styleId="scandinave", roomType="kitchen" | `effectiveFurniturePrompt` contient éléments cuisine |
| U-RT-003 | `ROOM_TYPES — tous les 8 types ont roomFurnitureOverride` | Iteration `Object.keys(ROOM_TYPES)` | 8 entrées, chaque entrée a `roomFurnitureOverride` non-vide (sauf living_room) |
| U-OD-001 | `applyOutdoorSubtypeOverrides — terrasse` | subtype="terrasse" | subtypeSurfaceOverride défini |
| U-OD-002 | `OUTDOOR_SUBTYPES — 5 sous-types` | Iteration keys | `terrasse, balcon, patio, jardin, rooftop` |

#### G9 — Validation body route `/api/generate`

Prérequis : extraction Zod schema `lib/generation-schema.ts` (refactor R3).

| Test ID | Nom | Body invalide | Status attendu |
|---|---|---|---|
| U-VA-001 | `POST sans image` | `{styleId: "scandinave"}` | 400 |
| U-VA-002 | `POST image invalide (non base64)` | `{image: "not-base64"}` | 400 |
| U-VA-003 | `POST surfacePrompt > 5000 chars` | Prompt 10KB | 400 |
| U-VA-004 | `POST pass1Key format invalide` | `{pass1Key: "../etc/passwd"}` | 400 (path traversal) |
| U-VA-005 | `POST dimensions négatives` | `{width: -100}` | 400 |

### P2 — Nice-to-have

| Test ID | Nom | Zone |
|---|---|---|
| U-NH-001 | Snapshot des 12 surfacePrompts de `StylePicker.tsx` | Non-régression stylePrompt |
| U-NH-002 | Test mutation Stryker sur `generatePass` retry logic | Mutation testing |
| U-NH-003 | Benchmark latence `scorePreservationLocal` < 100ms | Performance |
| U-NH-004 | Property-based test `getOutputSize` avec fast-check | Random dimensions → toujours ratio cohérent |

---

## Section 3 — Tests E2E Playwright

**Framework** : Playwright 1.40+ avec device descriptors (iPhone 13, iPad, Desktop Chrome)
**Convention** : `tests/e2e/generation/{zone}.spec.ts`
**Mocks** : les appels OpenAI sont MOCKÉS via `page.route("**/api/generate", ...)` pour éviter les coûts et la flakiness. Une suite séparée `tests/e2e/generation-live.spec.ts` teste contre l'API réelle en staging (exécutée sur demande).
**Prérequis** : data-testid de la Section 1.3 ajoutés par @fullstack.

### E2E-G01 — Découverte : 1 photo → 1 style → 1 visuel (parcours gratuit)

**Objectif** : valider le flow minimal gratuit de bout en bout + décrément crédit synchrone.

**Pré-condition** : nouveau compte, 2 crédits gratuits, 0 achat.

**Steps** :
1. `page.goto("/")`, login Google (mock next-auth)
2. Assert `credits-counter` = "2 visuels restants"
3. Upload 1 photo via `upload-zone` (fixture : `tests/fixtures/empty-room-landscape.jpg`, 2048×1536)
4. Assert `photo-tile-0` visible
5. Click sur style "Scandinave"
6. Click `cta-generate`
7. **Assert IMMÉDIAT** (avant réponse API) : `credits-counter` = "1 visuel restant" (décrément synchrone optimiste — préférence fondateur session 33)
8. Mock `/api/generate` répond 200 avec `{image: "data:image/png;base64,..."}` après 2s
9. Attendre `result-card-0-scandinave` visible
10. Assert `comparator-slider` présent, drag de 0% à 100% → image change
11. Assert bouton `btn-iterate-0` DÉSACTIVÉ (Découverte = 0 itérations)
12. Assert pas de bouton dossier PDF visible (Découverte n'a pas accès)

**Résultat attendu** : 1 visuel généré, compteur à 1, pas d'itération, pas de Dossier.

---

### E2E-G02 — Starter : 3 photos × 1 style → ordre fileIndex préservé + refund partiel sur abort

**Objectif** : valider F12 R1 (universalité 1-5) + R3 (ordre fileIndex) + R5 (refund auto sur annulation).

**Pré-condition** : compte Starter (1 achat pack 15 crédits, 13 restants).

**Steps** :
1. Login Starter
2. Upload 3 photos distinctes dans l'ordre : `kitchen.jpg`, `bedroom.jpg`, `livingroom.jpg`
3. Assert `photo-tile-0`, `photo-tile-1`, `photo-tile-2` dans cet ordre DOM
4. Click style "Japandi" global
5. Assert `credits-counter` = "13 visuels restants"
6. Click `cta-generate`
7. **Assert IMMÉDIAT** : compteur = "10 visuels restants" (3 × 1 style)
8. Mock `/api/generate` : photo 0 répond après 2s, photo 1 après 4s, photo 2 pend indéfiniment
9. Après photo 0 et 1 terminées (6s), click `btn-cancel-generation`
10. Assert toast `"Génération annulée. 1 visuel remboursé."`
11. Assert `credits-counter` = "11 visuels restants" (10 + 1 refund)
12. Assert `result-card-0-japandi` contient image kitchen (PAS livingroom)
13. Assert `result-card-1-japandi` contient image bedroom
14. Assert `result-card-2-japandi` ABSENT (annulée)

**Résultat attendu** : ordre fileIndex préservé, 2 résultats, refund 1 crédit, toast explicite.

---

### E2E-G03 — Pro : 5 photos × 3 styles (multi-style) → 15 jobs → cache pass1 + itération

**Objectif** : valider F12 cap maximal + réutilisation cache pass1 pour itération.

**Pré-condition** : compte Pro (role="pro", 100 crédits).

**Steps** :
1. Login Pro
2. Upload 5 photos
3. Pour chaque photo, via `PhotoAssociator`, assigner un jeu de 3 styles distincts (total 15 jobs)
4. Assert estimation "15 visuels"
5. Click `cta-generate`, compteur 100 → 85 immédiat
6. Mock `/api/generate` : tous succès après 3s
7. Attendre 15 `result-card-*` présentes
8. Assert ordre DOM : fileIndex 0 en premier, fileIndex 4 en dernier (preservation R3)
9. Click `btn-iterate-0` sur premier résultat
10. Taper `"ajouter une plante verte"` dans `iteration-comment-input`
11. Click submit itération
12. Assert requête réseau `/api/generate` contient `pass1Key` ≠ null (réutilisation cache)
13. Assert compteur = 84 (1 crédit itération)
14. Après 3 itérations, le 4e click `btn-iterate-0` → bouton désactivé + tooltip "Limite Pro atteinte (3/3)"

**Résultat attendu** : 15 visuels, 3 itérations réussies, 4e itération bloquée.

---

### E2E-G04 — Custom prompt FR avec mots interdits → warnings affichés + génération OK

**Objectif** : valider le pre-processing GPT-4.1-mini (U-CP-003 en E2E).

**Steps** :
1. Upload 1 photo
2. Sélectionner style "Personnalisé"
3. Taper dans textarea : `"salon cosy avec de beaux rideaux blancs et une cuisine équipée"`
4. Click `cta-generate`
5. Mock `/api/preprocess-prompt` retour : `{warnings: ["Nous avons adapté les rideaux pour éviter les hallucinations de fenêtres", "La cuisine équipée n'est pas supportée en mode home staging"]}`
6. Assert `custom-prompt-warnings` visible avec les 2 messages en français
7. Assert utilisateur peut fermer la modale et confirmer
8. Génération se poursuit, `credits-counter` décrémenté

---

### E2E-G05 — Tab-switch iOS pendant génération longue → toast galerie + pas de double facturation

**Objectif** : régression critique session 32 (BackgroundDisconnectError).

**Device** : Playwright `devices['iPhone 13']` + WebKit

**Steps** :
1. Login Starter
2. Upload 1 photo + style
3. Click générer, compteur décrémenté
4. Mock `/api/generate` pend pendant 60s (simulation long traitement)
5. Après 5s, simuler tab-switch : `page.emulateMedia({ media: "screen" })` + `page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")))` avec `document.hidden=true`
6. Déclencher manuellement `BackgroundDisconnectError` via `page.evaluate(() => { throw new (window as any).BackgroundDisconnectError(); })` OU attendre le trigger automatique (si implémenté côté client)
7. Assert toast `"La génération continue en arrière-plan. Retrouvez votre visuel dans la galerie dans quelques instants."`
8. Assert pas de nouveau fetch POST `/api/generate` (pas de retry automatique)
9. Naviguer vers `/ma-galerie`
10. Assert la génération apparaît avec statut "en cours" puis "terminé"
11. **Assert crédits** : 1 seul décrément (pas de double facturation)

---

### E2E-G06 — Refresh page pendant génération → état repris correctement

**Objectif** : valider la persistance de l'état (session 32).

**Steps** :
1. Login Pro
2. Upload 1 photo, click générer
3. Après 2s, `page.reload()`
4. Assert soit la génération est reprise via queue (bandeau "Génération en cours"), soit redirect vers `/ma-galerie` avec toast d'info
5. Assert crédit débité UNE SEULE fois

---

### E2E-G07 — Stripe checkout → retour → crédits incrémentés + bandeau post-achat

**Objectif** : valider le cycle achat.

**Steps** :
1. Login Starter avec 0 crédit
2. Tenter de générer → modale upsell
3. Click "Acheter 15 crédits (9,90€)"
4. Mock redirect Stripe → retour `/generate?checkout=success&session_id=cs_test_xxx`
5. Assert `post-checkout-banner` visible : "Merci ! 15 crédits ajoutés à votre compte."
6. Assert `credits-counter` = "15 visuels restants" (re-fetch après checkout)
7. Click générer → fonctionne

---

### E2E-G08 — F2 Cuisine → roomFurnitureOverride appliqué (pas de canapé dans le prompt)

**Objectif** : régression F2 bug.

**Steps** :
1. Upload photo cuisine
2. Sélectionner room-type `kitchen` via `room-type-picker`
3. Sélectionner style "Scandinave"
4. Intercepter la requête `/api/generate` via `page.route`
5. Assert `body.furniturePrompt` NE contient PAS "sofa", "coffee table", "living room"
6. Assert `body.roomType` = `"kitchen"`

---

### E2E-G09 — F3 Terrasse → mutex F2 + pas de plafond/luminaire

**Objectif** : régression F3 mutex.

**Steps** :
1. Upload photo terrasse
2. Click `toggle-indoor-outdoor` → mode extérieur
3. Assert `room-type-picker` masqué (mutex F2)
4. Sélectionner subtype `terrasse`
5. Sélectionner style outdoor "Méditerranéen"
6. Click générer, intercepter `/api/generate`
7. Assert `body.isOutdoor = true`, `body.outdoorSubtype = "terrasse"`, `body.roomType = null`
8. Assert `body.surfacePrompt` NE contient PAS "ceiling", "pendant", "luminaire"

---

### E2E-G10 — F1 Itération après output passe 2 (jamais passe 1 vide)

**Objectif** : régression session 32 "Affiner cassé".

**Steps** :
1. Générer 1 visuel complet (pass1 + pass2)
2. Click affiner, commentaire `"canapé plus grand"`
3. Intercepter `/api/generate` (itération)
4. Assert `body.pass1Key` présent (récupération cache)
5. Assert le serveur (mock) lit bien l'image **output meublée**, pas l'image passe 1 vide (vérification via payload intercepté ou mock response trace)
6. Vérifier visuellement : le résultat conserve les surfaces et ajoute le changement demandé

---

### E2E-G11 — Multi-device : parcours complet iPhone 13 / iPad / Desktop

**Objectif** : règle @qa tests multi-device réels (pas juste responsive).

Pour CHAQUE device de `[devices['iPhone 13'], devices['iPad'], devices['Desktop Chrome']]`, exécuter un parcours E2E-G01 complet + :
- iPhone : vérifier touch target upload ≥ 44×44px, scroll fluide, clavier virtuel ne masque pas CTA
- iPad : vérifier layout 2 colonnes, drag-and-drop touch
- Desktop : vérifier hover states, drag-and-drop souris

---

## Section 4 — Tests manuels critiques (point de vue utilisateur)

**Règle absolue** (préférence fondateur sessions 31, 32, 33) : chaque scénario décrit ce que l'utilisateur VOIT sur son écran, pas la logique du code. Un QA qui dit "le code marche" mais l'overlay est mal positionné = échec.

**Exécutant** : fondateur OU agent @ux en mode revue visuelle.
**Format** : pré-condition → action → résultat visuel attendu → écart possible + action si écart.
**Device recommandé** : iPhone réel (Safari) + desktop Chrome. Le bug de session 32 (tab-switch) ne reproduit QUE sur iOS réel.

### M-G01 — Je vois mes crédits diminuer INSTANTANÉMENT quand je clique

**Pré-condition** : connecté, 5 crédits, 2 photos uploadées, 1 style sélectionné.
**Action** : cliquer sur "Générer".
**Résultat visuel attendu** : dans la même seconde (pas après la réponse API), le compteur en haut passe de "5 visuels restants" à "3 visuels restants". Le loader démarre immédiatement.
**Écart possible** : compteur reste à 5 pendant 5s puis saute à 3 → l'utilisateur a l'impression que rien ne se passe (régression session 33).
**Action si écart** : P0 bloquant, escalader @fullstack sur `setUserCredits` synchrone + `dispatchEvent("credits-updated")`.

---

### M-G02 — Quand j'annule, je vois le remboursement à l'écran

**Pré-condition** : connecté, 10 crédits, 5 photos × 1 style (5 jobs), génération en cours (2 finis, 3 restants).
**Action** : cliquer sur "Annuler la génération".
**Résultat visuel attendu** :
- Un toast apparaît : "Génération annulée. 3 visuels remboursés."
- Le compteur passe de "5 visuels restants" à "8 visuels restants"
- Les 2 premiers résultats restent affichés dans la galerie de session
- Les 3 photos annulées n'ont PLUS de spinner (retour à l'état initial)
**Écart possible** : compteur reste à 5 → refund pas propagé côté client. Ou toast manquant.
**Action si écart** : P0 bloquant, cause racine dans `secondaryAbortRef` ou `refundCount`.

---

### M-G03 — Quand j'upload 1 photo vs 5 photos, l'expérience est STRICTEMENT identique

**Pré-condition** : préférence fondateur "F12 R6 universalité".
**Action** : générer 1 photo puis générer 5 photos.
**Résultat visuel attendu** : aucune différence visuelle sauf le nombre de résultats. Pas de "en attente de traitement", pas de "batch 1/2", pas de résultats qui apparaissent avec retard bizarre. Ordre fileIndex respecté (photo uploadée en 1er apparaît en 1er).
**Écart possible** : messages "batch en attente" (session 33 bug), résultats mélangés.
**Action si écart** : P0 bloquant.

---

### M-G04 — Quand une photo de la sélection échoue, je vois l'erreur SUR CETTE photo uniquement

**Pré-condition** : 3 photos × 1 style, photo 2 va échouer côté serveur (image corrompue).
**Action** : générer.
**Résultat visuel attendu** :
- Photo 1 : résultat visible
- Photo 2 : overlay rouge "Erreur : image non traitable" SUR la photo 2 (pas au-dessus ni en-dessous)
- Photo 3 : résultat visible
- Compteur : le crédit de la photo 2 est REMBOURSÉ (1 crédit revient)
**Écart possible** : erreur globale sur toutes les photos, overlay mal positionné (session 33), pas de refund photo 2.
**Action si écart** : P0 bloquant.

---

### M-G05 — Sur mon iPhone en Safari, quand je switche d'app pendant une génération longue, je ne perds pas mon crédit

**Pré-condition** : iPhone réel, Safari (pas simulateur).
**Action** :
1. Lancer une génération de 3 photos
2. Après 3 secondes, swipe up pour retourner sur l'écran d'accueil
3. Attendre 30 secondes
4. Revenir sur Safari sur l'onglet Versimo
**Résultat visuel attendu** :
- Un toast explicatif : "Votre génération continue en arrière-plan. Retrouvez vos visuels dans la galerie dans quelques instants."
- Navigation vers /ma-galerie possible
- Les 3 visuels apparaissent en galerie quand terminés
- **1 seul décrément de crédits** (pas de double facturation)
**Écart possible** : erreur "fetch failed" visible, crédits débités 2 fois, aucun visuel en galerie.
**Action si écart** : P0 bloquant, cause session 32 régression (AbortController.signal sur fetch).

---

### M-G06 — Quand j'itère ("ajoute une plante"), mon canapé ne disparaît PAS

**Pré-condition** : générer un visuel complet scandinave.
**Action** : cliquer "Affiner", taper "ajoute une plante verte", valider.
**Résultat visuel attendu** : le résultat affiche LE MÊME canapé, LE MÊME tapis, LES MÊMES coussins + une plante verte en plus.
**Écart possible** : le canapé est différent, le tapis a changé de couleur, la pièce est "régénérée" (bug session 30 #98 Japandi cuisine).
**Action si écart** : P0 bloquant, escalader @ia pour vérifier que l'image source = output meublé (pas pass1 vide) + prompt SURGICAL EDIT appliqué.

---

### M-G07 — Quand j'écris un prompt custom en français avec "rideaux blancs", je suis averti et la génération ne fait PAS apparaître de fausse fenêtre

**Pré-condition** : style "Personnalisé".
**Action** : taper "salon cosy avec rideaux blancs devant la fenêtre", générer.
**Résultat visuel attendu** :
- Modale warning avant génération : "Les rideaux ont été retirés car ils peuvent créer des fenêtres imaginaires."
- Option "Continuer quand même" ou "Modifier mon prompt"
- Si on continue : pas de nouvelle fenêtre hallucinée dans le résultat
**Écart possible** : pas de warning, résultat avec 3 fenêtres alors que l'input en a 1.
**Action si écart** : P1, escalader @ia (pre-processing custom).

---

### M-G08 — Dans ma galerie, je retrouve mes générations dans l'ordre chronologique inverse

**Pré-condition** : 10 générations dans l'historique.
**Action** : naviguer sur /ma-galerie.
**Résultat visuel attendu** :
- Plus récentes en haut
- Thumbnails chargent sans "broken image"
- Click sur une génération → page détail avec comparateur
- Bouton "Télécharger HD" fonctionnel
**Écart possible** : images cassées (Replit filesystem wipe — session 17b), ordre inversé.
**Action si écart** : P0 si images cassées, vérifier Object Storage.

---

### M-G09 — Quand je choisis "Cuisine" puis style Scandinave, le résultat ne montre PAS un canapé dans la cuisine

**Pré-condition** : upload photo cuisine.
**Action** : sélectionner room-type Cuisine + style Scandinave + générer.
**Résultat visuel attendu** : cuisine meublée avec éléments cuisine (plan de travail, tabourets, ustensiles), style scandinave (bois clair, blanc, accessoires épurés). AUCUN canapé, table basse, ou élément de salon.
**Écart possible** : canapé au milieu de la cuisine (bug F2 roomFurnitureOverride non appliqué).
**Action si écart** : P0 bloquant.

---

### M-G10 — Mode extérieur : je ne peux pas choisir un type de pièce en même temps qu'un sous-type terrasse

**Pré-condition** : aucun fichier uploadé.
**Action** : activer le switch "Extérieur".
**Résultat visuel attendu** : le picker "Type de pièce" disparaît complètement, remplacé par "Type d'espace extérieur" (terrasse, balcon, patio, jardin, rooftop).
**Écart possible** : les deux pickers visibles en même temps.
**Action si écart** : P1 (UX), mutex F2/F3 cassé.

---

### M-G11 — Quand je reviens de Stripe après un achat, mes crédits sont visibles IMMÉDIATEMENT

**Pré-condition** : 0 crédit, lancer checkout 15 crédits.
**Action** : finaliser paiement Stripe (mode test), revenir sur Versimo.
**Résultat visuel attendu** :
- Bandeau vert "Merci ! 15 crédits ajoutés à votre compte."
- Compteur affiche immédiatement "15 visuels restants"
- Bouton "Générer" activé
**Écart possible** : compteur à 0, il faut rafraîchir la page pour voir les crédits.
**Action si écart** : P1, re-fetch après checkout manquant.

---

### M-G12 — Le comparateur avant/après marche au doigt sur mon iPhone

**Pré-condition** : 1 visuel généré sur iPhone réel.
**Action** : toucher le slider et le faire glisser de gauche à droite.
**Résultat visuel attendu** : le slider suit le doigt fluidement, la ligne de séparation se déplace en temps réel, pas de lag.
**Écart possible** : slider ne répond pas au touch (bug react-compare-slider v4 session 31 — résolu via comparateur custom Pointer Events).
**Action si écart** : P0, régression.

---

### M-G13 — Je télécharge le visuel HD et l'image est en haute résolution

**Pré-condition** : 1 visuel généré.
**Action** : cliquer "Télécharger HD".
**Résultat visuel attendu** : fichier JPEG téléchargé, dimensions min 1536×1024 (ou 1024×1536 en portrait), taille > 200KB.
**Écart possible** : image 512×512, image basse qualité.
**Action si écart** : P1, getOutputSize ratio mal calculé.

---

### M-G14 — Messages d'erreur actionnables (pas "erreur inconnue")

**Pré-condition** : provoquer 5 types d'erreurs différents.
**Action** : noter le message visible par l'utilisateur dans chaque cas.
**Résultat visuel attendu** :
- Timeout API : "La génération prend plus de temps que prévu, réessayez dans quelques instants."
- Rate limit : "Vous avez atteint la limite de 10 générations par minute. Attendez une minute."
- Crédit insuffisant : "Il vous reste X visuels mais cette génération en nécessite Y. Ajoutez des crédits ou réduisez le nombre de styles."
- Image trop grosse : "Cette photo dépasse 10 Mo. Compressez-la avant de réessayer."
- Session expirée : "Reconnectez-vous pour continuer."
**Écart possible** : "Erreur 500", "Something went wrong", stack trace visible.
**Action si écart** : P1, remonter @fullstack pour humaniser les erreurs.

---

## Section 5 — Smoke test pré-déploiement (5 min chrono)

**Objectif** : en moins de 5 minutes, valider que les 80% des cas d'usage critiques fonctionnent avant chaque deploy Replit.
**Exécutant** : fondateur, via checklist binaire OK/NOK. Automatisable via `tests/smoke.spec.ts` Playwright (cible : < 3 min d'exécution).
**Déclencheur** : avant CHAQUE déploiement, avant CHAQUE bump PROMPT_VERSION, après CHAQUE commit qui touche `app/api/generate/`, `lib/generation-pipeline.ts`, `app/page.tsx`, `lib/db.ts`, `lib/credits.ts`.

### Checklist (15 points)

| # | Check | Attendu | OK/NOK |
|---|---|---|---|
| 1 | `/` charge < 2s | Landing visible | ☐ |
| 2 | Login Google fonctionne | Redirect après OAuth | ☐ |
| 3 | `credits-counter` visible et cohérent | Affiche le bon nombre | ☐ |
| 4 | Upload 1 photo (2048×1536) via drag-drop | Tile visible | ☐ |
| 5 | Sélection style Scandinave | Highlight visible | ☐ |
| 6 | Click Générer → compteur décrémente IMMÉDIATEMENT | Décrément < 500ms | ☐ |
| 7 | Loader visible avec timer estimé | Timer incrémente | ☐ |
| 8 | Résultat affiché < 60s | Image visible | ☐ |
| 9 | Comparateur slider fonctionne | Drag gauche-droite fluide | ☐ |
| 10 | Bouton "Télécharger HD" déclenche download | Fichier téléchargé, > 200KB | ☐ |
| 11 | Bouton "Affiner" visible (si tier autorise) | Visible/masqué selon tier | ☐ |
| 12 | Navigation `/ma-galerie` affiche la génération | Thumbnail chargé | ☐ |
| 13 | Upload 3 photos simultané → 3 tiles, ordre préservé | fileIndex 0,1,2 | ☐ |
| 14 | Click Annuler pendant génération multi → toast refund | Compteur re-crédité | ☐ |
| 15 | Tab-switch iOS (test réel sur device) → toast galerie | Pas de double débit | ☐ |

**Règle** : si 1+ check NOK → deploy BLOQUÉ, corriger avant tag release.

### Version automatisée (tests/smoke.spec.ts)

Scénario Playwright headless qui exécute les checks 1 à 13 (les checks 14-15 nécessitent environnement réel). Durée cible : < 3 min. Lancer via `npm run smoke` avant `git push origin main`.

```
npm run smoke
# → lance playwright test --project=smoke
# → 0 erreur = deploy autorisé
# → 1+ erreur = rollback auto du tag
```

---

## Section 6 — Matrice de couverture

Légende : **C** = couvert, **P** = partiel, **N** = non couvert. Le statut actuel reflète l'état AVANT exécution de cette suite.

### 6.1 Matrice par zone à risque

| Zone à risque | Unit | E2E | Manuel | Actuel | Cible | Test IDs |
|---|---|---|---|---|---|---|
| **F12 R1 — universalité 1-5 photos** | U-MP-001 | E2E-G02, E2E-G03 | M-G03 | N | C | Refactor R1 requis |
| **F12 R3 — ordre fileIndex préservé** | U-MP-002 | E2E-G02 | M-G03 | P | C | — |
| **F12 R5 — refund auto sur abort** | U-MP-004/005/006 | E2E-G02 | M-G02 | N | C | — |
| **F12 compteur crédits synchrone** | — (UI) | E2E-G01 | M-G01 | P | C | Manuel prioritaire |
| **F12 MAX_CONCURRENT=5 batches** | U-MP-003 | E2E-G03 | — | P | C | — |
| **F12 erreur per-photo overlay** | — (UI) | — | M-G04 | N | C | Manuel prioritaire |
| **F1 pass1Key cache TTL 24h** | U-DB-006 | E2E-G03 | — | P | C | — |
| **F1 image source = output meublé** | — | E2E-G10 | M-G06 | N | C | Régression session 32 |
| **F1 pre-processing GPT-4.1-mini** | U-CP-001 à U-CP-015 | E2E-G04 | M-G07 | N | C | — |
| **F1 allowWallMounted** | U-CP-013/014 | — | — | N | C | — |
| **F1 max iterations par tier** | U-CR-007 à U-CR-010 | E2E-G03 | — | P | C | — |
| **F2 roomFurnitureOverride** | U-GP-025, U-RT-002 | E2E-G08 | M-G09 | N | C | Régression F2 |
| **F2 8 room types couverts** | U-RT-003 | — | — | N | C | — |
| **F3 mutex F2/F3** | — | E2E-G09 | M-G10 | N | C | — |
| **F3 outdoor builder pas de ceiling** | U-GP-014 | E2E-G09 | — | P | C | — |
| **F3 5 sous-types** | U-OD-002 | — | — | N | C | — |
| **Tab-switch iOS BackgroundDisconnectError** | — (infra) | E2E-G05 | M-G05 | N | C | Device réel |
| **Replit autoscale await avant response** | — (infra) | — | Monitoring logs | P | P | Non testable local |
| **getServerSession sporadique** | U-SE-001 à U-SE-005 | — | Monitoring logs | N | C | — |
| **Stripe checkout → crédits** | — | E2E-G07 | M-G11 | P | C | — |
| **Décrément crédit optimiste** | — (UI) | E2E-G01 | M-G01 | P | C | — |
| **Refund auto sur erreur** | U-MP-004 | E2E-G02 | M-G02/M-G04 | N | C | — |
| **hasStarterAccess (historique achat)** | U-CR-001/002/003 | — | — | N | C | Régression session 31 |
| **PROMPT_VERSION bump détecté** | U-GP-026 | — | — | N | C | Auto-bump CI |
| **Anti-hallucination fenêtre prompts** | U-GP-017, U-IT-004 | — | M-G07 | N | C | — |
| **Comparateur slider touch iOS** | — | E2E-G11 (iPhone) | M-G12 | N | C | Device réel |
| **Ratio I/O 4:3 → 1536x1024** | U-GP-001/005 | — | M-G13 | N | C | Régression session 32 |
| **Messages d'erreur humains** | — | — | M-G14 | N | P | Manuel |
| **Galerie ordre chronologique** | — | — | M-G08 | N | C | — |
| **Object Storage résilience retry** | U-DB-001/002/003 | — | — | N | C | Régression session 19 |

### 6.2 Synthèse couverture

- **Zones entièrement couvertes (unit + E2E + manuel)** : 11/29 cibles (38%)
- **Zones partiellement couvertes** : 6/29 (21%)
- **Zones non-testables automatiquement** : 2/29 (7%, Replit autoscale + monitoring sporadique)
- **Action prioritaire** : écrire les 26 tests unit P0 + 11 E2E + 14 manuels en 2-3 sessions @qa + @fullstack pour passer à 90% couverture.

### 6.3 Priorité d'exécution (ordre recommandé)

1. **Jour 1** : @fullstack ajoute les 16 data-testid + extrait `multi-photo-scheduler.ts` (refactor R1) + écrit les U-MP-001 à U-MP-006 + U-GP-001 à U-GP-013
2. **Jour 1 après-midi** : @qa écrit U-CR-001 à U-CR-014, U-SE-001 à U-SE-005, U-IT-001 à U-IT-008
3. **Jour 2 matin** : @qa écrit les 11 E2E avec mocks
4. **Jour 2 après-midi** : fondateur exécute les 14 tests manuels M-G01 à M-G14 sur iPhone réel + desktop
5. **Jour 3** : intégration smoke test CI, bloquer merge si 1+ gate rouge

---

## Section 7 — Recommandations process

### 7.1 Quand lancer chaque type de test

| Moment | Type de test | Durée | Exécutant |
|---|---|---|---|
| **Chaque commit sur `app/api/generate/` ou `lib/generation-pipeline.ts`** | Tests unit Vitest P0 | < 30s | Pre-commit hook Husky |
| **Chaque PR** | Unit + 3 E2E smoke critiques (E2E-G01, G02, G08) | < 5 min | GitHub Actions |
| **Avant merge main** | Unit + E2E complets (G01 à G11) avec mocks | < 10 min | GitHub Actions |
| **Avant CHAQUE déploiement Replit** | Smoke test 15 points (Section 5) | < 5 min | Manuel fondateur OU `npm run smoke` |
| **Après bump PROMPT_VERSION** | Benchmark visuel Yann + Lucas sur 6 générations | 1-2h | Agents @interior-architect + @ai-image-expert |
| **Hebdomadaire** | Tests manuels iPhone réel (M-G01 à M-G14) | 20 min | Fondateur |
| **Mensuel** | Audit accessibilité axe-core complet | 30 min | @qa |

### 7.2 Bloc CI GitHub Actions minimal

Fichier `.github/workflows/generation-pipeline-ci.yml` :

```yaml
name: Generation Pipeline CI

on:
  pull_request:
    paths:
      - 'app/api/generate/**'
      - 'app/page.tsx'
      - 'lib/generation-pipeline.ts'
      - 'lib/custom-prompt.ts'
      - 'lib/iteration-prompt.ts'
      - 'lib/db.ts'
      - 'lib/credits.ts'
      - 'lib/session.ts'
      - 'tests/**'
  push:
    branches: [main]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx tsc --noEmit        # G28 gate
      - run: npx next lint           # G28 gate (règle CLAUDE.md session 33)
      - run: npx vitest run --coverage
      - uses: actions/upload-artifact@v4
        with: { name: coverage, path: coverage/ }

  e2e-mocked:
    runs-on: ubuntu-latest
    needs: unit
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps chromium webkit
      - run: npm run build
      - run: npx playwright test --project=chromium --project=webkit tests/e2e/generation/
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: playwright-report, path: playwright-report/ }

  smoke:
    runs-on: ubuntu-latest
    needs: e2e-mocked
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci && npx playwright install chromium
      - run: npm run smoke
```

**Règle** : aucun merge sur `main` si l'un des 3 jobs est rouge. Déploiement Replit déclenché manuellement après merge.

### 7.3 Quand bumper PROMPT_VERSION et relancer benchmark

**Déclencheurs obligatoires** :
- Modification d'une constante prompt (PASS1_PREAMBLE_V53, PRESERVATION_V53, PASS2_PREAMBLE_V54, DSLR_LINE...)
- Modification d'un builder (`buildSurfacesResponsesPrompt`, `buildFurnitureResponsesPrompt`, `buildIterationFurnitureResponsesPrompt`)
- Modification d'un `surfacePrompt` ou `furniturePrompt` dans `components/StylePicker.tsx`
- Modification de `applyRoomTypeOverrides` ou `applyOutdoorSubtypeOverrides`
- Ajout d'une directive dans `custom-prompt.ts` (system prompt GPT-4.1-mini)

**Procédure** :
1. Bumper `PROMPT_VERSION` dans `lib/generation-pipeline.ts` (ex : v54 → v55)
2. Ajouter une entrée dans le commentaire JSDoc du PROMPT_VERSION avec le changelog
3. Commit avec message `prompt(vXX): description courte`
4. Déployer en staging
5. **Lancer un benchmark visuel** : 6 générations représentatives (3 indoor, 2 outdoor, 1 iteration) couvrant les 12 styles principaux
6. Pre-fetch les logs + images via `audit-data/` (voir `CLAUDE.md` workflow d'audit visuel)
7. Invoquer @interior-architect (Yann Duval) ET @ai-image-expert (Lucas Moreau) en parallèle avec les chemins locaux
8. Attendre les 2 rapports dans `docs/reviews/`
9. **Seuil d'acceptation** : moyenne Yann ≥ 8.5/10 ET moyenne Lucas ≥ 8.0/10 ET aucune generation < 7/10
10. Si seuil non atteint → itérer sur les prompts avant déploiement production
11. Si seuil atteint → tag `release/prompt-vXX` + déploiement Replit production

### 7.4 Validation anti-régression visuelle (lien avec audits Yann/Lucas)

**Problème** : les tests unitaires et E2E détectent les bugs de LOGIQUE mais pas les régressions VISUELLES (ex : le modèle ajoute une fenêtre hallucinée, efface un radiateur, warm shift).

**Solution en 3 niveaux** :

**Niveau 1 — Automatisé (CI)** :
- `scorePreservationLocal` (SSIM) exécuté sur chaque génération de test
- Seuil bloquant : SSIM < 0.5 = régression structure majeure → CI rouge
- Stocker une baseline SSIM par style dans `tests/baselines/ssim-baselines.json`
- Au bump PROMPT_VERSION, comparer SSIM moyen sur 12 générations vs baseline précédente. Delta > -0.1 → alerte.

**Niveau 2 — Semi-automatisé (staging)** :
- Après chaque bump PROMPT_VERSION, script `scripts/benchmark-prompts.ts` génère 6 images sur 6 styles + 2 room types (12 total) et écrit dans `audit-data/`
- @orchestrator est notifié et pré-fetch automatiquement via WebFetch puis lance Yann + Lucas en parallèle

**Niveau 3 — Manuel (production)** :
- Fondateur exécute 3 générations test "canaries" après chaque déploiement
- Si 1 sur 3 visiblement dégradée → rollback immédiat via Replit

### 7.5 Budget de tests et maintenance

- **Budget initial** : 2 sessions @qa (48-72 Task) pour produire la suite complète + 1 session @fullstack (16 Task) pour refactors R1/R2/R3
- **Budget maintenance** : 1 session @qa par mois pour (1) ajouter les tests des nouveaux learnings de `lessons-learned.md`, (2) ajuster les baselines SSIM, (3) nettoyer les tests flaky
- **Règle "bug = test"** : chaque bug corrigé en session doit produire au MOINS 1 test de non-régression annoté `// REGRESSION: session XX — description`. Le commit du fix et le commit du test sont liés (même PR).

### 7.6 Indicateurs de santé de la suite

Tableau à suivre mensuellement dans `docs/qa/test-suite-health.md` :

| KPI | Cible | Seuil alerte |
|---|---|---|
| Coverage lignes `lib/generation-pipeline.ts` | ≥ 85% | < 75% |
| Coverage lignes `lib/custom-prompt.ts` | ≥ 90% | < 80% |
| Durée CI totale | < 10 min | > 15 min |
| Taux de flakiness E2E | < 2% | > 5% |
| Delta SSIM moyen vs baseline précédente | ≥ -0.05 | < -0.1 |
| Nombre de tests skippés | 0 | > 2 |

---

## Auto-évaluation (grille @qa standard)

- [x] Chaque chemin critique du persona principal (Claire, Thomas, Léa) est couvert par ≥ 1 test E2E ? **OUI** (E2E-G01 à G11 couvrent les 3 personas)
- [x] Un développeur peut comprendre pourquoi chaque test existe sans lire le code ? **OUI** (chaque test cite sa zone à risque et la régression associée)
- [x] Le pipeline CI complet tourne en moins de 10 min ? **OUI cible** (à valider après implémentation)
- [x] Les events du tracking-plan sont vérifiés ? **NON** — hors scope de cette suite (voir qa-strategy.md existante)
- [x] Tests accessibilité (axe-core + clavier) ? **PARTIEL** — mentionné en 7.1 mensuel, à détailler dans qa-strategy.md
- [x] Tests de sécurité (XSS, CSRF, auth bypass, rate limit) ? **PARTIEL** — U-GP-006/007/008 couvrent rate limit, reste hors scope
- [x] Tests de résilience (offline, timeout, session expirée) ? **OUI** (M-G05, M-G11, E2E-G05)
- [x] Chaque bug corrigé a un test de non-régression ? **RÈGLE documentée en 7.5**, à appliquer strictement
- [x] Tests multi-device réels ? **OUI** (E2E-G11 + M-G05, M-G12)
- [x] Zéro invention de données ? **OUI** — chaque test est tracé à un learning de `lessons-learned.md` sessions 30-33

**Verdict auto-évaluation** : 9.5/10 — exigence fondateur respectée. Les 0.5 manquants : validation empirique de la durée CI et du taux de flakiness ne peut être faite qu'après implémentation et premier run en CI.

---

## Handoff

**Prochaine action** : @fullstack exécute le plan suivant en 2 passes successives.

**Passe 1 — Infrastructure testable (durée estimée : 30-45 min)** :
1. Vérifier présence de Vitest dans `package.json` — si absent : `npm i -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom msw fast-check`
2. Créer `vitest.config.ts` avec alias `@/` et environment `jsdom`
3. Créer `tests/unit/mocks/openai.ts`, `tests/unit/mocks/storage.ts`, `tests/unit/mocks/db.ts`
4. Ajouter les 16 `data-testid` listés en Section 1.3 dans `app/page.tsx`
5. Refactor R1 : extraire `lib/multi-photo-scheduler.ts` avec `createJobs`, `batchJobs`, `computeRefund` (fonctions pures)
6. Refactor R3 : créer `lib/generation-schema.ts` avec Zod schema du body `/api/generate`
7. Commit : `chore(test): infra Vitest + data-testid + multi-photo-scheduler extraction`

**Passe 2 — Écriture des tests P0 (durée estimée : 60-90 min)** :
1. Écrire les tests unit P0 de Section 2 (G1 à G6) → 50+ tests
2. `npx vitest run` → tous verts
3. Ajouter les 3 E2E smoke critiques : E2E-G01, E2E-G02, E2E-G08
4. `npx playwright test` sur ces 3 → tous verts
5. Commit : `test(generation): unit + E2E smoke P0 — session 33 regression coverage`

**Handoff suivant → @qa** :
- Exécution des 11 E2E complets après passe 2
- Écriture des tests manuels M-G01 à M-G14 sur iPhone réel (fondateur assisté)
- Mise en place du benchmark SSIM baseline dans `tests/baselines/ssim-baselines.json`
- Documentation process dans `docs/qa/test-suite-health.md`

**Fichiers produits** :
- `/home/user/Architecture/docs/qa/test-suite-generation-pipeline.md` (ce document)

**Décisions prises** :
- Couverture cible 80% lignes sur `lib/`, 60% sur `app/api/` — déjà le standard qa-strategy
- Vitest retenu (déjà standard Next.js), pas Jest
- Playwright avec WebKit pour tester Safari (bug tab-switch session 32)
- Mocks OpenAI obligatoires pour E2E CI (coût + flakiness)
- SSIM local comme premier niveau anti-régression visuelle (zéro coût API)
- Smoke test de 15 points automatisable mais exécutable manuellement en 5 min (double couverture)

**Points d'attention** :
- Les tests manuels iPhone réel NE SONT PAS automatisables (BackgroundDisconnectError session 32) — le fondateur DOIT les exécuter avant chaque deploy qui touche `handleGenerate`
- Les tests visuels qualitatifs RESTENT l'affaire des agents Yann (interior-architect) et Lucas (ai-image-expert) — cette suite ne les remplace pas, elle les complémente
- Variables d'env requises pour CI : `OPENAI_API_KEY` (facultatif — tests mockés en priorité), `NEXTAUTH_SECRET`, `DATABASE_URL` (PG test), Replit Object Storage non requis en CI (mocké)
- Le refactor R1 (`multi-photo-scheduler.ts`) est un PRÉ-REQUIS aux tests U-MP-001 à U-MP-006 — sans ce refactor, ces tests ne peuvent pas être écrits proprement
- Alerte session : ce document compte comme 1 Task producteur @qa. Après exécution des passes par @fullstack, compter 2 Task supplémentaires. Prévoir un break session si dépassement du compteur.

---

**Bloc de handoff → @fullstack**

- Fichier produit : `docs/qa/test-suite-generation-pipeline.md` (stratégie complète Sections 1-7 + Section 8 régression)
- Prochaine action : Passe 1 infrastructure testable (30-45 min) puis Passe 2 écriture tests P0 (60-90 min)
- Décisions : Vitest + Playwright + WebKit + mocks OpenAI + SSIM baseline
- Points d'attention : refactor R1 bloquant pour U-MP-*, data-testid à ajouter avant E2E, tests manuels iPhone non automatisables
- Escalade si bloqué : @qa pour clarification des tests, @ia pour validation des seuils SSIM, @infrastructure pour config CI Replit

---

## Section 8 — Tests de régression obligatoires (bugs concrets fondateur 2026-04-07)

Ces 4 bugs ont été signalés en direct par le fondateur le 2026-04-07 après la session 33. Ils révèlent des **régressions** de fixes sessions 31-33 non propagés, ou des bugs jamais détectés par les audits précédents. Ces tests sont **P0 absolu** — tout déploiement doit les faire passer.

### BR-1 — Compteur « Génération en cours (1/3) » alors que les 3 tournent en parallèle

**Symptôme utilisateur exact** : « Quand j'uploade 3 images, et appuie sur Générer, on peut lire "génération en cours (1/3)", alors que les 3 sont en cours. »

**Hypothèse cause racine** : le label de loading lit un compteur séquentiel (`currentJobIndex + 1 / totalJobs`) au lieu du nombre de jobs actuellement `in_progress`. Depuis la session 33 `MAX_CONCURRENT=5`, les 3 photos tournent bien en parallèle mais le label reste sur l'ancien modèle séquentiel.

**Violation de règle** : F12 R6 (session 33) — « L'expérience identique 1 ou 5 photos. »

| Test ID | Type | Description |
|---------|------|-------------|
| U-BR1-001 | Unit P0 | `formatProgressLabel(jobs)` : 3 jobs `in_progress` → retourne `"Génération en cours (3 en parallèle)"`, PAS `"(1/3)"` |
| U-BR1-002 | Unit P0 | `formatProgressLabel` avec 1 job `in_progress` + 2 `completed` → reflète l'état réel (pas un index séquentiel) |
| E-BR1-001 | E2E P0 | Upload 3 photos → Générer → capturer le label dans les 2s → assert qu'il reflète 3 jobs parallèles |
| M-BR1-001 | Manuel P0 | Upload 3 photos → Générer → observer 10s. Attendu : loading overlay per-photo + label global "3 photos en cours". Écart : "1/3" → "2/3" → "3/3" séquentiel. |

**Fix attendu** : identifier la source du label dans `app/page.tsx`, remplacer par un compteur basé sur `jobs.filter(j => j.status === 'in_progress').length` ou préférer un overlay per-photo.

---

### BR-2 — Photo en surface-only affiche l'AVANT au lieu du résultat passe 1

**Symptôme utilisateur exact** : « Quand j'uploade 3 images et génère, dont 1 en surface seulement, ce dernier affiche en passe 1 uniquement affiche la mauvaise photo (la photo du avant), au lieu de présenter le résultat après (ou avant / après). »

**Hypothèse cause racine** : le toggle `withFurniture=false` (Gallery Gate session 30) désactive la passe 2 côté serveur. Le résultat passe 1 est bien généré mais le mapping côté client pointe sur l'input au lieu du `pass1_url` retourné par l'API. Probable régression de la fusion Mode Pro + Standard (session 31).

| Test ID | Type | Description |
|---------|------|-------------|
| U-BR2-001 | Unit P0 | `buildResultFromApiResponse({ pass1Url, outputUrl: null, withFurniture: false })` → `displayUrl = pass1Url` (PAS `inputUrl`) |
| U-BR2-002 | Unit P0 | Idem avec `withFurniture: true` → `displayUrl = outputUrl` (chemin standard inchangé) |
| E-BR2-001 | E2E P0 | Upload 3, toggle `withFurniture=false` sur #2, Générer → `img[data-testid="result-photo-2"]` `src` pointe sur pass1, PAS input |
| M-BR2-001 | Manuel P0 | Upload 3 photos pièce vide sale → toggle "passe 1 uniquement" sur #2 → Générer → le comparateur #2 doit montrer AVANT (mur sale) vs APRÈS passe 1 (mur rénové sans meuble). Écart : #2 affiche 2× la même photo. |

**Fix attendu** : dans `app/page.tsx`, le mapping du résultat après succès API quand `withFurniture=false` doit assigner `result.displayUrl = pass1Url` (et non `inputUrl`). Vérifier `ImageComparator` reçoit bien (input, pass1).

---

### BR-3 — Affinage/régénération verrouille les autres photos

**Symptôme utilisateur exact** : « Quand j'uploade 3 images et génère, si j'affine (ou regenere une photo), je ne peux plus le faire pour les 2 autres photos. »

**Hypothèse cause racine** : état `isRefining` / `isRegenerating` / `iterationsRemaining` est **global** au lieu d'être **per-photo**.

**Violation de règle ABSOLUE** : F12 R6 (session 33) — « L'expérience IDENTIQUE peu importe le nombre d'éléments. »

| Test ID | Type | Description |
|---------|------|-------------|
| U-BR3-001 | Unit P0 | `refiningPhotoIndex === 0` → photo #1 disabled, `isButtonDisabled(1)` et `isButtonDisabled(2)` = `false` |
| U-BR3-002 | Unit P0 | `iterationsRemaining: Map<number, number>` indexée par photo : décrémenter `.get(0)` ne touche pas `.get(1)` ni `.get(2)` |
| U-BR3-003 | Unit P0 | 2 affinages parallèles sur #0 et #1 : états loading indépendants, pas de race |
| E-BR3-001 | E2E P0 | Upload 3, Générer, Affiner #1 → pendant l'affinage, boutons #2/#3 enabled → cliquer Affiner #2 en parallèle → les 2 coexistent |
| E-BR3-002 | E2E P0 | Idem pour Régénérer |
| M-BR3-001 | Manuel P0 | Affiner #1, pendant que ça tourne, cliquer Affiner sur #2. Attendu : bouton cliquable, modale ouvre. Écart : bouton grisé. |

**Fix attendu** : transformer `isRefining`, `isRegenerating`, `pass2Pending`, `iterationsRemaining` en Map/object indexés par `resultIndex`. Handlers acceptent `photoIndex`.

---

### BR-4 — Tab-switch iOS pendant itération → BACKGROUND_DISCONNECT

**Symptôme utilisateur exact** : « Si j'affine et change d'application sur téléphone, je peux lire : BACKGROUND_DISCONNECT - Votre itération n'a pas été consommée. »

**Hypothèse cause racine** : session 32 a retiré `AbortController.signal` du fetch de génération principale (+ toast galerie). Ce fix n'a **pas été propagé** au fetch d'itération. Le signal est toujours attaché → iOS tue la connexion en background → `BackgroundDisconnectError`.

**Violation de règle** : session 32 — « Ne JAMAIS passer `AbortController.signal` au fetch pour les requêtes longues. »

| Test ID | Type | Description |
|---------|------|-------------|
| U-BR4-001 | Unit P0 | `handleRefine` fetch : option `signal` absente du second argument |
| U-BR4-002 | Unit P0 | Grep test : aucun appel iteration à `/api/generate` n'inclut `signal:` |
| U-BR4-003 | Unit P0 | `BackgroundDisconnectError` sur itération → `refundCredit()` appelé + toast galerie affiché (pattern session 32) |
| E-BR4-001 | E2E Playwright WebKit | Upload 3, Générer, Affiner #1 → mock `BackgroundDisconnectError` → assert toast "galerie" + refund + bouton réactivé |
| M-BR4-001 | Manuel P0 iPhone RÉEL | Affiner #1 → basculer sur autre app 15s → revenir. Attendu : toast "galerie" OU affinage réussi. Écart : message "BACKGROUND_DISCONNECT". |

**Fix attendu** : retirer `signal: controller.signal` du fetch d'itération. Utiliser `Promise.race([fetch(), timeoutPromise])` pour timeout. Gérer `BackgroundDisconnectError` comme session 32 (toast galerie + refund). **JAMAIS de retry** (double facturation).

---

### Matrice de régression Section 8

| Bug | Règle violée | Unit | E2E | Manuel | Priorité |
|-----|--------------|------|-----|--------|----------|
| BR-1 | F12 R6 | U-BR1-001/002 | E-BR1-001 | M-BR1-001 | P0 |
| BR-2 | Gallery Gate s30 | U-BR2-001/002 | E-BR2-001 | M-BR2-001 | P0 |
| BR-3 | F12 R6 | U-BR3-001/002/003 | E-BR3-001/002 | M-BR3-001 | P0 |
| BR-4 | Session 32 fix | U-BR4-001/002/003 | E-BR4-001 | M-BR4-001 | P0 |

**Règle permanente** : à chaque fix d'un BR, ajouter un commentaire `// REGRESSION: BR-X session 34 (2026-04-07)` au-dessus de la ligne corrigée, et conserver le test à perpétuité. Les bugs concrets signalés par le fondateur ne doivent JAMAIS réapparaître.

**Handoff Section 8 → @fullstack**

- @fullstack travaille déjà sur BR-3 et BR-4 en arrière-plan (mission lancée 2026-04-07)
- Après ces 2 bugs, traiter aussi BR-1 et BR-2 (10-15 min chacun par lecture de code)
- Tests U-BR* et E-BR* écrits AVANT le fix (TDD) pour valider l'échec puis le succès
- M-BR4-001 nécessite iPhone physique — aucune alternative automatisée

