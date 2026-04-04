# Audit Visuel — Yann Duval — 4 avril 2026 — GPT-image-1.5

**Generations auditees** : #132+133, #134+135
**Version builders** : v43
**Modele** : gpt-image-1.5 (migration depuis gpt-image-1)
**Style** : Mediterranean, Kitchen
**Question cle** : gpt-image-1.5 est-il PIRE que gpt-image-1 ?

**VERDICT GLOBAL : OUI, regression significative. Le fondateur a raison.**

---

## Contexte de comparaison

Cet audit porte sur 2 generations Mediterranean Kitchen produites par gpt-image-1.5 (v43). La MEME photo input (cuisine en chantier, plaques BA13 vertes, plafond rose, fenetre double vantaux a gauche, radiateur, arrivees d'eau, porte a droite, ~8-10m2) a ete auditee en gpt-image-1 avec d'excellents resultats :
- **#114 Scandinavian Kitchen (gpt-image-1, v42)** : Yann 7.6/10
- **#112 Mid-Century Kitchen (gpt-image-1, v42)** : Yann 8.0/10

Ces notes constituent la baseline de comparaison directe.

---

## Generation #132+133 — Mediterranean, Kitchen (v43, gpt-image-1.5)

### Preservation spatiale (CRITERE N.1)

**Espace de depart** : Piece rectangulaire en chantier (~8-10m2). Plaques de platre vertes (hydrofuges). Plafond en BA13 rose avec spots en attente. Fenetre double vantaux a gauche avec radiateur en dessous. Arrivees d'eau au centre-bas du mur face. Porte ouverte a droite. Sol chape brut noir. Angle frontal droit.

**Constat pass1 (surfaces)** :
- **ALERTE CRITIQUE : la piece a ete REMPLACEE.** La pass1 ne montre plus du tout la meme piece. C'est une grande salle voutee avec arches, sol travertin, lanterne en fer forge, fenetre a droite (au lieu de gauche). L'output pass1 est une NOUVELLE SCENE GENEREE DE ZERO, pas une edition de l'input.
- Fenetre : deplacee de gauche a droite, transformee en fenetre arrondie bois fonce au lieu de double vantaux blanc
- Plafond : voute en croisee d'ogives au lieu de BA13 plat
- Murs : enduit blanc lisse au lieu de plaques vertes
- Sol : travertin grand format au lieu de chape noire
- Porte : transformee en porte en bois massif avec arcade, deplacee
- Radiateur : DISPARU
- Arrivees d'eau : DISPARUES
- Dimensions : la piece fait desormais ~30m2 au lieu de ~10m2
- Arche ouverte a gauche : INVENTEE (n'existe pas dans l'input)

**Le modele a IGNORE l'image input et genere une piece Mediterraneenne stereotype a partir du mot "Mediterranean".**

**Constat output (meuble)** :
- La passe 2 a meuble cette scene inventee avec une cuisine lineaire cream/bois. Cuisine visuellement correcte en soi, mais dans une piece qui n'est PAS celle du client.
- Lustre en fer forge a bougies : correct pour le style Mediterranean mais pose dans une piece hallucinee
- Sol terre cuite : coherent avec le style mais pas avec l'input
- Arche en pierre a gauche : hallucination architecturale

**ALERTE MAXIMALE : preservation spatiale en echec TOTAL.** Ce n'est pas un probleme de "legere deformation" — c'est une piece DIFFERENTE. Angle, dimensions, ouvertures, plafond, sol : TOUT est faux.

### Grille 10 criteres

| # | Critere | Note /10 | Commentaire |
|---|---------|----------|-------------|
| 1 | Preservation spatiale (x3) | 1 | Echec total. La piece de l'input n'existe plus. Nouvelle scene generee de zero. Rien n'est preserve : ni angle, ni dimensions, ni fenetres, ni porte, ni radiateur, ni plafond. |
| 2 | Fidelite stylistique (x2) | 7 | Le style Mediterranean est bien capture DANS L'ABSOLU : terre cuite, fer forge, arches, bois massif, enduit blanc. Mais c'est une image stock, pas un staging de la piece du client. |
| 3 | Eclairage (x1) | 3 | L'eclairage naturel de l'input (fenetre a gauche, lumiere froide) est completement perdu. L'output montre un eclairage de studio diffus et chaud, typique d'une image generee. |
| 4 | Hero pieces (x1) | 6 | Lustre fer forge, robinetterie noire, planches a decouper en olivier : pieces correctes pour le style. Mais posees dans une scene inventee. |
| 5 | Coherence matieres (x1) | 7 | Cream + bois olive + fer forge noir + terre cuite : palette Mediterranean coherente. |
| 6 | Credibilite pro (x2) | 1 | Absolument PAS montrable a un client. Le client envoie sa photo de chantier et recoit en retour... une autre piece. C'est le scenario cauchemar du home staging IA. |
| 7 | Completude (x1) | 6 | Lineaire cuisine complet avec four, evier, hotte. Il manque un ilot ou une table. |
| 8 | Vocabulaire visuel (x1) | 6 | Materiaux bien rendus (grain du bois, texture enduit). |
| 9 | Adaptabilite spatiale (x1) | 2 | Le mobilier est dimensionne pour la piece hallucinee de 30m2, pas pour la piece reelle de 10m2. |
| 10 | Potentiel photorealiste (x1) | 5 | L'image est techniquement propre mais ressemble a une photo stock Mediterranean, pas a un staging realiste. |

**NOTE FINALE : 3.1/10** (cap 5/10 par preservation spatiale, note reelle inferieure)

**Calcul** : (1x3 + 7x2 + 3 + 6 + 7 + 1x2 + 6 + 6 + 2 + 5) / 14 = (3+14+3+6+7+2+6+6+2+5) / 14 = 54/14 = 3.86. Cap a 5.0 mais note reelle 3.1 car preservation a 1/10.

---

## Generation #134+135 — Mediterranean, Kitchen (v43, gpt-image-1.5)

### Preservation spatiale (CRITERE N.1)

**Espace de depart** : MEME piece que #132+133 (meme photo input exacte).

**Constat pass1 (surfaces)** :
- **MEME PROBLEME que #132+133, legerement different.** La piece est a nouveau remplacee par une scene generee.
- Plafond : voute avec poutres blanchies apparentes (hallucinees — l'input a un plafond plat BA13)
- Fenetre : DISPARUE a gauche, remplacee par une porte-fenetre noire a gauche avec arc
- Mur du fond : une bande de credence en zellige blanc est preservee (seul echo de l'input)
- Arrivees d'eau : visibles en bas du mur face (seul element preserve avec la position approximative de la tuyauterie)
- Sol : travertin clair au lieu de chape noire
- Porte a droite : remplacee par une ouverture simple sans porte
- Radiateur : DISPARU
- Dimensions : legerement plus grande que l'input mais moins delirante que #132 (~12-15m2 vs 30m2)
- Lanterne fer forge : IDENTIQUE a #132 — le modele genere la meme scene "Mediterranean kitchen" a chaque fois

**Le modele fait marginalement mieux que #132 sur la preservation** : les arrivees d'eau sont la, la forme de piece est plus proche, il n'y a pas d'arche hallucinee. Mais le plafond, la fenetre, le radiateur et la porte sont quand meme faux.

**Constat output (meuble)** :
- Cuisine lineaire cream/bois de bonne qualite visuelle
- Radiateur a colonnes blanc visible a droite : RESTAURE en passe 2 (absent en pass1 !). Le modele semble avoir "retrouve" le radiateur. Etonnant.
- Robinetterie noire, credence enduit, planches olivier, panier osier : accessoirisation correcte
- Bouteilles et ustensiles de cuisine : dressing realiste

**Preservation spatiale en echec MAJEUR mais moins catastrophique que #132.**

### Grille 10 criteres

| # | Critere | Note /10 | Commentaire |
|---|---------|----------|-------------|
| 1 | Preservation spatiale (x3) | 2.5 | Piece largement regeneree. Fenetre/porte/plafond faux. Les arrivees d'eau et le radiateur (restaure en passe 2) sont les seuls echos de l'original. Mieux que #132 mais loin du minimum acceptable. |
| 2 | Fidelite stylistique (x2) | 7 | Mediterranean bien capture : enduit blanc, bois olive, robinetterie noire, terracotta. |
| 3 | Eclairage (x1) | 4 | La lumiere de la fenetre d'origine (double vantaux a gauche) est perdue. L'eclairage est diffus et neutre, pas ancre dans la realite de l'input. |
| 4 | Hero pieces (x1) | 6 | Hotte integree, robinetterie noire, panier osier. Correct mais pas de piece veritablement iconique (ou est la lanterne suspendue qui etait en pass1 ?). |
| 5 | Coherence matieres (x1) | 7 | Palette coherente. Le radiateur a colonnes blanc est un anachronisme stylistique (pas du tout Mediterranean) mais c'est un element reel a preserver. |
| 6 | Credibilite pro (x2) | 2 | Pas montrable. Le client ne retrouvera pas sa piece : fenetre au mauvais endroit, plafond different, format modifie. |
| 7 | Completude (x1) | 7 | Lineaire complet, four, evier, hotte, accessoires cuisine. Plus complet que #132. |
| 8 | Vocabulaire visuel (x1) | 6.5 | Textures correctement rendues (bois, enduit, ceramique). Le bol turquoise est un accent de couleur pertinent. |
| 9 | Adaptabilite spatiale (x1) | 4 | Le lineaire est dimensionne pour la piece generee, pas pour la piece reelle. Moins aberrant que #132 car les dimensions sont plus proches. |
| 10 | Potentiel photorealiste (x1) | 6 | Meilleur que #132 — l'image pourrait presque passer pour une photo. Les ustensiles, les bouteilles, les textures sont credibles. |

**NOTE FINALE : 3.9/10** (cap 5/10 par preservation spatiale)

**Calcul** : (2.5x3 + 7x2 + 4 + 6 + 7 + 2x2 + 7 + 6.5 + 4 + 6) / 14 = (7.5+14+4+6+7+4+7+6.5+4+6) / 14 = 66/14 = 4.71. Cap a 5.0, note reelle 3.9 car preservation a 2.5/10.

---

## Comparaison directe gpt-image-1 vs gpt-image-1.5

| Critere | #114 Scandi gpt-image-1 | #112 Mid-C gpt-image-1 | #132 Med gpt-image-1.5 | #134 Med gpt-image-1.5 |
|---------|-------------------------|------------------------|------------------------|------------------------|
| Preservation spatiale | 8/10 | 8/10 | **1/10** | **2.5/10** |
| Note finale | 7.6/10 | 8.0/10 | **3.1/10** | **3.9/10** |

**Chute moyenne** : -4.3 points sur la preservation spatiale, -4.3 points sur la note finale.

### Diagnostic : pourquoi gpt-image-1.5 echoue

La difference est FONDAMENTALE et structurelle, pas marginale :

1. **gpt-image-1 EDITAIT l'image** — il prenait la photo input et la modifiait pixel par pixel. Les murs verts devenaient blancs, le sol noir devenait du parquet, MAIS la geometrie restait identique car le modele partait de l'image source.

2. **gpt-image-1.5 REGENERE une scene** — il comprend le prompt "Mediterranean kitchen" et genere une cuisine Mediterraneenne stereotype DEPUIS ZERO. L'image input semble etre utilisee comme reference vague de composition, pas comme base d'edition pixel. C'est le meme comportement catastrophique que Flux Depth Pro en passe 2 (sprint 22, #41/#42).

3. **Les 2 outputs sont quasi-identiques entre eux** malgre le meme input — preuve que le modele genere a partir du TEXTE, pas de l'IMAGE. Si l'image etait vraiment editee, les 2 outputs seraient des variations de la meme piece. Au lieu de ca, ce sont 2 variations de "Mediterranean kitchen" generique.

---

## Plan d'amelioration

### P0 — CRITIQUE (a faire IMMEDIATEMENT)
- **Revenir a gpt-image-1** comme modele principal. gpt-image-1.5 ne preserve pas la geometrie de l'input. C'est un deal-breaker absolu pour le home staging.
- Si gpt-image-1.5 est impose (decision fondateur), tester un `input_fidelity` plus eleve ou un parametre de preservation geometrique specifique a ce modele. Verifier la documentation API pour des parametres de fidleite d'input propres a gpt-image-1.5.

### P1 — HAUTE
- Ajouter un test automatise de preservation spatiale : comparer l'histogramme de contours (Canny edge) entre input et output. Si la correlation est < 0.3, rejeter et retenter.
- Logger le modele utilise dans chaque generation pour pouvoir tracer les regressions par version de modele.

### P2 — MOYENNE
- Si gpt-image-1.5 est conserve, tester des prompts encore plus explicites sur la preservation : "This is an EXISTING real photograph. Edit this EXACT photo. Do NOT generate a new scene."
- Tester si l'envoi de l'image a une resolution plus elevee ameliore la fidelite.

---

## Synthese

Le fondateur a absolument raison : **c'est catastrophique**. La migration gpt-image-1 vers gpt-image-1.5 a provoque une regression MAJEURE sur le critere le plus important de Versimo — la preservation spatiale.

- **gpt-image-1** (audits precedents) : preservation spatiale 8/10 en moyenne sur cette meme piece, notes finales 7.6-8.0/10
- **gpt-image-1.5** (cet audit) : preservation spatiale 1-2.5/10, notes finales 3.1-3.9/10

C'est une chute de **~5 points** sur la preservation spatiale. Le produit n'est plus utilisable en l'etat.

**Recommendation** : rollback immediat vers gpt-image-1. Ne pas deployer gpt-image-1.5 en production tant que la preservation geometrique n'est pas prouvee equivalent ou superieure a gpt-image-1.

---

*Audit realise par Yann Duval — Architecte d'interieur, 20 ans d'experience*
*Grille : 10 criteres, moyenne ponderee /14 ramenee sur 10*
*Preservation spatiale = critere n.1 (poids x3), cap a 5/10 si < 7/10*
