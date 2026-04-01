# Audit visuel generations #91-93 (v36) -- Yann Duval, Architecte d'interieur

Date : 2026-04-01
Pipeline : v36, gpt-image-1, Responses API 2 passes
Generations auditees : #91 (Scandinavian kitchen), #92 (Contemporary kitchen), #93 (Scandinavian bedroom)

## LIMITATION : images non accessibles en local

Les images sont dans Replit Object Storage (non filesystem). L'audit visuel pixel-par-pixel n'a pas pu etre realise dans cette session faute d'outil de telechargement HTTP. L'analyse ci-dessous se base sur :
- Reconstruction exacte des prompts envoyes au modele (route.ts + StylePicker.tsx + room-types.ts)
- Historique des audits precedents (#31-42, notes 3.7-8.2)
- Connaissance des biais recurrents du modele gpt-image-1

**Action requise** : completer cet audit avec examen visuel des 9 images des que les outils le permettent.

---

## Analyse structurelle des prompts v36 par generation

### #91 -- Scandinavian Kitchen (1536x1024 landscape)

**Prompt passe 1 reconstruit** :
Le builder kitchen v36 applique :
- surfacePrompt Scandinave : "soft white walls keeping the same overall brightness as the input photo, wide-plank whitewashed ash flooring with visible natural grain..."
- MAIS le builder kitchen ECRASE le sol : "Ceramic or natural stone floor tiles -- NOT wood"
- roomSurfaceOverride confirme : "the floor MUST be ceramic tiles or natural stone -- NOT wood, NOT parquet"

**Contradiction detectee (P0)** : le surfacePrompt Scandinave prescrit "whitewashed ash flooring" mais le builder kitchen impose "ceramic or natural stone tiles". Le builder gagne (il est en fin de prompt, tokens tardifs), mais le modele recoit un signal contradictoire en debut de prompt. Cette contradiction est presente depuis la creation du builder kitchen mais n'a jamais ete auditee pour Scandinave specifiquement.

**Prompt passe 2 reconstruit** :
- roomFurnitureOverride kitchen (caissons, comptoir, ilot, tabourets) + "Use the following style for materials, textures, colors, and design references:" + furniturePrompt Scandinave (canape, table basse, tapis...)
- Le furniturePrompt Scandinave decrit un SALON (sofa, coffee table, rug, Wegner chair, AJ lamp, sheepskin throw) -- totalement incoherent avec une cuisine.

**Probleme majeur (P0)** : le furniturePrompt Scandinave est un prompt de SALON. Quand il est merge avec le roomFurnitureOverride kitchen, le modele recoit "caissons, comptoir, tabourets" + "canape 230cm, table basse, tapis 200x300cm". Le merge dit "Use the following style for materials, textures, colors" -- donc en theorie le modele devrait n'utiliser que les materiaux du style. Mais en pratique, le modele peut interpreter le canape et le tapis comme des elements a placer. Risque eleve de pollution salon dans la cuisine.

**Style material hint** (injecte via getStyleMaterialHint) : "Light birch and ash wood, oatmeal boucle fabric, whitewashed finishes, cream wool, matte black metal accents, muted blue and warm grey tones, minimal clean lines." -- Coherent pour une cuisine Scandinave.

**Risques identifies** :
1. Sol contradictoire (ash flooring vs ceramic tiles) -- le modele pourrait hesiter
2. Luminaire PH5-style du surfacePrompt vs "pendant light 30cm diameter above the work area" du kitchen override -- double directive
3. furniturePrompt salon merge avec kitchen override -- bruit de signal

---

### #92 -- Contemporary Kitchen (1536x1024 landscape)

**Prompt passe 1 reconstruit** :
- surfacePrompt Contemporain : "very light neutral grey walls, light grey engineered stone flooring with matte finish..."
- Builder kitchen : "Ceramic or natural stone floor tiles -- NOT wood"
- Ici, pas de contradiction : "engineered stone flooring" est compatible avec "natural stone floor tiles"

**Prompt passe 2 reconstruit** :
- roomFurnitureOverride kitchen + furniturePrompt Contemporain (L-shaped sectional sofa, smoked glass coffee table, snake plant, abstract canvas...)
- Meme probleme que #91 : le furniturePrompt decrit un SALON, pas une cuisine.

**Risques identifies** :
1. Le furniturePrompt salon Contemporain mentionne un "L-shaped sectional sofa 280cm" -- risque de pollution dans la cuisine
2. "Abstract canvas sitting on the floor leaning against the baseboard" -- inapproprie en cuisine
3. Moins de contradiction sol que Scandinave (grey stone compatible)

---

### #93 -- Scandinavian Bedroom Adults (1536x1024 landscape)

**Prompt passe 1 reconstruit** :
- surfacePrompt Scandinave + roomSurfaceOverride bedroom : "warm-toned flooring suitable for bare feet"
- Builder bedroom v36 : "Warm-toned flooring. Ceiling light per style description."
- Le surfacePrompt dit "whitewashed ash flooring" -- un bois clair, adapte pieds nus. Pas de contradiction.

**Prompt passe 2 reconstruit** :
- roomFurnitureOverride bedroom : "upholstered double bed 160cm, two bedside tables 45cm, table lamps, area rug 160x230cm, bench at foot, wardrobe/dresser, accent chair"
- Merge avec furniturePrompt Scandinave : "canape oatmeal boucle 230cm, table basse birch 120cm, Wegner chair, AJ lamp, sheepskin throw..."
- Le merge dit "Use the following style for materials, textures, colors" -- en theorie OK

**Risques identifies** :
1. Le furniturePrompt Scandinave mentionne un canape 230cm -- risque de placement dans la chambre malgre le roomNegativeOverride ("sofa, coffee table, TV unit, dining table, office desk")
2. L'AJ lamp du furniturePrompt est pertinente comme lampe de chevet
3. Le Wegner chair est pertinent comme accent chair de chambre
4. La sheepskin throw est pertinente pour une chambre Scandinave

**Verdict structurel** : la chambre Scandinave est la combinaison la plus coherente des 3. Le roomFurnitureOverride fournit le bon mobilier, les references de materiaux Scandinaves s'appliquent naturellement au mobilier de chambre.

---

## Problemes transversaux identifies (sans images)

### P0 -- furniturePrompts salon-centriques pour les room types non-salon

Les 12 furniturePrompts dans StylePicker.tsx decrivent TOUS un salon (sofa, coffee table, rug, side table). Quand ils sont merges avec un room type non-salon (kitchen, bedroom, bathroom), le signal est pollue. Le merge "Use the following style for materials, textures, colors, and design references:" est cense limiter l'utilisation aux materiaux, mais :
- Le modele voit "sofa 230cm" et peut le placer
- Le modele voit "coffee table 120cm" et peut l'interpreter comme un ilot
- Le negative prompt du room type ("sofa, coffee table") compense partiellement, mais c'est un pansement

**Recommandation** : creer des furniturePrompts par room type OU reformuler le merge pour etre plus explicite : "IGNORE all furniture items from the style description below. Use ONLY the materials and color palette:" au lieu de "Use the following style for materials, textures, colors, and design references:"

### P1 -- Contradiction sol Scandinave/kitchen

Le surfacePrompt Scandinave prescrit "whitewashed ash flooring" mais le builder kitchen impose "ceramic or natural stone tiles -- NOT wood". Le modele recoit les deux directives et doit arbitrer.

**Recommandation** : dans applyRoomTypeOverrides, quand roomTypeId = kitchen, remplacer toute mention de "wood/ash/oak flooring" dans le surfacePrompt par le type de sol prescrit par le builder kitchen. Ou mieux : creer des surfacePrompts par room type pour les 4-5 styles les plus demandes en cuisine.

### P2 -- Double directive luminaire kitchen

Le surfacePrompt Scandinave prescrit "matte white tiered pendant light PH5-style 45cm", et le kitchen roomFurnitureOverride prescrit "pendant light 30cm diameter above the work area". Deux luminaires differents. Le modele peut en generer deux, ou ignorer l'un des deux.

**Recommandation** : le roomFurnitureOverride kitchen ne devrait PAS prescrire de luminaire (c'est le surfacePrompt qui gere le plafond). Supprimer "pendant light 30cm diameter above the work area" du roomFurnitureOverride kitchen.

### P3 -- Pas de furniturePrompt Scandinave-cuisine specifique

Le Scandinave en cuisine devrait avoir : tabourets birch avec assise corde, plan de travail birch/marble blanc, poterie cream, herbes aromatiques en pot ceramique gres. Au lieu de ca, le modele recoit un merge ambigu salon + kitchen override.

---

## Score structurel previsionnel (a confirmer visuellement)

| # | Style + Room | Risque contradiction sol | Risque pollution salon | Risque luminaire | Score structurel estime |
|---|---|---|---|---|---|
| 91 | Scandinave kitchen | ELEVE (ash vs ceramic) | ELEVE (sofa 230cm dans merge) | MOYEN (double pendant) | 6.0-6.5 |
| 92 | Contemporain kitchen | BAS (grey stone compatible) | ELEVE (L-sectional 280cm dans merge) | MOYEN (double pendant) | 6.5-7.0 |
| 93 | Scandinave bedroom | BAS (ash compatible pieds nus) | MOYEN (sofa dans merge, mais negative prompt compense) | BAS (AJ lamp pertinent) | 7.5-8.0 |

---

## Plan d'action recommande

| Priorite | Action | Impact | Effort |
|---|---|---|---|
| P0 | Reformuler le merge furniturePrompt pour les room types non-salon : "IGNORE furniture items, use ONLY materials/palette" | Elimine la pollution canape/tapis en cuisine/chambre | Faible (1 ligne dans room-types.ts) |
| P1 | Supprimer la contradiction sol ash/ceramic pour kitchen Scandinave : override explicite du sol dans applyRoomTypeOverrides | Supprime le signal contradictoire | Moyen |
| P2 | Supprimer le luminaire du roomFurnitureOverride kitchen (le surfacePrompt le gere deja) | Elimine le double luminaire | Faible |
| P3 | Creer des furniturePrompts dedies par room type pour les 4 styles les plus demandes (Scandinave, Contemporain, Japandi, Cosy) en cuisine et chambre | Amelioration majeure de la coherence | Eleve |

---

## Prochaine etape

Cet audit doit etre COMPLETE avec l'examen visuel des 9 images (input, pass1, output) pour chaque generation. Les scores previsionnels ci-dessus sont bases sur l'analyse structurelle des prompts uniquement. L'examen visuel peut reveler :
- Des problemes que les prompts ne laissent pas presager (hallucinations, artefacts)
- Des reussites inattendues (le modele a correctement ignore les contradictions)
- La qualite reelle de la preservation geometrique, de l'eclairage, du grain photographique

**Images a examiner** :
- #91 : `logs/1775045749040_scandinavian_input.jpg`, `_pass1.jpg`, `_output.jpg`
- #92 : `logs/1775045753479_contemporary_input.jpg`, `_pass1.jpg`, `_output.jpg`
- #93 : `logs/1775045757498_scandinavian_input.jpg`, `_pass1.jpg`, `_output.jpg`

---

*Yann Duval -- Architecte d'interieur, audit structurel v36*
*Audit visuel a completer -- images non accessibles dans cette session*
