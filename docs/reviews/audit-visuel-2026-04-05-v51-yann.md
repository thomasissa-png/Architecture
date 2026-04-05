# Audit Visuel v51 — Yann Duval, Architecte d'Interieur
**Date** : 2026-04-05
**Version prompts** : v51 (anti-elargissement, plomberie, comptage radiateurs, anti-fenetre outdoor, CAMERA_PRESERVATION iterations)
**Modele** : gpt-image-1.5 via Responses API
**Nombre de generations** : 6 (A-F)

---

## Synthese globale

*(a completer apres les 6 analyses)*

---

## Generation A — Scandinavian living room (1536x995)

### ALERTE : Passe 2 absente — piece livree VIDE (surfaces uniquement)

L'output ne contient AUCUN mobilier. C'est une passe 1 (finitions surfaces) livree telle quelle. Aucun canape, aucune table, aucun luminaire au sol, aucun tapis. La piece est propre mais inhabitable — inacceptable pour un livrable client.

### ALERTE : Fenetre hallucinee

Une petite fenetre carree a ete AJOUTEE au mur gauche, au-dessus de la mezzanine, la ou l'input ne montrait qu'un mur plein. C'est une hallucination architecturale — le comptage de fenetres n'a pas fonctionne dans cette generation.

### Preservation spatiale (CRITIQUE)

| Element | Input | Output | Verdict |
|---------|-------|--------|---------|
| Angle de vue | Grand-angle depuis le fond gauche | Similaire, legerement recadre | Acceptable |
| Double hauteur + mezzanine | Oui, poutre beton horizontale delimitant la mezzanine | Oui, preservee dans sa forme generale | OK |
| Baies vitrees droite | Grande facade vitree avec impostes hautes + portes pliantes | Preservees, meme configuration | OK |
| Mur gauche sous mezzanine | Mur brut continu | Mur blanc AVEC fenetre carree ajoutee | ECHEC |
| Poteaux beton | Poteau vertical visible entre baies | Preserve mais lisse (texture beton perdue) | Degrade |
| Poutre mezzanine | Beton brut horizontal | Blanchie, lissee — texture perdue | Degrade |
| Plafond | Beton brut avec nervures | Blanchi avec poutres apparentes — geometrie preservee | Acceptable |
| Sol | Chape brute | Parquet clair large lame — transformation attendue | OK |

**Preservation spatiale : 5/10** — La fenetre hallucinee et le lissage des elements structurels degradent significativement la fidelite.

### Fidelite stylistique Scandinave

Difficile a evaluer sans mobilier. Les surfaces sont correctes (murs blancs, parquet clair, luminaires PH5-style suspendus). Les 2 suspensions de type PH sont bien placees et credibles. Mais sans mobilier, le style reste une coquille vide.

**Fidelite stylistique : 4/10** (pas de mobilier = pas de style affirme)

### Grille 10 criteres

| # | Critere | Poids | Note | Commentaire |
|---|---------|-------|------|-------------|
| 1 | Preservation spatiale | x3 | 5/10 | Fenetre hallucinee, poteau/poutre lisses |
| 2 | Fidelite stylistique | x2 | 4/10 | Surfaces OK mais zero mobilier |
| 3 | Eclairage | x1 | 7/10 | Lumiere naturelle preservee, pas de warm shift |
| 4 | Hero pieces | x1 | 3/10 | PH5 suspendus OK mais aucun meuble signature |
| 5 | Coherence matieres | x1 | 7/10 | Parquet + murs blancs + PH5 coherents |
| 6 | Credibilite pro | x2 | 2/10 | Piece vide non livrable a un client |
| 7 | Completude | x1 | 1/10 | Tout manque : canape, fauteuil, tapis, lampadaire, plantes |
| 8 | Vocabulaire visuel | x1 | 5/10 | Finitions surfaces lisibles mais incomplete |
| 9 | Adaptabilite spatiale | x1 | N/A | Pas de mobilier a evaluer |
| 10 | Potentiel photorealiste | x1 | 6/10 | Rendu credible pour une piece vide |

**Note ponderee : 4.2/10** (CAPpee par l'absence de mobilier et la fenetre hallucinee)

### Verdict
ECHEC. Deux problemes distincts : (1) la passe 2 n'a pas ete executee ou a echoue silencieusement, (2) une fenetre a ete hallucinee malgre les directives anti-hallucination v51. La surface est correctement traitee mais ce n'est pas un livrable.

---

## Generation B — Bohemian chambre enfant (1536x1152)

### Preservation spatiale

| Element | Input | Output | Verdict |
|---------|-------|--------|---------|
| Angle de vue | Frontale, legere plongee | Identique | OK |
| Dimensions piece | Grande chambre rectangulaire | Proportions fideles | OK |
| Plafond | Platre brut avec retombee centrale (poutre/coffrage) | Retombee preservee, plafond lisse blanc | OK |
| Murs | Placoplatre brut avec joints visibles, prises bleues, cables | Murs blancs lisses | OK (transformation attendue) |
| Sol | Chape beton brute | Parquet chene clair — transformation attendue | OK |
| Fenetres/portes | Aucune visible dans l'angle | Aucune dans l'output | OK |
| Angle mur gauche/fond | Retrait/decrochement visible dans le mur | Preserve, le decrochement est visible | OK |
| Prises electriques | Multiples prises bleues et cables apparents | Nettoyees — excellent | OK |

**Preservation spatiale : 8/10** — L'espace est fidele. La retombee de plafond est conservee. Leger doute sur la profondeur qui semble un peu comprimee mais l'angle est le meme. Les cables et prises ont ete correctement nettoyes.

### Fidelite stylistique Boheme

Tres bonne interpretation du Boheme enfant. On retrouve :
- Palette terracotta/ocre/naturel — coherente avec l'univers Boheme
- Tapis a motifs soleil/arc-en-ciel dans des tons chauds — parfait pour enfant
- Lit en bois clair avec tete de lit arrondie — appropriee
- Linge de lit a motifs ethniques avec plaid terracotta — bon vocabulaire Boheme
- Suspension rotin tressee — piece iconique du style
- Petite bibliotheque basse en bois naturel avec livres et jouets — fonctionnelle et credible
- Table et tabouret enfant en bois — charmant, a l'echelle
- Paniers tresses au sol — accessoire Boheme classique
- Lampe de chevet en ceramique — subtile et appropriee

Manques : aucune plante (meme une petite succulente), pas de macrame ou element textile mural (acceptable pour enfant — securite). Le style est bien adapte a l'age cible.

**Fidelite stylistique : 8/10**

### Grille 10 criteres

| # | Critere | Poids | Note | Commentaire |
|---|---------|-------|------|-------------|
| 1 | Preservation spatiale | x3 | 8/10 | Espace fidele, retombee plafond conservee, prises nettoyees |
| 2 | Fidelite stylistique | x2 | 8/10 | Boheme enfant tres bien interprete, palette coherente |
| 3 | Eclairage | x1 | 7/10 | Lumiere douce naturelle, leger warm shift mais acceptable pour Boheme |
| 4 | Hero pieces | x1 | 7/10 | Suspension rotin + tapis motifs = ancrage stylistique |
| 5 | Coherence matieres | x1 | 9/10 | Bois clair + rotin + textiles chauds = palette homogene |
| 6 | Credibilite pro | x2 | 8/10 | Livrable credible pour un client — chambre enfant realiste |
| 7 | Completude | x1 | 7/10 | Manque une plante, mur un peu nu mais acceptable enfant |
| 8 | Vocabulaire visuel | x1 | 8/10 | Textures lisibles, couleurs specifiques |
| 9 | Adaptabilite spatiale | x1 | 8/10 | Mobilier a l'echelle, pas de surcharge, densite correcte |
| 10 | Potentiel photorealiste | x1 | 7/10 | Bon mais rendu un peu "catalogue" — eclairage un peu plat |

**Note ponderee : 7.8/10**

### Verdict
BONNE GENERATION. C'est une des meilleures transformations de cette serie. Le style Boheme est bien interprete pour un enfant, l'espace est respecte, le mobilier est a l'echelle. Points d'amelioration : ajouter du grain photographique (rendu trop lisse), une plante decorative, et legere variation dans l'eclairage pour casser l'effet "studio photo".

---

## Generation C — Boheme garden exterieur (1536x882)

### Preservation spatiale

| Element | Input | Output | Verdict |
|---------|-------|--------|---------|
| Angle de vue | Frontale, legere contre-plongee depuis cour interieure | Identique | OK |
| Structure metallique | Charpente acier apparente avec arcs | Preservee, meme forme | OK |
| Baies vitrees | 2 groupes de baies (gauche + droite), porte vitree droite | Preservees, memes positions | OK |
| Mur fond gauche | Fenetre carree paves de verre | Remplacee par une porte — MODIFICATION | Degrade |
| Descente pluviale | Tuyau vertical centre + gouttiere droite | Preserve | OK |
| Sol | Terre/chape brute avec regards au sol | Dallage pierre + gravier — transformation exterieure attendue | OK |
| Verriere haute | Structure metallique ouverte sur ciel | Preservee | OK |
| Proportions cour | Forme en L/U encaissee | Fidele | OK |

**Preservation spatiale : 7/10** — Bonne preservation de la structure complexe (charpente, baies, murs). La fenetre paves de verre transformee en porte est un faux pas mais mineur dans l'ensemble. Pas de fenetre hallucinee sur les murs — c'est un progres pour un exterieur.

### Fidelite stylistique Boheme exterieur

Interpretation tres reussie du Boheme pour une cour interieure urbaine :
- Poufs cuir/toile (terracotta + moutarde) — iconiques du Boheme, dimensions credibles
- Table basse palette — recup/Boheme, coherent avec l'esprit
- Tapis exterieur use/vintage — ancrage textile au sol, tres pertinent
- Vegetation foisonnante : fougeres, plantes tropicales, jardiniere verticale, pots en terre cuite — la densite vegetale est exactement ce qu'on attend du Boheme
- Lanternes au sol — eclairage d'ambiance approprie
- Plaid/throw drape sur le pouf — layering textile typique
- Guirlande lumineuse sur la structure metallique — subtile, coherente

Le sol en dallage pierre irregulier + gravier est un excellent choix pour une cour Boheme — bien plus credible que du beton lisse.

**Fidelite stylistique : 8.5/10**

### Grille 10 criteres

| # | Critere | Poids | Note | Commentaire |
|---|---------|-------|------|-------------|
| 1 | Preservation spatiale | x3 | 7/10 | Structure preservee, fenetre paves modifiee |
| 2 | Fidelite stylistique | x2 | 8.5/10 | Boheme exterieur tres bien interprete |
| 3 | Eclairage | x1 | 8/10 | Lumiere naturelle zenitale preservee, ambiance crepusculaire coherente |
| 4 | Hero pieces | x1 | 8/10 | Poufs cuir + palette + lanternes = vocabulaire Boheme fort |
| 5 | Coherence matieres | x1 | 9/10 | Pierre + cuir + rotin + terre cuite + textile = palette harmonieuse |
| 6 | Credibilite pro | x2 | 8/10 | Projet credible pour un paysagiste, livrable a un client |
| 7 | Completude | x1 | 8/10 | Vegetation, assise, eclairage, sol — tout y est |
| 8 | Vocabulaire visuel | x1 | 8/10 | Textures riches et variees |
| 9 | Adaptabilite spatiale | x1 | 8/10 | Mobilier proportionnel a l'espace, pas de surcharge |
| 10 | Potentiel photorealiste | x1 | 8/10 | Tres credible, eclairage naturel bien gere |

**Note ponderee : 7.9/10**

### Verdict
BONNE GENERATION. La cour Boheme est convaincante. La vegetation est dense sans etre envahissante, le mobilier est a l'echelle de l'espace, et la structure metallique existante est bien preservee. Seul bemol : la modification de la fenetre paves de verre. C'est une des meilleures generations outdoor de la serie.

---

## Generation D — Japandi bathroom (964x1280, portrait)

*(en cours d'analyse)*

---

## Generation E — Bohemian living room (1152x1536, portrait)

*(en cours d'analyse)*

---

## Generation F — Maximalist chambre enfant (962x1280, portrait) + iteration

*(en cours d'analyse)*

---

## Patterns recurrents

*(a completer)*

## Plan d'amelioration P0-P4

*(a completer)*
