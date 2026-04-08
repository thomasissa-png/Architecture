# Chasse additionnelle — Option A (outdoor + furniturePrompts bois)

**Date** : 2026-04-08
**Contexte** : suite validation @ia (9/10 GO) qui a signalé 2 classes additionnelles à auditer. Chasse faite à la main, budget 5 min, zéro agent.
**Méthode** : grep + read ciblés sur `lib/outdoor-*.ts`, `lib/style-resolver.ts`, `lib/room-types.ts` (applyRoomTypeOverrides).

---

## Résumé exécutif

**3 findings supplémentaires** :
- **A1 (P1)** : contradiction sol outdoor sur subtype `jardin` — concaténation sans cleanup, affecte les 6 styles outdoor (tous imposent un sol dur).
- **A2 (fausse alarme confirmée)** : v55 a déjà corrigé le bug de concaténation `furniturePrompt` living room en kitchen (cf. `lib/generation-pipeline.ts:993-998`). **Le furniturePrompt bois des styles n'atterrit PAS en kitchen/bathroom** — seule la palette matériaux via `getStyleMaterialHint()` est injectée. Cette piste @ia est refermée.
- **A3 (P0 — NOUVEAU)** : clause conditionnelle "dining zone" dans le kitchen override explique **directement** la dining room bohemian de #245.

**Total findings v61** : 8 (audit principal + addendum bugs similaires) + 2 (addendum A) = **10 findings**, dont **6 P0**.

---

## Finding A1 — Contradiction sol outdoor `jardin` × styles · P1

**Fichier** : `lib/outdoor-subtypes.ts:52-62` + `lib/outdoor-styles.ts:30-120` + `lib/generation-pipeline.ts:583-604`

**Mécanisme** :
1. `applyOutdoorSubtypeOverrides()` fait une **pure concaténation** (l. 110-115) :
   ```ts
   effectiveSurfacePrompt: `${surfacePrompt}. ${sub.subtypeSurfaceOverride}`
   ```
   Aucune regex cleanup, aucun mécanisme de priorité.

2. Le subtype `jardin` dit : `"Garden with natural ground — preserve all existing trees, grass, hedges and background vegetation. Only update the ground surface in the foreground seating zone."`

3. **Tous les 6 styles outdoor imposent un sol DUR** (audit ligne par ligne de `lib/outdoor-styles.ts`) :

| Style | surfacePrompt (extrait sol) | Contradiction avec jardin ? |
|---|---|---|
| contemporain_outdoor | `"large-format grey concrete pavers 60x60cm"` | ✓ béton vs natural ground |
| mediterraneen_outdoor | `"reclaimed Provençal terracotta tiles 30x30cm"` | ✓ tomettes vs natural ground |
| bohemian (garden) | `"reclaimed irregular sandstone pavers 20-40cm"` | ✓ pavés vs natural ground |
| provencal_outdoor | `"terracotta floor tiles with irregular edges"` | ✓ tomettes vs natural ground |
| industrial_urban_outdoor | `"smooth grey concrete floor"` | ✓ béton vs natural ground |
| minimalist_urban_outdoor | `"brushed light grey concrete floor 90x90cm"` | ✓ béton vs natural ground |
| rooftop_outdoor | `"IPE hardwood deck planks 140mm wide silver-grey"` | ✓ deck bois vs natural ground |
| cosy_outdoor | `"warm honey-toned wood composite deck planks 120mm wide"` | ✓ deck composite vs natural ground |

**Impact** : toute combinaison `(style outdoor, jardin)` produit un prompt contradictoire. Cas d'usage légitime mais non-central → **P1**.

**Note positive** : le subtype `jardin` a une `subtypeNegativeOverride` qui dit `"paved floor, concrete, wooden deck (unless already present)"`. Cette négative est passée à Flux, mais Flux n'est **plus utilisé** depuis v57 (`openai.responses.create` uniquement). Donc la négative outdoor est aussi **code mort**.

**Fix v61 (P1)** :
1. Dans `applyOutdoorSubtypeOverrides()`, si `subtypeId === "jardin"`, **remplacer** la clause sol du `surfacePrompt` au lieu de concaténer. Extraction regex similaire au pattern kitchen (réutiliser le helper `stripHardFloorFromSurface` créé en v61 pour indoor).
2. Supprimer la `subtypeNegativeOverride` (code mort) OU la ré-injecter dans le prompt GPT-image-1.5 comme négation textuelle.

---

## Finding A2 — furniturePrompt bois en kitchen/bathroom · FERMÉ (v55 OK)

**Fichier** : `lib/generation-pipeline.ts:993-998`

```ts
const rt = roomType ? ROOM_TYPES[roomType] : null;
if (rt?.roomFurnitureOverride) {
  trimmedFurniture = `${rt.roomFurnitureOverride} ${getStyleMaterialHint(styleId)}`;
} else {
  trimmedFurniture = effectiveFurniturePrompt;
}
```

**Mécanisme** : pour tout roomType ayant un `roomFurnitureOverride` non vide (kitchen, bathroom, wc, bedroom_*, laundry, cellar, entryway, dining_room, office), le furniturePrompt du style est **ignoré** et remplacé par `roomFurnitureOverride + getStyleMaterialHint()`.

`getStyleMaterialHint()` (lib/room-types.ts:229-234) retourne uniquement :
```
"Design style: {style}. Materials and palette: {hint}"
```
où le `hint` est la palette de matériaux (ex bohemian : "Natural rattan and wicker, kilim and mudcloth textiles in terracotta rust and indigo, reclaimed wood, sheepskin, jute, aged brass Moroccan accents").

**Preuve dans le log #245** : `furniture_prompt` loggé contient l'override kitchen complet + "Design style: bohemian. Materials and palette: Natural rattan and wicker..." — AUCUN sofa 220cm, AUCUNE coffee table 90cm, AUCUN rug 200x300cm du furniturePrompt bohemian du style. Le living room bohemian n'est **PAS** injecté.

**Verdict** : la piste @ia est refermée, **v55 a corrigé** le bug de concaténation living room dans kitchen/bathroom. La palette matériaux seule (incluant "reclaimed wood", "sheepskin") ne suffit pas à faire halluciner un canapé 220cm.

---

## Finding A3 — Clause "dining zone" dans kitchen override · P0 · NOUVEAU

**Fichier** : `lib/room-types.ts:108-109` (kitchen roomFurnitureOverride)

**Citation exacte** :
> `"If — and only if — the input clearly shows a dedicated dining zone within the kitchen (open floor area away from work zones) with no table visible, add a small dining table 100cm wide with 4 chairs matching the style."`

**Bug** : la condition repose sur 2 signaux visuels :
1. `"dedicated dining zone within the kitchen"` = zone dédiée aux repas
2. `"open floor area away from work zones"` = zone de sol libre loin des zones de travail

**Problème sur chantier brut** (exactement #244/#245) :
- Input = chantier brut BA13, AUCUNE cuisine installée → **aucune "work zone" visible**.
- Le modèle interprète TOUTE la pièce comme "open floor area away from work zones".
- La condition devient **automatiquement vraie** → il ajoute table 100cm + 4 chaises.
- **C'est exactement ce qu'on observe sur gen-245-output.jpg** : table ronde bois + 4 chaises bohemian dominant la pièce, mini-kitchenette vestigiale sous la fenêtre.

**Cause racine de la "dining room bohemian dans cuisine"** : cette clause conditionnelle. Pas une hallucination, une obéissance littérale au prompt.

**Preuve supplémentaire** : les clauses conditionnelles similaires dans l'override disent `"If — and only if — the input clearly shows a visible island or peninsula with no stools in front of it"` ou `"If — and only if — the input shows a visible island or peninsula with no pendant light above it"`. Elles exigent toutes un élément CONCRET à détecter (island, peninsula, pendant). La clause "dining zone" ne précise PAS d'élément concret — elle se contente d'une notion spatiale ambiguë.

**Fix v61 (P0)** :

**Option A (recommandée — suppression)** :
Supprimer totalement la clause dining zone du kitchen override. Un user qui veut visualiser une cuisine + salle à manger utilisera le custom prompt ou un futur roomType dédié `kitchen_with_dining`.

```diff
- If — and only if — the input clearly shows a dedicated dining zone within the kitchen (open floor area away from work zones) with no table visible, add a small dining table 100cm wide with 4 chairs matching the style.
+ // (clause supprimée — kitchen ne gère plus le mobilier dining, utiliser kitchen_with_dining ou custom)
```

**Option B (garde conditionnelle plus stricte)** :
Conditionner à la détection positive d'éléments cuisine (contrainte AND) :
```
"If — and only if — the input clearly shows BOTH (a) visible installed kitchen cabinetry covering at least one wall AND (b) a dedicated dining zone at least 2m away from the work zone with no table visible, add a small dining table..."
```

**Recommandation** : Option A pour v61 (plus simple, plus sûr, couvre le cas d'usage marchand de biens). Option B pour v62+ si le besoin de cuisine ouverte se confirme.

**Autres clauses fragiles à auditer dans le même override** :
- `"If — and only if — the input clearly shows a visible island or peninsula with no stools in front of it"` → sur chantier brut, aucun island → condition fausse → pas de stools → OK, pas de bug
- `"If — and only if — the input shows a visible island or peninsula with no pendant light above it"` → idem, condition fausse → OK
→ Seule la clause dining zone a ce pattern dangereux (absence d'élément cuisine concret).

---

## Priorisation v61 actualisée (10 fixes)

| # | Fix | Fichier | Effort | Prio | Source |
|---|---|---|---|---|---|
| 1 | Regex `kitchenSurface` robuste | `lib/generation-pipeline.ts:296` | 1 ligne | **P0** | audit principal |
| 2 | Helper `stripHardFloorFromSurface` + appel dans 4 builders indoor (kitchen, bathroom, wc, laundry) | `lib/generation-pipeline.ts` | ~30 lignes | **P0** | Finding #7 |
| 3 | Padding server-side + crop retour (ratio preservation) | `lib/generation-pipeline.ts` | ~30 lignes | **P0** | audit principal |
| 4 | furniturePrompt **kitchen** conditionnel chantier brut | `lib/room-types.ts` + heuristique | ~50 lignes | **P0** | audit principal |
| 5 | furniturePrompt **bathroom** conditionnel chantier brut | `lib/room-types.ts` | ~50 lignes | **P0** | Finding #5 |
| 6 | Gates anti-régression v61 (avant tous les fixes, TDD RED) | `tests/unit/prompt-regression-v61-gates.test.ts` | ~80 lignes | **P0** | @ia V9 |
| 7 | **Supprimer clause "dining zone" du kitchen override** | `lib/room-types.ts:108-109` | 2 lignes | **P0** | **Finding A3 NOUVEAU** |
| 8 | Contradiction sol outdoor `jardin` (extraction helper + appel) | `lib/outdoor-subtypes.ts` + `lib/generation-pipeline.ts` | ~20 lignes | P1 | Finding A1 |
| 9 | Supprimer `getApiSize` code mort | `lib/image-utils.ts:37` | 5 lignes | P2 | Finding #3 |
| 10 | Corriger commentaires "FALLBACK ONLY" trompeurs | `lib/room-types.ts:68-71, 93-96` | 2 éditions | P2 | Finding #6 |

**6 fixes P0** au total. **Finding A3 est un nouveau P0** parce que c'est la cause directe du bug cuisine signalé par Thomas — le supprimer fera disparaître la dining zone automatique sur chantier brut, **sans même avoir à toucher au reste du kitchen override**.

---

## Ordre d'implémentation TDD (validé @ia + enrichi A3)

1. **Fix #6** — Gates anti-régression RED (84 assertions sol + ratio + dining zone)
2. **Fix #7** — Supprimer clause dining zone kitchen (2 lignes — résout le bug visible de Thomas immédiatement)
3. **Fix #1** — Regex robuste (1 ligne)
4. **Fix #2** — Helper `stripHardFloorFromSurface` + propagation 4 builders
5. **Fix #3** — Padding server-side + crop retour
6. **Fix #4** — Kitchen chantier brut conditionnel
7. **Fix #5** — Bathroom chantier brut conditionnel
8. **Fix #8** — Outdoor jardin cleanup
9. **Fix #9** — Supprimer getApiSize
10. **Fix #10** — Corriger commentaires

**Insertion du Fix #7 en position 2** : c'est une suppression de 2 lignes, immédiate, qui résout visuellement le pire symptôme (dining zone envahissant). Même sans les autres fixes, #245 régénéré produirait au minimum une cuisine vestigiale sans dining zone — amélioration directement perceptible par Thomas dès la première régénération v61 partielle.

---

## Notes méthodo

- **Temps total Option A** : ~4 min, 6 reads + 3 greps, zéro Write autre que celui-ci, zéro agent.
- **Zéro invention** : chaque citation est tirée d'un fichier lu, chaque bug est démontrable via régénération ciblée.
- **Finding A3 est le plus haut ROI du round** : 2 lignes supprimées → résolution directe du symptôme visible. À implémenter en premier (après les gates RED).
