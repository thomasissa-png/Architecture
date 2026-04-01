# Audit visuel — Lucas Moreau, Expert IA Image

**Date** : 2026-04-01
**Prompt version auditee** : v36
**Dernier audit** : #94-95 (audit-visuel-latest-lucas.md)
**Generations cibles** : #91, #92, #93 — Cuisines + WC
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

## Synthese

| # | Style | Room | Preservation | Note finale | Defaut principal |
|---|-------|------|-------------|-------------|------------------|
| 91 | Scandinavian | Kitchen | 7/10 | **7.1/10** | Radiateur supprime + plafond aplati |
| 92 | Contemporary | Kitchen | 4/10 | **4.7/10** (CAP) | FENETRE HALLUCINEE + chauffe-eau supprime |
| 93 | Custom | WC | 6/10 | **5.0/10** (CAP) | Baignoire→WC (room_type mismatch) + warm shift |

**Moyenne** : 5.6/10 — en regression par rapport aux meilleures generations post-Sprint 17 (8.4/10).

### Constats recurrents

1. **Hallucination fenetre (P0)** : #92 invente une fenetre complete sur un mur plein. Le probleme persiste malgre Sprint 12 (#81-85). Cause probable : piece sans fenetre → le modele "a besoin" d'une source lumineuse et invente une ouverture.
2. **Suppression equipements muraux (P1)** : Radiateur #91, chauffe-eau #92. La directive Sprint 18 #147 n'est pas assez forte ou n'est pas injectee dans le builder kitchen.
3. **Room_type vs contenu reel (P1)** : #93 montre qu'un utilisateur peut upload une salle de bain et selectionner "WC" — le modele obeit au room_type et supprime la baignoire. Pas un bug IA, mais un manque de validation cote UX/pipeline.
4. **Plafond aplati (P2)** : #91 efface un decrochement de plafond (placo rose + spots) en le lissant en plafond plat. La directive "preserve ceiling geometry" n'a pas suffi.
5. **Warm shift en piece aveugle (P2)** : #93 passe d'un eclairage froid a un eclairage warm laiton. La directive "do not add warm tint" n'est pas respectee quand le style implique des finitions laiton/dore.

### Plan d'amelioration

**P0 — Hallucination fenetre en piece aveugle**
- Ajouter dans le builder (passe 1 ET passe 2) une directive conditionnelle specifique : "If the input photo has NO windows visible, the output MUST have no windows. Do not add any window, skylight, or glass opening."
- Renforcer le negative prompt : "hallucinated window, added window, new window opening"
- Envisager une detection automatique de fenetre dans l'input (vision pre-processing) pour injecter un flag `has_windows: true/false` dans le prompt.

**P1 — Preservation equipements muraux cuisine**
- Verifier que la directive #147 ("preserve radiators, heaters, vents") est bien injectee dans le builder passe 1 pour room_type "kitchen" (et pas seulement pour "living_room").
- Ajouter specifiquement : "Preserve the water heater (if visible) — do not remove or hide it behind cabinetry."

**P1 — Room_type mismatch (salle de bain → WC)**
- Cote UX : ajouter un warning si l'image uploadee semble contenir une baignoire/douche et que le room_type est "wc" (detection vision).
- Cote pipeline : quand room_type = "wc" et que l'input contient une baignoire visible, la directive devrait etre "convert to WC, remove bathtub" explicitement au lieu de simplement ignorer la baignoire.

**P2 — Plafond decrochement**
- Renforcer la directive plafond : "Preserve ALL ceiling geometry including drop ceilings, stepped ceilings, recessed lighting pockets, exposed plasterboard sections."
- Ajouter "stepped ceiling, drop ceiling" aux termes de preservation explicites.

**P2 — Warm shift en piece aveugle**
- Quand `has_windows: false`, ajouter : "Maintain cool/neutral lighting temperature. Do not introduce warm-toned lighting fixtures or warm wall wash."
- Separer la preservation lumiere de la prescription de luminaire — le style peut demander du laiton sans que la lumiere devienne warm.

---

## Comparaison avec audit #94-95 (Maximalist)

Les generations #94-95 (Maximalist, salon) avaient des notes de 6.5 et 7.2. Les cuisines et WC auditees ici (#91-93) montrent des defauts plus graves, en particulier sur la preservation spatiale. Les cuisines sont un cas d'usage plus difficile pour le pipeline car :
- Elles ont souvent des equipements fixes (chauffe-eau, radiateur, tuyaux) que le modele supprime
- Le room_type "kitchen" demande du mobilier encastre (plans de travail, meubles hauts) qui modifie le rapport aux murs
- Les cuisines sans fenetre sont frequentes et declenchent l'hallucination de fenetre

Les WC/salles de bain sont egalement problematiques car le room_type peut ne pas correspondre au contenu reel de la photo.

---

## Handoff

- **Destinataire** : @interior-architect (Yann Duval) pour audit croise stylistique
- **Fichiers produits** : docs/reviews/audit-visuel-5gen-lucas.md
- **Generations auditees** : #91, #92, #93
- **Prochaine action** : Yann audite les memes generations sur sa grille fidelite/credibilite
