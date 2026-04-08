# Audit visuel v60 — session 39 (consolidé Yann + Lucas)

**Date** : 2026-04-08
**Audités** : #244 (pass1 loggée) + #245 (pass2 loggée) — même pipeline (MD5 pass1 identique)
**Style** : bohemian · **Room** : kitchen · **Input** : 1280×968 (4:3, ratio 1.322)
**Mode** : orchestrateur (Yann/Lucas timeout — findings salvagés depuis output files + vérification visuelle directe + audit code)

---

## Résumé exécutif

**NO-GO. Note globale ~4/10**, bien sous la cible 7.5/10. Les 2 bugs signalés par Thomas sont **confirmés** et ont des causes racines **CODE** (pas prompt) :

1. **Cuisine non générée** = 2 bugs code combinés : (a) regex kitchenSurface cassée qui laisse passer le sol bois en mode cuisine, et (b) furniturePrompt qui suppose une cuisine déjà installée au lieu de la prescrire sur chantier brut.
2. **Hauteur fenêtre déformée** = `getOutputSize()` ne supporte que 3 tailles OpenAI → un input 4:3 (1.322) est forcé en 3:2 (1.5) → compression verticale mécanique de ~13.4%, plus recadrage bas/gauche.

**Ces 2 bugs n'ont jamais été détectés auparavant parce qu'aucune génération kitchen en bohemian/mid-century n'a été auditée avant #244/#245.** Les tests de non-régression v60 ne couvrent pas ce cas.

---

## Notes par critère

| Critère (poids) | Passe 1 | Passe 2 (output) |
|---|---|---|
| Préservation spatiale ×3 | **3/10** | **3/10** |
| Fidélité surfaces / mobilier ×2 | 4/10 | 5/10 |
| Échelle & proportions ×2 | 3/10 | 4/10 |
| Lumière & ombres | 6/10 | 6/10 |
| Rendu photoréaliste | 5/10 (artefact halo fenêtre) | 7/10 |
| Cohérence style bohemian | 6/10 | 7/10 |
| Crédibilité usage kitchen | **1/10** | **2/10** |
| **Moyenne pondérée** | **3.7/10** | **4.1/10** |

---

## Bug #1 — Cuisine non générée · CONFIRMÉ

### Ce qui est visible
- **Input** : chantier brut BA13, plafond rose non fini, arrivées fluides au mur du fond, grande fenêtre simple vantail verticale, aucune cuisine installée.
- **Pass 1** : pièce finie, murs blancs, plafond blanc, pendant rattan ✓, MAIS **sol mi-parquet honey mi-carrelage gris** (contradiction visible au centre de l'image), pièce vide.
- **Output** : 1 seul bloc bas blanc 1.5m sous la fenêtre avec plan de travail et quelques accessoires déco (planche, pot ustensiles, plante, bol fruits). **Zéro meuble haut, zéro hotte, zéro cooktop, zéro four, zéro frigo, pas d'évier visible**. Le reste de la pièce est une dining zone (table ronde + 4 chaises bohemian).

### Cause racine A — Regex kitchenSurface cassée
**Fichier** : `lib/generation-pipeline.ts:296`

```ts
const kitchenSurface = surfacePrompt.replace(
  /,?\s*(wide-plank|herringbone|wood|ash|oak|walnut|parquet)\s+flooring[^,.]*/gi,
  ""
);
```

**Intention** : en mode kitchen, supprimer le sol bois du surfacePrompt pour le remplacer par `"Floor: ceramic or stone tiles (kitchen)"` (ligne 302).

**Bug** : la regex cherche un mot-clé **directement** suivi de `\s+flooring`. Audit des 12 styles :

| Style | Prompt sol | Match regex ? |
|---|---|---|
| Scandinavian | `wide-plank whitewashed ash flooring` | ✓ (via `ash flooring`) |
| Japandi | `light ash wide-plank flooring` | ✓ (via `wide-plank flooring`) |
| Art Deco | `dark stained herringbone parquet flooring` | ✓ (via `parquet flooring`) |
| **Mid-Century** | `medium walnut-toned wood plank flooring` | **✗ NO MATCH** (`wood` suivi de `plank`) |
| **Bohemian** | `honey-toned wood plank flooring` | **✗ NO MATCH** (`wood` suivi de `plank`) |
| Cosy | `light oak wide-plank flooring` | ✓ (via `wide-plank flooring`) |
| Haussmannian | `classic light oak herringbone parquet flooring` | ✓ |
| Contemporary | `engineered stone flooring` | ✗ (ok : pas du bois) |
| Wabi-sabi | `natural stone or aged concrete flooring` | ✗ (ok : pas du bois) |

**Résultat pour bohemian kitchen** : `kitchenSurface` contient TOUJOURS `"honey-toned wood plank flooring"`, qui est ensuite concaténé ligne 302 avec `"Floor: ceramic or stone tiles (kitchen)"` → **le modèle reçoit 2 instructions sol contradictoires** → il rend un sol hybride parquet/carrelage (exactement ce qu'on voit sur gen-244-pass1.jpg).

### Cause racine B — furniturePrompt suppose cuisine pré-équipée
**Fichier** : logs.json #245 · `lib/room-types.ts` kitchen override

Extrait du furniturePrompt loggé :
> "Kitchen accessories and freestanding elements ONLY — **preserve all existing kitchen built-in cabinetry** (upper and lower cabinets), appliances (oven, cooktop, hob, range, fridge, dishwasher, microwave, hood, extractor fan), countertops, sink, faucet, and backsplash exactly as they appear in the input photo"

C'est une formule de **préservation**, pas de **création**. Si l'input est un chantier brut (rien à préserver), le modèle n'a aucune instruction pour **installer** une cuisine complète → il se rabat sur les clauses `ADD only freestanding and decorative accessories` et produit une kitchenette vestigiale.

### Fix v61 — Fix A (regex)
```diff
- const kitchenSurface = surfacePrompt.replace(/,?\s*(wide-plank|herringbone|wood|ash|oak|walnut|parquet)\s+flooring[^,.]*/gi, "");
+ const kitchenSurface = surfacePrompt.replace(/,?\s*[^,.]*\b(?:wide-plank|herringbone|wood|ash|oak|walnut|parquet)\b[^,.]*flooring[^,.]*/gi, "");
```
Cette regex capture tout segment (borné par virgule ou point) qui contient un mot-clé ET se termine par `flooring`. Test mental :
- `"honey-toned wood plank flooring with matte finish"` → match via `wood ... flooring` ✓
- `"medium walnut-toned wood plank flooring with satin finish"` → match ✓
- `"wide-plank whitewashed ash flooring with visible grain"` → match ✓
- `"light grey engineered stone flooring"` → pas de match (aucun mot-clé bois) ✓

### Fix v61 — Fix B (furniturePrompt chantier brut)
Ajouter un branchement conditionnel dans `lib/room-types.ts` kitchen override : si l'input est détecté comme chantier brut (via image-analysis ou flag client), prescrire une cuisine complète au lieu de préserver l'existant :

> "If the input shows a raw shell (bare drywall, exposed plumbing, no cabinetry visible), INSTALL a complete bohemian kitchen on the longest wall: 260cm run of lower cabinets in natural rattan-front or honey oak veneer, matching uppers 220cm with one open shelf, integrated hob, built-in oven, extractor hood 60cm wide, undermount sink with aged brass faucet, wood or travertine countertop, terracotta zellige backsplash. Stools and dining only if space remains after the kitchen install."

**Quick win** : détection chantier brut = heuristique sur `image-analysis.ts` (présence placo BA13 non peint = teintes vertes/roses dominantes dans les régions murales).

---

## Bug #2 — Hauteur fenêtre déformée · CONFIRMÉ

### Ce qui est visible
- **Input** : fenêtre unique, 1 grand vantail vertical, linteau presque au plafond, allège basse (~60cm du sol), hauteur ≈ 55-60% du cadre.
- **Pass 1** : fenêtre transformée en **2 vantaux côte-à-côte** (double fenêtre), hauteur réduite, **halo rectangulaire flou semi-transparent** autour (artefact de compositing majeur).
- **Output** : fenêtre toujours 2 vantaux, encore plus trapue (ratio H/L ~1.1), allège rehaussée pour accueillir le bloc bas blanc inventé.

### Cause racine — `getOutputSize()` ne supporte que 3 ratios
**Fichier** : `lib/generation-pipeline.ts:225-239`

```ts
export function getOutputSize(width, height) {
  if (!width || !height) return { openai: "1024x1024", w: 1024, h: 1024 };
  const ratio = width / height;
  if (ratio > 1.2) return { openai: "1536x1024", w: 1536, h: 1024 }; // ratio 1.5
  if (ratio < 0.83) return { openai: "1024x1536", w: 1024, h: 1536 }; // ratio 0.67
  return { openai: "1024x1024", w: 1024, h: 1024 }; // ratio 1.0
}
```

**Mapping pour input 1280×968** :
- Ratio input : **1.322** (4:3 quasi)
- `ratio > 1.2` → mappé à `1536×1024` (**ratio 1.5**)
- **Distorsion géométrique mécanique** : le modèle doit projeter une scène 1.322 dans un canvas 1.5
  - Soit il **étire horizontalement** (+13.4%) → la fenêtre verticale devient plus large et visuellement plus courte
  - Soit il **compresse verticalement** (-9.5%) → la fenêtre perd de la hauteur
  - Dans les 2 cas, la géométrie verticale est cassée

**Cas affectés** (tous les inputs 4:3 ou proches) : photos iPhone paysage, photos immobilières standard, la majorité des uploads Versimo. **C'est un bug systémique, pas un cas isolé.**

### Fix v61 — 3 options

**Option A (recommandée, simple)** : **padding blanc server-side avant envoi OpenAI**
- Calculer le target ratio via `getOutputSize()`
- Padder l'image d'origine avec du blanc pour atteindre exactement 1536×1024 (ou 1024×1536, ou 1024×1024)
- Envoyer l'image paddée au modèle
- **Crop retour** : sur la réponse OpenAI, retirer le padding pour restituer le ratio original
- **Avantage** : zéro distorsion, la géométrie est préservée par construction
- **Fichier** : `lib/generation-pipeline.ts` nouveau helper `padToOpenAISize(buffer, targetSize)` + crop inverse `cropFromOpenAIOutput(buffer, originalRatio)`

**Option B (contournement prompt, faible)** :
Injecter dans tous les builders : `"Output aspect must match input aspect exactly. Do not change window heights or vertical proportions."`
→ N'empêche pas la distorsion mécanique, juste un rappel faible.

**Option C (refactor full)** :
Downsampler client-side vers exactement 1024/1536/1024 selon ratio AVANT compression JPEG, avec crop intelligent centré.
→ Plus lourd, change le pipeline client, risque de couper l'image d'origine.

**Recommandation : Option A** — implémentation côté serveur, transparente pour le client, zéro distorsion, fix définitif.

---

## Observations additionnelles (bonus)

### Pass 1
- **Artefact halo rectangulaire flou** autour de la fenêtre (Lucas) : compositing issue du modèle, possiblement lié au padding auto OpenAI quand le ratio n'est pas exact. Disparaîtrait probablement avec le Fix Option A.
- **Artefact vert résiduel** sur le mur droit près de l'ouverture porte (Lucas) : placo BA13 mal couvert, le cleanup pass1 n'a pas suffi.
- **Sol hybride parquet/carrelage** : cause = Bug #1 regex (déjà traité).
- **Typologie fenêtre changée** : 1 vantail → 2 vantaux. Pas un bug de ratio, un bug de fidélité géométrique. La contrainte `"same number of windows and doors"` ne protège pas la **typologie intra-fenêtre** (nombre de vantaux).

### Pass 2
- **Pendant rattan du surfacePrompt remplacé** par un autre style de pendant plus foncé dans l'output final : non-respect `surface_prompt` propagé en pass 2.
- **Dimensions output changées** : 960×640 au lieu de 1536×1024 → recadrage supplémentaire après crop.
- **Aucune hallucination de fenêtre supplémentaire** ✓
- **Style bohemian crédible** sur la dining zone (rattan, kilim, osier, bois chaud) mais hors sujet par rapport à l'intention kitchen.

---

## Verdict final

**NO-GO session 39.** Impossible de livrer v60 tel quel pour des generations kitchen sur chantier brut (cas d'usage principal Versimo).

### Priorisation fixes v61

| # | Fix | Impact | Effort | Priorité |
|---|---|---|---|---|
| 1 | **Regex kitchenSurface** (`lib/generation-pipeline.ts:296`) | Débloque bohemian + mid-century en kitchen (contradictions sol) | 1 ligne | **P0** |
| 2 | **Padding server-side** pour préserver ratio input (`lib/generation-pipeline.ts` nouveau helper) | Fix systémique fenêtres 4:3 — affecte TOUS les styles et room types | ~30 lignes + tests | **P0** |
| 3 | **furniturePrompt kitchen conditionnel chantier brut** (`lib/room-types.ts` + heuristique `lib/image-analysis.ts`) | Rend le mode kitchen utilisable sur chantier | ~50 lignes | **P1** |
| 4 | **Gates anti-régression** : ajouter 2 tests unitaires — (a) regex matche "wood plank flooring", (b) getOutputSize préserve ratio input via padding | Prévient régression | ~20 lignes tests | **P1** |

### Gates v61 à ajouter
- `tests/unit/prompt-regression-v61-gates.test.ts` :
  - `it('kitchenSurface regex strips wood plank flooring from bohemian', ...)`
  - `it('kitchenSurface regex strips wood plank flooring from mid-century', ...)`
  - `it('kitchenSurface regex preserves stone flooring from contemporary', ...)`
- `tests/unit/ratio-preservation.test.ts` :
  - `it('4:3 input (1280x968) outputs with preserved vertical proportions', ...)`
  - `it('16:9 input outputs without vertical compression', ...)`

### Ce qui reste à re-auditer après v61
- Regénérer #244 avec les 3 fixes appliqués
- Auditer sur photo chantier brut 4:3 ET photo cuisine installée 4:3 (2 cas d'usage)
- Auditer sur 3 styles kitchen : bohemian, mid-century, scandinavian (couverture regex)
- Cible post-fix : **≥ 7.5/10 moyenne**

---

## Notes méthodo session 39

- **Timeout double Yann + Lucas** : les deux agents ont timeout (~44 min et ~54 min) au moment de la rédaction du fichier markdown, malgré des findings techniques complets dans leurs output buffers. Cause probable : rédaction finale du rapport markdown trop longue pour le budget agent. **Règle anti-timeout à renforcer** : les agents d'audit visuel doivent produire leurs findings en **< 150 lignes**, pas 400. Le formatage narratif tue le budget.
- **Findings salvagés** : observations textuelles extraites depuis `/tmp/claude-.../tasks/*.output` via grep sur les `"text":` puis croisées avec vérification visuelle directe (Read sur les 3 images) et audit code factuel (grep + read sur `generation-pipeline.ts`).
- **Zéro invention** : chaque observation de ce rapport est soit (a) extraite verbatim des outputs agents, (b) vérifiée visuellement par moi-même sur les images, (c) vérifiée dans le code.

---

**Prochaine action** : décision fondateur sur priorité fixes v61 → implémentation par @fullstack → re-audit Yann+Lucas sur 3-4 régénérations.
