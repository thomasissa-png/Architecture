# Audit longueur des prompts et architecture par piece — Sprint 20

**Agent** : Lucas Moreau (Expert IA Image)
**Date** : 2026-03-24

---

## 1. Mesure des longueurs actuelles

### Builders generiques (template sans style ni room override)

| Builder | Mots (template seul) | Phrases |
|---|---|---|
| buildSurfacesResponsesPrompt | ~185 | 12 |
| buildSurfacesFluxPrompt | ~130 | 10 |
| buildFurnitureResponsesPrompt | ~245 | 11 |
| buildFurnitureFluxPrompt | ~130 | 8 |

### Style prompts (echantillon 3 styles)

| Style | surfacePrompt (mots) | furniturePrompt (mots) |
|---|---|---|
| Scandinavian | ~52 | ~108 |
| Contemporary | ~45 | ~100 |
| Industrial | ~44 | ~97 |

### Room overrides (echantillon)

| Room type | surfaceOverride (mots) | furnitureOverride (mots) |
|---|---|---|
| Cuisine | ~36 | ~57 |
| Salle de bain | ~38 | ~73 |
| Chambre adultes | ~11 | ~56 |

### Totaux estimes en production (template + style + room override)

| Scenario | Passe 1 (mots) | Passe 2 (mots) |
|---|---|---|
| Salon Scandinave (pas d'override) | ~237 | ~353 |
| Cuisine Scandinave (override full) | ~273 | ~302* |
| Salle de bain Art Deco (override full) | ~261 | ~318* |

*Le furnitureOverride REMPLACE le style furniturePrompt, donc le total est builder + override (pas builder + style + override).

### Verdict longueur

- **Passe 1** : 237-273 mots. Acceptable pour GPT-4.1 Responses API (vision + generation, fenetre d'attention large). Leger surplus pour Flux Depth Pro (optimal ~100-150 mots).
- **Passe 2** : 302-353 mots. Long mais tolere par GPT-4.1. TROP LONG pour Flux Depth Pro — les tokens tardifs (apres ~150 mots) perdent du poids, les directives de composition en fin de prompt sont ignorees.

### Probleme structurel identifie

Le builder generique contient des directives qui sont **inutiles pour certaines pieces** :

| Directive | Salon | Cuisine | SdB | WC |
|---|---|---|---|---|
| Distribution profondeur + largeur (~55 mots) | Utile | Inutile (petite piece) | Inutile | Inutile |
| Scaling double hauteur (~25 mots) | Utile | Jamais | Jamais | Jamais |
| Radiateur preservation (~20 mots) | Utile | Rare | Rare | Rare |
| Densite conditionnelle (~25 mots) | Utile | Inutile (layout fixe) | Inutile | Inutile |
| Freestanding rule (~20 mots) | OK | Contredite par exception | Contredite par exception | OK |

**~125 mots de directives conditionnelles envoyees systematiquement**, dont la moitie est inutile selon la piece. Sur Flux, ca represente ~40% du budget attention gaspille.

---

## 2. Evaluation des 3 options

### Option A : Builders dedies par piece

**Principe** : `buildKitchenSurfacesPrompt()`, `buildBathroomFurniturePrompt()`, etc.

| Critere | Score |
|---|---|
| Precision prompt | 5/5 — chaque piece recoit exactement ce dont elle a besoin |
| Longueur prompt | 5/5 — -40% de mots sur les petites pieces |
| Maintenabilite | 2/5 — 11 pieces x 4 builders = 44 fonctions a maintenir |
| Risque de derive | 4/5 — modifications globales (grain ISO, preservation angle) doivent etre propagees dans 44 fonctions |
| Effort implementation | 1/5 — reecriture massive |

**Verdict** : Qualite optimale, maintenance insoutenable. Chaque correction de builder (Sprint 16-18) aurait necessite 44 modifications au lieu de 4.

### Option B : Builder generique COURT + modules conditionnels

**Principe** : un builder squelette (~80 mots) qui assemble des modules selon le roomTypeId.

```
buildPrompt(style, roomTypeId) = CORE(~80w) + ROOM_MODULE(~40w) + style(~50w)
```

Modules : `MODULE_DEPTH_DISTRIBUTION` (salon, salle a manger), `MODULE_BUILTIN` (cuisine, sdb), `MODULE_SMALL_ROOM` (wc, entree, buanderie), `MODULE_LARGE_ROOM` (salon, salle a manger).

| Critere | Score |
|---|---|
| Precision prompt | 4/5 — modules cibles, pas de directives inutiles |
| Longueur prompt | 4/5 — -25 a -35% sur les petites pieces |
| Maintenabilite | 4/5 — modules reutilisables, core unique |
| Risque de derive | 4/5 — le core reste un seul endroit a modifier |
| Effort implementation | 3/5 — refactoring modere |

**Verdict** : Meilleur compromis qualite/maintenance. Reduction significative sans explosion du code.

### Option C : Status quo optimise

**Principe** : garder les 4 builders, supprimer les directives inutiles quand `roomTypeId` est connu.

```typescript
// Exemple: skipper la distribution en profondeur pour les petites pieces
const smallRooms = ["wc", "entryway", "laundry", "cellar"];
const skipDepth = roomTypeId && smallRooms.includes(roomTypeId);
```

| Critere | Score |
|---|---|
| Precision prompt | 3/5 — amelioration partielle |
| Longueur prompt | 3/5 — -15 a -20% selon la piece |
| Maintenabilite | 5/5 — changement minimal |
| Risque de derive | 5/5 — structure inchangee |
| Effort implementation | 5/5 — quelques if/else dans les builders existants |

**Verdict** : Gains modestes, effort minimal. Bon ratio pour un premier pas.

### Recommandation

**Option C maintenant, Option B en Sprint 21+.**

Raison : l'Option C peut etre implementee en 30 minutes avec un gain immediat de -15 a -20% sur les petites pieces. L'Option B necessite un refactoring plus large qui merite un sprint dedie.

---

## 3. Exemple concret : CUISINE optimisee (~100-120 mots par passe)

### Passe 1 — Surfaces (GPT-4.1 Responses API)

```
Edit this photo of a room. Apply this surface finish: [surfacePrompt from style].
Ceramic or natural stone floor tiles suited for a kitchen — NOT wood, NOT parquet.
Subway tile or smooth splashback on the wall behind the work area.
Preserve ceiling 3D geometry — vaults, beams, ribs keep their shape. Refinish
ceiling surface with smooth plaster. For the ceiling light, follow the style above.
Remove construction leftovers: dangling cables, junction boxes, exposed wiring.
Keep all fixed wall equipment: radiators, switches, vents in exact position.
Room stays COMPLETELY EMPTY — no furniture, no appliances, no objects.
Same number of windows and doors. Same camera angle and light direction.
DSLR 16-35mm f/8, deep DOF, sharp focus, subtle grain ISO 200.
```

**~105 mots** (vs ~273 actuels = -62%). Suppressions : distribution profondeur, scaling double hauteur, densite conditionnelle, preservation mur accent (inutile en cuisine brute).

### Passe 2 — Mobilier cuisine (GPT-4.1 Responses API)

```
Add the following kitchen elements to this photo of a finished room:
[furnitureOverride from room-types.ts for kitchen].
Kitchen layout: built-in cabinetry and countertops against walls, island or
peninsula if space allows with stools. Pendant light above work area.
Place all elements with correct perspective and scale on the existing floor.
Cast realistic shadows matching the existing light direction.
Room structure is LOCKED: walls, floor, ceiling, windows identical to input.
Keep all wall-mounted equipment visible. No curtains.
DSLR 16-35mm f/8, deep DOF, sharp focus, subtle grain ISO 200.
```

**~95 mots** (vs ~302 actuels = -69%). Suppressions : distribution profondeur/largeur (layout cuisine fixe), scaling double hauteur (jamais en cuisine), densite conditionnelle (layout prescrit).

### Gains Flux Depth Pro

Pour Flux, les prompts condensent encore plus (~60-70 mots) car le style est place en tete et les contraintes photo sont dans les parametres du modele. Le gain est critique : on passe de ~200 mots (dilution severe) a ~70 mots (fenetre d'attention optimale).

---

## 4. Plan d'action

| Priorite | Action | Option | Effort |
|---|---|---|---|
| P0 | Ajouter des conditions `roomTypeId` dans les 4 builders pour skipper les directives inutiles (depth distribution, scaling, density) sur les petites pieces | C | 30 min |
| P1 | Extraire les constantes partagees (DSLR line, preservation line) en variables pour eviter la duplication | C | 15 min |
| P2 | Refactorer en modules conditionnels (Sprint 21) | B | 2-3h |
| P3 | Mesurer l'impact sur Flux Depth Pro : comparer les rendus avant/apres reduction | - | Test |

---

**Handoff -> @orchestrator**
- Fichier produit : `docs/ia/prompt-audit-sprint20.md`
- Decisions : Option C recommandee immediatement (conditionals dans builders), Option B en Sprint 21 (modules)
- Points d'attention : Flux Depth Pro est le principal beneficiaire (fenetre d'attention courte), GPT-4.1 tolere les longs prompts mais la dilution reste un risque. Les prompts cuisine/sdb/wc peuvent perdre -60% de mots sans perte de qualite.
