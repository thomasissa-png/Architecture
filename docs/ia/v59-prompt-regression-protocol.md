# v59 Prompt Regression Protocol

**Auteur** : @ia (session 38, 8 avril 2026)
**Contexte** : audit Lucas Moreau prod batch fondateur 8 avril 2026 (gens #231-235), 5 P0 régressions sur v58 qui sont passées les 48 gates existantes (catégories A-H). Ce protocole documente les nouveaux garde-fous (gates I-P) et la procédure que tout @ia futur DOIT suivre avant un bump de prompt version.

---

## TL;DR

1. **Pré-commit (10s)** : `npx vitest run tests/unit/prompt-regression-v59-gates.test.ts` doit passer 184/184. Hook git bloquant si possible.
2. **Pré-déploiement (90s)** : `npx vitest run` complet (1120 passed expected). Snapshots prompt-snapshot-gates régénérés et review humain du diff (au moins 10 lignes par section touchée).
3. **Post-déploiement (audit visuel)** : 5-6 générations production audit Yann + Lucas, seuil bloquant 8.0/10 (pas 7.5).
4. **Bump de prompt version** : INTERDIT sans gates + audit + matrice cas limite.

---

## 1. Protocole pré-commit

### Hook git (recommandé)

```bash
#!/usr/bin/env bash
# .git/hooks/pre-commit
set -e
npx vitest run tests/unit/prompt-regression-v59-gates.test.ts --reporter=basic
```

### Gates obligatoires

| Catégorie | Fichier | Temps | Bloquant |
|---|---|---|---|
| Gates v59 (I-P) | tests/unit/prompt-regression-v59-gates.test.ts | ~1s | OUI |
| Snapshots A-H | tests/unit/prompt-snapshot-gates.test.ts | ~3s | OUI |
| Tsc | npx tsc --noEmit | ~5s | OUI |
| Lint | npx next lint | ~3s | OUI |

**Total budget pré-commit** : 12-15s. Si ça dépasse 30s, refuser le hook (frustration → contournement).

### Critère de validité d'une nouvelle gate

Une gate v59+ DOIT FAIL sur le contenu pré-fix et PASS sur le contenu post-fix. Si elle passe déjà sur la version qu'elle prétend bloquer, elle n'a aucune valeur. Vérification :

```bash
git stash
git checkout <commit-pre-fix>
npx vitest run tests/unit/prompt-regression-v59-gates.test.ts -t "<gate name>"
# Doit FAIL
git checkout -
git stash pop
npx vitest run tests/unit/prompt-regression-v59-gates.test.ts -t "<gate name>"
# Doit PASS
```

---

## 2. Protocole pré-déploiement

### Étape 1 : Tests string-based (obligatoire, ~10s)

```bash
npx vitest run                              # 1120 passed, 14 skipped expected
npx tsc --noEmit                            # 0 erreur
npx next lint                               # 0 warning
```

### Étape 2 : Snapshots prompt-snapshot-gates (obligatoire si touche un builder)

```bash
npx vitest run tests/unit/prompt-snapshot-gates.test.ts -u
git diff tests/unit/__snapshots__/prompt-snapshot-gates.test.ts.snap
```

**Review humain obligatoire** : au minimum 10 lignes de diff par section touchée. Si le diff est petit (< 10 lignes pour un fix censé toucher tous les builders), c'est un signal d'alerte — la modif n'a probablement pas atteint les builders ciblés.

### Étape 3 : Gates visuelles optionnelles (recommandé pour fix P0)

Lancer 1-2 générations test sur une dev preview pour valider visuellement avant prod. Pas obligatoire pour les fix string-based purs, obligatoire pour les fix qui impactent la sémantique d'un builder entier.

### Seuil PASS

Tout passe (1120 + tsc + lint + snapshots reviewed) → GO déploiement.
1+ failure → NO-GO, fix → relance.

---

## 3. Protocole audit Yann + Lucas

### Taille échantillon

**5-6 générations minimum** (jamais moins). Diversité requise :
- 2 room types différents au minimum (ex: bathroom + dining)
- 2 styles différents au minimum
- 1 chantier brut (pièce vide non finie) pour stress-test CLEANUP
- 1 pièce avec équipement mural visible (radiateur, panneau électrique, chauffe-eau)

### Seuil bloquant

| Métrique | Seuil v58 (déprécié) | Seuil v59+ |
|---|---|---|
| Yann moyen (10) | 7.5 | **8.0** |
| Lucas moyen (10) | 7.5 | **8.0** |
| Aucune gen CAP < 6.0 | requis | requis |
| Préservation spatiale (poids ×3) | 7.0 mini | **8.0 mini** |

**Pourquoi 8.0** : v54-v57 oscillait entre 5.10 et 7.22 — moyenne autour de 6.5. v58 attendu 7.5 est descendu à 6.5. Le seuil 7.5 est trop laxiste et a laissé passer #234 (3.4 CAP 5). 8.0 force un vrai standard.

### Format rapport audit

`docs/reviews/audit-visuel-YYYY-MM-DD-{yann|lucas}.md` :
- Header : version prompt, batch ID, agent
- Tableau : Gen ID / Room / Style / Note / Critères / CAP si applicable
- Synthèse : top 3 succès, top 3 échecs, root causes par P0/P1/P2
- Recommandations : par fichier touché (lib/generation-pipeline.ts ligne X, lib/room-types.ts override Y, etc.)

---

## 4. Playbook deployment

### Règles bumpees v59

1. **Pas de bump version** sans :
   - 184 gates v59 PASS
   - 1120 tests suite PASS
   - Snapshots reviewed (diff visible)
   - Audit Yann + Lucas avec moyenne ≥ 8.0
   - Matrice cas limite documentée (couloir étroit, équipement mural, mur accent, etc.)

2. **Stratégie rollback rapide** :
   - PROMPT_VERSION sentinel : si une régression est détectée en prod, le diff GitHub `git revert <commit>` rollback en 1 clic
   - Snapshots versionnés : permet de comparer v59 vs v58 en string-diff
   - Logs prod taggés avec PROMPT_VERSION : permet de filtrer les générations par version dans /admin

3. **Matrice cas limite** (à valider AVANT chaque bump) :

| Cas | Test |
|---|---|
| Couloir étroit (<1.5m) | Bathroom corridor → STEP 1 (no wall-mounted) |
| Pièce standard | Bathroom 2-3m → STEP 2 (vanity conditional) |
| Chantier brut + ouvriers | CLEANUP doit virer les ouvriers et préserver le panneau |
| Mur accent (papier peint) | Surface pass 1 doit préserver le mur |
| Équipement mural (radiateur) | Pass 2 ne doit pas placer mobilier devant |
| Pièce wide / multi-zone | Distribution profondeur + latérale |
| Format portrait vs landscape | OpenAI size correct |

---

## 5. Lessons learned v54-v58

### Trajectoire des notes (audits production)

| Version | Batch | Yann moy | Lucas moy | Verdict |
|---|---|---|---|---|
| v54 | gens #150-160 | 7.22 | 7.05 | OK |
| v55 | gens #161-180 | 5.65 | 5.30 | NO-GO (input_fidelity:low experiment) |
| v56 | gens #181-200 | 5.10 | 4.80 | NO-GO (artefact compositing) |
| v57 | gens #201-230 | 7.30 | 7.10 | OK (rollback Option 2) |
| v58 | gens #231-235 | 6.50 | 5.80 | NO-GO (régression #234, #235, #233) |

### Ce qui a marché

- **Rollback Option 2 v55→v57** : preuve que rollback rapide fonctionne quand l'arch décision est tracée (decision 087e38b)
- **PRESERVATION_V53 condensée** : structure FIRST, action SECOND fonctionne mieux que l'inverse
- **STRUCTURE LOCK constant** : empêche le model de toucher à la géométrie quand il est dans la fenêtre d'attention
- **Snapshots gates A-H** : capturent les snapshots de 132 combinaisons style × room — premier niveau de garde-fou

### Ce qui a cassé

- **`stays empty` au lieu de `MUST be rendered empty`** : verbe d'état lu comme "ne change pas l'état actuel"
- **`junction boxes` dans REMOVE** : un panneau électrique = un junction box → effacé
- **`panels` au lieu de `electrical panels`** : ambiguïté → effacé
- **Override "ADD vanity ONLY if no vanity already exists"** : conditionnel ignoré par gpt-image-1.5
- **Gates A-H ne checkent pas COHÉRENCE** : override + builder peuvent dire des choses contradictoires sans alerte
- **Audit < 5 gens** : 3 gens ne capturent pas la diversité, on déploie aveugle

### Anti-patterns interdits

| Pattern | Pourquoi interdit | Alternative |
|---|---|---|
| `Room stays empty` | Verbe d'état → modèle ne fait rien | `Room MUST be rendered empty` |
| `no wall art` | Amorçage négatif → modèle en génère | `art stays freestanding or leans against baseboard` |
| `panels` (équipement) | Ambigu wall panels vs electrical | `electrical panels, fuse boxes, circuit breakers` |
| `junction boxes` REMOVE | Panneau électrique = junction box | Distinguer "loose cables/wiring" REMOVE vs "electrical panels" PRESERVE |
| `ADD vanity ONLY if no vanity` | Conditionnel ignoré par modèle | `Step 1: if narrow corridor, ADD nothing on walls. Step 2: if standard, ADD vanity ONLY if no vanity` |
| Snapshot diff < 10 lignes pour fix global | Modif n'a pas atteint les builders | Vérifier que tous les builders impactés ont diff visible |

---

## 6. Référence — Fichiers touchés v59

| Fichier | Lignes | Changement | Pourquoi |
|---|---|---|---|
| lib/generation-pipeline.ts | ~67-73 (extractRoomInventory) | system prompt PERMANENT geometry + TO REMOVE marker | P0-5 Lucas #233 |
| lib/generation-pipeline.ts | ~272 (CLEANUP_V53) | TEMPORARY/PERMANENT split + electrical panels + MUST be rendered | P0-3, P0-5, P0-6 Lucas #235 #233 |
| lib/generation-pipeline.ts | ~409 (PASS2_EQUIPMENT_V54) | + electrical panels, fuse boxes, circuit breakers, thermostats | P0-6 Lucas #235 |
| lib/generation-pipeline.ts | ~417 (PASS2_FINISH_V54) | + freestanding or leans against baseboard, walls remain solid | P0-4 Lucas #235 |
| lib/generation-pipeline.ts | ~466-477 (bathroom builder) | suppression "Compact by default" + passage width identical | P0-2 Lucas #234 |
| lib/room-types.ts | bathroom roomFurnitureOverride | hierarchy STEP 1/2/3 conditional to width | P0-1 Lucas #234 |
| lib/generation-pipeline.ts | 177 | PROMPT_VERSION v58 → v59 | sentinel |
| tests/unit/prompt-regression-v59-gates.test.ts | NEW | 184 anti-régression gates | catégories I-P |

---

## 7. Quick reference — gates v59

```
G-PROMPT-I01 — bathroom builder no "Compact by default" (Lucas #234)
G-PROMPT-I02 — preservation-first override Step 1/2/3 + narrow corridor gate
G-PROMPT-I03 — no dimensional default in preservation-first builders
G-PROMPT-J01 — CLEANUP MUST be rendered (action) not stays empty (state) (Lucas #233)
G-PROMPT-J02 — CLEANUP starts with REMOVE imperative
G-PROMPT-K01 — every indoor room_type has working pass1 builder
G-PROMPT-K02 — every indoor room_type has working pass2 builder
G-PROMPT-K03 — ROOM_TYPES (11) + STYLES (12) sentinels
G-PROMPT-L01 — CLEANUP has PRESERVE all PERMANENT + electrical panels
G-PROMPT-L02 — junction boxes NOT in REMOVE list (Lucas #235)
G-PROMPT-L03 — PASS2_EQUIPMENT preserves panels + thermostats + outlets
G-PROMPT-M01 — pass2 has positive freestanding/leans against baseboard
G-PROMPT-N01 — bathroom override has narrow-corridor width check
G-PROMPT-N02 — bathroom builder enforces passage width identical
G-PROMPT-O01 — extractRoomInventory has TO REMOVE marker (Lucas #233)
G-PROMPT-P01 — PROMPT_VERSION ≥ v59 sentinel
```

184 assertions au total (les describe contiennent plusieurs `it`).

---

## Handoff

- **@infrastructure** : si possible, ajouter le hook git pre-commit décrit en §1
- **@qa** : intégrer les gates v59 dans le pipeline CI bloquant (déjà couvert par `npx vitest run`)
- **Prochain @ia** : tout fix prompt v60+ doit suivre ce protocole. NE JAMAIS bumper version sans audit + matrice + 184 gates PASS.

