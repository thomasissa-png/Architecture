# Audit technique furniturePrompts — Lucas Moreau
**Date** : 2026-04-04 | **Modele cible** : gpt-image-1.5 | **Fichier** : components/StylePicker.tsx

## Analyse par style

| # | Style | Mots | "choose one:" | Alternatives | Debut prompt (dominance) | Note /10 |
|---|-------|------|---------------|-------------|--------------------------|----------|
| 1 | Scandinave | ~155 | 7x | 21 options | "A serene Nordic living space" — bon ancrage ambiance | 7.5 |
| 2 | Contemporain | ~155 | 7x | 21 options | "A refined editorial interior" — bon | 7.5 |
| 3 | Industriel | ~165 | 8x | 24 options | "A raw loft space with character" — bon | 7.0 |
| 4 | Japandi | ~155 | 7x | 21 options | "A meditative room with balanced asymmetry" — excellent | 8.0 |
| 5 | Art Deco | ~160 | 8x | 24 options | "An opulent salon with geometric precision" — bon | 7.0 |
| 6 | Mid-Century | ~165 | 8x | 24 options | "A sunlit retro living room" — attention "sunlit" impose lumiere | 6.5 |
| 7 | Boheme | ~160 | 7x | 21 options | "A warm nomadic retreat" — bon | 7.5 |
| 8 | Mediterraneen | ~160 | 7x | 21 options | "A sun-drenched southern interior" — impose lumiere solaire | 6.0 |
| 9 | Cosy | ~155 | 6x | 18 options | "A cocooning nest where warmth is layered" — bon | 8.0 |
| 10 | Wabi-Sabi | ~160 | 7x | 21 options | "A quiet room where objects show their age" — excellent | 8.5 |
| 11 | Maximaliste | ~155 | 7x | 21 options | "A bold personality-filled room" — bon | 7.5 |
| 12 | Haussmannien | ~170 | 8x | 24 options | "A refined Parisian apartment" — bon | 7.0 |

**Moyenne** : 7.3/10

## Diagnostic global

**Longueur** : 155-170 mots par prompt. Correct pour gpt-image-1.5 (fenetre ~300 mots utile). Aucun depasse 200 mots. Pas de surcharge.

**Pattern "choose one:"** : 6 a 8 occurrences par prompt = 18-24 alternatives. Le modele ne "choisit" pas — il melange ou ignore. Avec gpt-image-1.5, l'instruction "choose one:" est mieux comprise que sur les anciens modeles, mais 7+ alternatives par prompt risquent de produire des hybrides (demi-canape A + demi-canape B).

**Dominance debut** : les premiers tokens sont determinants pour gpt-image-1.5. La phrase d'ouverture ancre l'ambiance. 10/12 sont corrects. 2 violent la regle "pas de directive lumiere" (Mid-Century "sunlit", Mediterraneen "sun-drenched").

**Structure FOREGROUND/LATERAL/BACKGROUND** : excellente. Guide la distribution spatiale en profondeur. Coherent avec les directives de route.ts.

## Top 5 corrections (P0-P2)

**P0 — Mediterraneen** : "A sun-drenched southern interior" impose un eclairage solaire direct. Remplacer par "A relaxed southern interior where time slows down". La lumiere de l'input est sacree (CLAUDE.md).

**P0 — Mid-Century** : "A sunlit retro living room" impose lumiere naturelle. Remplacer par "A retro living room — everything has legs and light passes beneath". Garder la seconde phrase qui est la vraie signature du style.

**P1 — Reduire les "choose one:" a 5 max par prompt** : au-dela de 5, le modele commence a combiner. Les styles a 8x (Industriel, Art Deco, Mid-Century, Haussmannien) sont les plus exposes. Supprimer les alternatives les moins differenciantes (ex: 3 variantes de side table quasi identiques).

**P1 — "vary furniture placement and pieces each generation"** : present dans tous les prompts, consomme des tokens pour une instruction que le modele ne peut pas respecter (pas de memoire inter-generations). Supprimer (12 prompts x ~8 mots = ~96 tokens inutiles).

**P2 — Haussmannien "facing fireplace"** : "place facing fireplace OR centered" presuppose une cheminee. Si la piece n'en a pas, le modele peut en halluciner une. Remplacer par "place centered OR along the main wall".

## Handoff

- **Destinataire** : @fullstack pour appliquer les 5 corrections dans StylePicker.tsx
- **Audit croise** : @interior-architect (Yann) pour valider que les suppressions d'alternatives ne perdent pas de signature stylistique
- **Impact** : aucun changement de structure, corrections chirurgicales dans les strings furniturePrompt
