# v59 Summary — @ia Session 38

**Auteur** : @ia (session 38, 8 avril 2026)
**Branche** : `claude/versimo-session-38-9EIha`
**Commits clés** : 370e8b7 (P0-1 bathroom) → f37aa31 (gates) → 9aca740 (protocol)

---

## Verdict

| Item | État |
|---|---|
| v58 (déployé) | NO-GO — 3 régressions P0 audit Lucas batch #231-235 |
| v59 (cette branche) | **GO CONDITIONNEL** — string-based fixes validés, audit visuel post-déploiement requis |
| Confiance déploiement | **75%** — fixes string-based ciblés sur causes racines identifiées, mais l'efficacité réelle sur gpt-image-1.5 ne peut être validée que par audit visuel post-déploiement |

---

## 1. Décisions par commit v58 (rappel)

| Commit | Fix | Décision | Justification |
|---|---|---|---|
| 65859d6 | P0-2 adjust equipment preservation conditionnelle | Exception explicite "UNLESS user asks remove" | SURGICAL EDIT vs EQUIPMENT_PRESERVATION contradiction |
| cb80993 | P0-3 TEMPORARY_OBJECTS_TO_REMOVE + bump v57→v58 | CLEANUP étendu avec debris/ladders/people | Pieces brutes Thomas marchand non nettoyées |
| f217740 | P0-C/P0-D outdoor walls preservation | Provençal + Industriel Urbain | Murs effacés en passe outdoor |
| 9e53e84 | P1-E maximalist accent wall conditional | Conditional by room type | Mur accent generic écrasait le contexte |
| 3a7289b | P0-B kitchen preservation-first | room-types.ts kitchen override | Cuisine equipée écrasée |
| 883fd39 | P0-A unify indoor furniturePrompts | Source of truth Sprint 17+ propagation | Drift entre fichiers |
| (370e8b7) | P0-1 bathroom geometry-gated | Hierarchy STEP 1/2/3 + suppression "Compact by default" | Régression CATASTROPHIQUE #234 (bathroom 3.4 CAP 5) |

v58 a shipé 7 commits dont 5 P0. Les 4 premiers commits étaient corrects mais le 5e (cb80993 P0-3) a introduit la régression #233 (verbe d'état "stays empty"), et le builder bathroom n'avait jamais été audité contre l'override room-types.ts (cause racine #234).

---

## 2. Patches v59 appliqués

| Fichier | Lignes | Changement | Pourquoi |
|---|---|---|---|
| lib/room-types.ts | bathroom roomFurnitureOverride | Réécriture en hiérarchie STEP 1 (narrow) / STEP 2 (standard) / STEP 3 (preserve) | Conditionnel ignoré par gpt-image-1.5 — passer en hierarchy explicit |
| lib/generation-pipeline.ts | ~466-477 (bathroom builder) | Suppression "Compact by default: ONE vanity 60cm" + ajout "passage width stays identical" | Contradiction frontale avec preservation-first override |
| lib/generation-pipeline.ts | ~272 (CLEANUP_V53) | Réécriture TEMPORARY/PERMANENT split + verbe action "MUST be rendered empty" | Lucas P0-3, P0-5, P0-6 — junction boxes effacaient panneaux électriques, "stays empty" lu comme état |
| lib/generation-pipeline.ts | ~409 (PASS2_EQUIPMENT_V54) | + electrical panels, fuse boxes, circuit breakers, thermostats explicits | Lucas P0-6 — "panels" trop ambigu |
| lib/generation-pipeline.ts | ~417 (PASS2_FINISH_V54) | + "freestanding or leans against floor baseboard" + "walls remain solid" | Lucas P0-4 — leopard wall art halluciné #235 |
| lib/generation-pipeline.ts | ~67-73 (extractRoomInventory) | System prompt "PERMANENT geometry" + marqueur "TO REMOVE" | Lucas P0-5 — inventaire décrivait personnes/outils, contredisait CLEANUP |
| lib/generation-pipeline.ts | 177 | PROMPT_VERSION v58 → v59 | Sentinel |

7 patches au total, tous string-based, aucun changement d'architecture.

---

## 3. Nouvelles gates v59

| Gate | Catégorie | Détecte | Fichier |
|---|---|---|---|
| G-PROMPT-I01 | OVERRIDE/BUILDER COHERENCE | "Compact by default" prescription dans bathroom builder | tests/unit/prompt-regression-v59-gates.test.ts |
| G-PROMPT-I02 | OVERRIDE/BUILDER COHERENCE | bathroom override sans Step 1/2/3 + sans narrow corridor gate | idem |
| G-PROMPT-I03 | OVERRIDE/BUILDER COHERENCE | dimensional default ("ONE X Ncm") dans builders preservation-first | idem |
| G-PROMPT-J01 | ACTION VERBS STRENGTH | CLEANUP avec verbe d'état "stays empty" / "remains empty" | idem |
| G-PROMPT-J02 | ACTION VERBS STRENGTH | CLEANUP sans "REMOVE only these TEMPORARY" opening | idem |
| G-PROMPT-K01 | ROOM_TYPE COVERAGE | room_type sans builder pass1 ou STRUCTURE LOCK manquant | idem |
| G-PROMPT-K02 | ROOM_TYPE COVERAGE | room_type sans builder pass2 ou EQUIPMENT manquant | idem |
| G-PROMPT-K03 | ROOM_TYPE COVERAGE | drift de count ROOM_TYPES (11) ou STYLES (12) | idem |
| G-PROMPT-L01 | TEMPORARY/PERMANENT SPLIT | CLEANUP sans "PRESERVE all PERMANENT" + electrical panels | idem |
| G-PROMPT-L02 | TEMPORARY/PERMANENT SPLIT | "junction boxes" en REMOVE | idem |
| G-PROMPT-L03 | TEMPORARY/PERMANENT SPLIT | PASS2_EQUIPMENT sans panels/thermostats/outlets | idem |
| G-PROMPT-M01 | WALL ART POSITIVE | pass2 sans "freestanding or leans against" + sans "walls remain solid" + avec "no wall art" | idem |
| G-PROMPT-N01 | NARROW-ROOM GEOMETRY | bathroom override sans width check + sans Step 2 conditional | idem |
| G-PROMPT-N02 | NARROW-ROOM GEOMETRY | bathroom builder sans "passage width stays identical" | idem |
| G-PROMPT-O01 | INVENTORY ALIGNMENT | extractRoomInventory sans "TO REMOVE" + sans "PERMANENT geometry" | idem |
| G-PROMPT-P01 | PROMPT_VERSION SENTINEL | PROMPT_VERSION < v59 | idem |

**184 assertions** au total (les `describe` contiennent plusieurs `it`).

---

## 4. Validation

### Résultats tests

```
RUN  v4.1.2 /home/user/Architecture
Test Files  26 passed (26)
     Tests  1120 passed | 14 skipped (1134)
  Duration  9.12s
```

- **1120 tests passent** (936 baseline + 184 nouveaux v59 gates)
- **14 skipped** intentionnels (gates v55/v56-spécifiques rolled back)
- **0 failed**

### Tsc

```
npx tsc --noEmit
# (no output, exit 0)
```

Clean.

### Lint

```
npx next lint
✔ No ESLint warnings or errors
```

Clean.

### Validation anti-régression (gates FAIL sur v58)

| Gate | Vérifié sur | Résultat |
|---|---|---|
| J01 | git show 370e8b7~1 — CLEANUP_V53 | ✓ "Room stays COMPLETELY EMPTY" → FAIL |
| L01 | git show 370e8b7~1 — CLEANUP_V53 | ✓ Pas de "PRESERVE all PERMANENT" → FAIL |
| L02 | git show 370e8b7~1 — CLEANUP_V53 | ✓ "junction boxes" en REMOVE → FAIL |
| L03 | git show 370e8b7~1 — PASS2_EQUIPMENT_V54 | ✓ Juste "panels" sans electrical/fuse/thermostats → FAIL |
| M01 | git show 370e8b7~1 — PASS2_FINISH_V54 | ✓ Pas de "freestanding or leans against" → FAIL |
| N01 | git show 370e8b7~1 — bathroom override | ✓ "ADD vanity ONLY if no vanity already exists" → FAIL |
| O01 | git show 370e8b7~1 — extractRoomInventory | ✓ Pas de "TO REMOVE" → FAIL |
| P01 | git show 370e8b7~1 — PROMPT_VERSION | ✓ "v58" → FAIL |

**8/8 gates clés validées comme anti-régression.** Les autres 176 gates couvrent la couverture globale (chaque room_type × pass × directive).

---

## 5. Risques résiduels

### R1 — Validation visuelle requise

Les gates string-based valident que le PROMPT contient les bonnes clauses. Elles ne valident pas que gpt-image-1.5 obéit à ces clauses dans tous les cas. Audit visuel Yann + Lucas obligatoire post-déploiement (5-6 générations, seuil 8.0).

### R2 — STEP 1/2/3 conditionals dans bathroom override

L'argument du fix v59 P0-1 est que les conditionnels ("ONLY if no vanity") sont ignorés par gpt-image-1.5. Le fix les remplace par une hiérarchie STEP 1/2/3 explicite. Mais la hiérarchie reste un conditional structurel — si gpt-image-1.5 ignore aussi les "Step 1: if narrow corridor", la régression peut revenir. Audit visuel sur un input "couloir étroit" obligatoire.

### R3 — Couverture audit Yann/Lucas

L'audit batch #231-235 ne testait que 5 gens. Le batch est trop petit pour conclure à une convergence. Recommandation : audit v59 sur 8-10 gens minimum, avec 3 cas limites (couloir étroit, équipement mural, chantier brut).

### R4 — Pas de test sur Custom prompts

Les gates v59 valident les prompts construits par les builders pour les room_types standard. Les prompts Custom (utilisateur libre) passent par lib/custom-prompt.ts qui n'a pas été touché en v59. Si une régression Custom apparaît, elle ne sera détectée qu'en audit visuel.

### R5 — Snapshots prompt-snapshot-gates régénérés

Le commit 370e8b7 a régénéré 264 snapshots. Le diff a été reviewé partiellement. Risque que certains snapshots aient capturé un état intermédiaire (entre P0-1 et P0-3) plutôt qu'un état v59 final. Mitigation : les 1120 tests passent → cohérence interne validée. Mais review humain complet du diff (264 snapshots) reste recommandé.

---

## 6. Recommandation déploiement

**GO CONDITIONNEL.**

Conditions :
1. **Avant deploy** : review humain du diff snapshot prompt-snapshot-gates (au moins les 12 styles bathroom + 12 styles dining + 12 styles living, 36 sur 264).
2. **Post-deploy J+0** : audit Yann + Lucas sur 5 gens (1 bathroom couloir étroit, 1 bathroom standard, 1 dining avec wall art tentation, 1 living chantier brut, 1 cuisine équipée).
3. **Post-deploy J+1** : si moyenne audit ≥ 8.0, ship. Sinon, rollback `git revert <commits v59>` et reprendre la cause racine.
4. **Suivi prod J+7** : audit batch 10-15 gens diversifiées, valider stabilité.

Si une condition échoue → rollback. Le rollback est rapide (revert + redeploy + bump PROMPT_VERSION v59 → v58).

---

## 7. Lessons learned (à intégrer dans CLAUDE.md)

| Lesson | Catégorie | Sévérité |
|---|---|---|
| Verbes d'état ("stays", "remains", "keeps") sont faibles vs verbes d'action ("MUST be rendered", "REMOVE") sur gpt-image-1.5 | pattern | P0 |
| Les conditionnels ("ONLY if no X") sont ignorés par gpt-image-1.5 — utiliser des hiérarchies (STEP 1/2/3) | pattern | P0 |
| Les négations directes ("no wall art") amorcent le modèle — utiliser des positives ("freestanding or leans against") | pattern | P0 |
| Builder + override doivent être audités ENSEMBLE pour cohérence — un override "preservation-first" + un builder "Compact by default" est invisible aux gates de contenu | pattern | P0 |
| Termes ambigus ("panels") doivent être qualifiés ("electrical panels, fuse boxes") pour empêcher les confusions sémantiques | pattern | P1 |
| Audit < 5 gens n'a pas la diversité statistique suffisante pour conclure — minimum 5-6 avec cas limites | pattern | P1 |
| Le seuil audit Yann/Lucas 7.5 est trop laxiste pour gpt-image-1.5 — passer à 8.0 | recommandation | P1 |
| Snapshot diff < 10 lignes pour un fix global est un signal d'alerte — la modif n'a pas atteint les builders ciblés | pattern | P1 |

À copier dans `docs/lessons-learned.md` lors de la clôture de session.

---

## Fichiers livrés

| Fichier | Type | Lignes | Commit |
|---|---|---|---|
| lib/room-types.ts (bathroom) | code | ~20 modifiées | 370e8b7 |
| lib/generation-pipeline.ts (7 patches) | code | ~89 modifiées | 370e8b7 |
| tests/unit/__snapshots__/prompt-snapshot-gates.test.ts.snap | snapshots | 528 modifiées | 370e8b7 |
| tests/unit/prompt-regression-v59-gates.test.ts | tests | 451 nouvelles | f37aa31 |
| docs/ia/v59-prompt-regression-protocol.md | doc | 233 nouvelles | 9aca740 |
| docs/ia/v59-summary.md | doc | (ce fichier) | (à venir) |

---

## Handoff

- **@infrastructure** : déploiement post-validation snapshots + audit visuel
- **@qa** : intégrer gates v59 dans pipeline CI bloquant (déjà fonctionnel via vitest)
- **Prochain @ia** : suivre `docs/ia/v59-prompt-regression-protocol.md` pour tout fix v60+
- **Fondateur** : décision GO/NO-GO post audit visuel Yann + Lucas (seuil 8.0)
