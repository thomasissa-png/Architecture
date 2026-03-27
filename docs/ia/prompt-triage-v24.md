# Triage des recommandations prompts v24

> Date : 2026-03-27
> Agent : @ia
> Baseline : v24 — Yann indoor 8.0/10, Camille outdoor 7.8/10, geometrie 8.5-9.5/10
> Objectif n1 : ZERO REGRESSION

---

## Synthese des decisions

| # | Recommandation | Source | Priorite | Verdict | Risque regression |
|---|---|---|---|---|---|
| 1 | Contemporain : remplacer lampadaire arc laiton par luminaire editorial | Yann | P1 | APPLIQUER | Quasi nul — modification isolee dans 1 furniturePrompt |
| 2 | Directive "no duplicate items" dans builder passe 2 | Yann | P1 | APPLIQUER | Quasi nul — ajout ADDITIF dans builder, ne modifie rien d'existant |
| 3 | Grain photo ISO 200 insuffisant → renforcer | Yann | P2 | REPORTER | Moyen — touche DSLR_LINE partage par TOUS les prompts |
| 4 | Warm shift leger en passe 2 | Yann | P2 | REPORTER | Moyen — deja adresse par LIGHT_PRESERVATION, renforcer risque d'etre contre-productif |
| 5 | Wabi-Sabi ratio sol vide 50-55% vs 60% | Yann | P2 | REPORTER | Faible mais inutile — 5% de difference, non mesurable visuellement |
| 6 | Plantes outdoor : ajout descriptions visuelles | Camille | P0 | APPLIQUER | Quasi nul — enrichit les descriptions existantes sans les modifier |
| 7 | Lanternes "(unlit daytime)" → renforcer "cold candle, no flame" | Camille | P0 | APPLIQUER | Quasi nul — renforce une directive existante |
| 8 | Reduire items outdoor a 5 max | Camille | P1 | REPORTER | Eleve — supprimer des elements = changer la composition testee |
| 9 | Materiaux outdoor : ajout descripteurs visuels | Camille | P1 | APPLIQUER | Quasi nul — enrichit les descriptions existantes sans les modifier |

**Score** : 5 APPLIQUER, 4 REPORTER, 0 REJETER

---

## Recommandations APPLIQUER — diffs exacts

### 1. Contemporain : remplacer lampadaire arc laiton par luminaire editorial

**Fichier** : `components/StylePicker.tsx`
**Justification** : Le lampadaire arc en laiton avec globe givre est un "marqueur IA" generique qui revient dans plusieurs styles (documente Sprint 16b point 126). Le Contemporain exige un luminaire sculptural editorial, pas un classique mid-century.

**old_string** :
```
brushed brass arc floor lamp with frosted globe shade
```

**new_string** :
```
brushed brass floor lamp with asymmetric flat disc shade 30cm diameter on slim curved stem (Flos IC-style)
```

**Pourquoi ce choix** : La reference "Flos IC-style" est un archetype Contemporain reconnu par les modeles de generation. Le descripteur physique (flat disc 30cm, slim curved stem) ancre la silhouette sans ambiguite. Le materiau (brushed brass) est conserve pour coherence avec le reste du furniturePrompt.

---

### 2. Directive "no duplicate items" dans builder passe 2

**Fichier** : `app/api/generate/route.ts`
**Justification** : Le modele duplique parfois des elements (2 lampadaires identiques, 2 plantes identiques) quand le prompt liste plusieurs objets. Directive additive dans le builder generique passe 2, ne touche aucune directive existante.

**old_string** (ligne 436 du fallback generic builder) :
```
"Freestanding objects only — no wall art, no shelving, no curtains. Room structure LOCKED (walls, floor, ceiling, windows, radiators unchanged, not blocking radiators). Shadows from new furniture are expected.",
```

**new_string** :
```
"Freestanding objects only — no wall art, no shelving, no curtains. No duplicate items — each piece of furniture appears only once unless the style explicitly calls for a pair. Room structure LOCKED (walls, floor, ceiling, windows, radiators unchanged, not blocking radiators). Shadows from new furniture are expected.",
```

**Note** : Cette directive est ajoutee UNIQUEMENT dans le builder generique (living_room, office, null). Les builders dedies (kitchen, bathroom, bedroom, etc.) ne sont pas concernes car leur mobilier est plus contraint.

---

### 6. Plantes outdoor : ajout descriptions visuelles a cote des noms latins

**Fichier** : `lib/outdoor-styles.ts`
**Justification** : GPT-image-1 ne connait pas fiablement toutes les especes par nom latin. Le modele genere parfois une plante d'interieur generique a la place. Ajouter une description visuelle (hauteur, forme, couleur du feuillage) permet au modele de generer la bonne silhouette meme s'il ne reconnait pas le nom.

Les modifications sont ADDITIVES — le nom latin est conserve, la description visuelle est ajoutee entre parentheses.

**6a. contemporain_outdoor — Calamagrostis Karl Foerster**

**old_string** :
```
one tall fibrecite planter 70cm with Calamagrostis Karl Foerster 120cm tall
```

**new_string** :
```
one tall fibrecite planter 70cm with Calamagrostis Karl Foerster (tall narrow upright feathery grass plume, straw-gold tone) 120cm tall
```

**6b. boheme_garden — Heuchera et Rudbeckia**

**old_string** :
```
potted Heuchera 'Palace Purple' 40cm tall in woven sea-grass basket, potted Dryopteris filix-mas (male fern) and Rudbeckia mix in terracotta pots 30cm
```

**new_string** :
```
potted Heuchera 'Palace Purple' (low mounding plant with dark burgundy-purple scalloped leaves) 40cm tall in woven sea-grass basket, potted Dryopteris filix-mas (male fern with arching bright green fronds) and Rudbeckia (upright daisy-like golden yellow flowers with dark brown center cone) mix in terracotta pots 30cm
```

**6c. industriel_urbain — Sedum acre**

**old_string** :
```
galvanized steel planter boxes 80x40cm with Stipa tenuissima and Sedum acre
```

**new_string** :
```
galvanized steel planter boxes 80x40cm with Stipa tenuissima (fine wispy ornamental grass) and Sedum acre (low creeping succulent mat with tiny bright green star-shaped leaves)
```

---

### 7. Lanternes outdoor : renforcer directive "unlit daytime"

**Fichier** : `app/api/generate/route.ts` — builder `buildOutdoorFurnitureResponsesPrompt`
**Justification** : Le modele ignore regulierement "(unlit daytime)" et genere des flammes/lueurs dans les lanternes. Renforcer avec une description physique de l'etat eteint.

**old_string** :
```
"All lighting fixtures must be OFF if the scene is in daylight — unlit lanterns, unlit string lights, no glowing bulbs, no visible flames.",
```

**new_string** :
```
"All lighting fixtures must be OFF in daylight — unlit lanterns with cold wax candle stub visible (no flame, no glow, no warm light), unlit string lights with dark glass bulbs, no glowing filaments, no visible flames anywhere.",
```

**Meme correction dans buildOutdoorFurnitureFluxPrompt** :

**old_string** :
```
"All lighting fixtures OFF in daylight — unlit lanterns, unlit string lights, no glowing bulbs.",
```

**new_string** :
```
"All lighting fixtures OFF in daylight — unlit lanterns with cold wax candle (no flame, no glow), unlit string lights with dark bulbs, no glowing filaments.",
```

---

### 9. Materiaux outdoor : ajout descripteurs visuels

**Fichier** : `lib/outdoor-styles.ts`
**Justification** : Le modele substitue parfois des materiaux (acier inox au lieu de fer forge, bois clair au lieu de teck argente). Les descripteurs visuels (couleur, texture, patine) reduisent l'ambiguite.

**9a. mediterraneen_outdoor — fer forge**

**old_string** :
```
round wrought-iron table 120cm in aged antique white finish with 4 matching bistro armchairs with woven rush seats
```

**new_string** :
```
round wrought-iron table 120cm in aged antique white finish with visible dark oxidized metal showing through paint wear on edges, 4 matching bistro armchairs with woven rush seats
```

**9b. industriel_urbain — acier galvanise et corten**

**old_string** :
```
succulent arrangement in rusted corten steel container 40cm
```

**new_string** :
```
succulent arrangement in rusted corten steel container 40cm (deep orange-brown patina with rough granular oxidized surface)
```

**9c. rooftop — aluminium anthracite**

**old_string** :
```
L-shaped modular weatherproof sofa 220cm x 180cm in anthracite grey Sunbrella-type fabric with dark aluminium frame
```

**new_string** :
```
L-shaped modular weatherproof sofa 220cm x 180cm in anthracite grey Sunbrella-type fabric with dark powder-coated aluminium frame (matte charcoal, no shine)
```

---

## Recommandations REPORTER — justification

### 3. Grain photo ISO 200 insuffisant → renforcer

**Pourquoi reporter** : La ligne DSLR_LINE est partagee par TOUS les prompts (indoor + outdoor, passe 1 + passe 2). Elle contient deja "Subtle photographic film grain must be visible at 100% zoom — not smooth CGI rendering". Renforcer cette directive (ex: "prominent grain", "ISO 400") risque de degrader la nettete des details mobilier sur les 12 styles indoor + 8 styles outdoor.

**Test necessaire** : Generer 3 images du meme input avec ISO 200 vs ISO 400 vs "visible grain at every zoom level". Comparer la nettete des textures de mobilier (boucle, bois, ceramique). Si la nettete mobilier est preservee, appliquer.

### 4. Warm shift leger en passe 2

**Pourquoi reporter** : Le warm shift est deja adresse par LIGHT_PRESERVATION ("Do not add any warm tint or yellow cast") et par CAMERA_AND_PHOTO. Si un warm shift persiste malgre ces directives, le probleme est dans le modele (biais GPT-image-1), pas dans le prompt. Ajouter encore plus de directives anti-warm risque de pousser le modele vers un rendu froid artificiel (over-correction).

**Test necessaire** : Comparer les colorimetries input vs output sur 10 generations. Si le shift est systematique (>5% deltaE sur les murs), envisager un post-processing colorimetrique cote serveur plutot qu'une directive prompt supplementaire.

### 5. Wabi-Sabi ratio sol vide 50-55% vs 60%

**Pourquoi reporter** : Le furniturePrompt Wabi-Sabi dit actuellement "leave at least 60 percent of the floor area completely empty". Passer a 50-55% est une difference de 5-10% visuellement non mesurable. Le modele ne controle pas le ratio au pourcentage pres — la directive actuelle fonctionne comme un signal "tres peu meuble", ce qui est correct pour Wabi-Sabi.

**Test necessaire** : Aucun — la modification n'apporterait pas d'amelioration mesurable. Conserver 60%.

### 8. Reduire items outdoor a 5 max quand 6-8 listes

**Pourquoi reporter** : Supprimer des elements de furniturePrompt existants = changer la composition testee et validee a 7.8-8.4/10. Chaque element a ete choisi par Camille Verdier pour sa contribution stylistique. Retirer 2-3 elements par style sans test visuel risque de degrader la note.

**Test necessaire** : Pour chaque style outdoor concerne, generer une version complete (6-8 items) vs une version reduite (5 items). Comparer les notes Camille. Si la version reduite maintient ou ameliore la note (moins de confusion modele), appliquer le trim sur le style concerne.

---

## Ordre d'application recommande

1. Recommandation 7 (lanternes unlit) — touche les builders partages, appliquer en premier
2. Recommandation 2 (no duplicate items) — touche le builder generique, appliquer ensuite
3. Recommandation 1 (Contemporain lamp) — modification isolee StylePicker
4. Recommandation 6 (plantes visuelles) — modifications isolees outdoor-styles
5. Recommandation 9 (materiaux visuels) — modifications isolees outdoor-styles

---

**Handoff → @fullstack**
- Fichiers a modifier : `components/StylePicker.tsx`, `lib/outdoor-styles.ts`, `app/api/generate/route.ts`
- Decisions prises : 5 modifications ADDITIVES a faible risque, 4 modifications reportees (touchent des parties partagees ou non mesurables)
- Points d'attention : chaque modification est un diff exact pret a appliquer via Edit. Tester sur 1 generation Contemporain (rec 1), 1 generation living_room generique (rec 2), 1 generation outdoor avec lanternes (rec 7), 1 generation Boheme Garden (rec 6). Comparer visuellement avec les generations v24 existantes.
