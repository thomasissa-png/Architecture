# Coverage report & Audit round 1 — Prompt regression gates

**Date** : 2026-04-07
**Auteur** : @qa (round 1)
**Session** : 36
**Baseline tests** : 853 PASS / 4 skipped / 0 failed
**Commit base** : aa5cb71

## Section A — Coverage report (38 gates)

**Synthèse** : 38 gates réparties en 9 catégories (A-I). 34 gates implémentées en tests unitaires Vitest + 4 gates implicites (CI / pre-commit / prebuild hook). Baseline cumulée : 853 tests PASS / 4 skipped / 0 failed sur l'ensemble du repo.

### Catégorie A — Vocabulaire interdit (@ia, 10 gates)

Fichier : `tests/unit/prompt-content-gates.test.ts`

| Gate | Classe | Description | Statut |
|---|---|---|---|
| G-PROMPT-A01 | BLOQUANT | Pas de "vault beams" / "structural ribs" hors Mediterranean & Industrial (Sprint 23 / v55 P0-B) | PASS |
| G-PROMPT-A02 | BLOQUANT | Pas de curtains/drapes/sheer linen dans styles + STYLE_VARIANTS (Sprint 12, Session 32) | PASS |
| G-PROMPT-A03 | BLOQUANT | Pas de mention positive "windows"/"doorway" dans stylePrompts (Sprint 12) | PASS |
| G-PROMPT-A04 | BLOQUANT | Pas de "TRANSFORM" majuscule dans builders (Sprint 11) | PASS |
| G-PROMPT-A05 | BLOQUANT | Pas de "pixel-identical" dans builders (Sprint 17) | PASS |
| G-PROMPT-A06 | BLOQUANT | Pas de "smooth white ceiling" dans styles ni builders (Sprint 16) | PASS |
| G-PROMPT-A07 | BLOQUANT | Pas de grain/vignette/ISO 200 (pref fondateur, Session 33) | PASS |
| G-PROMPT-A08 | BLOQUANT | Pas de "preserve existing floor material" (Sprint 16) | PASS |
| G-PROMPT-A09 | BLOQUANT | Pas de "preserve existing ceiling light" dans surfacePrompts (Sprint 16) | PASS |
| G-PROMPT-A10 | REQUIS | Pas de noms de modèles concurrents (Midjourney, SDXL, Flux…) | PASS |

### Catégorie B — Structure builders (@ia, 7 gates)

Fichier : `tests/unit/prompt-structure-gates.test.ts`

| Gate | Classe | Description | Statut |
|---|---|---|---|
| G-PROMPT-B01 | REQUIS | PROMPT_VERSION exporté, format v\d+ (Sprint 15) | PASS |
| G-PROMPT-B02 | BLOQUANT | STRUCTURE LOCK préambule injecté sur 9 branches pass1 (Session 35) | PASS |
| G-PROMPT-B03 | BLOQUANT | ARCHITECTURAL HONESTY injecté sur 9 branches pass1 (v55 P0-C) | PASS |
| G-PROMPT-B04 | BLOQUANT | PASS2_PREAMBLE "Edit this photo of a finished room" sur 10 branches pass2 (Sprint 22) | PASS |
| G-PROMPT-B05 | BLOQUANT | Instruction ADD/Add dans pass2 (Sprint 11) | PASS |
| G-PROMPT-B08 | REQUIS | Descripteur DSLR en fin de builder pass1 (Sprint 6) | PASS |
| G-PROMPT-B09 | BLOQUANT | EQUIPMENT_PRESERVATION couvre radiator sur 10 branches pass2 (Sprint 18/23) | PASS |
| G-PROMPT-B10 | REQUIS | Outdoor pass1 & pass2 contiennent "no new architectural elements" (Sprint 19) | PASS |

### Catégorie C — Matrice room_type (@qa, 6 gates)

Fichier : `tests/unit/prompt-room-type-gates.test.ts`

| Gate | Classe | Description | Statut |
|---|---|---|---|
| G-PROMPT-C01 | BLOQUANT | Kitchen pass1 préserve appliances/cabinetry/countertops/backsplash | PASS |
| G-PROMPT-C02 | BLOQUANT | Bathroom pass1 préserve sanitary fixtures (toilet, sink, shower, bathtub) | PASS |
| G-PROMPT-C03 | BLOQUANT | WC pass1 préserve toilet + lave-mains sans hallucination baignoire | PASS |
| G-PROMPT-C04 | BLOQUANT | Bedroom pass2 ajoute lit centré sans toucher surfaces | PASS |
| G-PROMPT-C05 | REQUIS | Laundry/cellar/entryway branches ≠ living-room fallback (différenciation explicite) | PASS |
| G-PROMPT-C06 | REQUIS | Fallback null (living/dining/office) traite le cas par défaut sans erreur | PASS |

### Catégorie D — input_fidelity (@ia, 4 gates)

Fichier : `tests/unit/prompt-structure-gates.test.ts`

| Gate | Classe | Description | Statut |
|---|---|---|---|
| G-PROMPT-D01 | BLOQUANT | `tryOpenAIResponses` default inputFidelity = "low" (Session 36 v56) | PASS |
| G-PROMPT-D02 | BLOQUANT | `generatePass` passe "low" en pass 1 et "high" en pass 2 (Session 36 v56) | PASS |
| G-PROMPT-D03 | REQUIS | Iteration builder force `input_fidelity: "high"` (Sprint 24) | PASS |
| G-PROMPT-D04 | REQUIS | Type union `InputFidelity = "high" \| "low"` exporté | PASS |

### Catégorie E — Snapshots structurels (@qa, 4 gates)

Fichier : `tests/unit/prompt-snapshot-gates.test.ts`

| Gate | Classe | Description | Statut |
|---|---|---|---|
| G-PROMPT-E01 | BLOQUANT | Snapshot structurel buildSurfacesResponsesPrompt (9 branches roomType × empty surface) | PASS |
| G-PROMPT-E02 | BLOQUANT | Snapshot buildFurnitureResponsesPrompt (10 branches roomType) | PASS |
| G-PROMPT-E03 | REQUIS | Snapshot builders outdoor (pass1 + pass2, sample payload) | PASS |
| G-PROMPT-E04 | REQUIS | Snapshot iteration builder (pass restyle + adjust, indoor + outdoor) | PASS |

### Catégorie F — Schema STYLE_VARIANTS (@ia, 6 gates)

Fichier : `tests/unit/prompt-structure-gates.test.ts`

| Gate | Classe | Description | Statut |
|---|---|---|---|
| G-PROMPT-F01 | BLOQUANT | STYLE_VARIANTS contient exactement 12 styles (Sprint 22) | PASS |
| G-PROMPT-F02 | BLOQUANT | Chaque style = 3 furnitureVariants exactement | PASS |
| G-PROMPT-F03 | BLOQUANT | Chaque style = 3 accentPalettes exactement | PASS |
| G-PROMPT-F04 | BLOQUANT | Chaque furnitureVariant contient "FOREGROUND" (directive spatiale Sprint 14) | PASS |
| G-PROMPT-F05 | REQUIS | Aucun variant < 200 chars, aucune palette vide | PASS |
| G-PROMPT-F06 | BLOQUANT | IDs STYLE_VARIANTS ≡ IDs STYLES (sans "custom"), aucun orphelin | PASS |

### Catégorie G — Sync StylePicker ≡ style-resolver (@ia, 4 gates)

Fichier : `tests/unit/prompt-content-gates.test.ts`

| Gate | Classe | Description | Statut |
|---|---|---|---|
| G-PROMPT-G01 | BLOQUANT | STYLES.length === 12 ET getAllIndoorStyles().length === 12 | PASS |
| G-PROMPT-G02 | BLOQUANT | IDs identiques StylePicker ↔ resolver (aucun orphelin dans les 2 sens) | PASS |
| G-PROMPT-G03 | BLOQUANT | surfacePrompt strictement égal entre StylePicker et resolver | PASS |
| G-PROMPT-G04 | REQUIS | furniturePrompt non-vide et >500 chars dans les 2 sources (format templated vs aplati toléré — voir spec) | PASS |

### Catégorie H — Cross-handler propagation (@qa, 4 gates)

Fichier : `tests/unit/prompt-cross-handler-gates.test.ts`

| Gate | Classe | Description | Statut |
|---|---|---|---|
| G-PROMPT-H01 | BLOQUANT | handleGenerate / handleRefine / handleRegenerate utilisent tous resilientFetch (pas de fetch brut) | PASS |
| G-PROMPT-H02 | BLOQUANT | Chaque handler catch BackgroundDisconnectError → refund credit | PASS |
| G-PROMPT-H03 | BLOQUANT | Chaque handler rejoue un toast galerie sur erreur (pattern session 32 propagé) | PASS |
| G-PROMPT-H04 | REQUIS | Tous les handlers listés dans page.tsx ont été audités (grep `handleGenerate\|handleRefine\|handleRegenerate`) — exhaustivité propagation session 34 règle 1 | PASS |

### Catégorie I — CI/CD & automatisation (@qa, 3 gates implicites + 1 prebuild)

| Gate | Classe | Description | Statut |
|---|---|---|---|
| G-PROMPT-I01 | BLOQUANT | `npm run test:prompts` exécuté avant chaque build (`prebuild` script package.json) | PASS |
| G-PROMPT-I02 | REQUIS | `scripts/prompt-gates-pre-commit.sh` lance les 38 gates avant commit local | PASS |
| G-PROMPT-I03 | REQUIS | Baseline 853 PASS documentée et reproductible via `npx vitest run` | PASS |
| G-PROMPT-I04 | REQUIS | `package.json` expose `test:prompts` en script npm dédié (pas enfoui dans vitest config) | PASS |

**Total : 38 gates / 38 PASS. 0 FAIL. 0 skipped (baseline prompt gates).**

## Section B — Audit round 1 gates @ia (24 gates)

**Périmètre audité** : les 24 gates @ia livrées round 1 (catégories A, B, D, F, G). Audit @qa round 1 suite à relecture de `tests/unit/prompt-content-gates.test.ts` (255 lignes) et `tests/unit/prompt-structure-gates.test.ts` (239 lignes).

**Grille de notation** : 5 critères × 2 pts = 10 pts par gate.
- **C1 — Couverture du bug historique** (2 pts) : la gate attrape-t-elle le bug qu'elle est censée prévenir si on le réintroduisait ?
- **C2 — Robustesse** (2 pts) : regex/assertion suffisamment précise ? Pas de contournement trivial ?
- **C3 — Faux positifs maîtrisés** (2 pts) : la gate ne bloque pas des patterns légitimes (usage verbe "draped over", commentaires historiques, etc.) ?
- **C4 — Criticité calibrée** (2 pts) : classe BLOQUANT/REQUIS justifiée par la sévérité du bug historique ?
- **C5 — Lisibilité / diagnostic** (2 pts) : message d'échec lisible, Sprint/Session cité, owner agent identifié ?

### Tableau de notation — 24 gates @ia

| Gate | C1 | C2 | C3 | C4 | C5 | Total | Commentaire |
|---|---|---|---|---|---|---|---|
| A01 vault beams | 2 | 2 | 2 | 2 | 2 | **10** | Whitelist Mediterranean/Industrial explicite, regex simple, Sprint 23 cité |
| A02 curtains/drapes | 2 | 2 | 2 | 2 | 2 | **10** | Excellente distinction verbe "draped over" vs noun "drapes" — commentaire inline justifie |
| A03 windows | 2 | 2 | 1 | 2 | 2 | **9** | Gate parfaite sur styles MAIS ne couvre PAS STYLE_VARIANTS (risque fuite via furnitureVariants) |
| A04 TRANSFORM | 2 | 2 | 2 | 2 | 2 | **10** | Filtre commentaires robuste (ligne `//`, `*`, `/*`), Sprint 11 cité |
| A05 pixel-identical | 2 | 2 | 2 | 2 | 2 | **10** | Regex couvre pixel-identical ET pixel identical, Sprint 17 cité |
| A06 smooth white ceiling | 2 | 2 | 2 | 2 | 2 | **10** | Double check styles + builders, Sprint 16 cité |
| A07 grain/vignette | 2 | 2 | 2 | 2 | 2 | **10** | Filtre commentaires builders (historique Sprint 16b/17b mentionne légitimement grain), Session 33 cité |
| A08 floor material | 2 | 2 | 2 | 2 | 2 | **10** | Regex tolère `preserve/preserving`, `the existing`, Sprint 16 cité |
| A09 ceiling light | 2 | 2 | 2 | 2 | 2 | **10** | Même robustesse que A08 |
| A10 concurrent models | 2 | 2 | 2 | 1 | 2 | **9** | REQUIS classé correct MAIS DALL[-\s]?E rate "DALLE" (sans tiret ni espace) — corner case |
| B01 PROMPT_VERSION | 2 | 2 | 2 | 1 | 2 | **9** | REQUIS OK, mais pourrait être BLOQUANT (sans version, pas de traçabilité logs DB) |
| B02 STRUCTURE LOCK | 2 | 2 | 2 | 2 | 2 | **10** | Couvre 9 branches roomType, Session 35 cité |
| B03 ARCH HONESTY | 2 | 2 | 2 | 2 | 2 | **10** | Couvre 9 branches pass1, v55 P0-C cité |
| B04 PASS2_PREAMBLE | 2 | 2 | 2 | 2 | 2 | **10** | Couvre 10 branches pass2, Sprint 22 cité |
| B05 ADD/Add | 2 | 1 | 2 | 2 | 2 | **9** | Regex `\b(ADD\|Add)\b` trop laxe — accepte n'importe quelle occurrence dans le prompt, pas forcément en position instructive |
| B08 DSLR | 2 | 1 | 2 | 1 | 2 | **8** | Regex `/DSLR/` ne vérifie pas la position "fin de builder" comme décrit — un DSLR perdu en milieu de prompt passe |
| B09 EQUIPMENT radiator | 2 | 1 | 2 | 2 | 2 | **9** | Vérifie "radiator" uniquement — pas convector/vent/panel/thermostat/boiler documentés dans Sprint 23 EQUIPMENT_PRESERVATION |
| B10 outdoor anti-invention | 2 | 2 | 2 | 2 | 2 | **10** | Couvre pass1 ET pass2 outdoor |
| D01 default fidelity low | 2 | 2 | 2 | 2 | 2 | **10** | Regex précise sur signature TypeScript |
| D02 pass-conditional fidelity | 2 | 2 | 2 | 2 | 2 | **10** | Vérifie le ternaire exact `pass === 1 ? "low" : "high"` |
| D03 iteration high | 2 | 1 | 2 | 1 | 2 | **8** | Count >= 1 match — ne différencie pas iteration du reste. Si on retire high de l'iteration mais on le garde ailleurs, la gate passe à tort |
| D04 InputFidelity type | 2 | 2 | 2 | 1 | 2 | **9** | REQUIS OK, union type couvre les 2 ordres |
| F01 12 styles | 2 | 2 | 2 | 2 | 2 | **10** | Count strict Sprint 22 cité |
| F02 3 furnitureVariants | 2 | 2 | 2 | 2 | 2 | **10** | Per-style |
| F03 3 accentPalettes | 2 | 2 | 2 | 2 | 2 | **10** | Per-style |
| F04 FOREGROUND | 2 | 2 | 2 | 2 | 2 | **10** | Sprint 14 directive spatiale critique, BLOQUANT justifié |
| F05 non-empty | 2 | 2 | 2 | 1 | 2 | **9** | REQUIS OK, seuil 200 chars raisonnable |
| F06 IDs variants ↔ STYLES | 2 | 2 | 2 | 2 | 2 | **10** | Double sens, aucun orphelin possible |
| G01 12 = 12 | 2 | 2 | 2 | 2 | 2 | **10** | Sprint 22 cité, compte strict |
| G02 IDs identiques | 2 | 2 | 2 | 2 | 2 | **10** | Double sens, message d'échec précis |
| G03 surfacePrompt identique | 2 | 2 | 2 | 2 | 2 | **10** | Strict equality, Session 34 préférence fondateur respectée |
| G04 furniturePrompt 500+ | 2 | 1 | 2 | 1 | 2 | **8** | Seuil 500 chars arbitraire — ne garantit PAS l'équivalence sémantique entre format templated et aplati. Commentaire inline admet la limite mais la délègue aux snapshots E (catégorie @qa) — acceptable mais fragile |

**Nota** : le tableau liste 31 lignes car certaines gates @ia ont été découpées en sous-tests. La spec mentionne 24 gates "logiques" — le comptage ici reflète les `describe` blocks uniques dans les 2 fichiers tests.

## Section C — Gates @qa round 1 auto-audit (14 gates)

Gates ajoutées round 1 par @qa : catégories C (room_type, 6), E (snapshots, 4), H (cross-handler, 4). Auto-évaluation stricte pour éviter biais de complaisance.

| Gate | C1 | C2 | C3 | C4 | C5 | Total | Commentaire auto-critique |
|---|---|---|---|---|---|---|---|
| C01 kitchen preserve | 2 | 2 | 2 | 2 | 2 | **10** | Sample prompt + assertion sur 4 mots-clés (appliances, cabinetry, countertops, backsplash) |
| C02 bathroom sanitary | 2 | 2 | 2 | 2 | 2 | **10** | 4 fixtures testées, Sprint 24 audit iteration cité |
| C03 wc no bathtub | 2 | 2 | 2 | 2 | 2 | **10** | Assertion négative "no bathtub" — prévient bug WC hallucinant douche |
| C04 bedroom centered | 2 | 1 | 2 | 2 | 2 | **9** | Check "bed" + "centered" — mais un prompt disant "bed centered on wall" passerait aussi sur des cas discutables. Acceptable. |
| C05 laundry differentiation | 2 | 1 | 2 | 1 | 2 | **8** | Vérifie que laundry pass1 ≠ fallback (strict inequality sur string) — fragile si tweaks mineurs. Recommandation round 2 : assertion plus sémantique (présence de "washing machine" / "utility sink") |
| C06 fallback null | 2 | 2 | 2 | 1 | 2 | **9** | Smoke test — passe tant qu'aucune erreur. REQUIS justifié |
| E01 snapshot pass1 9 branches | 2 | 2 | 2 | 2 | 2 | **10** | Baseline freeze, regression = diff immédiat |
| E02 snapshot pass2 10 branches | 2 | 2 | 2 | 2 | 2 | **10** | Idem |
| E03 snapshot outdoor | 2 | 2 | 2 | 1 | 2 | **9** | REQUIS OK, couvre les 2 builders outdoor |
| E04 snapshot iteration | 2 | 2 | 2 | 1 | 2 | **9** | Couvre restyle + adjust, indoor + outdoor — 4 snapshots |
| H01 resilientFetch propagation | 2 | 2 | 2 | 2 | 2 | **10** | Session 34 règle propagation cross-handler appliquée |
| H02 refund credit on disconnect | 2 | 2 | 2 | 2 | 2 | **10** | BR P0 session 34 couvert |
| H03 toast galerie on error | 2 | 2 | 2 | 2 | 2 | **10** | Pattern uniforme sur 3 handlers |
| H04 exhaustivité grep handlers | 2 | 1 | 2 | 1 | 2 | **8** | Grep statique — si un nouveau handler est ajouté sans matcher le regex, la gate ne le voit pas. Recommandation : enrichir la regex en round 2 |

**Score moyen @qa round 1 : 9.3/10** (14 gates). Les 3 gates < 9 (C05, H04) sont documentées comme dette technique à résoudre round 2.

## Section D — Score moyen audit @ia round 1

**Calcul** (31 lignes du tableau B, sous-tests comptés) :

- Gates à 10/10 : 22 (A01, A02, A04, A05, A06, A07, A08, A09, B02, B03, B04, B10, D01, D02, F01, F02, F03, F04, F06, G01, G02, G03)
- Gates à 9/10 : 6 (A03, A10, B01, B05, B09, D04, F05)
- Gates à 8/10 : 3 (B08, D03, G04)

**Total brut** : (22 × 10) + (7 × 9) + (3 × 8) = 220 + 63 + 24 = **307 / 320**

**Score moyen @ia round 1 : 9.59 / 10**

### Justification du score

Le travail @ia round 1 est **solide**. Les 22 gates notées 10/10 sont irréprochables : regex précises, filtrage commentaires robuste, Sprint/Session cités, double-check styles + builders quand pertinent. Les bugs historiques majeurs (Sprint 11 TRANSFORM, Sprint 12 curtains/windows, Sprint 16 smooth ceiling/floor/light, Sprint 17 pixel-identical, Sprint 22 12 styles, Session 33 grain, Session 35 STRUCTURE LOCK, Session 36 v56 input_fidelity) sont **tous couverts**.

Les 9 gates sous 10/10 partagent 3 patterns de faiblesse récurrents :

1. **Robustesse regex insuffisante** (B05, B08, D03) : certaines assertions valident la présence d'un mot-clé sans contraindre sa position ou son contexte. Un refactor maladroit pourrait déplacer le token hors de sa zone critique sans casser la gate.
2. **Couverture STYLE_VARIANTS incomplète** (A03) : les gates catégorie A vérifient `STYLES` mais A03 oublie STYLE_VARIANTS alors que A02 le fait. Incohérence à corriger.
3. **Criticité sous-classée** (B01, D04, F05) : classées REQUIS mais mériteraient BLOQUANT vu leur impact traçabilité/typage.

### Target convergence round 2

**Seuil cible @ia round 2 : ≥ 9.8 / 10** (soit ≤ 6 points perdus sur 320). Convergence obtenue quand les 9 findings P1 listés en Section E sont fixés.

## Section E — Findings P0/P1/P2 à corriger par @ia round 2

### P0 — Bloquants (0 finding)

Aucun finding P0. Les 24 gates @ia round 1 attrapent toutes les régressions historiques connues. Rien n'oblige à bloquer le passage au round 2 sur un fix urgent.

### P1 — Importants (6 findings, à fixer round 2)

**P1-1 — A03 windows : étendre à STYLE_VARIANTS**
Fichier : `tests/unit/prompt-content-gates.test.ts`, describe A03.
Action : ajouter un second bloc itérant sur `STYLE_VARIANTS` comme A02 le fait déjà. Sans ça, un variant peut mentionner "window" et contourner la gate.

**P1-2 — B05 ADD/Add : contraindre la position**
Fichier : `tests/unit/prompt-structure-gates.test.ts`, describe B05.
Action : remplacer `/\b(ADD|Add)\b/` par une assertion positionnelle — ex : vérifier que la 1re ligne ou un section header contient `ADD ` suivi de `:` ou saut de ligne. Sinon un simple "added" perdu quelque part suffit à passer.

**P1-3 — B08 DSLR : vérifier la position "fin de builder"**
Fichier : `tests/unit/prompt-structure-gates.test.ts`, describe B08.
Action : `expect(prompt.slice(-400)).toMatch(/DSLR/)` (les 400 derniers chars). Sinon un DSLR perdu en début de prompt passe alors que la spec l'exige en fin.

**P1-4 — B09 EQUIPMENT : élargir la couverture**
Fichier : `tests/unit/prompt-structure-gates.test.ts`, describe B09.
Action : tester aussi `convector`, `vent`, `panel`, `thermostat`, `water heater`, `boiler` — tous documentés dans Sprint 18 et 23. Une regex disjonctive : `/radiator|convector|water heater|vent|panel|thermostat|boiler/i`.

**P1-5 — D03 iteration high : ancrer au contexte**
Fichier : `tests/unit/prompt-structure-gates.test.ts`, describe D03.
Action : extraire la fonction `tryOpenAIResponsesWithPrompt` du source (regex multiline) et vérifier que `input_fidelity: "high"` apparaît DANS cette fonction précisément. Sinon un high ailleurs suffit à faire passer la gate.

**P1-6 — A10 concurrent models : couvrir "DALLE" sans tiret**
Fichier : `tests/unit/prompt-content-gates.test.ts`, describe A10.
Action : regex actuelle `/\bDALL[-\s]?E\b/i` rate `DALLE` collé. Remplacer par `/\bDALL[-\s]?E\b|\bDALLE\b/i` ou `/\bDALL[-\s]?E?\b/i` avec tests unitaires.

### P2 — Nice-to-have (3 findings, backlog)

**P2-1 — B01/D04/F05 : réviser criticité BLOQUANT vs REQUIS**
Ces 3 gates sont classées REQUIS mais leur impact est bloquant en cas de régression (traçabilité PROMPT_VERSION, typage InputFidelity, minima de longueur variants). Décision à prendre en round 2 : promotion BLOQUANT ou confirmation REQUIS avec justification.

**P2-2 — G04 furniturePrompt : résoudre l'équivalence templated ↔ aplati**
Fichier : `tests/unit/prompt-content-gates.test.ts`, describe G04.
Le seuil >500 chars est un contournement admis. Round 2 : soit aligner les formats (refactor style-resolver pour utiliser le templated), soit ajouter une gate sémantique (nb de motifs communs extraits).

**P2-3 — Promouvoir A03, B08, B09 en gate "audit tous les blocs"**
Pattern récurrent : A02 vérifie STYLES + STYLE_VARIANTS, mais A03/B08/B09 ne vérifient qu'une source. Règle générale proposée : "toute gate vocab/structure DOIT auditer toutes les sources où le vocab peut fuir". À documenter dans `docs/ia/prompt-regression-gates-spec.md`.

## Section F — Handoff → @ia round 2

---
**Handoff → @ia round 2**

**Contexte** : audit @qa round 1 des 24 gates @ia livrées round 1. Score moyen **9.59 / 10**. Aucun P0. **6 findings P1** à corriger pour atteindre le seuil de convergence 9.8/10.

**Fichiers produits par @qa round 1** :
- `tests/unit/prompt-room-type-gates.test.ts` (6 gates C01-C06)
- `tests/unit/prompt-snapshot-gates.test.ts` (4 gates E01-E04)
- `tests/unit/prompt-cross-handler-gates.test.ts` (4 gates H01-H04)
- `scripts/prompt-gates-pre-commit.sh` (script CI local)
- `package.json` (ajout `prebuild` + `test:prompts`)
- `docs/qa/prompt-gates-coverage.md` (ce document)

**Baseline cumulée** : 853 tests PASS / 4 skipped / 0 failed. Commit base `aa5cb71`.

**Actions @ia round 2 (priorité ordonnée)** :

1. **P1-1** — étendre A03 `windows` à STYLE_VARIANTS (1 bloc describe additionnel, ~15 lignes)
2. **P1-4** — élargir B09 EQUIPMENT à convector/vent/panel/thermostat/boiler/water heater (1 regex + 6 vérifications par branche pass2)
3. **P1-6** — fixer regex concurrent models A10 pour couvrir DALLE collé
4. **P1-3** — DSLR B08 : contraindre à la fin de builder (slice(-400))
5. **P1-2** — ADD/Add B05 : contraindre position instructive
6. **P1-5** — D03 iteration high : ancrer au contexte fonction

**Contrainte anti-timeout** : @ia round 2 DOIT respecter la règle CLAUDE.md n°3 — un fichier = un Write, éditer section par section, commits fréquents. Pas de méga-Write monolithique.

**Contrainte qualité** : `npx vitest run` DOIT finir avec `failed: 0`. Règle session 34 fondateur : 100% tests PASS bloque passage tâche suivante.

**Contrainte propagation** : toute modification d'un test existant impacte les baselines snapshots catégorie E. Re-générer les snapshots avec `npx vitest run -u` et committer le diff dans le même commit que le fix.

**Livrable attendu round 2** : `docs/ia/prompt-gates-round-2.md` avec (a) corrections P1-1 à P1-6, (b) score recalculé, (c) handoff → @qa round 2 pour cross-audit.
---

