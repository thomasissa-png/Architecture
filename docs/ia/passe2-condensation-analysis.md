# Analyse condensation passe 2 — Impact sur les 12 styles

## 1. Comptage mots builder passe 2 (fallback living_room/office)

| Bloc | Mots |
|---|---|
| PASS2_PREAMBLE | 73 |
| CAMERA_PRESERVATION | 83 |
| LIGHT_PRESERVATION | 27 |
| COLUMN_PRESERVATION | 75 |
| EQUIPMENT_PRESERVATION | 72 |
| PASS2_ANTI_INVENTION | 20 |
| Lignes room-specific (density, depth, lived-in, scale, no-duplicate, no-terrace) | ~105 |
| CONTACT_SHADOWS | 10 |
| DSLR_LINE | 13 |
| **Total constantes (sans furniturePrompt)** | **~478 mots** |

Les furniturePrompts mesurent : Scandinavian ~175 mots, Art Deco ~175 mots, Japandi ~165 mots, Bohemian ~170 mots.

**Total prompt envoye au modele : ~478 + ~170 = ~650 mots.**

## 2. Position du furniturePrompt

Le furniturePrompt commence au **mot ~480**. Les hero pieces (Eames lounge, PH5 lamp, Wegner chair, tetsubin teapot) sont donc dans la zone 480-650 — la zone de plus faible attention pour gpt-image-1.5 (perte documentee apres ~200 mots, cf. commentaire v53 dans le code).

C'est probablement la raison pour laquelle les hero pieces sont souvent ignorees par le modele.

## 3. Impact d'une condensation a ~200 mots de constantes

**Positif :** le furniturePrompt passe du mot ~480 au mot ~200. Les hero pieces tombent dans la zone d'attention maximale (mots 200-370). Le style devrait etre MIEUX respecte, pas moins bien.

**Risque :** perte de contraintes de preservation. Mais la passe 2 recoit l'image FINIE de passe 1 (surfaces deja appliquees). Le modele n'a pas a "preserver des surfaces brutes" — il voit une piece propre et meublee, il doit juste ajouter des objets.

## 4. Elements CRITIQUES a conserver en passe 2

| Element | Pourquoi | Condensation possible |
|---|---|---|
| EQUIPMENT_PRESERVATION (radiateurs) | Le modele les supprime systematiquement sans ca | Condenser a 1 phrase : "Keep all fixed equipment (radiators, heaters, vents, panels) — same count, same positions. No furniture blocking them." (~20 mots vs 72) |
| "No curtains, no drapes" | Anti-hallucination fenetre documentee Sprint 12 | Garder tel quel, 4 mots |
| PASS2_ANTI_INVENTION (pas de nouveaux elements archi) | Empeche arches/niches inventees | Garder tel quel, 20 mots |
| Room dimensions FIXED | Anti-stretch de la piece | 1 phrase suffit |
| CONTACT_SHADOWS | Ancrage realiste du mobilier | Garder, 10 mots |

## 5. Elements SUPERFLUS en passe 2

| Element | Pourquoi superflu | Mots economises |
|---|---|---|
| CAMERA_PRESERVATION (83 mots) | La passe 1 a deja fixe l'angle. Le modele ne change pas l'angle en ajoutant un canape. 83 mots pour un risque quasi nul. | **~70 mots** (garder 1 phrase "same angle") |
| COLUMN_PRESERVATION (75 mots) | Les colonnes sont deja rendues en passe 1. Le modele ne les supprime pas en ajoutant du mobilier. | **~65 mots** (garder "keep columns visible, don't place furniture hiding them") |
| LIGHT_PRESERVATION detail | "Keep the input's color temperature" suffit. Les materiaux chauds ne shiftent pas autant en passe 2. | **~15 mots** |
| Lignes density/depth detaillees | Peuvent etre condensees de 105 mots a ~40 mots. | **~65 mots** |

**Economies totales estimees : ~215 mots.** Constantes de ~478 a ~260 mots. Le furniturePrompt passerait au mot ~260 au lieu de ~480.

## 6. Recommandation : GO

**GO pour la condensation passe 2.** Meme logique que v53 passe 1 : le modele perd le focus apres ~200 mots, et le contenu le plus important (le style, les hero pieces, les materiaux) est actuellement enterre a la fin. La condensation va AMELIORER le respect du style, pas le degrader.

**Structure cible (~200 mots de constantes) :**
1. PASS2_PREAMBLE condense (~40 mots) : edit photo, surfaces final, same angle, room dimensions FIXED, no curtains
2. EQUIPMENT_PRESERVATION condense (~20 mots)
3. ANTI_INVENTION (~20 mots)
4. Density + depth condense (~40 mots)
5. CONTACT_SHADOWS + DSLR (~23 mots)
6. furniturePrompt (~170 mots) -- commence au mot ~145

**Risque residuel :** si le modele se met a modifier les colonnes ou l'angle en passe 2, il faudra re-ajouter les constantes specifiques. Mais les audits Sprint 22-24 n'ont JAMAIS signale ce probleme en passe 2 — uniquement en passe 1.
