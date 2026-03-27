# Audit visuel generations #37-42 — Yann Duval, Architecte d'interieur

Date : 2026-03-26

## Tableau recapitulatif

| # | Style | Type | Fidelite (x2) | Vocab. | Hero | Matieres | Eclairage | Credib. (x2) | Complet. | Diff. | Adapt. | Photo. | **Moy. pond.** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 37 | Cosy | Entree 2p | 7 | 7 | 5 | 7 | 8 | 7 | 5 | 6 | 7 | 7 | **6.8** |
| 38 | Cosy | Chambre 2p | 7 | 6 | 5 | 7 | 8 | 7 | 7 | 5 | 8 | 8 | **7.0** |
| 39 | Scandinave | P1 seule | 6 | 6 | 6 | 6 | 7 | 6 | 3 | 5 | 5 | 6 | **5.7** |
| 40 | Contemporain | P1 seule | 6 | 5 | 4 | 6 | 6 | 6 | 3 | 4 | 5 | 6 | **5.4** |
| 41 | Contemporain | Dining 2p (Flux P2) | 5 | 5 | 3 | 5 | 6 | 4 | 4 | 4 | 4 | 5 | **4.6** |
| 42 | Contemporain | Entree 2p (Flux P2) | 4 | 4 | 3 | 4 | 5 | 3 | 4 | 3 | 3 | 4 | **3.7** |

Moyenne globale : **5.5/10**

## Analyses par generation

### #37 Cosy entryway (GPT-4.1, 2 passes)
**Input** : piece brute rectangulaire, sol beton, murs placo blanc, cables electriques pendants au plafond, pas de fenetre visible. **Pass1** : murs cream propres, parquet clair chene, suspension tissu naturel (drum shade). Les cables ont disparu proprement. Geometrie preservee : angle de vue, proportions, coin mur identiques. **Output** : console metal/bois avec miroir rectangulaire, tabouret rond, tapis jute, porte-manteau noir, plante verte (ficus). Mobilier correctement a l'echelle. Radiateur bas preserve (visible a gauche). Le rendu est propre mais **trop minimal pour du Cosy** — il manque la chaleur, les textiles superposes, les bougies, la profondeur de matiere. Ressemble davantage a du Scandinave qu'a du Cosy. La console metal noir est froide, pas "cocooning".

### #38 Cosy bedroom (GPT-4.1, 2 passes)
**Input** : espace atelier/loft avec structure metallique apparente, baies vitrees noires double hauteur, plafond voute, sol brut, colonne decorative. Tres complexe architecturalement. **Pass1** : voute blanche preservee, parquet clair, baies vitrees conservees avec leurs proportions exactes, colonne toujours visible. Bonne preservation de la structure metallique haute. **Output** : lit double gris clair avec tete de lit capitonnee, 2 chevets bois, 2 lampes de chevet, armoire bois, banquette bout de lit, tapis cream. Voute intacte, baies vitrees preservees. Bon equilibre de remplissage pour cette grande piece. Cependant : le style est **hotel business generique**, pas Cosy — aucun plaid, aucune texture superposee, couleurs trop uniformes (gris/beige/bois). Le fauteuil visible dans la baie vitree est un bon detail de profondeur.

### #39 Scandinave passe 1 seule (GPT-4.1)
**Input** : meme piece brute que #37/#40/#41 (sol beton, placo, cables). **Output** : murs blanc pur, parquet tres clair (frene/bouleau blanchi), suspension a etages type PH5 visible a gauche. Les prises electriques murales (points noirs) sont toujours visibles sur le mur droit — **artefact non traite**. Le sol est propre et le luminaire est stylistiquement correct. Mais c'est une piece VIDE — passe 1 seule, pas de mobilier. Difficile d'evaluer la fidelite stylistique au-dela des surfaces. Le luminaire PH5-style est le bon choix pour du Scandinave.

### #40 Contemporain passe 1 seule (GPT-4.1)
**Input** : meme piece brute. **Output** : murs gris clair neutre, sol gris clair (pierre ou beton lisse), 2 spots encastres au plafond. Les prises murales sont encore visibles comme des points noirs. Le rendu est plus sombre et neutre que le Scandinave, ce qui est coherent. Cependant les spots encastres sont **tres basiques** — le Contemporain pourrait avoir un luminaire plus affirme (rail, plafonnier design). La piece parait plus petite qu'en realite a cause du gris uniforme. Passe 1 correcte mais peu distinctive.

### #41 Contemporain dining (GPT-4.1 P1 + Flux P2)
**Input** : meme piece brute. **Pass1** : surfaces propres, murs gris clair, sol carrelage beige/pierre, spot encastre unique. Prise electrique orange visible a gauche (artefact). **Output Flux** : la piece a **radicalement change**. Une fenetre avec volets blancs est apparue sur le mur gauche (HALLUCINATION CRITIQUE — aucune fenetre dans l'input). Un radiateur blanc est apparu au centre-droit (pas dans l'input). Un tableau orange/coucher de soleil est accroche au mur. Un tapis beige au sol. Un rail de spots au plafond remplace le spot unique. Mais AUCUN meuble de salle a manger — pas de table, pas de chaises. Le modele a genere des elements muraux/architecturaux au lieu du mobilier demande. **Flux passe 2 echoue completement sur cette generation.**

### #42 Contemporain entryway (GPT-4.1 P1 + Flux P2)
**Input** : grand espace brut en L, plafond voute beton, baies vitrees noires sur 2 cotes, profondeur importante, sol brut. Architecture remarquable. **Pass1** : murs blancs, sol carrelage gris clair grand format, luminaire cylindrique au plafond, voute lissee en blanc. Baies vitrees preservees. Bonne transformation des surfaces. **Output Flux** : **CATASTROPHE GEOMETRIQUE**. L'angle de vue a change, la voute a disparu, les baies vitrees ont ete remplacees par des portes-fenetres blanches (au lieu de noires), une moquette beige couvre tout le sol, des cadres sont accroches aux murs, un petit canape et une table basse sont apparus au fond. Le style n'est plus "Contemporain" mais "hotel de banlieue anglaise". Tringle a rideaux dores au-dessus des portes. **Flux Depth Pro a regenere la scene au lieu d'editer** — perte totale de la geometrie architecturale.

## Patterns visuels recurrents

### GPT-4.1 (2 passes completes, #37 et #38) : CORRECT
- Geometrie fidele : angles, voutes, baies vitrees preservees entre input, pass1 et output
- Mobilier a l'echelle, correctement ancre au sol avec ombres
- Surfaces de passe 1 intactes en passe 2
- **Faiblesse** : style "hotel business" generique, manque de personnalite stylistique (Cosy trop froid)

### GPT-4.1 passe 1 seule (#39, #40) : CORRECT MAIS INCOMPLET
- Surfaces propres, luminaires coherents avec le style
- Prises electriques non traitees (points noirs residuels sur mur droit)
- Sans mobilier, impossible de juger le style en profondeur

### Flux Depth Pro passe 2 (#41, #42) : ECHEC
- **#41** : hallucination de fenetre, pas de mobilier fonctionnel, elements architecturaux inventes
- **#42** : perte totale de geometrie, changement d'angle, materiaux remplaces, style incoherent
- Flux genere une NOUVELLE scene au lieu d'editer l'existant — meme probleme que SDXL a prompt_strength eleve
- Le fallback Flux est **inutilisable pour la passe 2** dans son etat actuel

## Recommandations prioritaires

1. **P0** : Desactiver Flux Depth Pro pour la passe 2 — il regenere au lieu d'editer, detruisant la geometrie
2. **P0** : Si GPT-4.1 echoue en passe 2, retourner le resultat de passe 1 plutot que de fallback sur Flux
3. **P1** : Enrichir la differenciation stylistique du Cosy — les outputs #37 et #38 sont trop neutres/hotel, il manque les textures superposees, les bougies, les plaids
4. **P1** : Traiter les prises electriques residuelles en passe 1 (les cacher ou les integrer proprement)
5. **P2** : Les generations passe 1 seule (#39, #40) sont des demi-produits — ne pas les livrer au client sans passe 2
