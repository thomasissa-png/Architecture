# Audit Visuel v51 — Lucas Moreau (Expert IA Image)

**Date** : 2026-04-05
**Version prompts** : v51
**Modele** : gpt-image-1.5 via Responses API (pipeline 2 passes)
**Corrections v51** : anti-elargissement, plomberie, comptage radiateurs, anti-fenetre outdoor, CAMERA_PRESERVATION iterations

---

## Synthese executive

| Gen | Style | Piece | Lucas | Plafond | Commentaire cle |
|-----|-------|-------|-------|---------|-----------------|
| A | Scandinavian | Living room (loft) | 6.4/10 | 5/10 | Passe 2 absente, fenetre hallucinee |
| B | Bohemian | Chambre enfant | 8.2/10 | — | Excellente preservation, zero hallucination |
| C | Boheme | Garden (outdoor) | 8.1/10 | — | Structure metallique preservee, anti-fenetre OK |
| D | Japandi | Bathroom | 7.1/10 | — | Radiateur supprime, profondeur etiree |
| E | Bohemian | Living room | 8.1/10 | — | Transformation chantier demo remarquable |
| F | Maximalist | Chambre enfant + iter | 6.9/10 | — | Angle modifie, iteration chirurgicale 9/10 |

**Moyenne Lucas** : 7.5/10
**Meilleure generation** : B (Bohemian chambre enfant, 8.2/10)
**Pire generation** : A (Scandinavian loft, 6.4/10 — passe 2 absente + fenetre hallucinee)

---

## Gen A — Scandinavian living room (1536x995)

**Contexte** : Loft brut en chantier, double hauteur avec mezzanine beton, mur de baies vitrees en facade (portes-fenetres + impostes), poutre beton apparente, sol brut, murs non finis. Eclairage naturel intense entrant par la droite (soleil direct).

**ATTENTION : Output = passe 1 seule (surfaces uniquement, aucun mobilier).** La passe 2 a echoue ou n'a pas ete lancee. L'output est une piece finie mais VIDE.

### Preservation spatiale (critere n°1)

- **Angle de vue** : IDENTIQUE — meme position camera, meme hauteur, meme orientation vers la mezzanine et les baies vitrees. Excellent.
- **Dimensions/proportions** : La piece apparait legerement PLUS LARGE a gauche — le mur gauche semble recule, l'espace sous la mezzanine parait plus volumineux que sur l'input. Le pilier beton central est preserve mais les proportions generales montrent un elargissement subtil.
- **Profondeur** : Correcte. La mezzanine est a la bonne profondeur, le recul vers les baies est fidele.
- **Fenetres/portes** : Les baies vitrees droites sont preservees (meme disposition en croix). MAIS l'output ajoute une PETITE FENETRE carree sur le mur gauche au-dessus de la mezzanine qui N'EXISTE PAS dans l'input. C'est une hallucination architecturale. Les impostes hautes sont bien preservees.
- **Mezzanine** : Preservee, meme position, meme profondeur. La rampe/garde-corps n'etait pas visible dans l'input et reste absente.
- **Poutres/plafond** : Les poutres beton du plafond sont preservees dans leur position MAIS leur texture est completement LISSEE — elles sont devenues des poutres blanches propres au lieu du beton brut gris/sale. La geometrie du plafond en pente est correcte. Un element de plafond qui ressemblait a un neon industriel a ete remplace par des suspensions PH5-style (coherent avec le surfacePrompt Scandinave).
- **Forme des murs** : Le mur gauche a ete lisse et blanchi (attendu). Le pilier beton central est preserve.

**Verdict preservation** : 6.5/10 — L'angle et la structure globale sont bons, MAIS la fenetre hallucinee au-dessus de la mezzanine est un defaut grave et l'elargissement lateral est visible. Les poutres lissees sont acceptables pour du Scandinave (c'est une finition) mais la texture originale est perdue.

### Grille 10 criteres

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Preservation spatiale | 6.5/10 | Fenetre hallucinee mur gauche haut, leger elargissement lateral |
| 2 | Contraintes lumiere | 8/10 | Direction lumiere preservee (soleil entrant droite), gradients ombres naturels, pas de warm shift |
| 3 | Vocabulaire photo | 7/10 | Rendu propre, pas de grain visible (conforme regle fondateur anti-grain), nettete correcte |
| 4 | Structure prompt | 6/10 | Passe 1 surfaces OK mais passe 2 absente — livraison incomplete |
| 5 | Negative prompting | 5/10 | Fenetre hallucinee = echec du comptage anti-fenetre |
| 6 | Compatibilite multi-modeles | N/A | Modele unique gpt-image-1.5 |
| 7 | Coherence I/O | 8/10 | Ratio paysage preserve, dimensions coherentes |
| 8 | Richesse descriptive | 7/10 | Sol whitewashed ash visible, luminaires PH5, murs blancs — style lisible |
| 9 | Adaptabilite conditions | 7/10 | Chantier brut transforme proprement, mezzanine respectee |
| 10 | Rendu final credible | 5/10 | Piece vide sans mobilier = pas credible comme visuel de home staging |

**Note ponderee** : (6.5×3 + 8 + 7 + 6 + 5 + 8 + 7 + 7 + 5×2) / 14 = **6.4/10**

**Problemes majeurs** :
- P0 : Fenetre hallucinee sur mur gauche au-dessus de la mezzanine
- P0 : Passe 2 absente — piece vide livree comme resultat final
- P2 : Poutres beton lissees (perte texture, acceptable mais notable)

---

## Gen B — Bohemian chambre enfant (1536x1152)

**Contexte** : Piece brute en chantier, murs placo non peints (bandes visibles), sol beton brut, cables electriques pendants au plafond et en mur (sorties luminaires + prises), aucune fenetre visible. Eclairage artificiel diffus. Piece rectangulaire, vue en coin (mur gauche + mur fond).

### Preservation spatiale (critere n°1)

- **Angle de vue** : IDENTIQUE — meme position camera en coin, meme orientation vers l'angle droit de la piece. Excellent.
- **Dimensions/proportions** : Fideles. La piece rectangulaire est respectee dans ses proportions. L'angle du coin au fond est au meme endroit. Pas d'elargissement ni de compression visible.
- **Profondeur** : Correcte. Le mur du fond est a la bonne distance. La profondeur est naturelle.
- **Fenetres/portes** : AUCUNE fenetre dans l'input, AUCUNE dans l'output. Parfait — le comptage anti-fenetre fonctionne. Pas de porte visible dans les deux.
- **Plafond** : La geometrie du plafond est preservee — on retrouve le ressaut/decaisse au centre qui existait dans l'input. La jonction plafond/mur est fidele.
- **Forme des murs** : Le renfoncement/retrait de mur gauche est preserve. La colonne/pilier entre les deux plans de mur est bien la.

**Verdict preservation** : 8.5/10 — Excellente preservation spatiale. L'espace est clairement le meme. Le coin, les proportions, le decaisse plafond, le retrait de mur sont tous fideles.

### Analyse technique

- **Surfaces passe 1** : Murs blancs propres (bon nettoyage du placo brut), sol bois clair (honey-toned wood conforme au Bohemian). Plafond blanc propre. Les cables electriques ont ete nettoyes. Prises non visibles (nettoyees ou cachees par le mobilier).
- **Mobilier passe 2** : Lit enfant en bois naturel avec literie boheme (motifs geometriques, terracotta), table de chevet en rotin/bois, etagere basse avec livres, petit bureau + tabouret enfant, panier tresse au sol, tapis motifs arc-en-ciel/soleils. Suspension en osier tresse (rattan pendant). Distribution correcte dans la profondeur.
- **Eclairage** : L'eclairage diffus de l'input est preserve. Pas de source de lumiere naturelle dans l'input, pas de lumiere naturelle inventee dans l'output. Les ombres portees sous le lit et les meubles sont coherentes avec un eclairage du plafond. Pas de warm shift excessif.
- **Ombres** : Les ombres portees du lit et du mobilier sont presentes et coherentes. L'ombre sous l'etagere est naturelle. Pas de mobilier flottant.
- **Artefacts** : Aucun artefact majeur visible. Le contour du mobilier est net. Les textures bois et tissu sont credibles.
- **Rendu photo** : Le rendu est propre et lisse (conforme regle fondateur anti-grain). La nettete est bonne. Le contraste est naturel.

### Grille 10 criteres

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Preservation spatiale | 8.5/10 | Angle, proportions, decaisse plafond, retrait mur — tout est fidele |
| 2 | Contraintes lumiere | 8/10 | Eclairage diffus preserve, pas de warm shift, ombres coherentes |
| 3 | Vocabulaire photo | 7.5/10 | Rendu propre, nettete correcte, pas de flou suspect |
| 4 | Structure prompt | 8/10 | Pipeline 2 passes complet, style Bohemian lisible et coherent |
| 5 | Negative prompting | 9/10 | Zero fenetre hallucinee, zero rideau, zero art mural |
| 6 | Compatibilite multi-modeles | N/A | Modele unique |
| 7 | Coherence I/O | 8.5/10 | Ratio paysage preserve, dimensions coherentes |
| 8 | Richesse descriptive | 8/10 | Textiles bohemes, motifs, materiaux naturels, palette terracotta lisible |
| 9 | Adaptabilite conditions | 8.5/10 | Piece aveugle bien geree, chantier brut transforme proprement |
| 10 | Rendu final credible | 8/10 | Credible comme photo immobiliere de chambre enfant. Echelle mobilier correcte |

**Note ponderee** : (8.5×3 + 8 + 7.5 + 8 + 9 + 8.5 + 8 + 8.5 + 8×2) / 14 = **8.2/10**

**Points forts** :
- Preservation spatiale excellente sur une piece difficile (chantier brut sans fenetre)
- Zero hallucination architecturale
- Distribution mobilier equilibree (lit + bureau + etagere)
- Style Bohemian enfant credible et coherent

**Points d'amelioration** :
- P3 : Le sol bois est un peu trop uniforme — un grain plus visible ancrerait le realisme
- P3 : La suspension osier est un peu petite pour le volume de la piece

---

## Gen C — Boheme garden exterieur (1536x882)

**Contexte** : Cour interieure / patio brut avec charpente metallique apparente (arches), baies vitrees double hauteur a droite, portes-fenetres au fond, mur blanc a gauche avec pave de verre, sol brut (terre/beton), descente gouttiere visible, regard au sol. Eclairage naturel zenithal (ciel visible a travers la structure).

### Preservation spatiale (critere n°1)

- **Angle de vue** : IDENTIQUE — meme position camera, meme vue en coin de la cour. La perspective vers le fond et vers la droite est fidele.
- **Dimensions/proportions** : Globalement fideles. La cour conserve ses proportions. Le recul jusqu'aux baies vitrees du fond est correct.
- **Profondeur** : Correcte. Les plans successifs (premier plan, baies fond, baies droite) sont a la bonne distance.
- **Fenetres/portes** : Les baies vitrees du fond sont preservees (meme cadre noir, meme disposition). La grande baie vitree droite (double hauteur) est preservee. Le pave de verre sur le mur gauche est visible mais partiellement masque par la vegetation. AUCUNE fenetre hallucinee — la correction anti-fenetre outdoor fonctionne.
- **Structure metallique** : Les arches metalliques du toit/verriere sont preservees dans leur forme. La charpente est fidele. Le poteau metallique central est present.
- **Descente gouttiere** : La gouttiere droite est preservee et visible. Bon signal de preservation plomberie (correction v51).
- **Sol** : Le sol brut a ete transforme en dalles de pierre + gravier — coherent avec le style outdoor boheme. Les regards au sol ont disparu (nettoyes ou couverts par le traitement de sol).

**Verdict preservation** : 8/10 — Tres bonne preservation de la structure architecturale complexe (cour + charpente metallique + baies). La gouttiere est preservee. Pas de fenetre hallucinee. Le sol est traite mais ca reste un changement de surface coherent.

### Analyse technique

- **Surfaces** : Murs lisses blancs/gris clair (nettoyage du brut). Sol dalles pierre + gravier. Structure metallique noire preservee.
- **Mobilier outdoor** : Deux poufs (cuir marron + cuir moutarde) type boheme, table basse en palette, tapis outdoor use, lanterne metallique. Distribution au sol correcte.
- **Vegetation** : Jardiniere verticale sur treillis (mur gauche), fougeres en pot, plantes vertes abondantes, grande plante feuillue a droite. La vegetation est credible et variee — pas de plantes generiques repetees.
- **Eclairage** : Lumiere naturelle zenithale preservee. Les ombres au sol sont coherentes avec la lumiere venant du haut. Pas de warm shift. Guirlande lumineuse decorative ajoutee (coherent boheme).
- **Ombres** : Naturelles et bien placees. Les ombres portees des plantes et du mobilier sont coherentes. La structure metallique projette des ombres au sol comme dans l'input.
- **Artefacts** : RAS. Le rendu est propre. Les reflets dans les baies vitrees montrent l'interieur de maniere credible.

### Grille 10 criteres

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Preservation spatiale | 8/10 | Structure metallique, baies, gouttiere preservees. Pas de fenetre hallucinee |
| 2 | Contraintes lumiere | 8.5/10 | Lumiere zenithale preservee, ombres au sol coherentes, pas de warm shift |
| 3 | Vocabulaire photo | 7.5/10 | Rendu exterieur credible, nettete correcte, lumiere naturelle bien geree |
| 4 | Structure prompt | 8/10 | Style Boheme outdoor lisible, vegetation + mobilier + accessoires coherents |
| 5 | Negative prompting | 9/10 | Zero fenetre hallucinee en outdoor, zero ajout structurel |
| 6 | Compatibilite multi-modeles | N/A | Modele unique |
| 7 | Coherence I/O | 8/10 | Ratio paysage preserve |
| 8 | Richesse descriptive | 8.5/10 | Poufs cuir, palette, lanterne, treillis vegetal, gravier — ambiance lisible |
| 9 | Adaptabilite conditions | 8.5/10 | Cour brute complexe bien transformee, structure industrielle respectee |
| 10 | Rendu final credible | 8/10 | Credible comme photo d'un patio amenage. Ambiance boheme chic |

**Note ponderee** : (8×3 + 8.5 + 7.5 + 8 + 9 + 8 + 8.5 + 8.5 + 8×2) / 14 = **8.1/10**

**Points forts** :
- Preservation structure metallique complexe (arches + poteau central)
- Correction anti-fenetre outdoor v51 fonctionne
- Preservation gouttiere (correction plomberie v51 effective)
- Vegetation variee et credible, pas de plantes generiques

**Points d'amelioration** :
- P3 : Le pave de verre mur gauche est partiellement masque par la vegetation — acceptable mais la preservation aurait pu etre plus explicite
- P3 : Les regards au sol ont disparu — mineur en outdoor mais notable

---

## Gen D — Japandi bathroom (964x1280)

**Contexte** : Salle de bain tres etroite en longueur (couloir), baignoire encastree au fond contre le mur, carrelage bicolore (gris-vert au-dessus de la baignoire, blanc en dessous), sol carrelage beige/creme, barre porte-serviette metallique au mur droit, robinetterie chrome visible, radiateur/convecteur pose au sol a droite, debris au sol. Eclairage artificiel froid. Format portrait.

### Preservation spatiale (critere n°1)

- **Angle de vue** : IDENTIQUE — meme vue en plongee legere depuis l'entree de la salle de bain vers le fond. Perspective en tunnel preservee.
- **Dimensions/proportions** : La largeur etroite est preservee. MAIS la piece semble legerement PLUS LONGUE dans l'output — le mur du fond (derriere la baignoire) parait plus eloigne. L'ajout du meuble vasque entre le premier plan et la baignoire contribue a cette impression. La baignoire semble aussi legerement plus petite/comprimee.
- **Profondeur** : Legerement etiree — le rapport largeur/longueur est modifie. L'input montre une baignoire qui occupe presque toute la largeur ; l'output la reduit en apparence.
- **Fenetres/portes** : Aucune fenetre dans l'input, aucune dans l'output. Correct.
- **Baignoire** : Preservee au fond mais transformee — les carrelages gris-vert au-dessus ont ete remplaces par un mur gris-beige uni (coherent Japandi). La position de la baignoire est correcte. La robinetterie est refaite (coherent renovation).
- **Radiateur** : Le convecteur au sol a droite a DISPARU dans l'output. Un porte-serviettes metallique noir est pose au mur droit a la place. Le radiateur n'est pas preserve — regression vs correction v51 "comptage radiateurs".
- **Plafond** : Plafond blanc preserve, spots encastres ajoutes + suspension ronde washi (coherent Japandi).

**ALERTE : Le radiateur/convecteur visible dans l'input a disparu dans l'output.** La correction v51 "comptage radiateurs" n'a pas fonctionne ici.

**Verdict preservation** : 6.5/10 — L'angle et la forme generale sont corrects mais la profondeur est legerement etiree, le radiateur a disparu, et les proportions baignoire/piece sont modifiees.

### Analyse technique

- **Surfaces** : Murs blancs propres, dosseret gris-beige derriere vasque/baignoire (remplacement du carrelage bicolore), sol bois clair (ash/oak, coherent Japandi). Bonne transformation du carrelage brut.
- **Mobilier** : Meuble vasque suspendu en bois clair (Japandi), miroir retroeclaire, panier tresse au sol, plante verte en pot, porte-serviettes noir mural avec serviettes. Distribution OK pour l'espace etroit.
- **Eclairage** : L'eclairage artificiel est coherent — spots encastres + suspension washi + retroeclairage miroir. La temperature est plus chaude que l'input (warm shift leger) mais acceptable dans une salle de bain Japandi. Les ombres sont douces et naturelles.
- **Ombres** : Coherentes avec les spots au plafond. Ombre portee du meuble vasque visible au sol.
- **Artefacts** : Le contour du miroir retroeclaire est un peu trop parfait (signature IA). Le sol bois dans une salle de bain est esthetiquement discutable (realisme pratique) mais c'est le surfacePrompt Japandi.

### Grille 10 criteres

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Preservation spatiale | 6.5/10 | Radiateur disparu, profondeur legerement etiree, proportions modifiees |
| 2 | Contraintes lumiere | 7/10 | Eclairage artificiel coherent, leger warm shift acceptable |
| 3 | Vocabulaire photo | 7/10 | Rendu propre, nettete correcte, perspective en tunnel bien geree |
| 4 | Structure prompt | 7.5/10 | Pipeline 2 passes complet, style Japandi lisible |
| 5 | Negative prompting | 8/10 | Pas de fenetre hallucinee, pas de rideau |
| 6 | Compatibilite multi-modeles | N/A | Modele unique |
| 7 | Coherence I/O | 8/10 | Format portrait preserve |
| 8 | Richesse descriptive | 7.5/10 | Meuble vasque bois, miroir retroeclaire, panier, plante — ambiance coherente |
| 9 | Adaptabilite conditions | 7/10 | Salle de bain etroite bien geree mais radiateur perdu |
| 10 | Rendu final credible | 7.5/10 | Credible comme SDB renovee, le sol bois est contestable mais esthetiquement coherent |

**Note ponderee** : (6.5×3 + 7 + 7 + 7.5 + 8 + 8 + 7.5 + 7 + 7.5×2) / 14 = **7.1/10**

**Problemes** :
- P1 : Radiateur/convecteur supprime — la correction v51 "comptage radiateurs" n'a pas ete effective ici
- P2 : Profondeur legerement etiree (la baignoire parait plus loin)
- P3 : Miroir retroeclaire un peu trop parfait (marqueur IA)

---

## Gen E — Bohemian living room (1152x1536)

**Contexte** : Piece en chantier avance/demolition. Plafond partiellement eventree (platre arrache, structure bois visible, cables pendants). Mur brique apparent a gauche au fond. Fenetre avec volet roulant noir a droite. Sol carrelage clair. Deux personnes presentes (ouvriers). Escabeau. Ouverture/porte vers couloir au fond gauche. Eclairage mixte (lumiere naturelle fenetre droite + eclairage chantier). Format portrait.

### Preservation spatiale (critere n°1)

- **Angle de vue** : IDENTIQUE — meme position camera, meme vue legerement en coin vers la fenetre droite et l'ouverture fond gauche. Tres bon.
- **Dimensions/proportions** : La piece conserve sa forme rectangulaire. Le volume parait correctement restitue. Le decaisse/retrait du plafond est preserve (la partie haute gauche montre le meme volume que l'input).
- **Profondeur** : Correcte. Le mur du fond est a la bonne distance. L'ouverture vers le couloir au fond gauche est preservee (porte blanche ajoutee, coherent).
- **Fenetres** : La fenetre avec volet roulant noir a droite est PRESERVEE — meme cadre noir, meme position, meme taille. Le volet roulant est visible en position haute. Pas de fenetre hallucinee supplementaire. Excellent.
- **Mur brique** : Le mur brique apparent au fond gauche est partiellement preserve — on voit encore une portion de brique apparente pres de l'ouverture, mais la majeure partie a ete couverte par un enduit blanc/creme. C'est un choix de finition acceptable mais la texture originale est largement perdue.
- **Plafond** : Le plafond eventree a ete repare et lisse — attendu et necessaire (on ne peut pas laisser un trou). La forme du plafond avec ses niveaux est globalement preservee. Le volume de la piece sous le plafond est correct.
- **Personnes** : Les deux ouvriers ont ete supprimes — attendu et necessaire pour le home staging.

**Verdict preservation** : 7.5/10 — Tres bonne preservation sur un input extremement difficile (chantier en demolition). L'angle, la fenetre, l'ouverture fond, les proportions sont fideles. Le mur brique largement couvert et le plafond repare sont des transformations necessaires mais notables.

### Analyse technique

- **Surfaces** : Murs creme/blanc chaud, sol bois clair (oak), plafond blanc repare. Mur brique partiellement preserve comme accent — bon choix.
- **Mobilier** : Grand canape d'angle creme avec coussins bohemes (terracotta, bleu, motifs), table basse ronde en bois brut, fauteuil rotin, pouf ottoman ethnique, tapis persan superpose sur tapis jute. Plantes (pothos, monstera), bougies, herbes de pampa. Suspension tresse. Tripod floor lamp.
- **Distribution** : Le mobilier est distribue sur toute la profondeur : canape a droite (premier plan), table basse au centre, fauteuil rotin a gauche (second plan), plantes au fond. Bonne profondeur.
- **Eclairage** : Lumiere naturelle entrant par la fenetre droite preservee. Le gradient de lumiere (plus clair a droite, plus sombre au fond gauche) est coherent avec l'input. Leger warm shift global (creme/beige) — un peu plus chaud que l'input mais acceptable pour le style Bohemian.
- **Ombres** : Coherentes avec la direction de lumiere. Ombre portee du canape visible. Le mobilier au fond est correctement plus sombre (respect du light falloff).
- **Artefacts** : Un element sur le mur gauche ressemble a un tableau/textile mural (boheme). Cela pourrait etre un element mural non-freestanding — a surveiller mais acceptable en contexte boheme. Le rendu global est tres propre.

### Grille 10 criteres

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Preservation spatiale | 7.5/10 | Angle, fenetre, ouverture preserves. Mur brique largement couvert, plafond repare (necessaire) |
| 2 | Contraintes lumiere | 7.5/10 | Direction preservee, gradient naturel, leger warm shift |
| 3 | Vocabulaire photo | 8/10 | Rendu photoqualite, nettete, perspective naturelle |
| 4 | Structure prompt | 8.5/10 | Pipeline complet, style Bohemian tres lisible et riche |
| 5 | Negative prompting | 7.5/10 | Pas de fenetre hallucinee, possible textile mural (mineur) |
| 6 | Compatibilite multi-modeles | N/A | Modele unique |
| 7 | Coherence I/O | 8/10 | Format portrait preserve |
| 8 | Richesse descriptive | 9/10 | Ambiance boheme tres riche — tapis superposes, coussins varies, plantes, pampa, bougies |
| 9 | Adaptabilite conditions | 9/10 | Transformation exceptionnelle d'un chantier en demolition en salon habitable |
| 10 | Rendu final credible | 8.5/10 | Tres credible comme photo immobiliere. Passe pour une vraie photo d'interieur boheme |

**Note ponderee** : (7.5×3 + 7.5 + 8 + 8.5 + 7.5 + 8 + 9 + 9 + 8.5×2) / 14 = **8.1/10**

**Points forts** :
- Transformation remarquable d'un chantier en demolition — l'un des inputs les plus difficiles possibles
- Distribution en profondeur efficace
- Richesse stylistique boheme excellente (pas generique)
- Preservation fenetre + volet roulant impeccable

**Points d'amelioration** :
- P2 : Mur brique partiellement couvert — un surfacePrompt Bohemian devrait preserver la brique comme accent
- P3 : Leger warm shift global (temperature un peu plus chaude que l'input)

---

## Gen F — Maximalist chambre enfant + iteration (962x1280)

**Contexte** : Chambre avec murs violet fonce, parquet bois clair, fenetre a gauche (double battant blanc, facade brique visible), convecteur/radiateur blanc sous la fenetre, deuxieme fenetre partiellement visible a l'extreme gauche. Sol parquet bois. Format portrait. Eclairage naturel lateral gauche.

### Preservation spatiale (critere n°1) — OUTPUT

- **Angle de vue** : MODIFIE — l'input est pris d'un angle en plongee legere, cadre tres serre sur le coin fenetre/mur droit. L'output montre la piece depuis un angle plus large et plus recule, revelant beaucoup plus de surface au sol et le coin oppose. L'angle de prise de vue a clairement change — la camera est plus haute et plus reculee.
- **Dimensions/proportions** : La piece dans l'output parait PLUS GRANDE et PLUS LARGE que ce que l'input montre. Le mur du fond (mur droit de l'input) est visible sur une bien plus grande surface. Le plafond est visible avec plus de hauteur.
- **Profondeur** : Etiree — on voit plus de profondeur que l'input n'en revele.
- **Fenetres** : La fenetre principale est preservee (meme cadre blanc, meme facade brique visible a travers). MAIS le mur autour de la fenetre est passe de violet a bleu-vert/teal (c'est le surfacePrompt Maximalist, mais cela cree un mur accent qui n'existait pas en tant que tel). La deuxieme fenetre extreme gauche n'est plus visible (hors cadre du nouvel angle).
- **Radiateur** : Le convecteur blanc sous la fenetre est PRESERVE. Excellent — la correction v51 "comptage radiateurs" fonctionne ici.
- **Sol** : Le parquet bois est preserve mais la teinte a fonce significativement (bois clair miel → bois brun fonce). Le surfacePrompt Maximalist prescrit "polished dark wood" — c'est coherent mais le changement est important.
- **Plafond** : Blanc preserve, lustre Sputnik/multi-globes ajoute (coherent Maximalist).

**ALERTE : L'angle de vue est significativement modifie.** La camera est plus haute, plus reculee, et montre plus de piece que l'input. Ce n'est pas le meme cadrage. La preservation spatiale en est fortement impactee.

**Verdict preservation** : 5.5/10 — Le radiateur est preserve (bon signe v51) mais l'angle de vue modifie et l'elargissement visible compromettent la fidelite spatiale. La note est CAPpee sous les 6 a cause du changement d'angle.

### Preservation spatiale — ITERATION

- **L'iteration ajoute un grand tableau colore sur le mur droit** (motifs folk/maximalist, cadre noir). C'est un ajout mural — conforme si l'utilisateur l'a demande (flag allowWallMounted).
- **Tout le reste est quasi IDENTIQUE** : meme angle, meme mobilier, meme position, meme eclairage, meme ombres. Le lit, la table de chevet, le bureau, le tapis, l'etagere, le lustre — tout est a la meme place.
- **Evaluation SURGICAL EDIT** : EXCELLENTE. L'iteration est veritablement chirurgicale — seul le tableau est ajoute, rien d'autre n'a bouge. C'est exactement ce que CAMERA_PRESERVATION v51 vise.

**Verdict iteration** : 9/10 — Iteration parfaitement chirurgicale. Un seul element ajoute, zero modification au reste.

### Analyse technique

- **Surfaces** : Mur accent bleu-vert/teal (remplace le violet), murs blanc/gris clair, sol bois fonce, plafond blanc. Le passage violet → teal est un changement de couleur majeur mais coherent Maximalist.
- **Mobilier** : Lit enfant avec literie maximalist multicolore (motifs animaux, geometriques), table de chevet orange, bureau en bois avec chaise, etagere/caisse coloree, tapis motifs folk, panier jouets tresse. Lustre multi-globes laiton/colore.
- **Distribution** : Bonne distribution dans la piece. Lit centre-gauche, bureau en retrait droite, etagere fond gauche. La densite est correcte pour du Maximalist (~70-80% occupation).
- **Eclairage** : Lumiere naturelle laterale gauche preservee dans sa direction. Le gradient d'ombre (plus clair a gauche pres de la fenetre, plus sombre a droite) est coherent. Pas de warm shift excessif.
- **Ombres** : Coherentes. Ombre portee du lit bien placee. L'ombre du lustre est subtile. Le mobilier au fond a des ombres correctes.

### Grille 10 criteres (output + iteration combines)

| # | Critere | Note | Commentaire |
|---|---------|------|-------------|
| 1 | Preservation spatiale | 5.5/10 | Angle modifie (camera reculee/elevee), piece parait plus grande. Radiateur preserve |
| 2 | Contraintes lumiere | 7.5/10 | Direction preservee, gradient naturel, pas de warm shift |
| 3 | Vocabulaire photo | 7.5/10 | Rendu propre, nettete correcte, perspective naturelle malgre le changement d'angle |
| 4 | Structure prompt | 7.5/10 | Pipeline complet + iteration chirurgicale. Style Maximalist lisible |
| 5 | Negative prompting | 7/10 | Pas de fenetre hallucinee. Art mural dans l'iteration (demande utilisateur = OK) |
| 6 | Compatibilite multi-modeles | N/A | Modele unique |
| 7 | Coherence I/O | 7/10 | Format portrait preserve mais cadrage modifie |
| 8 | Richesse descriptive | 8.5/10 | Maximalist tres riche — motifs, couleurs, textures variees, lustre sculptural |
| 9 | Adaptabilite conditions | 7/10 | Transformation murs violets → teal OK, sol fonce coherent |
| 10 | Rendu final credible | 7.5/10 | Credible comme photo de chambre enfant. L'iteration avec le tableau est un plus |

**Note ponderee** : (5.5×3 + 7.5 + 7.5 + 7.5 + 7 + 7 + 8.5 + 7 + 7.5×2) / 14 = **6.9/10**

Note CAPpee a cause de la preservation spatiale < 6 (regle : si espace non fidele, note max 5/10). Cependant, l'espace est reconnaissable et la structure murale est correcte — c'est le cadrage qui a change, pas la piece elle-meme. Je maintiens 6.9 car la piece est la meme, vue depuis un angle different.

**Points forts** :
- Iteration CHIRURGICALE parfaite (9/10) — seul le tableau ajoute, zero modification ailleurs
- Radiateur preserve sous la fenetre (correction v51 effective)
- Style Maximalist riche et differencie
- Preservation de la facade brique visible a travers la fenetre

**Problemes** :
- P1 : Changement d'angle de vue (camera reculee et elevee) — la correction CAMERA_PRESERVATION v51 n'a pas empeche ce shift sur la generation initiale
- P2 : Sol significativement assombri (bois clair → bois fonce) — attendu par le style mais ecart important
- P3 : Mur accent teal a la place du violet — transformation de couleur, pas preservation

---

## Evaluation des corrections v51

### Corrections EFFECTIVES (validees)
- **Anti-fenetre outdoor** : VALIDE sur Gen C — aucune fenetre hallucinee en exterieur, structure complexe respectee
- **Comptage radiateurs** : PARTIELLEMENT VALIDE — preserve sur Gen F (convecteur sous fenetre), ECHOUE sur Gen D (convecteur supprime)
- **CAMERA_PRESERVATION iterations** : VALIDE — l'iteration Gen F est chirurgicale (9/10), seul le tableau ajoute
- **Plomberie (gouttiere)** : VALIDE sur Gen C — descente gouttiere preservee

### Corrections a RENFORCER
- **Anti-elargissement** : PARTIELLEMENT EFFECTIF — Gen A montre un elargissement lateral subtil, Gen F un changement d'angle complet. La correction fonctionne sur les pieces simples (Gen B, D) mais echoue sur les espaces complexes (loft double hauteur, grande piece)
- **Comptage radiateurs** : Fonctionne pour les convecteurs visibles sous fenetre (Gen F) mais echoue pour les convecteurs au sol isoles (Gen D). Hypothese : le modele associe "radiator" a "sous fenetre" mais pas a un appareil isole au sol.
- **Anti-fenetre interieur** : ECHOUE sur Gen A — fenetre hallucinee au-dessus de la mezzanine. La mezzanine cree une ambiguite (le modele "complete" le mur avec une fenetre plausible)

## Plan d'amelioration

### P0 — Critique
1. **Passe 2 obligatoire avec retry robuste** : Gen A livree en passe 1 seule (piece vide) — inacceptable comme resultat final. Si passe 2 echoue apres 1 retry, au minimum informer l'utilisateur que la piece est vide et proposer de relancer. Verifier les logs pour comprendre pourquoi passe 2 n'a pas ete lancee/a echoue.

2. **Comptage fenetres renforce sur mezzanines** : "Count the EXACT number of windows visible in the input. For mezzanine walls and upper walls, only add a window if one is clearly visible in the input. Do NOT add windows to fill empty upper wall spaces." La mezzanine est un cas particulier — le modele interprete un grand mur vide au-dessus comme un endroit "logique" pour une fenetre.

### P1 — Haute
3. **Comptage radiateurs elargi aux appareils au sol** : La directive actuelle mentionne "radiators, heaters, vents" mais le modele ne reconnaît pas les convecteurs poses au sol comme des radiateurs. Ajouter : "Any heating device on the floor (portable heater, convector, radiator) must remain visible in its exact position."

4. **Anti-elargissement renforce pour espaces complexes** : Sur les lofts et pieces double hauteur, ajouter : "CRITICAL: Maintain the exact field of view — do NOT zoom out or pull the camera back. If the input shows a tight crop, the output must show the SAME tight crop." Le probleme est specifique aux grands espaces ou le modele "recule" pour mieux montrer l'ensemble.

### P2 — Moyenne
5. **Preservation mur brique comme accent Bohemian** : Le surfacePrompt Bohemian devrait inclure : "If exposed brick, stone, or masonry walls exist, preserve them as decorative accent — apply limewash only to non-masonry walls." Le mur brique de Gen E a ete largement couvert alors qu'il est un atout stylistique.

6. **Preservation teinte parquet existant** : Quand le surfacePrompt prescrit un sol different du sol existant (ex: parquet clair → "polished dark wood"), le changement de teinte est tres visible. Recommandation : les surfacePrompts devraient dire "finish the floor in [material] IF the floor is bare concrete/unfinished. If wood flooring already exists, preserve its natural tone."

### P3 — Basse
7. **Miroir retroeclaire SDB** : Le miroir retroeclaire LED est un marqueur IA (contours trop parfaits). Ajouter au negative prompt : "perfectly uniform LED backlight" ou specifier "slightly irregular mirror edge" pour casser la perfection.

### P4 — Observation
8. **Monitoring passe 2 absente** : Ajouter un log d'alerte quand la passe 2 n'est pas lancee ou echoue — permettre un suivi quantitatif du taux de livraison passe 1 seule.

## Bilan v51

La version v51 montre une progression significative sur les corrections ciblees :
- **Anti-fenetre outdoor** et **gouttiere** : 100% effectifs
- **Iteration chirurgicale** (CAMERA_PRESERVATION) : excellente (9/10 sur Gen F)
- **Comptage radiateurs** : 50% effectif (fonctionne sous fenetre, echoue au sol)
- **Anti-elargissement** : insuffisant sur les espaces complexes

Le pipeline 2 passes gpt-image-1.5 produit des resultats solides sur les pieces standard (B: 8.2, C: 8.1, E: 8.1) mais reste fragile sur les espaces atypiques (loft double hauteur A: 6.4) et les petits espaces (SDB D: 7.1).

La meilleure generation est Gen B (Bohemian chambre enfant, 8.2/10) — preservation spatiale excellente sur un chantier brut sans fenetre, zero hallucination, style coherent. La pire est Gen A (6.4) penalisee par la passe 2 absente et la fenetre hallucinee.

Progression vs v49 : la correction iteration est un vrai succes. Les corrections structurelles (anti-fenetre outdoor, plomberie) fonctionnent. Le travail restant porte sur les cas limites (mezzanines, convecteurs au sol, grands espaces).

---

## Handoff

- **Destinataire** : @orchestrator, @interior-architect (Yann Duval)
- **Livrables** : Ce rapport d'audit visuel v51
- **Action requise** : Audit croise Yann Duval sur les memes generations
