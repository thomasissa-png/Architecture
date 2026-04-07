# Prompt Regression Gates — Spec

## Introduction

Suite à 19 sprints d'audits visuels (Sprint 17 → Session 36), la majorité des régressions sur les prompts gpt-image-1.5 sont **détectables par grep ou snapshot**. Cette spec définit les gates de non-régression à mettre en place pour bloquer ces bugs avant qu'ils n'arrivent en prod. Périmètre : `lib/generation-pipeline.ts`, `components/StylePicker.tsx`, `lib/style-resolver.ts`, `lib/style-variants.ts`, `lib/room-types.ts`, `app/api/generate/route.ts`.

Statut : Partie 1/2 — @ia spec + implémente les gates simples (catégories A, B, D, F, G). @qa prend le relais pour C, E, H, I.

---

## Catégorie A — Vocabulaire interdit dans prompts

| ID | Nom | Vérifie | Bug historique | Criticité | Owner |
|---|---|---|---|---|---|
| **G-PROMPT-A01** | No "vault beams" hors Med/Indus | Aucun `surfacePrompt` (12 styles) ne contient `vault beams` ou `structural ribs` sauf `mediterranean` (clause conditionnelle) et `industrial` (clause conditionnelle). | Sprint 23 / Session 36 v55 P0-B : "vault beams" amorçant 10/12 styles → plafonds caissons hallucinés sur plafonds plats. | BLOQUANT | @ia |
| **G-PROMPT-A02** | No `curtains/drapes` dans stylePrompts | Aucun `surfacePrompt` ni `furniturePrompt` (12 styles + variants) ne contient `curtain`, `drape`, `sheer linen`. | Sprint 12 + Session 32 BR : `curtains/drapes` → fenêtres hallucinées. | BLOQUANT | @ia |
| **G-PROMPT-A03** | No `window/door` dans stylePrompts | Aucun `surfacePrompt`/`furniturePrompt` ne mentionne explicitement `window` ou `doorway` (en negative ou positive). | Sprint 12 : "DO NOT add windows" amorçait le modèle → invention de fenêtre. | BLOQUANT | @ia |
| **G-PROMPT-A04** | No `TRANSFORM` instruction | Aucun builder ne contient `TRANSFORM` en majuscules comme verbe d'action. Utiliser `Edit`/`Add`/`CHANGE ONLY`. | Sprint 11 : `TRANSFORM` → modèle régénère scène entière au lieu d'éditer. | BLOQUANT | @ia |
| **G-PROMPT-A05** | No `pixel-identical` | Aucun builder ne contient `pixel-identical` ni `pixel identical`. Préférer `visually identical`. | Sprint 17 : `pixel-identical` rendait modèle ultra-conservateur (n'ajoutait rien). | BLOQUANT | @ia |
| **G-PROMPT-A06** | No `smooth white ceiling` | Aucun `surfacePrompt` ne contient `smooth white ceiling`. | Sprint 16 : `smooth white ceiling` lissait les voûtes/poutres existantes. | BLOQUANT | @ia |
| **G-PROMPT-A07** | No grain / film grain / vignetting | Aucun builder ni stylePrompt ne contient `film grain`, `sensor grain`, `ISO 200`, `vignetting`, `vignette`. | Session 33 + préférence fondateur : pas de grain — décision absolue rendu lisse. | BLOQUANT | @ia |
| **G-PROMPT-A08** | No "preserve existing floor material" | Aucun `surfacePrompt` ne contient `preserve existing floor material` ni `preserving existing floor material`. | Sprint 16 : contresens sur chantier brut — toujours nommer le matériau cible. | BLOQUANT | @ia |
| **G-PROMPT-A09** | No "preserve existing ceiling light" | Aucun `surfacePrompt` ne contient `preserve existing ceiling light`. | Sprint 16 : ambigu sans luminaire visible — toujours prescrire un luminaire. | REQUIS | @ia |
| **G-PROMPT-A10** | No competitor brand names | Aucun fichier prompt ne contient `Midjourney`, `Replicate`, `DALL-E`, `SDXL`, `Flux Depth`, `Stable Diffusion` comme instruction de style (les commentaires sont autorisés). | Préférence fondateur : un seul modèle gpt-image-1.5. | WARNING | @ia |
| **G-PROMPT-A11** | No `kitchen island` dans pre-processing custom | Le filtre custom-prompt ne laisse pas passer `kitchen island` (built-in, pas freestanding). | Sprint 17b : "kitchen island" passait le filtre alors que c'est un meuble encastré. | REQUIS | @qa (zone : `lib/custom-prompt.ts`) |

## Catégorie B — Structure des prompts

| ID | Nom | Vérifie | Bug historique | Criticité | Owner |
|---|---|---|---|---|---|
| **G-PROMPT-B01** | `PROMPT_VERSION` exporté | `lib/generation-pipeline.ts` exporte `PROMPT_VERSION` (string non vide). | Sprint 15 : versioning audit Yann/Lucas. | BLOQUANT | @ia |
| **G-PROMPT-B02** | `PASS1_PREAMBLE` injecté dans 8 builders indoor | Chaque branche `roomTypeId` (`kitchen`, `bathroom`, `wc`, `bedroom_adults/children`, `laundry`, `cellar`, `entryway`, fallback) contient `PASS1_PREAMBLE_V53`. | Session 35 : propagation cross-handler manquante → builder oublié. | BLOQUANT | @ia |
| **G-PROMPT-B03** | `ARCHITECTURAL_HONESTY` injecté dans 8 builders pass 1 | Idem, `ARCHITECTURAL_HONESTY_V55` présent dans toutes les branches passe 1. | Session 36 v55 P0-C : invention de structures non visibles. | BLOQUANT | @ia |
| **G-PROMPT-B04** | `PASS2_PREAMBLE` injecté dans 9 builders pass 2 | Chaque branche `furnitureResponsesPrompt` (kitchen/bathroom/wc/bedroom×2/entryway/laundry/cellar/dining_room/fallback) contient `PASS2_PREAMBLE_V54`. | Sprint 22 : préservation surfaces passe 2. | BLOQUANT | @ia |
| **G-PROMPT-B05** | Builder pass 2 contient `ADD` (pas `TRANSFORM`) | Tous les builders pass 2 utilisent une instruction `ADD ...` pour le mobilier. | Sprint 11 : action d'AJOUT, pas de transformation. | BLOQUANT | @ia |
| **G-PROMPT-B06** | Longueur passe 1 max 2200 chars | `buildSurfacesResponsesPrompt(...)` retourne ≤2200 chars pour chaque combinaison style × room. | gpt-image-1.5 perd l'attention >200 mots (Sprint 23). | REQUIS | @qa (snapshot 12×9) |
| **G-PROMPT-B07** | Longueur passe 2 max 2200 chars | Idem pour `buildFurnitureResponsesPrompt(...)`. | Idem. | REQUIS | @qa |
| **G-PROMPT-B08** | DSLR_LINE en fin de prompt pass 1 | `DSLR_LINE` présent en fin de chaque builder passe 1. | Sprint 6 : descripteurs photo techniques. | REQUIS | @ia |
| **G-PROMPT-B09** | `EQUIPMENT_PRESERVATION` couvre radiateur/convecteur | `PASS2_EQUIPMENT_V54` mentionne `radiator`, `convector`, `vent`, `panel`. | Sprint 18 + Sprint 23 : équipements muraux supprimés. | BLOQUANT | @ia |
| **G-PROMPT-B10** | Outdoor builder pass 1 contient `ANTI_INVENTION` | `buildOutdoorSurfacesResponsesPrompt` contient `ANTI_INVENTION`. | Sprint 19 : invention de structures outdoor. | REQUIS | @ia |

## Catégorie C — Room type override (délégué @qa)

| ID | Nom | Vérifie | Bug historique | Criticité | Owner |
|---|---|---|---|---|---|
| **G-PROMPT-C01** | `dining_room` ne contient pas `sofa, coffee table` | Le prompt construit pour `dining_room` × style × n'importe quel variant ne contient PAS `sofa` ni `coffee table` dans la zone furniturePrompt finale. | Session 35 v55 P0-A : dining_room utilisait variant living_room concaténé → modèle livrait salon. | BLOQUANT | @qa (snapshot) |
| **G-PROMPT-C02** | `office` ne contient pas `sofa, dining table` | Idem pour office. | Idem. | BLOQUANT | @qa |
| **G-PROMPT-C03** | `living_room` est seul à recevoir variant complet | `applyRoomTypeOverrides` + caller route.ts/pipeline : seul `living_room` a `roomFurnitureOverride === ""`. | Idem v55 P0-A. | BLOQUANT | @qa |
| **G-PROMPT-C04** | `getStyleMaterialHint` utilisé quand `roomFurnitureOverride` non vide | Vérifier dans `route.ts` ET `lib/generation-pipeline.ts` que la branche `if (rt?.roomFurnitureOverride)` appelle `getStyleMaterialHint(styleId)`. | Session 35 propagation cross-handler. | BLOQUANT | @qa |
| **G-PROMPT-C05** | `bedroom_*` `roomNegativeOverride` contient `sofa` | Vérifie `ROOM_TYPES.bedroom_adults.roomNegativeOverride.includes("sofa")`. | Préservation room type. | REQUIS | @qa |
| **G-PROMPT-C06** | `kitchen` `roomNegativeOverride` contient `sofa, coffee table` | Idem. | Idem. | REQUIS | @qa |

## Catégorie D — input_fidelity

| ID | Nom | Vérifie | Bug historique | Criticité | Owner |
|---|---|---|---|---|---|
| **G-PROMPT-D01** | Pass 1 default `low` | `tryOpenAIResponses` signature : `inputFidelity: InputFidelity = "low"`. | Session 36 v56 : `high` par défaut → leakage compositing pass 1. | BLOQUANT | @ia |
| **G-PROMPT-D02** | Pass 2 explicite `high` | `generatePass` appelle `tryOpenAIResponses(... pass === 1 ? "low" : "high")`. | Session 36 v56 : pass 2 doit préserver pass 1 finie. | BLOQUANT | @ia |
| **G-PROMPT-D03** | Iteration utilise `high` | `tryOpenAIResponsesWithPrompt` utilise `input_fidelity: "high"`. | Sprint 24 : iteration = surgical edit, fidelity max. | REQUIS | @ia |
| **G-PROMPT-D04** | Type `InputFidelity` exporté | `lib/generation-pipeline.ts` exporte `InputFidelity` union `"high" \| "low"`. | Sécurité type SDK absent. | REQUIS | @ia |

## Catégorie E — Snapshots prompts construits (délégué @qa)

| ID | Nom | Vérifie | Bug historique | Criticité | Owner |
|---|---|---|---|---|---|
| **G-PROMPT-E01** | 12×9 snapshots pass 1 | Snapshot du `buildSurfacesResponsesPrompt(style, roomType, "")` pour les 108 combinaisons. | Sprint 22 : régression silencieuse non détectée jusqu'à audit prod. | REQUIS | @qa |
| **G-PROMPT-E02** | 12×9 snapshots pass 2 | Idem pour `buildFurnitureResponsesPrompt`. | Idem. | REQUIS | @qa |
| **G-PROMPT-E03** | Snapshot outdoor pass 1 | Pour les 9+ outdoor styles. | Idem. | REQUIS | @qa |
| **G-PROMPT-E04** | Snapshot outdoor pass 2 | Idem. | Idem. | REQUIS | @qa |
| **G-PROMPT-E05** | Snapshot iteration prompt | Pour `iteration-prompt.ts` avec `restyle/adjust × indoor/outdoor`. | Sprint 24 : audit iteration. | REQUIS | @qa |

## Catégorie F — Schéma STYLE_VARIANTS

| ID | Nom | Vérifie | Bug historique | Criticité | Owner |
|---|---|---|---|---|---|
| **G-PROMPT-F01** | 12 styles dans STYLE_VARIANTS | `Object.keys(STYLE_VARIANTS).length === 12`. | Sprint 22 : oubli synchro variant pour un style. | BLOQUANT | @ia |
| **G-PROMPT-F02** | 3 furnitureVariants par style | Chaque style a `furnitureVariants.length === 3`. | Idem. | BLOQUANT | @ia |
| **G-PROMPT-F03** | 3 accentPalettes par style | Chaque style a `accentPalettes.length === 3`. | Idem. | BLOQUANT | @ia |
| **G-PROMPT-F04** | Chaque variant contient `FOREGROUND` | Chaque furnitureVariant contient `FOREGROUND` (structure spatiale Yann Sprint 14). | Sprint 14 : distribution spatiale en profondeur. | REQUIS | @ia |
| **G-PROMPT-F05** | Chaque variant non vide | Aucun furnitureVariant n'est une chaîne vide ou < 200 chars. | Sécurité contenu. | BLOQUANT | @ia |
| **G-PROMPT-F06** | IDs STYLE_VARIANTS = IDs STYLES | Les 12 keys de STYLE_VARIANTS correspondent aux 12 IDs de STYLES (sans `custom`). | Synchro. | BLOQUANT | @ia |

## Catégorie G — Synchronisation StylePicker ≡ style-resolver

| ID | Nom | Vérifie | Bug historique | Criticité | Owner |
|---|---|---|---|---|---|
| **G-PROMPT-G01** | 12 styles dans les deux fichiers | `STYLES.length === 12` (StylePicker) et 12 keys dans `INDOOR_STYLES` (style-resolver). | Sprint 22 : désync StylePicker ≠ resolver. | BLOQUANT | @ia |
| **G-PROMPT-G02** | IDs identiques | Les 12 IDs de `STYLES` matchent les keys de `INDOOR_STYLES`. | Idem. | BLOQUANT | @ia |
| **G-PROMPT-G03** | surfacePrompt identique | Pour chaque ID, `STYLES.find(s => s.id === id).surfacePrompt === INDOOR_STYLES[id].surfacePrompt`. | Idem. | BLOQUANT | @ia |
| **G-PROMPT-G04** | furniturePrompt non-vide dans les 2 fichiers | Pour chaque ID, les 2 versions existent et > 500 chars. **Note** : les formats diffèrent intentionnellement (StylePicker = templated `(choose one: ...)`, resolver = aplati). Le strict equality est délégué à @qa via snapshots E. | Sprint 22 (sync). | REQUIS | @ia |

## Catégorie H — Cross-handler propagation (délégué @qa)

| ID | Nom | Vérifie | Bug historique | Criticité | Owner |
|---|---|---|---|---|---|
| **G-PROMPT-H01** | route.ts ≡ pipeline.ts logique room_type | Le bloc `if (rt?.roomFurnitureOverride)` existe à l'identique dans `app/api/generate/route.ts` et `lib/generation-pipeline.ts`. | Session 35 : fix v55 P0-A appliqué dans pipeline mais pas dans route → BR P0. | BLOQUANT | @qa |
| **G-PROMPT-H02** | `ROOMS_WITH_DEDICATED_BUILDERS` constant identique | La liste des 8 dedicated builders est identique entre les 2 fichiers. | Idem. | BLOQUANT | @qa |
| **G-PROMPT-H03** | Image model unique | Aucun fichier `lib/`, `app/api/` ne contient `gpt-image-1` (sans `.5`) sauf commentaires. | Préférence fondateur 2026-04-04 : gpt-image-1.5 unique. | BLOQUANT | @qa (grep multi-fichiers) |
| **G-PROMPT-H04** | Pas de fallback Flux/SDXL/DALL-E | Aucun import actif `replicate`, `flux-depth`, `dall-e`, `sdxl` dans le code production. | Décision fondateur Sprint 22+. | BLOQUANT | @qa |

## Catégorie I — CI / intégration (délégué @qa)

| ID | Nom | Vérifie | Criticité | Owner |
|---|---|---|---|---|
| **G-PROMPT-I01** | Pre-commit hook | `npx vitest run tests/unit/prompt-*.test.ts` exécuté en pre-commit (husky ou lint-staged). | REQUIS | @qa |
| **G-PROMPT-I02** | CI pre-deploy | Pipeline CI bloque le deploy si une gate BLOQUANT échoue. | BLOQUANT | @qa |
| **G-PROMPT-I03** | Reporting | Output vitest visible dans logs Replit/CI. | REQUIS | @qa |
| **G-PROMPT-I04** | Doc maintien | `docs/ia/prompt-regression-gates-spec.md` à jour à chaque PROMPT_VERSION. | REQUIS | @ia |

---

## Récapitulatif

- **Total gates spec : 38**
- **Implémentées par @ia (Partie 1) : 24** — catégories A (10), B (10), D (4), F (6), G (4) → tests couvrent A + B + D + F + G
- **Déléguées à @qa (Partie 2) : 14** — catégories C (6), E (5), H (4), I (4)

---

## Pour @qa — Handoff implémentation Partie 2

### Catégories à couvrir

1. **Catégorie C — Room type override (6 gates)** : tests d'intégration sur `applyRoomTypeOverrides` + caller logic. Stubber les builders, vérifier la concaténation finale pour chaque combinaison `roomType × style`. Bug à éviter : v55 P0-A dining_room → salon.

2. **Catégorie E — Snapshots prompts (5 gates)** : utilise `expect.toMatchSnapshot()` de vitest. Reconstruction sans appel API : `buildSurfacesResponsesPrompt(stylePrompt, roomType, "")` retourne le prompt final déterministe (pas d'aléa). Pour les variants avec `(choose one: ...)`, utilise un seed fixe ou neutralise via mock de `Math.random`. Génère 12×9 = 108 snapshots indoor pass 1, 108 pass 2, +9×4 outdoor, +iteration. Place dans `tests/unit/__snapshots__/prompt-built.snap`.

3. **Catégorie H — Cross-handler propagation (4 gates)** : grep cross-fichiers pour vérifier que le fix v55 P0-A est dans `route.ts` ET `lib/generation-pipeline.ts`. Pattern : extraire le bloc `if (rt?.roomFurnitureOverride)` des deux fichiers et comparer. Vérifier qu'aucun `gpt-image-1` (sans `.5`) ne traîne dans le code prod (exclusion : commentaires CHANGELOG/PROMPT_VERSION).

4. **Catégorie I — CI integration (4 gates)** : ajouter au `package.json` un script `test:prompts` ; configurer un hook pre-commit Husky ; ajouter un step pre-deploy dans le workflow Replit.

### Conseils pratiques

- **Reconstruction d'un prompt sans API** : `buildSurfacesResponsesPrompt(STYLE_PROMPTS_RESOLVER.scandinavian.surfacePrompt, "kitchen", "")` retourne directement la string envoyée à OpenAI. Aucun mock OpenAI nécessaire pour les tests de prompt.

- **Snapshot 108 combinaisons** : générer dynamiquement avec `describe.each(STYLES).each(ROOM_TYPES)`. Vitest gère automatiquement les snapshots inline ou en fichier dédié.

- **Détection du fix cross-handler** : extraire en regex `if\s*\(rt\?\.roomFurnitureOverride\)\s*\{[^}]*getStyleMaterialHint` et vérifier sa présence dans `route.ts` ET `pipeline.ts`. Si absent dans l'un des deux → FAIL.

- **CI Replit** : Versimo déploie sur Replit. Ajouter un `prebuild` script dans `package.json` qui lance les gates BLOQUANT. Si exit ≠ 0, le déploiement Replit échoue.

- **Timing** : un test de gate doit prendre <50ms (pas d'IO réseau). Les snapshots sont déterministes (pas de Date.now ni Math.random non-mocké).
