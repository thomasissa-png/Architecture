# Audit complet v45 Production -- Lucas Moreau
**Date** : 2026-04-04 | **Modele** : gpt-image-1.5 | **Style** : Scandinavian | **6 operations, 5 reussies**

---

## #150 -- Passe 1 (surfaces) -- Chantier brut vers piece finie

**Input** : piece en chantier, placoplatre brut, cables electriques pendants, sol beton brut, aucune fenetre, aucun luminaire.
**Output (pass1)** : murs lisses blancs, parquet chene clair large lame, suspension PH5-style blanche, radiateur blanc mur gauche.

| Critere | Note | Commentaire |
|---|---|---|
| Preservation spatiale (x3) | 8/10 | Angle identique. Le decrochement mural central (pilier/retrait entre les 2 zones) est fidele. Proportions piece respectees. Plafond : la legere irregularite de bande de joint est conservee en texture subtile. Pas de fenetre hallucinee. |
| Lumiere | 8/10 | Direction de lumiere coherente (source diffuse du haut-gauche). Pas de warm shift. Temperature neutre-froide conservee. |
| MIME/resolution | 9/10 | Ratio paysage conserve. Pas de banding, pas de compression visible. |
| Artefacts IA | 7/10 | Transition mur-plafond legerement trop nette cote droit. Le radiateur ajoute est propre mais sa position (mur gauche bas) n'existait pas dans l'input -- c'est un ajout intelligent du modele, pas une hallucination (coherent avec le style). |
| Photorealisme | 8/10 | Rendu lisse et propre (conforme directive fondateur anti-grain). Le parquet a un grain de bois credible. Le pendant PH5 est bien forme. |
| Edit effectif | 9/10 | Le modele a edite, pas regenere. Preuve : le decrochement mural central, la forme exacte du plafond, et la perspective sont IDENTIQUES a l'input. |
| Surfaces ready | 9/10 | Piece vide, propre, prete pour passe 2. Cables nettoyes. Boitiers electriques couverts. Zero meuble. |

**Note passe 1 #150 : 8.2/10** -- Excellente transformation chantier vers piece finie.

---

## #151 -- Passe 2 (mobilier) sur pass1 de #150

**Source** : pass1 #150 (piece finie vide). **Output** : canape beige 3 places, fauteuil wing-back gris, table basse ronde blanche/bois, etagere echelle bois, tapis creme, coussin bleu accent, plaid beige.

| Critere | Note | Commentaire |
|---|---|---|
| Preservation spatiale (x3) | 9/10 | Angle strictement identique a la pass1. Murs, decrochement, plafond, radiateur : tout est preserve. Zero fenetre hallucinee. |
| Coherence pass1-pass2 | 9/10 | Surfaces IDENTIQUES. Couleur murs, parquet, suspension PH5 : rien n'a change. Les ombres du mobilier sont coherentes avec l'eclairage de la pass1. |
| Artefacts IA | 7/10 | Legere zone de transition floue sous le canape (pied gauche). Le galet decoratif au sol semble flotter legerement. |
| Photorealisme | 8/10 | Ombres portees presentes et coherentes. Le tissu du canape a une texture credible. Le bois de l'etagere echelle est realiste. |
| Distribution profondeur | 7/10 | Le mobilier est concentre au centre-avant. L'arriere de la piece (zone derriere le decrochement) reste vide. Pas de zone secondaire exploitee. |
| Densite/style | 8/10 | Scandinave credible. Palette beige/blanc/bois/bleu accent. Densite correcte pour le style (pas de surcharge). |

**Note passe 2 #151 : 8.1/10** -- Pipeline complet solide. Distribution en profondeur a ameliorer.

---

## #147/#148 -- Generation complete (autre angle, meme piece)

**Input #147** : meme piece chantier que #150, angle tres legerement different (un peu plus large, un peu plus bas).
**Output #148** : composition quasi identique a #151 -- canape beige, fauteuil wing-back, table basse ronde, etagere echelle, tapis creme, coussin bleu.

| Critere | Note | Commentaire |
|---|---|---|
| Preservation spatiale (x3) | 8/10 | Angle conserve. Le decrochement mural est preserve. Proportions fideles. Le mur du fond parait legerement plus eloigne que dans l'input (etirement subtil de la profondeur). |
| Variete vs #151 | 4/10 | **ALERTE : composition quasi identique a #151.** Meme canape, meme fauteuil, meme table, meme etagere, meme tapis, meme coussin bleu. La seule difference : positionnement legerement decale. Le modele reproduit le meme "template" scandinave. |
| Artefacts IA | 7/10 | Pied du canape cote droit un peu fondu dans le tapis. Ombres portees presentes mais legerement plus douces que dans #151. |
| Photorealisme | 8/10 | Meme qualite que #151. Rendu propre, pas de marqueurs IA evidents. |
| Distribution profondeur | 6/10 | Encore plus concentre au premier plan qu'en #151. Toute la zone arriere (derriere le decrochement) est un desert. |

**Note #148 : 7.4/10** -- Correcte, mais la variete est insuffisante. Deux generations du meme style sur la meme piece = les memes meubles.

---

## #152 -- Surfaces uniquement (loft double hauteur, withFurniture=false)

**Input** : loft industriel en chantier brut -- mezzanine beton, poteaux porteurs, baies vitrees double hauteur (6+ fenetres), sol beton, poutres apparentes, cables. Espace TRES complexe.
**Output** : murs blancs, parquet chene clair, poutres blanchies, suspension PH5-style, baies vitrees conservees.

| Critere | Note | Commentaire |
|---|---|---|
| Preservation spatiale (x3) | 7/10 | Structure porteuse (poteaux, mezzanine, baies vitrees) conservee. Le nombre de fenetres est CORRECT (toutes preservees). MAIS : les poteaux beton brut sont lisses/blancs -- ils ont perdu leur texture brute. La mezzanine a ete "nettoyee" (beton brut devenu plaque blanche). L'angle de vue et la profondeur sont fideles. |
| Lumiere | 8/10 | Le contre-jour des baies vitrees est preserve. La zone surexposee (fenetre droite) est conservee. Pas de HDR artificiel. |
| Artefacts IA | 6/10 | La jonction mezzanine/plafond est simplifiee -- les poutres IPN sont devenues des lames blanches generiques. Le mur du fond sous la mezzanine a perdu sa texture beton/brique. |
| Texture structures | 5/10 | Les poutres sont trop lissees. Le beton brut des poteaux est devenu blanc mat uniforme. La directive "preserve rough texture, irregular edges, patina" n'a pas ete respectee. |
| Surfaces ready | 8/10 | Piece vide, propre, utilisable pour une passe 2. Le parquet et le pendant sont bien places. |

**Note #152 : 7.0/10** -- La geometrie est preservee mais les textures structurelles sont trop nettoyees. Sur un espace aussi brut et complexe, c'est un resultat honorable mais perfectible.

---

## #153 -- Iteration adjust (sur #151 meuble)

**Source** : #151 (piece meublee scandinave). **Output** : meme scene, le fauteuil wing-back est remplace par un canape 2 places gris.

| Critere | Note | Commentaire |
|---|---|---|
| Preservation spatiale (x3) | 9/10 | Angle identique. Murs, plafond, decrochement, radiateur : tout preserve. |
| Edition chirurgicale | 7/10 | Le fauteuil a ete remplace par un canape 2 places gris -- modification visible et coherente. MAIS : le canape principal a legerement change de teinte (un peu plus gris qu'en #151). Le tapis a une texture legerement differente. Ce n'est pas une regeneration complete mais ce n'est pas non plus une edition pixel-precise. |
| Surfaces locked | 8/10 | Murs et sol identiques. Suspension preservee. Pas de derive de surfaces. |
| Coherence | 8/10 | La composition reste scandinave et credible. Le 2e canape gris fonctionne bien dans l'espace. |

**Note #153 : 8.0/10** -- L'adjust fonctionne. Le remplacement du fauteuil par un canape est effectif. Leger drift colorimetrique sur les meubles existants (teinte canape principal).

---

## Synthese v45

| # | Type | Note | Verdict |
|---|---|---|---|
| #150 | Passe 1 surfaces | 8.2/10 | PASS |
| #151 | Passe 2 mobilier | 8.1/10 | PASS |
| #148 | Pipeline complet | 7.4/10 | PASS (variete faible) |
| #152 | Surfaces loft | 7.0/10 | PASS (textures lissees) |
| #153 | Iteration adjust | 8.0/10 | PASS |

**Moyenne v45 : 7.74/10** -- Progression notable vs v38 (5.8/10). Le pipeline 2 passes fonctionne.

---

## Top 5 recommandations techniques (P0-P4)

**P0 -- Variete de composition** : deux generations du meme style sur la meme piece (#148 vs #151) produisent des meubles quasi identiques. Le modele a un "template scandinave" fige. Ajouter un seed aleatoire ou varier le furniturePrompt avec des alternatives (ex: rotation entre 2-3 sets de mobilier par style).

**P1 -- Preservation texture structures brutes** : sur le loft #152, les poutres IPN, poteaux beton et mezzanine ont ete lissees/blanchies. Renforcer : "structural elements (beams, columns, mezzanine edges) must keep their original surface material and texture -- do not paint or smooth them unless the surfacePrompt explicitly says so."

**P2 -- Distribution profondeur zone secondaire** : les 2 generations meublees (#148, #151) concentrent tout au premier plan. La zone arriere (derriere le decrochement) est vide. La directive conditionnelle existe mais ne prend pas sur cet espace. Tester un ancrage explicite : "place at least one piece of furniture in the back area visible behind any architectural recess."

**P3 -- Drift colorimetrique en iteration** : l'adjust #153 modifie legerement la teinte du canape principal (beige vers gris-beige). Ajouter dans le builder adjust : "all furniture NOT mentioned in the user request must maintain their EXACT color and texture."

**P4 -- Poteaux porteurs : finition vs structure** : le modele traite les poteaux beton comme des "surfaces a finir" au lieu de "structures a preserver". Ajouter une distinction explicite : "load-bearing columns and beams are STRUCTURE, not surfaces -- preserve their material unless the style description says otherwise."

---

*Lucas Moreau -- Expert IA Image -- 2026-04-04*
*Grille : preservation spatiale x3, rendu x2, 10 criteres*
*Modele audite : gpt-image-1.5 via Responses API*
