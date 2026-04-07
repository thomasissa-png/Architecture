# v55 — Review non-régression @ia (session 35)

**Auteur :** @ia
**Date :** 2026-04-07
**Commits audités :** `e749f31` + `92972af` + `45a1552` (branche `claude/extract-project-context-vFT9J`)
**Cible :** valider l'ensemble v55 AVANT déploiement Replit par le fondateur
**Scope :** non-régression croisée des 4 fixes P0 + du câblage input_fidelity adaptatif

---

## Verdict global

**GO DEPLOY** — 10/10 checks PASS, 0 bloquant P0, 0 régression détectée.

Pipeline `npx next lint` + `tsc --noEmit` + `next build` + `vitest run` : **tous clean**.
Suite de tests : **184 passed / 4 skipped / 0 failed** (baseline session 34 préservée).

---

## Résultat par check

| # | Check | Verdict | Note |
|---|---|---|---|
| C1 | Cohérence inter-fixes | PASS | Aucun des 4 fixes n'en contredit un autre — zones de responsabilité disjointes |
| C2 | PROPAGATION CROSS-HANDLER (room_type) | PASS | 2 codepaths identifiés et synchronisés, 0 handler oublié |
| C3 | STATE INDEXÉ PAR ÉLÉMENT | PASS | N/A pour v55 (pas de state UI touché), aucun single-state introduit |
| C4 | COVERAGE-DRIVEN REFACTOR | PASS | +9 tests `image-utils-highlights.test.ts`, baseline respectée |
| C5 | 100% TESTS PASS | PASS | `failed: 0`, conforme à la préférence fondateur absolue |
| C6 | Build production | PASS | lint 0 warn, tsc clean, `next build` Compiled successfully |
| C7 | Préférences fondateur absolues | PASS | 0 grain photographique, gpt-image-1.5 unique, 0 curtain dans les styles |
| C8 | Heuristique input_fidelity | PASS | Seuil 5% documenté, passe 1 uniquement, fail-open correct, logs lisibles |
| C9 | Custom prompt flow | PASS | `custom-prompt.ts` aligné (règle + 2 exemples propagés) |
| C10 | Pas de fichier orphelin | PASS | `git status` clean, rien à corriger |

---

## C1 — Cohérence inter-fixes (PASS)

Les 4 fixes P0 opèrent sur des zones disjointes du pipeline :

| Fix | Zone | Impact |
|---|---|---|
| P0-A room_type propagation | `lib/generation-pipeline.ts:944-949` + `app/api/generate/route.ts:719-724` | Sélection du furniturePrompt selon roomType |
| P0-B suppression vault beams | `StylePicker.tsx` + `style-resolver.ts` (12 styles) + `custom-prompt.ts` | Formulation des surfacePrompts indoor |
| P0-C ARCHITECTURAL_HONESTY_V55 | `lib/generation-pipeline.ts:211` + 8 branches `buildSurfacesResponsesPrompt` | Clause globale anti-invention en tête de passe 1 |
| P0-D Contemporary color shift | `StylePicker.tsx:34` + `style-resolver.ts:34` (1 style) | Préservation température murs |
| input_fidelity adaptatif (@ia) | `lib/image-analysis.ts` (new) + `lib/generation-pipeline.ts:787-805` | Paramètre API en passe 1 uniquement |

**Vérifications de non-interférence :**
- `ARCHITECTURAL_HONESTY_V55` dit "if input ceiling is flat, keep it flat — do not add beams". Les surfacePrompts Mediterranean/Industrial conservent une formulation **conditionnelle positive** ("if — and only if — input shows visible beams, preserve them"). Aucune contradiction : la clause globale et les clauses locales expriment la même règle (refléter l'existant, pas inventer).
- La suppression vault beams sur 10 styles n'a PAS créé de trou pour Mediterranean/Industrial — leurs formulations conditionnelles sont vérifiées présentes (StylePicker.tsx:100, StylePicker.tsx Industrial, et symétriquement dans style-resolver.ts).
- Le fix room_type via `getStyleMaterialHint` ne casse pas le flow custom prompt : `custom-prompt.ts` ne transite JAMAIS par `applyRoomTypeOverrides` — les prompts custom sont utilisés directement par le client qui envoie `surfacePrompt`/`furniturePrompt` déjà résolus. Les deux codepaths sont indépendants.
- Le fix `input_fidelity` adaptatif en passe 1 et la préservation `"high"` en passe 2 sont cohérents avec l'investigation : la pass2 reçoit une image propre sans highlights cramés, donc n'a plus besoin de fallback `"low"`. Double-régression (perte fidélité globale + perte attention) exclue par design.

---

## C2 — PROPAGATION CROSS-HANDLER (PASS)

Grep exhaustif `applyRoomTypeOverrides(` sur le code production :

```
lib/generation-pipeline.ts:928   ← fix appliqué lignes 944-949
app/api/generate/route.ts:703    ← fix propagé lignes 719-724
lib/room-types.ts:234            ← définition de la fonction (inchangée)
```

**Seuls 2 callers en production.** La règle PROPAGATION CROSS-HANDLER (session 34) est respectée.

Grep complémentaire sur `roomFurnitureOverride` et `getStyleMaterialHint` : les mêmes 2 fichiers apparaissent côté production, plus `lib/room-types.ts` (source). Aucun 3e handler caché.

Les deux blocs de code sont structurellement identiques (commentaire CRITICAL FIX v55, même logique `rt?.roomFurnitureOverride`, même branche fallback). La cohérence est vérifiable visuellement.

---

## C3 — STATE INDEXÉ (PASS)

V55 ne touche aucun state React ni aucune collection indexée. Règle session 34 non applicable mais non violée. Les modifications sont purement côté serveur (pipeline) et côté données (prompts constants).

---

## C4 — COVERAGE-DRIVEN REFACTOR (PASS)

Tests ajoutés par @ia : `tests/unit/image-utils-highlights.test.ts` (9 tests). Couverture :
- Seuils bas/haut/intermédiaires
- Fail-open sur buffer invalide
- Entrées base64 brutes et data URI
- Seuil custom paramétrable

Avant v55 : 175 passed / 4 skipped (baseline session 34 selon `docs/reviews/v55-fixes-applied.md`).
Après v55 : **184 passed / 4 skipped**.
Delta : +9 tests, alignés avec le nouveau module `image-analysis.ts`. Pas de test skippé ou supprimé.

---

## C5 — 100% TESTS PASS (PASS)

Résultat `npx vitest run` :

```
Test Files  15 passed (15)
Tests       184 passed | 4 skipped (188)
Duration    5.44s
```

`failed: 0` → préférence fondateur absolue respectée.
Les 4 tests skipped sont intentionnels (héritage session 34, justifications commentées dans leurs fichiers respectifs).

---

## C6 — Build production (PASS)

```
npx next lint      → ✔ No ESLint warnings or errors
npx tsc --noEmit   → (silent, 0 erreur)
npx next build     → ✓ Compiled successfully (all routes static + dynamic)
```

`tsconfig.json` exclut toujours `tests/**`, `playwright.config.ts`, `vitest.config.ts`, `vitest.setup.ts` — fix session 34 (commit `8ffac6e`) préservé, non touché par v55.

---

## C7 — Préférences fondateur absolues (PASS)

| Interdit | Vérification | Résultat |
|---|---|---|
| Grain photographique (grain, ISO 200, vignetting, noise) | Grep sur `StylePicker.tsx`, `style-resolver.ts`, `generation-pipeline.ts`, `custom-prompt.ts` | Aucune occurrence active — "wood grain" (texture bois) et "visible natural grain" (grain du bois whitewashed) sont des descripteurs matériaux, pas photographiques. Le seul hit `PHOTO_GRAIN` est dans un **commentaire historique v43** (non-exécuté). `custom-prompt.ts:80` interdit explicitement ces termes dans les outputs LLM. |
| `font-light` non touché | Aucune modif CSS dans v55 | Clean |
| Fallback Flux/SDXL/DALL-E | Grep `Flux\|SDXL\|DALL-E\|Depth Pro` dans les fichiers v55 | Aucun ajout, `gpt-image-1.5` reste unique (`IMAGE_MODEL` constant inchangé) |
| curtains/drapes/windows dans stylePrompts | Grep sur `StylePicker.tsx` + `style-resolver.ts` | 0 occurrence. Les matches "draped over" sont des verbes textiles (throw draped over sofa arm), pas des window treatments. `custom-prompt.ts` les interdit explicitement. |

---

## C8 — Heuristique input_fidelity (PASS)

Relecture croisée du code `lib/image-analysis.ts` + zone `generation-pipeline.ts:781-805` + documentation `docs/ia/v55-input-fidelity-investigation.md` :

| Critère | Résultat |
|---|---|
| Seuil 5% documenté dans le code | ✅ `DEFAULT_RATIO_THRESHOLD = 0.05` + commentaire explicatif (lignes 29-30) |
| Seuil 5% documenté dans le doc | ✅ Section 3.1 de `v55-input-fidelity-investigation.md` |
| Appliqué uniquement en passe 1 | ✅ `if (pass === 1)` ligne 788 ; passe 2 force `"high"` ligne 812 (`pass === 1 ? pass1Fidelity : "high"`) |
| Fail-open en cas d'erreur sharp | ✅ try/catch lignes 789-804 → `pass1Fidelity` reste `"high"` |
| Fail-open interne `detectBlownHighlights` | ✅ try/catch lignes 52-74 → `{ ratio: 0, hasBlownHighlights: false }` |
| Logs debug lisibles | ✅ Deux messages explicites avec pourcentage formaté + action prise |
| Modèle `tryOpenAIResponsesWithPrompt` (iterations) non affecté | ✅ Hardcode `"high"` ligne 683 — cohérent avec règle "iterations = preserve mobilier existant" |

**Note importante :** la détection tourne sur TOUTES les pass 1, même sur des inputs propres. Overhead ~10ms via sharp downsample 256×256 greyscale — négligeable vs latence API gpt-image-1.5 (~15-30s). Logs montreront la décision prise sur chaque génération, utile pour l'audit en prod.

---

## C9 — Custom prompt flow (PASS)

Relecture `lib/custom-prompt.ts` :

- **Ligne 68** (rule) : nouvelle phrase "matching its exact shape without adding any relief, beams, or coffers" + instruction négative "do NOT mention vault beams unless Mediterranean/Industrial with visible beams". Propagation cohérente avec P0-B.
- **Ligne 80** : interdit film grain/ISO noise/sensor grain/vignetting — aligné préférence fondateur.
- **Ligne 81** : interdit curtains/drapes/window treatments — aligné C7.
- **Ligne 87** (exemple Cosy) : utilise la nouvelle phrasing "matching its exact shape without adding any relief, beams, or coffers". ✅
- **Ligne 91** (exemple Industrial) : utilise la formulation conditionnelle "If the input shows visible structural beams, IPN, or steel girders, preserve them. Otherwise apply a flat painted ceiling". ✅

Le system prompt GPT-4.1-mini (pre-processing custom) est pleinement synchronisé avec les 12 stylePrompts.

Un seul grep résiduel `vault beams` dans `custom-prompt.ts:68` : il s'agit de l'instruction négative au LLM qui INTERDIT la mention — volontaire, à conserver.

---

## C10 — Pas de fichier orphelin (PASS)

`git status` avant review : working tree clean.
Aucun dead code introduit, aucun import orphelin, aucun commentaire TODO résiduel lié à v55.

Après review : aucun fix correctif nécessaire → aucun commit supplémentaire à pousser.

---

## Findings critiques

**Aucun.** Zero P0 bloquant, zero P1, zero P2.

Les 4 fixes P0 prompts + le câblage input_fidelity adaptif + la propagation cross-handler room_type forment un ensemble cohérent, testé, buildable, et prêt au déploiement.

---

## Points d'attention post-déploiement (non bloquants)

1. **Validation visuelle A/B** (section 4 de `v55-input-fidelity-investigation.md`) : le fondateur doit re-générer `gen-192-input.jpg` + `gen-194-input.jpg` en prod et vérifier que l'artefact de fusion a disparu. Ces 2 inputs sont le pire cas (baies vitrées cramées massives).
2. **Logs à monitorer** dans `/admin` : chercher `[v55] blown highlights detected (X.X%)` pour voir le taux de déclenchement de la bascule `low`. Un taux >50% sur la population réelle suggérerait que le seuil 5% est trop bas.
3. **Pipeline B Contemporary dining_room** (P0-A) : test critique à re-générer sur le même input que `#196` — doit livrer une table à manger 180cm + 6 chaises + sideboard, plus aucun canapé.
4. **Pipeline A Mediterranean bedroom_adults** : audit avec l'ancienne formulation "vault beams" — le plafond plat BA13 ne doit plus avoir de caissons quadrillés hallucinés grâce à `ARCHITECTURAL_HONESTY_V55`.

Ces points sont des **validations d'impact métier**, pas des bloquants de non-régression. L'audit Yann/Lucas post-déploiement les tranchera.

---

## Handoff

→ **Fondateur** : **GO DEPLOY**. Pull `claude/extract-project-context-vFT9J`, push sur Replit, re-générer les 4 inputs de l'audit v54 (voir `docs/reviews/v55-fixes-applied.md` section 7), puis lancer `@orchestrator session 36` pour audit croisé Yann + Lucas. Cible ≥ 9.5/10.

→ **@orchestrator (session 36)** : après déploiement, pré-fetcher les nouveaux logs via le workflow d'audit visuel standard (CLAUDE.md section "Workflow d'audit visuel") et lancer Yann + Lucas en parallèle sur les 4 inputs critiques.

→ **@fullstack** : aucune action requise. Le fix `45a1552` est bien ciblé et cohérent avec le pattern existant — rien à corriger.
