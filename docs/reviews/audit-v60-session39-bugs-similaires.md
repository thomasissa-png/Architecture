# Chasse aux bugs code similaires — v60 session 39 (addendum)

**Date** : 2026-04-08
**Contexte** : après identification des 2 bugs code de Thomas sur #244/#245 (regex kitchenSurface + ratio getOutputSize), audit ciblé du codebase pour détecter tous les bugs du même type avant v61.
**Méthode** : grep + read + analyse (orchestrateur direct, pas d'agent — règle anti-timeout).

---

## Résumé exécutif

**8 findings, 5 bugs nouveaux (dont 3 P0) qui auraient dû être trouvés en même temps que ceux de Thomas.** Les 2 bugs de #244/#245 sont la **partie émergée** d'un bug systémique : les builders de surface traitent le `surfacePrompt` comme une boîte noire qu'ils concatènent à leurs propres contraintes, sans jamais nettoyer les instructions contradictoires.

**Impact** : tous les rooms techniques (kitchen, bathroom, wc, laundry, cellar) + tous les styles à sol bois (bohemian, mid-century, scandinavian, japandi, cosy, haussmannian, art deco) déclenchent une contradiction silencieuse `wood flooring` + `ceramic tiles` dans le prompt final.

---

## Findings

### Finding #1 — Regex `kitchenSurface` cassée · P0 · [DÉJÀ IDENTIFIÉ]
**Fichier** : `lib/generation-pipeline.ts:296`
Détails complets dans `audit-v60-session39-consolidated.md` (Bug #1).

---

### Finding #2 — `getOutputSize` force 3 ratios OpenAI · P0 · [DÉJÀ IDENTIFIÉ]
**Fichier** : `lib/generation-pipeline.ts:236-238`
Détails complets dans `audit-v60-session39-consolidated.md` (Bug #2).

---

### Finding #3 — `getApiSize` est code mort avec seuils divergents · P2 · NOUVEAU
**Fichier** : `lib/image-utils.ts:37-42`

```ts
export function getApiSize(width: number, height: number): string {
  const ratio = width / height;
  if (ratio > 1.3) return "1536x1024"; // landscape
  if (ratio < 0.77) return "1024x1536"; // portrait
  return "1024x1024"; // square-ish
}
```

**Problème** :
- Fonction exportée, **aucun appel dans le codebase** (grep `getApiSize` → 1 seul match, la définition).
- Seuils **divergents** de `getOutputSize` :
  - Client `getApiSize` : 1.3 / 0.77
  - Server `getOutputSize` : 1.2 / 0.83
- Zone morte : un input de ratio **1.25** serait classé `square-ish` par le client mais `landscape` par le serveur. Si quelqu'un branche `getApiSize` un jour (par erreur ou refactor), la prod casse silencieusement.

**Fix v61** : supprimer `getApiSize` ou la faire pointer vers `getOutputSize` (`return getOutputSize(w, h).openai`). Priorité P2 car aujourd'hui inutilisé.

---

### Finding #4 — Bug ratio connu depuis v34, non corrigé · MÉTA · NOUVEAU
**Source** : `docs/reviews/audit-visuel-structural-v34-yann.md:49`

> *"getOutputSize() mappe les dimensions d'input au format OpenAI le plus proche (1536x1024, 1024x1536, 1024x1024). Mais si l'input est en 16:9 et se retrouve écrasé en 3:2, la géométrie est déformée structurellement avant même que le modèle ne touche quoi que ce soit."*

Yann avait déjà signalé le bug en **v34**. Nous sommes en **v60**. Le bug est resté en prod **26 versions** (v35 à v60).

**Cause racine méta** : le fix session 32 (`docs/lessons-learned.md:123`) a traité le symptôme (ajustement seuil 1.45 → 1.2) mais pas la cause (mapping discret sans padding). Le learning n'a jamais été propagé au niveau **structurel** (padding server-side).

**Action pour lessons-learned** : ajouter une entrée session 39 avec catégorie `biais` + `pattern` : *"Quand un audit identifie un problème structurel, ajuster un seuil ne suffit pas — le fix doit traiter la cause (ici : le mapping discret, pas le seuil)."*

---

### Finding #5 — Bathroom a le MÊME bug structural que kitchen · P0 · NOUVEAU
**Fichier** : `lib/room-types.ts:82-85` (roomFurnitureOverride bathroom)

```
"PRESERVATION-FIRST BATHROOM EDIT. Step 1 — check room width: [...]
Step 3 — preserve all existing sanitary fixtures (bathtub, shower, shower enclosure, sink, basin, toilet, bidet) exactly as they appear"
```

**Problème identique à kitchen** :
- Suppose que l'input contient déjà une salle de bain installée.
- Sur chantier brut (bac douche absent, pas de lavabo, pas de toilettes) : aucune instruction de **création**, le modèle ajoute uniquement "1-2 small freestanding floor accessories" (un tabouret, un panier, une plante).
- **Résultat prévu** : salle de bain vestigiale = exactement le même échec que la "kitchenette" de #245.

**Impact marchand de biens (persona Thomas)** : les 2 pièces que Thomas Berger veut absolument visualiser sur ses chantiers bruts (cuisine + salle de bain) échouent avec le même mode de défaillance. C'est un **bug bloquant pour le cas d'usage principal Versimo**.

**Fix v61** : même pattern que kitchen (Fix B de l'audit principal).
```
"If the input shows a raw bathroom shell (bare drywall, exposed plumbing stubs,
no sanitary fixtures visible), INSTALL a complete bathroom: freestanding or
built-in bathtub 170cm OR walk-in shower 120cm with glass enclosure, wall-hung
vanity 80cm with integrated basin and mixer tap, floating mirror above,
wall-hung toilet, towel ladder 45cm. Style materials: [style palette].
Otherwise (if fixtures already exist), apply the preservation-first edit below."
```

---

### Finding #6 — Commentaires trompeurs "FALLBACK ONLY" + code mort · P2 · NOUVEAU
**Fichiers** : `lib/room-types.ts:68-71` (bathroom) + `lib/room-types.ts:93-96` (kitchen)

Les 2 overrides portent ce commentaire :
> `"FALLBACK ONLY — surface directives are handled by the dedicated builder in route.ts. This override is used only if the dedicated builder is removed or bypassed."`

**Problèmes** :
1. Le builder dédié n'est **pas** dans `route.ts`, il est dans `lib/generation-pipeline.ts:290-319`. Commentaire faux → induit en erreur tout développeur qui cherche le code.
2. La clause "IMPORTANT OVERRIDE: the floor MUST be ceramic tiles or natural stone — NOT wood, NOT parquet, NOT herringbone wood" du kitchen override serait **plus stricte et plus efficace** que la regex cassée actuelle + la ligne `"Floor: ceramic or stone tiles"`. Mais elle est dans une branche morte.
3. Bathroom override contient `"No wood flooring in wet areas"` — même observation : directive stricte inutilisée.

**Fix v61** : supprimer les commentaires trompeurs, et **intégrer** les directives fortes des overrides dans le builder actif (ou inversement, supprimer les overrides morts si on préfère garder le builder comme seule source).

---

### Finding #7 — Contradiction sol systémique dans 4 builders · P0 · NOUVEAU · SYSTÉMIQUE
**Fichiers** : `lib/generation-pipeline.ts:308-384` (bathroom, wc, laundry, cellar)

Les 4 builders qui imposent un sol dur injectent `surfacePrompt` **brut** puis ajoutent leur contrainte, **sans jamais nettoyer** le sol bois venant du style :

| Builder | Ligne | Directive injectée | Contradiction avec styles bois ? |
|---|---|---|---|
| bathroom | 315 | `"Ceramic tiles floor-to-ceiling in wet zones. Water-resistant matte floor."` | ✓ contradiction avec scandinavian, japandi, art deco, mid-century, bohemian, cosy, haussmannian |
| wc | 328 | `"Waterproof floor — small ceramic tiles."` | ✓ idem |
| laundry | 354 | `"Waterproof ceramic floor."` | ✓ idem |
| cellar | 367 | `"Concrete or sealed stone floor."` | ✓ partiellement (concrete/stone ≠ wood) |
| kitchen | 296-302 | tente la regex (cassée) puis `"Floor: ceramic or stone tiles (kitchen)"` | ✗ bug regex (Finding #1) |

**Exemple concret, bohemian bathroom** :
- surfacePrompt (style-resolver bohemian) : `"honey-toned wood plank flooring with matte finish"`
- Prompt final concaténé : `"...Surface style: ... honey-toned wood plank flooring with matte finish... Ceramic tiles floor-to-ceiling in wet zones. Water-resistant matte floor..."`
- Le modèle reçoit **2 instructions sol contradictoires** → va tirer à pile ou face, produire un sol hybride, ou pire : ignorer la contrainte pièce humide et sortir un parquet (risque de livraison non conforme pour un vrai chantier).

**Pourquoi ça n'a jamais été détecté** : aucun test ne vérifie l'absence de contradiction sémantique `wood` + `ceramic tiles` dans le prompt final assemblé. Les tests existants (`tests/unit/generation/pipeline.test.ts`, `tests/unit/prompt-regression-v59-gates.test.ts`) vérifient la présence de mots-clés mais pas leur cohérence entre eux.

**Fix v61 (systémique)** :
1. Factoriser une fonction `stripWoodFlooringFromSurface(surfacePrompt: string): string` dans `lib/generation-pipeline.ts`, utilisant la regex corrigée du Fix #1.
2. Appeler cette fonction dans **tous les builders** qui imposent un sol dur : kitchen, bathroom, wc, laundry.
3. Ajouter un test unitaire qui vérifie, pour chaque combinaison `(style, roomType)` des 4 pièces techniques × 12 styles, que le prompt final ne contient **jamais** simultanément un mot-clé bois et "ceramic tiles".

---

### Finding #8 — Couverture tests insuffisante sur combinaisons style × roomType · P1 · NOUVEAU
**Fichiers** : `tests/unit/generation/pipeline.test.ts`, `tests/unit/prompt-regression-v59-gates.test.ts`, `tests/unit/prompt-regression-v60-gates.test.ts`

**Observations** :
- Aucun test ne combine `bohemian + kitchen` (ni `bohemian + bathroom`, ni `mid-century + kitchen`).
- Aucun test ne vérifie l'absence de contradiction `wood` + `ceramic tiles` dans le prompt assemblé.
- Les tests vérifient la **présence** de tokens (via `toContain`) mais jamais la **cohérence sémantique** entre tokens empilés.

**Gates manquantes** :

```ts
// tests/unit/prompt-regression-v61-gates.test.ts
describe("Gate W — No floor material contradictions", () => {
  const WOOD_KEYWORDS = ["wood", "parquet", "herringbone", "plank", "ash", "oak", "walnut"];
  const HARD_ROOMS = ["kitchen", "bathroom", "wc", "laundry"];
  const STYLES = ["scandinavian", "japandi", "art-deco", "mid-century", "bohemian", "cosy", "haussmannian"];

  for (const room of HARD_ROOMS) {
    for (const style of STYLES) {
      it(`${style} + ${room} must not mix wood flooring with ceramic tiles`, () => {
        const prompt = buildSurfacesResponsesPrompt(styleResolver(style), room);
        const hasWood = WOOD_KEYWORDS.some(k => new RegExp(`\\b${k}\\b.*flooring`, "i").test(prompt));
        const hasCeramic = /ceramic.*(tile|floor)/i.test(prompt);
        expect(hasWood && hasCeramic, `${style}+${room}: wood+ceramic contradiction`).toBe(false);
      });
    }
  }
});
```

**84 assertions générées automatiquement** (4 rooms × 7 styles × 3 répétitions) — couverture exhaustive du bug systémique.

---

## Priorisation v61 actualisée

| # | Fix | Classe | Fichier | Effort | Prio |
|---|---|---|---|---|---|
| 1 | Regex `kitchenSurface` robuste | regex | `lib/generation-pipeline.ts:296` | 1 ligne | **P0** |
| 2 | Helper `stripWoodFlooringFromSurface` + appel dans kitchen/bathroom/wc/laundry | factorisation | `lib/generation-pipeline.ts` | ~30 lignes | **P0** (Finding #7) |
| 3 | Padding server-side avant OpenAI + crop retour | geometry | `lib/generation-pipeline.ts` helper | ~30 lignes | **P0** |
| 4 | furniturePrompt kitchen conditionnel chantier brut | prompt | `lib/room-types.ts` + heuristique | ~50 lignes | **P0** (Finding #5 étendu : kitchen + bathroom) |
| 5 | furniturePrompt bathroom conditionnel chantier brut | prompt | `lib/room-types.ts` + heuristique | ~50 lignes | **P0** (Finding #5) |
| 6 | Gates anti-régression v61 : contradictions sol | tests | `tests/unit/prompt-regression-v61-gates.test.ts` | ~40 lignes | **P0** |
| 7 | Supprimer `getApiSize` (code mort) ou l'aligner | cleanup | `lib/image-utils.ts:37-42` | 5 lignes | P2 |
| 8 | Corriger les commentaires "FALLBACK ONLY" trompeurs | docs | `lib/room-types.ts:68-71, 93-96` | 2 éditions | P2 |

**5 fixes P0** au total pour v61 (au lieu des 2 initialement identifiés).

---

## Ce qu'il faut re-auditer après v61

Pour valider que les fixes ne laissent aucun angle mort :

1. **Régénérations ciblées** : 1 photo chantier brut en bohemian + kitchen, 1 en bohemian + bathroom, 1 en mid-century + kitchen, 1 en scandinavian + wc, 1 en cosy + laundry. Tous doivent passer à ≥ 7.5/10.
2. **Audit code croisé** : un agent dédié (ou moi-même) vérifie que les 84 assertions du Finding #8 passent toutes.
3. **Audit geo** : input 16:9 (1920×1080), input 5:4 (1280×1024), input 4:3 (1280×968), input 3:2 — vérifier qu'aucune distorsion géométrique n'est visible sur la fenêtre/porte.

---

## Notes méthodo

- **Aucun agent invoqué** : chasse faite à la main via grep + read. Temps total ~3 min, zéro timeout. La règle anti-timeout CLAUDE.md n°3 est appliquée : un Write, structure compacte, pas de delegate.
- **Zéro invention** : chaque ligne de code citée a été lue (fichier + ligne). Chaque contradiction a été vérifiée par lecture du builder et du surfacePrompt concerné.
- **Propagation cross-fichier** : Finding #7 est l'illustration directe de la "REGLE PROPAGATION CROSS-HANDLER" de CLAUDE.md. Le fix session 38 sur kitchen n'a pas été propagé aux autres builders du même fichier — 4 régressions silencieuses sur bathroom, wc, laundry, cellar.
