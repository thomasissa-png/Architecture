# Audit visuel — Lucas Moreau, Expert IA Image

**Date** : 2026-04-01
**Prompt version auditee** : v36
**Dernier audit visuel** : #37-42 (2026-03-26)
**Generations cibles** : #94 et #95 (Maximalist, meme image input)
**Modele primaire** : GPT-4.1 Responses API (gpt-image-1 via IMAGE_MODEL)
**Fallback Flux passe 2** : DESACTIVE (Sprint 22, #41/#42)
**Format** : Portrait 1024x1536

---

## Metadata des generations

| # | Style | Format | Duree | Modele | Room type |
|---|-------|--------|-------|--------|-----------|
| 95 | Maximalist | 1024x1536 portrait | 157s | GPT-4.1 (gpt-image-1) | non specifie |
| 94 | Maximalist | 1024x1536 portrait | 147s | GPT-4.1 (gpt-image-1) | non specifie |

Les deux generations partagent la **meme image input** — un chantier brut en cours de renovation, ce qui permet une comparaison directe de la reproductibilite du pipeline.

---

## Description de l'input (commune aux 2 generations)

Piece en chantier brut, format portrait. Caracteristiques architecturales :
- **Poutres apparentes** au plafond (beton/bois, non finies, avec traces de coffrage)
- **Neon tube fluorescent** au plafond (eclairage de chantier)
- **Ballon d'eau chaude** mural visible au fond a droite
- **Murs** : enduit brut, platre non fini, traces de maconnerie (pierre apparente a droite)
- **Sol** : chape brute avec traces de decoupe/ragrage
- **Fenetre** a gauche (sombre, chassis fonce) + ouverture/porte au fond
- **2 personnes** debout au fond de la piece (ouvriers)
- **Echelle pliante** a gauche
- **Cables electriques** visibles, boitier de derivation mural
- **Luminosite** : faible, eclairage artificiel dominant (neon), lumiere naturelle limitee cote fenetre

Conditions difficiles : chantier actif, personnes presentes, eclairage mixte neon/naturel, surfaces non finies partout.

---

## Generation #95 — Maximalist (chambre enfant)

### Description de l'output

Le modele a interprete la piece comme une **chambre d'enfant maximaliste**. Composition :
- **Mur accent** teal/bleu-vert profond sur le mur du fond (conforme au surfacePrompt)
- **Sol** : parquet bois fonce (conforme : "polished dark wood flooring")
- **Poutres** : conservees en bois sombre, simplifiees mais presentes
- **Plafond** : blanc, geometrie globale preservee
- **Luminaire** : lustre sculptural en laiton avec elements en verre colore (conforme au surfacePrompt)
- **Mobilier** : lit enfant avec couvre-lit patchwork multicolore, armoire decoree, etagere coloree, table + chaise enfant, tapis persan + tapis floral
- **Accessoires** : peluche lapin dans panier, girafe decorative, livres, petite lampe de table
- **Fenetres** : 2 fenetres avec stores noirs (chassis coherents avec l'input)

### Problemes identifies

1. **CORRECTION : chambre enfant BIEN demandee** — le furniturePrompt de cette generation etait "Children bedroom furniture: single bed 90cm wide..." et non le furniturePrompt salon standard. Le modele a correctement suivi le brief. Ce n'est PAS une hallucination de programme.

2. **Fenetre hallucinee** — l'input montre 1 fenetre a gauche et 1 ouverture au fond. L'output montre 2 fenetres sur le mur droit qui n'existaient pas. Violation directe de "same number of windows and doors."

3. **Personnes supprimees** — les 2 ouvriers ont disparu. C'est acceptable en home staging mais non documente dans le prompt. Le modele a pris cette decision seul.

4. **Poutres lissees** — les poutres de l'input (brutes, irregulières, traces de coffrage) sont devenues des poutres lisses en bois peint. La texture d'origine est perdue. CEILING_PRESERVATION dit "Beams keep 3D shape but receive clean painted finish" — le modele a applique la lettre mais pas l'esprit (la 3D est la, la texture non).

5. **Eclairage completement reinterprete** — l'input est eclaire par un neon tube avec lumiere froide rasante. L'output montre un eclairage warm ambiant diffus, sans trace du neon ni de sa direction. Warm color shift flagrant malgre la directive "No warm tint or yellow cast."

6. **Echelle ballon d'eau chaude** — le ballon mural a completement disparu. La directive EQUIPMENT_PRESERVATION ("Keep all wall-mounted equipment visible") n'est pas dans le builder passe 1, seulement en passe 2. En passe 1, la piece est "completely empty" mais les equipements fixes devraient rester.

7. **Format et ratio** : portrait 1024x1536 — conforme a l'input.

### Notation #95

| # | Critere | Poids | Note /10 | Justification |
|---|---------|-------|----------|---------------|
| 1 | Preservation architecturale | x2 | 4.0 | 2 fenetres hallucinées. Poutres lissees. Angle global approximativement preserve mais proportion de la piece modifiee. |
| 2 | Contraintes lumiere | x1 | 3.0 | Warm shift massif. Direction lumiere completement changee (neon froid → ambiance warm diffuse). |
| 3 | Vocabulaire photo | x1 | 7.0 | Rendu photo-credible, grain present, DOF coherent f/8. Vignettage subtil visible. |
| 4 | Structure prompt | x1 | 7.0 | CORRIGE : le furniturePrompt demandait bien une chambre enfant. Lit, table de chevet, tapis de jeu, rangement bas — conformes au brief. |
| 5 | Negative prompting | x1 | 4.0 | Fenetres hallucinées malgre "same number of windows and doors". Wall art present (cadres au mur) malgre "freestanding only". |
| 6 | Compatibilite multi-modeles | x1 | 5.0 | Mono-modele GPT-4.1. Pas de comparaison possible. Note neutre. |
| 7 | Coherence I/O | x1 | 8.0 | Format portrait preserve. Dimensions conformes. |
| 8 | Richesse descriptive | x1 | 7.0 | Le furniturePrompt chambre enfant est adequat (lit, table de chevet, tapis, rangement). Moins riche que le prompt salon mais adapte au programme. |
| 9 | Adaptabilite conditions | x1 | 5.0 | Conditions chantier difficiles (personnes, neon, enduit brut). Le modele a "resolu" en regenerant completement la scene au lieu d'editer. |
| 10 | Rendu final credible | x2 | 6.5 | L'image finale est credible en tant que photo de chambre enfant maximaliste. Les fenetres hallucinees et le warm shift reduisent la note. |

**Note ponderee #95 (corrigee)** : (4.0x2 + 3.0 + 7.0 + 7.0 + 4.0 + 5.0 + 8.0 + 7.0 + 5.0 + 6.5x2) / 14 = **5.7/10**

---

## Generation #94 — Maximalist (salon)

### Description de l'output

Le modele a interprete la piece comme un **salon maximaliste**. Composition :
- **Mur accent** teal/bleu-vert profond sur le mur du fond (conforme au surfacePrompt)
- **Murs lateraux** : blanc chaud/off-white (conforme)
- **Sol** : parquet bois fonce (conforme)
- **Plafond** : blanc, poutre visible sous forme de retombee — geometrie simplifiee mais trace des structures preservee
- **Luminaire** : lustre sculptural en laiton avec elements en verre colore (conforme)
- **Mobilier** : canape velours bleu cobalt profond (conforme au furniturePrompt), table basse ronde corail sur cadre laiton (conforme), lampadaire en laiton avec dome cuivre
- **Accessoires** : monstera dans pot ceramique colore (conforme), cadres poses au sol contre le mur (conforme), bougies pilier sur plateau laiton (conforme)
- **Tapis** : tapis persan vintage + tapis graphique chevron noir/blanc (conforme — "layered rugs mixing vintage Persian and contemporary bold graphic")
- **Fenetre** : 1 fenetre a gauche avec chassis noir (conforme a l'input)

### Problemes identifies

1. **Fidele au furniturePrompt** — contrairement a #95, cette generation respecte le programme. Canape cobalt 230cm, table basse corail, monstera, cadres au sol, tapis superposes. C'est une execution correcte du Maximalist tel que defini.

2. **Angle de vue modifie** — l'input est pris depuis l'entree face au fond de la piece. L'output a un angle plus ouvert, presque de biais, avec une perspective qui suggere un recul de camera et un pivotement leger vers la gauche. Les lignes de fuite ne correspondent pas exactement.

3. **Proportions de piece modifiees** — la piece semble plus haute et plus etroite dans l'output. Le plafond parait plus haut que dans l'input (effet du mur teal qui "pousse" visuellement). La fenetre parait plus grande.

4. **Poutres simplifiees** — les poutres brutes de l'input sont reduites a une retombee de plafond lisse. Mieux que #95 (la forme est la) mais la texture originale est perdue.

5. **Warm color shift modere** — l'output a une teinte globale plus chaude que l'input. Moins severe que #95 (pas de warm orange) mais le mur off-white tire vers le beige. La fenetre laisse entrer une lumiere verdatre qui n'etait pas presente dans l'input (lumiere naturelle inventee/amplifiee).

6. **Personnes et equipements supprimes** — ouvriers, ballon d'eau chaude, echelle, cables tous supprimes. Acceptable pour le staging mais le ballon d'eau chaude est un equipement fixe qui aurait du etre preserve.

7. **Cadres au sol = conforme au prompt** — le furniturePrompt dit explicitement "framed art prints propped on floor against baseboard". Cela respecte "freestanding only" car les cadres sont poses, pas accroches.

8. **Wall art** — un cadre visible accroche au mur a droite. Violation de "freestanding only" mais mineur.

### Notation #94

| # | Critere | Poids | Note /10 | Justification |
|---|---------|-------|----------|---------------|
| 1 | Preservation architecturale | x2 | 5.5 | Angle modifie (pivotement gauche). Proportions piece alterees (plus haute). Poutres simplifiees. 1 fenetre preservee (correcte). Pas de fenetre hallucinee. |
| 2 | Contraintes lumiere | x1 | 5.0 | Warm shift modere. Direction lumiere reinterpretee (lumiere fenetre amplifiee). Neon d'origine completement supprime. |
| 3 | Vocabulaire photo | x1 | 8.0 | Excellent rendu photographique. Grain visible, DOF profond coherent f/8, vignettage naturel aux coins. Pas de rendu CGI-clean. |
| 4 | Structure prompt | x1 | 7.5 | Le furniturePrompt est respecte : canape cobalt, table corail, monstera, cadres au sol, tapis superposes, lampadaire laiton. Le mur teal est conforme. |
| 5 | Negative prompting | x1 | 7.0 | Pas de fenetre hallucinee. 1 cadre mural (mineur). Pas de rideaux. |
| 6 | Compatibilite multi-modeles | x1 | 5.0 | Mono-modele. Note neutre. |
| 7 | Coherence I/O | x1 | 8.0 | Format portrait preserve. Dimensions conformes. |
| 8 | Richesse descriptive | x1 | 8.0 | La richesse du furniturePrompt se retrouve dans le rendu : superposition tapis, variete textures, palette teal/cobalt/corail/laiton. |
| 9 | Adaptabilite conditions | x1 | 6.0 | Chantier brut transforme en interieur fini. Les conditions difficiles (neon, personnes, enduit brut) sont gerees — le resultat est propre. Mais la transformation est trop radicale (regeneration plus que edition). |
| 10 | Rendu final credible | x2 | 7.5 | Image credible comme photo immobiliere Maximalist. Les couleurs sont audacieuses mais coherentes. Le mobilier est a l'echelle. Les ombres de contact sont presentes. Un acheteur potentiel se projetterait. |

**Note ponderee #94** : (5.5x2 + 5.0 + 8.0 + 7.5 + 7.0 + 5.0 + 8.0 + 8.0 + 6.0 + 7.5x2) / 14 = **6.7/10**

---

## Comparaison #94 vs #95

| Critere | #94 | #95 | Delta |
|---------|-----|-----|-------|
| Preservation architecturale | 5.5 | 4.0 | #94 +1.5 |
| Contraintes lumiere | 5.0 | 3.0 | #94 +2.0 |
| Structure prompt (fidelite) | 7.5 | 3.0 | #94 +4.5 |
| Rendu final credible | 7.5 | 6.5 | #94 +1.0 |
| **Note ponderee** | **6.7** | **5.1** | **#94 +1.6** |

**Constats cles** :
- **Reproductibilite faible** : meme input, meme style, 2 resultats radicalement differents (chambre enfant vs salon). L'ecart de 1.6 points est significatif. GPT-image-1 a une variance elevee sur les pieces brutes de chantier.
- **#94 est nettement meilleur** : respect du furniturePrompt, pas de fenetres hallucinées, rendu credible.
- **#95 est un echec fonctionnel** : programme ignore (chambre enfant au lieu de salon), fenetres inventees, warm shift severe.

---

## Diagnostic technique

### Cause racine de la variance

L'image input est un **chantier brut avec personnes** — un des cas les plus difficiles pour le pipeline. Le modele doit :
1. Supprimer les personnes (non documente dans le prompt)
2. Finir les surfaces (chape → parquet, enduit → peinture)
3. Supprimer les equipements de chantier (echelle, neon)
4. Ajouter le mobilier style

C'est une **transformation lourde** sur 2 passes. Le modele a plus de latitude creative, ce qui amplifie la variance. Quand le delta entre input et output est trop grand, le modele "regenere" au lieu d'"editer" — confirmant l'apprentissage Sprint 11.

### CORRECTION : #95 avait un furniturePrompt chambre enfant

Le furniturePrompt de #95 etait "Children bedroom furniture: single bed 90cm wide with simple headboard and colorful bedlinen, one bedside table 40cm wide..." — le modele a correctement suivi ce brief. Il ne s'agit PAS d'une substitution de programme. Les 2 generations avaient des furniturePrompts differents (#94 = salon Maximalist, #95 = chambre enfant).

---

## Plan d'amelioration

### P0 — Critique (a corriger immediatement)

**Rien de P0** — le pipeline fonctionne. Les problemes sont de l'ordre de l'optimisation, pas du blocage.

### P1 — Haute priorite

1. **CORRIGE : l'ancrage programme n'est plus P1** — le modele a suivi le bon brief. Le roomType etait correct.

2. **Renforcer preservation poutres brutes** : dans CEILING_PRESERVATION, reformuler "Beams keep 3D shape but receive clean painted finish" en "Beams keep their 3D shape AND original surface texture. Apply painted finish ONLY if the input beams are already painted or smooth."

### P2 — Moyenne priorite

4. **Warm shift** : les 2 generations montrent un warm shift. La directive existe mais est en position tardive dans le prompt. Remonter "Do not add any warm tint or yellow cast" en position 3-4 dans le builder (juste apres l'action et le style).

5. **Equipements fixes en passe 1** : le builder passe 1 ne mentionne pas explicitement la preservation du ballon d'eau chaude. Ajouter "water heater" a la liste des equipements fixes : "Preserve all wall-mounted fixed equipment: radiators, heaters, water heaters, vents, thermostats, switches."

6. **Variance chantier brut** : sur les inputs de chantier avec personnes/equipements, envisager un pre-traitement prompt supplementaire : "This input photo shows an active construction site. Ignore workers, tools, ladders — stage the room as if construction is complete."

### P3 — Basse priorite

7. **Angle camera** : #94 montre un pivotement de l'angle. CAMERA_PRESERVATION est en fin de prompt (position 10/11). Dupliquer "Same camera angle" dans la premiere phrase : "Add furniture to this photo — keep the exact same camera angle."

8. **Coherence mur accent** : le mur teal est tres bien rendu mais le surfacePrompt dit "rich deep teal accent on the largest visible surface" — sur un chantier brut, le mur du fond est le plus grand visible. Verifier que c'est bien le mur du fond dans les 2 generations (oui — coherent).

### P4 — Amelioration future

9. **Seed/temperature** : investiguer si GPT-image-1 via Responses API supporte un parametre de seed ou de temperature pour reduire la variance entre generations identiques.

10. **Detection de personnes** : ajouter une etape de pre-traitement vision (GPT-4.1 vision sans generation) pour detecter si l'input contient des personnes et ajouter la directive de suppression automatiquement.

---

## Synthese

| Element | Statut |
|---------|--------|
| Generation #94 Maximalist | **6.7/10** — bonne fidelite au prompt, rendu credible, mais angle modifie et warm shift |
| Generation #95 Maximalist (chambre enfant) | **5.7/10** (corrige) — brief chambre enfant respecte, fenetres hallucinees, warm shift |
| Reproductibilite pipeline | **CORRECTE** — ecart 1.0 pt entre 2 briefs differents (salon vs chambre enfant), variance normale |
| Preservation architecturale | **MOYENNE** — poutres lissees, angle modifie, proportions alterees |
| Warm color shift | **PERSISTANT** — present dans les 2 generations malgre directive anti-warm |
| Vocabulaire photographique | **BON** — grain, DOF, vignettage presents, rendu photo credible |
| Respect du furniturePrompt | **BON** — les 2 generations suivent correctement leur brief respectif |

**Moyenne ponderee des 2 generations (corrigee)** : **6.2/10**

L'input chantier brut avec personnes reste un cas difficile. Les corrections prioritaires sont : preservation poutres brutes (P1), warm shift (P2), et equipements fixes en passe 1 (P2).

---

*Lucas Moreau — Expert IA Image*
*Audit visuel #94-95, 2026-04-01*
