# Audit visuel generations #97-98 -- Yann Duval, Architecte d'interieur

Date : 2026-04-02
Dernier audit precedent : #94-95 (2026-04-01)
Generations auditees : #97 Japandi (cuisine), #98 Iteration Japandi (cuisine)
Modele : GPT-4.1, prompt version v37
Pipeline : 2 passes (surfaces + mobilier)

---

## Contexte de l'input (#97)

La photo source montre une cuisine en chantier brut, format paysage :
- Murs en plaques de platre hydrofuge (vert) avec bandes de joint visibles, raccords de platre blanc
- Plafond en plaques de platre rose (BA13 coupe-feu) avec spots encastres non finis et trous de passage cables
- Sol : chape beton/ragrage sombre, irregulier
- UNE fenetre a gauche : double ouvrant, menuiserie blanche PVC, donnant sur l'exterieur avec vue sur batiments
- Radiateur sous la fenetre (convecteur bas)
- Arrivees d'eau et canalisations cuivre visibles au mur du fond (bas)
- Boitiers electriques bleus apparents sur le mur du fond
- UNE porte/ouverture a droite (passage vers piece adjacente)
- Angle de vue : frontal, legerement en plongee, camera centree sur le mur du fond
- Eclairage : lumiere naturelle depuis la fenetre gauche, ambiance froide/chantier

---

## Generation #97 — Japandi, cuisine (generation de base)

### Preservation spatiale (CRITERE N.1)

Analyse comparative input vs output :

- **Angle de vue** : FIDELE. Vue frontale sur le mur du fond, meme perspective legerement en plongee. Coherent.
- **Dimensions/proportions** : FIDELES. La piece conserve ses proportions rectangulaires, la largeur et la profondeur apparentes sont respectees.
- **Profondeur** : RESPECTEE. Le recul de la camera et la distance au mur du fond sont coherents.
- **Fenetre** : PRESERVEE. Une fenetre a gauche, meme position, meme taille. La menuiserie blanche est conservee. Le nombre de carreaux/ouvrants semble coherent.
- **Ouverture droite** : PRESERVEE. Le passage vers la piece adjacente est visible a droite, au meme emplacement.
- **Radiateur** : PRESERVE. Un radiateur bas est visible sous la fenetre, coherent avec l'input.
- **Forme des murs** : FIDELE. Les angles du mur du fond et les retours lateraux sont respectes.

**Bonne nouvelle** : le plafond montre des poutres en bois clair. L'input avait un plafond en BA13 rose SANS poutres. Ce sont des poutres INVENTEES par le modele. Neanmoins, dans le contexte Japandi, cela apporte une materialite credible et le plafond avait des bandes de joint suggerant une structure sous-jacente. C'est un ajout stylistique coherent mais techniquement c'est une modification structurelle non presente dans l'input. Je note ce point mais il n'est pas destructeur.

**Prises electriques et canalisations** : les boitiers bleus et les arrivees d'eau cuivre du mur du fond sont bien masques par les meubles de cuisine. Nettoyage reussi.

**Score preservation spatiale : 8/10** — Geometrie, angle, ouvertures fideles. Les poutres inventees penalisent legerement mais n'alterent pas la structure spatiale fondamentale.

### Grille 10 criteres

| # | Critere | Poids | Note /10 | Commentaire |
|---|---------|-------|----------|-------------|
| 1 | Preservation spatiale | x3 | 8 | Geometrie fidele, fenetres/portes preservees, radiateur present. Poutres inventees (pas dans l'input). |
| 2 | Fidelite stylistique | x2 | 8.5 | Japandi bien capture : bois clair (frene/bouleau), formes epurees, luminaire Akari-style (globe en papier), harmonie monochrome beige/bois. La douceur organique est presente. |
| 3 | Eclairage | x1 | 7.5 | Lumiere naturelle depuis la fenetre gauche preservee. Leger warm shift par rapport a l'ambiance froide de chantier — acceptable car les murs blancs et bois clair refletent plus. Les ombres sont coherentes. |
| 4 | Hero pieces | x1 | 8 | Luminaire Akari-style spherique — parfaitement Japandi (Isamu Noguchi). Credence blanche fine. Robinetterie laiton. Meuble de cuisine en frene clair avec poignees discretes en laiton. Four encastre. Bonne selection. |
| 5 | Coherence matieres | x1 | 8.5 | Bois clair + laiton + blanc mat + carrelage gris au sol. Palette coherente et harmonieuse. Le carrelage gris au sol est un bon choix pour une cuisine Japandi. |
| 6 | Credibilite pro | x2 | 8 | Oui, c'est montrable a un client. La cuisine lineaire est credible, les proportions de meubles sont realistes, l'ensemble fait "dossier de presentation archi". Le four, l'evier, la planche a decouper en bois ronde, les fruits — tout ancre la scene dans le reel. |
| 7 | Completude | x1 | 7.5 | Il manque un plan de travail plus lisible (comptoir/ilot) pour une cuisine fonctionnelle, mais sur cet espace lineaire c'est coherent. Un petit pot de plante verte est visible sur le rebord de fenetre — bien. Le torchon en lin au sol ajoute une touche "lived-in". |
| 8 | Vocabulaire visuel | x1 | 8 | Materiaux bien rendus : grain du bois visible, laiton mat, carrelage gris avec joints fins. Textures credibles. |
| 9 | Adaptabilite spatiale | x1 | 8 | Cuisine lineaire adaptee a la largeur de la piece. Les meubles hauts ne saturent pas l'espace. Bonne aeration. La densite est correcte pour du Japandi (espace respirable). |
| 10 | Potentiel photorealiste | x1 | 7.5 | Tres bon niveau. Les reflexions sur le four, le grain du bois, la lumiere sur le plan de travail sont convaincants. Legere impression "trop propre" — le grain ISO et le vignettage pourraient etre plus marques. |

**Calcul note ponderee** :
(8x3 + 8.5x2 + 7.5x1 + 8x1 + 8.5x1 + 8x2 + 7.5x1 + 8x1 + 8x1 + 7.5x1) / 14
= (24 + 17 + 7.5 + 8 + 8.5 + 16 + 7.5 + 8 + 8 + 7.5) / 14
= 112 / 14
= **8.0/10**

**Verdict #97 : Bonne generation.** L'espace est respecte, le style Japandi est bien capture avec des hero pieces credibles (Akari, bois clair, laiton). Les poutres inventees sont le seul bémol structurel. C'est un rendu que je montrerais a un client pour une presentation de direction artistique.

---

## Generation #98 — Iteration Japandi (commentaire : "enlever quelque chose sur le sol")

### Comparaison #97 output vs #98 output — ANALYSE CRITIQUE

Le commentaire utilisateur etait : "Il y a quelque chose sur le sol que j'aimerais bien enlever" — probablement le torchon en lin pose au sol dans #97.

**Ce qui a ete fait** : le torchon a effectivement ete retire du sol. Objectif atteint sur ce point.

**ALERTE : L'iteration a SEVEREMENT DEGRADE la generation de base.** Comparaison point par point :

1. **Cuisine butcher-block/four/evier** : dans #97, on avait une cuisine lineaire complete avec four encastre noir, evier avec robinet laiton, credence blanche, meubles hauts et bas distincts. Dans #98, la cuisine est SIMPLIFIEE de maniere dramatique — les meubles hauts deviennent un seul bloc monolithique plein (type placard), le four a DISPARU, l'evier est a peine visible, la credence est supprimee. Le plan de travail est reduit. C'est une regression majeure.

2. **Meubles hauts** : dans #97, meubles hauts avec 4 portes bien proportionnees au-dessus du plan de travail, avec un espace de credence visible. Dans #98, un MUR de bois plein du sol au plafond cote gauche, sans articulation ni ouverture. La hierarchie meuble bas / credence / meuble haut est detruite.

3. **Accessoires et staging** : dans #97, la planche ronde en bois, les fruits, le pot de plante sur le rebord — tout contribuait a une scene "lived-in" credible. Dans #98, TOUS ces accessoires ont disparu. La scene est VIDE, sterile, deshumanisee.

4. **Meuble supplementaire a droite** : dans #98, un meuble BAS en bois apparait a droite au premier plan, qui n'existait pas dans #97. Ajout non demande.

5. **Murs** : dans #97, murs blancs propres et nets. Dans #98, les murs ont une TEXTURE granuleuse/crepie visible, comme un enduit a la chaux grossier. C'est un changement de finition de surface non demande.

6. **Luminaire Akari** : preserve, meme position, meme forme. C'est un des rares elements stables.

7. **Poutres** : preservees, meme position. Stable.

8. **Sol carrelage gris** : preserve. Le torchon a bien ete retire.

9. **Fenetre et radiateur** : preserves, meme position. Stable.

10. **Ouverture droite** : encore visible mais partiellement masquee par le meuble ajoute.

**Diagnostic** : L'iteration a traite le commentaire "enlever quelque chose sur le sol" comme une occasion de REGENERER la scene plutot que d'editer chirurgicalement. Le modele a retire le torchon MAIS a aussi regenere toute la cuisine, perdant la majorite du mobilier et du staging. C'est exactement le probleme documente dans les Sprints 22 (point 156) : "les iterations detruisent le mobilier existant."

### Preservation spatiale (CRITERE N.1) — par rapport a l'input ORIGINAL

- **Angle de vue** : FIDELE. Meme perspective frontale.
- **Dimensions/proportions** : FIDELES. Piece coherente.
- **Fenetre** : PRESERVEE. Meme position, meme taille.
- **Ouverture droite** : PARTIELLEMENT MASQUEE par le meuble ajoute, mais presente.
- **Radiateur** : PRESERVE.
- **Poutres** : PRESERVEES (inventees en #97, maintenues en #98).
- **Murs** : MODIFIES — texture crepie ajoutee, non presente dans #97 ni dans l'input.

**Score preservation spatiale : 7/10** — La geometrie de la piece est preservee mais les murs ont change de finition (crepi) et l'ouverture droite est partiellement obstruee. Les surfaces de #97 ne sont PAS preservees.

### Grille 10 criteres (evaluee par rapport a l'input original ET par rapport a la qualite attendue d'une iteration)

| # | Critere | Poids | Note /10 | Commentaire |
|---|---------|-------|----------|-------------|
| 1 | Preservation spatiale | x3 | 7 | Geometrie OK mais murs modifies (texture crepi), ouverture droite partiellement masquee. |
| 2 | Fidelite stylistique | x2 | 6 | Le Japandi est reconnaissable (bois clair, Akari) mais la cuisine monolithique en bois plein sans articulation fait "atelier menuiserie" plus que "cuisine Japandi raffinee". La subtilite des poignees, de la credence, du jeu de proportions est perdue. |
| 3 | Eclairage | x1 | 7 | Lumiere naturelle preservee. Warm shift un peu plus prononce que #97. Coherent neanmoins. |
| 4 | Hero pieces | x1 | 5.5 | L'Akari est preserve. Mais le four a disparu, la robinetterie laiton est a peine lisible, la planche ronde en bois est partie. Les hero pieces de la cuisine fonctionnelle sont perdues. |
| 5 | Coherence matieres | x1 | 6.5 | Bois clair + crepi + gris au sol. La palette reste Japandi mais le crepi mural ajoute une texture non demandee qui casse l'harmonie "murs blancs lisses + bois" de #97. |
| 6 | Credibilite pro | x2 | 4.5 | NON, je ne montrerais PAS cette iteration a un client. La cuisine est devenue un bloc de bois sans fonction visible (pas de four, pas d'evier lisible, pas de credence). Le meuble ajoute a droite semble orphelin. C'est une regression evidente par rapport a #97. Un client qui a valide #97 serait deconcerte par #98. |
| 7 | Completude | x1 | 4 | Il MANQUE : le four, la credence, les accessoires de staging (planche, fruits, plante), l'articulation meuble haut/bas. La scene est incomplete pour une cuisine fonctionnelle. |
| 8 | Vocabulaire visuel | x1 | 6 | Le bois est encore bien rendu en texture. Mais le crepi mural est grossier et le meuble monolithique manque de detail (pas de poignees visibles, pas de joints). |
| 9 | Adaptabilite spatiale | x1 | 5.5 | Le bloc de rangement pleine hauteur a gauche est disproportionne pour l'espace. Le meuble ajoute a droite encombre le passage. La densite n'est plus equilibree. |
| 10 | Potentiel photorealiste | x1 | 6 | Le rendu est correct techniquement mais la scene est trop vide et sterile pour etre credible comme photo reelle. Les textures murales semblent "plaquees". Le grain photo est insuffisant. |

**Calcul note ponderee** :
(7x3 + 6x2 + 7x1 + 5.5x1 + 6.5x1 + 4.5x2 + 4x1 + 6x1 + 5.5x1 + 6x1) / 14
= (21 + 12 + 7 + 5.5 + 6.5 + 9 + 4 + 6 + 5.5 + 6) / 14
= 82.5 / 14
= **5.9/10**

**Verdict #98 : Iteration destructrice. Regression de 2.1 points par rapport a #97.** L'utilisateur demandait simplement de retirer un element du sol. Le modele a retire le torchon MAIS a aussi regenere la cuisine entiere, perdant le four, la credence, les accessoires, et modifiant les murs. C'est un cas d'ecole du probleme "iteration = regeneration" documente depuis le Sprint 22.

---

## Synthese comparative

| Critere | #97 (base) | #98 (iteration) | Delta |
|---------|-----------|-----------------|-------|
| Preservation spatiale | 8.0 | 7.0 | -1.0 |
| Fidelite stylistique | 8.5 | 6.0 | -2.5 |
| Eclairage | 7.5 | 7.0 | -0.5 |
| Hero pieces | 8.0 | 5.5 | -2.5 |
| Coherence matieres | 8.5 | 6.5 | -2.0 |
| Credibilite pro | 8.0 | 4.5 | -3.5 |
| Completude | 7.5 | 4.0 | -3.5 |
| Vocabulaire visuel | 8.0 | 6.0 | -2.0 |
| Adaptabilite spatiale | 8.0 | 5.5 | -2.5 |
| Potentiel photorealiste | 7.5 | 6.0 | -1.5 |
| **Note ponderee** | **8.0** | **5.9** | **-2.1** |

La degradation est massive et systematique. Tous les criteres sont en baisse, les plus touches etant la credibilite pro (-3.5) et la completude (-3.5).

---

## Diagnostic technique et recommandations

### Cause racine

Le modele GPT-4.1 via Responses API, quand il recoit un commentaire d'iteration ("enlever quelque chose sur le sol"), ne fait pas une edition chirurgicale. Il REGENERE la scene avec une interpretation libre du prompt. Le resultat est une image coherente en isolation mais qui ne preserve pas les acquis de la generation precedente.

C'est le meme probleme que #33 (Sprint 22) : "le mobilier existant disparait lors de l'iteration."

### Recommandations P0 (CRITIQUE)

**R1 — Renforcer le prompt d'iteration avec inventaire explicite du mobilier existant**
Le prompt d'iteration doit lister explicitement les elements de #97 a preserver :
- "This kitchen contains: built-in oven, brass faucet sink, upper cabinets with 4 doors, backsplash, round wooden cutting board, fruit bowl, plant on windowsill, linen cloth [REMOVE THIS ITEM]"
- Le modele doit comprendre que TOUT sauf l'element cite doit rester IDENTIQUE.

**R2 — Ajouter une directive "SURGICAL EDIT" au prompt d'iteration**
- "Make ONLY the change described. Every other element — furniture, appliances, accessories, wall finish, floor — must remain VISUALLY IDENTICAL to the input photo."
- "This is a surgical edit, not a redesign."

**R3 — Considerer un masking localise pour les iterations simples**
Pour "enlever quelque chose sur le sol", un mask couvrant uniquement la zone du torchon + inpainting serait plus precis que de repasser toute l'image dans le pipeline. Cela necessiterait un systeme de detection de zone (manuel ou automatique).

### Recommandations P1 (HAUTE)

**R4 — Ne pas modifier les surfaces lors d'une iteration mobilier**
L'iteration #98 a change la texture des murs (crepi). Le prompt d'iteration doit explicitement verrouiller les surfaces : "Wall finish, floor material, and ceiling must remain EXACTLY as in the input."

**R5 — Preserver la densite et la composition**
"The number of furniture pieces and accessories must remain the same (minus the removed item). Do not simplify, merge, or remove other elements."

### Recommandations P2 (MOYENNE)

**R6 — Feedback utilisateur pre-iteration**
Avant de lancer l'iteration, montrer a l'utilisateur un highlight de l'element detecte ("Vous voulez retirer cet element ?") pour confirmer. Cela reduirait les iterations ambigues.

---

## Apprentissages

1. **L'iteration reste le maillon faible du pipeline.** Une generation de base a 8.0/10 peut tomber a 5.9/10 sur une simple demande de retrait d'un torchon. Le ROI de l'iteration est negatif dans ce cas.
2. **Le modele ne distingue pas "editer" de "regenerer".** Sans contraintes extremement precises sur ce qui doit etre preserve, il prend des libertes sur l'ensemble de la scene.
3. **Les surfaces sont re-generees lors des iterations** malgre les directives. Le crepi mural de #98 n'etait dans aucun prompt — c'est une hallucination du modele.
4. **Les elements fonctionnels (four, evier) sont les plus vulnerables** lors des iterations. Le modele les considere comme "optionnels" et les supprime facilement.
5. **La generation de base #97 est solide (8.0/10)** — le pipeline 2 passes v37 fonctionne bien en generation initiale. Le probleme est specifiquement sur les iterations.

---

Rapport produit par Yann Duval — Architecte d'interieur, audit #97-98
Prochain audit recommande : tester les iterations apres application des corrections R1-R5
