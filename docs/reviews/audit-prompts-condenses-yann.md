# Audit Prompts Condenses v45 — Yann Duval

**Date** : 2026-04-04
**Version prompts** : v45 (gpt-image-1.5, preservation-first)
**Fichiers audites** : `lib/generation-pipeline.ts`, `lib/iteration-prompt.ts`
**Contexte** : Condensation de ~800 mots a ~200 mots pour eviter les rejections safety filter gpt-image-1.5.

---

## 1. Constantes partagees — Preservation geometrique

| Constante | Contenu v45 | Suffisant ? | Risque |
|---|---|---|---|
| PASS1_PREAMBLE | Geometrie, camera, fenetres/portes, murs, plafond, dimensions | OUI | Bonne couverture. "Edit this photo" en premier token = mode edition force. |
| PASS2_PREAMBLE | Surfaces finales locked, camera, geometrie, fenetres, portes | OUI | Solide. "finished room" signale au modele que les surfaces sont intouchables. |
| ANTI_FENETRE | Meme nombre, positions, tailles. Murs solides restent solides. | OUI | Formulation positive correcte — pas de mention negative qui amorce. |
| CAMERA_PRESERVATION | Angle, perspective, FOV | OUI | Correct mais manque "same height, same tilt" (present dans v43, absent ici). |
| LIGHT_PRESERVATION | Direction, ombres, temperature couleur, blancs neutres, materiaux chauds | OUI | Bien condense. Anti-warm shift integre. |
| CEILING_PRESERVATION | Demolition = platre, elements intentionnels preserves, courbure | OUI | Bon compromis. "Original texture" preserve poutres/voutes. |
| WALL_PRESERVATION | Geometrie identique, pierre brute → limewash | OUI | Condense mais complet. |
| COLUMN_PRESERVATION | Chaque colonne/pilier a sa position exacte | OUI | Necessaire et suffisant. |
| ANTI_INVENTION | Pas de nouveaux elements architecturaux | OUI | Critique et bien formule. |
| DSLR_LINE | Wide-angle, deep DOF, sharp, no HDR/color grading/text | OUI | Correct. Pas de grain ISO — conforme decision fondateur. |

**Verdict constantes : 8.5/10** — L'essentiel est preserve. La condensation n'a pas sacrifie les directives critiques.

---

## 2. Builders Passe 1 (surfaces) — Analyse par room type

| Room type | Structure | Directives critiques | Note |
|---|---|---|---|
| Generic (salon, bureau) | PREAMBLE → ANTI_FENETRE → 6 constantes → style → cleanup → empty | Accent wall, equipements muraux, prises electriques | 8/10 |
| Kitchen | Idem + floor override ceramique, splashback | Filtre bois/parquet du surfacePrompt automatique | 8/10 |
| Bathroom | Idem + carrelage sol-plafond zone douche, spots IP44 | Specifique et credible | 8/10 |
| Bedroom | Idem + accent wall preservee | Correct | 8/10 |
| WC / Laundry / Cellar / Entryway | Idem structure allege | Adapte a la taille | 7.5/10 |

**Verdict passe 1 : 8/10** — Architecture solide, constantes en tete, style en milieu, cleanup en fin. L'ordre des tokens est correct pour gpt-image-1.5.

---

## 3. Builders Passe 2 (mobilier) — Credibilite composition

| Room type | Distribution spatiale | Densite adaptative | Echelle | Note |
|---|---|---|---|---|
| Generic (salon) | Full depth + width, foreground/back third | Compact 5-6 pieces, large 2 groupes | Door 204cm, handle 100cm, sill 90cm | 8/10 |
| Kitchen | Full depth, zones travail le long des murs, ilot si >10m2 | 3 tiers par largeur (compact/medium/large) | Counter 60cm, door 80cm | 8.5/10 |
| Bathroom | Pas de distribution depth (inutile) | Compact par defaut, 60cm vanity, pas de double | Plafond 250cm, carrelage | 8/10 |
| Bedroom | Full depth, lit anchor, commode fond | Minimaliste = vide, compact = 140cm lit | Door 204cm | 8/10 |
| Dining | Table centree, buffet fond si profond | Compact = rond 120cm + 4 chaises | Door 204cm, sill 90cm | 7.5/10 |
| Entryway | Console max 60% mur | Pas overcrowd | Door 204cm | 7.5/10 |
| WC / Laundry / Cellar | Minimal | Adapte | Door 204cm | 7/10 |

**Verdict passe 2 : 7.5/10** — La distribution spatiale et la densite adaptative sont les MEILLEURES directives de ces prompts. Mais il manque un element critique (voir corrections).

---

## 4. Iterations (adjust) — Precision chirurgicale

| Builder | Structure | Preservation | Note |
|---|---|---|---|
| Iteration furniture indoor | Edit + surfaces unchanged + keep existing furniture + modifications | Distribution depth, contact shadows, equipment | 7/10 |
| Adjust indoor | Edit + small precise change + keep everything + single change | Kitchen/bath preservation, fill texture si retrait | 7.5/10 |
| Adjust outdoor | Edit + small precise change + keep everything | Vegetation, sky, ground preserved | 7.5/10 |

**Verdict iterations : 7/10** — Fonctionnel mais affaibli par la condensation. Voir point critique ci-dessous.

---

## 5. Note globale et risques de regression

### Note globale : 7.5/10

| Dimension | Note | Commentaire |
|---|---|---|
| Preservation geometrique | 8.5/10 | Les constantes couvrent l'essentiel. PREAMBLE en tete = correct. |
| Composition mobilier | 8/10 | Distribution spatiale, densite adaptative, echelle — tout y est. |
| Iterations chirurgicales | 7/10 | Perte du framing "SURGICAL EDIT" et de l'inventaire mental. |
| Risque regression | -1 pt | 3 pertes identifiees ci-dessous. |

---

## 6. Top 3 corrections (note < 8/10)

### P0 — Inventaire mental absent des iterations adjust

**Fichier** : `lib/iteration-prompt.ts`, builders `buildAdjustResponsesPrompt` et `buildAdjustOutdoorResponsesPrompt`

**Probleme** : Le v38 (Sprint 24) avait ajoute "Before editing, mentally list every object visible in this photo [...] ALL of these must appear at the SAME position, SAME size, SAME color". Cette directive est ABSENTE du v45. Sans elle, le modele ne sait pas QUOI garder — il enumere mentalement, ce qui reduit les suppressions accidentelles.

**Correction** : Ajouter apres la premiere phrase de chaque adjust builder :
```
"Before editing, mentally list every visible object. All must stay at same position, same size, same color — except the one change described."
```

Impact : +0.5 pt sur les iterations, empeche la regression "modele qui regenere la scene".

### P1 — Camera height/tilt absent de CAMERA_PRESERVATION

**Fichier** : `lib/generation-pipeline.ts`, constante CAMERA_PRESERVATION

**Probleme** : Le v43 incluait "same height, same tilt angle, same horizontal rotation". Le v45 ne dit que "same camera angle, same lens perspective, same field of view". Le modele gpt-image-1.5 est plus creatif que gpt-image-1 — sans "same height", il peut relever ou abaisser le point de vue subtilement.

**Correction** : Remplacer la constante par :
```
"Same camera angle, height, tilt, and field of view as input."
```

Impact : +0.3 pt sur la preservation spatiale, specifiquement sur les grands volumes (double hauteur, mezzanine).

### P2 — "No curtains" isole dans EQUIPMENT_PRESERVATION passe 2

**Fichier** : `lib/generation-pipeline.ts`, constante EQUIPMENT_PRESERVATION

**Probleme** : "No curtains" est colle a la fin de EQUIPMENT_PRESERVATION ("Keep wall-mounted equipment visible [...]. No curtains."). Cette position en fin de constante dilue la directive. Sur gpt-image-1.5 qui pondere les premiers tokens, "no curtains" en position tardive sera moins respecte.

**Correction** : Deplacer "No curtains, no drapes, no blinds" dans PASS2_PREAMBLE (position de tete, poids maximal) :
```
const PASS2_PREAMBLE = "Edit this photo of a finished room. The wall colors, floor material, and ceiling finish are final — keep them unchanged. Same camera angle, same room geometry, same windows, same doors. No curtains, no drapes."
```

Impact : reduit le risque d'hallucination de rideaux (cause racine : le modele invente une fenetre pour justifier des rideaux).

---

## Synthese

La condensation v45 est **bien executee** dans l'ensemble. Les constantes partagees (PASS1_PREAMBLE, PASS2_PREAMBLE) en tete de chaque builder sont la bonne strategie pour gpt-image-1.5. La distribution spatiale, la densite adaptative et les references d'echelle ont survecu a la condensation. Les 3 corrections ci-dessus (inventaire mental, camera height, positionnement "no curtains") coutent ~15 mots supplementaires au total et comblent les seules pertes significatives.

---

**Handoff** : @ai-image-expert (Lucas Moreau) pour validation croisee technique. @fullstack pour implementer les 3 corrections si validees.
