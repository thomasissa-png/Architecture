# Audit Visuel v49 — Lucas Moreau (Expert IA Image)

**Date** : 2026-04-05
**Version builders** : v49
**Modele** : gpt-image-1.5 via Responses API
**Generations auditees** : A (#169/#170), B (#171/#173), C (#172/#174)

---

## Generation A — Scandinavian Kitchen (1280x968)

**Input** : Chantier brut — plaques de platre vertes (hydrofuges) et roses (ignifugees), joints en cours, plafond non fini avec spots non cables, sol beton brut, arrivees d'eau et cuivre visibles en bas du mur du fond. 2 fenetres a gauche avec radiateur sous fenetres. Porte ouverte a droite.

**Output** : Cuisine scandinave avec plan de travail en chene clair, meubles hauts blancs, credence metro blanche, four encastre noir, robinetterie noire, evier. Suspension PH5-style au plafond. Sol carrelage clair.

### Preservation spatiale (CRITERE N°1)

- **Angle de vue** : IDENTIQUE — meme angle frontal legerement decentre vers la gauche, meme hauteur de camera (~1.50m). Excellent.
- **Dimensions/proportions** : Fideles. La largeur du mur du fond est coherente, la profondeur de la piece est respectee.
- **Fenetres** : 2 fenetres preservees, MEME position, MEME taille, MEME division en carreaux. La lumiere naturelle entre par la gauche de maniere coherente. Tres bien.
- **Porte** : La porte a droite est PRESERVEE, ouverte, avec le meme cadre. On distingue meme la plaque de platre verte visible dans l'encadrement — excellent detail de coherence.
- **Plafond** : La geometrie plate est respectee, pas de deformation. Les spots bruts ont ete remplaces par la suspension PH5-style, ce qui est conforme au surfacePrompt.
- **Forme des murs** : Respectee — les angles droits, les retours de mur sont fideles.

**ALERTE FONDATEUR (P0)** : Deux problemes majeurs identifies par le fondateur et confirmes a la relecture :
1. **Elargissement de la piece** : Les murs lateraux sont plus ecartes dans l'output que dans l'input. C'est une petite cuisine etroite — l'output montre un espace sensiblement plus large qui permet de loger un agencement complet qui ne rentrerait PAS dans les dimensions reelles. Le modele a "pousse les murs" pour accommoder le mobilier. C'est un FAIL de preservation geometrique.
2. **Tuyaux visibles** : Les gros tuyaux cuivre/PVC contre le mur du fond (arrivees d'eau) sont toujours visibles dans l'output, partiellement masques par les meubles mais pas traites. Artefact de chantier non nettoye.
3. Radiateur sous fenetre disparu (deja note).

**Verdict preservation** : 6.5/10 — L'angle de vue et les fenetres sont preserves, MAIS l'elargissement de la piece est un defaut geometrique majeur. La largeur reelle de la cuisine n'est pas respectee — le modele a deforme l'espace pour y inserer le mobilier. Les tuyaux non traites ajoutent un artefact de chantier visible. Note plafonnee par le fail geometrique.

### Analyse technique

- **Eclairage** : La lumiere naturelle venant des fenetres gauche est preservee — direction, intensite, gradients coherents. Le mur du fond recoit bien la lumiere laterale. Pas de warm shift detecte — les murs restent d'un blanc neutre/froid. Tres bien.
- **Ombres** : Les ombres portees sous les meubles de cuisine sont presentes et coherentes avec la source lumineuse (fenetres a gauche). La suspension projette une ombre douce sur le plafond. Correct.
- **Grain/Photorealisme** : Le rendu est propre et lisse (conforme a la decision fondateur "pas de grain"). La texture du bois des meubles est credible. Le carrelage au sol a un rendu mat realiste. Le four noir a des reflets coherents. La credence metro a une texture de carrelage lisible. Globalement, ca passe pour une photo de cuisine equipee.
- **Artefacts** : Les prises electriques sont VISIBLES (3 prises blanches sur la credence a gauche de l'evier). C'est acceptable car dans une cuisine equipee, les prises sont standard — contrairement aux boitiers de chantier bruts. Pas d'artefact visible sur les jonctions meubles/murs.
- **Negative prompting** : Pas de rideaux hallucines, pas de fenetre ajoutee, pas de wall art. Conforme.
- **Echelle mobilier** : Les meubles hauts et bas sont a l'echelle correcte — hauteur de plan de travail ~90cm, meubles hauts a bonne distance du plafond. Le four encastre est a la bonne proportion.

### Grille de notation

| # | Critere | Poids | Note | Justification |
|---|---------|-------|------|---------------|
| 1 | Preservation spatiale | x3 | 6.5 | Angle et fenetres preserves. MAIS piece elargie (murs ecartes), tuyaux visibles, radiateur disparu. |
| 2 | Contraintes lumiere | x1 | 8.5 | Lumiere laterale gauche preservee, pas de warm shift, gradients coherents. |
| 3 | Vocabulaire photo | x1 | 7.5 | Rendu propre et lisse (decision fondateur). Textures bois/carrelage credibles. |
| 4 | Structure prompt | x1 | 8.0 | Cuisine scandinave reconnaissable. PH5-style, chene clair, credence metro. |
| 5 | Negative prompting | x1 | 9.0 | Aucun element interdit genere. |
| 6 | Compatibilite multi-modeles | x1 | N/A | Modele unique gpt-image-1.5. |
| 7 | Coherence I/O | x1 | 9.0 | Format landscape preserve, dimensions coherentes. |
| 8 | Richesse descriptive | x1 | 8.0 | Mobilier detaille, materiaux lisibles, bon niveau de detail. |
| 9 | Adaptabilite conditions | x1 | 9.0 | Chantier brut tres degrade transforme proprement. Excellent. |
| 10 | Rendu final credible | x2 | 8.0 | Passe pour une photo de cuisine neuve. Le mur a droite (encore vert/platre visible dans l'ombre de la porte) ajoute paradoxalement du realisme. |

**Note ponderee** : (6.5x3 + 8.5 + 7.5 + 8.0 + 9.0 + 9.0 + 8.0 + 9.0 + 8.0x2) / 13 = (19.5 + 8.5 + 7.5 + 8.0 + 9.0 + 9.0 + 8.0 + 9.0 + 16.0) / 13 = **94.5 / 13 = 7.27 / 10** (REVISEE a la baisse, etait 7.73 avant correction fondateur)

**Note supplementaire (N/A exclu)** : Compatibilite multi-modeles exclue car modele unique.

---

## Generation B — Japandi Bathroom (964x1280)

**Input** : Salle de bain etroite et profonde, vue en plongee depuis la porte. Baignoire au fond contre le mur du fond, carrelage vert/gris en partie haute, carrelage blanc en partie basse. Sol carrelage beige/creme sale. Murs blancs lateraux nus. Radiateur/convecteur au sol a droite. Barre porte-serviette metallique au mur du fond au-dessus de la baignoire. Robinetterie murale visible. Piece sans fenetre, eclairage artificiel diffus venant du couloir/plafond.

**Output** : Salle de bain Japandi — baignoire au fond (meme position), vasque suspendue en bois clair avec miroir retroeclaire, porte-serviettes noir a droite, plante verte en pot, panier en osier. Suspension boule (washi-style) au plafond avec 2 spots encastres. Sol lames claires type bois. Murs enduit lisse beige/gris clair.

### Preservation spatiale (CRITERE N°1)

- **Angle de vue** : IDENTIQUE — meme plongee depuis l'entree, meme axe de visee vers le fond. La profondeur du couloir est fidele. Tres bien.
- **Dimensions/proportions** : La piece est etroite et profonde dans les deux images. La largeur semble fidele. La profondeur (distance entree-baignoire) est respectee.
- **Baignoire** : PRESERVEE au fond, meme position, meme emprise. La forme rectangulaire est fidele. Bien.
- **Fenetres/portes** : Pas de fenetre dans l'input, pas de fenetre hallucinee dans l'output. Conforme. L'encadrement de porte (d'ou la photo est prise) est coherent.
- **Murs** : La geometrie en couloir etroit est respectee — murs lateraux paralleles, mur du fond perpendiculaire. Le retrecissement visuel vers le fond (perspective) est fidele.
- **Plafond** : Pas visible dans l'input (plongee). Dans l'output, le plafond est partiellement visible avec la suspension et les spots — c'est une consequence du cadrage legerement plus large en haut, mais reste acceptable.

**ALERTE** : Le convecteur/radiateur au sol a droite a DISPARU. C'est un equipement fixe qui devrait etre preserve (regle Sprint 18 #147). Par ailleurs, la vasque suspendue avec miroir retroeclaire est un AJOUT de mobilier qui devrait relever de la passe 2, pas de la passe 1 (si c'est une passe unique, c'est acceptable mais a verifier).

**Verdict preservation** : 7.5/10 — L'espace est reconnaissable, la geometrie en couloir est fidele. Perte du radiateur. L'ajout de la vasque+miroir modifie le mur droit mais c'est du mobilier salle de bain (acceptable en passe 2). La piece semble legerement plus lumineuse que l'input (piece sombre transformee en piece bien eclairee) — physiquement justifie par les murs clairs, mais le saut de luminosite est significatif.

### Analyse technique

- **Eclairage** : L'input est une piece sombre, eclairage artificiel faible/diffus depuis le couloir. L'output est nettement plus lumineux — justifiable par les surfaces claires (murs beige, sol clair) qui reflechissent plus de lumiere. La suspension boule diffuse une lumiere douce omnidirectionnelle coherente. Les 2 spots encastres ajoutent un eclairage fonctionnel. Le miroir retroeclaire ajoute une source supplementaire. Le gradient de lumiere (plus clair en haut/centre, plus sombre au sol le long des murs) est physiquement coherent.
- **Ombres** : Ombres douces sous la vasque, sous le panier en osier. Le porte-serviettes projette des ombres fines sur le mur. Les ombres sont coherentes avec un eclairage plafonnier central diffus. Correct.
- **Grain/Photorealisme** : Le rendu est propre. Les textures sont lisibles — bois de la vasque, osier du panier, lames du sol. Le miroir retroeclaire a un halo credible. La plante verte est realiste (fougere). Le rendu a une qualite "photo de catalogue salle de bain" — legerement trop parfait pour un chantier mais c'est l'objectif.
- **Artefacts** : La jonction baignoire/mur semble propre. La zone sous la baignoire est un peu floue mais acceptable. Pas d'artefact majeur visible.
- **Negative prompting** : Pas de fenetre hallucinee, pas de rideaux, pas de wall art. Conforme.
- **Echelle** : La vasque est a bonne hauteur (~80cm), le miroir au-dessus est bien place. Le porte-serviettes est a hauteur correcte. Le panier au sol est a echelle credible.

### Grille de notation

| # | Critere | Poids | Note | Justification |
|---|---------|-------|------|---------------|
| 1 | Preservation spatiale | x3 | 7.5 | Geometrie couloir fidele, baignoire preservee. Radiateur disparu. |
| 2 | Contraintes lumiere | x1 | 7.0 | Saut de luminosite important mais physiquement justifie. Pas de warm shift excessif. |
| 3 | Vocabulaire photo | x1 | 7.0 | Rendu propre, legerement "catalogue". Textures correctes. |
| 4 | Structure prompt | x1 | 8.5 | Japandi reconnaissable — bois clair, washi pendant, minimalisme, panier osier. |
| 5 | Negative prompting | x1 | 9.0 | Aucun element interdit. |
| 6 | Compatibilite multi-modeles | x1 | N/A | Modele unique. |
| 7 | Coherence I/O | x1 | 9.0 | Format portrait preserve, ratio fidele. |
| 8 | Richesse descriptive | x1 | 8.0 | Bon equilibre mobilier/espace, pas de surcharge. |
| 9 | Adaptabilite conditions | x1 | 8.5 | Piece sombre sans fenetre bien geree. Eclairage artificiel credible. |
| 10 | Rendu final credible | x2 | 7.5 | Passe pour une photo de salle de bain renovee. Legerement trop parfait/catalogue. |

**Note ponderee** : (7.5x3 + 7.0 + 7.0 + 8.5 + 9.0 + 9.0 + 8.0 + 8.5 + 7.5x2) / 13 = (22.5 + 7.0 + 7.0 + 8.5 + 9.0 + 9.0 + 8.0 + 8.5 + 15.0) / 13 = **94.5 / 13 = 7.27 / 10**

---

## Generation C — Scandinavian Living Room (1152x1536)

**Input** : Chantier en cours — piece rectangulaire vue en portrait depuis l'entree. Plafond en beton avec nervures/poutres apparentes et zone demolie (trou avec cables, isolant expose, carcasse bois visible). Mur du fond avec ouverture/porte a gauche + 2 personnes presentes (ouvrier et autre). Mur droit avec grande baie vitree (porte-fenetre + fenetre fixe), volet roulant noir visible, vue sur toits de briques rouges. Sol carrelage clair pose (pas brut). Mur gauche : ouverture vers couloir, briques partiellement apparentes, enduit degrade.

**Output** : Salon scandinave — canape 3 places beige/creme avec plaid, table basse ronde bois+blanc, fauteuil gris a oreilles, etagere echelle en bois clair, tapis texture creme. Suspension cylindrique blanche au plafond. Sol lames bois clair. Murs enduit blanc lisse. Plafond beton avec nervures PRESERVEES (texture brute conservee). Plante verte sur etagere.

### Preservation spatiale (CRITERE N°1)

- **Angle de vue** : IDENTIQUE — meme axe en portrait depuis l'entree, meme hauteur de camera. Tres bien.
- **Dimensions/proportions** : La piece semble fidele en largeur et profondeur. Le format portrait renforce la perception de profondeur, coherent entre input et output.
- **Baie vitree droite** : PRESERVEE — meme position, meme taille, meme division (porte-fenetre + fixe). Volet roulant noir visible en haut. Vue exterieure sur toits de briques rouges CONSERVEE. Excellent.
- **Ouverture mur du fond gauche** : PRESERVEE — l'ouverture/porte est visible au meme emplacement. Bien.
- **Ouverture mur gauche** : L'ouverture vers le couloir est preservee, visible en partie gauche.
- **Plafond** : Les nervures/poutres de beton sont PRESERVEES avec leur geometrie d'origine. La texture brute du beton est conservee (pas lissee). La zone demolie (trou avec cables/isolant) a ete proprement refermee — traitement correct d'un defaut de chantier. Tres bien.
- **Personnes** : Les 2 personnes visibles dans l'input ont ete supprimees — correct, c'est du home staging.

**Verdict preservation** : 8.0/10 — Bonne preservation. L'espace est clairement le MEME. La baie vitree est fidele (meme division, meme volet roulant noir, meme vue toits rouges), les ouvertures sont preservees, les nervures du plafond sont conservees avec leur texture brute. La zone demolie du plafond a ete reparee proprement. Les personnes ont ete retirees. Le chauffe-eau/chaudiere mural pres de la baie vitree semble preserve (element blanc visible au mur droit). Legere simplification du mur gauche (briques apparentes remplacees par enduit lisse — acceptable en finition). Les nervures de beton sont legerement plus propres que dans l'input (nettoyage de la patine) mais la geometrie est fidele.

### Analyse technique

- **Eclairage** : La lumiere naturelle vient de la baie vitree a droite — direction PRESERVEE. Le gradient lumineux (droite clair, gauche plus sombre) est fidele a l'input. Pas de warm shift visible — les murs restent blanc neutre. La suspension diffuse une lumiere douce coherente. Le contre-jour sur la baie est bien gere (pas de ciel crame).
- **Ombres** : Ombres portees sous le canape, sous la table basse, sous le fauteuil — coherentes avec la source a droite. Le tapis recoit une ombre douce du canape. Les ombres du mobilier en fond (etagere) sont plus douces — physiquement correct pour un eclairage lateral diffus.
- **Grain/Photorealisme** : Rendu propre (conforme decision fondateur). Les textures sont lisibles — bois de la table, tissu du canape (texture bouclee), plaid en maille. Le plafond beton avec ses nervures a une texture credible. Le sol en lames bois a un grain visible. Bon niveau de realisme.
- **Artefacts** : Pas d'artefact majeur detecte. La jonction mur/plafond est propre. La zone reparee du plafond (ancien trou) montre une texture beton coherente avec le reste.
- **Negative prompting** : Pas de fenetre hallucinee, pas de rideaux, pas de wall art. Conforme.
- **Echelle** : Le canape (~230cm) est a bonne echelle par rapport a la largeur de la piece. La table basse est proportionnee. Le fauteuil a oreilles est a echelle credible. L'etagere echelle au fond ne surcharge pas l'espace.

### Grille de notation

| # | Critere | Poids | Note | Justification |
|---|---------|-------|------|---------------|
| 1 | Preservation spatiale | x3 | 8.0 | Angle, baie vitree, ouvertures, nervures plafond preserves. Mur gauche simplifie (acceptable). |
| 2 | Contraintes lumiere | x1 | 8.5 | Lumiere laterale droite preservee, gradient fidele, pas de warm shift. |
| 3 | Vocabulaire photo | x1 | 7.5 | Rendu propre, textures credibles. Legerement "catalogue" mais correct. |
| 4 | Structure prompt | x1 | 8.0 | Scandinave reconnaissable — bois clair, textile neutre, minimalisme. |
| 5 | Negative prompting | x1 | 9.0 | Aucun element interdit genere. |
| 6 | Compatibilite multi-modeles | x1 | N/A | Modele unique. |
| 7 | Coherence I/O | x1 | 9.0 | Format portrait preserve, ratio fidele. |
| 8 | Richesse descriptive | x1 | 7.5 | Bon equilibre, peut-etre un peu minimaliste en accessoires (peu de coussins distinctifs). |
| 9 | Adaptabilite conditions | x1 | 9.0 | Chantier avec plafond demoli + personnes = bien gere. Excellent. |
| 10 | Rendu final credible | x2 | 8.0 | Passe pour une photo de salon renove. Le plafond beton brut + mobilier neuf est un contraste credible (style loft). |

**Note ponderee** : (8.0x3 + 8.5 + 7.5 + 8.0 + 9.0 + 9.0 + 7.5 + 9.0 + 8.0x2) / 13 = (24.0 + 8.5 + 7.5 + 8.0 + 9.0 + 9.0 + 7.5 + 9.0 + 16.0) / 13 = **98.5 / 13 = 7.58 / 10**

---

## Synthese et Plan d'Amelioration

### Notes recapitulatives

| Gen | Style | Note Lucas | Preservation spatiale | Probleme principal |
|-----|-------|------------|----------------------|-------------------|
| A (#169/#170) | Scandinavian Kitchen | **7.27/10** (revisee) | 6.5/10 | Piece elargie (FAIL geometrie) + tuyaux visibles + radiateur disparu |
| B (#171/#173) | Japandi Bathroom | **7.27/10** | 7.5/10 | Radiateur disparu, saut de luminosite |
| C (#172/#174) | Scandinavian Living | **7.58/10** | 8.0/10 | Mur gauche simplifie (mineur) |

**Moyenne session** : 7.37/10
**Meilleure generation** : C — Scandinavian Living (7.58) — meilleure preservation spatiale, plafond beton nervure conserve avec texture brute, gestion du chantier demoli + personnes.
**Pire generation** : A — Scandinavian Kitchen (7.27 apres correction) — elargissement de la piece = defaut structurel majeur.

### Problemes recurrents (P0-P4)

**P0 — Deformation geometrique (Gen A)**
Le modele a elargi la piece pour accommoder le mobilier de cuisine. C'est le pire defaut possible : modifier les dimensions de l'espace pour y faire rentrer les meubles. Hypothese : les prompts de cuisine specifient un agencement complet (plan de travail + meubles hauts + four) qui necessite une certaine largeur. Si la piece est trop etroite, le modele "pousse les murs" au lieu de reduire le mobilier.
- **Action** : Ajouter une directive explicite dans le builder passe 2 : "The room dimensions are FIXED. If furniture does not fit, use FEWER or SMALLER pieces. NEVER stretch or widen the room."
- **Action** : Pour les cuisines/petites pieces, ajouter une contrainte de densite : "This is a small room — use compact furniture only."

**P0 — Tuyaux de chantier non nettoyes (Gen A)**
Les gros tuyaux cuivre/PVC contre le mur du fond sont restes visibles. La passe 1 (surfaces) aurait du les traiter ("cover all visible plumbing, pipes, cable exits with wall finish").
- **Action** : Enrichir la directive de nettoyage passe 1 : "Cover all visible plumbing pipes, water supply lines, copper tubes, PVC pipes with the wall finish."

**P1 — Equipements muraux disparus (Gen A + B)**
Radiateur/convecteur supprime dans 2/3 generations. La directive EQUIPMENT_PRESERVATION existe mais n'est pas assez respectee par le modele.
- **Action** : Renforcer en listant "radiator, convector, wall heater" dans les termes explicites.
- **Action** : Ajouter "Radiators must remain visible — do not cover them with furniture or remove them."

**P2 — Saut de luminosite excessif (Gen B)**
La salle de bain sombre devient tres lumineuse. C'est physiquement justifiable (murs clairs) mais le saut est trop important — on dirait une piece differente.
- **Action** : Ajouter "If the input room is dark, keep the overall brightness SIMILAR — brighter surfaces are expected but the room should still feel like the same light environment."

**P3 — Rendu "catalogue" (Gen B, C)**
Le rendu est propre mais legerement trop parfait, trop "photo de catalogue IKEA". Il manque les micro-imperfections qui font "photo reelle" (ombres imparfaites, leger desordre, variation de texture).
- **Action** : Pas de grain (decision fondateur), mais ajouter "slight visual imperfections — a cushion slightly off-center, a book spine not perfectly aligned" pour casser le look catalogue.

**P4 — Personnes dans l'input (Gen C)**
Le modele a correctement supprime les 2 personnes presentes dans l'input. C'est le comportement attendu mais non documente. A surveiller que ca reste stable.

### Apprentissages v49

1. **Le modele deforme la piece pour accommoder le mobilier** — c'est le probleme le plus grave car invisible pour un utilisateur non averti. Il faut une garde-fou explicite.
2. **Les tuyaux de plomberie bruts ne sont PAS couverts par "cover outlets and junction boxes"** — il faut nommer explicitement les tuyaux.
3. **La preservation d'equipements muraux reste fragile** malgre les directives existantes — le modele les supprime quand ils "derangent" la composition.
4. **Le plafond beton nervure (Gen C) est BIEN preserve** — les corrections Sprint 18 (#148) fonctionnent. La texture brute, les aretes irregulieres et la patine sont fideles.
5. **Le traitement des defauts de chantier (trou au plafond, Gen C) est correct** — le modele repare proprement sans lisser l'ensemble.
6. **Les personnes dans l'input sont correctement supprimees** — bon comportement par defaut du modele.
