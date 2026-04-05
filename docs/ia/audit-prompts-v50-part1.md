# Audit prompts v50 -- generation-pipeline.ts

**Date** : 2026-04-05 | **Agent** : @ia | **Fichier** : `lib/generation-pipeline.ts` (973 lignes)

## Note globale : 7.8 / 10

---

## Notes par builder

### Passe 1 (surfaces) -- 8 builders

| Builder | Note | Forces | Faiblesses |
|---|---|---|---|
| kitchen | 8/10 | Strip flooring du surfacePrompt, splashback specifique | Pas de ANTI_FENETRE position 1 (apres PREAMBLE, avant CAMERA) |
| bathroom | 8/10 | IP44 spotlights, floor-to-ceiling tiles | Idem position ANTI_FENETRE |
| wc | 7.5/10 | Compact, coherent | Manque "glass blocks/skylights" preservation |
| bedroom | 8/10 | Accent wall conditionnel | Idem position ANTI_FENETRE |
| entryway | 7.5/10 | Durable entrance floor | Pas de directive "preserve existing door hardware" |
| laundry | 7.5/10 | Fonctionnel, sobre | Idem |
| cellar | 7/10 | Sealant option correcte | Manque preservation soupiraux/lucarnes (specifique caves) |
| generic (fallback) | 8.5/10 | Le plus complet, accent wall + ceiling light delegation | Reference |

### Passe 2 (mobilier) -- 9 builders

| Builder | Note | Forces | Faiblesses |
|---|---|---|---|
| kitchen | 8/10 | Island conditionnel 10m2, lived-in details, anti-terrasse | -- |
| bathroom | 8.5/10 | Compact par defaut, anti-duplication fixtures, anti-elargissement | -- |
| wc | 7/10 | Minimal correct | Manque "Place furniture INSIDE only" (anti-terrasse) |
| bedroom | 8/10 | Density adaptative, lived-in details | -- |
| entryway | 7.5/10 | Console max 60% wall width | Manque "Place furniture INSIDE only" (anti-terrasse) |
| laundry | 7.5/10 | Conditionnel <4m2 | Manque anti-terrasse |
| cellar | 7/10 | Wine rack conditionnel | Manque anti-terrasse |
| dining_room | 8/10 | Compact/large conditionnel, sideboard background anchor | -- |
| generic (fallback) | 8.5/10 | 30-40% density, distribution 3 zones, scaling conditionnel | Reference |

---

## Problemes identifies

### P0 -- CRITIQUE

**P0-1 : ANTI_FENETRE pas en position 2 dans les builders outdoor.**
- `buildOutdoorSurfacesResponsesPrompt` n'utilise PAS la constante ANTI_FENETRE.
- La directive "do not add windows, doors" est absente du prompt outdoor passe 1.
- Risque : hallucination de baies vitrees ou portes supplementaires sur facades.
- Les outdoor ont leur propre formulation mais elle ne couvre que "guard rails, walls, facades, gates, fences" -- pas le comptage portes/fenetres.

**P0-2 : PASS2_PREAMBLE absent des builders outdoor passe 2.**
- `buildOutdoorFurnitureResponsesPrompt` n'utilise ni PASS2_PREAMBLE ni ANTI_FENETRE.
- Le preamble outdoor passe 2 est ad hoc ("Edit this outdoor photo. Keep all ground surfaces...") sans la rigueur du PASS2_PREAMBLE interieur.
- Avec gpt-image-1.5, le modele est plus creatif -- sans preamble strict, risque de regeneration de la scene exterieure.

**P0-3 : roomInventory non injecte dans les builders outdoor.**
- `buildOutdoorSurfacesResponsesPrompt` et `buildOutdoorFurnitureResponsesPrompt` n'acceptent pas le parametre `roomInventory`.
- Le pre-pass vision est execute mais son resultat est perdu pour les generations outdoor.

### P1 -- HAUTE

**P1-1 : "Place furniture INSIDE only" manquant dans 4/9 builders passe 2.**
- WC, entryway, laundry, cellar n'ont pas la directive anti-terrasse.
- Risque moindre (ces pieces ont rarement des baies vitrees donnant sur terrasse) mais incoherence avec les 5 autres builders.

**P1-2 : Pas de ANTI_INVENTION dans les builders passe 2.**
- ANTI_INVENTION ("No new architectural elements") est present dans tous les builders passe 1 mais absent de tous les builders passe 2.
- Or la passe 2 peut aussi halluciner des arches, niches, coffers quand le style l'y incite (Art Deco, Haussmannien).

**P1-3 : WALL_PRESERVATION absent des builders passe 2.**
- La passe 2 dit "wall colors unchanged" via PASS2_PREAMBLE mais pas la geometrie murale.
- Si le modele elargit une piece pour caser un canape, aucune directive explicite ne l'interdit en passe 2 (sauf CAMERA_PRESERVATION indirect).

**P1-4 : Constante PHOTO_GRAIN mentionnee dans v43 changelog mais absente du code.**
- Le CLAUDE.md dit "PAS de grain photographique -- Decision fondateur". Coherent avec l'absence.
- Mais le changelog v43 mentionne "P1 PHOTO_GRAIN restaure ISO 200 + vignetting" -- contradiction. A clarifier : la decision fondateur prime, le code est correct, mais le changelog induit en erreur.

### P2 -- MOYENNE

**P2-1 : Nettoyage chantier verbeux et duplique.**
- La phrase "Remove construction leftovers: dangling cables, junction boxes..." est copiee identique dans 8 builders passe 1.
- Devrait etre une constante partagee (comme EQUIPMENT_PRESERVATION pour la passe 2).
- ~50 mots x 8 = 400 mots de duplication. Risque de divergence si modification dans un builder mais pas les autres.

**P2-2 : EQUIPMENT_PRESERVATION ne mentionne pas "boiler" dans la constante.**
- La constante liste "radiators, electric convector heaters, water heaters, vents, thermostats, switches, electrical panels".
- Le CLAUDE.md Sprint 23 mentionne "boiler" comme ajout. Absent de la constante (present uniquement dans les builders passe 1 inline).

**P2-3 : Outdoor passe 2 n'a pas de "lived-in" conditionnel pour espaces formels.**
- "an open book, a glass of water" peut etre incoherent sur un jardin zen ou une cour de chateau.

---

## Coherence inter-builders

| Directive | Passe 1 (8 builders) | Passe 2 (9 builders) | Outdoor P1 | Outdoor P2 |
|---|---|---|---|---|
| PASS1/2_PREAMBLE | 8/8 | 9/9 | ABSENT | ABSENT |
| ANTI_FENETRE | 8/8 | 0/9 (via PREAMBLE) | ABSENT | ABSENT |
| CAMERA_PRESERVATION | 8/8 | 9/9 | ad hoc | ad hoc |
| LIGHT_PRESERVATION | 8/8 | 9/9 | ad hoc | ad hoc |
| COLUMN_PRESERVATION | 8/8 | 9/9 | ABSENT | ABSENT |
| WALL_PRESERVATION | 8/8 | 0/9 | ad hoc | ABSENT |
| ANTI_INVENTION | 8/8 | 0/9 | ABSENT | ABSENT |
| EQUIPMENT_PRESERVATION | inline 8/8 | 9/9 constante | N/A | N/A |
| CONTACT_SHADOWS | N/A | 9/9 | N/A | ad hoc |
| Anti-terrasse | N/A | 5/9 | N/A | N/A |
| roomInventory | 8/8 | 9/9 | 0/1 | 0/1 |

**Constat** : les builders interieur sont tres bien alignes entre eux. L'ecart principal est entre interieur et outdoor -- les outdoor n'utilisent aucune constante partagee et ont des formulations ad hoc moins rigoureuses.

---

## Synthese par critere

| Critere | Poids | Note | Commentaire |
|---|---|---|---|
| Preservation spatiale | x3 | 8/10 | PREAMBLE + ANTI_FENETRE + CAMERA solides en interieur. Outdoor en retard (P0-1, P0-2). |
| Structure prompt | x2 | 8.5/10 | Ordre preservation-first correct (v45). Constantes bien factorisees. resolveChooseOne malin. |
| Coherence inter-builders | x2 | 7/10 | Interieur 9/10, outdoor 5/10. L'ecart tire la note vers le bas. |
| Nettoyage chantier | x1 | 7.5/10 | Complet mais duplique (P2-1). Couvre cables, plomberie, boitiers. |
| Prompts outdoor | x1 | 6/10 | Fonctionnels mais pas au niveau des interieur. Manque PREAMBLE, inventaire, ANTI_FENETRE. |

**Note ponderee** : (8x3 + 8.5x2 + 7x2 + 7.5x1 + 6x1) / 9 = **7.8 / 10**

---

## Actions recommandees

1. **P0** : Creer OUTDOOR_PREAMBLE_P1 et OUTDOOR_PREAMBLE_P2 utilisant les memes principes que PASS1/2_PREAMBLE + ajouter comptage portes/fenetres/ouvertures de facade.
2. **P0** : Injecter roomInventory dans les builders outdoor.
3. **P1** : Ajouter anti-terrasse aux 4 builders passe 2 manquants.
4. **P1** : Ajouter ANTI_INVENTION en passe 2 (au moins pour les styles structurellement ambitieux).
5. **P2** : Extraire la phrase nettoyage chantier dans une constante CONSTRUCTION_CLEANUP.

---

**Handoff -> @fullstack**
- Fichier audite : `/home/user/Architecture/lib/generation-pipeline.ts`
- Rapport : `/home/user/Architecture/docs/ia/audit-prompts-v50-part1.md`
- 3 P0 a corriger (outdoor principalement), 4 P1, 3 P2
- Les builders interieur sont solides (8/10) -- les corrections portent surtout sur l'alignement outdoor
