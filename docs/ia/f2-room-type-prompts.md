# F2 Room Type Prompts — Recommandations consolidees (Yann Duval + Lucas Moreau)

> Date : 2026-03-24
> Sources : Audit croise agent Architecte d'Interieur (Yann Duval) + agent Expert IA Image (Lucas Moreau)
> Destinataire : @fullstack pour implementation
> Reference specs : docs/product/functional-specs.md section F2

---

## Principe general

Le type de piece est un **enrichissement additif** : il ajoute des blocs de prompt aux surfacePrompt et furniturePrompt existants du style. Il ne remplace RIEN. Les overrides sont concatenes APRES le prompt de style, pour que le style reste l'ancre.

### Structure du prompt avec room type

```
PASS 1 = surfacePrompt (style) + roomSurfaceOverride (type de piece)
PASS 2 = furniturePrompt (style) + roomFurnitureOverride (type de piece) + roomNegativeOverride (type de piece)
```

### Regles d'injection (Lucas Moreau — technique)

1. Le roomSurfaceOverride est concatene a la FIN du surfacePrompt du style, separe par ". Additionally for this [room_type]: "
2. Le roomFurnitureOverride REMPLACE le furniturePrompt du style quand il existe (pas de concatenation). Raison : les meubles d'un salon n'ont rien a voir avec ceux d'une salle de bain. Concatener les deux donnerait un canape + une baignoire.
3. Exception : si roomFurnitureOverride est absent ou vide (cas "Salon" qui est le defaut), le furniturePrompt du style est utilise tel quel.
4. Le roomNegativeOverride est ajoute au negative prompt Flux existant (concatenation simple avec virgule).
5. Le roomType est passe dans le body JSON de /api/generate. Si null, aucun override.

### Regles de redaction des overrides (Yann Duval — stylistique)

1. **Ne JAMAIS repeter** ce qui est deja dans le surfacePrompt du style (couleur murs, luminaire plafond). L'override ne traite que les specificites de la piece.
2. **Nommer des materiaux concrets** : "white ceramic subway tiles" pas "carrelage mur".
3. **Donner des dimensions** : "80cm vanity unit", "160cm double bed" pour ancrer l'echelle.
4. **Limiter les hero pieces** : 1-2 par type de piece (lit + table de nuit en chambre, vasque + miroir en salle de bain).
5. **Garder les overrides courts** : ~30-50 mots pour surface, ~60-80 mots pour furniture. Les modeles ignorent les tokens tardifs.
6. **Utiliser un vocabulaire style-neutre** dans les overrides : pas de "warm oak" (c'est scandinave) ni de "brass" (c'est art deco). Le style s'en charge.

---

## Room Types — 8 types

### 1. Salon (living_room) — Type par defaut

- **roomSurfaceOverride** : `` (vide — aucun override, le salon est le cas nominal des styles)
- **roomFurnitureOverride** : `` (vide — le furniturePrompt du style est concu pour un salon)
- **roomNegativeOverride** : ``
- **Notes Yann** : Les 11 styles sont tous penses pour un salon. Aucun ajustement necessaire. Le type "Salon" ne sert qu'a confirmer explicitement au modele que c'est un salon (utile si auto-detection).

### 2. Chambre (bedroom)

- **roomSurfaceOverride** : `"Additionally for this bedroom: warm-toned flooring suitable for bare feet, soft ambient lighting from the ceiling fixture."`
- **roomFurnitureOverride** : `"Bedroom furniture: upholstered double bed 160cm wide with padded headboard and fitted bedlinen in neutral tones, two matching bedside tables 45cm wide with table lamps, a soft area rug 160x230cm beside the bed, a bench or ottoman at the foot of the bed, a tall wardrobe or dresser as background anchor. One accent chair or reading nook if space allows. Intentional calm — no clutter, no work-related objects."`
- **roomNegativeOverride** : `"sofa, coffee table, TV unit, dining table, office desk"`
- **Notes Yann** : Le lit est le hero piece absolu. La tete de lit ancre le style (capitonnee pour Art Deco, bois clair pour Scandinave). Les lampes de chevet et le linge de lit sont les differenciateurs de style — mais le roomFurnitureOverride est style-neutre. Le style enrichit via son propre furniturePrompt s'il est concatene.
- **Notes Lucas** : Le negative prompt empeche l'hallucination de canape/bureau qui arrive frequemment quand le modele ne comprend pas que c'est une chambre. Les dimensions du lit (160cm) ancrent l'echelle pour tout le reste.

### 3. Salle de bain (bathroom)

- **roomSurfaceOverride** : `"Additionally for this bathroom: waterproof wall finish — ceramic wall tiles on the wet zone behind the vanity area. Water-resistant floor — ceramic or stone floor tiles with matte non-slip finish."`
- **roomFurnitureOverride** : `"Bathroom fixtures and accessories: wall-mounted vanity unit 80cm wide with integrated basin and framed mirror above, fluffy folded towels in neutral tones on open shelving or towel ladder, a small stool or side table with soap dispenser and candle, potted humidity-loving plant (fern or pothos) in ceramic pot, woven basket for storage on the floor. No freestanding bathtub unless room is large (>8sqm). Clean and spa-like atmosphere."`
- **roomNegativeOverride** : `"sofa, coffee table, TV unit, dining table, bed, wardrobe, office desk, floor lamp"`
- **Notes Yann** : La salle de bain est le type le plus critique. Le modele a tendance a ajouter des meubles de salon si on ne lui dit pas explicitement que c'est une salle de bain. Le vanity + miroir sont les 2 elements minimum absolus. L'ambiance "spa" guide le modele vers la serenite.
- **Notes Lucas** : Le surfaceOverride pour les tiles est essentiel — sans ca, le modele applique du parquet au sol de la salle de bain (catastrophe realiste). Le negative prompt est le plus long car c'est le type ou les hallucinations sont les plus probables.

### 4. Cuisine (kitchen)

- **roomSurfaceOverride** : `"Additionally for this kitchen: ceramic or natural stone floor tiles suited for a kitchen. Subway tile or smooth splashback on the wall behind the work area."`
- **roomFurnitureOverride** : `"Kitchen furnishing: countertop work surface 60cm deep with integrated sink, upper and lower cabinetry in neutral finish, built-in oven and cooktop, two or three bar stools at an island or peninsula if space allows, pendant light above the work area, cutting board and ceramic jar with utensils on the counter, small herb pots (basil, rosemary) on a shelf or windowsill, fruit bowl on the counter. Functional and organized layout."`
- **roomNegativeOverride** : `"sofa, coffee table, TV unit, bed, wardrobe, floor lamp, area rug"`
- **Notes Yann** : La cuisine est un cas special — elle contient des meubles encastres (plan de travail, caissons). Cela viole normalement la regle "freestanding only" du pipeline. Mais pour une cuisine, c'est indispensable — une cuisine sans plan de travail n'est pas une cuisine. Le system prompt de passe 2 doit etre adapte pour autoriser les built-ins UNIQUEMENT quand roomType=kitchen.
- **Notes Lucas** : ATTENTION — le builder de passe 2 standard dit "Do NOT attach anything to walls. No built-in shelving". Pour la cuisine, cette directive doit etre assouplie. Je recommande d'ajouter dans le builder une exception conditionnelle : "Exception: if room type is kitchen, built-in cabinetry and countertops are expected and should be placed realistically."
- **DECISION CLE** : Pour kitchen, le builder de passe 2 doit etre modifie pour autoriser les elements encastres. Cela necessite un changement dans route.ts, pas seulement dans les overrides.

### 5. Bureau (office)

- **roomSurfaceOverride** : `` (vide — le sol et les murs du style conviennent a un bureau)
- **roomFurnitureOverride** : `"Home office furniture: desk 140cm wide with clean lines, ergonomic desk chair with padded seat, desk lamp with adjustable arm, open bookshelf or storage unit as background anchor 160cm tall, small plant on the desk, organized desk accessories (pen holder, notebook, monitor or laptop), comfortable reading chair in a corner if space allows, area rug 160x230cm under the desk area. Productive but inviting atmosphere — not a corporate office."`
- **roomNegativeOverride** : `"sofa, coffee table, TV unit, bed, wardrobe, dining table"`
- **Notes Yann** : Le bureau est un hybride — il doit etre fonctionnel mais pas sterile. L'accent est sur le desk + chair comme hero pieces. La bibliotheque ancre l'arriere-plan. Le "not a corporate office" est crucial pour que le modele ne genere pas un open space.
- **Notes Lucas** : Pas de modifications specifiques au pipeline. Le bureau fonctionne avec les contraintes standard (freestanding only).

### 6. Entree (entryway)

- **roomSurfaceOverride** : `"Additionally for this entryway: durable floor finish suitable for an entrance — ceramic tiles, natural stone, or hard-wearing wood."`
- **roomFurnitureOverride** : `"Entryway furniture: console table 100cm wide against the available wall with a decorative object and small tray for keys, wall-leaning framed mirror (propped on the console, NOT hung), coat hooks or freestanding coat rack, small bench or ottoman for putting on shoes, area rug or runner 80x150cm, potted plant in ceramic planter, small table lamp on the console. Minimal and welcoming — do not overcrowd this small space."`
- **roomNegativeOverride** : `"sofa, coffee table, TV unit, bed, wardrobe, dining table, office desk"`
- **Notes Yann** : L'entree est souvent petite. Le "do not overcrowd" est essentiel. Le miroir appuye contre le mur (pas accroche) respecte la regle "no wall-mounted". La console + miroir sont les 2 hero pieces.
- **Notes Lucas** : Les entrees sont souvent etroites avec un eclairage limite. La directive de preservation de lumiere existante est particulierement importante ici — pas de brightening artificiel.

### 7. Salle a manger (dining_room)

- **roomSurfaceOverride** : `` (vide — sol et murs du style conviennent)
- **roomFurnitureOverride** : `"Dining room furniture: rectangular dining table 180cm long with matching set of 6 chairs, pendant light or chandelier centered above the table, table setting with ceramic plates and glassware for 4 place settings, linen table runner, sideboard or buffet 160cm wide as background anchor with decorative objects and candles, area rug 200x300cm under the table, potted plant or vase with fresh branches as centerpiece. Convivial and elegant atmosphere."`
- **roomNegativeOverride** : `"sofa, TV unit, bed, wardrobe, office desk"`
- **Notes Yann** : La table et les chaises sont LE sujet. Le dressage (assiettes, verres) ancre l'echelle et l'ambiance "habitee". Le buffet en arriere-plan fonctionne comme la credenza en Mid-Century — background anchor. Le lustre au-dessus de la table est le troisieme hero piece.
- **Notes Lucas** : Attention a la coherence des ombres — le lustre au-dessus de la table doit projeter des ombres sur la table. La directive de shadow matching du builder standard couvre ce cas.

### 8. Buanderie (laundry)

- **roomSurfaceOverride** : `"Additionally for this laundry room: waterproof and easy-to-clean floor — white or light grey ceramic tiles with matte finish. Walls in washable matte white paint."`
- **roomFurnitureOverride** : `"Laundry room equipment and storage: front-loading washing machine 60cm wide, tall narrow storage cabinet 40cm wide for cleaning supplies, wall-mounted or freestanding drying rack, woven laundry basket, small folding table or countertop above the washing machine if space allows, single overhead utility light. Functional and tidy — no decorative objects, no luxury items."`
- **roomNegativeOverride** : `"sofa, coffee table, TV unit, bed, wardrobe, dining table, office desk, chandelier, area rug, potted plant"`
- **Notes Yann** : La buanderie est le type le plus utilitaire. Le style a TRES PEU d'impact ici — une buanderie Japandi et une buanderie Art Deco sont quasi identiques. Le roomFurnitureOverride est presque autonome (ne depend pas du style).
- **Notes Lucas** : Buanderie sans fenetre = pas de lumiere naturelle. La directive "preserve existing lighting" est critique. Le negative prompt exclut meme les plantes et le tapis (incongrus en buanderie).

---

## Modifications necessaires dans route.ts (Lucas Moreau)

### 1. Exception built-in pour Kitchen

Le builder de passe 2 contient :
```
"ONLY add freestanding objects. Do NOT attach anything to walls. No built-in shelving."
```

Pour `roomType === "kitchen"`, cette directive doit etre remplacee par :
```
"Kitchen exception: built-in cabinetry, countertops, and integrated appliances are expected. Place them realistically against walls. Other items (stools, pendant light, accessories) should be freestanding."
```

### 2. Exception built-in pour Bathroom

Similairement, le vanity unit dans la salle de bain est semi-encastre. Ajouter :
```
"Bathroom exception: wall-mounted vanity unit and mirror are expected. Other items (stool, basket, plant) should be freestanding."
```

### 3. Concatenation des overrides

```typescript
// In route.ts, before calling the builder:
let effectiveSurfacePrompt = surfacePrompt;
let effectiveFurniturePrompt = furniturePrompt;
let additionalNegative = "";

if (roomType && ROOM_TYPES[roomType]) {
  const rt = ROOM_TYPES[roomType];
  if (rt.roomSurfaceOverride) {
    effectiveSurfacePrompt += `. ${rt.roomSurfaceOverride}`;
  }
  if (rt.roomFurnitureOverride) {
    // REPLACE, not concatenate (bedroom furniture != living room furniture)
    effectiveFurniturePrompt = rt.roomFurnitureOverride;
  }
  if (rt.roomNegativeOverride) {
    additionalNegative = rt.roomNegativeOverride;
  }
}
```

### 4. Concatenation du negative prompt

```typescript
const negativePrompt = additionalNegative
  ? `${FLUX_NEGATIVE_PROMPT}, ${additionalNegative}`
  : FLUX_NEGATIVE_PROMPT;
```

### 5. Interaction avec F1 (iterations)

Le roomType doit etre stocke dans le meta du cache passe 1 (`Pass1Meta`) pour que les iterations sur une chambre restent des iterations de chambre. Ajouter `roomType: string | null` a `Pass1Meta`.

Le builder d'iteration doit utiliser le roomFurnitureOverride au lieu du furniturePrompt standard quand roomType est present dans le meta.

---

## Interaction style x type de piece (Yann Duval)

### Combinaisons naturelles

| Type de piece | Styles les plus coherents | Styles a surveiller |
|---|---|---|
| Chambre | Scandinave, Cosy, Japandi, Wabi-Sabi | Industriel (trop froid), Maximaliste (trop charge) |
| Salle de bain | Japandi, Mediterraneen, Contemporain, Wabi-Sabi | Boheme (tissus + humidite = incoherent), Art Deco (excessif pour salle de bain) |
| Cuisine | Contemporain, Scandinave, Industriel, Mediterraneen | Wabi-Sabi (peu fonctionnel), Maximaliste (trop charge pour cuisine) |
| Bureau | Contemporain, Mid-Century, Scandinave, Japandi | Cosy (pas productif), Boheme (trop charge) |
| Entree | Contemporain, Scandinave, Haussmannien | Maximaliste (trop charge pour petit espace) |
| Salle a manger | Art Deco, Mediterraneen, Cosy, Haussmannien | Wabi-Sabi (trop depouillee), Industriel (pas convivial) |
| Buanderie | Tous equivalents | Le style a peu d'impact |

### REGLE : Aucune combinaison n'est bloquee

Conformement a la spec F2.3 et F2.4 ("Buanderie + style Art Deco : combinaison incongrue mais techniquement possible. Pas de blocage."), toutes les combinaisons sont permises. Le tableau ci-dessus est informatif, pas prescriptif.

---

## Auto-detection (US-F2-03) — Recommandations Lucas Moreau

L'auto-detection via GPT-4.1-mini est une feature background non bloquante. Recommandations techniques :

1. **Endpoint dedie** : `/api/detect-room-type` (POST) avec image en base64
2. **Modele** : GPT-4.1-mini avec vision (input_image + prompt court)
3. **Prompt** : `"What type of room is shown in this photo? Respond with exactly one word from this list: living_room, bedroom, bathroom, kitchen, office, entryway, dining_room, laundry, unknown. If unsure, respond unknown."`
4. **Latence cible** : <2s (GPT-4.1-mini vision est rapide)
5. **Fire-and-forget** : la detection tourne en background apres l'upload, sans bloquer le parcours
6. **Si reponse = "unknown"** : ne pas proposer de type, laisser le selecteur vide

---

## Fichiers a creer/modifier

1. **`lib/room-types.ts`** (NOUVEAU) : definition des 8 types avec roomSurfaceOverride, roomFurnitureOverride, roomNegativeOverride
2. **`components/RoomTypePicker.tsx`** (NOUVEAU) : selecteur UI dans l'etape 2
3. **`app/api/generate/route.ts`** (MODIFIER) : lire roomType du body, concatener les overrides, exception built-in pour kitchen/bathroom
4. **`app/page.tsx`** (MODIFIER) : etat roomType, envoi dans le body, integration du sélecteur
5. **`lib/db.ts`** (MODIFIER) : ajouter roomType a Pass1Meta et generation_logs
6. **`app/api/detect-room-type/route.ts`** (NOUVEAU, optionnel) : auto-detection background

---

**Handoff → @fullstack**
- Fichier produit : `docs/ia/f2-room-type-prompts.md` (ce fichier)
- Decisions cles : roomFurnitureOverride REMPLACE le furniturePrompt du style (sauf Salon). Exception built-in pour Kitchen et Bathroom. Auto-detection optionnelle via GPT-4.1-mini vision.
- Reference specs : `docs/product/functional-specs.md` section F2 (lignes 216-335)
- Apprentissages des 18 sprints a respecter : voir CLAUDE.md "Regles Prompts IA"
