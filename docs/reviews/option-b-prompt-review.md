# Revue croisee — Refactoring Option B des prompts — 2026-03-24

## Resume executif

Le refactoring Option B remplace les 4 builders generiques par des branches dediees par type de piece dans `route.ts`. L'implementation est solide : 8 types de pieces couverts avec branches dediees dans les 4 builders (surfaces Responses/Flux + furniture Responses/Flux), fallback generique pour salon/bureau/null, et un mecanisme intelligent de bypass des overrides de `room-types.ts` pour les surfaces des pieces a builder dedie. Les corrections P0-P2 de l'audit cuisine/SDB sont integrees. Deux problemes notables : le `dining_room` est dans la liste des builders dedies pour les surfaces alors qu'il tombe dans le fallback generique (pas de branche dediee surface), et les builders d'iteration (F1) n'ont qu'un traitement minimal du roomType (kitchen/bathroom seulement).

## Verdict : VALIDE AVEC RESERVES

Pas de blocage critique. Les reserves portent sur des incoherences mineures et un risque d'iteration degrade pour certains types de pieces.

---

## A. Completude — chaque type de piece couvert ?

- [x] **kitchen** : 4 branches dediees (surfaces Responses L80, surfaces Flux L191, furniture Responses L293, furniture Flux L416). Complet.
- [x] **bathroom** : 4 branches dediees (surfaces Responses L94, surfaces Flux L203, furniture Responses L306, furniture Flux L429). Complet.
- [x] **wc** : 4 branches dediees (surfaces Responses L107, surfaces Flux L214, furniture Responses L319, furniture Flux L442). Complet.
- [x] **bedroom** (adults + children) : 4 branches dediees (surfaces Responses L120, surfaces Flux L225, furniture Responses L332, furniture Flux L454). Complet.
- [x] **laundry** : 4 branches dediees (surfaces Responses L134, surfaces Flux L237, furniture Responses L357, furniture Flux L478). Complet.
- [x] **cellar** : 4 branches dediees (surfaces Responses L147, surfaces Flux L248, furniture Responses L370, furniture Flux L490). Complet.
- [x] **entryway** : 4 branches dediees (surfaces Responses L159, surfaces Flux L259, furniture Responses L345, furniture Flux L466). Complet.
- [x] **dining_room** : 2 branches furniture dediees (Responses L382, Flux L502). Surfaces = fallback generique. Voir H-02 ci-dessous.
- [x] **office** : couvert par le fallback generique (pas de surface/furniture override dans room-types.ts sauf furnitureOverride). Coherent.
- [x] **living_room** : couvert par le fallback generique (overrides vides dans room-types.ts). Coherent.
- [x] **Fallback generique** : present pour les 4 builders. Couvre living_room, office, dining_room (surfaces), null.

## B. Corrections P0-P2 integrees ?

- [x] **P0-1 (SDB douche walk-in)** : Le builder furniture bathroom (L306-315) dit "Wall-mounted vanity and mirror expected. Other items (stool, basket, plant) freestanding." MAIS la douche walk-in n'est PAS dans le builder dedie. C'est le `furniturePrompt` de `room-types.ts` (roomFurnitureOverride) qui est injecte via `${furniturePrompt}`. La correction P0-1 devait etre appliquee dans `room-types.ts`, pas dans le builder. **VERIFIE** : le roomFurnitureOverride de bathroom dans room-types.ts (L71) contient bien "frameless glass walk-in shower enclosure with chrome rain showerhead" — la correction P0-1 est dans room-types.ts et est injectee via le parametre furniturePrompt. OK.
- [x] **P0-2 (Cables chantier)** : Present dans les builders surfaces dedies pour kitchen (L86 "Remove construction leftovers: dangling cables, junction boxes, exposed wiring"), bathroom (L99), wc (L113 "Remove construction leftovers"), bedroom (L128), laundry (L139), cellar (L152), entryway (L166), ET dans le fallback generique (L180 version complete). OK.
- [x] **P1-3 (SDB carrelage mural)** : Builder surfaces bathroom (L97) "Floor-to-ceiling ceramic tiles in shower zone and behind vanity area. Water-resistant floor — ceramic or stone tiles, matte non-slip. No wood flooring." OK.
- [x] **P1-4 (Cuisine negative armchairs/floor lamps)** : Builder furniture kitchen (L300) "No curtains." mais PAS de negative explicite armchairs/floor lamps dans le builder OpenAI. C'est dans le roomNegativeOverride (room-types.ts L86) qui est passe a Flux via `additionalNegative`. Pour OpenAI (pas de negative prompt natif), le roomFurnitureOverride de kitchen contient "No armchairs, no lounge chairs, no floor lamps" (L84). **Couvert via le contenu injecte dans furniturePrompt, pas via le builder lui-meme.** OK mais fragile.
- [x] **P1-5 (Cuisine sol ceramique)** : Builder surfaces kitchen (L83) "Ceramic or natural stone floor tiles — NOT wood, NOT parquet." OK.
- [x] **P2-6 (Joints placo)** : La constante CEILING_PRESERVATION (L73) contient "Refinish ceiling surface: smooth plaster over raw concrete, formwork marks, seams." Utilisee dans kitchen, bathroom, wc, bedroom, entryway. Laundry et cellar ont une version condensee sans la mention explicite "seams". Le fallback a une version complete (L274). **PARTIEL** — laundry et cellar manquent le detail "seams/formwork marks" mais c'est acceptable pour ces pieces utilitaires.
- [x] **P2-7 (SDB negative enrichi)** : roomNegativeOverride de bathroom dans room-types.ts (L73) contient la liste enrichie. OK.
- [x] **Fix plafond (geometrie vs texture)** : CEILING_PRESERVATION (L73) dit "Preserve ceiling 3D geometry — vaults, beams, ribs keep shape." Correct separation geometrie/finition. OK.

## C. Risques de regression

- [x] **roomTypeId transmis correctement** : `tryOpenAIResponses` recoit `roomTypeId` (L612, appele L901) et le passe a `buildSurfacesResponsesPrompt(surfacePrompt, roomTypeId)` (L626) et `buildFurnitureResponsesPrompt(furniturePrompt, roomTypeId)` (L627). `tryFluxDepth` idem (L685, appele L910). `generatePass` passe `roomTypeId` (L893). Le flow standard passe `roomType` (L1178, L1243). OK.
- [x] **Builders outdoor non affectes** : Les builders outdoor sont dans des fonctions separees (buildOutdoorSurfacesResponsesPrompt, etc.) et ne sont jamais atteints par les branches roomTypeId. Le `outdoor?.isOutdoor` check (L618, L693) court-circuite vers les builders outdoor avant tout check de roomTypeId. OK.
- [x] **Mode iteration (F1 refine)** : Le roomType est stocke dans Pass1Meta (L1205 `roomType: isOutdoor ? null : (roomType ?? null)`) et recupere dans le cache (L1035 `roomType: cached.meta.roomType`). Les builders d'iteration recoivent `meta.roomType` (L1053-1061). Le traitement est minimal (L34-36) : seuls kitchen et bathroom recoivent la directive built-in, tous les autres ont "freestanding only". **Voir H-01 ci-dessous.**
- [x] **applyRoomTypeOverrides bypass** : ROOMS_WITH_DEDICATED_BUILDERS (L1162) liste correctement les 9 types. Pour ces pieces, `trimmedSurface = surfacePrompt.trim()` (L1170) — le surfaceOverride de room-types.ts est ignore car le builder dedie le contient deja. Pour les autres (living_room, office, null), `trimmedSurface = effectiveSurfacePrompt` (L1170) — le surfaceOverride est concatene. **Correct SAUF pour dining_room** — voir H-02.
- [x] **Constantes partagees** : STRUCTURE_LOCKED (L287), EQUIPMENT_PRESERVATION (L288), CAMERA_AND_PHOTO (L289) contiennent les directives critiques (surfaces locked, radiateurs, camera/photo). OK.
- [ ] **Negative prompt Flux adapte par piece** : Le FLUX_NEGATIVE_PROMPT (L526-527) est global et identique pour toutes les pieces. Il n'y a PAS de negative prompt Flux dedie par piece dans les builders. Le `additionalNegative` (roomNegativeOverride de room-types.ts) est concatene au FLUX_NEGATIVE_PROMPT dans `tryFluxDepth` (L717). **C'est correct** — la specialisation vient du roomNegativeOverride, pas du builder.

## D. Qualite des prompts dedies

- [x] **Plus courts que l'ancien generique + override** : Le builder surfaces kitchen dedie fait ~100 mots vs ~273 estimes (ancien generique + override). Le builder furniture kitchen fait ~95 mots vs ~302. Reduction de -60 a -70%. OK.
- [x] **Style en premier dans Flux** : Les prompts Flux dediees commencent par `${surfacePrompt}` ou `${furniturePrompt}` comme premier token. Exemples : kitchen Flux surface (L193) `${surfacePrompt}, finished empty kitchen interior.`, kitchen Flux furniture (L418) `${furniturePrompt}, placed in this finished kitchen interior.` OK.
- [x] **Directives camera/photo presentes** : DSLR_LINE dans tous les surfaces (L72, utilisee directement ou condensee). CAMERA_AND_PHOTO / FLUX_PHOTO dans tous les furniture. OK.
- [x] **Pas de redondance builder/style** : Les builders ne repetent pas le contenu des surfacePrompts/furniturePrompts — ils injectent `${surfacePrompt}` et `${furniturePrompt}` comme variables. Les directives specifiques (ceramique en cuisine, carrelage en SDB) COMPLETENT le style, elles ne le repetent pas. OK.

## E. Code quality

- [x] **Pas de branches mortes** : Toutes les branches if/else sont atteignables via les roomTypeId de room-types.ts.
- [ ] **Noms de roomTypeId** : Les branches utilisent "kitchen", "bathroom", "wc", "bedroom_adults", "bedroom_children", "entryway", "laundry", "cellar", "dining_room". Tous matchent exactement les cles de ROOM_TYPES dans room-types.ts (L26-163). **OK.**
- [x] **Pas de regression outdoor** : Les builders outdoor sont intacts et isoles. OK.

---

## Problemes trouves

### H-01 — HAUTE : Iteration (F1) degradee pour 5 types de pieces

**Constat** : Les builders d'iteration dans `lib/iteration-prompt.ts` (L34-36) ne gerent que 2 cas :
- `kitchen` / `bathroom` → "Built-in cabinetry, vanity units, and countertops expected."
- Tous les autres → "ONLY add freestanding objects."

Mais `wc` et `laundry` ont aussi des fixtures non-freestanding (toilette murale, machine a laver). Une iteration sur un WC avec la directive "ONLY freestanding objects" pourrait produire un resultat incoherent si l'utilisateur demande un changement de toilette.

De plus, les builders d'iteration utilisent encore les directives de distribution en profondeur/largeur (L30) pour TOUTES les pieces, y compris les petites (wc, entree, buanderie) — exactement le probleme que le refactoring Option B resolvait dans les builders standard.

**Resolution proposee** : Aligner les builders d'iteration sur la meme logique que les builders standard : ajouter `wc` et `laundry` dans la condition built-in, et conditionner la distribution en profondeur au roomType. Agent responsable : @fullstack ou @ia.

### H-02 — HAUTE : dining_room dans ROOMS_WITH_DEDICATED_BUILDERS mais pas de surface builder dedie

**Constat** : `dining_room` est dans la liste `ROOMS_WITH_DEDICATED_BUILDERS` (L1162), ce qui fait que son `roomSurfaceOverride` est ignore (L1170 : `trimmedSurface = surfacePrompt.trim()`). Or, `dining_room` n'a PAS de branche dediee dans `buildSurfacesResponsesPrompt` — il tombe dans le fallback generique.

C'est actuellement sans impact car `dining_room.roomSurfaceOverride` est vide dans room-types.ts (L119 : `roomSurfaceOverride: ""`). Donc ignorer l'override ou le concatener donne le meme resultat.

MAIS c'est une bombe a retardement : si quelqu'un ajoute un `roomSurfaceOverride` au dining_room dans room-types.ts, il sera silencieusement ignore car le builder dedie n'existe pas et la concatenation est bypassee.

**Resolution proposee** : Soit retirer `dining_room` de ROOMS_WITH_DEDICATED_BUILDERS (puisqu'il n'a pas de builder surface dedie), soit ajouter un commentaire explicite. Agent responsable : @fullstack.

### M-01 — MOYENNE : Redondance entre room-types.ts et builders dedies

**Constat** : Les directives specifiques par piece sont maintenant a DEUX endroits :
1. Dans les branches dediees de `buildSurfacesResponsesPrompt` / `buildSurfacesFluxPrompt` (route.ts)
2. Dans les `roomSurfaceOverride` de chaque piece (room-types.ts)

Pour les pieces a builder dedie, le `roomSurfaceOverride` est ignore (grace au bypass L1170). Mais le contenu est encore dans room-types.ts et peut induire en erreur un developpeur qui croit le modifier.

**Resolution proposee** : Vider les `roomSurfaceOverride` des pieces a builder dedie dans room-types.ts et ajouter un commentaire "// Surface directives handled by dedicated builder in route.ts". Ou mieux : supprimer la propriete et mettre un commentaire. Agent responsable : @fullstack.

### M-02 — MOYENNE : Constante CEILING_PRESERVATION condensee pour laundry/cellar

**Constat** : Laundry (L139) et cellar (L152) n'utilisent PAS la constante CEILING_PRESERVATION — ils ont une version implicite plus courte ("Remove construction leftovers. Keep all fixed wall equipment...") sans mention explicite de la geometrie du plafond ni des joints placo.

C'est acceptable pour ces pieces utilitaires mais incoherent avec le reste du refactoring qui standardise les directives plafond via CEILING_PRESERVATION.

**Resolution proposee** : Ajouter CEILING_PRESERVATION dans les builders laundry et cellar pour coherence. Impact : +15 mots par prompt, negligeable. Agent responsable : @ia.

### I-01 — MINEURE : Negative prompt Flux non specialise par piece dans les builders

**Constat** : Le FLUX_NEGATIVE_PROMPT est global. La specialisation est faite via `additionalNegative` (roomNegativeOverride). C'est fonctionnel mais les prompts kitchen/bathroom pourraient beneficier de negative specifiques (ex: "parquet, herringbone wood" pour cuisine, "area rug, wooden side table" pour SDB) directement dans le builder Flux pour renforcer la directive.

**Resolution proposee** : Pas d'action immediate — le roomNegativeOverride couvre le besoin. A reconsiderer si des problemes persistent lors des tests de generation. Aucun agent requis.

---

## Decisions a confirmer

1. **dining_room dans ROOMS_WITH_DEDICATED_BUILDERS** : retirer ou laisser (avec commentaire) ? Impact faible mais source de confusion.
2. **Nettoyage de room-types.ts** : vider les roomSurfaceOverride des pieces a builder dedie pour eviter la duplication trompeuse ?

## Recommandation

**VALIDE AVEC RESERVES** — le refactoring peut etre merge et deploye. Les 2 reserves (H-01 et H-02) ne sont pas bloquantes :
- H-01 ne se manifeste que lors d'iterations F1 sur wc/laundry, un cas d'usage rare en alpha.
- H-02 ne se manifeste que si quelqu'un modifie un champ actuellement vide.

Les corrections sont applicables en post-merge sans regression.

---

**Handoff -> @orchestrator**
- Fichiers produits : `/home/user/Architecture/docs/reviews/option-b-prompt-review.md`
- Decisions prises : VALIDE AVEC RESERVES (GO avec 2 reserves non-bloquantes)
- Points d'attention :
  - H-01 : aligner les builders d'iteration (iteration-prompt.ts) sur la meme logique par piece que les builders standard — @fullstack ou @ia
  - H-02 : retirer dining_room de ROOMS_WITH_DEDICATED_BUILDERS ou ajouter un commentaire — @fullstack
  - M-01 : nettoyer les roomSurfaceOverride redondants dans room-types.ts — @fullstack
  - M-02 : ajouter CEILING_PRESERVATION dans laundry/cellar — @ia
