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

