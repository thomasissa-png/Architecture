# Audit v48 Japandi Salon -- Lucas Moreau
**Date** : 2026-04-05 | **Version builders** : v48 | **Modele** : gpt-image-1.5
**Generations** : #165/#166 (gen 1) + #167/#168 (regeneration)
**Input** : chantier brut ~25m2, placo non peint, chape beton, cables pendants, boitiers electriques

---

## ALERTE : DISTRIBUTION SPATIALE INSUFFISANTE -- mobilier concentre au centre/premier plan

Les 2 generations souffrent du meme defaut fondamental : le mobilier forme un ilot compact au centre de la piece, laissant ~40% de la surface au sol completement vide (arriere, lateral gauche). La directive "distribute across full depth" n'est PAS respectee.

---

## Generation 1 (#166) -- Japandi salon

**Preservation spatiale : 7/10**
- Angle de vue : modifie. L'input est un grand-angle rasant (~16mm equivalent) avec forte convergence des lignes de plafond. L'output est recadre en format carre avec un angle plus redresse, presque frontal. Le coin gauche est tronque.
- Proportions : la piece parait plus petite et plus cubique que l'input rectangulaire allonge.
- Murs/coins : le decrochement mural gauche (pilier/retour) est simplifie en niche decorative. Structure modifiee.
- Plafond : la geometrie est globalement preservee (irregularites de placo conservees), acceptable.
- Fenetres/portes : aucune dans l'input, aucune dans l'output -- correct.
- Boitiers electriques : nettoyes -- correct.

**Diagnostic espace (FOCUS)**
- Zone premier plan : canape 3 places + table basse noire + coussin zafu -- tout concentre dans un carre ~3x3m
- Zone arriere (mur du fond) : VIDE. Zero mobilier. Zero accessoire. Mur blanc nu.
- Zone laterale droite : VIDE. Un vase au sol, rien d'autre.
- Zone laterale gauche : niche avec bonsai, mais c'est du decor mural, pas du mobilier spatial.
- Groupe secondaire en profondeur : ABSENT. Aucune console, aucune lampe, aucun fauteuil d'appoint au fond.
- Densite : ~30% de la surface meublee -- coherent Japandi mais mal repartie (tout au centre, rien aux extremites).

**Note technique : 6.2/10**

| Critere | Note | Commentaire |
|---|---|---|
| Preservation spatiale (x3) | 5/10 | Angle modifie, format carre au lieu de paysage, piece rapetissee |
| Contraintes lumiere | 7/10 | Eclairage diffus coherent, pas de warm shift excessif |
| Vocabulaire photo | 6/10 | Rendu CGI-clean, zero grain, trop lisse |
| Structure prompt | 5/10 | Distribution profondeur non respectee, tout au centre |
| Negative prompting | 8/10 | Pas de fenetre hallucinee, pas de rideaux |
| Compatibilite multi-modeles | N/A | Mono-modele v48 |
| Coherence I/O | 4/10 | Ratio paysage input -> carre output. Perte de format. |
| Richesse descriptive | 7/10 | Mobilier bien identifie Japandi (daybed, washi pendant, zafu) |
| Adaptabilite conditions | 7/10 | Chantier brut -> interieur fini, transformation correcte |
| Rendu final credible (x2) | 6/10 | Composition catalogue, pas photo immobiliere pro. Piece sous-meublee. |

**Moyenne ponderee : (15+7+6+5+8+0+4+7+7+12) / 14 = 5.1/10** -- CAPpee a 5.0 (preservation < 7)

---

## Generation 2 (#168) -- Japandi salon (regeneration)

**Preservation spatiale : 7.5/10**
- Angle de vue : mieux que #166. Plus proche du grand-angle original, la profondeur est mieux rendue.
- Proportions : le coin droit et le decrochement mural sont mieux preserves. La piece parait plus spacieuse.
- Plafond : geometrie acceptable, legere simplification du placo.
- Format : toujours carre au lieu de paysage -- meme probleme I/O.

**Diagnostic espace (FOCUS)**
- Zone premier plan : canape + table basse en frene + coussin sol -- meme schema que #166.
- Zone arriere droite : une table d'appoint ronde avec theiere + orchidee. C'est le SEUL element en profondeur. Mieux que #166 mais insuffisant.
- Zone arriere gauche : VIDE. Le mur du fond cote gauche n'a rien.
- Zone laterale : VIDE.
- Groupe secondaire : un gueridon -- c'est un debut, mais un seul meuble ne constitue pas une zone secondaire. Il manque un fauteuil bas, une lampe au sol, ou une console le long du mur arriere.
- Densite : ~35% -- legerement meilleure repartition que #166.

**Note technique : 6.8/10**

| Critere | Note | Commentaire |
|---|---|---|
| Preservation spatiale (x3) | 7/10 | Meilleur angle, proportions plus fideles, format toujours faux |
| Contraintes lumiere | 7.5/10 | Light falloff naturel, pas de HDR artificiel |
| Vocabulaire photo | 6/10 | Toujours CGI-clean, zero grain |
| Structure prompt | 6/10 | Un element en profondeur (gueridon), mais insuffisant |
| Negative prompting | 8/10 | Propre, pas d'hallucination |
| Compatibilite multi-modeles | N/A | Mono-modele |
| Coherence I/O | 4/10 | Ratio casse (paysage -> carre) |
| Richesse descriptive | 7.5/10 | Palette tonale coherente, mobilier plus varie |
| Adaptabilite conditions | 7/10 | Bonne gestion du chantier brut |
| Rendu final credible (x2) | 7/10 | Plus convaincant que #166, composition plus aeree |

**Moyenne ponderee : (21+7.5+6+6+8+0+4+7.5+7+14) / 14 = 5.8/10**

---

## Variete resolveChooseOne

Les 2 outputs sont tres similaires : meme canape beige a gauche, meme position, meme pendant washi, meme table basse au centre. La palette varie legerement (frene clair #168 vs noir mat #166 pour la table basse, teinte du tapis). Le layout spatial est quasi identique. La variete est FAIBLE -- resolveChooseOne ne produit pas assez de diversite de composition.

## Diagnostic global -- le fondateur a raison

Le probleme est clair : le modele compose comme un photographe de catalogue -- un ilot central bien cadre, fond vide. La directive "distribute across full depth" est soit ignoree soit trop faible dans le prompt v48. Sur une piece de ~25m2 sans cloison, il y a largement la place pour :
- Un fauteuil bas Wegner-style dans le coin arriere droit
- Un lampadaire Akari au sol pres du mur du fond
- Une console basse (tansu-style) le long du mur gauche

**P0** : Renforcer la directive de distribution spatiale -- la rendre NON conditionnelle sur les pieces > 20m2. Formuler : "Place at least ONE furniture group in the back third of the room".
**P0** : Fix ratio I/O -- l'input est paysage (~4:3), l'output est carre (1:1). Le parametre size n'est pas propage correctement.
**P1** : Renforcer la variete resolveChooseOne -- les 2 generations ont le meme layout. Le canape devrait changer de position ou de mur entre les 2.
**P2** : Ajouter grain ISO 200 + micro-vignettage -- le rendu est trop lisse pour passer pour une photo DSLR.
