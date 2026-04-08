# Audit visuel Lucas Moreau — gen #238 à #241 (v59)

**Date** : 2026-04-08
**Auditeur** : Lucas Moreau (@ai-image-expert)
**Version prompts** : v59
**Modèle** : OpenAI gpt-image-1.5 via Responses API (input_fidelity high)
**Scope** : 4 générations, diagnostic technique prompt-engineering

---

## 1. Synthèse (5 lignes)

**Verdict global** : v59 corrige partiellement les régressions v58 mais révèle 3 bugs structurels nouveaux. Notes consolidées Lucas : #238 **5.2/10** (CAP preservation — personnes non retirées), #239 **7.1/10** (STEP 1/2/3 bathroom FONCTIONNE, mais perte équipements muraux), #240 **4.4/10** (CAP — côté gauche catastrophique, ballon + échelle préservés à tort), #241 **3.8/10** (CAP — personnes ré-hallucinées + frame élargi). Moyenne **5.1/10**, en-dessous du seuil GO.

**Point critique #1** : le verbe d'action "MUST be rendered empty" de CLEANUP_V53 v59 est **insuffisant** contre les humains dans un input de chantier brut — 3/4 générations livrent des personnes dans l'output (#238 pass 1, #240 pass 1 ballon+échelle persistent, #241 réintroduction en mode adjust). CLEANUP liste les humains mais la proposition finale contient "no furniture, no new fixtures, no decorative items" — le modèle lit cette clause terminale comme primant sur la liste de retrait, et conclut que les humains ne sont ni "furniture" ni "fixtures" → ambiguïté fatale.

**Point critique #2** : succès partiel v59 P0-1 bathroom — la hiérarchie STEP 1/2/3 a été **correctement interprétée** pour #239 (couloir étroit → tabouret seul, pas de vanity hallucinée). C'est une validation de l'hypothèse @ia R2. Confiance v59 P0-1 montée de 75% à **~85%** sur ce pattern.


## 2. Generation #238 — Living Room Scandinavian SURFACES ONLY

**Note Lucas : 5.2/10** (CAP à 5 → remonté à 5.2 pour qualité surfaces). Préservation spatiale **6/10** — frame globalement OK, angle conservé, mais mur de gauche anormalement étiré en profondeur (le placard/porte de l'input est maintenant un mur nu qui court sur 4m). Rendu **8/10** (chantier → propre très bien).

**Observations** :
1. **Personnes PERSISTENT (bug P0)** : les 2 humains visibles dans l'input (homme à gauche en manteau téléphone, homme à droite assis au rebord de la fenêtre en baskets vertes) sont **encore là** dans l'output. L'homme de gauche a même été dupliqué en silhouette à travers le miroir (effet artefact). CLEANUP_V53 v59 ne suffit pas.
2. **Échelle et outils côté gauche** : l'échelle visible contre le mur de gauche dans l'input a été préservée (au sol entre les 2 hommes). Échec direct du "MUST be rendered empty".
3. **Ballon d'eau chaude cylindrique blanc** : visible dans l'input à droite de la fenêtre → dans l'output, déplacé/remplacé par un encart ouvert montrant des tuyaux + une brique apparente + une échelle contre la fenêtre. Le modèle a essayé de "nettoyer" mais a créé une **zone de sale sous la fenêtre droite** plus laide que l'input. Cause : CLEANUP liste "water heaters" en PERMANENT (à préserver), donc le modèle ne l'efface pas — il le **déplace en dehors du cadre en laissant l'infrastructure exposée**.
4. **Luminaire PH5-style** : bien rendu (3 disques tiered blanc mat), centré au plafond. Bonne fidélité au surfacePrompt.
5. **Sol whitewashed ash** : très bien — wide-plank, grain visible, finish mat conforme.
6. **Plafond avec poutres/solives en T** : bien préservé (géométrie respectée) — PRESERVATION_V53 fait son job.

**Diagnostic CLEANUP_V53 v59** : la formulation actuelle est structurellement contradictoire :
- Ligne 272 (`lib/generation-pipeline.ts`) : "REMOVE only these TEMPORARY construction items: ... and any people visible (workers, painters, occupants, photographers, hands)"
- **MAIS** "PRESERVE all PERMANENT wall-mounted or built-in equipment: ... water heaters, boilers"
- Le ballon d'eau chaude = "water heater" = PRESERVE. Donc le modèle doit le garder. Mais l'user veut le cacher.
- Les humains sont bien dans la liste REMOVE, mais la phrase finale "no furniture, no new fixtures, no decorative items" relâche la pression sur les humains (qui ne sont aucune de ces 3 catégories).

**Fix proposé** : voir section 6, P0-A (durcir humain) + P0-B (ballon d'eau chaude = TEMPORARY_ON_CHANTIER).


## 3. Generation #239 — Bathroom Scandinavian (v59 P0-1 test critique)

**Note Lucas : 7.1/10**. Préservation spatiale **7.5/10** (couloir non élargi, baignoire intacte). Rendu **7/10**. Contraintes lumière **7/10**.

**TEST CRITIQUE v59 P0-1 — VERDICT : RÉUSSI (STEP 1 obéi)**

En comparant pass1 (baignoire seule) vs output (baignoire + tabouret) :
- Le couloir est resté **à la même largeur** — aucun élargissement de pièce détecté (bug #234 non reproduit).
- La baignoire d'origine est **conservée exactement** (position, taille, tablier carrelage, robinetterie). STEP 3 respecté.
- **Aucune vanity, aucun miroir, aucun sèche-serviettes ajouté** — le STEP 1 narrow corridor a été correctement détecté et appliqué. C'est la **validation empirique** que gpt-image-1.5 peut obéir à des hiérarchies conditionnelles "IF narrow THEN X ELSE Y" quand :
  - (a) les 3 steps sont formulés comme une **séquence numérotée** ("Step 1 / Step 2 / Step 3") qui canalise l'attention.
  - (b) Step 1 est **le plus court** et contient des quantités explicites ("1-2 small floor accessories").
  - (c) Les items à ajouter en Step 1 sont **hyper-spécifiques** ("teak stool 30cm with a candle and a rolled towel on top") — moins ambigus que "a small decorative object".
- Le tabouret ajouté avec serviette roulée + bougies est exactement l'item décrit en Step 1 (teak/stoneware stool 30cm).

→ **Hypothèse R2 de @ia (confiance 75%) VALIDÉE sur ce cas**. Je recommande de monter la confiance à **~85%** et de documenter cette réussite comme pattern générique "STEP-gated conditional override" à propager aux autres room types (dining, office, bedroom) quand une logique de taille s'impose.

**Problèmes secondaires (régressions mineures)** :
1. **Sèche-serviettes mural DISPARU** : pass1 montrait un support mural chromé blanc à droite (probablement un porte-serviette existant). Output : le mur droit est nu. PASS2_EQUIPMENT_V54 liste "towel dryers" mais le modèle a interprété le support comme un élément "cassé" à nettoyer plutôt qu'un équipement.
2. **Convecteur mural disparu** : pass1 montre un petit convecteur bas à droite (le radiateur électrique). Output : effacé. PASS2_EQUIPMENT_V54 liste "convectors" mais gpt-image-1.5 semble **lire PASS2_EQUIPMENT avec moins de poids que le roomFurnitureOverride** qui dit "ADD ONLY 1-2 small floor accessories ... ADD nothing on the walls" — la clause d'interdiction Step 1 a dépassé la préservation.
3. **Luminaire PH5** : c'est un PH5-style approximatif (3 disques tiered blanc mat). Plainte user "est-on sur du style de luminaire ?" est légitime — le vrai PH5 a une forme d'artichaut 3 couches avec cône central rouge discret, ici le rendu est plutôt générique style "disques superposés". Fidélité marque moyenne, mais acceptable pour "PH5-style".

**Diagnostic** : le roomFurnitureOverride v59 **surécrase** la préservation d'équipements existants quand le Step 1 dit "ADD nothing on the walls". Le modèle interprète "nothing on the walls" comme licence de retirer ce qui existe déjà. Il faut séparer strictement : "ADD nothing NEW on the walls" ≠ "REMOVE anything existing".


## 4. Generation #240 — Dining Maximalist (plainte côté gauche sale)

**Note Lucas : 4.4/10** (CAP préservation 5/10 → descendu à 4.4 car échec user-facing total). Préservation **7/10** (géométrie OK, poutres préservées, mur accent turquoise respecté). Rendu maximalist **8/10** (palette, tapis persan, chaises, chandelier — bon). **Nettoyage chantier : 1/10** — c'est l'échec critique.

**Plainte fondateur CONFIRMÉE visuellement** :

**Côté gauche** :
- **Ballon d'eau chaude** (cylindre blanc) clairement visible au-dessus de la fenêtre gauche dans l'output. Présent dans pass1 aussi. **Pas nettoyé par CLEANUP_V53 v59**.
- **Échelle** visible appuyée sous la fenêtre gauche, à côté du tabouret maximalist orange. Présente dans pass1 aussi.
- **Mur ocre/jauni** (plâtre non peint) autour de la fenêtre gauche — pas repeint, rugueux. PASS1 a laissé le côté gauche intact.
- **Pipes/conduites** visibles sur le mur sous le ballon.

**Côté droit** :
- Une **grille/évent** (probablement ventilation ou compteur) visible en bas du mur droit — le modèle a essayé de la cacher par la perspective mais elle reste visible.
- Aucun meuble n'est placé devant pour la masquer.

**Diagnostic technique — cause racine DOUBLE** :

**Cause A (pass 1 — CLEANUP_V53 échec)** : Le ballon d'eau chaude est littéralement listé dans la liste **PRESERVE PERMANENT** de CLEANUP_V53 ligne 272 : _"PRESERVE all PERMANENT wall-mounted or built-in equipment: ... water heaters, boilers"_. Le modèle a donc **délibérément conservé** le ballon. C'est une **contradiction de design** : l'utilisateur Thomas marchand veut que ces éléments soient cachés, pas qu'ils soient préservés. Un ballon d'eau chaude sur un chantier de home-staging est visuellement indésirable, même s'il est "permanent" au sens technique.

Pour l'échelle : CLEANUP liste bien "ladders, step-stools" en TEMPORARY. Le modèle aurait dû l'effacer. Mais l'échelle est entourée par le ballon+pipes dans le input, et le modèle a visiblement considéré cette zone comme un "cluster permanent" qu'il fallait préserver globalement. **Le problème est que CLEANUP_V53 parse l'input par zone, pas par objet** — quand un TEMPORARY est en contact visuel proche d'un PERMANENT préservé, il hérite de la préservation.

**Cause B (pass 2 — PASS2_EQUIPMENT_V54 échec masquage)** : Le furniturePrompt dining maximalist ne contient **aucune directive de MASQUAGE** des éléments laids. Il décrit un centre de table + tapis + chaises (composition centrée). PASS2_EQUIPMENT_V54 ligne 409 dit même explicitement : _"Do not place furniture blocking or covering any of these elements"_. Donc le modèle est **interdit de placer un meuble devant le ballon** pour le cacher. Contradiction totale avec la demande user.

Le `PASS2_DENSITY_V54` parle de "distribute across full depth, balance left and right" mais aucune mention de "use tall furniture (cabinet, screen) to hide visual eyesores on the walls". Le modèle fait la distribution esthétique d'un catalogue, pas un masquage fonctionnel de chantier.

**Fix prompt-engineering proposé** :
1. **Retirer `water heaters` et `boilers` de PRESERVE** dans CLEANUP_V53 et les déplacer en **REMOVE TEMPORARY** (ou créer une 3e catégorie `HIDE_IF_UGLY`). Sur un chantier brut Thomas, un ballon est presque toujours à cacher.
2. **Ajouter une clause POSITIVE dans PASS2_DENSITY** : _"If the input shows visually awkward wall elements (exposed pipes, water heaters, electrical meters), place a tall piece of furniture (cabinet, sideboard, tall plant, folding screen) in front of them to discreetly mask them, unless access is functionally required."_
3. **Supprimer la phrase "Do not place furniture blocking or covering any of these elements"** de PASS2_EQUIPMENT_V54 — cette phrase date de la peur de cacher les radiateurs, mais elle bloque maintenant tout masquage utile. La remplacer par _"Do not place furniture blocking radiators, convectors, or accessible switches. Other wall equipment (electrical panels, meters, water heaters) may be masked by tall furniture if that improves composition."_
4. **Modifier extractRoomInventory** pour qu'il marque les eyesores dans un champ séparé : `TO HIDE: water heater (left wall above window), electrical meter (right wall)` — puis les builders peuvent lire ce champ et générer des directives de masquage ciblées.


## 5. Generation #241 — Iteration Scandinavian (plainte personnes réintroduites)

**Note Lucas : 3.8/10** (CAP). Préservation spatiale **4/10** (frame élargi, ratio modifié). Rendu **7/10**. Fidélité à l'iteration demandée **5/10**.

**Comparaison #238 → #241** :
| Élément | #238 (input iteration) | #241 (output adjust) |
|---|---|---|
| Ballon d'eau chaude cylindrique droit | Présent | **RETIRÉ** (succès ponctuel user request) |
| Infrastructure laide sous fenêtre droite (brique exposée, échelle) | Présente | Remplacée par un mur propre + convecteur sous la fenêtre |
| Convecteur mural sous fenêtre droite | **ABSENT** | **AJOUTÉ** (hallucination v59 adjust) |
| 2 humains (gauche tél + droite assis) | Présents | **ENCORE LÀ** (gauche tel, droite veste noire debout) |
| Frame/ratio | Portrait étroit | **Élargi** (horizontalement visible, angle modifié) |
| Sol whitewashed ash | Conforme | Conforme |
| Luminaire PH5 | Présent centré | Présent centré |

**Plainte fondateur CONFIRMÉE** : les personnes sont bien **réintroduites**. Pire encore, elles n'ont pas exactement les mêmes pauses que dans #238 (l'homme de droite était assis sur le rebord de la fenêtre avec baskets vertes, ici il est debout en veste noire). Le modèle a donc **régénéré des humains de zéro**, il ne les a pas "laissés en place".

**Diagnostic technique — cause racine précise** :

J'ai lu `/home/user/Architecture/lib/iteration-prompt.ts` fonction `buildAdjustResponsesPrompt` (ligne 85-114). Le prompt adjust contient :
- ligne 92 : _"Edit this photo. Make a small, precise change. Keep everything else unchanged."_
- ligne 94 : _"Before editing, mentally list every visible object. All must stay at same position, same size, same color — except the one change described below."_
- ligne 96 : _"Keep all existing furniture, appliances, and decorations at their current positions..."_
- ligne 110 : _"Count all fixed wall-mounted equipment..."_ (avec exception conditionnelle v58 P0-2 pour le ballon à retirer — **c'est ce qui marche**)

**Il manque 2 choses critiques** :
1. **Aucune directive anti-humain dans buildAdjustResponsesPrompt**. Le prompt dit "mentally list every visible object" mais **#238 input ne contenait pas d'humains** (ou plutôt, en contenait, mais le modèle ne les a pas "listés" comme objets stables). Le mode adjust n'a hérité d'aucun anti-personne comme CLEANUP_V53 — c'est un prompt de 100% **édition chirurgicale**, pas de nettoyage. Donc si l'image source contient des humains, ils restent. Et si elle n'en contient pas, le modèle peut en inventer (comme pour #241) parce que la phrase "Keep all existing furniture, appliances, and decorations at their current positions" ne dit rien sur les humains.
2. **Aucune lock de frame strict** : le prompt dit "same camera angle" mais pas "same aspect ratio, same crop edges". gpt-image-1.5 en mode adjust avec `input_fidelity: high` et `size` calculé depuis les dimensions originales peut quand même **élargir le frame** si l'image d'entrée a un ratio qui ne colle pas exactement à 1024x1536 / 1536x1024.

**Hypothèse annexe** : une possibilité est que `extractRoomInventory` n'est **pas appelé en mode adjust** — il n'est appelé qu'en mode pass1/pass2 standard. Le mode iteration adjust ne passe pas par cette extraction, donc il ne reçoit **aucune information contextuelle** sur le contenu de l'image — il se base uniquement sur ce que gpt-image-1.5 "voit" via input_fidelity. C'est confirmé par le fait que `buildAdjustResponsesPrompt` n'a aucun paramètre `roomInventory`. → À vérifier dans `route.ts` mais très probable.

**Fix prompt-engineering proposé** :

1. **Ajouter clause anti-humain explicite** dans `buildAdjustResponsesPrompt` ligne ~95 (après "mentally list every visible object") :
   _"No humans, no workers, no hands, no arms, no silhouettes of people should appear in the output, regardless of whether they were in the input — this is a finished interior photo."_
2. **Lock frame strict** : ajouter _"Output aspect ratio, crop edges, and frame composition must match the input EXACTLY. Do not re-compose or re-frame the scene."_
3. **Optionnel — réappliquer un mini-CLEANUP en mode adjust** : ajouter en début de prompt _"If any people, workers, tools, ladders, or construction debris are visible in the input image, remove them and fill the vacated area with the surrounding wall, floor, or ceiling finish, as part of this edit."_ Ce serait cohérent avec l'idée que l'iteration doit produire une image **commercialisable**, pas une image **fidèle au passé**.
4. **Ajouter `extractRoomInventory` au mode adjust** pour que le modèle reçoive le contexte "TO REMOVE: people" et s'aligne. Mais attention : l'inventory actuel décrit l'image **source de l'iteration** (#238 output) qui contient déjà les personnes — l'inventory va donc correctement les lister en TO REMOVE. Le fix serait donc "gratuit".


## 6. Plan de fixes v60

### Priorité P0 (bloquant — fix avant prochaine release)

| # | Fichier:ligne | Changement précis | Impact attendu |
|---|---|---|---|
| **P0-A** | `lib/generation-pipeline.ts` L272 (CLEANUP_V53) | Durcir l'anti-humain : déplacer "and any people visible (workers, painters, occupants, photographers, hands, arms, silhouettes)" en **toute première position** de la liste REMOVE, et **dupliquer en fin de prompt** sous forme d'assertion positive : _"The output MUST show zero humans, zero hands, zero arms, zero silhouettes of people — this is a listing photo for a real-estate portal."_ La phrase finale "The output MUST be rendered empty of all people, tools, and debris" doit devenir l'**avant-dernière** clause, séparée par un point, pour que l'attention du modèle ne la dilue pas dans "no furniture, no new fixtures". | Corrige #238 (personnes dans pass1). Confiance : **90%** — j'ai déjà validé empiriquement le pattern "STEP 1/2/3" avec bathroom v59, la même technique de canalisation d'attention marche aussi pour "anti-personne" si on la place en ouverture. |
| **P0-B** | `lib/generation-pipeline.ts` L272 (CLEANUP_V53) | **Retirer `water heaters, boilers` de la liste PRESERVE** et les ajouter à une nouvelle clause intermédiaire : _"HIDE OR REMOVE if aesthetically inappropriate: water heaters, boilers, exposed gas pipes. If removal is impossible (still in frame), cover the zone with the surrounding wall finish or leave as a clean recess."_ | Corrige #238 (infrastructure sous fenêtre droite) et #240 (ballon côté gauche). Confiance : **75%** — le modèle peut encore vouloir les garder, mais ne se sentira plus "obligé" par la liste PRESERVE. |
| **P0-C** | `lib/iteration-prompt.ts` L94 (buildAdjustResponsesPrompt) | Ajouter après la ligne "Before editing, mentally list every visible object" : _"No humans, no workers, no hands, no arms, no people should appear in the output, regardless of whether they were in the input. If the input contains any person, remove them and fill the vacated area with the surrounding surface texture."_ | Corrige #241 (personnes réintroduites en mode adjust). Confiance : **85%**. |
| **P0-D** | `lib/iteration-prompt.ts` L92 | Ajouter après "same camera angle" : _"Output aspect ratio, crop edges, and frame composition must match the input EXACTLY. Do not re-frame, do not widen, do not add visible areas beyond the input frame."_ | Corrige #241 (frame élargi, convecteur halluciné sous la fenêtre). Confiance : **70%**. |

### Priorité P1 (qualité — fix dans les 48h)

| # | Fichier:ligne | Changement précis | Impact attendu |
|---|---|---|---|
| **P1-A** | `lib/generation-pipeline.ts` L409 (PASS2_EQUIPMENT_V54) | Remplacer _"Do not place furniture blocking or covering any of these elements"_ par _"Do not place furniture in front of radiators, convectors, towel dryers, or accessible switches and outlets. Other wall equipment (electrical panels, fuse boxes, meters, water heaters) may be discreetly masked by tall furniture (sideboard, cabinet, tall plant, folding screen) if this improves the overall composition."_ | Permet au modèle de masquer les eyesores en pass 2 via mobilier haut (corrige #240 côté gauche). Confiance : **75%**. |
| **P1-B** | `lib/generation-pipeline.ts` L411 (PASS2_DENSITY_V54) | Ajouter en fin : _"If the input shows a visually awkward wall (exposed pipes, water heater, electrical meter, unfinished masonry), create a secondary furniture anchor in front of that wall to mask it — a tall cabinet, sideboard, or folding screen, scaled to cover the eyesore."_ | Renforce P1-A avec une directive positive de placement stratégique. Confiance : **70%**. |
| **P1-C** | `lib/room-types.ts` L82-83 (bathroom roomFurnitureOverride) | Ajouter en Step 1 après "no wall cabinet" : _"Step 1 does NOT remove anything that exists in the input. Existing towel dryers, convectors, radiators, and wall-mounted equipment stay exactly at their current positions."_ | Corrige #239 (sèche-serviettes + convecteur disparus en pass 2 bathroom narrow). Confiance : **85%**. |
| **P1-D** | `lib/generation-pipeline.ts` extractRoomInventory L73 | Ajouter au system prompt : _"If any wall equipment is visually awkward (water heater, exposed gas pipes, electrical meter behind the dining area), append a line: 'TO HIDE: [list]' — these are items to mask by placement of tall furniture in pass 2, not items to remove."_ Propager ce champ TO HIDE au builder pass 2 qui l'injecte dans le prompt. | Active une chaîne complète inventory→builder→masquage ciblé. Confiance : **60%** (nécessite modifs chaînées). |

### Priorité P2 (fidélité stylistique — backlog)

| # | Fichier:ligne | Changement précis | Impact attendu |
|---|---|---|---|
| **P2-A** | `StylePicker.tsx` / `style-resolver.ts` Scandinavian surfacePrompt | Préciser le PH5-style pendant : _"matte white tiered pendant 45cm diameter with 3 or 4 concentric horizontally layered shades, soft inner glow, PH5 artichoke-style silhouette"_ | Améliore la fidélité luminaire (plainte user #239). Confiance : **50%** — gpt-image-1.5 n'a probablement pas de connaissance fine du PH5 réel, mais la description silhouette peut aider. |

### Validation empirique — ce qui a marché en v59

- **STEP 1/2/3 hiérarchie conditionnelle bathroom** : validée par #239. Pattern à **propager** aux autres room types (dining, bedroom) quand une logique dimensionnelle s'impose. Hypothèse @ia R2 confiance → **85%**.
- **Exception conditionnelle sur equipment preservation en mode adjust** (v58 P0-2) : le ballon a été retiré dans #241 comme demandé. Cette technique marche bien → à réutiliser.
- **CLEANUP_V53 pour construction debris (ladders, buckets, tools)** : **échec partiel** — les ladders sont préservées dans #238 et #240 quand elles sont **en contact visuel proche** avec du PERMANENT. Il faut découpler.

### Notes finales

**Moyenne Lucas v59 sur ce batch : 5.1/10**. C'est en-dessous du seuil GO (7/10). **Recommandation @ia / fondateur : NO-GO v59 en prod**, déployer v60 avec P0-A, P0-C, P0-D (minimum viable) avant la prochaine démo marchand de biens. P0-B et P1-A/B devraient suivre dans les 24h.

**Timing** : P0-A/C/D sont des changements de texte de prompt, implémentables en ~15 minutes + tests. P0-B nécessite un repositionnement structurel de CLEANUP_V53 (~30 min). P1-D (inventory TO HIDE) est un chantier plus lourd (~1-2h avec tests).

**Audit Yann recommandé** pour cross-validation des notes fidélité stylistique maximalist #240 et scandinavian #238 — je ne me prononce pas sur la fidélité des silhouettes mobilier maximalist (ce n'est pas mon expertise principale).

