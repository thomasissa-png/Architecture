# Audit Visuel v49 — Yann Duval

**Date** : 5 avril 2026
**Version prompts** : v49
**Modele** : gpt-image-1.5 (pipeline 2 passes)
**Generations auditees** : 4 (3 completes + 1 iteration)

---

## Sommaire

| Gen | ID | Style | Piece | Format | Note /10 |
|-----|-----|-------|-------|--------|----------|
| A | #169/#170 | Scandinavian | Cuisine | 1280x968 | **7.4** |
| B | #171/#173 | Japandi | Salle de bain | 964x1280 | **7.8** |
| C | #172/#174 | Scandinavian | Salon | 1152x1536 | **8.25** |
| D | #175 | Japandi (iteration) | Salle de bain | 964x1280 | **N/A** |

---

## Generation A — Scandinavian Kitchen (#169/#170)

### Input
Cuisine en chantier brut : plaques de platre vertes (hydrofuges) et roses (plafond), joints non termines. 2 fenetres a gauche avec radiateur sous allege. Arrivees d'eau et cables visibles au centre du mur du fond. Porte ouverte a droite. Sol beton/resine sombre. Plafond rose avec spots en attente.

### Passe 1 (surfaces) — #169

**Preservation spatiale** : Bonne. L'angle de vue, les proportions, la profondeur sont fideles. Les 2 fenetres sont au bon endroit, la porte a droite est preservee. Le radiateur sous la fenetre a disparu — c'est un equipement fixe qui devrait etre preserve. Le plafond a ete lisse en blanc (correct, geometrie plate dans l'input). Les arrivees d'eau et les prises sont partiellement visibles (tuyauterie au centre du mur du fond encore presente). Luminaire PH5-style installe — coherent avec le prompt.

**Problemes passe 1** :
- Zone autour de la fenetre gauche : artefact de fusion visible — on voit encore le BA13 vert et le plafond rose dans un halo rectangulaire autour de la fenetre. C'est un defaut technique majeur : le modele n'a pas reussi a traiter cette zone.
- Le radiateur a disparu (equipement fixe, regle Sprint 18 #147).
- Les prises electriques au mur du fond sont encore visibles (regle Sprint 22 #159).
- Le carrelage blanc au sol est propre mais manque de grain naturel — rendu un peu CGI-clean.

### Output final (meuble) — #170

**Preservation spatiale** : 8/10. L'angle, les fenetres, la porte sont fideles. La profondeur est respectee. L'artefact de la fenetre gauche persiste (halo verdatre) mais attenue par rapport a la passe 1.

**Fidelite stylistique** : 7.5/10. Cuisine scandinave credible : meubles bas en bouleau/frene clair, meubles hauts blancs, credence carrelage metro blanc, robinetterie noire, plan de travail bois clair. Le PH5 au plafond ancre immediatement le style. Four encastre noir. C'est propre, fonctionnel, dans l'esprit Norden/Kvik.

**Eclairage** : 7/10. La lumiere naturelle des fenetres est preservee en direction et intensite. Leger eclaircissement global coherent avec les murs blancs (paradoxe luminosite documente). Pas de warm shift excessif.

**Hero pieces** : 7/10. Le PH5-style est le bon choix pour ancrer le scandinave. La robinetterie noire est contemporaine, correcte. Mais pas de planche a decouper en bois massif, pas de bouilloire design — les accessoires sont quasi absents.

**Coherence matieres** : 8/10. Bois clair + blanc mat + carrelage metro = combinaison coherente et classique scandinave. La credence metro est un bon choix.

**Credibilite pro** : 7/10. Montrable a un client MAIS l'artefact verdatre autour de la fenetre gauche est un no-go en presentation pro. Il faudrait un retouche ou regeneration de cette zone.

**Completude** : 7/10. Il manque des accessoires : ustensiles, plante, savon, torchon. La cuisine est trop "showroom vide" et pas assez "lived-in".

**Vocabulaire visuel** : 7.5/10. Les textures bois sont lisibles, le carrelage metro est identifiable. Bon travail sur les poignees minimalistes.

**Adaptabilite spatiale** : 8/10. Le lineaire cuisine en L est adapte a la taille de la piece. Pas d'ilot (correct pour une cuisine compacte). La densite est juste.

**Potentiel photorealiste** : 6/10. L'artefact fenetre casse l'illusion. Le sol est trop uniforme. Les ombres sous les meubles sont correctes mais l'ensemble manque de micro-imperfections.

#### Grille de notation Generation A

| # | Critere | Poids | Note |
|---|---------|-------|------|
| 1 | Preservation spatiale | x3 | 8 |
| 2 | Fidelite stylistique | x2 | 7.5 |
| 3 | Eclairage | x1 | 7 |
| 4 | Hero pieces | x1 | 7 |
| 5 | Coherence matieres | x1 | 8 |
| 6 | Credibilite pro | x2 | 7 |
| 7 | Completude | x1 | 7 |
| 8 | Vocabulaire visuel | x1 | 7.5 |
| 9 | Adaptabilite spatiale | x1 | 8 |
| 10 | Potentiel photorealiste | x1 | 6 |

**Note ponderee** = (8x3 + 7.5x2 + 7 + 7 + 8 + 7x2 + 7 + 7.5 + 8 + 6) / 14 = (24 + 15 + 7 + 7 + 8 + 14 + 7 + 7.5 + 8 + 6) / 14 = 103.5 / 14 = **7.4/10**

**Verdict** : Generation correcte avec un vrai probleme technique (artefact fenetre) qui plombe la credibilite. Le style scandinave est bien capture mais les accessoires manquent pour sortir de l'aspect "catalogue CGI".

---

## Generation B — Japandi Bathroom (#171/#173)

### Input
Salle de bain etroite en longueur. Baignoire existante au fond avec carrelage vert-gris en partie haute et blanc en partie basse. Sol carrelage beige. Convecteur electrique au sol a droite. Barre porte-serviette metallique au mur. Vue en plongee depuis l'entree.

### Passe 1 (surfaces) — #171

**Preservation spatiale** : Tres bonne. L'angle en plongee est preserve. La forme en couloir etroit est fidele. La baignoire est conservee a la bonne position avec les memes proportions. La barre porte-serviette a disparu. Le convecteur au sol a droite a disparu — equipement fixe non preserve (regle Sprint 18 #147). Le carrelage vert-gris du fond a ete remplace par un carrelage beige-gris clair — transformation de surface coherente avec le Japandi. Le sol passe a un parquet ash clair (prompt respecte). Luminaire washi paper spherique installe au plafond + spots encastres — correct.

**Problemes passe 1** :
- Convecteur electrique supprime (equipement fixe).
- La barre porte-serviette est un equipement mural fixe — elle aurait du etre preservee.
- Le rendu est tres propre, presque trop : la salle de bain semble plus grande qu'en realite (effet du blanchiment general).

### Output final (meuble) — #173

**Preservation spatiale** : 7.5/10. La forme en couloir etroit est preservee. La baignoire est au fond. L'angle en plongee est fidele. Mais la piece semble legerement plus large qu'en realite — le mur de droite parait recule. La proportion longueur/largeur est legerement modifiee.

**Fidelite stylistique** : 8/10. Japandi salle de bain tres credible : vanity mural en bois clair (frene/chene), miroir retroeclaire aux angles arrondis, echelle porte-serviettes noire en metal, panier tresse au sol, plante fougere en pot gris. Les tons sable/creme/bois clair sont parfaitement dans la palette Japandi. L'ensemble respire la serenite et l'organicite — Muji meets Fritz Hansen.

**Eclairage** : 7.5/10. La piece etait sombre dans l'input (pas de fenetre). Le modele a ajoute un eclairage doux et enveloppant via le washi pendant + spots. C'est coherent pour une piece aveugle mais la direction des ombres est un peu ambigue.

**Hero pieces** : 8/10. Le miroir retroeclaire est un excellent choix pour une salle de bain Japandi (reference Muji/Norm Architects). L'echelle porte-serviettes noire est iconique. Le vanity mural en bois clair est le bon geste. Le panier tresse apporte la touche wabi.

**Coherence matieres** : 8.5/10. Bois clair + ceramique beige + metal noir + osier = palette Japandi exemplaire. Tout est en harmonie, rien ne detonne.

**Credibilite pro** : 8/10. Oui, montrable a un client. La composition est equilibree, les proportions du mobilier sont credibles dans l'espace. Le miroir et le vanity sont a la bonne hauteur. C'est une proposition de renovation realiste.

**Completude** : 7.5/10. Il manque peut-etre un savon en ceramique, une bougie, un petit objet sur le vanity. Mais pour une salle de bain, c'est plutot complet. La fougere apporte de la vie.

**Vocabulaire visuel** : 8/10. Les textures sont lisibles : le grain du bois du vanity, le tresse du panier, le mat de la ceramique. Bon rendu.

**Adaptabilite spatiale** : 8/10. Le mobilier est adapte a l'espace etroit : vanity mural (ne prend pas au sol), echelle fine contre le mur, panier au sol sous le vanity. Pas de surcharge.

**Potentiel photorealiste** : 7/10. Bon rendu general mais les ombres sont un peu plates et le bord de la baignoire manque de reflet. L'ensemble est credible mais on sent le CGI dans l'uniformite des surfaces.

#### Grille de notation Generation B

| # | Critere | Poids | Note |
|---|---------|-------|------|
| 1 | Preservation spatiale | x3 | 7.5 |
| 2 | Fidelite stylistique | x2 | 8 |
| 3 | Eclairage | x1 | 7.5 |
| 4 | Hero pieces | x1 | 8 |
| 5 | Coherence matieres | x1 | 8.5 |
| 6 | Credibilite pro | x2 | 8 |
| 7 | Completude | x1 | 7.5 |
| 8 | Vocabulaire visuel | x1 | 8 |
| 9 | Adaptabilite spatiale | x1 | 8 |
| 10 | Potentiel photorealiste | x1 | 7 |

**Note ponderee** = (7.5x3 + 8x2 + 7.5 + 8 + 8.5 + 8x2 + 7.5 + 8 + 8 + 7) / 14 = (22.5 + 16 + 7.5 + 8 + 8.5 + 16 + 7.5 + 8 + 8 + 7) / 14 = 109 / 14 = **7.8/10**

**Verdict** : Meilleure generation du lot. Le Japandi salle de bain est tres credible, les hero pieces sont pertinentes, la palette matiere est exemplaire. La preservation spatiale est bonne malgre un leger elargissement percu. Le convecteur electrique manquant reste un probleme recurrent.

---

## Generation C — Scandinavian Living Room (#172/#174)

### Input
Salon en chantier actif : plafond beton avec trouees (cables, tuyaux exposes), murs partiellement demolis (briques apparentes au fond), fenetres/baie vitree a droite avec volet roulant. Escabeau et outils. 2 personnes presentes. Sol carrelage beige. Ouverture/couloir a gauche.

### Passe 1 (surfaces) — #172

**Preservation spatiale** : Bonne avec reserves. L'angle est fidele. La baie vitree a droite est preservee avec le volet roulant. L'ouverture/couloir a gauche est visible. MAIS : le plafond beton avec ses trouees et cables exposes est partiellement preserve — on voit la texture beton brut mais les trous semblent partiellement combles. Les murs de briques au fond sont encore partiellement visibles derriere l'escabeau et les outils — le modele n'a pas reussi a les couvrir completement. Le sol est passe a un parquet ash clair (correct). Les murs lateraux sont blancs (correct).

**Problemes passe 1** :
- L'escabeau et les outils de chantier sont encore visibles — le modele aurait du les supprimer (ce ne sont pas des equipements fixes).
- La personne a gauche est encore presente sous forme de silhouette fantome — artefact.
- Le plafond beton n'a pas ete traite en "white finish over geometry" — il reste tres brut. Le prompt dit pourtant "white ceiling finish applied over existing ceiling geometry preserving any vault beams or structural ribs". Ici ce n'est pas des poutres mais des nervures beton — elles sont preservees (correct) mais la finition blanche n'a pas ete appliquee completement.
- La chaudiere/ballon d'eau chaude (cylindre metallique au fond a droite pres de la fenetre) est partiellement preservee — bon signal.

### Output final (meuble) — #174

**Preservation spatiale** : 8/10. Tres bon travail. L'angle est fidele. La baie vitree avec volet roulant est au bon endroit. L'ouverture a gauche est preservee (on voit un couloir/porte). Le plafond beton avec ses nervures/joints est PRESERVE dans sa geometrie et sa texture brute — excellent choix de ne pas le lisser. La profondeur de la piece est respectee. La chaudiere au fond a droite est preservee (visible entre le canape et la fenetre).

**ALERTE** : les personnes et l'escabeau ont ete supprimes — correct, ce sont des elements temporaires de chantier.

**Fidelite stylistique** : 8.5/10. Scandinave salon tres reussi. Canape 3 places en lin naturel/creme avec pieds bois visibles. Table basse ronde en marbre clair avec pietement bois/laiton. Tapis texture creme/ecru avec motif geometrique subtil. Fauteuil wingback gris clair (Papa Bear-style). Etagere echelle en bouleau a gauche avec plante et objets. Coussin bleu sourd sur le canape (touche de couleur scandinave classique). Plaid texture beige. Luminaire PH5-style suspendu.

**Eclairage** : 8/10. La lumiere naturelle de la baie vitree est preservee en direction et intensite. Le gradient ombre vers le fond de la piece (couloir) est coherent. Pas de warm shift — les murs blancs restent blancs neutres.

**Hero pieces** : 8.5/10. Le PH5-style est parfait. Le fauteuil Papa Bear-style est reconnaissable et bien proportionne. La table basse ronde avec plateau marbre et base bois est un classique nordique. L'etagere echelle est un bon choix de rangement scandinave.

**Coherence matieres** : 9/10. Lin naturel + bouleau + marbre clair + laine texturee = palette scandinave exemplaire. Le bleu sourd du coussin apporte la touche chromatique sans rompre l'harmonie. Le beton brut du plafond ajoute un contraste industriel-scandinave tres contemporain (reference : apartements Copenhague/Stockholm avec dalles beton preservees).

**Credibilite pro** : 8.5/10. Oui, absolument montrable a un client. La composition est mature, les proportions sont justes. C'est le genre de visuel qu'on verrait dans un portfolio Norm Architects ou Note Design Studio. Le plafond beton brut + mobilier scandinave cree un dialogue materiel sophistique.

**Completude** : 8/10. Les elements cles sont presents : canape, table basse, fauteuil, tapis, etagere, luminaire, plante, coussins, plaid. Il manque peut-etre un lampadaire de lecture et quelques livres/magazines sur la table basse.

**Vocabulaire visuel** : 8.5/10. Les textures sont bien rendues : le grain du tapis, le lin du canape, les nervures du plafond beton. Le marbre de la table basse est lisible.

**Adaptabilite spatiale** : 8/10. Le canape est place le long du mur droit face a la baie vitree — intelligent car la lumiere naturelle eclaire la zone de vie. Le fauteuil en retrait a gauche cree une seconde zone de lecture. La densite est adequate pour l'espace.

**Potentiel photorealiste** : 7.5/10. Bon rendu. Les ombres sous le canape et la table sont credibles. Le plafond beton est photoconvaincant. Le tapis a un leger aspect CGI dans son uniformite mais c'est mineur.

#### Grille de notation Generation C

| # | Critere | Poids | Note |
|---|---------|-------|------|
| 1 | Preservation spatiale | x3 | 8 |
| 2 | Fidelite stylistique | x2 | 8.5 |
| 3 | Eclairage | x1 | 8 |
| 4 | Hero pieces | x1 | 8.5 |
| 5 | Coherence matieres | x1 | 9 |
| 6 | Credibilite pro | x2 | 8.5 |
| 7 | Completude | x1 | 8 |
| 8 | Vocabulaire visuel | x1 | 8.5 |
| 9 | Adaptabilite spatiale | x1 | 8 |
| 10 | Potentiel photorealiste | x1 | 7.5 |

**Note ponderee** = (8x3 + 8.5x2 + 8 + 8.5 + 9 + 8.5x2 + 8 + 8.5 + 8 + 7.5) / 14 = (24 + 17 + 8 + 8.5 + 9 + 17 + 8 + 8.5 + 8 + 7.5) / 14 = 115.5 / 14 = **8.25/10**

**Verdict** : Meilleure generation de ce lot et probablement l'une des meilleures du projet. Le dialogue plafond beton brut / mobilier scandinave est un vrai choix d'architecte. La preservation spatiale est solide malgré la difficulte du chantier actif avec personnes et outils. Le pipeline 2 passes v49 montre ici sa maturite.

---

## Generation D — Japandi Bathroom Iteration (#175)

**ALERTE : Image non evaluable.** L'image gen-175-output.jpg est identique a gen-174-output.jpg (Scandinavian living room). C'est probablement une erreur de pre-fetch par le parent. L'image fournie ne correspond PAS a une iteration de la salle de bain Japandi — c'est le salon scandinave.

**Action requise** : le parent doit re-telecharger l'image correcte depuis `logs/1775381665762_japandi_output.jpg` et me la fournir pour audit.

**Note** : non evaluable (N/A).

---

## Synthese et recommandations

### Notes finales

| Gen | Style | Piece | Note /10 |
|-----|-------|-------|----------|
| A | Scandinavian | Cuisine | **7.4** |
| B | Japandi | Salle de bain | **7.8** |
| C | Scandinavian | Salon | **8.25** |
| D | Japandi (iteration) | Salle de bain | **N/A** (image incorrecte) |

**Moyenne** : 7.82/10 (sur 3 generations evaluables)

### Progression v49

C'est une progression notable par rapport aux audits precedents. La moyenne de 7.82 est au-dessus des 6.73 du Sprint 23 (v37) et des 7.0-7.5 du Sprint 16b. La generation C (8.25) est la meilleure generation scandinave que j'ai auditee sur Versimo.

### Patterns positifs recurrents

1. **Preservation spatiale solide** : les 3 generations preservent l'angle de vue, la position des ouvertures, et la profondeur. Le pipeline v49 avec gpt-image-1.5 montre une nette amelioration sur ce critere fondamental.
2. **Hero pieces pertinentes** : le PH5-style est systematiquement bien place pour le scandinave. Le miroir retroeclaire et l'echelle porte-serviettes pour le Japandi sont de bons choix.
3. **Coherence matieres exemplaire** : les palettes sont coherentes et credibles dans les 3 generations. Aucune dissonance materielle.
4. **Plafond beton preserve (Gen C)** : le modele a correctement preserve la geometrie brute du plafond avec ses nervures — un progres majeur par rapport aux versions precedentes qui lissaient tout.

### Problemes recurrents

1. **P0 — Artefact de fusion autour des fenetres (Gen A)** : la zone autour de la fenetre gauche conserve des residus du BA13 vert/plafond rose. C'est un defaut technique du modele — la transition entre surface traitee et zone fenetre n'est pas propre. Action : investiguer si c'est un probleme de prompt (demander au modele de traiter les embrasures de fenetre explicitement) ou un probleme intrinseque du modele sur les zones de transition.

2. **P1 — Equipements fixes supprimes** : le radiateur (Gen A) et le convecteur (Gen B) sont systematiquement supprimes. La regle Sprint 18 #147 prescrit "Preserve all wall-mounted fixed equipment (radiators, heaters, vents, thermostats, switches)" mais elle n'est manifestement pas respectee par le modele v49. Action : verifier que la directive est bien presente dans les builders v49 et la renforcer si necessaire avec un comptage explicite ("If the input shows a radiator below the window, the output MUST show a radiator below the window").

3. **P1 — Prises electriques non nettoyees (Gen A)** : les prises au mur du fond sont encore visibles dans la passe 1 et l'output final. La regle Sprint 22 #159 prescrit leur nettoyage. Action : verifier la directive "Cover all visible electrical outlets" dans les builders v49.

4. **P2 — Accessoires manquants** : les generations sont un peu trop "showroom vide", surtout la cuisine (Gen A). Il manque les accessoires de vie : planche a decouper, bouilloire, savon, livres, bougies. Action : renforcer les furniturePrompts avec des accessoires specifiques par type de piece (kitchen accessories: wooden cutting board, ceramic oil bottle, potted herb; bathroom accessories: soap dispenser, small candle; living room accessories: stack of 3 books, ceramic vase).

5. **P2 — Rendu CGI-clean** : les surfaces sont trop uniformes, surtout les sols. L'absence de grain photographique (decision fondateur) rend les rendus plus lisses qu'une vraie photo. C'est une tension entre la decision fondateur (rendu propre) et le photorealisme. Action : aucune action sur le grain (decision fondateur), mais envisager d'ajouter des micro-variations de texture sur les surfaces pour compenser.

### Plan d'amelioration

| Priorite | Action | Impact estime |
|----------|--------|---------------|
| P0 | Investiguer artefact fusion fenetre (Gen A) — potentiellement lier a la gestion des embrasures | Credibilite pro +1pt |
| P1 | Renforcer preservation equipements fixes (radiateurs, convecteurs) avec comptage explicite | Preservation spatiale +0.5pt |
| P1 | Verifier nettoyage prises electriques dans builders v49 | Credibilite pro +0.3pt |
| P2 | Enrichir furniturePrompts avec accessoires de vie par type de piece | Completude +1pt, photorealisme +0.5pt |
| P2 | Ajouter micro-variations texture sur sols et murs pour casser l'uniformite CGI | Photorealisme +0.5pt |

### Note a @ai-image-expert (Lucas Moreau)

L'artefact de fusion autour de la fenetre de la Gen A est un sujet technique qui merite ton analyse. Est-ce un probleme de prompt (le modele ne sait pas traiter les embrasures de fenetre) ou un probleme de resolution/attention du modele sur les zones de transition ? As-tu observe ce pattern sur d'autres generations v49 ?

La Generation C (salon avec plafond beton) est un excellent cas de test pour valider que les directives de preservation geometrique fonctionnent. Le plafond est preserve dans sa texture brute ET les nervures sont visibles — c'est exactement ce qu'on voulait depuis le Sprint 18.

---

*Audit realise par Yann Duval — Architecte d'interieur, 20 ans d'experience*
*Prochain audit : generation D (iteration bathroom) en attente de l'image correcte*
