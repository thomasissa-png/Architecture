# Audit Cuisine + Salle de Bains — Sprint 20

**Date** : 2026-03-24
**Agents** : Yann Duval (Architecte d'Interieur) + Lucas Moreau (Expert IA Image)
**Input** : Piece brute de chantier (piece en L, placo blanc, beton brut, cables electriques, pas de fenetre)
**Generations auditees** : Cuisine (roomType kitchen) + Salle de bains (roomType bathroom)

---

## 1. Tableau recapitulatif

### Yann Duval — Architecte d'Interieur

| Critere | Poids | Cuisine | SDB |
|---|---|---|---|
| Fidelite stylistique | x2 | 6/10 | 3/10 |
| Vocabulaire visuel | x1 | 7/10 | 4/10 |
| Hero pieces | x1 | 6/10 | 2/10 |
| Coherence matieres | x1 | 7/10 | 5/10 |
| Eclairage | x1 | 5/10 | 5/10 |
| Credibilite professionnelle | x2 | 5/10 | 2/10 |
| Completude | x1 | 7/10 | 3/10 |
| Differenciation | x1 | 6/10 | 3/10 |
| Adaptabilite spatiale | x1 | 6/10 | 4/10 |
| Potentiel photorealiste | x1 | 5/10 | 4/10 |
| **Moyenne ponderee** | | **5.9/10** | **3.2/10** |

### Lucas Moreau — Expert IA Image

| Critere | Poids | Cuisine | SDB |
|---|---|---|---|
| Preservation architecturale | x2 | 4/10 | 4/10 |
| Contraintes lumiere | x1 | 5/10 | 5/10 |
| Vocabulaire photo | x1 | 7/10 | 7/10 |
| Structure prompt | x1 | 6/10 | 5/10 |
| Negative prompting | x1 | 4/10 | 3/10 |
| Compatibilite multi-modeles | x1 | 6/10 | 6/10 |
| Coherence I/O | x1 | 4/10 | 3/10 |
| Richesse descriptive | x1 | 7/10 | 6/10 |
| Adaptabilite conditions variables | x1 | 5/10 | 4/10 |
| Rendu final credible | x2 | 5/10 | 2/10 |
| **Moyenne ponderee** | | **5.1/10** | **4.0/10** |

### Synthese

| Generation | Yann | Lucas | Moyenne |
|---|---|---|---|
| **Cuisine** | 5.9/10 | 5.1/10 | **5.5/10** |
| **Salle de bains** | 3.2/10 | 4.0/10 | **3.6/10** |

---

## 2. Analyse detaillee — CUISINE

### 2.1 Yann Duval — Architecte d'Interieur

**Note globale : 5.9/10**

#### Fidelite stylistique (6/10, x2)
Le style n'a pas ete specifie (la cuisine utilise le `roomFurnitureOverride` de room-types.ts qui est generique). Le rendu montre une cuisine contemporaine propre mais sans identite stylistique marquee. Les meubles beige/taupe avec plan quartz blanc et credence metro sont du vocabulaire "cuisine catalogue" — fonctionnel mais sans signature. Le parquet chevrons foncé (herringbone) est un choix fort qui rappelle l'Art Deco ou le Haussmannien, mais il entre en contradiction avec les caissons basiques beige. Un architecte d'interieur noterait cette dissonance immediatement.

#### Vocabulaire visuel (7/10)
Le vocabulaire est correct : credence carrelage metro, plan quartz, ilot central, tabourets bois/metal. Ces elements sont coherents et reconnaissables. L'etagere murale avec plantes aromatiques ajoute une touche de vie bienvenue. La suspension geometrique doree est un statement piece qui donne du caractere. Bon niveau de detail dans l'execution.

#### Hero pieces (6/10)
L'ilot central avec 3 tabourets est la piece maitresse — c'est un choix attendu et correct pour une cuisine contemporaine. La suspension geometrique doree apporte du caractere. Cependant, le fauteuil ocre + lampadaire noir a droite sont des elements de SALON, pas de cuisine. Aucun architecte ne mettrait un fauteuil d'appoint et un lampadaire sur pied dans une cuisine fonctionnelle. Ce sont des artefacts du furniturePrompt generique qui "remplit l'espace" sans comprendre la fonction de la piece.

#### Coherence matieres (7/10)
Bois + metal + quartz blanc + carrelage metro = palette coherente de cuisine contemporaine. Le beige/taupe des caissons s'accorde avec le quartz blanc. Les tabourets bois/metal font echo a l'etagere. La seule fausse note est le parquet chevrons foncé qui est trop precieux pour une cuisine (entretien, taches d'eau). Un gres imitation bois ou un carrelage aurait ete plus credible.

#### Eclairage (5/10)
L'input est eclaire artificiellement (pas de fenetre). Le rendu montre un eclairage diffus correct mais manque de layers : pas d'eclairage sous les meubles hauts, pas de spots encastres au plafond, pas d'eclairage de plan de travail. La suspension doree est decorative mais insuffisante comme source unique. Surtout, le cable electrique bleu encore visible au plafond casse completement l'illusion.

#### Credibilite professionnelle (5/10, x2)
Plusieurs elements trahissent un rendu non professionnel :
- Le fauteuil ocre + lampadaire dans une cuisine est incoherent fonctionnellement
- Le cable electrique bleu au plafond n'a pas ete supprime
- Les bandes de joint placo au plafond sont encore legèrement visibles
- Le parquet chevrons dans une cuisine est discutable (meme si ca existe en haut de gamme)
- Un architecte d'interieur produirait une cuisine plus integree, avec un vrai plan lumiere

#### Completude (7/10)
Les elements essentiels sont presents : caissons haut/bas, plan de travail, credence, ilot, electromenager (four, plaque), rangement (etagere). Les accessoires sont la (herbes, ustensiles implicites). Il manque une hotte (aspirante ou decorative), un robinet visible, et un eclairage de travail.

#### Differenciation (6/10)
Sans style specifie, la cuisine est "generique contemporaine" — elle pourrait sortir de n'importe quel catalogue Leroy Merlin ou IKEA haut de gamme. La suspension doree et le parquet chevrons tentent de la distinguer, mais le resultat reste un composite sans personnalite forte.

#### Adaptabilite spatiale (6/10)
La disposition en L de la cuisine suit la forme en L de la piece — bonne adaptation. L'ilot central exploite l'espace disponible. Cependant, le fauteuil + lampadaire dans le coin droit suggere que le modele ne sait pas quoi faire de l'espace residuel et le remplit avec du mobilier salon.

#### Potentiel photorealiste (5/10)
Le rendu est globalement propre mais le cable bleu au plafond et les joints placo visibles ruinent la credibilite photographique. Les textures des meubles sont correctes, les ombres acceptables. Le herringbone au sol est bien rendu. Mais un photographe immobilier refuserait cette image en l'etat a cause des artefacts de chantier residuels.

---

### 2.2 Lucas Moreau — Expert IA Image

**Note globale : 5.1/10**

#### Preservation architecturale (4/10, x2)
Probleme majeur : les cables electriques pendants (3 points au plafond dans l'input) n'ont pas ete traites de maniere coherente. Un cable bleu reste visible au plafond a gauche. Les bandes de joint placo au plafond sont encore partiellement visibles. La passe 1 (surfaces) aurait du masquer ces elements de chantier sous la finition (peinture, enduit). Le builder dit "Preserve all wall-mounted fixed equipment" — mais les cables de chantier pendants ne sont PAS des equipements fixes, ce sont des elements temporaires de construction. Le prompt ne fait pas la distinction. La geometrie de la piece en L est globalement preservee, ce qui est positif.

#### Contraintes lumiere (5/10)
L'input est en eclairage artificiel diffus sans fenetre. Le rendu maintient une ambiance similaire sans invention de lumiere naturelle — correct. Cependant, les ombres portees du mobilier sont douces et uniformes, ce qui est coherent avec l'eclairage diffus. Le probleme est que l'eclairage de la cuisine rendue est trop homogene — en realite, la suspension doree devrait creer un cone de lumiere plus chaud et directionnel sur l'ilot, avec un gradient de luminosite. L'absence de layers lumineux (spots, sous-meubles) est un echec du prompt, pas du modele.

#### Vocabulaire photo (7/10)
Les builders incluent les descripteurs DSLR (full-frame, 16-35mm, f/8, deep DOF, sharp focus, ISO 200, grain, vignetting). C'est bien applique dans le rendu : profondeur de champ etendue, nettete globale, pas de bokeh inapproprie. Le cadrage grand-angle est coherent avec l'input.

#### Structure prompt (6/10)
Le `roomFurnitureOverride` de kitchen dans room-types.ts est bien structure : il liste les elements dans un ordre logique (plan de travail, caissons, electromenager, tabourets, pendant, accessoires). Le `roomSurfaceOverride` ajoute correctement "ceramic or natural stone floor tiles" et "subway tile splashback". Cependant, le resultat montre un parquet chevrons au lieu de carrelage — soit le surfacePrompt du style (quel qu'il soit) a ecrase le `roomSurfaceOverride`, soit le modele a ignore la directive. Ce conflit de prompts merite investigation.

#### Negative prompting (4/10)
Le FLUX_NEGATIVE_PROMPT contient "dangling cables, junction box, unfinished floor" — mais cote OpenAI Responses API, il n'y a PAS de negative prompt. Le modele GPT-4.1 n'a aucune directive explicite pour supprimer les cables de chantier. C'est la cause racine du cable bleu visible. Le builder passe 1 dit "Refinish the floor and repaint or replaster the walls" mais ne mentionne pas le plafond ni les cables pendants.

#### Compatibilite multi-modeles (6/10)
Les builders OpenAI et Flux sont bien separes et adaptes a chaque modele. Le Flux place le style en tete (correct pour le token weighting). Le prompt OpenAI est instructif, le Flux est descriptif. La structure est saine.

#### Coherence I/O (4/10)
L'input est une piece brute de chantier. L'output est une cuisine meublee. Le delta est ENORME — murs repeints, sol refait, plafond fini, caissons de cuisine, ilot, electromenager, deco. Pour un pipeline 2 passes, c'est beaucoup de changement. Le cable bleu residuel et les joints placo visibles montrent que la passe 1 n'a pas completement termine la finition des surfaces avant la passe 2. Le fauteuil ocre + lampadaire montrent que la passe 2 n'a pas compris qu'elle operait dans une CUISINE (malgre le roomType).

#### Richesse descriptive (7/10)
Le `roomFurnitureOverride` de kitchen est suffisamment detaille : "countertop work surface 60cm deep", "upper and lower cabinetry", "built-in oven and cooktop", "two or three bar stools at an island or peninsula". Les dimensions et formes sont presentes. Les accessoires (cutting board, ceramic jar, herb pots, fruit bowl) ajoutent du realisme.

#### Adaptabilite conditions variables (5/10)
Le pipeline fonctionne sur une piece sans fenetre (pas d'invention de lumiere naturelle — bien). Cependant, les cables de chantier representent une "condition variable" non geree. Le builder assume une piece deja finie ou presque — les pieces de chantier brut avec cables pendants, boitiers electriques ouverts et placo non enduit sont un cas frequent mais non adresse.

#### Rendu final credible (5/10, x2)
Le rendu est globalement acceptable pour un apercu rapide, mais les defauts le disqualifient pour un listing immobilier pro :
- Cable bleu au plafond = artefact de chantier immediat
- Joints placo visibles = piece pas finie
- Fauteuil + lampadaire dans une cuisine = incoherence fonctionnelle
- Parquet chevrons au lieu du carrelage demande = le prompt n'a pas ete suivi
Un photographe immobilier renverrait cette image pour retouche.

---

## 3. Analyse detaillee — SALLE DE BAINS

### 3.1 Yann Duval — Architecte d'Interieur

**Note globale : 3.2/10**

#### Fidelite stylistique (3/10, x2)
Le rendu n'est PAS une salle de bains. C'est un salon/spa avec un meuble vasque. Le roomFurnitureOverride de bathroom dans room-types.ts decrit : "wall-mounted vanity unit 80cm with integrated basin and framed mirror, towels, small stool, plant, woven basket, spa-like atmosphere". Le rendu montre bien un meuble vasque et un miroir, mais l'atmosphere dominante est celle d'un salon de relaxation : fauteuil bouclette, lampadaire trepied, gueridons. Un architecte d'interieur specialise SDB identifierait immediatement que la fonction premiere de la piece (hygiene, eau) est absente.

#### Vocabulaire visuel (4/10)
Le vocabulaire est hybride et incoherent : des elements SDB (vasque, miroir dore, echelles porte-serviettes) cohabitent avec des elements salon (fauteuil bouclette, lampadaire trepied bois/lin, gueridons decoratifs). Le sol "parquet chene clair + zone carrelee gres" tente un compromis mais est execute maladroitement — la transition parquet/carrelage est un vrai sujet de design qui demande un seuil, pas un collage.

#### Hero pieces (2/10)
La hero piece d'une salle de bains devrait etre la douche (italienne, encastree) ou la baignoire — c'est l'element qui definit la piece. Ici, AUCUNE douche ni baignoire n'est visible. Le meuble vasque est la, mais il n'est pas la piece maitresse d'une SDB. Le fauteuil bouclette est la piece la plus imposante visuellement — ce qui est aberrant pour une salle de bains.

#### Coherence matieres (5/10)
Le bois chene (vasque, echelles, gueridons) est coherent dans un ensemble naturel/spa. Le miroir cadre dore apporte une touche decorative. Mais le melange parquet + carrelage + boucle + lin est trop proche d'un salon. Les matieres d'une vraie SDB incluent : faience, gres cerame, verre trempe, inox, pierre naturelle — aucun de ces materiaux n'est dominant ici.

#### Eclairage (5/10)
Comme pour la cuisine, l'eclairage artificiel diffus est maintenu sans invention de fenetre — correct. La suspension drum tissu creme est appropriee pour une ambiance spa. Mais l'absence de miroir eclairant (appliques laterales ou bandeau LED) est une lacune fonctionnelle evidente — on ne peut pas se maquiller ou se raser sous un seul plafonnier diffus.

#### Credibilite professionnelle (2/10, x2)
C'est le critere le plus faible. Un professionnel de la SDB noterait immediatement :
- Pas de douche ni de baignoire = la piece ne fonctionne pas comme SDB
- Pas de robinetterie visible sur la vasque
- Fauteuil bouclette dans une piece humide = absurdite (la boucle absorbe l'humidite, moisit)
- Lampadaire trepied bois dans une piece humide = risque securitaire (norme NF C 15-100, volumes de protection)
- Pas de VMC, pas de point d'eau au sol
- Le parquet massif dans une SDB est un choix audacieux mais possible en teck/bambou — ici c'est du chene clair standard qui gonfle a l'humidite
- Le cable electrique bleu au plafond = inacceptable dans une piece d'eau

#### Completude (3/10)
Manquent : douche OU baignoire (l'element fondamental), robinetterie, evacuation, miroir eclairant, prise rasoir, ventilation. Presents mais insuffisants : vasque, miroir (decoratif, pas eclairant), serviettes (sur echelles). Les echelles porte-serviettes x2 sont un choix stylistique acceptable mais ne compensent pas les manques fondamentaux.

#### Differenciation (3/10)
Le rendu ressemble a un coin "spa/bien-etre" dans un salon — pas a une salle de bains. On pourrait le confondre avec un dressing ou un salon de beaute. L'absence de douche/baignoire supprime l'identite meme de la piece.

#### Adaptabilite spatiale (4/10)
La piece en L est exploitee de maniere acceptable pour le mobilier present, mais la disposition ne suit pas la logique d'une SDB (zone humide / zone seche). Le fauteuil et le lampadaire occupent une zone qui devrait accueillir une douche ou une baignoire.

#### Potentiel photorealiste (4/10)
Les textures bois et bouclette sont bien rendues. Le miroir dore et les echelles bois sont convaincants individuellement. Mais l'ensemble ne passe pas le test de la "photo de listing immobilier" — un acheteur qui voit cette image comme "salle de bains" sera decu par l'absence de douche. Le cable bleu au plafond et les bandes verticales sur les murs (artefacts) degradent aussi le realisme.

---

### 3.2 Lucas Moreau — Expert IA Image

**Note globale : 4.0/10**

#### Preservation architecturale (4/10, x2)
Comme pour la cuisine, la geometrie de la piece en L est globalement preservee — positif. Les murs suivent les memes lignes. Cependant : cable bleu au plafond non traite (meme probleme que la cuisine), bandes verticales sur les murs qui ressemblent a des artefacts du placo/joint mal efface par la passe 1. L'angle camera est maintenu. Les proportions semblent correctes.

#### Contraintes lumiere (5/10)
L'eclairage artificiel diffus est preserve sans invention de lumiere naturelle — correct pour une piece sans fenetre. Les ombres portees du mobilier sont douces et coherentes. La suspension drum projette une lumiere douce conforme a son type. Meme remarque que la cuisine : l'eclairage est trop homogene, pas de layers.

#### Vocabulaire photo (7/10)
Les descripteurs DSLR sont bien appliques : profondeur de champ etendue, nettete, pas de bokeh. Le cadrage grand-angle est coherent. Le grain et le vignettage sont subtils. Techniquement, la photo est competente.

#### Structure prompt (5/10)
Le `roomFurnitureOverride` de bathroom est bien structure mais trop court et ambigu : "wall-mounted vanity unit 80cm wide with integrated basin and framed mirror above, fluffy folded towels in neutral tones on open shelving or towel ladder, a small stool or side table with soap dispenser and candle, potted humidity-loving plant, woven basket. No freestanding bathtub unless room is large. Clean and spa-like atmosphere."

Le probleme central : "No freestanding bathtub unless room is large" est une NEGATION sur la baignoire, mais il n'y a AUCUNE instruction positive pour ajouter une douche. Le prompt ne dit jamais "add a shower enclosure" ou "glass shower partition". Le modele recoit l'instruction de ne PAS mettre de baignoire et RIEN pour la remplacer — il remplit l'espace avec ce qu'il sait : du mobilier de salon.

#### Negative prompting (3/10)
Le `roomNegativeOverride` de bathroom est : "sofa, coffee table, TV unit, dining table, bed, wardrobe, office desk, floor lamp". Le rendu contient un FAUTEUIL (pas exactement "sofa" mais proche) et un LAMPADAIRE TREPIED (qui est un "floor lamp"). Le negative prompt devrait bloquer ces elements, mais soit le modele l'ignore (OpenAI n'a pas de negative prompt natif), soit la formulation n'est pas assez precise. "floor lamp" est dans le negative mais un lampadaire trepied apparait quand meme — possiblement parce que le modele ne fait pas l'association semantique.

De plus, le cable electrique bleu n'est toujours pas dans le negative prompt. Le FLUX_NEGATIVE_PROMPT contient "dangling cables" mais cela n'affecte que le fallback Flux, pas le primary OpenAI.

#### Compatibilite multi-modeles (6/10)
La structure des builders est correcte pour les deux modeles. Mais le probleme fondamental (absence de douche dans le prompt) affecte les deux modeles de la meme maniere — ce n'est pas un probleme de compatibilite mais de contenu.

#### Coherence I/O (3/10)
L'input est une piece brute de chantier. L'output devrait etre une SALLE DE BAINS finie. Le resultat est un salon/spa avec un meuble vasque. La transformation I/O est incoherente : l'utilisateur a selectionne "Salle de bain" comme type de piece et obtient un rendu qui ne remplit pas cette fonction. Le delta entre l'intention utilisateur et le resultat est maximal.

#### Richesse descriptive (6/10)
Le `roomFurnitureOverride` est detaille pour les elements presents (vasque 80cm, serviettes, stool, plant, basket). Mais il est dramatiquement incomplet pour une salle de bains : pas de description de douche, pas de robinetterie, pas de carrelage mural de zone humide (le `roomSurfaceOverride` mentionne "ceramic wall tiles on the wet zone" mais ne decrit pas de paroi de douche).

#### Adaptabilite conditions variables (4/10)
Le prompt SDB ne gere pas le cas d'une piece brute de chantier avec cables pendants — meme constat que la cuisine. L'absence de fenetre est correctement geree (pas d'invention de lumiere). Mais la taille de la piece (en L = relativement grande) declenche probablement la clause "No freestanding bathtub unless room is large" — le modele pourrait deduire qu'il DEVRAIT mettre une baignoire, mais la formulation negative l'en empeche. Paradoxe du prompt.

#### Rendu final credible (2/10, x2)
Le rendu est inacceptable pour un listing immobilier. Un acheteur potentiel qui voit "Salle de bains" et obtient un salon avec un lavabo serait decu et perdrait confiance dans l'outil. Les problemes :
- Pas de douche ni baignoire = disqualifiant
- Fauteuil bouclette dans une piece d'eau = incoherence
- Lampadaire trepied dans une piece d'eau = risque securitaire
- Cable electrique bleu au plafond
- Bandes murales artefacts
C'est le pire resultat audite sur les 2 generations.
