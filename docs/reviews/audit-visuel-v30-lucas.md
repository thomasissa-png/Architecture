# Audit technique pipeline v30 — Lucas Moreau, Expert IA Image

**Date** : 2026-03-31
**Version prompts** : v30
**Modele primaire** : GPT-4.1 + GPT-Image-1.5 (Responses API)
**Fallback passe 1** : Flux Depth Pro (Replicate)
**Flux passe 2** : INTERDIT (conforme audit #41/#42)
**Scope** : Audit structurel des prompts v30 + diagnostic regression distribution spatiale

---

## Contexte

Thomas suspecte une regression sur la gestion des espaces : distribution spatiale, proportions, profondeur. Cet audit est mene sans acces aux images de production (Object Storage inaccessible depuis l'environnement de dev). L'analyse porte donc sur le code source des prompts v30 et la structure du pipeline, compares aux versions precedentes que j'ai auditees visuellement (v18-v26, generations #31-42).

**IMPORTANT** : cet audit est un diagnostic de code, pas un audit visuel. Il identifie les causes probables de regression dans les prompts et le pipeline. Un audit visuel des images de production via l'API /api/logs est REQUIS pour confirmer les constats.

---

## 1. Migration gpt-image-1 vers gpt-image-1.5 : impact majeur non audite

### Constat
Le pipeline a migre de `gpt-image-1` vers `gpt-image-1.5` (v26, route.ts ligne 735-738). Ce changement de modele generatif est le facteur de risque numero 1 pour toute regression.

### Analyse
- **gpt-image-1** etait le modele audite dans mes reviews #31-42 avec des notes montantes vers 8.0-8.5
- **gpt-image-1.5** est un modele different avec potentiellement :
  - Un comportement different face aux directives de distribution spatiale
  - Une interpretation differente des tokens de composition ("FULL DEPTH", "background anchor")
  - Une sensibilite differente au negative prompting
  - Un rendu photographique different (grain, vignettage, contraste)
- Aucun audit visuel n'a ete mene post-migration gpt-image-1.5

### Severite : CRITIQUE
La migration de modele generatif sans audit visuel est la cause la plus probable de toute regression observee par Thomas. Le modele est le parametre le plus impactant du pipeline — plus que les prompts.

---

## 2. Distribution spatiale en profondeur : prompts corrects mais potentiellement ignores par 1.5

### Analyse du builder passe 2 generique (living_room, office, null)

```
"Distribute furniture across FULL DEPTH and WIDTH: primary group foreground,
secondary group further back if space allows, lateral anchor on opposite
side if room is wide."
```

Cette directive est presente et correctement formulee (ligne 455-456 route.ts). Elle est conditionnelle ("if space allows", "if room is wide") — conforme a la regle de neutralite sur les petites pieces.

### Analyse des builders specifiques

| Room type | Distribution en profondeur | Verdict |
|---|---|---|
| living_room (generique) | OUI — "FULL DEPTH and WIDTH" | Correct |
| dining_room | OUI — "sideboard as background anchor" | Correct |
| bedroom | NON — pas de directive de profondeur | Acceptable (chambres rarement profondes) |
| kitchen | NON — layout fonctionnel, pas de profondeur | Acceptable |
| bathroom/wc | NON | Acceptable (espaces compacts) |
| entryway | NON — "do not overcrowd" | Acceptable |
| laundry/cellar | NON | Acceptable |

### Flux generique (living_room)

```
"Distribute furniture in depth and width: primary group in foreground,
secondary group in the back if space allows, lateral anchor on the
opposite side if room is wide."
```

Egalement correct.

### Risque de regression
Si gpt-image-1.5 interprete differemment "FULL DEPTH" ou si le token weighting a change (position dans le prompt = importance), la directive de profondeur pourrait etre diluee par les ~180 mots de contraintes qui suivent. Dans le builder generique, la directive de distribution est a la position 3/6 — elle devrait etre en position 1 ou 2 pour un poids maximal.

### Recommandation P1
Remonter la directive "Distribute furniture across FULL DEPTH and WIDTH" en position 2 du builder (juste apres la premiere phrase d'action "Add the following furniture..."). Actuellement en position 3, elle est precedee par "Result should look like a luxury real estate listing photo" qui consomme des tokens sans valeur compositionnelle.

---

## 3. Echelle et proportions du mobilier

### Analyse
Le builder generique contient :
```
"Scale references: door = 204cm, handle = 100cm, sill = 90cm.
Scale furniture to room volume — if compact (<4m wide), use 180cm sofa,
80cm table, 160x230cm rug. Scale up if ceiling >3m."
```

Ces references d'echelle sont correctes et presentes. Le probleme potentiel :

1. **Pas de reference d'echelle pour les pieces moyennes** (4-6m). Le builder donne des tailles pour "compact" et "scale up if >3m ceiling" mais rien pour le cas standard. Le modele est laisse sans guide pour 70% des pieces.

2. **Les furniturePrompts des styles definissent des dimensions fixes** : "230cm wide sofa", "200x300cm rug". Ces dimensions sont optimales pour un salon de ~20m2 mais surdimensionnees pour un 12m2 et sous-dimensionnees pour un 35m2.

3. **Contradiction potentielle** entre le builder ("if compact, use 180cm sofa") et le furniturePrompt du style ("sofa 230cm wide"). Le modele recoit les deux — lequel prime ? Le builder est en fin de prompt (poids faible), le furniturePrompt est au debut (poids fort).

### Severite : HAUTE
Cette contradiction peut causer un mobilier surdimensionne dans les petites pieces (le style dit 230cm, le builder dit 180cm, le modele choisit 230cm car plus tot dans le prompt).

### Recommandation P1
Remplacer les dimensions fixes dans les furniturePrompts par des dimensions CONDITIONNELLES : "three-seat sofa (230cm for large rooms, 180cm for compact rooms)". Ou mieux : supprimer les dimensions des furniturePrompts et les centraliser dans le builder (source unique de verite).

---

## 4. Ombres portees et ancrage au sol

### Analyse
Le builder generique dit :
```
"Match shadow hardness to lighting type."
```

C'est une directive unique et condensee. Dans mes audits precedents (#37-42), les ombres etaient correctes sous GPT-image-1 avec une directive similaire. Le risque avec gpt-image-1.5 :

- **Aucune directive explicite d'ancrage au sol** : "cast realistic shadows" est present dans les builders specifiques (kitchen, bathroom, bedroom) mais le builder generique dit seulement "match shadow hardness". Il manque "every piece of furniture must appear firmly grounded on the floor with contact shadows".

- **Les ombres en arriere-plan** : dans mes audits #37, le mobilier au fond de la piece avait des ombres moins detaillees. Le builder ne contient plus la directive Sprint 14 #97 "Every piece of furniture — including those in the back — must cast realistic shadows". Elle a ete condensee ou supprimee.

### Severite : HAUTE
L'absence de directive d'ancrage au sol ("contact shadows") est une cause probable de mobilier flottant. C'etait un acquis du Sprint 14 qui semble avoir ete dilue lors de la condensation des prompts.

### Recommandation P1
Ajouter dans le builder generique passe 2 : "Every piece must appear firmly grounded on the floor with visible contact shadows — especially furniture placed in the back of the room."

---

## 5. Preservation de la lumiere originale

### Analyse du builder passe 1
```
LIGHT_PRESERVATION = "Preserve existing light direction, shadow positions,
and relative intensity. Maintain wall color temperature from input.
Do not artificially brighten darker areas. Do not add any warm tint
or yellow cast — if the input walls are cool-toned or neutral,
the output walls must remain the same temperature."
```

Correct et conforme aux regles memoire permanentes.

### Analyse du builder passe 2
```
"No warm tint or yellow cast" (via CAMERA_AND_PHOTO)
```

Present mais PAS explicite sur la preservation de la lumiere comme en passe 1. La passe 2 ne contient pas "Preserve existing light direction" — elle dit seulement "Match shadow hardness to lighting type". Cela laisse le modele libre de modifier la direction lumineuse en passe 2.

### Severite : MOYENNE
La passe 2 devrait inclure une directive de preservation lumiere equivalente a la passe 1. Le modele pourrait shifter l'eclairage en ajoutant les meubles.

---

## 6. Rendu photographique (grain, vignettage, CGI-clean)

### Analyse
```
DSLR_LINE = "DSLR full-frame 16-35mm f/8, deep DOF, sharp focus.
Subtle photographic film grain must be visible at 100% zoom —
not smooth CGI rendering. Natural lens vignetting darkening the
corners by 5-10%. No text or watermarks."
```

Present dans tous les builders (passe 1 et 2), conforme. Cependant :

- **gpt-image-1.5 peut interpreter "subtle film grain" differemment** de gpt-image-1. Le grain est un micro-detail que les modeles generatifs tendent a ignorer quand l'instruction est noyee dans un prompt long.
- **Le DSLR_LINE est en derniere position** dans tous les builders. C'est la position de plus faible poids token. Le grain et le vignettage risquent d'etre ignores.

### Severite : MOYENNE
Le rendu CGI-clean etait deja un pattern recurrent dans mes audits #37-42 malgre la presence de cette directive. Le changement de modele aggrave probablement le probleme.

### Recommandation P2
Tester un placement du DSLR_LINE en position 2 ou 3 du builder passe 2 (apres l'action et la distribution) au lieu de la fin. Si gpt-image-1.5 respecte mieux les tokens de debut, cela pourrait ameliorer le grain.

---

## 7. Analyse structurelle des prompts par type de piece

### Longueur des prompts construits (estimation)

| Builder | Mots approx | Verdict |
|---|---|---|
| Generique passe 1 (living_room) | ~220 | Acceptable |
| Generique passe 2 (living_room) | ~180 | Correct |
| Kitchen passe 1 | ~120 | Bon (condense) |
| Kitchen passe 2 | ~110 | Bon |
| Bathroom passe 2 | ~140 | Bon mais dense |
| Outdoor passe 2 | ~250 | TROP LONG — risque de dilution |

Le builder outdoor passe 2 est le plus long (~250 mots sans compter le furniturePrompt). C'est un risque de dilution des directives essentielles.

### Recommandation P2
Condenser le builder outdoor passe 2 de ~250 a ~150 mots. Les directives "lanterns OFF", "outdoor-rated textiles", et "no opaque structures in front of windows" pourraient etre condensees.

---

## 8. Probleme structurel : "freestanding only" vs decoration murale

### Analyse
Le builder generique passe 2 dit :
```
"Freestanding only — no wall art, no shelving, no curtains."
```

Ceci est correct comme regle par defaut. Mais le furniturePrompt du style Maximaliste dit :
```
"two framed art prints propped on the floor against the baseboard"
```

C'est un contournement intelligent (au sol, pas au mur). Cependant, le style Art Deco dit :
```
"brass sunburst mirror leaning against the wall resting on top of the drinks cabinet"
```

Un miroir sur un meuble peut etre interprete comme "pose" et non "mural" — acceptable mais ambigu. Le risque : gpt-image-1.5 pourrait accrocher le miroir au mur malgre "leaning against".

### Severite : FAIBLE
Les contournements sont bien formules. Surveiller en audit visuel.

---

## 9. Comparaison v18/v24/v26/v30 : evolution des prompts

| Version | Changement principal | Impact attendu |
|---|---|---|
| v18 | Premiere version stable auditee | Baseline |
| v24 | Prompts valides Yann/Lucas 8.0/7.8 | Amelioration confirmee |
| v25 | 5 corrections additives (Flos IC, plantes, lanternes) | Micro-ajustements |
| v26 | Migration gpt-image-1 vers gpt-image-1.5 | **CHANGEMENT MAJEUR NON AUDITE** |
| v30 | Wall preservation bedroom Flux, scaling down, dimensions | Corrections mineures |

Le saut critique est **v26**. Toutes les corrections v27-v30 sont des ajustements marginaux. La regression, si elle existe, vient presque certainement du changement de modele generatif.

---

## 10. Diagnostic de la regression suspectee par Thomas

### Hypothese principale : changement de modele (gpt-image-1.5)
- Confiance : 80%
- Mecanisme : gpt-image-1.5 a une fenetre d'attention differente, un comportement compositionnel different, et potentiellement moins de compliance aux directives de distribution spatiale
- Les prompts sont CORRECTS — ils n'ont pas regresse structurellement entre v24 et v30
- La seule variable majeure est le modele

### Hypothese secondaire : dilution des directives par les builders dedies
- Confiance : 15%
- Mecanisme : les builders dedies par room type (kitchen, bathroom, bedroom, etc.) ajoutes en v30 ont complexifie le code. Pour le builder generique (living_room, salon), les prompts n'ont pas change — mais les builders bedroom et dining_room n'ont PAS de directive de distribution en profondeur. Si Thomas teste des generations bedroom/dining, la distribution est absente par design.

### Hypothese tertiaire : ordre des tokens dans le prompt
- Confiance : 5%
- Mecanisme : la directive de distribution est en position 3/6 dans le builder, precedee par des phrases de moindre importance. gpt-image-1.5 pourrait accorder moins de poids aux tokens tardifs que gpt-image-1.

---

## Plan d'action prioritise

### P0 — Actions immediates

1. **Audit visuel des 10 dernieres generations v30** via l'API /api/logs pour confirmer ou infirmer la regression. Cet audit de code ne suffit pas — il faut VOIR les images.

2. **Comparer une meme image input generee avec v24 (gpt-image-1) et v30 (gpt-image-1.5)** pour isoler l'impact du changement de modele. Concretement : re-deployer temporairement avec le modele gpt-image-1 sur la meme image et comparer.

### P1 — Corrections prompt

3. **Remonter "Distribute furniture across FULL DEPTH" en position 2** du builder generique passe 2 (avant "luxury real estate listing photo").

4. **Ajouter directive d'ancrage au sol** : "Every piece must appear firmly grounded with contact shadows, especially furniture in the back of the room."

5. **Resoudre la contradiction d'echelle** entre les dimensions fixes des furniturePrompts (230cm) et les dimensions conditionnelles du builder (180cm si compact). Supprimer les dimensions des furniturePrompts ou les rendre conditionnelles.

6. **Ajouter "Preserve existing light direction" dans la passe 2** au meme niveau que la passe 1.

### P2 — Optimisations

7. **Condenser le builder outdoor passe 2** de ~250 a ~150 mots.

8. **Tester le placement du DSLR_LINE** en position haute (2-3) au lieu de derniere position.

### P3 — Monitoring

9. **Ajouter le modele generatif exact dans les logs** (gpt-image-1 vs gpt-image-1.5) pour permettre la comparaison A/B en production.

10. **Logger la longueur en mots du prompt construit** pour correler longueur prompt vs qualite output.

---

## Note globale estimee (sans images)

**Impossible a noter sans audit visuel.** L'analyse de code suggere que :
- Les prompts sont structurellement corrects et conformes aux regles memoire permanentes
- La migration gpt-image-1.5 est le facteur de risque dominant
- 3-4 corrections prompt (P1) pourraient ameliorer la distribution et l'ancrage
- Le pipeline 2 passes est sain (Flux interdit en P2, retry, refund, logging)

### Estimation de la regression si confirmee visuellement
Si Thomas observe effectivement "tout au premier plan" et "proportions incorrectes", la note estimee serait :
- Distribution spatiale : 5-6/10 (vs 7-8/10 en v24)
- Echelle mobilier : 6/10 (vs 7-8/10 en v24)
- Preservation geometrique : 7-8/10 (non impactee — le pipeline 2 passes preserve toujours la geometrie)
- Rendu photographique : 6-7/10 (grain CGI-clean probable avec 1.5)

**Note estimee globale : ~6.5-7.0/10** (vs 8.0-8.5 en v24 post-corrections)

---

## Memoire permanente — Regle a ajouter

- **Tout changement de modele generatif (gpt-image-1 -> gpt-image-1.5, etc.) DOIT declencher un audit visuel complet** des 12 styles avant deploiement en production. Le modele est le parametre le plus impactant du pipeline — plus que les prompts.

---

## Handoff

**Destinataire** : Thomas (fondateur) + @interior-architect (Yann Duval)
**Action requise** :
1. Thomas : confirmer ou infirmer la regression avec des exemples visuels specifiques (screenshots, numeros de generation)
2. Yann : audit croise stylistique des memes generations
3. Lucas : audit visuel des images via /api/logs des que l'acces est possible (WebFetch ou interface admin)
**Fichiers produits** : `docs/reviews/audit-visuel-v30-lucas.md`
**Prochain audit** : des que les images de production sont accessibles
