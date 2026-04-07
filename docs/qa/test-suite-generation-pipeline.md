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

