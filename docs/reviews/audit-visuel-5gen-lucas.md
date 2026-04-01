# Audit visuel — Lucas Moreau, Expert IA Image

**Date** : 2026-04-01
**Prompt version auditee** : v36
**Dernier audit** : ce fichier
**Generations cibles** : #91, #92, #93 (cuisines + WC) + #94, #95 (Maximalist salon + chambre enfant)
**Modele primaire** : GPT-4.1 Responses API (gpt-image-1 via image_generation tool)
**Pipeline** : 2 passes (surfaces puis mobilier), GPT-4.1 pour les 2 passes
**Fallback Flux passe 2** : DESACTIVE (Sprint 22)

**Grille appliquee** : preservation spatiale x3 (CAP < 7 = note max 5/10), rendu final x2, tous les autres x1. Denominateur = 14.

---

## Generation #91 — Scandinavian (cuisine)

### Contexte input

Chantier brut : piece rectangulaire ~10-12m2 de cuisine en cours de plaquage. Murs en placoplatre hydrofuge vert (BA13) avec bandes de joint visibles, plafond en platre rose avec 4 spots encastres et cables pendants. Arrivees d'eau cuivre + PER au mur du fond (bas). Fenetres double battant a gauche avec allege et radiateur convecteur blanc sous la fenetre. Porte/ouverture a droite (chambranle visible, mur vert). Sol : chape beton brut noircie. Eclairage : lumiere naturelle laterale franche depuis les fenetres gauche, ombres portees nettes au sol. Angle : grand-angle face au mur du fond, hauteur yeux, legere rotation vers la gauche.

### Analyse output

**Transformation globale** : Cuisine scandinave complete — meubles bas + hauts en bouleau clair, plan de travail blanc avec ilot/bar + 3 tabourets (pieds bleus acier), evier noir integre, four encastre, suspension PH5-style blanche, sol beton clair lisse, murs blancs, pouf bouclette creme a droite, plantes aromatiques en pots.

**Preservation spatiale (critere prioritaire)** :
- Angle de camera : PRESERVE. Meme orientation face au mur du fond avec legere rotation gauche. Lignes de fuite coherentes.
- Fenetres gauche : PRESERVEES. Position, taille, proportions des montants blancs fideles. La vue exterieure (vegetation) est coherente. Bon.
- Porte droite : PRESERVEE. L'ouverture est au meme emplacement, meme hauteur de chambranle.
- Radiateur sous fenetre : DISPARU. Equipement mural fixe supprime — violation de la directive Sprint 18 #147 ("preserve all wall-mounted fixed equipment"). Defaut recurrent.
- Plafond : le decrochement visible dans l'input (bande rose + spots) est APLATI en plafond lisse blanc. La geometrie 3D du plafond est simplifiee. C'est une modification structurelle.
- Profondeur piece : le mur du fond parait legerement plus proche dans l'output. L'ilot cuisine comprime l'espace percu mais la geometrie murale semble respectee.
- Arrivees d'eau : logiquement masquees par le mobilier cuisine — acceptable.

**ALERTE preservation** : Radiateur supprime + plafond aplati = 2 modifications structurelles. Note preservation estimee < 7 potentiel, a evaluer strictement.

**Lumiere** : La direction de lumiere laterale gauche est preservee. Les ombres portees sont coherentes (ombre sous l'ilot, gradient naturel fenetre vers fond). Pas de warm shift excessif — les murs restent blanc neutre/froid. Le light falloff fenetre-fond est respecte (le fond est plus sombre). Bon.

**Vocabulaire photo** : Rendu DSLR credible. Grain tres subtil, profondeur de champ etendue (tout net du premier plan au fond), pas de bokeh inapproprie. Legere vignette naturelle aux coins. Pas de rendu CGI-clean. Bon.

**Negative prompting** : Pas de rideaux hallucines, pas de fenetres supplementaires, pas de wall art. Les prises electriques ne sont pas visibles (nettoyees ou masquees par le mobilier). Bon.

**Rendu final** : Credible comme photo de cuisine Scandinave pour une annonce immobiliere. Les tabourets bleus apportent une touche de couleur coherente avec le style. Le PH5-style est un excellent ancrage stylistique. Le pouf bouclette est un bon accessoire. L'ensemble est equilibre, pas surcharge.

### Grille 10 criteres

| # | Critere | Poids | Note | Commentaire |
|---|---------|-------|------|-------------|
| 1 | Preservation spatiale | x3 | 7/10 | Fenetres + porte preservees, angle fidele. MAIS radiateur supprime + plafond aplati (decrochement efface). 2 modifications structurelles. |
| 2 | Contraintes lumiere | x1 | 8/10 | Direction laterale gauche preservee, light falloff correct, pas de warm shift. Ombres coherentes. |
| 3 | Vocabulaire photo | x1 | 8/10 | Grain subtil, DOF etendu, vignette naturelle. Rendu DSLR credible. |
| 4 | Structure prompt | x1 | 8/10 | Le resultat reflete bien le style Scandinave (bouleau, blanc, PH5). Kitchen furnishing applique. |
| 5 | Negative prompting | x1 | 8/10 | Pas de rideaux, pas de fenetres hallucinee, pas de wall art. Prises nettoyees. |
| 6 | Compatibilite multi-modeles | x1 | 7/10 | Prompt v36 concu pour GPT-4.1. Pas de test Flux sur cette generation. |
| 7 | Coherence I/O | x1 | 8/10 | Format paysage preserve (input et output coherents). Ratio respecte. |
| 8 | Richesse descriptive | x1 | 8/10 | PH5, tabourets, four, plantes — bon niveau de detail sans surcharge. |
| 9 | Adaptabilite conditions | x1 | 8/10 | Chantier brut bien gere (placo vert transforme en murs finis propres, chape en sol lisse). |
| 10 | Rendu final credible | x2 | 8/10 | Photo immobiliere credible. Equilibre mobilier/espace correct. Pas de marqueur IA evident. |

**Note ponderee** : (7x3 + 8 + 8 + 8 + 8 + 7 + 8 + 8 + 8 + 8x2) / 14 = (21 + 8 + 8 + 8 + 8 + 7 + 8 + 8 + 8 + 16) / 14 = 100 / 14 = **7.1/10**

Note preservation = 7 : pas de CAP applique (seuil = strictement < 7).

---

## Generation #92 — Contemporary (cuisine)

### Contexte input

Cuisine vetuste a renover : piece rectangulaire ~8-10m2. Murs peints vert vif (saturation haute). Meuble bas blanc avec evier inox a gauche, meubles hauts blancs ouverts (portes manquantes). Credence en carrelage beige/rose (patchwork). Chauffe-eau vertical cylindrique blanc dans le coin fond-droite, avec tuyaux apparents au sol. Sol : carrelage blanc rectangulaire, tres sale (taches brunes, debris). PAS DE FENETRE visible dans le cadrage. Eclairage : ambiant artificiel diffus (pas de source directionnelle identifiable), tonalite neutre/froide. Angle : grand-angle depuis l'entree, face au mur du fond, hauteur yeux.

### Analyse output

**Transformation globale** : Cuisine contemporaine — meubles en L gris taupe (bas + hauts), plan de travail blanc avec ilot/bar + 2 tabourets gris fonce, plaque induction, four encastre, credence metro blanche, suspension boule fumee en laiton, spot encastre au plafond, sol beton clair. Plante sur l'appui de fenetre droite.

**Preservation spatiale (critere prioritaire)** :
- ALERTE CRITIQUE : FENETRE HALLUCINEE. L'input ne montre AUCUNE fenetre dans le cadrage. L'output a fait apparaitre une fenetre a droite avec un appui de fenetre, une plante, et un convecteur blanc en dessous. C'est une creation architecturale ex nihilo — violation majeure de la preservation.
- Angle de camera : globalement similaire (face au mur du fond), mais le volume semble elargi lateralement a droite pour accommoder la fenetre hallucinee.
- Chauffe-eau : SUPPRIME. Le gros chauffe-eau vertical qui occupait le coin fond-droite a disparu. C'est un equipement fixe qui devrait etre preserve (directive #147).
- Configuration en L : l'input avait des meubles uniquement sur le mur gauche (lineaire). L'output a un L avec retour vers le fond — plausible comme amenagement cuisine mais modifie l'implantation spatiale.
- Murs du fond : le mur vert du fond est devenu un grand mur blanc vide — coherent avec le restyling, position preservee.
- Sol : le carrelage sale est remplace par du beton clair lisse — attendu.
- Plafond : plat, coherent (l'input avait un plafond plat blanc).

**ALERTE PRESERVATION < 7** : La fenetre hallucinee est un defaut eliminatoire. Cela invalide la credibilite spatiale de l'image entiere. Un acheteur qui connait le bien verrait immediatement que cette fenetre n'existe pas. Note preservation : 4/10.

**CAP APPLIQUE** : Preservation spatiale = 4/10 (< 7) => Note finale CAPPED a 5/10 maximum.

**Lumiere** : L'input avait un eclairage artificiel diffus sans direction marquee. L'output introduit une lumiere naturelle laterale droite (depuis la fenetre hallucinee) qui n'existait pas. L'eclairage est donc INVENTE, pas preserve. Cependant, pris isolement, les ombres portees sont coherentes avec la source lumineuse (meme si cette source est fictive).

**Vocabulaire photo** : Rendu DSLR correct — grain subtil, DOF etendu, pas de bokeh. La tonalite est neutre/froide, coherente avec le style Contemporain. Vignette legere.

**Negative prompting** : ECHEC sur la fenetre — c'est l'element architectural hallucine par excellence. Le negative prompt "extra windows" n'a pas fonctionne ici. Possible cause : le modele a "besoin" d'une source lumineuse et a invente une fenetre. Pas de rideaux, pas de wall art (ok sur ces points).

**Rendu final** : Pris isolement (sans comparer a l'input), la photo est credible comme cuisine contemporaine neuve. Mais la comparaison avec l'input detruit la credibilite du pipeline — on ne peut PAS "visuellement convaincant" quand l'espace est modifie.

### Grille 10 criteres

| # | Critere | Poids | Note | Commentaire |
|---|---------|-------|------|-------------|
| 1 | Preservation spatiale | x3 | 4/10 | FENETRE HALLUCINEE a droite. Chauffe-eau supprime. Volume elargi. Defaut eliminatoire. |
| 2 | Contraintes lumiere | x1 | 4/10 | Lumiere naturelle laterale INVENTEE (fenetre fictive). L'input avait un eclairage artificiel diffus. |
| 3 | Vocabulaire photo | x1 | 7/10 | Grain, DOF, tonalite corrects. Rendu DSLR credible en isolation. |
| 4 | Structure prompt | x1 | 6/10 | Style Contemporary applique, mais le prompt n'a pas empeche la fenetre. |
| 5 | Negative prompting | x1 | 3/10 | ECHEC : fenetre hallucinee = le defaut exact que le negative prompt cible. |
| 6 | Compatibilite multi-modeles | x1 | 6/10 | Pas de test Flux. Le probleme est GPT-4.1 specifique. |
| 7 | Coherence I/O | x1 | 7/10 | Format preserve. Ratio coherent. |
| 8 | Richesse descriptive | x1 | 7/10 | Mobilier detaille (ilot, tabourets, suspension fumee). Correct. |
| 9 | Adaptabilite conditions | x1 | 4/10 | Piece sans fenetre MAL GEREE — le modele a invente une fenetre au lieu de travailler avec l'eclairage artificiel existant. |
| 10 | Rendu final credible | x2 | 5/10 | Credible en isolation mais INVALIDE en comparaison input. Fenetre fictive = disqualifiant pour un client. |

**Note brute ponderee** : (4x3 + 4 + 7 + 6 + 3 + 6 + 7 + 7 + 4 + 5x2) / 14 = (12 + 4 + 7 + 6 + 3 + 6 + 7 + 7 + 4 + 10) / 14 = 66 / 14 = 4.7/10

**CAP applique (preservation < 7)** : **Note finale = 4.7/10** (deja sous le cap de 5, pas besoin de capper davantage)

---

## Generation #93 — Custom (WC)

### Contexte input

Salle d'eau/WC tres etroite en couloir (~1.2m de large). Au fond : baignoire encastree avec carrelage gris-vert (partie haute) et carrelage blanc (partie basse), robinetterie chrome apparente, barre porte-serviette metallique au-dessus. Sol : carrelage beige/blanc rectangulaire, tres sale. Murs : enduit blanc ecaille. Convecteur electrique blanc au sol a droite. Objet (panier metallique) au sol. Pas de fenetre. Eclairage : artificiel arriere (flash/plafonnier), tonalite froide. Angle : portrait, legere plongee, vue couloir depuis l'entree.

### Analyse output

**Transformation globale** : WC haut de gamme — WC suspendu blanc avec plaque de commande ronde, lave-mains compact mural a gauche avec robinetterie laiton, miroir rectangulaire cadre laiton, applique murale laiton (abat-jour tissu blanc), porte-rouleau laiton, brosse WC noire. Sol parquet chevron chene. Murs blanc propre. Trappe/niche visible au mur du fond au-dessus du WC. Petit radiateur blanc preserve en bas a droite.

**Preservation spatiale (critere prioritaire)** :
- Etroitesse du couloir : PRESERVEE. La sensation de passage etroit ~1.2m est fidele. Les murs lateraux sont au meme espacement. Bon.
- Angle de camera : PRESERVE. Portrait, plongee legere, meme perspective de couloir en profondeur. Lignes de fuite coherentes.
- PROBLEME MAJEUR : la baignoire encastree du fond a completement DISPARU. Remplacee par un WC suspendu. C'est une modification structurelle du programme — on passe d'une salle de bain avec baignoire a un WC pur. Cependant, le room_type dans les metadata est "wc", ce qui signifie que l'utilisateur a DEMANDE un WC. Le modele a donc applique le brief. C'est un probleme de BRIEF (l'utilisateur a upload une salle de bain mais demande un WC) et non un defaut du modele. Je note avec nuance.
- Convecteur electrique : PRESERVE. Le petit radiateur blanc bas droit est visible dans l'output. Bon point — amelioration par rapport aux generations precedentes.
- Hauteur sous plafond : coherente, meme impression de volume vertical.
- Murs lateraux : position et planimetrie preservees. Le retrecissement progressif du couloir est fidele.

**Note preservation avec nuance** : La geometrie du couloir (largeur, profondeur, hauteur, angle) est excellente. La suppression de la baignoire est problematique mais liee au room_type "wc" demande par l'utilisateur. En pur critere de preservation spatiale (enveloppe), c'est bon. En preservation de contenu (baignoire → WC), c'est une mutation. Je note 6/10 car le changement baignoire→WC modifie le mur du fond et la volumetrie du fond de piece.

**ALERTE PRESERVATION < 7** : Note 6/10 => CAP a 5/10 maximum.

**Lumiere** : L'input avait un eclairage artificiel frontal/arriere froid. L'output a une applique murale laterale droite (laiton) qui cree un eclairage warm directionnel. La temperature de couleur a basculee de froid a warm — c'est un warm shift. Cependant, pour un WC haut de gamme, cet eclairage est stylistiquement coherent. Le probleme est qu'il n'etait pas dans l'input.

**Vocabulaire photo** : Rendu photographique credible. Grain visible, DOF etendu (tout net dans le couloir etroit — physiquement correct en f/8 grand-angle). Vignette naturelle aux coins. Bon.

**Negative prompting** : Pas de fenetre hallucinee (bon sur une piece aveugle). Pas de rideaux. Un miroir mural est present — en mode "custom", les restrictions wall-mounted sont assouplies. Acceptable.

**Rendu final** : Pris comme photo de WC pour annonce, c'est tres credible. Le parquet chevron, les finitions laiton, le WC suspendu avec plaque de commande — tout est coherent et haut de gamme. MAIS l'input montrait une salle de bain avec baignoire, pas un WC. Un acheteur qui connait le bien serait trouble.

### Grille 10 criteres

| # | Critere | Poids | Note | Commentaire |
|---|---------|-------|------|-------------|
| 1 | Preservation spatiale | x3 | 6/10 | Enveloppe spatiale (largeur, profondeur, angle) excellente. MAIS baignoire supprimee = mutation du fond de piece. Room_type "wc" en cause. |
| 2 | Contraintes lumiere | x1 | 5/10 | Warm shift : eclairage froid artificiel → applique laiton warm. Temperature de couleur non preservee. |
| 3 | Vocabulaire photo | x1 | 8/10 | Grain, DOF etendu dans couloir etroit, vignette. Credible DSLR. |
| 4 | Structure prompt | x1 | 7/10 | Le prompt "WC fixtures" a ete applique correctement. Le probleme est en amont (room_type vs photo reelle). |
| 5 | Negative prompting | x1 | 8/10 | Pas de fenetre hallucinee (piece aveugle respectee). Pas de rideaux. |
| 6 | Compatibilite multi-modeles | x1 | 6/10 | Pas de test Flux. Prompt v36 GPT-4.1 only. |
| 7 | Coherence I/O | x1 | 8/10 | Format portrait preserve. Ratio coherent avec le couloir etroit. |
| 8 | Richesse descriptive | x1 | 8/10 | Laiton, chevron, WC suspendu, lave-mains compact — details precis et coherents. |
| 9 | Adaptabilite conditions | x1 | 7/10 | Piece aveugle bien geree (pas de fenetre inventee). Piece exigue bien amenagee. |
| 10 | Rendu final credible | x2 | 7/10 | Photo WC haut de gamme credible en isolation. Probleme de coherence baignoire→WC si comparaison input. |

**Note brute ponderee** : (6x3 + 5 + 8 + 7 + 8 + 6 + 8 + 8 + 7 + 7x2) / 14 = (18 + 5 + 8 + 7 + 8 + 6 + 8 + 8 + 7 + 14) / 14 = 89 / 14 = 6.4/10

**CAP applique (preservation = 6 < 7)** : **Note finale = 5.0/10** (capped)

---

## Generation #94 — Maximalist (salon)

### Contexte input

Chantier brut : piece rectangulaire ~15-18m2, forte hauteur sous plafond (~3m). Plafond blanc avec poutres apparentes en beton/placo (2 poutres principales traversantes, une longitudinale et une transversale, plus une retombee laterale droite). Neon tube fluorescent au plafond (centre, parallele au mur du fond). Murs : enduit brut gris/blanc irregulier, traces de demolition sur le mur du fond (briques apparentes, placo arrache). Fenetre noire (chassis aluminium/PVC) a gauche, rectangulaire, avec vue sur vegetation exterieure. Chauffe-eau/ballon cylindrique blanc vertical dans le coin fond-droite, avec tuyaux. Cables electriques pendants au mur droit (boitier electrique visible). Sol : chape beton/enduit sale, traces de carrelage arrache (residus colle). Escabeau metallique au centre-gauche. 2 personnes debout au fond (ouvriers). Eclairage : lumiere naturelle laterale gauche (fenetre) + neon froid au plafond. Angle : portrait, grand-angle depuis l'entree, face au mur du fond, hauteur yeux, legere plongee.

### Analyse output

**Transformation globale** : Salon maximaliste — mur accent vert canard profond (mur du fond), canape 3 places velours bleu marine avec coussins eclectiques (leopard, rayures orange/noir), table basse ronde orange avec plateau laiton et bougies, tapis persan rouge/bleu superpose sur tapis chevron noir/blanc, lampadaire arc cuivre avec dome cuivre patine, Monstera deliciosa dans pot vert ceramique, 2 cadres poses au sol contre le mur accent, lustre/suspension multicolore en verre souffle style Murano, sol parquet fonce chevron. Murs lateraux beige/cream.

**Preservation spatiale (critere prioritaire)** :
- Poutres plafond : PARTIELLEMENT PRESERVEES. Les 2 poutres traversantes sont visibles dans l'output — la poutre transversale et la retombee laterale droite sont bien presentes. Cependant, leur texture est lissee et blanchie (enduit propre au lieu de beton brut). La GEOMETRIE est la — les SAILLIES sont correctes. C'est un cas intermediaire : la forme 3D est preservee mais la texture est perdue. Acceptable pour un restyling, mais la directive Sprint 18 #148 demande "rough texture, irregular edges, patina intact". Score mitige.
- Fenetre gauche : PRESERVEE. Position, taille, chassis noir — fidele a l'input. Vue sur vegetation. Bon.
- Volume general : la hauteur sous plafond est bien rendue (~3m percu). La profondeur de la piece est correcte. La largeur semble coherente.
- Mur du fond : les briques apparentes et traces de demolition ont logiquement disparu sous la peinture vert canard. Acceptable dans un restyling surfaces.
- Chauffe-eau fond-droite : SUPPRIME. Le ballon d'eau chaude cylindrique a completement disparu. Violation directive #147. Recurrent.
- Cables electriques droite : nettoyes — acceptable (directive passe 1 "cover outlets").
- Personnes/escabeau : supprimes — attendu et correct (ce sont des elements de chantier, pas des fixtures).
- Angle de camera : PRESERVE. Meme perspective portrait, face au mur du fond, meme hauteur. Lignes de fuite coherentes.
- AUCUNE fenetre hallucinee — bon point sur cette piece qui n'a qu'une seule fenetre.

**Bilan preservation** : La geometrie de l'enveloppe est globalement preservee (poutres, fenetre, volume, angle). Le chauffe-eau supprime est un defaut recurrent mais ne modifie pas la structure spatiale perceptible (il etait dans un coin). Les poutres ont la bonne forme 3D mais la texture est lissee. Note : 7/10 — la geometrie est la, le volume est correct, un seul equipement manquant.

**Lumiere** : La lumiere naturelle laterale gauche est PRESERVEE. Le gradient fenetre→fond est visible (le mur du fond vert est plus sombre que le mur gauche eclaire). Pas de warm shift majeur — les murs lateraux beige/cream sont neutres. Le lustre Murano est eteint (pas de halo artificiel ajoute). L'ombre portee du canape est coherente avec la source laterale. Bon travail de preservation lumiere.

**Vocabulaire photo** : Grain photographique subtil visible. DOF etendue — tout est net du premier plan (tapis chevron) au fond (cadres poses). Pas de bokeh. Vignette naturelle legere aux coins superieurs. Le rendu est DSLR credible, pas CGI-clean. Bon.

**Negative prompting** : Pas de fenetre hallucinee. Pas de rideaux. Du wall art est present (2 cadres poses AU SOL contre le mur, pas accroches). C'est malin — le modele a contourne la restriction "no wall-mounted art" en posant les cadres au sol. Acceptable et stylistiquement coherent avec le Maximaliste.

**Rendu final** : Le salon maximaliste est visuellement percutant et credible. Le mur accent vert canard, le canape bleu marine, la table orange, le tapis persan + chevron — les layers de couleur et texture sont bien superposees. Le lustre Murano est un hero piece qui ancre le style. La Monstera est un choix generique (marqueur IA) mais acceptable en Maximaliste. L'ensemble passe pour une photo editoriale de magazine deco.

### Grille 10 criteres

| # | Critere | Poids | Note | Commentaire |
|---|---------|-------|------|-------------|
| 1 | Preservation spatiale | x3 | 7/10 | Poutres geometrie OK (texture lissee), fenetre preservee, volume correct, angle fidele. Chauffe-eau supprime. |
| 2 | Contraintes lumiere | x1 | 8/10 | Laterale gauche preservee, gradient fenetre-fond correct, pas de warm shift majeur. |
| 3 | Vocabulaire photo | x1 | 8/10 | Grain subtil, DOF etendu, vignette. DSLR credible. |
| 4 | Structure prompt | x1 | 8/10 | Style Maximaliste bien traduit — layers, couleurs saturees, eclectisme. |
| 5 | Negative prompting | x1 | 8/10 | Pas de fenetre hallucinee, pas de rideaux. Cadres au sol (pas muraux). |
| 6 | Compatibilite multi-modeles | x1 | 7/10 | Prompt v36 GPT-4.1. Pas de test Flux. |
| 7 | Coherence I/O | x1 | 8/10 | Format portrait preserve. Ratio coherent. |
| 8 | Richesse descriptive | x1 | 8/10 | Lustre Murano, velours, leopard, persan + chevron — details riches et differencies. |
| 9 | Adaptabilite conditions | x1 | 8/10 | Chantier brut bien transforme. Cables nettoyes, ouvriers supprimes. |
| 10 | Rendu final credible | x2 | 8/10 | Photo editoriale credible. Pas de marqueur IA evident (sauf Monstera generique). |

**Note ponderee** : (7x3 + 8 + 8 + 8 + 8 + 7 + 8 + 8 + 8 + 8x2) / 14 = (21 + 8 + 8 + 8 + 8 + 7 + 8 + 8 + 8 + 16) / 14 = 100 / 14 = **7.1/10**

Note preservation = 7 : pas de CAP applique.

---

## Generation #95 — Maximalist (chambre enfant)

### Contexte input

MEME INPUT que #94 — chantier brut : piece rectangulaire ~15-18m2, forte hauteur sous plafond (~3m). Poutres beton/placo traversantes. Neon tube. Fenetre noire a gauche. Chauffe-eau fond-droite. Cables electriques mur droit. Sol chape beton sale. Escabeau + 2 ouvriers.

### Analyse output

**Transformation globale** : Chambre enfant maximaliste — lit enfant en bois naturel avec courtepointe patchwork multicolore (carres rouge/jaune/vert/bleu), armoire haute bois avec panneau central decoratif (motif floral bleu/orange), meuble rangement bas ouvert (casiers rouges, livres, jouets), petit bureau bois + chaise bleue enfant, table de chevet bois avec lampe laiton, lustre multicolore verre souffle (similaire a #94), tapis persan rouge/bleu + tapis rond floral multicolore au premier plan, panier osier avec peluche lapin, girafe jouet sur le meuble. Mur accent vert canard (mur du fond) avec 2 cadres (art abstrait colore). Sol parquet fonce. Poutres apparentes teintees bois sombre.

Le furniturePrompt demandait explicitement une chambre enfant — ce n'est PAS une hallucination du modele.

**Preservation spatiale (critere prioritaire)** :
- Poutres plafond : BIEN PRESERVEES et meme AMELIOREES. Les 2 poutres traversantes sont visibles, avec une teinte bois fonce qui les met en valeur. La retombee laterale droite est presente. La geometrie 3D est fidele. Les poutres sont plus "decoratives" que dans l'input (beton brut → bois sombre) mais la SAILLIE est correcte.
- Fenetre gauche : PRESERVEE. Meme position, meme taille. MAIS : une DEUXIEME FENETRE apparait a gauche du mur du fond (plus petite, avec volet/store). L'input ne montre qu'UNE seule fenetre. C'est une fenetre supplementaire hallucinee — moins grave que #92 (creation ex nihilo sur un mur plein) car elle est dans la meme zone que la fenetre existante, mais c'est quand meme une modification structurelle.
- Volume general : la hauteur sous plafond est bien rendue. La profondeur semble legerement augmentee — le mur du fond parait plus eloigne que dans l'input, ce qui donne une piece plus grande. L'ecart est subtil mais perceptible.
- Mur du fond : vert canard (comme #94). Les briques/demolition disparaissent sous la peinture. Acceptable.
- Chauffe-eau fond-droite : SUPPRIME. Meme defaut que #94. La zone fond-droite est occupee par l'armoire decorative.
- Cables electriques : nettoyes. Acceptable.
- Angle de camera : MODIFIE. L'input etait face au mur du fond avec une legere plongee. L'output montre un angle plus eleve (plongee plus marquee) et legerement pivote vers la gauche. Le changement est subtil mais reel — le premier plan (tapis rond) est vu de plus haut que dans l'input.
- Sol : parquet fonce au lieu de chape beton — attendu.

**ALERTE preservation** : Fenetre supplementaire hallucinee + angle de camera legerement modifie + chauffe-eau supprime. Trois defauts structurels. La fenetre hallucinee est moins grave que #92 (pas sur un mur plein, dans la zone de la fenetre existante) mais reste une modification de l'enveloppe architecturale. Note : 6/10.

**CAP APPLIQUE** : Preservation spatiale = 6/10 (< 7) => Note finale CAPPED a 5/10 maximum.

**Lumiere** : La lumiere naturelle laterale gauche est partiellement preservee — le gradient existe. MAIS la deuxieme fenetre hallucinee ajoute une source lumineuse supplementaire qui n'existait pas. Il y a un warm shift notable : l'input avait une tonalite froide (neon + lumiere grise exterieure), l'output a une ambiance warm (sols bois dore, lumiere chaude). La lampe de chevet laiton ajoute un point chaud. Le warm shift est marque.

**Vocabulaire photo** : Grain photographique visible, DOF etendu (tout net). Le rendu est photographique, pas CGI. Vignette aux coins. Bon. Cependant, la saturation des couleurs est poussee (tapis, patchwork) — ca tire vers le rendu editorial/magazine plutot que photo immobiliere.

**Negative prompting** : ECHEC partiel — fenetre supplementaire hallucinee. Du wall art est present (2 cadres ACCROCHES au mur cette fois, contrairement a #94 ou ils etaient poses au sol). Sur une chambre enfant, la decoration murale est attendue, mais la directive "no wall-mounted art" n'a pas ete respectee. Les cadres sont stylistiquement coherents.

**Rendu final** : La chambre enfant est visuellement riche et charmante. Le patchwork, les jouets, le panier avec la peluche — tout raconte une histoire. Le style Maximaliste enfant est bien interprete (layers de couleur, patterns eclectiques, mobilier en bois naturel). MAIS la fenetre supplementaire et le warm shift empechent de valider la credibilite spatiale. Un acheteur qui connait la piece verrait la fenetre en trop.

### Grille 10 criteres

| # | Critere | Poids | Note | Commentaire |
|---|---------|-------|------|-------------|
| 1 | Preservation spatiale | x3 | 6/10 | Poutres OK, fenetre principale OK. MAIS fenetre supplementaire hallucinee + angle modifie + chauffe-eau supprime. |
| 2 | Contraintes lumiere | x1 | 5/10 | Warm shift marque (froid→chaud). Source lumineuse supplementaire (fenetre fictive). |
| 3 | Vocabulaire photo | x1 | 7/10 | Grain, DOF. Saturation poussee (editorial > immobilier). |
| 4 | Structure prompt | x1 | 8/10 | Chambre enfant Maximaliste bien traduite — patchwork, jouets, bois naturel, couleurs vives. |
| 5 | Negative prompting | x1 | 5/10 | Fenetre hallucinee + wall art accroche (cadres au mur). |
| 6 | Compatibilite multi-modeles | x1 | 7/10 | Prompt v36 GPT-4.1. Pas de test Flux. |
| 7 | Coherence I/O | x1 | 7/10 | Format portrait preserve. Ratio legerement modifie (piece semble plus profonde). |
| 8 | Richesse descriptive | x1 | 8/10 | Patchwork, girafe, peluche lapin, tapis superposes — richesse enfant bien rendue. |
| 9 | Adaptabilite conditions | x1 | 7/10 | Chantier brut transforme. Cables nettoyes. Mais fenetre ajoutee = mauvaise adaptation. |
| 10 | Rendu final credible | x2 | 6/10 | Chambre enfant charmante mais fenetre fictive + warm shift = credibilite spatiale compromise. |

**Note brute ponderee** : (6x3 + 5 + 7 + 8 + 5 + 7 + 7 + 8 + 7 + 6x2) / 14 = (18 + 5 + 7 + 8 + 5 + 7 + 7 + 8 + 7 + 12) / 14 = 84 / 14 = 6.0/10

**CAP applique (preservation = 6 < 7)** : **Note finale = 5.0/10** (capped)

---

## Synthese

| # | Style | Room | Preservation | Note finale | Defaut principal |
|---|-------|------|-------------|-------------|------------------|
| 91 | Scandinavian | Kitchen | 7/10 | **7.1/10** | Radiateur supprime + plafond aplati |
| 92 | Contemporary | Kitchen | 4/10 | **4.7/10** (CAP) | FENETRE HALLUCINEE + chauffe-eau supprime |
| 93 | Custom | WC | 6/10 | **5.0/10** (CAP) | Baignoire→WC (room_type mismatch) + warm shift |
| 94 | Maximalist | Salon | 7/10 | **7.1/10** | Chauffe-eau supprime, poutres texture lissee |
| 95 | Maximalist | Chambre enfant | 6/10 | **5.0/10** (CAP) | Fenetre supplementaire hallucinee + warm shift + angle modifie |

**Moyenne 5 generations** : (7.1 + 4.7 + 5.0 + 7.1 + 5.0) / 5 = **5.8/10**

3 generations sur 5 sont CAPPED (preservation < 7). Le pipeline produit 40% de resultats exploitables (>= 7/10) et 60% de rejets.

### Constats recurrents (mis a jour #91-95)

1. **Hallucination fenetre (P0)** : #92 invente une fenetre complete sur un mur plein. #95 ajoute une deuxieme fenetre la ou il n'y en a qu'une. 2/5 generations affectees (40%). Le probleme persiste malgre Sprint 12 (#81-85). Deux variantes : (a) creation ex nihilo sur mur plein (piece aveugle), (b) duplication/ajout a cote d'une fenetre existante. La variante (b) est nouvelle.
2. **Suppression equipements muraux (P0 rehausse)** : Chauffe-eau supprime dans #91, #92, #94, #95. Radiateur supprime dans #91. 4/5 generations affectees (80%). La directive Sprint 18 #147 est systematiquement ignoree. Ce n'est plus P1 — c'est P0 par sa frequence.
3. **Warm shift (P1)** : #93 (froid→warm laiton), #95 (froid→warm bois dore). 2/5 generations. Le warm shift se produit quand le style implique des materiaux chauds (laiton, bois sombre). La directive "do not add warm tint" n'est pas assez forte face au style prompt.
4. **Room_type vs contenu reel (P1)** : #93 montre qu'un utilisateur peut upload une salle de bain et selectionner "WC". Pas un bug IA mais un manque de validation UX/pipeline.
5. **Plafond : geometrie preservee, texture lissee (P2)** : #91 aplatit un decrochement. #94 lisse les poutres beton en enduit propre. La forme 3D est la mais la patine disparait. La directive #148 ("rough texture, irregular edges") n'est pas respectee.
6. **Angle de camera instable (P2)** : #95 montre une plongee plus marquee et un pivot lateral par rapport a l'input. Subtil mais reel. 1/5 generation.

### Plan d'amelioration (mis a jour)

**P0 — Hallucination fenetre (2 variantes)**
- Variante A (mur plein) : directive conditionnelle "If the input photo has NO windows visible, the output MUST have no windows."
- Variante B (duplication) : directive "The output must have EXACTLY the same number of windows as the input. Do not add extra windows."
- Negative prompt renforce : "hallucinated window, added window, extra window, new window opening, additional window"
- Pre-processing vision : detecter le nombre de fenetres dans l'input et injecter un compteur explicite ("Input has 1 window on the left wall. Output must have exactly 1 window on the left wall.")

**P0 — Suppression equipements muraux (80% des generations)**
- La directive generique #147 est insuffisante. Il faut NOMMER les equipements specifiques dans le builder :
  "Preserve ALL of the following if visible in the input: water heater (cylindrical tank), radiator, convector, thermostat, ventilation grille, electrical panel. These are permanent fixtures — do not remove, hide, or cover them with furniture."
- Ajouter dans le negative prompt : "removed water heater, hidden radiator, missing fixed equipment"
- Envisager un pre-processing vision qui detecte les equipements fixes et les liste explicitement dans le prompt.

**P1 — Warm shift quand style warm**
- Separer EXPLICITEMENT dans le builder : "The STYLE may use warm-toned materials (brass, dark wood, copper). This does NOT mean the overall lighting should shift warm. Keep the input's color temperature. Warm materials reflect existing light — they do not create new warm light."
- Conditionnel : si input a une tonalite froide (neon, lumiere grise), ajouter "Maintain the cool/neutral color temperature throughout."

**P1 — Room_type mismatch**
- Inchange depuis l'audit #91-93.

**P2 — Texture poutres/plafond**
- Renforcer : "If beams are visible, preserve their EXACT surface texture — raw concrete stays raw, aged wood stays aged. Do NOT smooth, paint, or refinish beams unless the surfacePrompt explicitly requests it."

**P2 — Stabilite angle camera**
- Ajouter dans le builder : "Camera position is LOCKED. Same height, same tilt angle, same horizontal rotation as input. Do not raise or lower the camera. Do not rotate."

---

## Comparaison #94 vs #95 (meme input, meme style, room_type different)

Les generations #94 et #95 partagent le MEME input (chantier brut) et le MEME style (Maximalist) mais avec des room_types differents (salon vs chambre enfant). Cela permet une comparaison directe :

| Critere | #94 (salon) | #95 (chambre enfant) |
|---------|-------------|---------------------|
| Preservation | 7/10 | 6/10 |
| Fenetre | Preservee (1 seule) | Hallucinee (2eme ajoutee) |
| Poutres | Geometrie OK, texture lissee | Geometrie OK, teintees bois sombre |
| Chauffe-eau | Supprime | Supprime |
| Warm shift | Minimal | Marque |
| Angle | Fidele | Modifie (plongee accrue) |
| Note finale | 7.1/10 | 5.0/10 (CAP) |

**Analyse** : Le meme input produit un ecart de 2.1 points selon le room_type. La chambre enfant est plus "transformative" (le modele prend plus de libertes pour creer un univers enfant) ce qui degrade la preservation. Le salon maximaliste reste plus fidele a l'enveloppe. Le furniturePrompt chambre enfant incite probablement le modele a modifier davantage l'espace (mobilier enfant = echelle differente, plus de decoration murale attendue).

**Apprentissage** : Les room_types "enfant" (chambre enfant, salle de jeux) sont un facteur de risque pour la preservation spatiale — le modele cherche a creer un "monde" plutot qu'a meubler un espace existant.

---

## Handoff

- **Destinataire** : @interior-architect (Yann Duval) pour audit croise stylistique
- **Fichiers produits** : docs/reviews/audit-visuel-5gen-lucas.md
- **Generations auditees** : #91, #92, #93, #94, #95
- **Prochaine action** : Yann audite les memes generations sur sa grille fidelite/credibilite
- **Alertes pour le pipeline** : P0 hallucination fenetre (40% gen), P0 suppression equipements (80% gen)
